-- ════════════════════════════════════════════════════════════════════════
-- PREMIAÇÃO — TODAS AS TABELAS NO SUPABASE (migração do Cloudflare Worker)
-- ════════════════════════════════════════════════════════════════════════
-- Objetivo: um backend só (Supabase, o mesmo do planejamento de compras),
-- pra acabar com a fragilidade de ter dados espalhados entre localStorage +
-- Cloudflare Worker. Cada coisa que o painel e os apps das vendedoras trocam
-- passa a ter uma tabela aqui.
--
-- SEGURO RODAR VÁRIAS VEZES (create if not exists / upsert). Não apaga nada.
--
-- RODAR: Supabase → projeto valhewbvjwdkkvuejrxa → SQL Editor → New query →
--        colar tudo → Run.
-- ════════════════════════════════════════════════════════════════════════

-- Helper: cria policy anon-aberta (mesmo padrão sem-login do planejamento).
-- (Repetido por tabela porque o Postgres não tem "for each table".)

-- ── 1. METAS SEMANAIS (já pode existir do supabase_metas_semanais.sql) ──
create table if not exists public.metas_semanais (
  mes text not null, loja text not null, semana text not null,
  meta integer not null, atualizado_em timestamptz not null default now(),
  primary key (mes, loja, semana)
);

-- ── 2. APROVAÇÕES DAS SUGESTÕES (override do Athila: aprovar/editar/rejeitar) ──
create table if not exists public.sugestoes_overrides (
  id_sugestao text primary key,
  status text not null,                 -- 'aprovada' | 'rejeitada' | 'editada'
  texto_editado text,
  prazo text,
  em timestamptz not null default now()
);

-- ── 3. AVALIAÇÕES DAS SUGESTÕES (funcionou/indiferente/não funcionou) ──
create table if not exists public.sugestoes_avaliacoes (
  id_sugestao text primary key,
  resultado text not null,              -- 'funcionou' | 'indiferente' | 'nao_funcionou'
  comentario text,
  em timestamptz not null default now()
);

-- ── 4. FEEDBACK DAS VENDEDORAS sobre cada sugestão ──
create table if not exists public.feedbacks (
  id_sugestao text not null, loja text not null, vendedora text not null,
  acao text not null,                   -- 'apliquei' | 'tentei' | 'nao_consegui'
  comentario text,
  em timestamptz not null default now(),
  primary key (id_sugestao, loja, vendedora)
);

-- ── 5. RETORNO DO DONO pro feedback da vendedora ──
create table if not exists public.feedback_retornos (
  id_sugestao text not null, loja text not null, vendedora text not null,
  status text not null,                 -- 'excelente' | 'reconhecida' | 'precisa_melhorar'
  texto text,
  em timestamptz not null default now(),
  primary key (id_sugestao, loja, vendedora)
);

-- ── 6. QUIZ respondido pela vendedora (semana inclui o mês: '2026-06-S2') ──
create table if not exists public.quizzes (
  loja text not null, vendedora text not null, semana text not null,
  acertos integer not null default 0,
  em timestamptz not null default now(),
  primary key (loja, vendedora, semana)
);

-- ── 7. MENSAGEM DA GERENTE pra equipe (1 ativa por loja) ──
create table if not exists public.mensagens_gerente (
  loja text primary key,
  por text not null,
  texto text not null default '',
  em timestamptz not null default now()
);

-- ── 8. AVATAR da vendedora ──
create table if not exists public.avatares (
  loja text not null, vendedora text not null,
  config jsonb not null,
  em timestamptz not null default now(),
  primary key (loja, vendedora)
);

-- ── 9. FOTO de perfil da vendedora (base64) ──
create table if not exists public.fotos (
  loja text not null, vendedora text not null,
  foto text not null,
  em timestamptz not null default now(),
  primary key (loja, vendedora)
);

-- ════════════════════════════════════════════════════════════════════════
-- RLS aberto pra anon em TODAS (mesmo padrão sem-login do planejamento)
-- Comandos explícitos (sem bloco DO/$$ — evita bug do editor do Supabase).
-- ════════════════════════════════════════════════════════════════════════
alter table public.metas_semanais       enable row level security;
alter table public.sugestoes_overrides  enable row level security;
alter table public.sugestoes_avaliacoes enable row level security;
alter table public.feedbacks            enable row level security;
alter table public.feedback_retornos    enable row level security;
alter table public.quizzes              enable row level security;
alter table public.mensagens_gerente    enable row level security;
alter table public.avatares             enable row level security;
alter table public.fotos                enable row level security;

drop policy if exists metas_semanais_anon_all       on public.metas_semanais;
drop policy if exists sugestoes_overrides_anon_all   on public.sugestoes_overrides;
drop policy if exists sugestoes_avaliacoes_anon_all  on public.sugestoes_avaliacoes;
drop policy if exists feedbacks_anon_all             on public.feedbacks;
drop policy if exists feedback_retornos_anon_all     on public.feedback_retornos;
drop policy if exists quizzes_anon_all               on public.quizzes;
drop policy if exists mensagens_gerente_anon_all     on public.mensagens_gerente;
drop policy if exists avatares_anon_all              on public.avatares;
drop policy if exists fotos_anon_all                 on public.fotos;

create policy metas_semanais_anon_all       on public.metas_semanais       for all to anon using (true) with check (true);
create policy sugestoes_overrides_anon_all   on public.sugestoes_overrides   for all to anon using (true) with check (true);
create policy sugestoes_avaliacoes_anon_all  on public.sugestoes_avaliacoes  for all to anon using (true) with check (true);
create policy feedbacks_anon_all             on public.feedbacks             for all to anon using (true) with check (true);
create policy feedback_retornos_anon_all     on public.feedback_retornos     for all to anon using (true) with check (true);
create policy quizzes_anon_all               on public.quizzes               for all to anon using (true) with check (true);
create policy mensagens_gerente_anon_all     on public.mensagens_gerente     for all to anon using (true) with check (true);
create policy avatares_anon_all              on public.avatares              for all to anon using (true) with check (true);
create policy fotos_anon_all                 on public.fotos                 for all to anon using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════════
-- SEED das metas atuais de junho/2026 (S3/S4 já ajustadas)
-- ════════════════════════════════════════════════════════════════════════
insert into public.metas_semanais (mes, loja, semana, meta) values
  ('2026-06','L1','S1',36000),('2026-06','L1','S2',44000),('2026-06','L1','S3',38500),('2026-06','L1','S4',44100),
  ('2026-06','L3','S1',20000),('2026-06','L3','S2',25000),('2026-06','L3','S3',23000),('2026-06','L3','S4',34400),
  ('2026-06','L4','S1',36000),('2026-06','L4','S2',44000),('2026-06','L4','S3',42000),('2026-06','L4','S4',53100),
  ('2026-06','L5','S1',25000),('2026-06','L5','S2',30000),('2026-06','L5','S3',22100),('2026-06','L5','S4',25000)
on conflict (mes, loja, semana) do update set meta = excluded.meta, atualizado_em = now();
