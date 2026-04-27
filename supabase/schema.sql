-- ============================================================
-- desafio-metas — schema Supabase
-- Execute no SQL Editor do Supabase: supabase.com/dashboard
-- ============================================================

create extension if not exists pgcrypto;

-- ─── Consultores ───────────────────────────────────────────────
create table if not exists consultores (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  email       text,
  telefone    text,                       -- formato Z-API: 5561...
  token       text unique not null,       -- login link: /c/{token}
  meta_anual  integer,                    -- meta de empresas no ano (consultor define)
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create index if not exists idx_consultores_token on consultores(token);

-- ─── Turmas ────────────────────────────────────────────────────
create table if not exists turmas (
  id           uuid primary key default gen_random_uuid(),
  consultor_id uuid not null references consultores(id) on delete cascade,
  cidade       text not null,
  numero       integer not null,
  meta         integer not null check (meta > 0),
  data_inicio  date not null,
  status       text not null default 'em_andamento'
                check (status in ('em_andamento','iniciada','concluida','cancelada')),
  criado_em    timestamptz not null default now()
);

create index if not exists idx_turmas_consultor on turmas(consultor_id);
create index if not exists idx_turmas_status    on turmas(status);

-- ─── Updates semanais (snapshot do nº de matriculados por semana) ─
create table if not exists updates_semanais (
  id            uuid primary key default gen_random_uuid(),
  turma_id      uuid not null references turmas(id) on delete cascade,
  ano_semana    text not null,                -- ISO week, ex: '2026-W17'
  matriculados  integer not null check (matriculados >= 0),
  observacao    text,
  criado_em     timestamptz not null default now(),
  unique (turma_id, ano_semana)
);

create index if not exists idx_updates_turma  on updates_semanais(turma_id);
create index if not exists idx_updates_semana on updates_semanais(ano_semana);

-- ─── Log de relatórios enviados ────────────────────────────────
create table if not exists relatorios_enviados (
  id          uuid primary key default gen_random_uuid(),
  ano_semana  text not null,
  destino     text not null,                  -- número ou group@g.us
  mensagem    text not null,
  sucesso     boolean not null,
  erro        text,
  enviado_em  timestamptz not null default now()
);

create index if not exists idx_relatorios_semana on relatorios_enviados(ano_semana);

-- ─── RLS: bloqueia tudo. App usa service_role key (bypassa RLS) ─
alter table consultores         enable row level security;
alter table turmas              enable row level security;
alter table updates_semanais    enable row level security;
alter table relatorios_enviados enable row level security;

-- ─── Privilégios pro service_role ──────────────────────────────
-- Necessário porque o projeto foi criado com "Automatically expose
-- new tables and functions" DESMARCADO (boa prática de segurança).
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
