#!/usr/bin/env bash
# atualizar_amgomes.sh — pipeline DETERMINÍSTICO do dashboard de vendas A.M. Gomes.
# Coleta (Playwright) → YoY (light/full) → build (render) → sanity → commit/push.
# SEM LLM. Idempotente. Lock impede execuções concorrentes (corrida de escrita).
#
# Exit codes: 0=ok · 10=coleta falhou (preserva versão anterior) · 20=build falhou · 30=lock
set -uo pipefail

REPO="/Users/elkgomes/Desktop/claude/dashboard-equipe"
SCRIPTS="$REPO/scripts"
HTML="$REPO/dashboard_amgomes.html"
LOCK="/tmp/amgomes_update.lock"
log(){ echo "[atualizar-amgomes $(date +%H:%M:%S)] $*"; }

# ── Lock atômico (evita 2 execuções simultâneas no mesmo arquivo) ──
if ! mkdir "$LOCK" 2>/dev/null; then
  log "ERRO: outra execução em andamento ($LOCK existe). Abortando."
  exit 30
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

cd "$SCRIPTS" || { log "scripts dir não encontrado"; exit 20; }

# ── Datas ──
HOJE=$(date +%d/%m/%Y); MM=$(date +%m); AAAA=$(date +%Y); DD=$(date +%d)
MES=$((10#$MM)); DIA=$((10#$DD)); ANO_ANT=$((AAAA-1)); DOW=$(date +%u)
DI="01/$MM/$AAAA"
log "período 01/$MM..$HOJE · DOW=$DOW"

# ── 1) Coleta atual (faturamento + vendedores) em paralelo ──
node coleta_amgomes_lojas.mjs "$DI" "$HOJE" > /tmp/lojas_out.json 2>/tmp/lojas_err.txt & P1=$!
node coleta_amgomes_vendedores.mjs "$DI" "$HOJE" > /tmp/vend_out.json 2>/tmp/vend_err.txt & P2=$!
wait $P1; R1=$?; wait $P2; R2=$?
log "coleta lojas rc=$R1 · vendedores rc=$R2"

# Sanity da coleta: arquivos não-vazios + 4 lojas presentes em lojas_out
if [ $R1 -ne 0 ] || ! python3 -c "
import json,sys
d=json.load(open('/tmp/lojas_out.json'))
ok=all(str(e) in d and d[str(e)].get('cells') for e in (1,3,4,10))
sys.exit(0 if ok else 1)
" 2>/dev/null; then
  log "ERRO: coleta de lojas falhou/incompleta — PRESERVANDO versão anterior (sem build/commit)."
  cat /tmp/lojas_err.txt | tail -5
  exit 10
fi
[ $R2 -ne 0 ] && log "AVISO: vendedores rc=$R2 — build manterá tabela anterior se vazio."

# ── 2) YoY mês a mês: light (reusa coleta) ou full (segunda/virada de mês) ──
PRECISA_FULL=0
if [ "$DOW" = "1" ]; then
  PRECISA_FULL=1; log "segunda-feira → full de segurança"
else
  node atualiza_fatmensal.mjs light /tmp/lojas_out.json 2>/tmp/fatmensal_err.txt
  RC=$?; log "fatmensal light rc=$RC"
  [ "$RC" = "3" ] && PRECISA_FULL=1 && log "virada de mês detectada → full"
fi
if [ "$PRECISA_FULL" = "1" ]; then
  node coleta_amgomes_mensal.mjs "$AAAA"    "$MES" "$DIA" > /tmp/mensal_atual.json 2>/tmp/mensal_atual_err.txt; log "mensal_atual rc=$?"
  node coleta_amgomes_mensal.mjs "$ANO_ANT" "$MES" "$DIA" > /tmp/mensal_ant.json   2>/tmp/mensal_ant_err.txt;   log "mensal_ant rc=$?"
  if [ -s /tmp/mensal_atual.json ] && [ -s /tmp/mensal_ant.json ]; then
    node atualiza_fatmensal.mjs full /tmp/mensal_atual.json /tmp/mensal_ant.json 2>>/tmp/fatmensal_err.txt; log "fatmensal full rc=$?"
  else
    log "AVISO: coleta mensal falhou — mantém fatMensal anterior (card YoY não atualizado)."
  fi
fi

# ── 2.7) Top 10 marcas por loja (unidades vendidas no ANO) ──
# Coleta YTD via relatório de saldo (Playwright headless). Se falhar, o build PRESERVA o quadro anterior.
TM_OK=0
for t in 1 2; do
  if node coleta_top_marcas.mjs > /tmp/topmarcas_out.json.tmp 2>/tmp/topmarcas_err.txt && [ -s /tmp/topmarcas_out.json.tmp ]; then
    mv /tmp/topmarcas_out.json.tmp /tmp/topmarcas_out.json; TM_OK=1; break
  fi
  rm -f /tmp/topmarcas_out.json.tmp; log "coleta top marcas tentativa $t falhou — retry em $((t*30))s"; sleep $((t*30))
done
[ "$TM_OK" = "1" ] && log "top marcas (ano) OK" || log "AVISO: top marcas falhou — build PRESERVA quadro anterior."

# ── 3) Build (render determinístico de todos os blocos) ──
cp "$HTML" /tmp/amgomes_pre_build.html
if ! node build_amgomes.mjs /tmp/lojas_out.json /tmp/vend_out.json; then
  log "ERRO: build falhou — restaurando arquivo e abortando."
  cp /tmp/amgomes_pre_build.html "$HTML"
  exit 20
fi

# ── 4) Sanity pós-build: o <script> principal compila? ──
if ! node --check <(python3 -c "
import re;h=open('$HTML').read()
print(max(re.findall(r'<script>(.*?)</script>',h,re.S),key=len))
") 2>/tmp/jscheck_err.txt; then
  log "ERRO: HTML gerado tem JS inválido — restaurando e abortando."
  cat /tmp/jscheck_err.txt | tail -5
  cp /tmp/amgomes_pre_build.html "$HTML"
  exit 20
fi

# ── 5) Commit + push (atômico) ──
cd "$REPO"
if git diff --quiet -- dashboard_amgomes.html; then
  log "sem mudanças no dashboard — nada a commitar."
else
  git add dashboard_amgomes.html
  git commit -q -m "dashboard amgomes: atualização $HOJE $(date +%H:%M) (pipeline determinístico)"
  if git push origin main 2>/tmp/push_err.txt; then
    log "push OK."
  else
    log "ERRO no push:"; cat /tmp/push_err.txt | tail -5
  fi
fi
log "concluído."
exit 0
