-- Rode UMA VEZ no Supabase Studio (SQL Editor) para ativar o botão
-- "⚡ Atualizar NFes agora" da tela de precificação.
create table if not exists precificacao_trigger (
  id int primary key default 1,
  solicitado_em timestamptz,
  atendido_em timestamptz
);
insert into precificacao_trigger (id, solicitado_em, atendido_em)
  values (1, null, now())
  on conflict (id) do nothing;
alter table precificacao_trigger disable row level security;
