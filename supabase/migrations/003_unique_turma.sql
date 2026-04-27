-- ============================================================
-- Migration 003 — limpa duplicatas + impede futuras
-- Rode 1x no SQL Editor do Supabase do projeto desafio-metas.
-- ============================================================

-- Passo 1: deleta duplicatas mantendo a mais antiga (cascade nos updates)
delete from turmas t
where t.id in (
  select id from (
    select id, row_number() over (
      partition by consultor_id, cidade, numero
      order by criado_em
    ) as rn
    from turmas
  ) d
  where rn > 1
);

-- Passo 2: impede duplicatas futuras
alter table turmas
  add constraint turmas_consultor_cidade_numero_key
  unique (consultor_id, cidade, numero);
