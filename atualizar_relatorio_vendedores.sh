#!/bin/bash
# atualizar_relatorio_vendedores.sh — relatório diário de performance dos vendedores
# (Faturamento > Relatórios > Performance por Vendedor, empresas 1 e 4, dia anterior)
# coletado do Microvix e enviado no WhatsApp do Athila.
#
# Rodar manualmente:  bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_relatorio_vendedores.sh
# Conferir sem enviar: bash .../atualizar_relatorio_vendedores.sh --so-texto
# Dia específico:      DIA=25/08/2026 bash .../atualizar_relatorio_vendedores.sh
# Dia padrão: o anterior; na SEGUNDA vai o sábado (domingo as lojas não abrem).
# Repescagem:          SO_SE_FALTOU=1 bash ...   (idem; hoje toda execução já pula dia repetido)
# Reenviar de propósito: FORCAR=1 DIA=29/08/2026 bash ...
#
# Exit: 0=ok (ou nada a fazer) · 10=coleta falhou · 11=envio falhou · 30=lock.
# NUNCA chamar a skill agendada pelo nome numa sessão interativa — chame este .sh direto.
set -u
REPO="/Users/elkgomes/Desktop/claude/dashboard-equipe"
SCRIPTS="$REPO/scripts"
NODE="/opt/homebrew/bin/node"
LOCK="/tmp/relatorio_vendedores.lock"
DADOS="$REPO/relatorio_vendedores_raw.json"
ENVIADOS="$HOME/.claude/relatorio_vendedores_enviados.txt"
log(){ echo "[rel-vend $(date +%H:%M:%S)] $*"; }

# Dia coberto: o anterior — com duas exceções de calendário.
#   Domingo: NÃO roda. As lojas fecharam sábado e o Athila quer o sábado na SEGUNDA
#            (28/08/2026). Rodando no domingo, o mesmo relatório chegava duas vezes.
#   Segunda: o dia anterior é domingo (lojas fechadas), então vai o SÁBADO.
if [ -z "${DIA:-}" ]; then
  dow=$(date +%u)
  if [ "$dow" = "7" ]; then
    log "domingo — o relatório de sábado sai amanhã de manhã; nada a fazer hoje"; exit 0
  fi
  if [ "$dow" = "1" ]; then DIA=$(date -v-2d +%d/%m/%Y); else DIA=$(date -v-1d +%d/%m/%Y); fi
fi

SO_TEXTO=""; [ "${1:-}" = "--so-texto" ] && SO_TEXTO="--so-texto"

# Um aviso que depende de agente é um aviso que não existe quando o agente morre:
# em 02–04/08/2026 a conferência de caixa ficou quatro dias parada em silêncio.
avisar(){
  printf '[rel-vend %s] %s\n' "$(date '+%d/%m %H:%M')" "$1" > /tmp/rel_vendedores_alerta.txt
  /usr/bin/osascript -e "display notification \"${1:0:220}\" with title \"⚠️ Relatório de vendedores NÃO foi enviado\" sound name \"Basso\"" 2>/dev/null
}

# ── nunca mandar o mesmo dia duas vezes ──
# Valia só para a repescagem (SO_SE_FALTOU=1), e por isso a rodada de segunda ia mandar
# de novo o sábado que o domingo já tinha enviado. Agora vale para toda execução.
# FORCAR=1 reenvia de propósito (conferência, correção de número).
if [ "${FORCAR:-0}" != "1" ] && [ -f "$ENVIADOS" ] && grep -qx "$DIA" "$ENVIADOS"; then
  log "$DIA já foi enviado — nada a fazer (use FORCAR=1 para reenviar)"; exit 0
fi

# ── lock próprio ──
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -d "$LOCK" ] && [ "$(find "$LOCK" -maxdepth 0 -mmin +60)" ]; then
    log "lock órfão (>60min) — removendo"; rm -rf "$LOCK"; mkdir "$LOCK"
  else
    log "já há execução em andamento (lock) — abortando"; exit 30
  fi
fi
trap 'soltar_erp; rm -rf "$LOCK"' EXIT

# ── trava compartilhada do perfil do Microvix ──
# ~20 scripts usam o mesmo ~/.claude/microvix-profile; às 8:30 o coleta_precificacao
# roda de 15 em 15 min. Sem a trava, a coleta morre e o relatório some em silêncio.
source "$HOME/.claude/lib_lock_erp.sh"
# 25 min, não 12: a conferência de caixa começa às 8:05 e segura o perfil BEM depois das 8:30
# — em 29, 30 e 31/08/2026 ela ganhou a disputa e o relatório só saiu na repescagem das 10:36.
# Esperar é melhor que falhar: a mensagem sai assim que o caixa larga o perfil, ~8:50.
travar_erp 25 || { avisar "perfil do Microvix ocupado há 25min — relatório de $DIA não saiu"; exit 30; }

# Mac acordado enquanto isto roda (o keepawake das 07:56 pode não ter pegado).
/usr/bin/caffeinate -s -w $$ &

log "coletando $DIA (empresas 1 e 4)..."
if ! "$NODE" "$SCRIPTS/coleta_relatorio_vendedores.mjs" "$DIA" > "$DADOS.tmp"; then
  rm -f "$DADOS.tmp"
  avisar "coleta do ERP falhou para $DIA — ver /tmp/rel_vendedores_alerta.txt"
  log "coleta falhou"; exit 10
fi
mv "$DADOS.tmp" "$DADOS"
soltar_erp                      # libera o ERP: o envio não precisa mais dele

log "montando e enviando..."
if ! "$NODE" "$SCRIPTS/enviar_relatorio_vendedores.mjs" "$DADOS" $SO_TEXTO; then
  avisar "coleta OK mas o envio no WhatsApp falhou ($DIA) — mensagem pronta em $REPO/relatorio_vendedores_mensagem.txt"
  log "envio falhou"; exit 11
fi

[ -z "$SO_TEXTO" ] && echo "$DIA" >> "$ENVIADOS"
log "pronto"
