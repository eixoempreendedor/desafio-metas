-- ============================================================
-- Migration 001 — adiciona meta_anual nos consultores
-- Rode 1x no SQL Editor do Supabase do projeto desafio-metas.
-- ============================================================

alter table consultores add column if not exists meta_anual integer;
