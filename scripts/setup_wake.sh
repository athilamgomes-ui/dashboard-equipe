#!/bin/bash
# setup_wake.sh
#
# Agenda o Mac pra acordar todo dia 07:50 (antes do plist do dashboard às 07:55).
# Garante que o cron das 8h sempre rode, mesmo se o Mac dormiu na noite anterior.
#
# RODAR UMA VEZ (vai pedir senha do macOS):
#   bash scripts/setup_wake.sh
#
# Pra ver schedule atual:
#   pmset -g sched
#
# Pra cancelar:
#   sudo pmset repeat cancel
#
# Limitação do pmset: só aceita 1 wake schedule por dia. Por isso o wake é
# matinal (07:50). Crons das 12/15/18 só rodam se o Mac continuar acordado
# durante o dia (ou for usado de novo).
set -e

echo "=== Setup pmset wake — 07:50 todos os dias ==="
echo ""
sudo pmset repeat wakeorpoweron MTWRFSU 07:50:00
echo ""
echo "OK. Schedule atual:"
pmset -g sched
