#!/usr/bin/env node
// read-only: achar o endpoint JSON do cadastro de produto que traz NCM + Config Tributária
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[p9] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
const bodies = [];
page.on("response", async (resp) => {
  try {
    const u = resp.url();
    if (!/microvix/.test(u) || /\.(png|jpg|gif|css|woff|svg|js)(\?|$)/i.test(u)) return;
    const t = await resp.text().catch(() => "");
    if (/ncm|ConfigTributaria|IdConfigTributaria|classificacaofiscal|CodigoNcm|"Ncm"/i.test(t)) {
      bodies.push({ url: u.slice(0, 150), st: resp.status(), len: t.length, body: t.slice(0, 4000) });
    }
  } catch (_) {}
});
try {
  await garantirSessao(page, { log });
  // tenta abrir cadastro direto com código
  const urls = [
    "https://linx.microvix.com.br/gestor_web/produtos/cadastro_produtos.asp?codigo=19611",
    "https://linx.microvix.com.br/gestor_web/produtos/cadastro_produtos.asp?cod_produto=19611",
    "https://linx.microvix.com.br/gestor_web/produtos/cadastro_produtos.asp",
  ];
  for (const u of urls) {
    try {
      await page.goto(u, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);
      log(`abriu ${u.split('.asp')[1]||'(base)'} — hits até agora: ${bodies.length}`);
      // se houver campo de busca de código, preenche e busca
      const filled = await page.evaluate(() => {
        const f = document.querySelector('input[name*="codigo" i],input[id*="codigo" i],input[name*="pesquis" i]');
        if (f) { f.value = "19611"; f.dispatchEvent(new Event("change", { bubbles: true })); return f.name || f.id; }
        return null;
      });
      if (filled) { log(`preencheu campo ${filled}, dando enter`); await page.keyboard.press("Enter").catch(()=>{}); await page.waitForTimeout(2500); }
    } catch (e) { log(`${u.split('.asp')[1]} erro ${String(e.message).slice(0,50)}`); }
    if (bodies.length) break;
  }
  writeFileSync("/tmp/fiscal9_bodies.json", JSON.stringify(bodies, null, 1));
  log(`total respostas c/ ncm/config: ${bodies.length}`);
  bodies.forEach(b => log(`  [${b.st}] len=${b.len} ${b.url}`));
  process.stdout.write(JSON.stringify(bodies.map(b => ({ url: b.url, st: b.st, len: b.len })), null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
