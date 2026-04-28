-- ============================================================
-- Migration 004 — adiciona status 'agendada' (turma cadastrada
-- mas ainda não em formação comercial). Default p/ novas turmas.
-- ============================================================

alter table turmas drop constraint if exists turmas_status_check;
alter table turmas add constraint turmas_status_check
  check (status in ('agendada', 'em_andamento', 'iniciada', 'concluida', 'cancelada'));

alter table turmas alter column status set default 'agendada';
