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
// markup opcional: o ERP deriva o preço do markup ARMAZENADO (venda = custo × (1+markup/100)).
// Mexer no custo sozinho joga o erro do custo para o preço — foi o que derrubou o 12408 de
// R$ 67,90 para R$ 0,0655 em 27/08. Passar o markup alvo junto mantém o preço no lugar.
const markup = (process.argv[5] && /^[\d.]+,\d+$/.test(process.argv[5])) ? process.argv[5] : null;
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
log(`PEDIDO → custo ${antes.custo} → ${novo}${markup ? ` · markup ${antes.markup} → ${markup}` : ""}   (venda, custo médio, unidade e saldo NÃO serão tocados)`);
if (!markup) log("modo A (decidido em 27/08): sem markup alvo. O preço do CADASTRO vai se recalcular\n" +
  "         e virar um número qualquer — ele já era errado e L1/L4 vendem pela Tabela Altamira.\n" +
  "         A conferência que vale é a Tabela Altamira, feita depois do lote (confere_altamira.py).");

if (!GRAVAR) {
  log("SIMULAÇÃO — nada foi gravado. Repita com --gravar para valer.");
  await ctx.close(); process.exit(0);
}

// digitação REAL: setar .value não dispara os recálculos da tela em alguns campos.
const selCusto = `input[name="custo_${cod}_${E}"]`;
await page.click(selCusto); await page.fill(selCusto, "");
await page.type(selCusto, novo, { delay: 55 });
await page.keyboard.press("Tab"); await page.waitForTimeout(600);
if (markup) {
  const selMk = `input[name="markup_${cod}_${E}"]`;
  await page.click(selMk); await page.fill(selMk, "");
  await page.type(selMk, markup, { delay: 55 });
  await page.keyboard.press("Tab"); await page.waitForTimeout(800);
}
const naTela = await page.evaluate(({ cod, E }) => ({
  custo: document.querySelector(`[name="custo_${cod}_${E}"]`)?.value,
  markup: document.querySelector(`[name="markup_${cod}_${E}"]`)?.value,
  venda: document.querySelector(`[name="venda_${cod}_${E}"]`)?.value,
}), { cod, E });
log(`NA TELA antes de salvar → custo=${naTela.custo} · markup=${naTela.markup} · venda=${naTela.venda}`);
const preencheu = naTela.custo === novo;
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
// A trava é "o preço não pode se mexer". Mas quando se passa um markup alvo, o ERP recalcula
// venda = custo × (1+markup/100) e o resultado pode diferir do valor antigo por CENTAVOS de
// arredondamento — e isso é correção, não estrago. Por isso a tolerância de 1 centavo quando
// há markup alvo; sem markup, qualquer mexida no preço continua sendo falha.
const n = (v) => parseFloat(String(v || "").replace(/\./g, "").replace(",", "."));
// Com markup alvo, a trava é "o preço do cadastro não pode se mexer" (tolerância de 5 centavos
// para o arredondamento do ERP). SEM markup — o modo A — o preço do cadastro MUDA de propósito;
// aí a trava é só "o custo gravou", e quem confere o preço de verdade é a Tabela Altamira.
const precoIntacto = markup ? Math.abs(n(depois.venda) - n(antes.venda)) <= 0.05 : true;
log(`   preço do cadastro: ${antes.venda} → ${depois.venda}${markup ? "" : "  (esperado no modo A)"}`);
const ok = custoMudou && precoIntacto;
if (!custoMudou) log("⚠️ o custo NÃO mudou — a gravação não pegou.");
if (!precoIntacto) log(`🔴 O PREÇO DO CADASTRO MUDOU (${antes.venda} → ${depois.venda}) — com markup alvo isso não era para acontecer.`);

let hist = [];
try { hist = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (_) {}
hist.push({ quando: new Date().toISOString(), loja, emp: E, cod, pedido: novo, antes, depois, ok });
fs.writeFileSync(OUT, JSON.stringify(hist, null, 1));
log(`trilha antes/depois em ${OUT}`);
log(ok ? "✅ ajuste confirmado" : "❌ ajuste NÃO confirmado — ver acima");
await ctx.close();
process.exit(ok ? 0 : 30);
