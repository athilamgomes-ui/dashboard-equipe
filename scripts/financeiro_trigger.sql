-- Ativa o botão "⚡ Atualizar agora" do Painel Financeiro.
-- RLS permissiva (mesmo modelo de contas_pagar_erp) para o botão (anon) poder marcar o pedido.
create table if not exists financeiro_trigger (
  id int primary key default 1,
  solicitado_em timestamptz,
  atendido_em timestamptz
);
alter table financeiro_trigger enable row level security;
drop policy if exists "financeiro_trigger_anon" on financeiro_trigger;
create policy "financeiro_trigger_anon" on financeiro_trigger
  for all to anon, authenticated using (true) with check (true);
insert into financeiro_trigger (id, solicitado_em, atendido_em)
  values (1, null, now())
  on conflict (id) do nothing;
