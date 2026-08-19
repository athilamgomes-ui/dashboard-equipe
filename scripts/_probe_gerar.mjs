#!/usr/bin/env node
/**
 * _probe_gerar.mjs — prova o DISPARO do relatorio_prod_vendidos.asp em modo
 * analítico por produto (L3, 1 semana) e mapeia as COLUNAS da tabela de saída.
 * Testa: Gerar Relatório (Form1_SubmitVisao) + "Prosseguir >" + captura popup/mesma página.
 * Descartável.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";
const log = m => process.stderr.write(`[gerar] ${m}\n`);

const EMP = 3, DI = "01/07/2026", DF = "07/07/2026";

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log, tokenOpcional: true });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#f_data1", { timeout: 15000 });
  await page.waitForTimeout(1200);

  // configurar: empresa 3, datas, analítico (N), agrupamento nenhum (por produto),
  // custo médio época, ligar margem + custo_medio_epoca
  await page.evaluate(({ emp, di, df }) => {
    const setRadio = (name, val) => { const r = [...document.querySelectorAll(`input[name="${name}"]`)].find(x => x.value === val); if (r) { r.checked = true; r.dispatchEvent(new Event("click")); } };
    const setChk = (name, on) => { document.querySelectorAll(`input[name="${name}"]`).forEach(c => c.checked = on); };
    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb => cb.checked = false);
    const el = document.getElementById("empresas_" + emp); if (el) el.checked = true;
    document.getElementById("f_data1").value = di;
    document.getElementById("f_data2").value = df;
    setRadio("f_sintetico", "N");           // analítico
    setRadio("f_agrupamento", "nenhum");    // por produto, sem agrupar
    const tc = document.querySelector('select[name="tipo_custo"]'); if (tc) tc.value = "medio_epoca";
    setChk("custo_medio_epoca", true);
    setChk("markup_margem", true);
  }, { emp: EMP, di: DI, df: DF });
  await page.waitForTimeout(500);

  // dispara "Gerar Relatório" (Form1_SubmitVisao) — carrega/prepara
  const popupP = page.waitForEvent("popup", { timeout: 10000 }).catch(() => null);
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}),
    page.evaluate(() => { const b = document.querySelector('input[name="Form1_SubmitVisao"]'); if (b) b.click(); }),
  ]);
  await page.waitForTimeout(2500);

  // DUMP: quais botões existem agora?
  const botoesAgora = await page.evaluate(() => [...document.querySelectorAll("button, input[type=button], input[type=submit]")].map(b => ({ n: b.name || "", v: b.value || "", t: (b.textContent || "").trim().slice(0, 25) })));
  log("botões após SubmitVisao: " + JSON.stringify(botoesAgora));

  // clica "OK" (fluxo provado do cron_etapa2) — ou Prosseguir como fallback
  const popup2P = page.waitForEvent("popup", { timeout: 10000 }).catch(() => null);
  const okClicked = await page.evaluate(() => {
    const cand = [...document.querySelectorAll("button, input[type=button], input[type=submit], a")];
    let b = cand.find(el => (el.textContent || "").trim() === "OK" || el.value === "OK");
    if (!b) b = cand.find(el => /Prosseguir|Gerar|Confirmar/i.test((el.textContent || el.value || "")));
    if (b) { b.click(); return (b.textContent || b.value || "").trim(); } return null;
  });
  log("clicou pós-submit: " + okClicked);
  await page.waitForTimeout(2500);

  const popup = (await popupP) || (await popup2P);
  const target = popup || page;
  if (popup) log("resultado abriu em POPUP: " + popup.url());
  await target.waitForTimeout(3000);

  // espera tabela com "Totais" ou linhas de produto
  let dump = null;
  for (let i = 0; i < 30; i++) {
    await target.waitForTimeout(1000);
    dump = await target.evaluate(() => {
      const rows = [...document.querySelectorAll("table tr")];
      if (rows.length < 3) return null;
      const hasTot = rows.some(r => (r.textContent || "").includes("Totais") || (r.textContent || "").includes("Total"));
      // pega até 3 linhas de header (as com th ou muitas células curtas) + primeiras data rows
      const sample = rows.slice(0, 40).map(r => [...r.querySelectorAll("td,th")].map(c => (c.textContent || "").trim().replace(/\s+/g, " ")));
      const totalRows = rows.filter(r => /Totais/i.test(r.textContent || "")).map(r => [...r.querySelectorAll("td,th")].map(c => (c.textContent || "").trim()));
      return { nrows: rows.length, hasTot, sample, totalRows };
    });
    if (dump && dump.hasTot) break;
  }
  console.log(JSON.stringify(dump, null, 1));
  await ctx.close().catch(() => {});
  process.exit(0);
} catch (e) {
  log("FALHA " + e.message);
  await ctx.close().catch(() => {});
  process.exit(1);
}
