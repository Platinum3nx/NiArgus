alter table reviews
  alter column review_body set default '';

alter table reviews
  add column if not exists head_sha text,
  add column if not exists status text not null default 'completed',
  add column if not exists queued_at timestamptz not null default now(),
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists superseded_at timestamptz,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists last_error text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update reviews
set
  queued_at = created_at,
  completed_at = coalesce(completed_at, created_at),
  updated_at = coalesce(updated_at, created_at)
where status = 'completed';

create unique index if not exists reviews_repo_pr_head_sha_key
  on reviews (repo_id, pr_number, head_sha)
  where head_sha is not null;

create index if not exists reviews_queue_lookup_idx
  on reviews (status, next_attempt_at, lease_expires_at, queued_at);

create index if not exists reviews_installation_status_idx
  on reviews (repo_id, pr_number, status, created_at desc);

create or replace function enqueue_review_job(
  p_repo_id uuid,
  p_pr_number int,
  p_head_sha text,
  p_pr_title text default null,
  p_pr_author text default null
)
returns table (
  review_id uuid,
  status text,
  was_inserted boolean,
  superseded_count integer
)
language plpgsql
as $$
declare
  v_superseded_count integer := 0;
begin
  if p_head_sha is null or btrim(p_head_sha) = '' then
    raise exception 'p_head_sha is required';
  end if;

  perform pg_advisory_xact_lock(hashtext(format('%s:%s', p_repo_id::text, p_pr_number::text)));

  update reviews
  set
    status = 'superseded',
    superseded_at = now(),
    lease_expires_at = null,
    next_attempt_at = null,
    updated_at = now()
  where repo_id = p_repo_id
    and pr_number = p_pr_number
    and head_sha is distinct from p_head_sha
    and status in ('queued', 'processing', 'failed');

  get diagnostics v_superseded_count = row_count;

  return query
  with upserted as (
    insert into reviews (
      repo_id,
      pr_number,
      head_sha,
      pr_title,
      pr_author,
      review_body,
      status,
      queued_at,
      next_attempt_at,
      updated_at
    )
    values (
      p_repo_id,
      p_pr_number,
      p_head_sha,
      p_pr_title,
      p_pr_author,
      '',
      'queued',
      now(),
      now(),
      now()
    )
    on conflict (repo_id, pr_number, head_sha) where head_sha is not null
    do update
      set pr_title = coalesce(excluded.pr_title, reviews.pr_title),
          pr_author = coalesce(excluded.pr_author, reviews.pr_author),
          status = case
            when reviews.status in ('failed', 'superseded') then 'queued'
            else reviews.status
          end,
          queued_at = case
            when reviews.status in ('failed', 'superseded') then now()
            else reviews.queued_at
          end,
          next_attempt_at = case
            when reviews.status in ('failed', 'superseded') then now()
            else reviews.next_attempt_at
          end,
          failed_at = case
            when reviews.status = 'failed' then null
            else reviews.failed_at
          end,
          superseded_at = case
            when reviews.status = 'superseded' then null
            else reviews.superseded_at
          end,
          last_error = case
            when reviews.status in ('failed', 'superseded') then null
            else reviews.last_error
          end,
          lease_expires_at = case
            when reviews.status in ('failed', 'superseded') then null
            else reviews.lease_expires_at
          end,
          updated_at = now()
    returning id, status, xmax = 0 as was_inserted
  )
  select
    upserted.id,
    upserted.status,
    upserted.was_inserted,
    v_superseded_count
  from upserted;
end;
$$;

create or replace function claim_next_review_job(
  p_installation_id uuid,
  p_monthly_limit int default 50,
  p_hourly_limit int default 10,
  p_lease_seconds int default 900
)
returns table (
  review_id uuid,
  installation_id uuid,
  repo_id uuid,
  github_repo_id bigint,
  repo_full_name text,
  nia_source_id text,
  github_installation_id bigint,
  pr_number int,
  head_sha text,
  github_comment_id bigint,
  attempt_count integer,
  monthly_used bigint,
  hourly_used bigint,
  reason text
)
language plpgsql
as $$
declare
  v_monthly bigint := 0;
  v_hourly bigint := 0;
  v_month_start timestamptz := date_trunc('month', now());
  v_hour_ago timestamptz := now() - interval '1 hour';
  v_due_job_exists boolean := false;
