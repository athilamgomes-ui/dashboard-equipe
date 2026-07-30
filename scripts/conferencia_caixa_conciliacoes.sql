-- Histórico das conciliações da maquininha/extrato feitas na aba "Conciliação" do
-- painel Conferência de Caixa.
--
-- ⚠️ O conteúdo vai CIFRADO (AES-256-GCM + PBKDF2, mesma senha do painel), cifrado no
-- navegador ANTES de subir. Nem o Supabase nem quem tiver a chave anon consegue ler:
-- só quem tem a senha do painel. Por isso a RLS permissiva não expõe dado de cliente.
-- Em claro ficam apenas loja, período, data e nome dos arquivos — o suficiente para
-- listar o histórico sem precisar decifrar.

create table if not exists conferencia_caixa_conciliacoes (
  id          bigint generated always as identity primary key,
  loja        text        not null,
  periodo_ini date        not null,
  periodo_fim date        not null,
  arquivos    jsonb       not null default '[]'::jsonb,  -- [{nome,tipo}] só para listar
  criado_em   timestamptz not null default now(),
  -- envelope de cifragem
  salt        text        not null,
  iv          text        not null,
  iters       int         not null,
  payload     text        not null   -- JSON cifrado: resultado + arquivos originais
);

-- Uma conciliação por loja e período: recarregar o mesmo período substitui, não duplica.
create unique index if not exists conferencia_caixa_conc_unica
  on conferencia_caixa_conciliacoes (loja, periodo_ini, periodo_fim);

create index if not exists conferencia_caixa_conc_ordem
  on conferencia_caixa_conciliacoes (criado_em desc);

alter table conferencia_caixa_conciliacoes enable row level security;

-- Mesmo modelo dos outros painéis (financeiro_trigger, contas_pagar_erp): o painel usa a
-- chave anon. A proteção real do conteúdo é a cifragem, não a RLS.
drop policy if exists "conferencia_caixa_conc_anon" on conferencia_caixa_conciliacoes;
create policy "conferencia_caixa_conc_anon" on conferencia_caixa_conciliacoes
  for all to anon, authenticated using (true) with check (true);
