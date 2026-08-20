#!/usr/bin/env bash
# atualizar_estoque.sh — pipeline DETERMINÍSTICO do dashboard de ESTOQUE do Grupo A.M. Gomes.
# Balanços (API) → saldo/entradas/vendas (relatório) → notas + canceladas → custos dos suspeitos
# → build (render cifrado) → sanity → commit/push. SEM LLM no caminho.
#
# Exit codes: 0=ok · 10=coleta falhou (preserva versão anterior) · 20=build falhou · 30=lock
#
# ⚠️ Regra nº 1: toda coleta é Playwright headless (scripts/*.mjs). NUNCA Chrome MCP.
# ⚠️ O perfil ~/.claude/microvix-profile é compartilhado por ~20 scripts. Este pipeline segura
#    TAMBÉM o lock da precificação (/tmp/precificacao_update.lock.d) enquanto coleta, e o mantém
#    "fresco" com touch — senão o detecta_entrada (2/2min) considera o lock órfão e rouba o perfil.
set -uo pipefail

REPO="/Users/elkgomes/Desktop/claude/dashboard-equipe"
SCRIPTS="$REPO/scripts"
HTML="$REPO/dashboard_estoque.html"
DADOS="$REPO/dados_estoque"
LOCK="/tmp/amgomes_estoque.lock"
LOCK_ERP="/tmp/precificacao_update.lock.d"
log(){ echo "[atualizar-estoque $(date +%H:%M:%S)] $*"; }

# ── lock próprio ──
if ! mkdir "$LOCK" 2>/dev/null; then
  log "ERRO: outra execução em andamento ($LOCK existe). Abortando."; exit 30
fi
TOUCH_PID=""
limpar(){ rmdir "$LOCK" 2>/dev/null; [ -n "$TOUCH_PID" ] && kill "$TOUCH_PID" 2>/dev/null; rmdir "$LOCK_ERP" 2>/dev/null; }
trap limpar EXIT

# ── lock do perfil do Microvix (compartilhado com precificação/detecta_entrada) ──
GOT_ERP=0
for i in $(seq 1 60); do
  if mkdir "$LOCK_ERP" 2>/dev/null; then GOT_ERP=1; break; fi
  [ "$i" = "1" ] && log "perfil do Microvix ocupado (precificação) — aguardando até 10min..."
  sleep 10
done
if [ "$GOT_ERP" != "1" ]; then log "ERRO: perfil do Microvix ocupado há 10min — abortando sem publicar."; exit 30; fi
( while [ -d "$LOCK_ERP" ]; do touch "$LOCK_ERP"; sleep 120; done ) >/dev/null 2>&1 &
TOUCH_PID=$!
log "perfil do Microvix reservado."

cd "$SCRIPTS" || { log "scripts dir não encontrado"; exit 20; }
mkdir -p "$DADOS"

# ── Domingo = execução FULL: alcança balanços mais antigos (as janelas novas viram cache
# permanente, então o custo é pago uma vez e a cobertura da reconciliação cresce).
# Segunda a sábado usa o padrão de 120 dias. FORCE_FULL=1 força a qualquer dia.
if [ "$(date +%u)" = "7" ] || [ "${FORCE_FULL:-0}" = "1" ]; then
  export DIAS_BALANCO="${DIAS_BALANCO:-240}"
  log "execução FULL (domingo): DIAS_BALANCO=$DIAS_BALANCO"
else
  export DIAS_BALANCO="${DIAS_BALANCO:-120}"
fi

# ── 1) Balanços (API do lb-erpwebapp) — balanço finalizado é imutável, o cache só cresce ──
BAL_OK=0
for t in 1 2; do
  if node coleta_estoque_balancos.mjs > /tmp/estoque_bal.out 2>/tmp/estoque_bal.err; then BAL_OK=1; break; fi
  log "balanços tentativa $t falhou — retry em $((t*30))s"; sleep $((t*30))
done
if [ "$BAL_OK" != "1" ] && [ ! -s "$DADOS/balancos.json" ]; then
  log "ERRO: balanços falharam e não há cache — PRESERVANDO versão anterior."
  tail -5 /tmp/estoque_bal.err; exit 10
fi
[ "$BAL_OK" = "1" ] && log "balanços OK" || log "AVISO: balanços falharam — usando cache anterior."

# ── 2) Saldo, entradas, vendas, trânsito, custo e preço (o mais pesado: catálogo por loja) ──
node coleta_estoque_saldo.mjs > /tmp/estoque_saldo.out 2>/tmp/estoque_saldo.err; RS=$?
if [ $RS -ne 0 ]; then
  log "coleta de saldo rc=$RS — retry em 60s"; sleep 60
  node coleta_estoque_saldo.mjs > /tmp/estoque_saldo.out 2>>/tmp/estoque_saldo.err; RS=$?
fi
if [ $RS -ne 0 ]; then
  log "ERRO: coleta de saldo falhou — PRESERVANDO versão anterior (sem build/commit)."
  tail -8 /tmp/estoque_saldo.err; exit 10
