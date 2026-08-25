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
# ⚠️ LOG NÃO VAI PARA /tmp. O macOS limpa /tmp (e reboot apaga tudo): em
# 14/08/2026 a rotina falhou e não havia UM log para dizer por quê — só dava
# para deduzir. Log de rotina diária precisa sobreviver a reboot.
LOGDIR="$HOME/.claude/logs/caixa"
mkdir -p "$LOGDIR"
HOJE_LOG="$LOGDIR/$(date +%Y-%m-%d)"
find "$LOGDIR" -type f -mtime +30 -delete 2>/dev/null   # guarda 30 dias
LOJAS="L1 L3 L5"                       # L4 não tem conta InfinitePay
DIA="${DIA:-$(date -v-1d +%Y-%m-%d)}"
log(){ echo "[caixa-diario $(date +%H:%M:%S)] $*"; }

avisar_falha(){                        # falha silenciosa é o pior modo de falhar
  /usr/bin/osascript -e "display notification \"${1:0:200}\" with title \"⚠️ Conferência de caixa\" sound name \"Basso\"" 2>/dev/null
  echo "[caixa-diario] $1" > $LOGDIR/ultimo_erro.txt
}

# ── SE SOLTA DE QUEM CHAMOU ───────────────────────────────────────────────────
# Quem dispara esta rotina é o agente de uma tarefa agendada, numa ÚNICA chamada de
# Bash que fica esperando o fim. Em 25/08/2026 essa chamada levou SIGTERM aos 29 min,
# no meio da 2ª tentativa da coleta do ERP — e como o WhatsApp é a ÚLTIMA etapa, o
# Athila simplesmente não recebeu a conferência. Sem erro, sem aviso: o pipeline não
# falhou, foi morto.
# Agora o processo se solta: quem chama volta na hora e a rotina segue até o fim,
# mesmo que o terminal, o agente ou a sessão morram no caminho.
if [ "${CAIXA_ANEXADO:-0}" != "1" ]; then
  # Caminho ABSOLUTO e via bash: "$0" vem relativo quando alguém roda de dentro da
  # pasta ("bash atualizar_caixa_diario.sh"), e o nohup procura isso no PATH, não no
  # diretório atual — o filho morria na hora com "No such file or directory".
  CAIXA_ANEXADO=1 DIA="$DIA" nohup /bin/bash "$REPO/atualizar_caixa_diario.sh" "$@" \
    >> "$HOJE_LOG-pipeline.log" 2>&1 &
  DESANEXADO=$!
  disown "$DESANEXADO" 2>/dev/null || true
  echo "[caixa-diario] rodando destacado (pid $DESANEXADO) · dia $DIA"
  echo "[caixa-diario] log:    $HOJE_LOG-pipeline.log"
  echo "[caixa-diario] status: $LOGDIR/ultimo_status.txt (escrito no fim)"
  exit 0
fi

# Estado final em arquivo: como o chamador não espera mais o fim, é por aqui que ele
# (e o watchdog) descobrem o que aconteceu.
# ⚠️ "ok" tem que ser AFIRMADO, nunca deduzido do código de saída. Ao levar SIGTERM o
# bash roda o trap de EXIT com $? = 0, então uma rodada morta no meio se registrava como
# "ok" — a mesma mentira por omissão que esta rotina existe para não contar. Só a última
# linha do script marca CONCLUIU=1.
CONCLUIU=0
trap 'exit 143' TERM
trap 'exit 130' INT
registrar_status(){
  local code=$?
  local situacao
  if [ "$CONCLUIU" = "1" ] && [ $code -eq 0 ]; then situacao="ok"
  elif [ $code -eq 143 ] || [ $code -eq 130 ]; then situacao="interrompido (morto no meio)"
  else situacao="falhou"
  fi
  printf '%s|%s|%s|%s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$DIA" "$code" "$situacao" \
    > "$LOGDIR/ultimo_status.txt"
}

if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -d "$LOCK" ] && [ "$(find "$LOCK" -maxdepth 0 -mmin +90)" ]; then
    log "lock órfão (>90min) — removendo"; rm -rf "$LOCK"; mkdir "$LOCK"
  else
    # ⚠️ ESTE ERA O ÚNICO CAMINHO DE SAÍDA SEM AVISO NENHUM: sem log em arquivo
    # (o script morre antes de abrir qualquer um), sem notificação, sem nada.
    # Um lock preso aqui mata a conferência em silêncio absoluto — foi o
    # suspeito nº 1 do sumiço de 14/08/2026, e não deu para confirmar
    # justamente porque não sobrou rastro.
    IDADE=$(( ($(date +%s) - $(stat -f %m "$LOCK" 2>/dev/null || date +%s)) / 60 ))
    log "já há execução em andamento (lock de ${IDADE}min) — abortando"
    avisar_falha "conferência de $DIA não rodou: lock de ${IDADE}min em $LOCK. Se não houver processo rodando, apague o lock."
    exit 30
  fi
