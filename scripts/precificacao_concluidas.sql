-- Rode UMA VEZ no Supabase Studio (SQL Editor) para ativar o botão "✅ Concluída"
create table if not exists precificacao_concluidas (
  chave text primary key,
  concluida_em timestamptz default now()
);
alter table precificacao_concluidas disable row level security;
