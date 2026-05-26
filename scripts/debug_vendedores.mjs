#!/usr/bin/env node
/**
 * Debug: lista TODOS os vendedores da API Microvix em S1 (02-10/05/2026)
 * pra cada loja, sem filtro canônico.
 */
import { chromium } from "playwright";
import { homedir } from "os";
import { join } from "path";
import { garantirSessao } from "/Users/elkgomes/Desktop/claude/dashboard-equipe/scripts/microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const LOJA_POR_EMPRESA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: true,
  viewport: { width: 1280, height: 800 },
});
const page = ctx.pages()[0] || (await ctx.newPage());
await garantirSessao(page, { log: (m) => process.stderr.write(`[auth] ${m}\n`) });

await page.addScriptTag({
  path: "/Users/elkgomes/Desktop/claude/dashboard-equipe/scripts/fetch_vendas_microvix.js",
});

const out = {};
for (const emp of [1, 3, 4, 10]) {
  const loja = LOJA_POR_EMPRESA[emp];
  const rows = await page.evaluate(
    async ({ emp, di, df }) => await window.fetchPerformance(emp, di, df),
    { emp, di: "02/05/2026", df: "10/05/2026" }
  );
  out[loja] = rows.map((r) => ({
    nome: r.nome_vendedor,
    valor: parseFloat(String(r.vlr_vendas).replace(",", ".")),
  })).sort((a, b) => b.valor - a.valor);
}
process.stdout.write(JSON.stringify(out, null, 2));
await ctx.close();
