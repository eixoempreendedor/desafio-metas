-- ============================================================
-- Migration 002 — adiciona status 'iniciada' nas turmas
-- Rode 1x no SQL Editor do Supabase do projeto desafio-metas.
-- ============================================================

alter table turmas drop constraint if exists turmas_status_check;
alter table turmas add constraint turmas_status_check
  check (status in ('em_andamento', 'iniciada', 'concluida', 'cancelada'));
