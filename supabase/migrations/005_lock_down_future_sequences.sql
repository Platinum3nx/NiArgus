-- Prevent future serial/bigserial-backed tables from inheriting public access.

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  grant all on sequences to service_role;
