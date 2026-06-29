#!/usr/bin/env node
// read-only: captura o backend da listagem nova de produtos (suprimentos #/listagem-produtos)
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[p11] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
const xhr = [];
page.on("response", async (resp) => {
  try {
    const u = resp.url();
    const m = resp.request().method();
    if (!/webapi|\/api\//.test(u)) return;
    if (/\.(png|jpg|gif|css|woff|svg)(\?|$)/i.test(u)) return;
    const t = await resp.text().catch(() => "");
    const rec = { url: u.slice(0, 130), m, st: resp.status(), len: t.length, hasNcm: /ncm/i.test(t), hasCfg: /ConfigTributaria|tributacao|tributaria/i.test(t) };
    // guarda body se cheira a lista de produtos
    if ((rec.hasNcm || rec.hasCfg || /produto/i.test(u)) && t.length > 80) rec.body = t.slice(0, 3500);
    xhr.push(rec);
  } catch (_) {}
});
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/suprimentos/index.html#/listagem-produtos", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(8000); // SPA carrega grid
  // tenta clicar/forçar busca se houver
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /pesquis|buscar|filtrar/i.test(x.textContent || "")); if (b) b.click(); }).catch(()=>{});
  await page.waitForTimeout(5000);
  const interesse = xhr.filter(r => r.hasNcm || r.hasCfg || /produto/i.test(r.url));
  log(`XHR total=${xhr.length}, c/ produto/ncm/cfg=${interesse.length}`);
  interesse.forEach(r => log(`  [${r.st}] ${r.m} ncm=${r.hasNcm} cfg=${r.hasCfg} len=${r.len} ${r.url}`));
  writeFileSync("/tmp/fiscal11.json", JSON.stringify(xhr, null, 1));
  process.stdout.write(JSON.stringify(interesse.map(r => ({ url: r.url, m: r.m, st: r.st, hasNcm: r.hasNcm, hasCfg: r.hasCfg, len: r.len })), null, 1));
} catch (e) { log("FALHA " + e.message); writeFileSync("/tmp/fiscal11.json", JSON.stringify(xhr, null, 1)); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
