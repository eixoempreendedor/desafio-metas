-- ============================================================
-- desafio-metas — seed dos 7 consultores
-- Tokens são fixos e únicos. Mude se quiser, mas mantenha únicos.
-- ============================================================

insert into consultores (nome, telefone, token) values
  ('Luiz Curti',         '5561981726782', 'curti-a8f3k2x9'),
  ('Fábio Valois',       null,            'valois-b7n9p1m4'),
  ('Sérgio Leão',        null,            'leao-c4m8q5r2'),
  ('Jefferson',          null,            'jefferson-d2p7w6t3'),
  ('Marley',             null,            'marley-e1q9v8s5'),
  ('Renata Brito',       null,            'brito-f9w3z6n8'),
  ('Renata Guimarães',   null,            'guimaraes-g5y2x4k7')
on conflict (token) do nothing;
