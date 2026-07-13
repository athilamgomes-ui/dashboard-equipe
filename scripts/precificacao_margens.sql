-- Rode UMA VEZ no Supabase Studio (SQL Editor). Guarda a ÚLTIMA margem usada por marca,
-- pra a próxima precificação já vir com ela preenchida (as margens variam por marca).
-- ⚠️ Rode as 2 linhas; se o editor parar no meio, rode o "alter table" separado.
create table if not exists precificacao_margens (
  marca text primary key,
  margem numeric not null,
  atualizado_em timestamptz default now()
);
alter table precificacao_margens disable row level security;
