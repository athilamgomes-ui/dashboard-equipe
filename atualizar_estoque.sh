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

# ⚠️⚠️ AUDITORIA 31/10/2026 — por que este pipeline ficou 5 dias sem publicar (26/10 → 31/10).
# A noite de 30→31/10, lida do /tmp/estoque_run_wrapper.log, conta a história inteira:
#   22:12 "aguardando até 10min" pelo perfil → 00:01 conseguiu (1h49, não 10min)
#   00:15 balanços falham · 00:31 "retry em 60s" → 01:54 (83 min) · 03:14 saldo rc=1 · 04:12 exit 10
# Três defeitos somados:
#   (a) o guarda de 10 min era `for i in $(seq 1 60); sleep 10` — conta SONO, não RELÓGIO. Num
#       laptop que dorme, cada `sleep 10` vira minutos e o teto de 10 min não existe. Agora todo
#       prazo é comparado com `date +%s` (mesma lição de `[[lote-longo-vs-cron-perfil]]`).
#   (b) ninguém segurava o Mac acordado às 22h: o keepawake cobre até ~21:06 e usa `caffeinate -i`,
#       que não barra o maintenance sleep. Com a máquina cochilando, o Wi-Fi cai e o Playwright
#       morre com ERR_INTERNET_DISCONNECTED / ERR_NETWORK_CHANGED. Agora o próprio script segura
#       `caffeinate -imsd` pela vida dele.
#   (c) quem ocupava o perfil às 22h era o `detecta_entrada` (a cada 2 min, 24h). Ele passou a ter
#       janela comercial e a respeitar o lock deste pipeline — ver scripts/detecta_entrada.mjs.
# E o silêncio: exit 10 preservava o painel antigo sem avisar NINGUÉM (a regra do CLAUDE.md pede
# notificação). Agora todo exit != 0 notifica no macOS e escreve em /tmp/watchdog_alerts.txt.

# ── mantém o Mac acordado enquanto este pipeline roda (morre junto com ele) ──
if command -v caffeinate >/dev/null 2>&1; then
  caffeinate -imsd -w $$ >/dev/null 2>&1 &
  log "caffeinate preso ao pid $$ (sem dormir até terminar)."
fi

# ── aviso de falha: sem isto, exit 10 vira painel velho em silêncio por dias ──
avisar(){
  local msg="$1"
  /usr/bin/osascript -e "display notification \"${msg:0:220}\" with title \"⚠️ Estoque NÃO atualizou\" sound name \"Basso\"" 2>/dev/null
  # ⚠️ NÃO usar /tmp/watchdog_alerts.txt: o watchdog reescreve esse arquivo a cada passada (e o
  # APAGA quando está tudo ok), então o registro da falha do pipeline sumiria em horas.
  echo "[estoque $(date '+%d/%m %H:%M')] $msg" >> /tmp/amgomes_pipeline_falhas.txt
}

# ── a rede está de pé? (o Mac cochilando responde ping e não responde HTTPS) ──
rede_ok(){ curl -s -o /dev/null --max-time 12 "https://linx.microvix.com.br/v4/home/index.asp"; }
esperar_rede(){            # esperar_rede <minutos>
  local fim=$(( $(date +%s) + ${1:-5}*60 ))
  until rede_ok; do
    [ "$(date +%s)" -ge "$fim" ] && return 1
    log "sem rede/ERP — nova tentativa em 20s"; sleep 20
  done
  return 0
}

# ── lock próprio ──
# ⚠️ lock órfão (31/10/2026): se um run é morto no meio (Mac desligado, kill, queda de energia),
# este diretório fica para trás e TODAS as noites seguintes saem por exit 30, em silêncio — era
# um caminho pronto para "o painel ficou dias parado". Lock com mais de 3h sem toque é órfão.
if [ -d "$LOCK" ]; then
  IDADE_LOCK=$(( ( $(date +%s) - $(stat -f %m "$LOCK" 2>/dev/null || echo 0) ) / 60 ))
  if [ "$IDADE_LOCK" -ge 180 ]; then
    log "AVISO: lock próprio com ${IDADE_LOCK}min (órfão de um run morto) — removendo e seguindo."
    rmdir "$LOCK" 2>/dev/null || rm -rf "$LOCK"
  fi
fi
if ! mkdir "$LOCK" 2>/dev/null; then
  log "ERRO: outra execução em andamento ($LOCK existe há ${IDADE_LOCK:-?}min). Abortando."; exit 30
fi
TOUCH_PID=""
limpar(){ rmdir "$LOCK" 2>/dev/null; [ -n "$TOUCH_PID" ] && kill "$TOUCH_PID" 2>/dev/null; rmdir "$LOCK_ERP" 2>/dev/null; }
trap limpar EXIT

