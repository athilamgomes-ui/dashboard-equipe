#!/usr/bin/env node
/**
 * coleta_fiscal_por_marca.mjs — NCM por produto, partindo a consulta por MARCA.
 * Complementa coleta_fiscal_por_setor.mjs: setores grandes (GERAL, ACESSÓRIOS) estouram
 * o teto de 20 páginas e perdem o rabo (códigos altos). Por marca cada pedaço é pequeno.
 * Uso: node coleta_fiscal_por_marca.mjs "SANTA CLARA,MARCO BONI"   (vazio = todas)
 */
import { chromium } from "playwright-core";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE = process.env.MICROVIX_PROFILE || join(homedir(), ".claude", "microvix-analise");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp";
const OUT = "/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas/fiscal_por_marca.json";
const log = m => process.stderr.write(`[fm] ${m}\n`);
const ALVO = (process.argv[2] || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
const TETO = 20;
const parse = page => page.evaluate(() => {
  const out = [];
  for (const s of document.querySelectorAll("select[name^='config_tributaria_']")) {
    const mm = s.name.match(/^config_tributaria_(\d+)_(\d+)$/); if (!mm) continue;
    const sel = s.options[s.selectedIndex], tr = s.closest("tr");
    let ncm = null; if (tr) { const m = (tr.innerText || "").match(/\b(\d{8})\b/); if (m) ncm = m[1]; }
    const gv = n => { const e = document.getElementsByName(n); return e && e[0] ? (e[0].value || "").trim() : null; };
    out.push({ codigo: mm[1], desc: gv("descr_" + mm[1]) || "", ncm, config: sel ? sel.value : "", configTxt: sel ? (sel.textContent || "").replace(/\s+/g, " ").trim() : "" });
  }
  const mp = (document.body.innerText || "").match(/de\s*(\d+)\s*p[aá]gina/i);
  return { recs: out, pgTotal: mp ? parseInt(mp[1], 10) : 1 };
});
const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1600, height: 1000 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", async d => { await d.accept().catch(() => {}); });
await garantirSessao(page, { log, tokenOpcional: true });
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("#empresas_1", { timeout: 20000 });
await page.waitForTimeout(1500);
// O select[name=marcas] carrega por AJAX e vem VAZIO no DOM — não dá para enumerar dali.
// Os IDs vêm do nome no relatório de saldo, que sai como "SANTA CLARA (9)".
const IDS = {
  "SANTA CLARA": 9, "MARCO BONI": 2, "KISS NEW YORK": 288, "OTIMO BIJUTERIAS": 940,
  "VIZZELA": 1100, "MUNDIAL": 19, "IMPALA": 22, "REPOS": 919, "KING BOLSAS": 266,
  "ITALLIAN HAIR": 162, "WIDI CARE": 1030, "APSE": 1048, "NATUM PROFISSIONAL": 10,
  "TRUSS": 376, "HAIR EXTRATTUS": 929, "BEAUTY COLOR": 131, "LIZZE": 134, "FELPS": 1000,
  "CBB": 1104, "KAMALEAO": 944, "DEPIL BELLA": 30, "LET ME BE": 936, "INOAR": 347,
  "PELO E PELE": 236, "NATHYDRAS": 885, "CADIVEU": 375, "MUTARI": 1008, "AMEND": 36,
  "SALON LINE": 56, "CLESS": 54, "LABOTRAT": 981, "SOFTHAIR": 103, "BAUNY": 1078,
  "DEPILFLAX": 957, "DELLA E DELLE": 380, "IGORA ROYAL": 377, "YAMA": 57, "VARCARE": 249,
};
const lista = Object.entries(IDS)
  .filter(([t]) => !ALVO.length || ALVO.some(a => t.includes(a)))
  .map(([t, v]) => ({ t, v: String(v) }));
log(`${lista.length} marcas por ID`);
log(`coletando ${lista.length}: ${lista.map(m => m.t).slice(0, 8).join(", ")}${lista.length > 8 ? "..." : ""}`);
const map = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")).produtos || {}) : {};
const avisos = [];
for (const mk of lista) {
  try {
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("#empresas_1", { timeout: 20000 });
    await page.waitForTimeout(700);
    await page.evaluate(mv => {
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.checked = v; };
      ["chConfig_tributaria", "chClassCest", "chReferencia"].forEach(id => set(id, true));
      [3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false)); set("empresas_1", true);
      const s = document.querySelector("select[name=marcas]"); if (s) [...s.options].forEach(o => o.selected = (o.value === mv));
      const c = document.querySelector("input[name=codigo_marca]"); if (c) c.value = mv;
    }, mk.v);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => null), page.evaluate(() => document.getElementById("Form1").submit())]);
    await page.waitForTimeout(2000);
    let r = await parse(page);
    r.recs.forEach(x => { if (x.codigo) map[x.codigo] = x; });
    if (r.pgTotal > TETO) avisos.push(`${mk.t}: ${r.pgTotal} páginas — trunca`);
    for (let p = 2; p <= Math.min(r.pgTotal, TETO); p++) {
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => null), page.evaluate(pg => { const f = document.forms["manut_paginado"]; if (f && f.pagina) { f.pagina.value = pg; f.submit(); } }, p)]);
      await page.waitForTimeout(1500);
      (await parse(page)).recs.forEach(x => { if (x.codigo) map[x.codigo] = x; });
    }
    log(`  ${mk.t}: acum ${Object.keys(map).length}`);
  } catch (e) { avisos.push(`${mk.t}: ${String(e.message).slice(0, 60)}`); }
  writeFileSync(OUT, JSON.stringify({ _coletado_em: new Date().toISOString(), _avisos: avisos, produtos: map }));
}
log(`${Object.keys(map).length} produtos | ${avisos.length} avisos | gravado ${OUT}`);
await ctx.close();
