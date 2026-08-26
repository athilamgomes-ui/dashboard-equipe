#!/usr/bin/env bash
# atualizar_premiacao.sh — pipeline DETERMINÍSTICO do dashboard de premiação A.M. Gomes.
# Coletas (Playwright headless: etapa1 vendas · cliente8 · etapa2 marcas A) + sync stores
# (etapa3) → build_premiacao.mjs (ÚNICO escritor dos 2 HTMLs) → sanity → commit/push.
# SEM LLM. Idempotente. Mesmo padrão do atualizar_amgomes.sh.
#
# Exit codes: 0=ok (inclui domingo/no-op) · 10=coleta falhou (preserva versão anterior)
#             · 20=build falhou (restaura backups) · 30=lock ativo
#
# O que fica FORA daqui (parte agêntica, ver SKILL.md do cron):
#   Etapa 5 (gerar sugestões novas, sáb 18h) · congelamento de semana fechada em
#   HISTORICO_PREMIOS · quizzes · rollover de mês (estrutura nova em DADOS).
set -uo pipefail

REPO="/Users/elkgomes/Desktop/claude/dashboard-equipe"
SCRIPTS="$REPO/scripts"
PAINEL="$REPO/dashboard_premiacao.html"
LOJAHTML="$REPO/loja.html"
PAINEL_ROOT="/Users/elkgomes/Desktop/claude/dashboard_premiacao.html"  # cópia espelho fora do repo
LOCK="/tmp/premiacao_update.lock"
log(){ echo "[atualizar-premiacao $(date +%H:%M:%S)] $*"; }

# ── Domingo: loja fechada, sem atualização (silencioso) ──
if [ "$(date +%u)" = "7" ]; then
  log "domingo — sem atualização."
  exit 0
fi

# ── Lock (mesmo /tmp/premiacao_update.lock do SKILL; trava velha >15min é removida) ──
if [ -d "$LOCK" ]; then
  AGE_MIN=$(( ( $(date +%s) - $(stat -f %m "$LOCK" 2>/dev/null || echo 0) ) / 60 ))
  if [ "$AGE_MIN" -gt 15 ]; then
    log "lock velho (${AGE_MIN}min) — execução anterior morreu; removendo."
    rmdir "$LOCK" 2>/dev/null || rm -rf "$LOCK"
  else
    log "LOCKED (${AGE_MIN}min) — outra execução em andamento. Abortando."
    exit 30
  fi
fi
mkdir "$LOCK" 2>/dev/null || { log "lock: corrida perdida. Abortando."; exit 30; }

# ── trava compartilhada do perfil do Microvix (26/08/2026) ───────────────────
# O lock acima só protege contra DUAS premiações. Em 25/08 a coleta das 22:41 rodou junto com
# o pipeline de estoque (22:10→04:05, mesmo ~/.claude/microvix-profile) e voltou parcial:
# L1 e L4 zeradas. O sanity check reverteu, mas o run foi perdido — e às 14:12 do mesmo dia
# aconteceu o mesmo com a L1. Agora a premiação espera o perfil ficar livre.
source "$HOME/.claude/lib_lock_erp.sh"
trap 'soltar_erp; rmdir "$LOCK" 2>/dev/null' EXIT
travar_erp 12 || { log "perfil do Microvix ocupado há 12min — abortando sem publicar."; exit 30; }

cd "$REPO" || { log "repo não encontrado"; exit 20; }

# ── Guarda de contexto: run anterior interrompido deixou HTML meio-editado? ──
if [ -d .git ] && ! git diff --quiet -- dashboard_premiacao.html loja.html 2>/dev/null; then
  log "AVISO: dashboard_premiacao.html/loja.html sujos no working tree (run anterior interrompido) — git checkout neles."
  git checkout -- dashboard_premiacao.html loja.html
fi

# ── Janelas do mês corrente (lidas do próprio painel: DADOS[mes].semanas.periodo) ──
node "$SCRIPTS/build_premiacao.mjs" --janelas > /tmp/premiacao_janelas.json 2>/tmp/premiacao_janelas_err.txt
RC=$?
if [ $RC -ne 0 ]; then
  tail -3 /tmp/premiacao_janelas_err.txt
  if [ "$RC" = "4" ]; then log "hoje fora de qualquer janela de semana — nada a fazer."; exit 0; fi
  log "ERRO: janelas indisponíveis (rc=$RC — mês sem estrutura? rollover é tarefa do agente)."
  exit 10
