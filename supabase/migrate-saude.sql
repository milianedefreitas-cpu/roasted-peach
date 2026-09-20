-- ================================================================
-- Módulo Saúde (GLP) — peso, doses, medicamentos, sintomas
-- Rodar no SQL Editor do Supabase (uma vez)
-- ================================================================

-- ── Medicamentos ──────────────────────────────────────────────────
create table if not exists saude_medicamentos (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete cascade not null,
  nome       text not null,
  dose_mg    numeric(6,2),
  frequencia text not null default 'semanal', -- semanal | diaria
  dia_semana int,                              -- 0=dom .. 6=sab (semanal)
  hora       text not null default '08:00',
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Aplicações ────────────────────────────────────────────────────
create table if not exists saude_doses (
  id           bigint primary key generated always as identity,
  user_id      uuid references auth.users(id) on delete cascade not null,
  medicamento_id bigint references saude_medicamentos(id) on delete cascade not null,
  agendada_em  timestamptz not null,
  aplicada_em  timestamptz,
  dose_mg      numeric(6,2),
  local_aplicacao text,             -- barriga, coxa, braço...
  status       text not null default 'agendada', -- agendada | aplicada | pulada
  observacoes  text,
  created_at   timestamptz not null default now()
);
create index if not exists saude_doses_user_data on saude_doses(user_id, agendada_em);

-- ── Peso e medidas ────────────────────────────────────────────────
create table if not exists saude_pesos (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete cascade not null,
  data       date not null,
  peso_kg    numeric(5,2) not null,
  busto_cm   numeric(5,1),
  cintura_cm numeric(5,1),
  quadril_cm numeric(5,1),
  created_at timestamptz not null default now(),
  unique(user_id, data)
);

-- ── Sintomas ──────────────────────────────────────────────────────
create table if not exists saude_sintomas (
  id         bigint primary key generated always as identity,
  user_id    uuid references auth.users(id) on delete cascade not null,
  data       date not null default current_date,
  intensidade int not null default 1,           -- 1..5
  descricao  text not null,
  created_at timestamptz not null default now()
);

alter table saude_medicamentos enable row level security;
alter table saude_doses        enable row level security;
alter table saude_pesos        enable row level security;
alter table saude_sintomas     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['saude_medicamentos','saude_doses','saude_pesos','saude_sintomas'] loop
    execute format('
      drop policy if exists "%s_own" on %s;
      create policy "%s_own" on %s
      for all using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    ', t, t, t, t);
  end loop;
end;
$$;
