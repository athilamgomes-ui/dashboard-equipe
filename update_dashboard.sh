#!/bin/bash
# ============================================================
# Dashboard Grupo A.M. Gomes — Atualização Automática
# Roda via LaunchAgent: 9h, 13h e 18h (Seg–Sáb)
# ============================================================

LOG="/Users/elkgomes/Desktop/claude/dashboard_update.log"
PROMPT_FILE="/Users/elkgomes/Desktop/claude/dashboard_prompt.txt"

echo "" >> "$LOG"
echo "============================================" >> "$LOG"
echo "[$(date '+%d/%m/%Y %H:%M:%S')] Iniciando atualização..." >> "$LOG"

# Encontra o binário claude mais recente (suporta futuras atualizações de versão)
CLAUDE_BIN=$(ls -d "/Users/elkgomes/Library/Application Support/Claude/claude-code/"*/claude.app/Contents/MacOS/claude 2>/dev/null | sort -V | tail -1)

if [ -z "$CLAUDE_BIN" ] || [ ! -x "$CLAUDE_BIN" ]; then
    echo "[$(date '+%d/%m/%Y %H:%M:%S')] ERRO: binário claude não encontrado." >> "$LOG"
    osascript -e 'display notification "Dashboard não atualizado — claude não encontrado" with title "Grupo A.M. Gomes" sound name "Basso"' 2>/dev/null
    exit 1
fi

echo "[$(date '+%d/%m/%Y %H:%M:%S')] Usando: $CLAUDE_BIN" >> "$LOG"

# Lê o prompt e substitui a data de hoje
PROMPT=$(sed "s/{{DATA_HOJE}}/$(date '+%d\/%m\/%Y')/g" "$PROMPT_FILE")

# Executa claude em modo não-interativo
"$CLAUDE_BIN" --print "$PROMPT" >> "$LOG" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date '+%d/%m/%Y %H:%M:%S')] Atualização concluída com sucesso." >> "$LOG"
    osascript -e 'display notification "Dashboard atualizado com sucesso" with title "Grupo A.M. Gomes" sound name "Glass"' 2>/dev/null
else
    echo "[$(date '+%d/%m/%Y %H:%M:%S')] ERRO ao executar claude (código $EXIT_CODE)." >> "$LOG"
    osascript -e 'display notification "Erro ao atualizar dashboard — verifique o log" with title "Grupo A.M. Gomes" sound name "Basso"' 2>/dev/null
fi