fi
log "saldo OK"

# ── 3) Notas de entrada + CANCELADAS + fator de conversão (não fatal) ──
if node coleta_estoque_notas.mjs > /tmp/estoque_notas.out 2>/tmp/estoque_notas.err; then
  log "notas OK"
else
  log "AVISO: notas falharam — canceladas e fator de conversão ficam com o dado anterior."
  tail -4 /tmp/estoque_notas.err
fi

# ── 4) Custo real dos suspeitos de preço (não fatal, caro, com cache de 30 dias) ──
node coleta_estoque_custos.mjs > /tmp/estoque_custos.out 2>/tmp/estoque_custos.err
log "custos rc=$? (não fatal)"

# ── 4.5) Build preliminar + investigação do que não fecha ──
# O investigador precisa da LISTA de "sem explicação", que só existe depois do build. Então:
# build → investiga (Histórico de Movimento dos piores) → build de novo, agora com a justificativa.
# Não é fatal: se falhar, o painel mostra "ainda não investigado" em vez de mentir.
node build_estoque.mjs 2>/tmp/estoque_build0.err || log "AVISO: build preliminar falhou — segue sem investigação"
node coleta_estoque_movimento.mjs > /tmp/estoque_mov.out 2>/tmp/estoque_mov.err
log "investigação de movimento rc=$? (não fatal)"

# libera o perfil do ERP — daqui pra frente é tudo local
kill "$TOUCH_PID" 2>/dev/null; TOUCH_PID=""
rmdir "$LOCK_ERP" 2>/dev/null; log "perfil do Microvix liberado."

# ── 5) Build (ÚNICO escritor do HTML) ──
[ -f "$HTML" ] && cp "$HTML" /tmp/estoque_pre_build.html
if ! node build_estoque.mjs 2>/tmp/estoque_build.err; then
  log "ERRO: build falhou — restaurando arquivo e abortando."
  tail -8 /tmp/estoque_build.err
  [ -f /tmp/estoque_pre_build.html ] && cp /tmp/estoque_pre_build.html "$HTML"
  exit 20
fi
cat /tmp/estoque_build.err

# ── 6) Sanity: dado parcial NUNCA vai pro ar (lição da L4 zerada em 07/08) ──
if ! python3 - <<'PY'
import json, sys, os
d = json.load(open('/Users/elkgomes/Desktop/claude/dashboard-equipe/dados_estoque/estoque_dados.json'))
ant_p = '/Users/elkgomes/Desktop/claude/dashboard-equipe/dados_estoque/estoque_dados_anterior.json'
ant = json.load(open(ant_p)) if os.path.exists(ant_p) else None
erros = []
if len(d.get('kpis', {})) != 4: erros.append(f"kpis de {len(d.get('kpis',{}))} lojas (esperado 4)")
for lj, k in d.get('kpis', {}).items():
    if not k.get('skus'): erros.append(f"{lj} com 0 SKUs")
    if ant:
        a = ant.get('kpis', {}).get(lj, {}).get('skus') or 0
        if a and k.get('skus', 0) < a * 0.5:
            erros.append(f"{lj} caiu de {a} para {k.get('skus')} SKUs (>50%)")
if d.get('janelasFaltando'): erros.append(f"{len(d['janelasFaltando'])} janelas ausentes do cache")
if erros:
    print("SANITY FALHOU: " + " · ".join(erros)); sys.exit(1)
print("sanity ok: " + " · ".join(f"{lj} {k['skus']} SKUs, {k['pct']}% fecham" for lj, k in d['kpis'].items()))
PY
then
  log "ERRO: sanity reprovou — restaurando versão anterior e NÃO publicando."
  [ -f /tmp/estoque_pre_build.html ] && cp /tmp/estoque_pre_build.html "$HTML"
  exit 10
fi
cp "$DADOS/estoque_dados.json" "$DADOS/estoque_dados_anterior.json"

# ── 7) Sanity do HTML: o JS do painel compila? ──
if ! node --check "$SCRIPTS/estoque_app.js" 2>/tmp/estoque_js.err; then
  log "ERRO: JS do painel inválido — restaurando."; tail -4 /tmp/estoque_js.err
  [ -f /tmp/estoque_pre_build.html ] && cp /tmp/estoque_pre_build.html "$HTML"
  exit 20
fi

# ── 8) Commit + push ──
cd "$REPO"
if git diff --quiet -- dashboard_estoque.html 2>/dev/null && git ls-files --error-unmatch dashboard_estoque.html >/dev/null 2>&1; then
  log "sem mudanças no dashboard — nada a commitar."
else
  git add dashboard_estoque.html index.html 2>/dev/null
  git commit -q -m "dashboard estoque: atualização $(date +%d/%m/%Y' '%H:%M) (pipeline determinístico)" || log "nada a commitar"
  if git push origin main 2>/tmp/estoque_push.err; then log "push OK."; else log "ERRO no push:"; tail -5 /tmp/estoque_push.err; fi
fi
log "concluído."
exit 0
