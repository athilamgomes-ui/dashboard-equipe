#!/usr/bin/env bash
# lote_custos.sh — aplica o plano de custo de uma loja, um produto por vez, com trilha.
#
# MODO A (decidido com o Athila em 27/08/2026): grava só o CUSTO, sem markup.
# O preço do CADASTRO se recalcula — e na prática ele CONVERGE para o preço certo, porque
# nesses produtos o markup já estava correto e só o custo era o da embalagem. Medido:
#     62464  preço cadastro 442,80 → 36,89   (Tabela Altamira: 36,90)
#     29636  preço cadastro  58,80 →  4,90   (Tabela Altamira:  4,90)
# O preço que a loja pratica vem da tabela da praça e NÃO é tocado por esta tela — conferir
# com precos_tabela.mjs antes e depois do lote (é o portão de segurança do lote).
#
# ⚠️ PARA A EXECUÇÃO INTEIRA se um produto abortar (grade com mais de uma linha, campo ausente).
#    Erro de estrutura significa que a tela mudou, e aí nada mais deve ser gravado às cegas.
#
# Uso:  bash scripts/lote_custos.sh <plano.json> <loja> [inicio] [fim]
#       bash scripts/lote_custos.sh dados_estoque/plano_custos_L1.json L1 6 78
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
PLANO="${1:?informe o arquivo de plano}"
LOJA="${2:?informe a loja}"
DE="${3:-1}"; ATE="${4:-9999}"

/usr/bin/python3 - "$PLANO" "$DE" "$ATE" <<'PY' > /tmp/lote_custos_itens.txt
import json, sys
p = json.load(open(sys.argv[1]))
de, ate = int(sys.argv[2]), int(sys.argv[3])
def br(v, d=2): return f"{v:,.{d}f}".replace(",", "\x00").replace(".", ",").replace("\x00", ".")
for i, x in enumerate(p, 1):
    if de <= i <= ate:
        print(f"{i}|{x['cod']}|{br(x['custo_novo'])}|{x['desc'][:34]}|{br(x['economia'])}")
PY

TOTAL=$(wc -l < /tmp/lote_custos_itens.txt | tr -d ' ')
echo "=== lote: $TOTAL produtos da $LOJA (itens $DE a $ATE do plano) ==="
ok=0; falha=0
while IFS='|' read -r i cod custo desc econ; do
  echo "───── [$i] $cod  $desc  → custo $custo  (estoque −$econ)"
  saida=$(node scripts/ajusta_custo_cadastro.mjs "$LOJA" "$cod" "$custo" --gravar 2>&1)
  echo "$saida" | grep -E "custo=|preço do cadastro|✅|❌|ABORTADO"
  if echo "$saida" | grep -q "ABORTADO"; then
    echo "🔴 ABORTOU no $cod — PARANDO O LOTE INTEIRO. Nada mais será gravado."
    exit 20
  fi
  if echo "$saida" | grep -q "✅"; then ok=$((ok+1)); else falha=$((falha+1)); fi
done < /tmp/lote_custos_itens.txt
echo "=== FIM_LOTE · $ok confirmados · $falha não confirmados ==="