fi
trap 'registrar_status; rm -rf "$LOCK"' EXIT

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
  bash "$REPO/atualizar_conferencia_caixa.sh" > $HOJE_LOG-erp.log 2>&1
  ERP=$?

  # exit 30 = lock: OUTRA execução do ERP está rodando agora. Isso não é falha —
  # é justamente alguém buscando o dado que a gente quer. Esperar e tentar de
  # novo é o certo; abortar joga fora a conferência do dia por um detalhe de
  # concorrência.
  #
  # Aconteceu em 07/08/2026: as tarefas da noite anterior (20:40 e a repescagem
  # das 21:35) não rodaram porque o Claude estava fechado e dispararam de manhã,
  # no primeiro lançamento, em cima da nossa das 07:20. As três brigaram pelo
  # mesmo lock, a nossa perdeu e o Athila ficou sem o resumo.
  ESPERA=0
  while [ $ERP -eq 30 ] && [ $ESPERA -lt 20 ]; do
    ESPERA=$((ESPERA + 1))
    log "  ERP ocupado por outra execução — aguardando 60s (${ESPERA}/20)"
    sleep 60
    bash "$REPO/atualizar_conferencia_caixa.sh" > $HOJE_LOG-erp.log 2>&1
    ERP=$?
  done
  [ $ERP -eq 0 ] && [ $ESPERA -gt 0 ] && log "  ERP liberado após ${ESPERA} min de espera"
fi
if [ $ERP -ne 0 ]; then
  # Sem ERP do dia, conciliar produziria "cobrança sem venda" para o dia todo —
  # alarme falso pior que silêncio. Para aqui.
  log "ERRO: pipeline do ERP saiu com $ERP — abortando (não dá para conciliar contra dado velho)"
  tail -5 $HOJE_LOG-erp.log
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
  if ! $NODE "$SCRIPTS/coleta_infinitepay.mjs" "$L" "$DIA" >> $HOJE_LOG-infinitepay.log 2>&1; then
    FALHAS="$FALHAS $L"
    log "  FALHA na $L (ver $HOJE_LOG-infinitepay.log)"
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
RES="$HOJE_LOG-resumos.json"
if ! $NODE "$SCRIPTS/conciliar_headless.mjs" --dir "$ARQ" --salvar --json "$RES" > $HOJE_LOG-conciliacao.log 2>&1; then
  log "ERRO na conciliação"; tail -8 $HOJE_LOG-conciliacao.log
  avisar_falha "conciliação de $DIA falhou"
  exit 20
fi
cat $HOJE_LOG-conciliacao.log

# ── 5) aviso ─────────────────────────────────────────────────────────────────
log "avisando..."
# ⚠️ NÃO transformar isto em `if ! comando | tail`: num pipeline o `$?` é o do
# ÚLTIMO comando (o tail, que sempre dá 0), então a falha do envio passava
# despercebida e a rotina terminava com "pronto" e exit 0. Descoberto no
# primeiro teste ponta a ponta (05/08/2026): o WhatsApp recusou por template
# ainda não aprovado e mesmo assim o pipeline se declarou bem-sucedido.
# Justamente o modo de falha que esta rotina existe para não ter: ninguém
# avisado e ninguém sabendo disso.
$NODE "$SCRIPTS/aviso_caixa.mjs" "$RES" "$DIA" > $HOJE_LOG-aviso.log 2>&1
AV=$?
tail -4 $HOJE_LOG-aviso.log
if [ $AV -eq 3 ]; then
  # Enfileirado sem template aprovado: a Meta aceita e descarta em silêncio se a
  # janela de 24h estiver fechada. Não é sucesso nem falha — é "não dá para
  # saber", e dizer "pronto" aqui seria a mesma mentira de 06/08/2026.
  log "AVISO: resumo enfileirado, mas a entrega NÃO é garantida (sem template aprovado)"
  avisar_falha "resumo de $DIA foi enfileirado no WhatsApp, mas pode não chegar — template ainda não aprovado"
elif [ $AV -ne 0 ]; then
  log "ERRO: o resumo NÃO foi enviado"
  avisar_falha "conferência de $DIA rodou, mas o resumo não chegou em você"
  exit 40
fi

CONCLUIU=1
log "pronto."
exit 0
