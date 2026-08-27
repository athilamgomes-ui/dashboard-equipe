#!/usr/bin/env node
/**
 * quem_tem_fator.mjs — lista, por loja, QUAIS produtos têm fator de conversão cadastrado.
 *
 * Fonte: gestor_web/produtos/relatorio_manut.asp (Manutenção do cadastro de produtos), que tem
 * o filtro `listar_prod_fator_conversao` = S (só com fator) / N (só sem) / Todos. É a forma
 * rápida de separar a população inteira — sem isso só dá para saber produto a produto.
 *
 * A mesma listagem devolve, por produto e por empresa:
 *     custo_<cod>_<emp>     Custo c/ICMS  (= o custo que o Registro de Inventário usa)
 *     customed_<cod>_<emp>  Custo médio   (⚠️ NÃO é o que valoriza o estoque — ver a memória
 *                           `estoque-custo-medio-nao-e-custo-do-inventario`)
 *     venda_<cod>_<emp>     preço de venda
 *     markup_<cod>_<emp>    markup %
 *     unid_<cod>            unidade (select CX/GR/KG/MT/PC/UN)
 * Todos são INPUTS EDITÁVEIS — esta tela grava custo e preço em lote. Este script só LÊ.
 *
 * Uso: node quem_tem_fator.mjs L1 [codMarca]
 * Saída: dados_estoque/fator_<loja>.json { comFator:{cod:{...}}, semFator:{cod:{...}} }
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(DIR, "..", "dados_estoque");
const PROFILE = process.env.MICROVIX_PROFILE || path.join(homedir(), ".claude", "microvix-cadastro");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp";
const LOJAS = { L1: 1, L3: 3, L4: 4, L5: 10 };   // ⚠️ nunca 9 nem 11

const loja = (process.argv[2] || "L1").toUpperCase();
const marca = process.argv[3] && /^\d+$/.test(process.argv[3]) ? process.argv[3] : null;
const E = LOJAS[loja];
if (!E) { console.error(`loja inválida: ${loja}`); process.exit(1); }
const log = (m) => console.log(`[fator] ${m}`);

const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1440, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
await garantirSessao(page, { tokenOpcional: true });

async function listar(FAT) {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#empresas_1", { timeout: 30000 });
  await page.waitForTimeout(1600);
  await page.evaluate(({ E, FAT, marca }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    set("empresas_" + E, true);
    const radio = (n, v) => { const r = [...document.querySelectorAll(`input[type=radio][name="${n}"]`)].find(x => x.value === v); if (r) { r.checked = true; if (r.onclick) try { r.onclick(); } catch (_) {} } };
    radio("listar_prod_fator_conversao", FAT);
    radio("ordem", "codigoproduto");
    radio("listar_prod", "Todos");
    set("chCustoMedio", true); set("chUnidade", true); set("chCustoIcms", true);
    if (marca) {
      const ms = document.getElementById("marcas");
      if (ms) {
        if (![...ms.options].some(o => o.value === marca)) { const o = document.createElement("option"); o.value = marca; o.text = "m" + marca; ms.add(o); }
        [...ms.options].forEach(o => o.selected = (o.value === marca)); ms.value = marca;
      }
    }
  }, { E, FAT, marca });
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 900000 }).catch(() => null);
  await page.evaluate(() => { const b = document.getElementById("btListar"); if (b) b.click(); });
  if (!await nav) throw new Error(`fator=${FAT}: relatório não terminou (seria truncado)`);
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const num = (s) => { s = String(s || "").trim(); if (!s) return null; const v = parseFloat(s.replace(/\./g, "").replace(",", ".")); return isNaN(v) ? null : v; };
    const out = {};
    for (const i of document.querySelectorAll('input[name^="custo_"]')) {
      const m = i.name.match(/^custo_(\d+)_(\d+)$/);
      if (!m) continue;
      const [, cod, emp] = m;
      const g = (p) => document.querySelector(`[name="${p}_${cod}_${emp}"]`)?.value;
      out[cod] = {
        custo: num(i.value), customed: num(g("customed")), venda: num(g("venda")), markup: num(g("markup")),
        und: document.querySelector(`select[name="unid_${cod}"]`)?.value || null,
        desc: document.querySelector(`[name="descr_${cod}"]`)?.value?.trim() || null,
      };
    }
    return out;
  });
}

const res = { loja, emp: E, marca, geradoEm: new Date().toISOString() };
for (const [chave, FAT] of [["comFator", "S"], ["semFator", "N"]]) {
  const r = await listar(FAT);
  res[chave] = r;
  log(`${loja} ${chave}: ${Object.keys(r).length} produtos`);
}
// Sanidade: as duas listas não podem se sobrepor nem vir ambas vazias.
const inter = Object.keys(res.comFator).filter(c => res.semFator[c]);
if (inter.length) log(`⚠️ ${inter.length} produtos aparecem nas DUAS listas — o filtro não é excludente como eu supus`);
if (!Object.keys(res.comFator).length && !Object.keys(res.semFator).length) {
  console.error("FALHA: as duas listas vieram vazias — não vou gravar.");
  await ctx.close(); process.exit(10);
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const dest = path.join(OUT_DIR, `fator_${loja}${marca ? "_m" + marca : ""}.json`);
fs.writeFileSync(dest, JSON.stringify(res));
log(`gravado: ${dest}`);
await ctx.close();
