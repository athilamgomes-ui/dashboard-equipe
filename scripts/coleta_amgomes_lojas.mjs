#!/usr/bin/env node
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_REL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_vendas_lojas.asp";

function logErr(msg) { process.stderr.write(`[lojas] ${msg}\n`); }

const di = process.argv[2] || "01/05/2026";
const df = process.argv[3] || "26/05/2026";

const t0 = Date.now();
logErr(`launch headless...`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());

try {
  await garantirSessao(page, { log: logErr });
} catch (e) {
  logErr(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
}

logErr(`navegando para ${URL_REL}`);
await page.goto(URL_REL, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForSelector("#empresas_1", { timeout: 15000 });
await page.waitForTimeout(1000);

logErr(`filtrando empresas 1,3,4,10 - período ${di} a ${df}`);
await page.evaluate(({di, df}) => {
  [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb => cb.checked = false);
  for (const id of [1, 3, 4, 10]) {
    const el = document.getElementById("empresas_" + id);
    if (el) el.checked = true;
  }
  const d1 = document.getElementById("periodo_inicial");
  const d2 = document.getElementById("periodo_final");
  if (d1) d1.value = di;
  if (d2) d2.value = df;
}, { di, df });

await page.evaluate(() => {
  const btn = [...document.querySelectorAll('input[type=submit]')]
    .find(b => /gerar|filtr|ok/i.test(b.value || ""));
  if (btn) btn.click();
});

let tableRows = null;
let headerRow = null;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  const result = await page.evaluate(() => {
    const trs = [...document.querySelectorAll("table tr")];
    const out = [];
    let hdr = null;
    for (const tr of trs) {
      const cellsTxt = [...tr.querySelectorAll("td, th")].map(c => c.textContent.trim());
      if (cellsTxt.length >= 6 && /^\d+\s*-/.test(cellsTxt[0])) {
        out.push(cellsTxt);
      } else if (!hdr && cellsTxt.length >= 6 && /qtde|pe[çc]as|venda|margem/i.test(cellsTxt.join("|"))) {
        hdr = cellsTxt;
      }
    }
    return { out, hdr };
  });
  tableRows = result.out;
  headerRow = result.hdr;
  if (tableRows && tableRows.length > 0) break;
}

if (!tableRows || tableRows.length === 0) {
  logErr(`tabela não apareceu em 30s`);
  await ctx.close().catch(() => {});
  process.exit(1);
}

logErr(`${tableRows.length} linhas. Header: ${JSON.stringify(headerRow)}`);
logErr(`Exemplo cells: ${JSON.stringify(tableRows[0])}`);

const out = { _header: headerRow };
for (const cells of tableRows) {
  const m = cells[0].match(/^(\d+)\s*-\s*(.+)/);
  if (!m) continue;
  const empId = parseInt(m[1], 10);
  out[empId] = { nome: m[2].trim(), cells };
}

logErr(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.stdout.write(JSON.stringify(out));
await ctx.close().catch(() => {});
process.exit(0);
