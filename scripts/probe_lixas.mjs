// Probe: lista TODOS os cadastros Santa Clara por EAN (p/ ver o par antigo=unidade × novo=pacote das lixas).
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_LISTA_PRECOS = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_lista_precos.asp";
const log = m => process.stderr.write(`[lixas] ${m}\n`);
const LIXAS = JSON.parse(readFileSync("/tmp/lixas.json", "utf8"));
const EMP = 1, TAB = 4, MARCA = "9"; // L1 / Tabela Altamira / Santa Clara

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try {
  await garantirSessao(page, { log });
  await page.goto(URL_LISTA_PRECOS, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#empresas_" + EMP, { timeout: 20000 });
  await page.waitForTimeout(1000);
  if (!(await page.evaluate(() => !!document.getElementById("ajuste_precos")?.checked))) {
    await page.click("#ajuste_precos").catch(() => {}); await page.waitForTimeout(700);
  }
  await page.evaluate(({ emp, tab, marca }) => {
    [1, 3, 4, 9, 10, 11].forEach(i => { const e = document.getElementById("empresas_" + i); if (e) e.checked = (i === emp); });
    document.querySelectorAll("input[name=visao]").forEach(r => r.checked = (r.value === "A"));
    const a = document.getElementById("ativa"); if (a) a.checked = true;
    const d = document.getElementById("desativa"); if (d) d.checked = true; // inclui inativos (cadastro novo pode estar assim)
    const bar = document.getElementById("barras"); if (bar) bar.checked = true;
    const pv = document.getElementById("preco_venda"); if (pv) pv.checked = true;
    const ms = document.getElementById("marcas");
    if (ms) { if (![...ms.options].some(o => o.value === marca)) { const o = document.createElement("option"); o.value = marca; o.text = "marca " + marca; ms.add(o); } [...ms.options].forEach(o => o.selected = (o.value === marca)); ms.value = marca; }
    const tp = document.getElementById("tabela_preco");
    if (tp) { const t = String(tab); let opt = [...tp.options].find(o => o.value === t); if (!opt) { opt = document.createElement("option"); opt.value = t; opt.text = "tabela " + t; tp.add(opt); } tp.value = t; }
  }, { emp: EMP, tab: TAB, marca: MARCA });
  await page.waitForTimeout(1200);
  await page.evaluate((marca) => {
    const ms = document.getElementById("marcas");
    if (ms) { [...ms.options].forEach(o => o.selected = (o.value === marca)); ms.value = marca; }
    const b = document.getElementById("btnGerarRelatorio"); if (b) b.click();
  }, MARCA);
  let last = -1, stable = 0; const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
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
      out.push({ cod, ean, desc, ref, preco: parse(v.value) });
    }
    return out;
  });
  log(`${rows.length} produtos Santa Clara no relatório`);
  writeFileSync("/tmp/sc_rows.json", JSON.stringify(rows));

  // agrupa por EAN das lixas
  const porEan = {};
  for (const r of rows) if (r.ean) (porEan[r.ean] = porEan[r.ean] || []).push(r);
  console.log("=== LIXAS: cadastros por EAN ===");
  for (const L of LIXAS) {
    const g = porEan[L.ean] || [];
    console.log(`\nEAN ${L.ean}  (NF cprod ${L.cprod} · '${L.desc.slice(0, 30)}')  → ${g.length} cadastro(s)`);
    for (const r of g) console.log(`   cod=${String(r.cod).padStart(7)}  R$${String(r.preco).padStart(7)}  ref=${(r.ref || "").padEnd(6)} ${r.desc.slice(0, 42)}`);
  }
} catch (e) { log("ERRO " + String(e)); } finally { await ctx.close(); }
