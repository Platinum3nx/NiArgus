-- Installations: tracks which GitHub accounts have installed NiArgus
create table installations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  github_installation_id bigint unique not null,
  github_account_login text not null,
  github_account_type text not null, -- 'User' or 'Organization'
  access_token text,
  token_expires_at timestamptz
);

-- Repos: tracks which repos are enabled and their Nia source ID
create table repos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  installation_id uuid references installations(id),
  github_repo_id bigint unique not null,
  full_name text not null, -- e.g. "Platinum3nx/NiaBench"
  nia_source_id text,      -- Nia source ID once indexed
  is_enabled boolean default true,
  last_indexed_at timestamptz
);

-- Reviews: stores every PR review NiArgus has posted
create table reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  repo_id uuid references repos(id),
  pr_number int not null,
  pr_title text,
  pr_author text,
  review_body text not null,
  files_changed int,
  context_files_used int,
  github_comment_id bigint,
  model_used text default 'claude-sonnet-4-5'
);

create index on reviews (repo_id, created_at desc);
create index on installations (github_installation_id);
create index on repos (github_repo_id);
