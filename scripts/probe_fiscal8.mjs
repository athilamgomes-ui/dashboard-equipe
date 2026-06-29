#!/usr/bin/env node
// read-only: dump do select "classificacao" (classificação fiscal) + caça à fonte AJAX (NCM/config)
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[p8] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
const netHits = [];
page.on("response", async (resp) => {
  try {
    const u = resp.url();
    if (!/microvix/.test(u)) return;
    if (/classif|ncm|fiscal|tribut/i.test(u)) { netHits.push({ url: u.slice(0, 140), st: resp.status() }); }
  } catch (_) {}
});
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_produtos.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(2500);
  const cls = await page.evaluate(() => {
    const s = document.getElementById("classificacao");
    if (!s) return { found: false };
    return { found: true, n: s.options.length, opts: [...s.options].slice(0, 60).map(o => `${o.value}=${(o.text || "").trim()}`) };
  });
  log(`classificacao: found=${cls.found} n=${cls.n}`);
  (cls.opts || []).forEach(o => log("  " + o));
  log("net hits classif/ncm/fiscal:");
  netHits.forEach(h => log(`  [${h.st}] ${h.url}`));
  process.stdout.write(JSON.stringify({ cls, netHits }, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message), netHits })); }
finally { await ctx.close().catch(() => {}); }
