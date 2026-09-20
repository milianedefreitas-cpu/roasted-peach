-- ================================================================
-- Migração de metas — Roasted Peach
-- Rodar no SQL Editor do Supabase (uma vez)
-- Desativa metas antigas e cria as novas. Idempotente.
-- ================================================================

update metas set is_active = false
where type in ('devocional','dieta','exercicio','creatina','whey');

insert into metas (user_id, type, label, icon, color, is_active, "order")
select u.id, m.type, m.label, m.icon, m.color, true, m."order"
from auth.users u
cross join (values
  ('prioridades','3 prioridades','ListChecks','#DAA38F',0),
  ('foco','Bloco de foco','Focus','#9B7D61',1),
  ('movimento','Movimento','Move','#92ADA4',2),
  ('conteudo','Conteúdo','PenLine','#DAA38F',3),
  ('segundo_cerebro','Segundo cérebro','Brain','#9B7D61',4)
) as m(type,label,icon,color,"order")
where not exists (
  select 1 from metas e where e.user_id = u.id and e.type = m.type
);
