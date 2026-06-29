#!/usr/bin/env node
// read-only: descobrir payload p/ listar produtos + obter NCM + IdConfigTributaria por produto
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const log = m => process.stderr.write(`[p4] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto(URL_NFE, { waitUntil: "domcontentloaded", timeout: 45000 });
  let token = null;
  for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
  if (!token) throw new Error("sem token");
  const res = await page.evaluate(async () => {
    const token = localStorage.getItem("token_api");
    const SUP = "https://suprimentoswebapi-prod.microvix.com.br";
    const H = { Authorization: token, "Content-Type": "application/json" };
    const out = {};
    const keys = o => (o && typeof o === "object" && !Array.isArray(o)) ? Object.keys(o) : o;
    async function P(url, body, label) {
      try { const r = await fetch(url, { method: "POST", headers: H, body: JSON.stringify(body) });
        const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t.slice(0, 200); }
        out[label] = { st: r.status, top: Array.isArray(j) ? ("arr[" + j.length + "] keys0=" + JSON.stringify(keys(j[0]))) : keys(j) };
        return j;
      } catch (e) { out[label] = { erro: String(e).slice(0, 120) }; return null; }
    }
    // PesquisaRapida variações
    await P(SUP + "/api/CatalogoProdutos/PesquisaRapida", { Pesquisa: "100CORT", Pagina: 1, QuantidadeRegistros: 5 }, "PR_Pesquisa");
    await P(SUP + "/api/CatalogoProdutos/PesquisaRapida", { Filtro: "shampoo", Pagina: 1 }, "PR_Filtro");
    await P(SUP + "/api/CatalogoProdutos/PesquisaRapida", { TextoPesquisa: "shampoo" }, "PR_Texto");
    await P(SUP + "/api/CatalogoProdutos/PesquisaRapida", { CodigoOuDescricao: "19611" }, "PR_CodOuDesc");
    // ObterDetalhesProduto variações
    await P(SUP + "/api/CatalogoProdutos/ObterDetalhesProduto", { Codigo: "19611" }, "Det_Codigo");
    await P(SUP + "/api/CatalogoProdutos/ObterDetalhesProduto", { IdProduto: 19611 }, "Det_IdProduto");
    await P(SUP + "/api/CatalogoProdutos/ObterDetalhesProduto", { CodigoProduto: "19611" }, "Det_CodProduto");
    // Parametros
    await P(SUP + "/api/Parametros/ObterParametrosProduto", { Codigo: "19611" }, "Param_Codigo");
    await P(SUP + "/api/Parametros/ObterConfiguracoesProduto", { Codigo: "19611" }, "Conf_Codigo");
    return out;
  });
  process.stdout.write(JSON.stringify(res, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
