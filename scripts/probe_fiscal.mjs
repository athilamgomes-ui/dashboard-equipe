#!/usr/bin/env node
/**
 * probe_fiscal.mjs — SONDAGEM read-only. Descobre de onde extrair, por produto:
 *   NCM, CEST, origem, e a tributação de SAÍDA (CST/CSOSN + alíquota ICMS).
 * Não grava nada no ERP. Só lista rotas de API e tenta endpoints de catálogo.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const log = m => process.stderr.write(`[probe] ${m}\n`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto(URL_NFE, { waitUntil: "domcontentloaded", timeout: 45000 });
  let token = null;
  for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
  log(`token_api: ${token ? token.length + " chars" : "AUSENTE"}`);

  // 1) Dump das rotas de API conhecidas pela página
  const routes = await page.evaluate(() => {
    const out = {};
    function walk(obj, prefix, depth) {
      if (!obj || depth > 3) return;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === "string" && /\/api\//i.test(v)) out[prefix + k] = v;
        else if (v && typeof v === "object") walk(v, prefix + k + ".", depth + 1);
      }
    }
    try { if (window.SuprimentosApiRoutes) walk(window.SuprimentosApiRoutes, "Suprimentos.", 0); } catch (e) {}
    // varre window por objetos *ApiRoutes / *Routes
    for (const key of Object.keys(window)) {
      if (/Routes$/i.test(key) && window[key] && typeof window[key] === "object" && key !== "SuprimentosApiRoutes") {
        try { walk(window[key], key + ".", 0); } catch (e) {}
      }
    }
    return out;
  });
  log(`rotas /api/ encontradas: ${Object.keys(routes).length}`);
  // filtra rotas que cheiram a produto/catálogo/fiscal
  const interesse = Object.entries(routes).filter(([k, v]) => /produt|catalog|fiscal|ncm|cest|tribut|classif/i.test(k + " " + v));
  process.stdout.write(JSON.stringify({ token_len: token ? token.length : 0, total_rotas: Object.keys(routes).length, rotas_interesse: interesse, todas: routes }, null, 1));
} catch (e) {
  log(`FALHA: ${e.message}`);
  process.stdout.write(JSON.stringify({ erro: String(e.message) }));
} finally {
  await ctx.close().catch(() => {});
}
