#!/usr/bin/env node
/**
 * watch_estoque_trigger.mjs — atende o botão "⚡ Aplicar contagem agora" do painel de estoque.
 *
 * O painel é página estática (GitHub Pages) e não roda Playwright. Este processo fica sempre
 * ligado neste Mac (launchd KeepAlive) e vigia a tabela `estoque_trigger` (linha única id=1).
 * Ao ver pedido novo, roda `aplica_contagem_estoque.mjs --urgentes` e marca atendido_em.
 *
 * ⚠️ Só aplica o que a PESSOA digitou e enfileirou (status='na_fila' e urgente=true). O lote
 * grande, sem urgência, fica para o comando semanal — foi a escolha do Athila (os dois ritmos).
 * ⚠️ Reusa o lock da precificação: nunca escreve no ERP em paralelo com uma coleta.
 */
import { execSync } from "node:child_process";
import { statSync, rmSync, mkdirSync } from "node:fs";

const SUPABASE_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const LOCKDIR = "/tmp/precificacao_update.lock.d";
const SCRIPTS = "/Users/elkgomes/Desktop/claude/dashboard-equipe/scripts";
const POLL_MS = 20000;
const log = m => process.stderr.write(`[watch-estoque] ${new Date().toISOString()} ${m}\n`);

async function ler() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/estoque_trigger?id=eq.1&select=solicitado_em,atendido_em`, { headers: HEADERS });
  if (!r.ok) throw new Error(r.status === 404 || r.status === 400 ? "TABELA_INEXISTENTE" : "supabase " + r.status);
  return (await r.json())[0] || null;
}
const marcar = () => fetch(`${SUPABASE_URL}/rest/v1/estoque_trigger?id=eq.1`, {
  method: "PATCH", headers: HEADERS, body: JSON.stringify({ atendido_em: new Date().toISOString() }),
});
const pendente = row => !!row?.solicitado_em && (!row.atendido_em || Date.parse(row.solicitado_em) > Date.parse(row.atendido_em));

let avisouTabela = false;
log("vigiando estoque_trigger...");
for (;;) {
  try {
    const row = await ler();
    if (pendente(row)) {
      log("pedido novo — aplicando contagens urgentes");
      // lock órfão > 30 min é limpo (mesma convenção da precificação)
      try { if (Date.now() - statSync(LOCKDIR).mtimeMs > 30 * 60000) rmSync(LOCKDIR, { recursive: true, force: true }); } catch {}
      let travou = false;
      try { mkdirSync(LOCKDIR); travou = true; } catch { log("perfil do Microvix ocupado — tento no próximo ciclo"); }
      if (travou) {
        try {
          execSync(`node ${SCRIPTS}/aplica_contagem_estoque.mjs --urgentes`, { stdio: "inherit", timeout: 30 * 60000 });
        } catch (e) {
          log(`aplicação terminou com erro: ${String(e.message).slice(0, 120)}`);
        } finally {
          try { rmSync(LOCKDIR, { recursive: true, force: true }); } catch {}
        }
        await marcar();
        log("pedido atendido.");
      }
    }
  } catch (e) {
    if (String(e.message) === "TABELA_INEXISTENTE") {
      if (!avisouTabela) { log("tabela estoque_trigger não existe — rode scripts/estoque_supabase.sql no Supabase"); avisouTabela = true; }
    } else log(`erro no ciclo: ${String(e.message).slice(0, 120)}`);
  }
  await new Promise(r => setTimeout(r, POLL_MS));
}
