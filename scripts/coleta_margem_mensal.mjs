#!/usr/bin/env node
/**
 * coleta_margem_mensal.mjs <ANO> [MES_FINAL] [MES_INICIAL]
 *
 * FONTE DO CMV do Painel Financeiro (DRE). Para cada loja (L1,L3,L4,L5) e cada mês,
 * dirige o relatório "Produtos Vendidos" (relatorio_prod_vendidos.asp) SINTÉTICO POR MARCA
 * com CUSTO ÉPOCA (custo médio no dia da venda = o CMV correto) e lê os subtotais por marca
 * + a linha Totais.
 *
 * ⚠️ À PROVA DE CUSTO MÉDIO CORROMPIDO (achado 01/10/2026): uma marca pode vir com custo
 *   época ENVENENADO (custo > faturamento → margem negativa impossível; ex. L3/set SANTA CLARA
 *   custo ~14.250 sobre venda 2.080 = −585%, derrubava o L3 de ~55% p/ 34%). Isso é erro de
 *   cadastro de custo no ERP, não realidade. Então, por loja/mês:
 *     - custoRaw   = Σ custo de todas as marcas (fiel ao ERP)
 *     - custo      = Σ custo com marcas anômalas CAPADAS em custo=faturamento (margem 0%, conservador)
 *     - anomalias  = [{marca, fat, custo}] das marcas capadas — p/ o painel SINALIZAR e o dono
 *                    corrigir o custo no ERP (o agente NUNCA escreve custo no ERP).
 *   A MARGEM é calculada aqui = (fat - custo)/fat (a coluna "margem%" do ERP é markup, NÃO usar).
 *
 * Login uma única vez; loop meses×lojas na mesma sessão. Relatório faz STREAMING (Totais só no
 * fim) — espera estabilizar (até 180s/célula). PESADO → o pipeline coleta só o mês corrente e faz
 * merge com os fechados em margem_$ANO.json (merge_margem_mensal.mjs).
 *
 * STDOUT JSON:
 *   { ano, meses:[1..N],
 *     L1:[{fat,custo,custoRaw,margem,anomalias:[{marca,fat,custo}]}], L3:[...], L4:[...], L5:[...] }
 *   (reais; margem em % 1 casa; mês sem venda → {fat:0,custo:0,custoRaw:0,margem:0,anomalias:[]})
 * Exit: 0 ok (≥1 célula) · 1 falha total · 2 creds/login · 3 arg inválido
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";
const LOJAS = [{ key: "L1", emp: 1 }, { key: "L3", emp: 3 }, { key: "L4", emp: 4 }, { key: "L5", emp: 10 }];
const log = m => process.stderr.write(`[margem] ${m}\n`);

const ANO = parseInt(process.argv[2] || "0", 10);
if (!ANO) { log("uso: node coleta_margem_mensal.mjs <ANO> [MES_FINAL] [MES_INICIAL]"); process.exit(3); }
const hoje = new Date();
const mesCorrente = (ANO === hoje.getFullYear()) ? hoje.getMonth() + 1 : 12;
const MES_FINAL = parseInt(process.argv[3] || String(mesCorrente), 10);
const MES_INICIAL = process.argv[4] ? Math.min(MES_FINAL, Math.max(1, parseInt(process.argv[4], 10))) : 1;

const pad = n => String(n).padStart(2, "0");
const ultimoDia = (ano, mes) => new Date(ano, mes, 0).getDate();
const parseBR = t => { const v = parseFloat(String(t ?? "0").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "")); return isNaN(v) ? 0 : v; };
const r2 = n => Math.round(n * 100) / 100;

const periodos = [];
for (let m = MES_INICIAL; m <= MES_FINAL; m++) {
  const dfDia = (ANO === hoje.getFullYear() && m === hoje.getMonth() + 1) ? hoje.getDate() : ultimoDia(ANO, m);
  periodos.push({ mes: m, di: `01/${pad(m)}/${ANO}`, df: `${pad(dfDia)}/${pad(m)}/${ANO}` });
}

async function gotoRetry(page, url, n = 3) {
  let err; for (let i = 0; i < n; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }); return; }
    catch (e) { err = e; log(`goto retry ${i + 1}: ${String(e.message).split("\n")[0]}`); await page.waitForTimeout(4000); }
  } throw err;
}

// Gera o relatório sintético por marca p/ uma empresa+período. Retorna { marcas:[{marca,fat,custo}], totais } ou null.
async function gerar(page, emp, di, df) {
  await gotoRetry(page, URL);
  await page.waitForSelector("#f_data1", { timeout: 15000 });
  await page.waitForTimeout(1000);

  await page.evaluate(({ emp, di, df }) => {
    const setRadio = (name, val) => { const r = [...document.querySelectorAll(`input[name="${name}"]`)].find(x => x.value === val); if (r) { r.checked = true; r.dispatchEvent(new Event("click")); } };
    const setChk = (name, on) => { document.querySelectorAll(`input[name="${name}"]`).forEach(c => c.checked = on); };
    // ZERAR A VISÃO salva (filtra marcas no servidor) → caminho "Prosseguir >" com todas as marcas.
    const vis = document.getElementById("Form1_id_visao");
    if (vis) {
      if (![...vis.options].some(o => o.value === "")) { const o = document.createElement("option"); o.value = ""; o.text = "(nenhuma)"; vis.insertBefore(o, vis.firstChild); }
      vis.value = ""; vis.dispatchEvent(new Event("change"));
    }
    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb => cb.checked = false);
    const el = document.getElementById("empresas_" + emp); if (el) el.checked = true;
    document.getElementById("f_data1").value = di;
    document.getElementById("f_data2").value = df;
    setRadio("f_sintetico", "S");               // sintético (subtotais por grupo, sem produtos)
    setRadio("f_agrupamento", "codigo_marca");  // agrup por marca
    const tc = document.querySelector('select[name="tipo_custo"]'); if (tc) tc.value = "medio_epoca";
    setChk("custo_medio_epoca", true);
    setChk("markup_margem", true);
  }, { emp, di, df });
  await page.waitForTimeout(400);

  // etapa 1: prepara
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}),
    page.evaluate(() => { const b = document.querySelector('input[name="Form1_SubmitVisao"]'); if (b) b.click(); }),
  ]);
  await page.waitForTimeout(2000);
  // bug empresa-1: remarca só a desejada
  await page.evaluate((emp) => {
    document.querySelectorAll('input[id="empresas_1"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[value="1"][type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll(`input[id="empresas_${emp}"]`).forEach(cb => cb.checked = true);
    document.querySelectorAll(`input[value="${emp}"][type="checkbox"]`).forEach(cb => cb.checked = true);
  }, emp);
  // etapa 2: Prosseguir (gera) — navega
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {}),
    page.evaluate(() => {
      const cand = [...document.querySelectorAll("button, input[type=button], input[type=submit], a")];
      let b = cand.find(el => /Prosseguir/i.test((el.textContent || el.value || "")));
      if (!b) b = cand.find(el => (el.textContent || "").trim() === "OK" || el.value === "OK");
      if (b) b.click();
    }),
  ]);
  await page.waitForTimeout(2500);

  // STREAMING: espera a linha Totais aparecer E a contagem estabilizar (até 180s).
  let ok = false, lastN = -1, stable = 0;
  for (let i = 0; i < 180; i++) {
    await page.waitForTimeout(1000);
    const st = await page.evaluate(() => {
      const trs = document.querySelectorAll("table tr");
      const hasTot = [...trs].some(r => [...r.querySelectorAll("td")].some(c => c.textContent.trim() === "Totais"));
      return { n: trs.length, hasTot };
    }).catch(() => ({ n: -1, hasTot: false }));
    if (st.hasTot) { if (st.n === lastN) { if (++stable >= 2) { ok = true; break; } } else stable = 0; lastN = st.n; }
  }
  if (!ok) return null;

  // Extrai subtotais por marca + Totais. (subtotal 9 cells: [2]qtd [3]custoEpoca [4]cmv [5]prTab [6]fat; Totais: [4]custo [7]fat)
  return await page.evaluate(() => {
    const norm = s => (s || "").trim().replace(/\s+/g, " ");
    const br = t => { const v = parseFloat(String(t ?? "0").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "")); return isNaN(v) ? 0 : v; };
    const marcas = []; let grupoAtual = null, totais = null;
    for (const tr of document.querySelectorAll("table tr")) {
      const cells = [...tr.querySelectorAll("td")].map(c => norm(c.textContent));
      if (cells.includes("Totais")) { totais = cells; continue; }
      if (cells.length === 1) {
        const m = cells[0].match(/(?:Marca|Fornecedor|Classifica[cç][aã]o)\s*[:\-]\s*(.+)/i);
        if (m) grupoAtual = m[1].trim();
        continue;
      }
      if (cells.some(c => /^Total\s*Grupo$/i.test(c)) && grupoAtual) {
        marcas.push({ marca: grupoAtual, fat: br(cells[6]), custo: br(cells[3]) });
      }
    }
    return { marcas, totais };
  });
}

const t0 = Date.now();
log(`launch headless... ano=${ANO} meses=${MES_INICIAL}..${MES_FINAL} lojas=4 (PESADO: streaming por célula)`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log, tokenOpcional: true });
} catch (e) {
  log(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
}

const vazio = () => ({ fat: 0, custo: 0, custoRaw: 0, margem: 0, margemRaw: 0, anomalias: [] });
const out = { ano: ANO, meses: periodos.map(p => p.mes), L1: [], L3: [], L4: [], L5: [] };
let okCount = 0;
for (const { mes, di, df } of periodos) {
  for (const { key, emp } of LOJAS) {
    let cell = vazio(), raw = null;
    for (let att = 0; att < 3; att++) {
      try {
        const r = await gerar(page, emp, di, df);
        if (r) {
          // guarda anti-parse-incompleto: Totais com faturamento mas custo das marcas somando ~0
          // = streaming pego cedo (deu "margem 100%" em L1/ago e L4/mai no backfill 01/10). Re-tenta.
          const cr = r.marcas.reduce((s, m) => s + (m.custo || 0), 0);
          const ft = parseBR((r.totais || [])[7]);
          if (ft > 0 && cr <= 0 && r.marcas.length > 0) { log(`  ${key} ${mes}/${ANO} tentativa ${att + 1}: custo=0 com fat>0 (parse incompleto) — re-tenta`); await page.waitForTimeout(3000); continue; }
          raw = r; break;
        }
      }
      catch (e) { log(`  ${key} ${mes}/${ANO} tentativa ${att + 1}: ${String(e.message).split("\n")[0]}`); }
      await page.waitForTimeout(2500);
    }
    if (raw) {
      const t = raw.totais || [];
      const fatTot = parseBR(t[7]);                         // faturamento autoritativo (Totais)
      const fat = fatTot > 0 ? fatTot : raw.marcas.reduce((s, m) => s + m.fat, 0);
      const PISO_ANOM = 300;                                // excesso mínimo (R$) p/ tratar como corrupção
      let custoRaw = 0, custo = 0; const anomalias = [];
      for (const m of raw.marcas) {
        custoRaw += m.custo;
        if (m.fat > 0 && m.custo > m.fat && (m.custo - m.fat) >= PISO_ANOM) { // custo médio ENVENENADO
          anomalias.push({ marca: m.marca, fat: r2(m.fat), custo: r2(m.custo) });
          custo += m.fat;                                   // capa em custo=fat (margem 0%, conservador)
        } else custo += Math.max(0, m.custo);
      }
      const mg = c => fat > 0 ? Math.round((fat - c) / fat * 1000) / 10 : 0;
      cell = {
        fat: r2(fat), custo: r2(custo), custoRaw: r2(custoRaw),
        margem: mg(custo), margemRaw: mg(custoRaw), anomalias,
      };
      okCount++;
      const flag = anomalias.length ? ` ⚠${anomalias.length}anom(${anomalias.map(a => a.marca).join(",")})` : "";
      const mRaw = fat > 0 ? ((fat - custoRaw) / fat * 100).toFixed(1) : "0";
      log(`  ${key} ${mes}/${ANO}: fat=${Math.round(fat)} custo=${Math.round(custo)} margem=${cell.margem}% (raw ${mRaw}%)${flag}`);
    } else {
      log(`  ${key} ${mes}/${ANO}: Totais não veio — gravando 0`);
    }
    out[key].push(cell);
  }
}
await ctx.close().catch(() => {});
log(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s — ${okCount}/${periodos.length * 4} células`);
if (okCount === 0) { log("FATAL: nada coletado"); process.exit(1); }
process.stdout.write(JSON.stringify(out));
process.exit(0);
