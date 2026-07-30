#!/usr/bin/env node
// Consulta EXATA por EAN via Lista de Preços filtrada por marca (código ERP conhecido).
// Read-only. Usa a mesma lógica de relatorioPrecosErp do coleta_precificacao.mjs.
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_LISTA_PRECOS = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_lista_precos.asp";
const log = m => process.stderr.write(`[lookup] ${m}\n`);

async function gotoRetry(page, url, { tentativas = 3, timeout = 45000 } = {}) {
  let err;
  for (let i = 0; i < tentativas; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout }); return; }
    catch (e) { err = e; log(`goto falhou (${i + 1}): ${String(e.message).split("\n")[0]}`); await page.waitForTimeout(4000); }
  }
  throw err;
}

async function relatorioPrecosErp(page, empresa, marcaCodes) {
  let melhor = { rows: [] };
  for (let tent = 1; tent <= 5; tent++) {
    await gotoRetry(page, URL_LISTA_PRECOS);
    await page.waitForSelector("#empresas_" + empresa, { timeout: 20000 });
    await page.waitForTimeout(1000);
    const ajChecked = await page.evaluate(() => !!document.getElementById("ajuste_precos")?.checked);
    if (!ajChecked) { await page.click("#ajuste_precos").catch(() => {}); await page.waitForTimeout(700); }
    const incluirInativos = tent >= 3;
    await page.evaluate(({ empresa, marcaCodes, incluirInativos }) => {
      [1, 3, 4, 9, 10, 11].forEach(i => { const e = document.getElementById("empresas_" + i); if (e) e.checked = (i === empresa); });
      document.querySelectorAll("input[name=visao]").forEach(r => r.checked = (r.value === "A"));
      const a = document.getElementById("ativa"); if (a) a.checked = true;
      const d = document.getElementById("desativa"); if (d) d.checked = !!incluirInativos;
      const bar = document.getElementById("barras"); if (bar) bar.checked = true;
      const pv = document.getElementById("preco_venda"); if (pv) pv.checked = true;
      const ms = document.getElementById("marcas");
      if (ms && marcaCodes && marcaCodes.length) {
        const c = String(marcaCodes[0]);
        if (![...ms.options].some(o => o.value === c)) { const o = document.createElement("option"); o.value = c; o.text = "marca " + c; ms.add(o); }
        [...ms.options].forEach(o => o.selected = (o.value === c)); ms.value = c;
      }
    }, { empresa, marcaCodes, incluirInativos });
    await page.waitForTimeout(1200);
    await page.evaluate((marcaCodes) => {
      const ms = document.getElementById("marcas");
      if (ms && marcaCodes && marcaCodes.length) {
        const c = String(marcaCodes[0]);
        [...ms.options].forEach(o => o.selected = (o.value === c)); ms.value = c;
      }
      const b = document.getElementById("btnGerarRelatorio"); if (b) b.click();
    }, marcaCodes);
    let last = -1, stable = 0; const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
      await page.waitForTimeout(1200);
      const n = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);
      if (n !== last) { last = n; stable = 0; } else if (++stable >= 4) break;
    }
    const rows = await page.evaluate(() => {
      const parse = v => { v = String(v || "").trim().replace(/\./g, "").replace(",", "."); const n = parseFloat(v); return isNaN(n) ? null : n; };
      const out = [];
      for (const v of document.querySelectorAll('input[name^="valor_"]')) {
        const tr = v.closest("tr"); if (!tr) continue;
        const cod = (tr.querySelector('input[name^="codigo_"]') || {}).value || "";
        let ean = null; const a = [...tr.querySelectorAll("a")].find(x => /codebars/i.test(x.getAttribute("href") || ""));
        if (a) ean = (a.textContent || "").trim();
        const desc = (tr.cells[1] && tr.cells[1].textContent || "").trim();
        const ref = (tr.cells[2] && tr.cells[2].textContent || "").trim();
        const custo = parse(tr.cells[7] && tr.cells[7].textContent);
        const p = parse(v.value);
        if (p != null) out.push({ cod, ean, desc, ref, custo, preco: p });
      }
      return out;
    });
    if (rows.length > melhor.rows.length) melhor = { rows };
    if (rows.length > 0 && rows.length < 3000) { melhor = { rows }; break; }
    log(`  tentativa ${tent}: ${rows.length} produtos — retry`);
  }
  return melhor;
}

const TASKS = [
  { emp: 3, marca: 885, label: "Nathydras/emp3" },
  { emp: 10, marca: 885, label: "Nathydras/emp10" },
  { emp: 3, marca: 249, label: "Varcare/emp3" },
  { emp: 10, marca: 249, label: "Varcare/emp10" },
];

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
const result = {};
try {
  await garantirSessao(page, { log });
  for (const t of TASKS) {
    try {
      const { rows } = await relatorioPrecosErp(page, t.emp, [t.marca]);
      result[t.label] = rows;
      log(`${t.label}: ${rows.length} produtos`);
    } catch (e) { log(`${t.label} FALHOU: ${e.message}`); result[t.label] = []; }
  }
  writeFileSync("/private/tmp/claude-501/-Users-elkgomes-Documents-claude/7823e769-60e3-4159-90c2-6db19322c634/scratchpad/nathydras_varcare_precos.json", JSON.stringify(result, null, 1));
  log("gravado");
  await ctx.close();
  process.exit(0);
} catch (e) {
  log("FALHA " + e.message);
  await ctx.close().catch(() => {});
  process.exit(1);
}
