#!/usr/bin/env node
/**
 * aplica_contagem_estoque.mjs — aplica no ERP as contagens conferidas no painel de estoque.
 *
 * ⚠️ ESCREVE EM PRODUÇÃO. A quantidade vem do que a PESSOA digitou na tela (tabela Supabase
 * `estoque_contagem`), nunca de inferência do agente.
 *
 * Dois ritmos, como o Athila pediu:
 *   --urgentes   → só as linhas marcadas urgente=true (é o que o watcher do botão ⚡ dispara)
 *   (sem flag)   → o lote inteiro que está `na_fila` (uso semanal)
 *
 * Fluxo: pega status='na_fila' → aplica loja por loja (núcleo compartilhado, com trava de empresa)
 *        → grava log append-only em dados_estoque/ajustes_saldo.json → marca 'aplicado'/'erro'
 *        no Supabase com saldo de antes e depois.
 *
 * Uso:  node aplica_contagem_estoque.mjs --dry-run
 *       node aplica_contagem_estoque.mjs --urgentes
 *       node aplica_contagem_estoque.mjs
 * Exit: 0 ok · 1 falha · 2 creds/login · 3 nada na fila
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import { aplicarLoja, LOJA_TO_EMP } from "./estoque_ajuste_core.mjs";
import { garantirSessao } from "./microvix_auth.mjs";

const SUPABASE_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");
const DRY = process.argv.includes("--dry-run");
const SO_URGENTES = process.argv.includes("--urgentes");
const log = m => process.stderr.write(`[aplica-contagem] ${m}\n`);

async function fila() {
  const q = `${SUPABASE_URL}/rest/v1/estoque_contagem?status=eq.na_fila${SO_URGENTES ? "&urgente=eq.true" : ""}&select=*&order=loja,cod`;
  const r = await fetch(q, { headers: HEADERS });
  if (!r.ok) throw new Error(`supabase ${r.status} — a tabela existe? rode scripts/estoque_supabase.sql`);
  return await r.json();
}
async function marcar(id, campos) {
  await fetch(`${SUPABASE_URL}/rest/v1/estoque_contagem?id=eq.${id}`, {
    method: "PATCH", headers: HEADERS, body: JSON.stringify(campos),
  }).catch(e => log(`  aviso: não consegui marcar id=${id}: ${e.message}`));
}

const linhas = await fila();
if (!linhas.length) { log(`nada na fila${SO_URGENTES ? " (urgentes)" : ""}`); process.exit(3); }
const porLoja = {};
for (const l of linhas) {
  if (!LOJA_TO_EMP[l.loja]) { log(`loja inválida na fila: ${l.loja} (id=${l.id}) — ignorada`); continue; }
  (porLoja[l.loja] = porLoja[l.loja] || []).push({
    loja: l.loja, cod: String(l.cod), desc: l.descricao || "", novo_saldo: Number(l.qtd_real),
    grupo: `contagem:${l.origem}`, ref: l.id,
    motivo: `contagem conferida no painel ${new Date(l.conferido_em).toLocaleDateString("pt-BR")}${l.conferido_por ? " por " + l.conferido_por : ""}`,
  });
}
log(`fila: ${linhas.length} produtos em ${Object.keys(porLoja).length} loja(s)${DRY ? " · DRY-RUN" : ""}`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`garantirSessao falhou: ${e.message}`); await ctx.close().catch(() => {}); process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1); }

let tOk = 0, tErro = 0, tPul = 0;
try {
  // uma loja por vez — a trava de empresa está no núcleo
  for (const [loja, itens] of Object.entries(porLoja)) {
    const r = await aplicarLoja(ctx, page, loja, itens, {
      dry: DRY, log,
      onItem: async reg => {
        if (DRY || reg.ref == null) return;
        await marcar(reg.ref, reg.ok
          ? { status: "aplicado", aplicado_em: new Date().toISOString(), saldo_anterior: reg.saldo_anterior, saldo_confirmado: reg.saldo_confirmado, erro: null }
          : { status: "erro", aplicado_em: new Date().toISOString(), saldo_anterior: reg.saldo_anterior, erro: (reg.falha || `ERP ficou ${reg.saldo_confirmado}`).slice(0, 200) });
      },
    });
    tOk += r.ok; tErro += r.erro; tPul += r.pulado;
  }
  log(`FIM · ${tOk} aplicados · ${tPul} pulados · ${tErro} erros`);
  await ctx.close().catch(() => {});
  process.exit(tErro ? 1 : 0);
} catch (e) {
  log(`FALHA: ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(1);
}
