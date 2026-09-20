-- ================================================================
-- Tabela google_tokens — OAuth do Google (Calendar + Gmail)
-- Rodar no SQL Editor do Supabase (uma vez)
-- ================================================================

create table if not exists google_oauth_state (
  state      text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table google_oauth_state enable row level security;

drop policy if exists "google_oauth_state_own" on google_oauth_state;
create policy "google_oauth_state_own" on google_oauth_state
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists google_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz not null,
  scope         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table google_tokens enable row level security;

drop policy if exists "google_tokens_own" on google_tokens;
create policy "google_tokens_own" on google_tokens
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
