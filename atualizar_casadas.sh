#!/bin/bash
# Coleta diária de VENDAS CASADAS (cross-sell) das 4 lojas → casadas.json → commit/push.
# O app (loja.html) lê casadas.json e mostra o ranking da semana por vendedora.
# Roda de manhã (8:45 seg–sáb) para o dia ANTERIOR (dia já fechado).
# casadas.json fica FORA do loja.html de propósito: o build da premiação regravaria.
# Exit: 0 ok · 10 coleta falhou · 20 git falhou · 30 lock ocupado.
set -uo pipefail
LOG(){ echo "[atualizar-casadas $(date '+%H:%M:%S')] $*"; }
REPO=/Users/elkgomes/Desktop/claude/dashboard-equipe
SCRIPTS="$REPO/scripts"

source ~/.claude/lib_lock_erp.sh
travar_erp 15 || { LOG "perfil do Microvix ocupado — abortando (exit 30)"; exit 30; }
trap 'soltar_erp; rmdir "$LOCK" 2>/dev/null' EXIT
caffeinate -s -w $$ &   # segura o Mac acordado enquanto a coleta roda

DIA="${DIA:-$(date -v-1d '+%d/%m/%Y')}"   # padrão: ontem (dia fechado)
LOG "coletando vendas casadas de $DIA (4 lojas)"

cd "$SCRIPTS" || { LOG "scripts não encontrado"; exit 20; }
if ! node coleta_vendas_casadas.mjs "$DIA" "$DIA"; then
  LOG "coleta falhou — casadas.json anterior preservado (exit 10)"; exit 10
fi

cd "$REPO" || { LOG "repo não encontrado"; exit 20; }
if git diff --quiet -- casadas.json; then LOG "sem mudança em casadas.json — nada a publicar"; exit 0; fi
git pull -q --rebase origin main 2>/dev/null || true
git add casadas.json
git commit -q -m "casadas: atualização $DIA (coleta diária)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" || { LOG "commit falhou (exit 20)"; exit 20; }
if git push -q origin main; then LOG "OK — casadas.json publicado ($DIA)"; else LOG "push falhou (exit 20)"; exit 20; fi