# ── lock do perfil do Microvix (compartilhado com precificação/detecta_entrada) ──
# ⚠️ prazo por RELÓGIO (date +%s), não por contagem de sleeps: ver a nota da auditoria no topo.
# E prazo ABSOLUTO: depois das 23:30 não vale mais começar uma coleta de ~45min, porque ela
# atravessa a madrugada, a rede cai e o run morre no meio. Melhor não publicar e avisar.
GOT_ERP=0
LIMITE_LOCK=$(( $(date +%s) + ${ESPERA_LOCK_MIN:-10}*60 ))
HORA_LIMITE="${HORA_LIMITE:-2330}"
while :; do
  if mkdir "$LOCK_ERP" 2>/dev/null; then GOT_ERP=1; break; fi
  [ "$GOT_ERP" = "0" ] && [ -z "${AVISOU:-}" ] && { log "perfil do Microvix ocupado — aguardando até ${ESPERA_LOCK_MIN:-10}min (prazo por relógio)..."; AVISOU=1; }
  agora=$(date +%s)
  if [ "$agora" -ge "$LIMITE_LOCK" ]; then
    log "ERRO: perfil do Microvix ocupado por ${ESPERA_LOCK_MIN:-10}min de relógio — abortando sem publicar."
    avisar "perfil do Microvix ocupado há ${ESPERA_LOCK_MIN:-10}min; painel de estoque segue com o dado anterior"; exit 30
  fi
  # ⚠️ a janela proibida ATRAVESSA a meia-noite: 23:30→06:00. Testar só ">= 2330" deixava passar
  # 00:12, que é exatamente a hora em que o run de ontem começou a coletar e morreu sem rede.
  HM=$(date +%H%M)
  if [ "${FORCAR:-0}" != "1" ] && { [ "$HM" -ge "$HORA_LIMITE" ] || [ "$HM" -lt 600 ]; }; then
    log "ERRO: $HM está na madrugada (limite $HORA_LIMITE–0600) e o perfil nunca liberou — não começo coleta agora."
    avisar "não deu para coletar o estoque antes das $HORA_LIMITE (perfil ocupado); painel com dado anterior"; exit 30
  fi
  sleep 10
done
if ! esperar_rede 5; then
  log "ERRO: sem rede/ERP respondendo — abortando sem publicar."
  avisar "sem rede ou ERP fora do ar; painel de estoque segue com o dado anterior"; exit 30
fi
( while [ -d "$LOCK_ERP" ]; do touch "$LOCK_ERP"; sleep 120; done ) >/dev/null 2>&1 &
TOUCH_PID=$!
disown "$TOUCH_PID" 2>/dev/null   # sem isto o bash imprime "Terminated: 15" no log ao matar o keepalive — parece erro e não é
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
  # ⚠️ não insistir contra rede morta: em 31/10 as duas tentativas morreram em
  # ERR_INTERNET_DISCONNECTED e o "retry em 60s" esticou para 83 min com o Mac cochilando.
  log "balanços tentativa $t falhou — conferindo rede antes de repetir"
  esperar_rede 3 || { log "ERRO: sem rede — abortando sem publicar."; avisar "coleta de balanços sem rede; painel com dado anterior"; exit 30; }
  [ "$t" = "1" ] && sleep 20
done
if [ "$BAL_OK" != "1" ] && [ ! -s "$DADOS/balancos.json" ]; then
  log "ERRO: balanços falharam e não há cache — PRESERVANDO versão anterior."
  tail -5 /tmp/estoque_bal.err
  avisar "coleta de balanços falhou e não há cache; painel de estoque com dado anterior"; exit 10
fi
[ "$BAL_OK" = "1" ] && log "balanços OK" || log "AVISO: balanços falharam — usando cache anterior."

# ── 2) Saldo, entradas, vendas, trânsito, custo e preço (o mais pesado: catálogo por loja) ──
node coleta_estoque_saldo.mjs > /tmp/estoque_saldo.out 2>/tmp/estoque_saldo.err; RS=$?
if [ $RS -ne 0 ]; then
  log "coleta de saldo rc=$RS — conferindo rede antes de repetir"
  esperar_rede 3 || { log "ERRO: sem rede — abortando sem publicar."; avisar "coleta de saldo sem rede; painel com dado anterior"; exit 30; }
  node coleta_estoque_saldo.mjs > /tmp/estoque_saldo.out 2>>/tmp/estoque_saldo.err; RS=$?
fi
if [ $RS -ne 0 ]; then
  log "ERRO: coleta de saldo falhou — PRESERVANDO versão anterior (sem build/commit)."
  tail -8 /tmp/estoque_saldo.err
  avisar "coleta de saldo falhou (rc=$RS); painel de estoque com dado anterior"; exit 10
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
  avisar "build do painel de estoque falhou; versão anterior restaurada"
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
  avisar "sanity do estoque reprovou (dado parcial); painel com a versão anterior"
  [ -f /tmp/estoque_pre_build.html ] && cp /tmp/estoque_pre_build.html "$HTML"
  exit 10
fi
cp "$DADOS/estoque_dados.json" "$DADOS/estoque_dados_anterior.json"

# ── 7) Sanity do HTML: o JS do painel compila? ──
if ! node --check "$SCRIPTS/estoque_app.js" 2>/tmp/estoque_js.err; then
  log "ERRO: JS do painel inválido — restaurando."; tail -4 /tmp/estoque_js.err
  avisar "JS do painel de estoque inválido; versão anterior restaurada"
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
  if git push origin main 2>/tmp/estoque_push.err; then log "push OK."; else log "ERRO no push:"; tail -5 /tmp/estoque_push.err; avisar "painel de estoque gerado mas o push falhou — GitHub Pages serve o anterior"; fi
fi
log "concluído."
exit 0
