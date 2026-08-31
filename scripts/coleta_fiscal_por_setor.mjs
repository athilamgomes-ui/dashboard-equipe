#!/usr/bin/env node
/**
 * coleta_fiscal_por_setor.mjs — NCM + Config Tributária por produto×loja.
 *
 * POR QUE EXISTE: relatorio_manut.asp tem TETO DE 20 PÁGINAS (4.000 produtos).
 * A pg21 volta vazia e a pg22 derruba o form com "Sessão expirada". O
 * coleta_fiscal_ncm.mjs gravava o pedaço em silêncio — foi assim que o
 * fiscal_ncm_ti.json ficou 2 meses com 1/3 do catálogo. Aqui a consulta é
 * partida POR SETOR, então cada pedaço cabe no teto.
 *
 * Sem filtro de config: traz TODAS as configurações tributárias de uma vez.
 * Uso: node coleta_fiscal_por_setor.mjs [emp|all]
 */
import { chromium } from "playwright-core";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE = process.env.MICROVIX_PROFILE || join(homedir(), ".claude", "microvix-analise");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp";
const OUT = "/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas/fiscal_por_setor.json";
const log = m => process.stderr.write(`[fs] ${m}\n`);
const EMPS = process.argv[2] && process.argv[2] !== "all" ? [parseInt(process.argv[2], 10)] : [1, 3, 4, 10];
const L = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const TETO = 20; // páginas por consulta — acima disso o ERP derruba a sessão

async function parse(page) {
  return page.evaluate(() => {
    const out = [];
    for (const s of document.querySelectorAll("select[name^='config_tributaria_']")) {
      const mm = s.name.match(/^config_tributaria_(\d+)_(\d+)$/); if (!mm) continue;
      const sel = s.options[s.selectedIndex];
      const tr = s.closest("tr"); let ncm = null, cest = null;
      if (tr) { const t = tr.innerText || ""; const mn = t.match(/\b(\d{8})\b/); if (mn) ncm = mn[1]; const mc = t.match(/\b(\d{2}\.\d{3}\.\d{2})\b/); if (mc && mc[1] !== "00.000.00") cest = mc[1]; }
      const gv = n => { const e = document.getElementsByName(n); return e && e[0] ? (e[0].value || "").trim() : null; };
      out.push({ codigo: mm[1], desc: gv("descr_" + mm[1]) || "", ncm, cest, config: sel ? sel.value : "", configTxt: sel ? (sel.textContent || "").replace(/\s+/g, " ").trim() : "" });
    }
    const mp = (document.body.innerText || "").match(/de\s*(\d+)\s*p[aá]gina/i);
    return { recs: out, pgTotal: mp ? parseInt(mp[1], 10) : 1 };
  });
}

const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1600, height: 1000 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", async d => { await d.accept().catch(() => {}); });
await garantirSessao(page, { log, tokenOpcional: true });
const lojas = {}, aviso = [];
for (const E of EMPS) {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#empresas_1", { timeout: 20000 });
  await page.waitForTimeout(1200);
  const setores = await page.evaluate(() => { const s = document.querySelector("select[name=setores]"); return s ? [...s.options].map(o => ({ v: o.value, t: o.text.trim() })).filter(o => o.v !== "") : []; });
  log(`emp${E}: ${setores.length} setores`);
  const map = {};
  for (const st of setores) {
    let pg1;
    try {
      await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForSelector("#empresas_1", { timeout: 20000 });
      await page.waitForTimeout(800);
      await page.evaluate(({ emp, setor }) => {
        const set = (id, v) => { const e = document.getElementById(id); if (e) e.checked = v; };
        ["chConfig_tributaria", "chClassCest", "chReferencia"].forEach(id => set(id, true));
        [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false)); set("empresas_" + emp, true);
        const s = document.querySelector("select[name=setores]"); if (s) [...s.options].forEach(o => o.selected = (o.value === setor));
        const c = document.querySelector("input[name=codigo_setor]"); if (c) c.value = setor;
      }, { emp: E, setor: st.v });
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => null), page.evaluate(() => document.getElementById("Form1").submit())]);
      await page.waitForTimeout(2500);
      pg1 = await parse(page);
    } catch (e) { aviso.push(`emp${E} setor ${st.t}: ${String(e.message).slice(0, 60)}`); continue; }
    pg1.recs.forEach(r => { if (r.codigo) map[r.codigo] = r; });
    if (pg1.pgTotal > TETO) aviso.push(`emp${E} setor "${st.t}": ${pg1.pgTotal} páginas — ACIMA DO TETO, vai truncar`);
    const alvo = Math.min(pg1.pgTotal, TETO);
    for (let p = 2; p <= alvo; p++) {
      try {
        await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => null), page.evaluate(pg => { const f = document.forms["manut_paginado"]; if (f && f.pagina) { f.pagina.value = pg; f.submit(); } }, p)]);
        await page.waitForTimeout(1800);
        const r = await parse(page);
        r.recs.forEach(x => { if (x.codigo) map[x.codigo] = x; });
      } catch (e) { aviso.push(`emp${E} setor "${st.t}" pg${p}: ${String(e.message).slice(0, 50)}`); break; }
    }
  }
  lojas[L[E]] = Object.values(map);
  log(`emp${E}: ${lojas[L[E]].length} produtos (c/ncm=${lojas[L[E]].filter(r => r.ncm).length})`);
  writeFileSync(OUT, JSON.stringify({ _coletado_em: new Date().toISOString(), _avisos: aviso, lojas }));
}
if (aviso.length) { log(`⚠ ${aviso.length} avisos:\n  ` + aviso.slice(0, 10).join("\n  ")); }
log("gravado " + OUT);
await ctx.close();
