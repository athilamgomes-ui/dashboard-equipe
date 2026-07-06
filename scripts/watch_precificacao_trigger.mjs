#!/usr/bin/env node
/*
 * WATCHER DE ATUALIZAÇÃO INSTANTÂNEA (06/07/2026).
 * A tela de precificação é uma página ESTÁTICA (GitHub Pages) — não consegue rodar o Playwright
 * sozinha. Este processo fica RODANDO SEMPRE neste Mac (launchd KeepAlive) e checa a cada
 * POLL_MS uma tabela no Supabase ("precificacao_trigger", linha única id=1) onde o botão
 * "⚡ Atualizar NFes agora" grava um pedido (solicitado_em). Ao ver um pedido novo (solicitado_em
 * mais recente que atendido_em), roda AGORA coleta_nfes_erp.mjs (pega data_lcto fresco — sem isso
 * uma NF que acabou de entrar não teria evidência de entrada recente) e coleta_precificacao.mjs
 * (publica no GitHub Pages), depois marca atendido_em=agora.
 *
 * Requer a tabela existir no Supabase (o usuário roda 1x o SQL em precificacao_trigger.sql).
 * Reusa o MESMO lock dos jobs agendados (mkdir) p/ nunca rodar em paralelo com o cron de 15 min.
 */
import { execSync } from "node:child_process";
import { statSync, rmSync, mkdirSync } from "node:fs";

const SUPABASE_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const LOCKDIR = "/tmp/precificacao_update.lock.d"; // mesmo lock do coleta_precificacao.mjs em modo CRON
const REPO_SCRIPTS = "/Users/elkgomes/Desktop/claude/dashboard-equipe/scripts";
const POLL_MS = 20000;
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const log = m => process.stderr.write(`[watch-trigger] ${new Date().toISOString()} ${m}\n`);

async function lerPedido() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/precificacao_trigger?id=eq.1&select=solicitado_em,atendido_em`, { headers: HEADERS });
  if (!r.ok) { if (r.status === 404 || r.status === 400) throw new Error("TABELA_INEXISTENTE"); throw new Error("supabase " + r.status); }
  const rows = await r.json();
  return rows[0] || null;
}
async function marcarAtendido() {
  await fetch(`${SUPABASE_URL}/rest/v1/precificacao_trigger?id=eq.1`, {
    method: "PATCH", headers: HEADERS, body: JSON.stringify({ atendido_em: new Date().toISOString() }),
  });
}
function pendente(row) {
  if (!row || !row.solicitado_em) return false;
  if (!row.atendido_em) return true;
  return Date.parse(row.solicitado_em) > Date.parse(row.atendido_em);
}
function jaEmExecucao() {
  try { if (Date.now() - statSync(LOCKDIR).mtimeMs > 30 * 60000) { rmSync(LOCKDIR, { recursive: true, force: true }); return false; } return true; }
  catch { return false; }
}

let avisouTabelaInexistente = false;
log("iniciado — checando pedidos de atualização a cada " + (POLL_MS / 1000) + "s");
for (;;) {
  try {
    const row = await lerPedido();
    if (pendente(row)) {
      if (jaEmExecucao()) { log("pedido pendente, mas já há uma coleta rodando (lock) — tenta na próxima checagem"); }
      else {
        log("pedido de atualização recebido — rodando coleta AGORA");
        try {
          execSync("/opt/homebrew/bin/node coleta_nfes_erp.mjs", { cwd: REPO_SCRIPTS, stdio: "pipe" });
          log("coleta_nfes_erp OK");
        } catch (e) { log("coleta_nfes_erp falhou: " + String(e.message || e).split("\n")[0]); }
        try {
          execSync("PUSH=1 /opt/homebrew/bin/node coleta_precificacao.mjs", { cwd: REPO_SCRIPTS, stdio: "pipe" });
          log("coleta_precificacao OK — publicado");
        } catch (e) { log("coleta_precificacao falhou: " + String(e.message || e).split("\n")[0]); }
        await marcarAtendido();
        log("pedido atendido");
      }
    }
    avisouTabelaInexistente = false;
  } catch (e) {
    if (String(e.message) === "TABELA_INEXISTENTE") {
      if (!avisouTabelaInexistente) { log("⚠️ tabela precificacao_trigger não existe no Supabase ainda — rode o SQL de precificacao_trigger.sql uma vez. Vou continuar tentando."); avisouTabelaInexistente = true; }
    } else log("erro checando pedido: " + String(e.message || e).split("\n")[0]);
  }
  await new Promise(r => setTimeout(r, POLL_MS));
}
