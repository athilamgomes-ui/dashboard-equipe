-- Rode UMA VEZ no Supabase Studio (SQL Editor) do projeto do ERP (valhewbvjwdkkvuejrxa).
-- Guarda os ajustes da página "Escala 5x2": trocas de folga, renomeações e dias de loja fechada.
create table if not exists escala_ajustes (
  chave text primary key,
  loja text,
  semana date,
  tipo text not null,           -- 'troca' | 'nome' | 'fechado' | 'fechado_rem'
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz default now()
);
alter table escala_ajustes disable row level security;
