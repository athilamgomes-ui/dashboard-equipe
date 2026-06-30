-- ════════════════════════════════════════════════════════════════════════
-- METAS SEMANAIS DA PREMIAÇÃO — fonte da verdade durável (Supabase)
-- ════════════════════════════════════════════════════════════════════════
-- Problema que resolve: o Athila ajusta a meta de cada semana várias vezes
-- ao longo do mês (redistribuição dinâmica). Antes isso ficava só no
-- localStorage do navegador dele → quando trocava de device ou o agente
-- editava o arquivo, o ajuste sumia (incidente 23/06/2026: meta real da S3
-- foi perdida). Agora cada ajuste é gravado aqui (upsert por mês+loja+semana),
-- compartilhado entre o painel, os apps das vendedoras e o agente.
--
-- RODAR no Supabase → SQL Editor → New query → colar tudo → Run.
-- Projeto: valhewbvjwdkkvuejrxa (o mesmo do planejamento de compras).
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.metas_semanais (
  mes            text not null,           -- 'YYYY-MM', ex '2026-06'
  loja           text not null,           -- 'L1' | 'L3' | 'L4' | 'L5'
  semana         text not null,           -- 'S1' | 'S2' | 'S3' | 'S4'
  meta           integer not null,        -- meta em R$ daquela semana
  atualizado_em  timestamptz not null default now(),
  primary key (mes, loja, semana)
);

-- RLS aberto pra anon (mesmo padrão sem-login do planejamento de compras).
alter table public.metas_semanais enable row level security;

drop policy if exists metas_semanais_anon_all on public.metas_semanais;
create policy metas_semanais_anon_all
  on public.metas_semanais
  for all
  to anon
  using (true)
  with check (true);

-- Seed com a META REAL (vigente) de junho/2026 — confirmada 30/06 contra o
-- Worker /metas-loja. Regra: TODO cálculo usa a Meta Real, nunca a Ideal
-- (ver [[premiacao-meta-real-vs-ideal]]). S1/S2 não tiveram reajuste → Real =
-- Ideal. S3 e S4 foram reajustadas pelo Athila em 23/06 (Real ≠ Ideal):
--   S3 Real: L1=38500(ideal 25000) L3=23000(15000) L4=42000(25000) L5=22100(15000)
--   S4 Real: L1=44100(ideal 35000) L3=34400(20000) L4=53100(35000) L5=25000(20000)
-- Upsert: se rodar de novo, atualiza sem duplicar.
insert into public.metas_semanais (mes, loja, semana, meta) values
  ('2026-06','L1','S1',36000),
  ('2026-06','L1','S2',44000),
  ('2026-06','L1','S3',38500),
  ('2026-06','L1','S4',44100),
  ('2026-06','L3','S1',20000),
  ('2026-06','L3','S2',25000),
  ('2026-06','L3','S3',23000),
  ('2026-06','L3','S4',34400),
  ('2026-06','L4','S1',36000),
  ('2026-06','L4','S2',44000),
  ('2026-06','L4','S3',42000),
  ('2026-06','L4','S4',53100),
  ('2026-06','L5','S1',25000),
  ('2026-06','L5','S2',30000),
  ('2026-06','L5','S3',22100),
  ('2026-06','L5','S4',25000)
on conflict (mes, loja, semana)
  do update set meta = excluded.meta, atualizado_em = now();
