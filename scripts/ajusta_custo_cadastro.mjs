#!/usr/bin/env node
/**
 * ajusta_custo_cadastro.mjs — corrige o CUSTO c/ICMS de um produto no cadastro, com prova
 * antes/depois. ⚠️ ESCRITA REAL EM PRODUÇÃO.
 *
 * Por que este campo: o "Custo c/ICMS" da tela de Manutenção do cadastro de produtos é o MESMO
 * número que o Registro de Inventário usa para valorizar o estoque (conferido em 27/08/2026 no
 * produto 11043: cadastro R$ 1,16 = inventário R$ 1,16). O "Custo médio" da mesma tela é outro
 * campo e NÃO valoriza o estoque — ver a memória `estoque-custo-medio-nao-e-custo-do-inventario`.
 *
 * SEGURANÇA — o formulário posta a grade INTEIRA, então:
 *  · filtra a listagem pelo PRODUTO (select `produtos`), não pela marca. A grade sai com uma
 *    linha só e não há como um produto vizinho ser reescrito por engano.
 *  · aborta se a grade vier com mais de um produto, ou se o produto pedido não estiver nela.
 *  · não toca em venda, custo médio, markup, unidade nem saldo.
 *  · relê depois de salvar e EXIGE que o custo tenha mudado E que o preço de venda tenha ficado
 *    idêntico. Se o preço mexer, isso é reportado como falha — mesmo que o custo tenha gravado.
 *  · grava o antes/depois em dados_estoque/ajustes_custo.json (append), que é a trilha para desfazer.
 *
 * Uso:
 *   node ajusta_custo_cadastro.mjs L1 12408 48,73            → SIMULA (não grava)
 *   node ajusta_custo_cadastro.mjs L1 12408 48,73 --gravar   → GRAVA
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, "..", "dados_estoque", "ajustes_custo.json");
const PROFILE = process.env.MICROVIX_PROFILE || path.join(homedir(), ".claude", "microvix-cadastro");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp";
const LOJAS = { L1: 1, L3: 3, L4: 4, L5: 10 };   // ⚠️ nunca 9 nem 11

const loja = (process.argv[2] || "").toUpperCase();
const cod = process.argv[3];
const novo = process.argv[4];
const GRAVAR = process.argv.includes("--gravar");
const E = LOJAS[loja];
if (!E || !/^\d+$/.test(cod || "") || !/^[\d.]+,\d{2}$/.test(novo || "")) {
  console.error('uso: node ajusta_custo_cadastro.mjs <L1|L3|L4|L5> <codigo> <novo custo pt-BR ex 48,73> [--gravar]');
  process.exit(1);
}
const log = (m) => console.log(`[custo] ${m}`);

const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1440, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
await garantirSessao(page, { tokenOpcional: true });

async function abrirGrade() {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#empresas_1", { timeout: 30000 });
  await page.waitForTimeout(1600);
  await page.evaluate(({ E, cod }) => {
    const set = (i, v) => { const e = document.getElementById(i); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    set("empresas_" + E, true);
    set("chCustoIcms", true); set("chCustoMedio", true); set("chUnidade", true);
    const ps = document.getElementById("produtos") || document.querySelector("select[name=produtos]");
    if (ps) {
      if (![...ps.options].some(o => o.value === cod)) { const o = document.createElement("option"); o.value = cod; o.text = "p" + cod; ps.add(o); }
      [...ps.options].forEach(o => o.selected = (o.value === cod));
      ps.value = cod;
    }
  }, { E, cod });
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 300000 }).catch(() => null);
  await page.evaluate(() => { const b = document.getElementById("btListar"); if (b) b.click(); });
  if (!await nav) throw new Error("a listagem não terminou de carregar");
  await page.waitForTimeout(1200);
}

async function lerLinha() {
  return page.evaluate(({ cod, E }) => {
    const g = (n) => document.querySelector(`[name="${n}"]`)?.value ?? null;
    const cods = [...new Set([...document.querySelectorAll('input[name^="custo_"]')].map(i => i.name.split("_")[1]))]
      .filter(c => /^\d+$/.test(c));
    return {
      produtosNaGrade: cods, descr: g(`descr_${cod}`),
      custo: g(`custo_${cod}_${E}`), customed: g(`customed_${cod}_${E}`),
      venda: g(`venda_${cod}_${E}`), markup: g(`markup_${cod}_${E}`),
      unid: document.querySelector(`select[name="unid_${cod}"]`)?.value ?? null,
    };
  }, { cod, E });
}

await abrirGrade();
const antes = await lerLinha();
if (antes.produtosNaGrade.length !== 1 || antes.produtosNaGrade[0] !== cod) {
  console.error(`ABORTADO: a grade veio com ${antes.produtosNaGrade.length} produto(s) [${antes.produtosNaGrade.join(",")}] — esperava só ${cod}.`);
  await ctx.close(); process.exit(20);
}
if (antes.custo == null) { console.error(`ABORTADO: não achei o campo custo_${cod}_${E}.`); await ctx.close(); process.exit(20); }
log(`ANTES  → ${antes.descr}`);
log(`         custo=${antes.custo} · custo médio=${antes.customed} · venda=${antes.venda} · markup=${antes.markup} · un=${antes.unid}`);
log(`PEDIDO → custo ${antes.custo} → ${novo}   (venda, custo médio, unidade e saldo NÃO serão tocados)`);

if (!GRAVAR) {
  log("SIMULAÇÃO — nada foi gravado. Repita com --gravar para valer.");
  await ctx.close(); process.exit(0);
}

const preencheu = await page.evaluate(({ cod, E, novo }) => {
  const e = document.querySelector(`[name="custo_${cod}_${E}"]`);
  if (!e) return false;
  e.value = novo;
  e.dispatchEvent(new Event("change", { bubbles: true }));
  e.dispatchEvent(new Event("blur", { bubbles: true }));
  return e.value === novo;
}, { cod, E, novo });
if (!preencheu) { console.error("ABORTADO: não consegui escrever no campo."); await ctx.close(); process.exit(20); }

const nav = page.waitForNavigation({ waitUntil: "load", timeout: 180000 }).catch(() => null);
await page.evaluate(() => {
  const b = document.getElementById("B1") || [...document.querySelectorAll("input[type=submit],button")]
    .find(x => /salvar/i.test(x.value || x.textContent || ""));
  if (b) b.click();
});
await nav;
await page.waitForTimeout(1500);

await abrirGrade();
const depois = await lerLinha();
log(`DEPOIS → custo=${depois.custo} · custo médio=${depois.customed} · venda=${depois.venda} · markup=${depois.markup} · un=${depois.unid}`);

const custoMudou = depois.custo !== antes.custo;
const precoIntacto = depois.venda === antes.venda;
const ok = custoMudou && precoIntacto;
if (!custoMudou) log("⚠️ o custo NÃO mudou — a gravação não pegou.");
if (!precoIntacto) log(`🔴 O PREÇO DE VENDA MUDOU (${antes.venda} → ${depois.venda}) — isso não era para acontecer.`);

let hist = [];
try { hist = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (_) {}
hist.push({ quando: new Date().toISOString(), loja, emp: E, cod, pedido: novo, antes, depois, ok });
fs.writeFileSync(OUT, JSON.stringify(hist, null, 1));
log(`trilha antes/depois em ${OUT}`);
log(ok ? "✅ ajuste confirmado" : "❌ ajuste NÃO confirmado — ver acima");
await ctx.close();
process.exit(ok ? 0 : 30);