fi
E1ARG=$(node -pe "JSON.stringify(JSON.parse(require('fs').readFileSync('/tmp/premiacao_janelas.json','utf8')).etapa1_semanas)")
C8ARG=$(node -pe "JSON.stringify(JSON.parse(require('fs').readFileSync('/tmp/premiacao_janelas.json','utf8')).cliente8_semanas)")
SEMATUAL=$(node -pe "JSON.parse(require('fs').readFileSync('/tmp/premiacao_janelas.json','utf8')).semana_atual")
log "mês $(node -pe "JSON.parse(require('fs').readFileSync('/tmp/premiacao_janelas.json','utf8')).mesKey") · semana atual $SEMATUAL"

# ── Etapa 1: vendas por vendedora (retry 1x; exit 2 = credenciais → abortar) ──
E1_OK=0
for t in 1 2; do
  node "$SCRIPTS/cron_etapa1_vendas.mjs" "$E1ARG" > /tmp/premiacao_etapa1.json 2>/tmp/premiacao_etapa1_err.txt
  RC=$?
  if [ $RC -eq 0 ] && [ -s /tmp/premiacao_etapa1.json ]; then E1_OK=1; break; fi
  if [ $RC -eq 2 ]; then
    log "ERRO: credenciais Microvix inválidas (exit 2) — rodar setup_credenciais.mjs. PRESERVANDO versão anterior."
    tail -3 /tmp/premiacao_etapa1_err.txt
    exit 10
  fi
  log "Etapa 1 tentativa $t falhou (rc=$RC) — retry em 30s"; tail -2 /tmp/premiacao_etapa1_err.txt; sleep 30
done
if [ "$E1_OK" != "1" ]; then
  log "ERRO: Etapa 1 (vendas) falhou após retry — PRESERVANDO versão anterior (sem build/commit)."
  exit 10
fi
COLETADO_EM=$(date '+%d/%m/%Y %H:%M')   # hora REAL do fim da coleta → DADOS_COLETADO_EM
log "Etapa 1 OK (coletado em $COLETADO_EM)"

# ── Cliente 8 (venda entre lojas — subtrair do Outros). Falha ≠ fatal: sem subtração + aviso. ──
if ! node "$SCRIPTS/coleta_cliente8.mjs" "$C8ARG" 8 > /tmp/premiacao_cliente8.json 2>/tmp/premiacao_cliente8_err.txt; then
  log "AVISO: coleta do cliente 8 falhou — seguindo SEM subtração (autocorrige no próximo run)."
  echo '{}' > /tmp/premiacao_cliente8.json
fi

# ── Prep + sanity da coleta (4 lojas presentes; monta totais pra Etapa 2) ──
if ! node "$SCRIPTS/build_premiacao.mjs" --prep-etapa2 /tmp/premiacao_etapa1.json /tmp/premiacao_cliente8.json \
     > /tmp/premiacao_prep.json 2>/tmp/premiacao_prep_err.txt; then
  log "ERRO: sanity da coleta falhou (lojas ausentes) — PRESERVANDO versão anterior."
  tail -3 /tmp/premiacao_prep_err.txt
  exit 10
fi
SEM2=$(node -pe "JSON.stringify(JSON.parse(require('fs').readFileSync('/tmp/premiacao_prep.json','utf8')).semanas)")
TOT2=$(node -pe "JSON.stringify(JSON.parse(require('fs').readFileSync('/tmp/premiacao_prep.json','utf8')).totais)")

# ── Etapa 2: % marcas A (semana atual + MES). Falha ≠ fatal: build preserva valores anteriores. ──
E2_OK=0
for t in 1 2; do
  if node "$SCRIPTS/cron_etapa2_marcas_a.mjs" "$SEM2" "$TOT2" > /tmp/premiacao_etapa2.json 2>/tmp/premiacao_etapa2_err.txt \
     && [ -s /tmp/premiacao_etapa2.json ]; then E2_OK=1; break; fi
  log "Etapa 2 tentativa $t falhou — retry em 30s"; tail -2 /tmp/premiacao_etapa2_err.txt; sleep 30
