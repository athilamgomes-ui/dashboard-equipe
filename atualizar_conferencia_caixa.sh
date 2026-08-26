#!/bin/bash
# atualizar_conferencia_caixa.sh — pipeline DETERMINÍSTICO da Conferência de Caixa.
# Coleta (Playwright headless) → build (HTML cifrado) → commit/push GitHub Pages.
# Exit: 0=ok · 10=coleta falhou (preserva versão anterior) · 20=build falhou (restaura) · 30=lock.
#
# Rodar manualmente:  bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_conferencia_caixa.sh
# NUNCA chamar a skill agendada pelo nome numa sessão interativa — chame este .sh direto.
set -u
REPO="/Users/elkgomes/Desktop/claude/dashboard-equipe"
SCRIPTS="$REPO/scripts"
NODE="/opt/homebrew/bin/node"
LOCK="/tmp/conferencia_caixa_update.lock"
HTML="$REPO/conferencia_caixa.html"
RAW="$REPO/conferencia_caixa_raw.json"
log(){ echo "[conf-caixa $(date +%H:%M:%S)] $*"; }

# ── lock (evita corrida read-modify-write com outra execução) ──
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -d "$LOCK" ] && [ "$(find "$LOCK" -maxdepth 0 -mmin +90)" ]; then
    log "lock órfão (>90min) — removendo"; rm -rf "$LOCK"; mkdir "$LOCK"
  else
    log "já há execução em andamento (lock) — abortando"; exit 30
  fi
fi
trap 'soltar_erp; rm -rf "$LOCK"' EXIT
# ── trava compartilhada do perfil do Microvix (26/08/2026) ──────────────────
# ~20 scripts usam o mesmo ~/.claude/microvix-profile. Duas coletas ao mesmo tempo = a segunda
# não lê o api_token_lma, sai 10 e o painel PARA DE ATUALIZAR EM SILÊNCIO (aconteceu em 25/08
# com vendas e compras, que dispararam no mesmo minuto que a premiação).
source "$HOME/.claude/lib_lock_erp.sh"
travar_erp 12 || exit 30


# ── mantém o Mac acordado enquanto ESTE script roda ──
# O com.amgomes.keepawake dá caffeinate às 17:56 por 3h10, ou seja, até ~21:06. A rodada
# começa 20:40 e com as tentativas de repetição passa disso; sem esta linha o Mac dormia
# no meio e a coleta morria pela metade. Morre junto com o script (-w $$).
/usr/bin/caffeinate -s -w $$ &

# Aviso que NÃO depende de agente nenhum: falha de coleta tem que aparecer na hora.
# A regra do CLAUDE.md ("exit 10 = PushNotification") vivia no prompt da task agendada,
# então quando a rodada morria sem agente por perto ninguém ficava sabendo. Em 02, 03 e
# 04/08 o painel ficou quatro dias com dado velho em silêncio.
avisar(){
  printf '[conf-caixa %s] %s\n' "$(date '+%d/%m %H:%M')" "$1" > /tmp/conf_caixa_alerta.txt
  /usr/bin/osascript -e "display notification \"${1:0:220}\" with title \"⚠️ Conferência de Caixa NÃO atualizou\" sound name \"Basso\"" 2>/dev/null
}

# ── perfil do Microvix travado por chrome zumbi? (falha em cascata conhecida) ──
if pgrep -f chrome-headless-shell >/dev/null 2>&1; then
  if ! pgrep -f "coleta_conferencia_caixa" >/dev/null 2>&1; then
    log "AVISO: chrome-headless-shell rodando sem coleta nossa — outro job/sessão usa o perfil."
    log "       se a coleta falhar: pkill -f chrome-headless-shell && rm -f ~/.claude/microvix-profile/Singleton*"
  fi
fi

# ── SO_SE_VELHO=1: só roda se o dado ainda não é de hoje ──
# Usado pela segunda tentativa da noite (21:35). Quando a rodada das 20:40 deu certo, esta
# sai na hora sem tocar no ERP; quando falhou (ou o Mac estava dormindo / o Claude fechado),
# ela é a repescagem do dia. Sem isso, "atualização diária" dependia de uma única chance.
if [ "${SO_SE_VELHO:-0}" = "1" ]; then
  HOJE="$(date +%Y-%m-%d)"
  if RAWPATH="$RAW" $NODE -e '
      const r=require(process.env.RAWPATH);
      const d=new Date(r.geradoEm);
      const p=n=>String(n).padStart(2,"0");
      process.stdout.write(d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate()));
    ' 2>/dev/null | grep -q "$HOJE"; then
    log "dado já é de hoje — repescagem não precisa rodar."
    exit 0
  fi
  log "dado NÃO é de hoje — rodando a repescagem."
