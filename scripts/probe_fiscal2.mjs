#!/usr/bin/env node
/**
 * probe_fiscal2.mjs — read-only. Testa formato de:
 *   - CatalogoProdutos.PesquisaRapida   (lista produtos + ncm?)
 *   - CatalogoProdutos.ObterDetalhesProduto (bloco fiscal de 1 produto)
 *   - ConfigTributaria.ListarConfigsTributarias / ListarDetalhamentosExistentes
 *   - CadastrosAuxiliares.ObterSugestaoConfigTributaria
 * Imprime só amostras/estruturas — nada gravado no ERP.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const log = m => process.stderr.write(`[probe2] ${m}\n`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto(URL_NFE, { waitUntil: "domcontentloaded", timeout: 45000 });
  let token = null;
  for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
  if (!token) throw new Error("sem token");

  const result = await page.evaluate(async () => {
    const token = localStorage.getItem("token_api");
    const SUP = "https://suprimentoswebapi-prod.microvix.com.br";
    const FIS = "https://fiscalwebapi-prod.microvix.com.br";
    const H = { Authorization: token, "Content-Type": "application/json" };
    const out = {};
    const shape = (o, d = 0) => {
      if (o == null) return typeof o;
      if (Array.isArray(o)) return o.length ? ["array[" + o.length + "]", shape(o[0], d + 1)] : "array[0]";
      if (typeof o === "object") { if (d > 2) return "{...}"; const r = {}; for (const k of Object.keys(o).slice(0, 60)) r[k] = shape(o[k], d + 1); return r; }
      return typeof o === "string" ? ("str:" + String(o).slice(0, 40)) : typeof o;
    };
    async function tryPost(url, body, label) {
      try {
        const r = await fetch(url, { method: "POST", headers: H, body: JSON.stringify(body) });
        const txt = await r.text();
        let j; try { j = JSON.parse(txt); } catch { j = txt.slice(0, 300); }
        out[label] = { status: r.status, shape: shape(j), _sample: typeof j === "object" ? undefined : j };
        return j;
      } catch (e) { out[label] = { erro: String(e) }; return null; }
    }
    async function tryGet(url, label) {
      try {
        const r = await fetch(url, { headers: H });
        const txt = await r.text();
        let j; try { j = JSON.parse(txt); } catch { j = txt.slice(0, 300); }
        out[label] = { status: r.status, shape: shape(j) };
        return j;
      } catch (e) { out[label] = { erro: String(e) }; return null; }
    }

    // 1) PesquisaRapida — tenta variações de body
    await tryPost(SUP + "/api/CatalogoProdutos/PesquisaRapida", { Termo: "", Pagina: 1, QtdRegistros: 3 }, "PesquisaRapida_A");
    await tryPost(SUP + "/api/CatalogoProdutos/PesquisaRapida", { termo: "shampoo", pagina: 1, quantidadeRegistros: 3 }, "PesquisaRapida_B");
    const pr = await tryPost(SUP + "/api/Produtos/Pesquisar", { Pagina: 1, QtdRegistros: 3, Texto: "" }, "Produtos_Pesquisar");

    // 2) ConfigTributaria — listas
    await tryGet(FIS + "/api/ConfigTributaria/ListarConfigsTributarias", "ConfigTrib_Listar_GET");
    await tryPost(FIS + "/api/ConfigTributaria/ListarConfigsTributarias", {}, "ConfigTrib_Listar_POST");
    await tryPost(FIS + "/api/ConfigTributaria/ListarDetalhamentosExistentes", {}, "ConfigTrib_Detalhamentos");
    await tryPost(FIS + "/api/ConfigTributaria/ObterParametrosConfigsTributarias", {}, "ConfigTrib_Params");

    // 3) Sugestao config tributaria (Microvix sugere correto p/ um ncm)
    await tryPost(SUP + "/api/CadastrosAuxiliares/ObterSugestaoConfigTributaria", { Ncm: "33051000" }, "SugestaoConfig_ncm");

    return out;
  });
  process.stdout.write(JSON.stringify(result, null, 1));
} catch (e) {
  log(`FALHA: ${e.message}`);
  process.stdout.write(JSON.stringify({ erro: String(e.message) }));
} finally {
  await ctx.close().catch(() => {});
}
