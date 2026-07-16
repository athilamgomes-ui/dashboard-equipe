-- Rode UMA VEZ no Supabase Studio (SQL Editor). Guarda a ÚLTIMA margem usada por marca,
-- pra a próxima precificação já vir com ela preenchida (as margens variam por marca).
-- ⚠️ Rode as 2 linhas; se o editor parar no meio, rode o "alter table" separado.
-- OBS (16/07/2026): a mesma tabela guarda também a margem INDIVIDUAL por produto — essas linhas
-- usam a chave marca = 'ean:<EAN>' (ex.: 'ean:7897169200395'). O dashboard separa: chave com
-- prefixo 'ean:' = margem do produto; sem prefixo = margem da marca. Não precisou tabela nova.
create table if not exists precificacao_margens (
  marca text primary key,
  margem numeric not null,
  atualizado_em timestamptz default now()
);
alter table precificacao_margens disable row level security;