fi

cd "$SCRIPTS" || exit 20

# ── 1) Coleta (incremental: só dias novos + últimos 3 dias) ──
log "coletando conferência de caixa das 4 lojas..."
cp -f "$RAW" /tmp/conf_caixa_raw_bak.json 2>/dev/null

# ── até 3 tentativas, 5 min de intervalo ──
# A coleta é incremental (só dias que faltam), então repetir é barato e a segunda passada
# aproveita o que a primeira já gravou em cache. O motivo de existir: o ERP cai por alguns
# minutos e leva a rodada junto; sem repetição, uma queda de 20:45 custava o dia inteiro —
# e, como se viu em 02–04/08, dias seguidos.
COLETA_OK=0
for TENT in 1 2 3; do
  if $NODE coleta_conferencia_caixa.mjs 2>/tmp/conf_caixa_err.txt; then COLETA_OK=1; break; fi
  log "coleta falhou (tentativa $TENT/3): $(tail -1 /tmp/conf_caixa_err.txt | cut -c1-110)"
  [ "$TENT" -lt 3 ] && { log "aguardando 5min antes de tentar de novo..."; sleep 300; }
done
if [ "$COLETA_OK" != "1" ]; then
  log "ERRO: coleta falhou nas 3 tentativas — PRESERVANDO versão anterior do dashboard"
  tail -6 /tmp/conf_caixa_err.txt
  avisar "coleta falhou 3x — painel segue com o dado de $(date -r "$RAW" '+%d/%m %H:%M')"
  exit 10
fi
if [ ! -s "$RAW" ] || ! grep -q '"dias"' "$RAW"; then
  log "ERRO: conferencia_caixa_raw.json vazio/inválido — PRESERVANDO anterior"
  [ -f /tmp/conf_caixa_raw_bak.json ] && cp -f /tmp/conf_caixa_raw_bak.json "$RAW"
  avisar "arquivo de dados veio vazio/inválido — painel segue com o dado anterior"
  exit 10
fi
QTD=$(RAWPATH="$RAW" $NODE -e 'console.log(Object.keys(require(process.env.RAWPATH).dias).length)' 2>/dev/null || echo "?")
log "coleta OK ($QTD dias-loja)"

# ── 2) Build (único escritor do HTML; cifra com a senha do Keychain) ──
cd "$REPO" || exit 20
cp -f "$HTML" /tmp/conf_caixa_html_bak.html 2>/dev/null
log "build..."
if ! $NODE scripts/build_conferencia_caixa.mjs 2>/tmp/conf_caixa_build_err.txt; then
  log "ERRO no build — restaurando versão anterior"
  tail -6 /tmp/conf_caixa_build_err.txt
  avisar "o build falhou — painel restaurado para a versão anterior"
  [ -f /tmp/conf_caixa_html_bak.html ] && cp -f /tmp/conf_caixa_html_bak.html "$HTML"
  exit 20
fi

# ── 3) Sanidade: o HTML tem que estar CIFRADO (nunca vazar dado em claro no repo público) ──
if ! grep -q '"iters"' "$HTML"; then
  log "ERRO: HTML sem payload cifrado — restaurando e abortando (repo é público)"
  avisar "HTML saiu sem cifra — publicação abortada (o repo é público)"
  [ -f /tmp/conf_caixa_html_bak.html ] && cp -f /tmp/conf_caixa_html_bak.html "$HTML"
  exit 20
fi
if grep -qE '"login":\s*"[^"]' "$HTML"; then
  log "ERRO: nome de operador em texto puro no HTML — restaurando e abortando"
  avisar "nome de operador em texto puro no HTML — publicação abortada"
  [ -f /tmp/conf_caixa_html_bak.html ] && cp -f /tmp/conf_caixa_html_bak.html "$HTML"
  exit 20
fi

# ── 4) Commit + push (o .json cru NÃO vai pro repo — está no .gitignore) ──
if git diff --quiet -- conferencia_caixa.html index.html; then
  log "sem mudanças no dashboard — nada a commitar."
else
  git add conferencia_caixa.html index.html
  git commit -q -m "conferência de caixa: atualização $(date +%d/%m) $(date +%H:%M)"
  if git push origin main 2>/tmp/conf_caixa_push_err.txt; then
    log "push OK."
  else
    log "ERRO no push:"; tail -5 /tmp/conf_caixa_push_err.txt
    avisar "o push para o GitHub falhou — o painel publicado segue velho"
    exit 20
  fi
fi
rm -f /tmp/conf_caixa_alerta.txt
log "concluído."
