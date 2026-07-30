#!/usr/bin/env node
/*
 * WATCHER do botão "⚡ Atualizar agora" do Painel Financeiro (28/07/2026).
 * A tela é ESTÁTICA (GitHub Pages) e não roda Playwright — este processo fica SEMPRE rodando
 * neste Mac (launchd KeepAlive) e checa a cada POLL_MS a tabela Supabase financeiro_trigger (id=1),
 * onde o botão grava um pedido (solicitado_em). Ao ver pedido novo (solicitado_em > atendido_em),
 * roda AGORA o pipeline atualizar_financeiro.sh e marca atendido_em=agora.
 *
 * Requer a tabela existir (rodar 1x financeiro_trigger.sql). Reusa o MESMO lock do pipeline
 * (/tmp/financeiro_update.lock) — nunca roda em paralelo com o cron das 19:55.
 */
import { execSync } from "node:child_process";
import { statSync } from "node:fs";

const SUPABASE_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const LOCK = "/tmp/financeiro_update.lock"; // mesmo lock (mkdir) do atualizar_financeiro.sh
const SH = "/Users/elkgomes/Desktop/claude/financeiro/atualizar_financeiro.sh";
const POLL_MS = 20000;
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const log = m => process.stderr.write(`[watch-fin] ${new Date().toISOString()} ${m}\n`);

async function lerPedido() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/financeiro_trigger?id=eq.1&select=solicitado_em,atendido_em`, { headers: H });
  if (!r.ok) { if (r.status === 404 || r.status === 400) throw new Error("TABELA_INEXISTENTE"); throw new Error("supabase " + r.status); }
  return (await r.json())[0] || null;
}
async function marcarAtendido() {
  await fetch(`${SUPABASE_URL}/rest/v1/financeiro_trigger?id=eq.1`, { method: "PATCH", headers: H, body: JSON.stringify({ atendido_em: new Date().toISOString() }) });
}
const pendente = r => r && r.solicitado_em && (!r.atendido_em || Date.parse(r.solicitado_em) > Date.parse(r.atendido_em));
function lockAtivo() { try { return Date.now() - statSync(LOCK).mtimeMs < 30 * 60000; } catch { return false; } }

let avisou = false;
log("iniciado — checando pedidos a cada " + POLL_MS / 1000 + "s");
for (;;) {
  try {
    const row = await lerPedido();
    if (pendente(row)) {
      if (lockAtivo()) log("pedido pendente, mas pipeline já rodando (lock) — tenta depois");
      else {
        log("pedido recebido — rodando atualizar_financeiro.sh AGORA");
        let ok = false;
        for (let tent = 1; tent <= 2 && !ok; tent++) {
          try { execSync(`/bin/bash ${SH}`, { stdio: "pipe", timeout: 20 * 60000 }); ok = true; log(`pipeline OK (tentativa ${tent}) — painel publicado`); }
          catch (e) {
            const rc = e.status;
            log(`pipeline rc=${rc} (tentativa ${tent}): ${String(e.message || e).split("\n")[0]}`);
            // rc 10 = coleta falhou (provável perfil Microvix ocupado pela precificação) → espera e tenta 1x
            if (tent === 1 && rc === 10) { log("perfil provavelmente ocupado — aguardando 120s p/ retry"); await new Promise(r => setTimeout(r, 120000)); }
            else break;
          }
        }
        await marcarAtendido();
        log("pedido atendido");
      }
    }
    avisou = false;
  } catch (e) {
    if (String(e.message) === "TABELA_INEXISTENTE") { if (!avisou) { log("⚠️ tabela financeiro_trigger não existe — rode financeiro_trigger.sql 1x. Continuo tentando."); avisou = true; } }
    else log("erro: " + String(e.message || e).split("\n")[0]);
  }
  await new Promise(r => setTimeout(r, POLL_MS));
}
