#!/bin/bash
# Sábado 21h: fecha a semana → redistribui as metas das semanas restantes pela REGRA do
# Athila (sobra achata o pico / falta preenche o vale; mês fecha no teto) → espelha no app.
# Produz na saída o RESUMO do que mudou (o agente da task usa pra avisar).
# Exit: 0 ok · 10 coleta falhou · 11 redistribuição falhou · 20 git/rebake falhou.
set -uo pipefail
REPO=/Users/elkgomes/Desktop/claude/dashboard-equipe
LOG(){ echo "[redistrib $(date '+%H:%M:%S')] $*"; }
MES=$(date '+%Y-%m')
cd "$REPO" || { LOG "repo não encontrado"; exit 20; }
caffeinate -s -w $$ &   # segura o Mac acordado enquanto o processo rodar

# 1) Coleta o REAL final da semana que fechou (+ baka o estado atual). atualizar_premiacao.sh
#    pega a trava, coleta, commita. Precisa rodar ANTES pra o real da semana estar fresco.
LOG "coletando real final da semana (premiação)..."
bash "$REPO/atualizar_premiacao.sh" || { LOG "coleta/baka falhou — abortando sem redistribuir"; exit 10; }

# 2) Redistribui as metas restantes pela regra (grava DADOS do painel + Supabase + Worker).
LOG "redistribuindo metas de $MES pela regra..."
node "$REPO/scripts/redistribuir_metas.mjs" "$MES" --apply > /tmp/redistrib_out.txt 2>&1
RC=$?
cat /tmp/redistrib_out.txt
if [ $RC -ne 0 ]; then LOG "redistribuição falhou (rc=$RC)"; exit 11; fi

# 3) Commita o DADOS novo (ANTES do rebake — o guard do atualizar_premiacao faz checkout do
#    working tree sujo e apagaria a redistribuição).
if ! git diff --quiet -- dashboard_premiacao.html; then
  git add dashboard_premiacao.html
  git commit -q -m "premiação: redistribuição automática de metas ($MES, sábado 21h)

$(grep -E '→ real|sem semanas' /tmp/redistrib_out.txt | sed 's/^/  /')

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" || { LOG "commit falhou"; exit 20; }
  git push -q origin main || { LOG "push falhou"; exit 20; }
else
  LOG "nenhuma meta mudou (semanas já batiam o teto) — nada a redistribuir."
  echo "RESUMO: sem mudanças nas metas nesta semana."
  exit 0
fi

# 4) Rebaka: o build relê o Supabase (metas novas) e espelha os DOIS HTMLs (inclui loja.html).
LOG "rebakeando (espelha o app)..."
bash "$REPO/atualizar_premiacao.sh" || LOG "AVISO: rebake falhou — metas já estão nos stores (app lê ao vivo); o próximo run espelha o embutido."

LOG "OK — redistribuição de $MES aplicada e publicada."
echo "RESUMO_PRONTO"
