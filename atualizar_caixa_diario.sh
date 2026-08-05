#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# atualizar_caixa_diario.sh — a rotina diária inteira, sem ninguém no meio.
#
#   1) ERP        → atualizar_conferencia_caixa.sh (movimento do dia fechado)
#   2) InfinitePay→ coleta_infinitepay.mjs por loja (extrato + maquininha do D-1)
#   3) conciliação→ conciliar_headless.mjs (motor do painel, fora do navegador)
#   4) histórico  → grava cifrado no Supabase (o painel abre e você investiga)
#   5) aviso      → WhatsApp (cai para Telegram se falhar)
#
# POR QUE 07:45 E NÃO DE NOITE: o relatório do dia anterior só fecha depois da
# meia-noite, e rodar de manhã garante que o ERP tem o dia INTEIRO. A regra
# "dia coletado ≠ dia fechado" já produziu divergência falsa aqui (30/07/2026):
# a coleta das 14:50 fazia toda venda da tarde virar "cobrança sem venda".
#
# Exit: 0=ok · 10=coleta falhou (preserva o anterior) · 20=conciliação falhou
#       · 30=lock · 40=avisei ninguém (rodou, mas o resumo não saiu)
#
# Rodar manualmente:
#   bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_caixa_diario.sh
#   DIA=2026-08-04 bash .../atualizar_caixa_diario.sh     (refazer um dia)
# ─────────────────────────────────────────────────────────────────────────────
set -u
REPO="/Users/elkgomes/Desktop/claude/dashboard-equipe"
SCRIPTS="$REPO/scripts"
NODE="/opt/homebrew/bin/node"
ARQ="$HOME/.claude/caixa-arquivos"
LOCK="/tmp/caixa_diario.lock"
LOJAS="L1 L3 L5"                       # L4 não tem conta InfinitePay
DIA="${DIA:-$(date -v-1d +%Y-%m-%d)}"
log(){ echo "[caixa-diario $(date +%H:%M:%S)] $*"; }

avisar_falha(){                        # falha silenciosa é o pior modo de falhar
  /usr/bin/osascript -e "display notification \"${1:0:200}\" with title \"⚠️ Conferência de caixa\" sound name \"Basso\"" 2>/dev/null
  echo "[caixa-diario] $1" > /tmp/caixa_diario_erro.txt
}

if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -d "$LOCK" ] && [ "$(find "$LOCK" -maxdepth 0 -mmin +90)" ]; then
    log "lock órfão (>90min) — removendo"; rm -rf "$LOCK"; mkdir "$LOCK"
  else
    log "já há execução em andamento — abortando"; exit 30
  fi
fi
trap 'rm -rf "$LOCK"' EXIT

log "conferência do dia $DIA"

# ── 1) ERP ───────────────────────────────────────────────────────────────────
# Roda o pipeline que já existe: coleta o Microvix, publica o painel e faz push.
#
# PULA_ERP=1 existe só para DEPURAR as etapas seguintes sem esperar 3 min de
# coleta — e sem disputar o ~/.claude/microvix-profile com a precificação, que
# roda de 15 em 15 min em dia útil. Nunca usar no agendamento: sem o ERP do dia,
# a conciliação cruza contra dado velho.
if [ "${PULA_ERP:-0}" = "1" ]; then
  log "⚠️ PULA_ERP=1 — pulando a atualização do ERP (modo depuração)"
  ERP=0
else
  log "atualizando o ERP..."
  bash "$REPO/atualizar_conferencia_caixa.sh" > /tmp/caixa_diario_erp.log 2>&1
  ERP=$?
fi
if [ $ERP -ne 0 ]; then
  # Sem ERP do dia, conciliar produziria "cobrança sem venda" para o dia todo —
  # alarme falso pior que silêncio. Para aqui.
  log "ERRO: pipeline do ERP saiu com $ERP — abortando (não dá para conciliar contra dado velho)"
  tail -5 /tmp/caixa_diario_erp.log
  avisar_falha "ERP não atualizou (exit $ERP) — conferência de $DIA não rodou"
  exit 10
fi
log "ERP ok"

# ── 2) InfinitePay ───────────────────────────────────────────────────────────
mkdir -p "$ARQ"
rm -f "$ARQ"/*.csv                     # só o dia corrente na pasta: sobra de
                                       # ontem faria o motor conciliar dois dias
                                       # e contar movimento repetido.
FALHAS=""
for L in $LOJAS; do
  log "coletando InfinitePay $L..."
  if ! $NODE "$SCRIPTS/coleta_infinitepay.mjs" "$L" "$DIA" >> /tmp/caixa_diario_ip.log 2>&1; then
    FALHAS="$FALHAS $L"
    log "  FALHA na $L (ver /tmp/caixa_diario_ip.log)"
  fi
done
if [ -n "$FALHAS" ]; then
  # Sessão expirada é o caso esperado: o acesso é por QR Code, não há re-login
  # automático possível. Avisa para alguém escanear — e segue com quem deu certo.
  avisar_falha "InfinitePay falhou em:$FALHAS — provável sessão expirada (node infinitepay_sessao.mjs login)"
fi
if [ -z "$(ls -A "$ARQ"/*.csv 2>/dev/null)" ]; then
  log "ERRO: nenhum arquivo coletado — nada a conciliar"
  exit 10
fi

# ── 3+4) conciliação + histórico cifrado ─────────────────────────────────────
log "conciliando..."
RES="/tmp/caixa_diario_resumos.json"
if ! $NODE "$SCRIPTS/conciliar_headless.mjs" --dir "$ARQ" --salvar --json "$RES" > /tmp/caixa_diario_conc.log 2>&1; then
  log "ERRO na conciliação"; tail -8 /tmp/caixa_diario_conc.log
  avisar_falha "conciliação de $DIA falhou"
  exit 20
fi
cat /tmp/caixa_diario_conc.log

# ── 5) aviso ─────────────────────────────────────────────────────────────────
log "avisando..."
# ⚠️ NÃO transformar isto em `if ! comando | tail`: num pipeline o `$?` é o do
# ÚLTIMO comando (o tail, que sempre dá 0), então a falha do envio passava
# despercebida e a rotina terminava com "pronto" e exit 0. Descoberto no
# primeiro teste ponta a ponta (05/08/2026): o WhatsApp recusou por template
# ainda não aprovado e mesmo assim o pipeline se declarou bem-sucedido.
# Justamente o modo de falha que esta rotina existe para não ter: ninguém
# avisado e ninguém sabendo disso.
$NODE "$SCRIPTS/aviso_caixa.mjs" "$RES" "$DIA" > /tmp/caixa_diario_aviso.log 2>&1
AV=$?
tail -4 /tmp/caixa_diario_aviso.log
if [ $AV -ne 0 ]; then
  log "ERRO: o resumo NÃO foi enviado"
  avisar_falha "conferência de $DIA rodou, mas o resumo não chegou em você"
  exit 40
fi

log "pronto."
exit 0
