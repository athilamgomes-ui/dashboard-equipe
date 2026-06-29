#!/usr/bin/env node
/**
 * coleta_fiscal_ncm.mjs — Coleta o cadastro fiscal por produto×loja do relatório
 * "Suprimentos > Estoque > Relatórios > Manutenção" (relatorio_manut.asp ->
 * relatorio_manut_listagem.asp). Por produto captura: codigo, descricao, ncm,
 * cest, config (id da Config Tributária), origem.
 *
 * Foco eficiente: filtra pelas Config. Tributárias TI (1=TI-PA, 10=PA-LR) — o
 * conjunto que SAI com ICMS ~19%. É nele que mora o erro "pagar 19% onde o NCM
 * é ST". (Passe "ST" como 3º arg p/ coletar as configs ST=2,11 — auditoria reversa.)
 *
 * Headless, reusa microvix_auth. Read-only (NÃO altera o ERP).
 *
 * Uso:
 *   node coleta_fiscal_ncm.mjs                -> TI, lojas 1,3,4,10 -> fiscal_ncm_ti.json
 *   node coleta_fiscal_ncm.mjs 1              -> TI, só emp 1 (debug parcial no stdout)
 *   node coleta_fiscal_ncm.mjs 1 TI 2         -> TI, emp1, só 2 páginas (teste)
 *   node coleta_fiscal_ncm.mjs all ST         -> ST, todas
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp";
const log = m => process.stderr.write(`[fiscal] ${m}\n`);

const argEmp = process.argv[2] && process.argv[2] !== "all" ? [parseInt(process.argv[2], 10)] : [1, 3, 4, 10];
const MODO = (process.argv[3] || "TI").toUpperCase();
const MAXPG = process.argv[4] ? parseInt(process.argv[4], 10) : 0; // 0 = todas
const CFGS = MODO === "ST" ? ["2", "11"] : ["1", "10"];
const OUT = `/Users/elkgomes/Desktop/claude/dashboard-equipe/fiscal_ncm_${MODO.toLowerCase()}.json`;
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };

async function gotoRetry(page, url, { tentativas = 3 } = {}) {
  let err;
  for (let i = 0; i < tentativas; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }); return; }
    catch (e) { err = e; log(`goto falhou (${i + 1}): ${String(e.message).split("\n")[0]} — retry`); await page.waitForTimeout(4000); }
  }
  throw err;
}

// parseia a página de listagem atualmente carregada: retorna {recs, pgTotal}
async function parsePagina(page) {
  return await page.evaluate(() => {
    const out = [];
    // cada produto tem um select config_tributaria_<cod>_<emp> com option selected
    const sels = document.querySelectorAll("select[name^='config_tributaria_']");
    for (const s of sels) {
      const mm = s.name.match(/^config_tributaria_(\d+)_(\d+)$/);
      if (!mm) continue;
      const codigo = mm[1];
      const sel = s.options[s.selectedIndex];
      const configId = sel ? sel.value : "";
      const configTxt = sel ? (sel.textContent || "").replace(/\s+/g, " ").trim() : "";
      // NCM/CEST estão na MESMA linha (tr) do select
      const tr = s.closest("tr");
      let ncm = null, cest = null;
      if (tr) {
        const t = tr.innerText || tr.textContent || "";
        const mn = t.match(/\b(\d{8})\b/); if (mn) ncm = mn[1];
        const mc = t.match(/\b(\d{2}\.\d{3}\.\d{2})\b/); if (mc && mc[1] !== "00.000.00") cest = mc[1];
      }
      // descrição/ref via campos por produto
      const gv = nm => { const e = document.getElementsByName(nm); return e && e[0] ? (e[0].value || "").trim() : null; };
      const desc = gv("descr_" + codigo) || "";
      const ref = gv("ref_" + codigo) || "";
      // origem mercadoria (select por produto)
      let origem = null;
      const os = document.querySelector(`select[name^='id_origem_mercadoria_${codigo}']`) || (document.getElementsByName("id_origem_mercadoria_" + codigo)[0]);
      if (os && os.options && os.selectedIndex >= 0) origem = (os.options[os.selectedIndex].value || "");
      out.push({ codigo, desc, ref, ncm, cest, config: configId, configTxt, origem });
    }
    const b = document.body.innerText;
    const mp = b.match(/de\s*(\d+)\s*p[aá]gina/i);
    return { recs: out, pgTotal: mp ? parseInt(mp[1], 10) : 1 };
  });
}

async function coletaEmpresa(page, E) {
  log(`emp${E} [${MODO}]: abrindo relatório...`);
  await gotoRetry(page, URL);
  await page.waitForSelector("#empresas_1", { timeout: 20000 });
  await page.waitForTimeout(700);
  await page.evaluate(({ emp, cfgs }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.checked = v; };
    ["chConfig_tributaria", "chClassIpi", "chClassCest", "ch_id_origem_mercadoria", "chDescricaoBasica", "chReferencia"].forEach(id => set(id, true));
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    set("empresas_" + emp, true);
    const s = document.getElementById("select_filtro_config_tributaria");
    if (s) [...s.options].forEach(o => o.selected = cfgs.includes(o.value));
    document.querySelectorAll("input[name=multiselect_select_filtro_config_tributaria]").forEach(c => { c.checked = cfgs.includes(c.value); });
    const ms = document.getElementById("marcas"); if (ms) [...ms.options].forEach(o => o.selected = (o.value === ""));
  }, { emp: E, cfgs: CFGS });
  await page.waitForTimeout(300);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => null),
    page.evaluate(() => document.getElementById("Form1").submit()),
  ]);
  await page.waitForTimeout(3500);

  const map = {};
  let { recs, pgTotal } = await parsePagina(page);
  recs.forEach(r => { if (r.codigo) map[r.codigo] = r; });
  const total = MAXPG ? Math.min(MAXPG, pgTotal) : pgTotal;
  log(`emp${E}: ${pgTotal} páginas (coletando ${total}); pg1=${recs.length}`);

  for (let p = 2; p <= total; p++) {
    let ok = false;
    for (let tent = 0; tent < 3 && !ok; tent++) {
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => null),
          page.evaluate((pg) => {
            const f = document.forms["manut_paginado"];
            if (f && f.pagina) f.pagina.value = pg;
            if (document.forms["Form1"] && document.forms["Form1"].pagina) document.forms["Form1"].pagina.value = pg;
            f.submit();
          }, p),
        ]);
        await page.waitForTimeout(2500);
        const r = await parsePagina(page);
        if (r.recs.length === 0 && tent < 2) { throw new Error("página vazia"); }
        r.recs.forEach(x => { if (x.codigo) map[x.codigo] = x; });
        ok = true;
        if (p % 10 === 0 || p === total) log(`  emp${E} pg ${p}/${total} — acum ${Object.keys(map).length}`);
      } catch (e) { log(`  emp${E} pg ${p} retry (${tent + 1}): ${String(e.message).slice(0, 50)}`); await page.waitForTimeout(2000); }
    }
  }
  const arr = Object.values(map);
  log(`emp${E}: ${arr.length} produtos coletados (c/ncm=${arr.filter(r => r.ncm).length})`);
  return arr;
}

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1600, height: 1000 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  const result = {};
  for (const E of argEmp) {
    try { result[EMP_TO_LOJA[E] || E] = await coletaEmpresa(page, E); }
    catch (e) { log(`emp${E} FALHOU: ${e.message}`); result[EMP_TO_LOJA[E] || E] = []; }
    // grava incremental a cada loja
    writeFileSync(OUT, JSON.stringify({ _coletado_em: new Date().toISOString(), modo: MODO, configs: CFGS, lojas: result }, null, 1));
  }
  log(`gravado ${OUT}`);
  if (MAXPG) process.stdout.write(JSON.stringify(result[EMP_TO_LOJA[argEmp[0]]]?.slice(0, 8) || [], null, 1));
  await ctx.close().catch(() => {});
  process.exit(0);
} catch (e) {
  log("FALHA " + e.message);
  await ctx.close().catch(() => {});
  process.exit(1);
}
