#!/usr/bin/env node
/**
 * inventario_marca.mjs — roda o Registro de Inventário do Microvix por loja/marca e salva o HTML.
 *
 * É a automação do caminho que o Athila descobriu em 27/08/2026 (muito mais rápido que varrer
 * o catálogo inteiro para achar custo/ICMS/saldo errado):
 *     Suprimentos → Relatórios → Registro de Inventário
 *     SINTÉTICO  = uma linha por marca (saldo + custo total)   → acha a marca com anomalia
 *     ANALÍTICO  = uma linha por produto da marca              → acha o produto culpado
 *
 * Uso:
 *     node inventario_marca.mjs L1                 → sintético da loja inteira
 *     node inventario_marca.mjs L1 36              → analítico só da marca 36 (AMEND)
 *     node inventario_marca.mjs L1 36 --sintetico  → sintético filtrado nessa marca
 *
 * Saída: dados_estoque/inventario_<loja>[_m<marca>].html  (parseie com ler_registro_inventario.py)
 *
 * ⚠️ O relatório chega em STREAMING. O fim é o evento `load` da navegação — contar linhas até
 * "parar de crescer" já devolveu tabela truncada sem erro nenhum (memória
 * `relatorio_microvix_streaming_truncado`). Timeout aqui é FALHA, nunca dado parcial.
 * ⚠️ O <select name=marcas> vem com 1 opção só (carrega sob demanda). A saída é INJETAR a option
 * com o código, igual o coleta_precificacao.mjs faz — o relatório honra o código submetido.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(DIR, "..", "dados_estoque");
const PROFILE_DIR = process.env.MICROVIX_PROFILE || path.join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_inventario_new.asp";
const LOJAS = { L1: 1, L3: 3, L4: 4, L5: 10 };   // ⚠️ nunca empresas 9 nem 11

const loja = (process.argv[2] || "L1").toUpperCase();
const marca = (process.argv[3] && /^\d+$/.test(process.argv[3])) ? process.argv[3] : null;
const sintetico = process.argv.includes("--sintetico") || !marca;
const E = LOJAS[loja];
if (!E) { console.error(`loja inválida: ${loja} (use L1, L3, L4 ou L5)`); process.exit(1); }
const log = (m) => console.log(`[inv] ${m}`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
await garantirSessao(page, { tokenOpcional: true });

log(`${loja} (emp ${E}) · marca ${marca || "todas"} · ${sintetico ? "SINTÉTICO" : "ANALÍTICO"}`);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("#empresas_1", { timeout: 30000 });
await page.waitForTimeout(1500);

const cfg = await page.evaluate(({ E, marca, sintetico }) => {
  const set = (id, v) => { const e = document.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
  const radio = (name, val) => {
    const r = [...document.querySelectorAll(`input[type=radio][name="${name}"]`)].find(x => x.value === val);
    if (r) { r.checked = true; if (r.onclick) try { r.onclick(); } catch (_) {} }
    return !!r;
  };
  [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
  set("empresas_" + E, true);                       // UMA empresa só

  const ok = {
    agrupamento: radio("f_agrupamento", "codigo_marca"),
    ordem: radio("indice_secundario", sintetico ? "referencia1" : "nome_produto"),
    sintetico: radio("sintetico", sintetico ? "S" : "N"),
  };

  const ms = document.getElementById("marcas") || document.querySelector("select[name=marcas]");
  if (ms && marca) {
    const c = String(marca);
    if (![...ms.options].some(o => o.value === c)) { const o = document.createElement("option"); o.value = c; o.text = "marca " + c; ms.add(o); }
    [...ms.options].forEach(o => o.selected = (o.value === c));
    ms.value = c;
    ok.marca = ms.value === c;
  }
  const dep = document.querySelector("select[name=deposito]");
  if (dep) [...dep.options].forEach(o => o.selected = (o.value === "1"));   // depósito 1 = Estoque
  return ok;
}, { E, marca, sintetico });
log(`filtros aplicados: ${JSON.stringify(cfg)}`);
if (!cfg.agrupamento || !cfg.sintetico) { console.error("FALHA: não achei os radios de agrupamento/sintético — a tela mudou."); await ctx.close(); process.exit(20); }

await page.waitForTimeout(600);
// O fim do relatório é o evento `load` da navegação — nunca "as linhas pararam de crescer".
const nav = page.waitForNavigation({ waitUntil: "load", timeout: 600000 }).catch(() => null);
await page.evaluate(() => {
  const b = document.querySelector("#Prosseguir") || document.querySelector("input[name=Prosseguir]")
    || [...document.querySelectorAll("input[type=submit],input[type=button],button")].find(x => /gerar relat/i.test(x.value || x.textContent || ""));
  if (b) b.click();
});
const r = await nav;
if (!r) { console.error("FALHA: o relatório não terminou de carregar (timeout) — NÃO vou salvar dado parcial."); await ctx.close(); process.exit(10); }
await page.waitForTimeout(1200);

const html = await page.content();
const nome = `inventario_${loja}${marca ? "_m" + marca : ""}${sintetico ? "" : "_analitico"}.html`;
fs.mkdirSync(OUT_DIR, { recursive: true });
const dest = path.join(OUT_DIR, nome);
fs.writeFileSync(dest, html, "utf8");
const linhas = await page.evaluate(() => document.querySelectorAll("table tr").length);
log(`OK → ${dest}  (${linhas} linhas na tabela, ${(html.length / 1024).toFixed(0)} KB)`);
await ctx.close();
