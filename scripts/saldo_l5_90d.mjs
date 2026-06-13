#!/usr/bin/env node
/**
 * saldo_l5_90d.mjs — emp 10 (L5): TODOS os produtos com saldo atual + vendas nos últimos 90 dias.
 * Saída: /tmp/l5_saldo90.json  [{c,d,r,v90,saldo,marca}]
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const OUT = "/tmp/l5_saldo90.json";
const log = m => process.stderr.write(`[s90] ${m}\n`);
const URL_SALDO = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp";
const pad = n => String(n).padStart(2, "0");
const fmtBR = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const HOJE = new Date();
const D90 = new Date(HOJE.getTime() - 90 * 86400000);

async function aguardarTabelaEstavel(page, { baseline = 0, minDelta = 200, maxMs = 180000, intervalo = 1500, stableNeeded = 3 } = {}) {
  let last = -1, stable = 0, started = false;
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(intervalo);
    const n = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);
    if (!started) { if (n >= baseline + minDelta) started = true; else { last = n; continue; } }
    if (n === last) { if (++stable >= stableNeeded) return n; } else stable = 0;
    last = n;
  }
  return last;
}
async function gotoRetry(page, url, { tentativas = 3, timeout = 45000 } = {}) {
  let err;
  for (let i = 0; i < tentativas; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout }); return; }
    catch (e) { err = e; await page.waitForTimeout(4000); }
  }
  throw err;
}

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
await garantirSessao(page, { log });

await gotoRetry(page, URL_SALDO);
await page.waitForSelector("#empresas_1", { timeout: 20000 });
await page.waitForTimeout(800);
const baseline = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);

await page.evaluate(({ d1, d2 }) => {
  const fd = document;
  const set = (id, v) => { const e = fd.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
  [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
  set("empresas_10", true);
  const sv = (id, v) => { const e = fd.getElementById(id); if (e) e.value = v; };
  sv("data1", d1); sv("data2", d2);
  const c1 = fd.querySelector("[name=data1_compra]"); if (c1) c1.value = d1;
  const c2 = fd.querySelector("[name=data2_compra]"); if (c2) c2.value = d2;
  set("controle_dif_periodo", true);
  set("exibe_estoque_transito", true);
  set("somenteDisp", false);
  const dep = fd.querySelector("select[name=depositos]");
  if (dep) [...dep.options].forEach(o => o.selected = true);
  const fa = fd.querySelector("input[name=formas][value=A]"); if (fa) fa.checked = true;
  const ag = fd.querySelector("select[name=f_agrupamento]");
  if (ag) [...ag.options].forEach(o => o.selected = (o.text.trim() === "Marca"));
}, { d1: fmtBR(D90), d2: fmtBR(HOJE) });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("input[type=submit], input[type=button], button, a")]
    .find(b => /^gerar/i.test((b.value || b.textContent || "").trim()));
  if (btn) btn.click();
});
await aguardarTabelaEstavel(page, { baseline, minDelta: 200, maxMs: 180000 });

const prods = await page.evaluate(() => {
  const num = s => { s = String(s || "").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, ""); const n = parseFloat(s); return isNaN(n) ? 0 : n; };
  let curBrand = null;
  const out = [];
  for (const tr of document.querySelectorAll("tr")) {
    const txt = (tr.textContent || "").trim();
    const m = txt.match(/Marca:\s*([A-ZÁÉÍÓÚÇÃÕ0-9 .\-\/\&]+?)\s*\((\d+)\)/i);
    if (m) { curBrand = m[1].trim(); continue; }
    const c = tr.cells; if (!c || c.length !== 11) continue;
    const cod = (c[0].textContent || "").trim(); if (!/^\d+$/.test(cod)) continue;
    out.push({
      c: cod, d: (c[1].textContent || "").trim(), r: (c[2].textContent || "").trim(),
      v90: num(c[8].textContent), transito: num(c[9].textContent), saldo: num(c[10].textContent),
      marca: curBrand || "",
    });
  }
  return out;
});
writeFileSync(OUT, JSON.stringify({ produtos: prods, janela: { de: fmtBR(D90), ate: fmtBR(HOJE) }, _em: new Date().toISOString() }));
log(`gravado ${OUT}: ${prods.length} produtos`);
await ctx.close();
