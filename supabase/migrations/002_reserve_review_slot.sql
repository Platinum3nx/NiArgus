-- Atomic review slot reservation function.
-- Checks hourly and monthly limits within a single transaction,
-- inserts a pending review row only if under both limits.
-- Returns the new review ID on success, or NULL with a reason on rejection.

create or replace function reserve_review_slot(
  p_repo_id uuid,
  p_pr_number int,
  p_installation_id uuid,
  p_monthly_limit int default 50,
  p_hourly_limit int default 10
)
returns table (
  reservation_id uuid,
  allowed boolean,
  reason text,
  monthly_used bigint,
  hourly_used bigint
)
language plpgsql
as $$
declare
  v_monthly bigint;
  v_hourly bigint;
  v_month_start timestamptz;
  v_hour_ago timestamptz;
  v_new_id uuid;
begin
  v_month_start := date_trunc('month', now());
  v_hour_ago := now() - interval '1 hour';

  -- Lock the installation row to serialize concurrent reservations.
  -- This is a short-lived advisory lock scoped to this installation.
  perform pg_advisory_xact_lock(hashtext(p_installation_id::text));

  -- Count existing reviews (including any pending ones) for this installation
  select count(*) into v_monthly
  from reviews r
  join repos rp on rp.id = r.repo_id
  where rp.installation_id = p_installation_id
    and r.created_at >= v_month_start;

  select count(*) into v_hourly
  from reviews r
  join repos rp on rp.id = r.repo_id
  where rp.installation_id = p_installation_id
    and r.created_at >= v_hour_ago;

  -- Check monthly limit
  if v_monthly >= p_monthly_limit then
    return query select
      null::uuid,
      false,
      format('Monthly review limit reached (%s/%s). Resets %s.',
        p_monthly_limit, p_monthly_limit,
        to_char(date_trunc('month', now()) + interval '1 month', 'YYYY-MM-DD')),
      v_monthly,
      v_hourly;
    return;
  end if;

  -- Check hourly limit
  if v_hourly >= p_hourly_limit then
    return query select
      null::uuid,
      false,
      format('Hourly rate limit reached (%s/hr). Please wait before opening more PRs.',
        p_hourly_limit),
      v_monthly,
      v_hourly;
    return;
  end if;

  -- Under both limits — insert the pending review row
  insert into reviews (repo_id, pr_number, review_body)
  values (p_repo_id, p_pr_number, '')
  returning id into v_new_id;

  return query select
    v_new_id,
    true,
    null::text,
    v_monthly + 1,
    v_hourly + 1;
end;
$$;
