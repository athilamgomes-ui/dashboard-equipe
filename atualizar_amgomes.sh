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
trap 'soltar_erp; rmdir "$LOCK" 2>/dev/null' EXIT
# ── trava compartilhada do perfil do Microvix (26/08/2026) ──────────────────
# ~20 scripts usam o mesmo ~/.claude/microvix-profile. Duas coletas ao mesmo tempo = a segunda
# não lê o api_token_lma, sai 10 e o painel PARA DE ATUALIZAR EM SILÊNCIO (aconteceu em 25/08
# com vendas e compras, que dispararam no mesmo minuto que a premiação).
source "$HOME/.claude/lib_lock_erp.sh"
travar_erp 12 || exit 30


cd "$SCRIPTS" || { log "scripts dir não encontrado"; exit 20; }

# ── Datas ──
HOJE=$(date +%d/%m/%Y); MM=$(date +%m); AAAA=$(date +%Y); DD=$(date +%d)
MES=$((10#$MM)); DIA=$((10#$DD)); ANO_ANT=$((AAAA-1)); DOW=$(date +%u)
DI="01/$MM/$AAAA"
log "período 01/$MM..$HOJE · DOW=$DOW"

# ── 1) Coleta atual (faturamento + vendedores) — SERIAL, nunca em paralelo ──
# Os dois coletores abrem Chromium no MESMO user-data-dir (~/.claude/microvix-profile).
# Duas instâncias no mesmo perfil = a segunda não lê api_token_lma do localStorage e
# morre com "NAV_FAIL api_token_lma indisponível após login" — o vend_out.json sai
# vazio e o build quebra (exit 20). Diagnosticado em 30/07/2026: rodando sozinho o
# coletor de vendedores dá rc=0; em paralelo com o de lojas, rc=1 de forma reprodutível.
# Retry em ambos: o perfil é compartilhado por ~20 scripts (precificacao roda de
# 15/15min e detecta_entrada de 2/2min), então colisão externa é rotina, não exceção.
node coleta_amgomes_lojas.mjs "$DI" "$HOJE" > /tmp/lojas_out.json 2>/tmp/lojas_err.txt; R1=$?
if [ $R1 -ne 0 ]; then
  log "coleta lojas rc=$R1 — retry em 30s"
  sleep 30
  node coleta_amgomes_lojas.mjs "$DI" "$HOJE" > /tmp/lojas_out.json 2>/tmp/lojas_err.txt; R1=$?
fi
node coleta_amgomes_vendedores.mjs "$DI" "$HOJE" > /tmp/vend_out.json 2>/tmp/vend_err.txt; R2=$?
if [ $R2 -ne 0 ]; then
  log "coleta vendedores rc=$R2 — retry em 30s"
  sleep 30
  node coleta_amgomes_vendedores.mjs "$DI" "$HOJE" > /tmp/vend_out.json 2>/tmp/vend_err.txt; R2=$?
fi
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
if [ "${FORCE_FULL:-0}" = "1" ]; then
  PRECISA_FULL=1; log "FORCE_FULL=1 → full forçado (reprocessa histórico YoY)"
elif [ "$DOW" = "1" ]; then
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

# ── Gate de hora: as coletas pesadas (marcas 3-métricas + margem descontaminada) rodam só ≥17h ──
HH=$(date +%H); HORA=$((10#$HH))

# ── 2.7) Top 10 marcas por loja com 3 MÉTRICAS (unidades/R$/margem), YTD ──
# Coleta pesada (analítico por produto agrupado por marca, ~2min/loja) → SÓ no run da tarde (≥17h).
# Preserva a exclusão das lixas Santa Clara (nível produto). Build PRESERVA o quadro se faltar.
if [ "$HORA" -ge 17 ] || [ "${MARGEM_LIMPA:-0}" = "1" ]; then
  if node coleta_marca_metricas.mjs > /tmp/marca_metricas.json.tmp 2>/tmp/marca_metricas_err.txt && [ -s /tmp/marca_metricas.json.tmp ]; then
    mv /tmp/marca_metricas.json.tmp /tmp/marca_metricas.json; log "top marcas (3 métricas) OK"
  else
    rm -f /tmp/marca_metricas.json.tmp; log "AVISO: top marcas falhou — build PRESERVA quadro anterior."
  fi
else
  log "top marcas (3 métricas) pulado (run da manhã; roda só ≥17h)."
fi

# ── 2.8) Margem descontaminada (custo de hoje, produtos de custo inválido excluídos) ──
# Coleta por produto POR LOJA (~1min/loja) — pesada, então SÓ no run da tarde (≥17h). Se falhar
# ou pular, o build PRESERVA o card anterior. Gate por hora (HORA, calculado acima); força com MARGEM_LIMPA=1.
if [ "$HORA" -ge 17 ] || [ "${MARGEM_LIMPA:-0}" = "1" ]; then
  if node coleta_margem_limpa.mjs > /tmp/margem_limpa.json.tmp 2>/tmp/margem_limpa_err.txt && [ -s /tmp/margem_limpa.json.tmp ]; then
    mv /tmp/margem_limpa.json.tmp /tmp/margem_limpa.json; log "margem descontaminada OK"
  else
    rm -f /tmp/margem_limpa.json.tmp; log "AVISO: margem descontaminada falhou — build PRESERVA card anterior."
  fi
else
  log "margem descontaminada pulada (run da manhã; roda só ≥17h)."
fi

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
