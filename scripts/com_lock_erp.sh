#!/usr/bin/env bash
# com_lock_erp.sh — roda qualquer comando de ERP segurando a trava compartilhada do Microvix.
#
# POR QUE (27/08/2026): os pipelines agendados já pegam /tmp/precificacao_update.lock.d desde
# 26/08, mas as consultas AVULSAS (ficha_produto, inventario_marca, coleta_estoque_entradas
# rodados na mão) não pegavam nada. Resultado: o cron da precificação — que roda de 15 em 15
# minutos, seg-sáb 08:00–19:45 — abre o mesmo ~/.claude/microvix-profile e derruba o navegador
# no meio da consulta ("Target page, context or browser has been closed").
#
# Uso:  bash scripts/com_lock_erp.sh node scripts/coleta_estoque_entradas.mjs 2023-01-01 L5
set -uo pipefail
source "$HOME/.claude/lib_lock_erp.sh"
trap 'soltar_erp' EXIT
travar_erp "${LOCK_MIN:-15}" || { echo "[com-lock] perfil do Microvix ocupado — não vou brigar pelo perfil."; exit 30; }
echo "[com-lock] trava obtida — rodando: $*"
"$@"
rc=$?
echo "[com-lock] fim (rc=$rc)"
exit $rc