done
[ "$E2_OK" = "1" ] && log "Etapa 2 OK" || { log "AVISO: Etapa 2 falhou — marcas A anteriores serão PRESERVADAS."; echo '{}' > /tmp/premiacao_etapa2.json; }

# ── Etapa 3: sync dos stores (Worker+Supabase). Falha ≠ fatal: pulada nesta execução. ──
E3_OK=0
for t in 1 2; do
  if node "$SCRIPTS/sync_premiacao_stores.mjs" > /tmp/premiacao_etapa3.json 2>/tmp/premiacao_etapa3_err.txt \
     && [ -s /tmp/premiacao_etapa3.json ]; then E3_OK=1; break; fi
  log "Etapa 3 tentativa $t falhou — retry em 15s"; sleep 15
done
[ "$E3_OK" = "1" ] && log "Etapa 3 OK" || { log "AVISO: Etapa 3 pulada (stores inacessíveis) — dados seguem nos stores pro próximo run."; echo '{}' > /tmp/premiacao_etapa3.json; }

# ── Build (render determinístico nos 2 HTMLs) ──
cp "$PAINEL" /tmp/premiacao_pre_build_painel.html
cp "$LOJAHTML" /tmp/premiacao_pre_build_loja.html
if ! node "$SCRIPTS/build_premiacao.mjs" --render \
     /tmp/premiacao_etapa1.json /tmp/premiacao_etapa2.json /tmp/premiacao_etapa3.json \
     /tmp/premiacao_cliente8.json "$COLETADO_EM"; then
  log "ERRO: build falhou — restaurando os dois HTMLs e abortando."
  cp /tmp/premiacao_pre_build_painel.html "$PAINEL"
  cp /tmp/premiacao_pre_build_loja.html "$LOJAHTML"
  exit 20
fi

# ── Sanity pós-build: vírgula dupla + maior <script> compila ──
if grep -q '},,' "$PAINEL" "$LOJAHTML"; then
  log "ERRO: '},,'' encontrado pós-build — restaurando e abortando."
  cp /tmp/premiacao_pre_build_painel.html "$PAINEL"; cp /tmp/premiacao_pre_build_loja.html "$LOJAHTML"
  exit 20
fi
for F in "$PAINEL" "$LOJAHTML"; do
  if ! node --check <(python3 -c "
import re;h=open('$F').read()
print(max(re.findall(r'<script>(.*?)</script>',h,re.S),key=len))
") 2>/tmp/premiacao_jscheck_err.txt; then
    log "ERRO: JS inválido em $F pós-build — restaurando e abortando."
    tail -3 /tmp/premiacao_jscheck_err.txt
    cp /tmp/premiacao_pre_build_painel.html "$PAINEL"; cp /tmp/premiacao_pre_build_loja.html "$LOJAHTML"
    exit 20
  fi
done

# ── Commit + push ──
RESUMO=$(head -1 /tmp/premiacao_build_resumo.txt 2>/dev/null || echo "")
if [ -d .git ]; then
  if git diff --quiet -- dashboard_premiacao.html loja.html avaliacoes_premiacao.json; then
    log "sem mudanças — nada a commitar."
  else
    git add dashboard_premiacao.html loja.html avaliacoes_premiacao.json
    MSG="update premiação $(date +%H:%M) — $RESUMO"
    [ -s /tmp/premiacao_build_warns.txt ] && MSG="$MSG
AVISOS: $(cat /tmp/premiacao_build_warns.txt)"
    git commit -q -m "$MSG

(pipeline determinístico atualizar_premiacao.sh/build_premiacao.mjs)"
    if git push origin main 2>/tmp/premiacao_push_err.txt; then
      log "push OK."
    else
      log "ERRO no push:"; tail -3 /tmp/premiacao_push_err.txt
    fi
  fi
fi

# ── Espelho fora do repo (SKILL: "atualizar AMBOS" — cópia do Desktop) ──
[ -f "$PAINEL_ROOT" ] && cp "$PAINEL" "$PAINEL_ROOT" && log "cópia espelho atualizada ($PAINEL_ROOT)."

log "concluído. $RESUMO"
[ -s /tmp/premiacao_build_warns.txt ] && { log "AVISOS do build:"; cat /tmp/premiacao_build_warns.txt; }
exit 0