begin
  perform pg_advisory_xact_lock(hashtext(p_installation_id::text));

  update reviews r
  set
    status = 'queued',
    lease_expires_at = null,
    next_attempt_at = now(),
    last_error = coalesce(r.last_error, 'Previous attempt stopped before completion.'),
    updated_at = now()
  from repos rp
  where rp.id = r.repo_id
    and rp.installation_id = p_installation_id
    and r.status = 'processing'
    and r.lease_expires_at is not null
    and r.lease_expires_at <= now();

  select exists(
    select 1
    from reviews r
    join repos rp on rp.id = r.repo_id
    where rp.installation_id = p_installation_id
      and rp.is_enabled = true
      and r.status = 'queued'
      and coalesce(r.next_attempt_at, r.queued_at, r.created_at) <= now()
  ) into v_due_job_exists;

  if not v_due_job_exists then
    return;
  end if;

  select count(*) into v_monthly
  from reviews r
  join repos rp on rp.id = r.repo_id
  where rp.installation_id = p_installation_id
    and (
      r.status = 'completed'
      or (r.status = 'processing' and r.lease_expires_at > now())
    )
    and coalesce(r.completed_at, r.started_at, r.created_at) >= v_month_start;

  select count(*) into v_hourly
  from reviews r
  join repos rp on rp.id = r.repo_id
  where rp.installation_id = p_installation_id
    and (
      r.status = 'completed'
      or (r.status = 'processing' and r.lease_expires_at > now())
    )
    and coalesce(r.completed_at, r.started_at, r.created_at) >= v_hour_ago;

  if v_monthly >= p_monthly_limit then
    return query
    select
      null::uuid,
      p_installation_id,
      null::uuid,
      null::bigint,
      null::text,
      null::text,
      null::bigint,
      null::int,
      null::text,
      null::bigint,
      null::integer,
      v_monthly,
      v_hourly,
      format(
        'Monthly review limit reached (%s/%s). Resets %s.',
        p_monthly_limit,
        p_monthly_limit,
        to_char(date_trunc('month', now()) + interval '1 month', 'YYYY-MM-DD')
      );
    return;
  end if;

  if v_hourly >= p_hourly_limit then
    return query
    select
      null::uuid,
      p_installation_id,
      null::uuid,
      null::bigint,
      null::text,
      null::text,
      null::bigint,
      null::int,
      null::text,
      null::bigint,
      null::integer,
      v_monthly,
      v_hourly,
      format(
        'Hourly review limit reached (%s/hr). Queued for retry.',
        p_hourly_limit
      );
    return;
  end if;

  return query
  with candidate as (
    select r.id
    from reviews r
    join repos rp on rp.id = r.repo_id
    where rp.installation_id = p_installation_id
      and rp.is_enabled = true
      and r.status = 'queued'
      and coalesce(r.next_attempt_at, r.queued_at, r.created_at) <= now()
    order by
      coalesce(r.next_attempt_at, r.queued_at, r.created_at),
      r.queued_at,
      r.created_at
    limit 1
    for update of r skip locked
  ),
  claimed as (
    update reviews r
    set
      status = 'processing',
      started_at = now(),
      last_attempt_at = now(),
      attempt_count = r.attempt_count + 1,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      next_attempt_at = null,
      failed_at = null,
      updated_at = now()
    from candidate c
    where r.id = c.id
    returning r.*
  )
  select
    c.id,
    inst.id,
    c.repo_id,
    rp.github_repo_id,
    rp.full_name,
    rp.nia_source_id,
    inst.github_installation_id,
    c.pr_number,
    c.head_sha,
    c.github_comment_id,
    c.attempt_count,
    v_monthly + 1,
    v_hourly + 1,
    null::text
  from claimed c
  join repos rp on rp.id = c.repo_id
  join installations inst on inst.id = rp.installation_id;
end;
$$;
