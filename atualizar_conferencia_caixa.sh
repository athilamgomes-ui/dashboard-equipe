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
trap 'rm -rf "$LOCK"' EXIT

# ── perfil do Microvix travado por chrome zumbi? (falha em cascata conhecida) ──
if pgrep -f chrome-headless-shell >/dev/null 2>&1; then
  if ! pgrep -f "coleta_conferencia_caixa" >/dev/null 2>&1; then
    log "AVISO: chrome-headless-shell rodando sem coleta nossa — outro job/sessão usa o perfil."
    log "       se a coleta falhar: pkill -f chrome-headless-shell && rm -f ~/.claude/microvix-profile/Singleton*"
  fi
fi

cd "$SCRIPTS" || exit 20

# ── 1) Coleta (incremental: só dias novos + últimos 3 dias) ──
log "coletando conferência de caixa das 4 lojas..."
cp -f "$RAW" /tmp/conf_caixa_raw_bak.json 2>/dev/null
if ! $NODE coleta_conferencia_caixa.mjs 2>/tmp/conf_caixa_err.txt; then
  log "ERRO: coleta falhou — PRESERVANDO versão anterior do dashboard"
  tail -6 /tmp/conf_caixa_err.txt
  exit 10
fi
if [ ! -s "$RAW" ] || ! grep -q '"dias"' "$RAW"; then
  log "ERRO: conferencia_caixa_raw.json vazio/inválido — PRESERVANDO anterior"
  [ -f /tmp/conf_caixa_raw_bak.json ] && cp -f /tmp/conf_caixa_raw_bak.json "$RAW"
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
  [ -f /tmp/conf_caixa_html_bak.html ] && cp -f /tmp/conf_caixa_html_bak.html "$HTML"
  exit 20
fi

# ── 3) Sanidade: o HTML tem que estar CIFRADO (nunca vazar dado em claro no repo público) ──
if ! grep -q '"iters"' "$HTML"; then
  log "ERRO: HTML sem payload cifrado — restaurando e abortando (repo é público)"
  [ -f /tmp/conf_caixa_html_bak.html ] && cp -f /tmp/conf_caixa_html_bak.html "$HTML"
  exit 20
fi
if grep -qE '"login":\s*"[^"]' "$HTML"; then
  log "ERRO: nome de operador em texto puro no HTML — restaurando e abortando"
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
    log "ERRO no push:"; tail -5 /tmp/conf_caixa_push_err.txt; exit 20
  fi
fi
log "concluído."
