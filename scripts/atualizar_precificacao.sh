#!/bin/bash
# atualizar_precificacao.sh — coleta de precificação + commit/push do precificacao_dados.json.
# Roda agendado (launchd) p/ manter os dados frescos e permitir a reassociação ("🔄 Atualizar associação").
# Lock impede execuções concorrentes. Exit 10 do coletor (0 NFes) = preserva o arquivo anterior (não publica).
# Pin: se existir o arquivo .precificacao_nf com um número de NF, coleta SÓ essa NF (modo teste);
#      senão, coleta o modo normal (pedidos ENTREGUE dos últimos dias).
set -u
REPO="/Users/elkgomes/Desktop/claude/dashboard-equipe"
SCRIPTS="$REPO/scripts"
NODE="/opt/homebrew/bin/node"
LOCKDIR="/tmp/precificacao_update.lock.d"
PINFILE="$REPO/.precificacao_nf"
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# lock atômico via mkdir (flock não existe no macOS). Limpa lock órfão > 30min.
if [ -d "$LOCKDIR" ]; then
  if [ -n "$(find "$LOCKDIR" -prune -mmin +30 2>/dev/null)" ]; then rmdir "$LOCKDIR" 2>/dev/null; fi
fi
if ! mkdir "$LOCKDIR" 2>/dev/null; then echo "[$(date '+%F %T')] já em execução — pulando"; exit 30; fi
trap 'rmdir "$LOCKDIR" 2>/dev/null' EXIT

cd "$SCRIPTS" || exit 1
NFENV=""
if [ -f "$PINFILE" ]; then NFENV="NF=$(tr -d '[:space:]' < "$PINFILE")"; echo "[$(date '+%F %T')] modo PIN ($NFENV)"; fi

echo "[$(date '+%F %T')] coletando precificação..."
env $NFENV "$NODE" coleta_precificacao.mjs; rc=$?
if [ "$rc" -eq 10 ]; then echo "[$(date '+%F %T')] 0 NFes — preservado, sem publicar"; exit 0; fi
if [ "$rc" -ne 0 ]; then echo "[$(date '+%F %T')] coleta falhou (rc=$rc) — não publica"; exit "$rc"; fi

cd "$REPO" || exit 1
if git diff --quiet -- precificacao_dados.json; then
  echo "[$(date '+%F %T')] sem mudança no precificacao_dados.json — nada a publicar"; exit 0
fi
git add precificacao_dados.json
git commit -q -m "precificacao: dados atualizados (coleta agendada)" && git push -q origin main
echo "[$(date '+%F %T')] publicado precificacao_dados.json"
