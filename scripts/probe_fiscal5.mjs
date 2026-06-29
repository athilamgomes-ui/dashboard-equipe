#!/usr/bin/env node
// read-only: localizar tela/endpoint do cadastro fiscal de produto (NCM + ConfigTributaria)
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[p5] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());

// captura respostas que cheiram a fiscal
const hits = [];
page.on("response", async (resp) => {
  try {
    const url = resp.url();
    if (!/microvix/.test(url)) return;
    const ct = resp.headers()["content-type"] || "";
    if (!/json|text|html/.test(ct)) return;
    const t = await resp.text().catch(() => "");
    if (/"?ncm"?\s*[:=]|ConfigTributaria|IdConfigTributaria|classificacao_fiscal|cClassFisc/i.test(t)) {
      hits.push({ url: url.slice(0, 130), st: resp.status(), len: t.length, has_ncm: /ncm/i.test(t), has_cfg: /ConfigTributaria/i.test(t), snip: t.slice(0, 0) });
    }
  } catch (_) {}
});

try {
  await garantirSessao(page, { log });
  // candidatos de tela clássica de cadastro/listagem de produtos no gestor_web
  const cand = [
    "https://linx.microvix.com.br/gestor_web/produtos/cadastro_produtos.asp",
    "https://linx.microvix.com.br/gestor_web/produtos/produtos.asp",
    "https://linx.microvix.com.br/gestor_web/produtos/relatorio_produtos.asp",
    "https://linx.microvix.com.br/gestor_web/produtos/produtos/index.html",
    "https://linx.microvix.com.br/gestor_web/produtos/cadastro_produtos/index.html",
    "https://linx.microvix.com.br/gestor_web/produtos/lista_produtos.asp",
  ];
  for (const u of cand) {
    try {
      const r = await page.goto(u, { waitUntil: "domcontentloaded", timeout: 25000 });
      const title = await page.title().catch(() => "");
      const bodyLen = await page.evaluate(() => document.body ? document.body.innerText.length : 0).catch(() => 0);
      const hasNcmField = await page.evaluate(() => !!document.querySelector('[name*="ncm" i],[id*="ncm" i],[name*="classif" i]')).catch(() => false);
      log(`${u.split("/produtos/")[1]} -> ${r ? r.status() : "?"} | title="${title.slice(0,40)}" bodyLen=${bodyLen} ncmField=${hasNcmField}`);
      await page.waitForTimeout(1500);
    } catch (e) { log(`${u.split("/produtos/")[1]} -> ERRO ${String(e.message).split("\n")[0].slice(0,60)}`); }
  }
  process.stdout.write(JSON.stringify({ hits }, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message), hits })); }
finally { await ctx.close().catch(() => {}); }
