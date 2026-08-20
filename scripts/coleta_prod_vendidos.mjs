#!/usr/bin/env node
/**
 * coleta_prod_vendidos.mjs — dirige o relatório "Produtos Vendidos"
 * (faturamento/relatorio_prod_vendidos.asp) em modo analítico (por produto)
 * OU sintético (agrupado), com base de custo escolhível. Playwright headless.
 *
 * É a fonte única de faturamento+custo+margem POR PRODUTO e POR MARCA em R$
 * (o relatório "Vendas por Lojas" só dá margem no nível da loja, com custo de HOJE;
 * "Performance" usa custo da época — este relatório reconcilia os dois porque
 * deixa escolher tipo_custo=medio (hoje) ou medio_epoca (dia da venda)).
 *
 * ⚠️ DISPARO EM 2 ETAPAS (o que devolvia "o formulário" a quem clicava errado):
 *   1) clicar Form1_SubmitVisao ("Gerar Relatório") — prepara/recarrega o form;
 *   2) clicar o botão "OK" que aparece — só então o relatório é gerado.
 * ⚠️ BUG empresa-1: ao preparar, o ERP reinjeta o checkbox da empresa 1. Antes do OK,
 *   desmarca tudo e remarca só a empresa desejada (mesmo cuidado do cron_etapa2_marcas_a).
 *
 * Uso:
 *   node coleta_prod_vendidos.mjs <emp> <DI> <DF> [sintetico=N] [agrup=nenhum] [custo=medio_epoca]
 *     emp: 1|3|4|10   DI/DF: DD/MM/AAAA
 *     sintetico: N (analítico, por produto) | S (só subtotais do agrupamento)
 *     agrup: nenhum | codigo_marca | codigo_setor | cod_vendedor | ...
 *     custo: medio_epoca (dia da venda) | medio (hoje) | padrao | liquido | compra
 *
 * STDOUT JSON:
 *   { emp, loja, di, df, sintetico, agrup, custo,
 *     totais: { qtd, custoEpoca, cmvTotal, prTabela, faturamento, markup, margem },
 *     rows:   [ { cod, desc, ref, un, qtd, custoUnit, cmv, prTabela, faturamento, markup, margem } ]  // analítico, agregado por produto
 *     grupos: [ { marca, faturamento, cmv, qtd, margem } ]  // sintético (subtotais por grupo)
 *   }
 * Exit: 0 ok · 1 falha · 2 creds/login · 3 arg inválido
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const log = m => process.stderr.write(`[prodvend] ${m}\n`);

const EMP = parseInt(process.argv[2], 10);
const DI = process.argv[3], DF = process.argv[4];
const SINT = (process.argv[5] || "N").toUpperCase();          // N analítico | S sintético
const AGRUP = process.argv[6] || "nenhum";                    // nenhum|codigo_marca|...
const CUSTO = process.argv[7] || "medio_epoca";              // medio_epoca|medio|...

if (![1, 3, 4, 10].includes(EMP) || !/^\d{2}\/\d{2}\/\d{4}$/.test(DI || "") || !/^\d{2}\/\d{2}\/\d{4}$/.test(DF || "")) {
  log("uso: node coleta_prod_vendidos.mjs <emp 1|3|4|10> <DD/MM/AAAA> <DD/MM/AAAA> [N|S] [agrup] [custo]");
  process.exit(3);
}

const parseBR = t => { const v = parseFloat(String(t ?? "0").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "")); return isNaN(v) ? 0 : v; };

async function gotoRetry(page, url, n = 3) {
  let err; for (let i = 0; i < n; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }); return; }
    catch (e) { err = e; log(`goto retry ${i + 1}: ${String(e.message).split("\n")[0]}`); await page.waitForTimeout(4000); }
  } throw err;
}

async function gerar(page) {
  await gotoRetry(page, URL);
  await page.waitForSelector("#f_data1", { timeout: 15000 });
  await page.waitForTimeout(1200);

  await page.evaluate(({ emp, di, df, sint, agrup, custo }) => {
    const setRadio = (name, val) => { const r = [...document.querySelectorAll(`input[name="${name}"]`)].find(x => x.value === val); if (r) { r.checked = true; r.dispatchEvent(new Event("click")); } };
    const setChk = (name, on) => { document.querySelectorAll(`input[name="${name}"]`).forEach(c => c.checked = on); };
    // ⚠️ RESET DE FILTROS HERDADOS DO PERFIL PERSISTENTE — o cron_etapa2 (visão 22 Marcas A)
    // deixa marcas/coleção grudados no multiselect; sem limpar, o relatório conta só ~19 marcas.
    // Para cada multiselect de filtro: se tem opção value="" (Todos), seleciona só ela;
    // senão desmarca tudo (none = todos). Depois dispara change pro widget/ASP registrar.
    // A raiz do filtro é o id_visao: o relatório abre com uma visão salva (22 Marcas 30%A / 23 20%B)
    // pré-selecionada, e o "Gerar Relatório" (SubmitVisao) aplica os filtros dela no SERVIDOR.
    // Zerar o id_visao (opção vazia) faz o relatório rodar a config MANUAL (todas as marcas).
    const v = document.getElementById("Form1_id_visao");
    if (v) {
      if (![...v.options].some(o => o.value === "")) { const o = document.createElement("option"); o.value = ""; o.text = "(nenhuma)"; v.insertBefore(o, v.firstChild); }
      v.value = ""; v.dispatchEvent(new Event("change"));
    }
    // reforço: limpa multiselects herdados no DOM
    const resetSelect = (name) => {
      const s = document.querySelector(`select[name="${name}"]`); if (!s) return;
      const temTodos = [...s.options].some(o => o.value === "");
      [...s.options].forEach(o => { o.selected = temTodos ? (o.value === "") : false; });
      s.dispatchEvent(new Event("change"));
    };
    ["marcas", "colecoes", "linhas", "classificacao", "setores", "series", "cfops", "vendedores", "tabelasPreco", "produtos", "clientefornecedor"].forEach(resetSelect);

    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb => cb.checked = false);
    const el = document.getElementById("empresas_" + emp); if (el) el.checked = true;
    document.getElementById("f_data1").value = di;
    document.getElementById("f_data2").value = df;
    setRadio("f_sintetico", sint);
    setRadio("f_agrupamento", agrup);
    const tc = document.querySelector('select[name="tipo_custo"]'); if (tc) tc.value = custo;
    setChk("custo_medio_epoca", true);
    setChk("markup_margem", true);
  }, { emp: EMP, di: DI, df: DF, sint: SINT, agrup: AGRUP, custo: CUSTO });
  await page.waitForTimeout(400);

  // etapa 1: Gerar Relatório (prepara)
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}),
    page.evaluate(() => { const b = document.querySelector('input[name="Form1_SubmitVisao"]'); if (b) b.click(); }),
  ]);
  await page.waitForTimeout(2000);

  // bug empresa-1: desmarca duplicatas, remarca só a desejada
  await page.evaluate((emp) => {
    document.querySelectorAll('input[id="empresas_1"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[value="1"][type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll(`input[id="empresas_${emp}"]`).forEach(cb => cb.checked = true);
    document.querySelectorAll(`input[value="${emp}"][type="checkbox"]`).forEach(cb => cb.checked = true);
  }, EMP);

  // etapa 2: OK (gera de fato) — dispara NAVEGAÇÃO (POST → página de resultados)
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {}),
    page.evaluate(() => {
      const b = [...document.querySelectorAll("button, input[type=button], input[type=submit], a")].find(el => (el.textContent || "").trim() === "OK" || el.value === "OK");
      if (b) b.click();
    }),
  ]);
  await page.waitForTimeout(2500);  // deixa o resultado assentar antes de poll (evita context destroyed)

  // O relatório do Microvix faz STREAMING (linhas chegam aos poucos; o Totais só no fim).
  // Espera a linha "Totais" aparecer E a contagem de linhas estabilizar. Até 180s.
  let ok = false, lastN = -1, stable = 0;
  for (let i = 0; i < 180; i++) {
    await page.waitForTimeout(1000);
    const st = await page.evaluate(() => {
      const trs = document.querySelectorAll("table tr");
      const hasTot = [...trs].some(r => [...r.querySelectorAll("td")].some(c => c.textContent.trim() === "Totais"));
      return { n: trs.length, hasTot };
    }).catch(() => ({ n: -1, hasTot: false }));
    if (st.hasTot) { // achou Totais: confirma estabilidade da tabela (fim do streaming)
      if (st.n === lastN) { if (++stable >= 2) { ok = true; break; } } else stable = 0;
      lastN = st.n;
    }
  }
  if (!ok) throw new Error("linha Totais não estabilizou em 180s");
}

async function extrair(page) {
  return await page.evaluate(() => {
    const norm = s => (s || "").trim().replace(/\s+/g, " ");
    const rows = [...document.querySelectorAll("table tr")];
    const prod = {};      // agregado por código (analítico)
    const grupos = [];    // subtotais por grupo (sintético)
    const dbg = { totalTr: rows.length, lenHist: {}, skipped12notNum: [], matched: 0 };
    let totais = null;
    let grupoAtual = null;
    for (const tr of rows) {
      const cells = [...tr.querySelectorAll("td")].map(c => norm(c.textContent));
      dbg.lenHist[cells.length] = (dbg.lenHist[cells.length] || 0) + 1;
      if (cells.length >= 12 && !/^\d+$/.test(cells[0]) && !cells.includes("Totais") && dbg.skipped12notNum.length < 12) dbg.skipped12notNum.push(cells.slice(0, 12));
      // header de grupo (1 célula): "Marca: X", "Vendedor - Y", "Setor: Z"...
      if (cells.length === 1) {
        const m = cells[0].match(/(?:Marca|Setor|Linha|Cole[cç][aã]o|Fornecedor|Classifica[cç][aã]o)\s*[:\-]\s*(.+)/i);
        if (m) grupoAtual = m[1].trim();
        continue;
      }
      // linha Totais gerais
      if (cells.includes("Totais")) { totais = cells; continue; }
      // subtotal de grupo (sintético): normalmente "Total Grupo" ou vem logo após header sem linhas de produto
      const isSubtotal = cells.some(c => /^Total\s*Grupo$/i.test(c));
      if (isSubtotal && grupoAtual) {
        // acha o valor de faturamento — última coluna monetária antes de markup/margem
        grupos.push({ grupo: grupoAtual, cells });
        continue;
      }
      // linha de produto analítico: 12 células, [0] numérico
      // ⚠️ COLUNAS DE PREÇO SÃO UNITÁRIAS (Custo Época[6], Pr.Tabela[8], Pr.Venda Líq[9]);
      //    só CMV Total[7] já vem multiplicado. Faturamento/custo da LINHA = unitário × qtd[5].
      if (cells.length >= 12 && /^\d+$/.test(cells[0])) {
        const cod = cells[0];
        const br = t => { const v = parseFloat(String(t ?? "0").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "")); return isNaN(v) ? 0 : v; };
        const qtd = br(cells[5]);
        const fatLine = br(cells[9]) * qtd;         // Pr.Venda Líq (unit) × qtd
        const custoEpLine = br(cells[6]) * qtd;     // Custo Época (unit) × qtd  → base da margem do ERP
        const cmvLine = br(cells[7]);               // CMV Total (já total)
        const prTabLine = br(cells[8]) * qtd;       // Pr.Tabela (unit) × qtd
        if (!prod[cod]) prod[cod] = { cod, desc: cells[1], ref: cells[2], un: cells[3], qtd: 0, custoEpoca: 0, cmv: 0, fat: 0, prTabela: 0, custoUnitLast: cells[6] };
        prod[cod].qtd += qtd;
        prod[cod].custoEpoca += custoEpLine;
        prod[cod].cmv += cmvLine;
        prod[cod].fat += fatLine;
        prod[cod].prTabela += prTabLine;
        prod[cod].custoUnitLast = cells[6];
        dbg.matched++;
      }
    }
    return { prodArr: Object.values(prod), grupos, totais, dbg };
  });
}

async function main() {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  try {
    await garantirSessao(page, { log, tokenOpcional: true });
  } catch (e) {
    log(`login: ${e.code || ""} ${e.message}`); await ctx.close().catch(() => {});
    process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
  }

  let raw = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { await gerar(page); raw = await extrair(page); break; }
    catch (e) { log(`tentativa ${attempt + 1} falhou: ${e.message}`); if (attempt < 2) await page.waitForTimeout(3000); }
  }
  await ctx.close().catch(() => {});
  if (!raw) { log("coleta falhou 3x"); process.exit(1); }

  const t = raw.totais || [];
  // Totais (10 cols): [3]=qtd [4]=custoEpoca [5]=cmvTotal [6]=prTabela [7]=faturamento [8]=markup [9]=margem
  const totais = {
    qtd: parseBR(t[3]), custoEpoca: parseBR(t[4]), cmvTotal: parseBR(t[5]),
    prTabela: parseBR(t[6]), faturamento: parseBR(t[7]), markup: parseBR(t[8]), margem: parseBR(t[9]),
  };

  const out = { emp: EMP, loja: EMP_TO_LOJA[EMP], di: DI, df: DF, sintetico: SINT, agrup: AGRUP, custo: CUSTO, totais, _dbg: raw.dbg };

  if (SINT === "N") {
    out.rows = raw.prodArr.map(p => ({
      cod: p.cod, desc: p.desc, ref: p.ref, un: p.un,
      qtd: p.qtd,
      custoEpoca: Math.round(p.custoEpoca * 100) / 100,
      cmv: Math.round(p.cmv * 100) / 100,
      faturamento: Math.round(p.fat * 100) / 100,
      prTabela: Math.round(p.prTabela * 100) / 100,
      custoUnit: parseBR(p.custoUnitLast),
      // margem pela Custo Época (mesma base que o ERP usa no Totais)
      margem: p.fat > 0 ? Math.round((p.fat - p.custoEpoca) / p.fat * 1000) / 10 : 0,
    }));
    const somaFat = out.rows.reduce((s, r) => s + r.faturamento, 0);
    log(`analítico: ${out.rows.length} produtos · somaFat R$${somaFat.toFixed(2)} vs totais R$${totais.faturamento.toFixed(2)} · margem ${totais.margem}%`);
  } else {
    out.grupos = raw.grupos.map(g => ({ grupo: g.grupo, cells: g.cells }));
    log(`sintético: ${out.grupos.length} grupos · fat R$${totais.faturamento.toFixed(2)}`);
  }
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}
main().catch(e => { log(`FATAL ${e.message}`); process.exit(1); });
