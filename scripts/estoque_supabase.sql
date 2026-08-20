-- Tabelas do painel de ESTOQUE (rodar 1x no SQL Editor do Supabase).
-- Projeto: valhewbvjwdkkvuejrxa (o mesmo da precificação e da premiação).

-- ── contagem conferida na tela ─────────────────────────────────────────────
-- A pessoa digita a quantidade REAL contada; o valor sobrevive ao recarregamento
-- e vira lote de ajuste. Um registro pendente por (loja, produto).
create table if not exists estoque_contagem (
  id             bigserial primary key,
  loja           text not null,
  cod            text not null,
  descricao      text,
  origem         text not null default 'negativos',   -- negativos | reconciliacao | lixas | outro
  saldo_sistema  numeric,                             -- o que o painel mostrava quando foi digitado
  qtd_real       numeric not null,                    -- o que a pessoa contou
  urgente        boolean not null default false,      -- true = aplica pelo botão ⚡; false = lote semanal
  status         text not null default 'conferido',   -- conferido | na_fila | aplicado | erro
  conferido_por  text,
  conferido_em   timestamptz not null default now(),
  enfileirado_em timestamptz,
  aplicado_em    timestamptz,
  saldo_anterior numeric,
  saldo_confirmado numeric,
  erro           text
);
-- só UM registro pendente por produto (conferido ou na fila); o histórico de aplicados fica.
create unique index if not exists estoque_contagem_pendente
  on estoque_contagem (loja, cod) where status in ('conferido','na_fila');
create index if not exists estoque_contagem_fila on estoque_contagem (status, loja);

-- ── gatilho do botão "⚡ Aplicar agora" ────────────────────────────────────
create table if not exists estoque_trigger (
  id            int primary key default 1,
  solicitado_em timestamptz,
  atendido_em   timestamptz,
  solicitado_por text,
  check (id = 1)
);
insert into estoque_trigger (id) values (1) on conflict (id) do nothing;

-- O painel é estático (GitHub Pages) e usa a chave anon: liberar leitura/escrita nessas duas.
alter table estoque_contagem enable row level security;
alter table estoque_trigger  enable row level security;
drop policy if exists estoque_contagem_all on estoque_contagem;
drop policy if exists estoque_trigger_all  on estoque_trigger;
create policy estoque_contagem_all on estoque_contagem for all using (true) with check (true);
create policy estoque_trigger_all  on estoque_trigger  for all using (true) with check (true);

-- ── validade: o que a loja controla hoje em planilha ───────────────────────
-- Enquanto o controle de lote do ERP não estiver em uso (e mesmo depois, para o estoque que
-- já está na prateleira), a planilha da loja é a fonte real de validade.
create table if not exists estoque_vencidos (
  id           bigserial primary key,
  loja         text not null,
  cod          text,
  descricao    text not null,
  marca        text,
  quantidade   numeric,
  validade     date,                                -- null = a planilha não trouxe data
  fornecedor   text,
  origem       text not null default 'planilha',    -- planilha | erp
  lote         text,
  importado_em timestamptz not null default now(),
  importado_por text,
  arquivo      text,
  baixado_em   timestamptz,                         -- preenchido quando sai a nota de baixa
  observacao   text
);
create index if not exists estoque_vencidos_loja on estoque_vencidos (loja, validade);
alter table estoque_vencidos enable row level security;
drop policy if exists estoque_vencidos_all on estoque_vencidos;
create policy estoque_vencidos_all on estoque_vencidos for all using (true) with check (true);
