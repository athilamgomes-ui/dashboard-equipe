#!/usr/bin/env node
/**
 * coleta_clientes_crm.mjs — audita a QUALIDADE dos cadastros de cliente.
 * Lê a API do CRM novo (crmwebapi-prod), capturando o authorization da sessão
 * — mesmo padrão do balanço (ver memória microvix-api-balanco-inventario).
 * LEITURA PURA: não escreve nada no ERP.
 */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const log = m => process.stderr.write(`[cli] ${m}\n`);
const PROFILE = process.env.MICROVIX_PROFILE || process.env.HOME + "/.claude/microvix-analise";
const OUT = "/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas/clientes_crm.json";
const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", async d => { await d.accept().catch(() => {}); });
let auth = null;
page.on("request", r => {
  if (auth) return;
  const h = r.headers();
  if (/crmwebapi-prod/.test(r.url()) && h.authorization) { auth = h.authorization; log("token capturado (" + auth.length + " chars)"); }
});
await garantirSessao(page, { log, tokenOpcional: true });
await page.goto("https://linx.microvix.com.br/v4/home/index.asp", { waitUntil: "domcontentloaded", timeout: 40000 });
await page.waitForTimeout(2500);
await page.evaluate(() => { const a = [...document.querySelectorAll("a")].find(x => /Clientes\/Fornecedores/i.test(x.textContent || "")); if (a) a.click(); });
for (let i = 0; i < 30 && !auth; i++) await page.waitForTimeout(1000);
if (!auth) { log("NÃO capturou token do CRM"); await ctx.close(); process.exit(1); }
const base = "https://crmwebapi-prod.microvix.com.br/api";
const H = { authorization: auth, accept: "application/json", "content-type": "application/json" };
async function post(rota, body) {
  const r = await ctx.request.post(`${base}/${rota}`, { headers: H, data: body, timeout: 60000 });
  if (!r.ok()) { log(`${rota} -> ${r.status()}`); return null; }
  try { return await r.json(); } catch { return null; }
}
async function get(rota) {
  const r = await ctx.request.get(`${base}/${rota}`, { headers: H, timeout: 60000 });
  if (!r.ok()) { log(`${rota} -> ${r.status()}`); return null; }
  try { return await r.json(); } catch { return null; }
}
const ini = await get("ListagemClientes/ObterDadosIniciais");
log("ObterDadosIniciais: " + (ini ? JSON.stringify(ini).slice(0, 200) : "vazio"));
const filtros = await get("ListagemClientes/ListarFiltrosDaPesquisaAvancada");
log("Filtros: " + (filtros ? JSON.stringify(filtros).slice(0, 300) : "vazio"));
// tentar paginar a listagem
let todos = [], pag = 1, tam = 200;
for (; pag <= 60; pag++) {
  const body = { Pagina: pag, TamanhoPagina: tam, TextoPesquisa: "", OrdenarPor: "", Filtros: [] };
  const r = await post("ListagemClientes/Pesquisar", body) || await post("ListagemClientes/Listar", body);
  const arr = r && (r.Clientes || r.Itens || r.Registros || r.Lista || (Array.isArray(r) ? r : null));
  if (!arr || !arr.length) { if (pag === 1) log("listagem vazia — resposta: " + JSON.stringify(r).slice(0, 300)); break; }
  todos = todos.concat(arr);
  if (pag % 5 === 0) log(`  pg${pag} — acum ${todos.length}`);
  if (arr.length < tam) break;
}
log(`total ${todos.length} clientes`);
writeFileSync(OUT, JSON.stringify({ _coletado_em: new Date().toISOString(), total: todos.length, amostraCampos: todos[0] ? Object.keys(todos[0]) : [], clientes: todos }));
log("gravado " + OUT);
await ctx.close();
