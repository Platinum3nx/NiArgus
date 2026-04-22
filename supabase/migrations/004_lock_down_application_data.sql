-- Remove unused token storage and prevent public API access to application data.

alter table public.installations
  drop column if exists access_token,
  drop column if exists token_expires_at;

alter table public.installations enable row level security;
alter table public.repos enable row level security;
alter table public.reviews enable row level security;

revoke all on table public.installations from anon, authenticated;
revoke all on table public.repos from anon, authenticated;
revoke all on table public.reviews from anon, authenticated;

grant all on table public.installations to service_role;
grant all on table public.repos to service_role;
grant all on table public.reviews to service_role;

revoke execute on function public.reserve_review_slot(uuid, int, uuid, int, int)
  from public, anon, authenticated;
revoke execute on function public.enqueue_review_job(uuid, int, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.claim_next_review_job(uuid, int, int, int)
  from public, anon, authenticated;

grant execute on function public.reserve_review_slot(uuid, int, uuid, int, int)
  to service_role;
grant execute on function public.enqueue_review_job(uuid, int, text, text, text)
  to service_role;
grant execute on function public.claim_next_review_job(uuid, int, int, int)
  to service_role;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

alter default privileges for role postgres in schema public
  grant all on tables to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;
