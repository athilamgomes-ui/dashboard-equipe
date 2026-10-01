#!/usr/bin/env node
/**
 * backfill_despesas_dre.mjs <ANO> <MES_INI> <MES_FIM> — preenche os meses HISTÓRICOS de despesas
 * (caixa = faturas PAGAS por mês de pagamento, agrupadas por Conta Débito) no cache
 * financeiro/dre_despesas_2026.json, puxando o MESMO relatório que o coleta_financeiro usa
 * (relatorio_faturas_periodo_recebidas.asp lado pagar). Uma sessão, loop meses×lojas.
 *
 * Rode UMA VEZ para trás (ex.: `node backfill_despesas_dre.mjs 2026 1 8`). O mês corrente/anterior
 * são mantidos todo dia pelo pipeline via atualiza_despesas_dre.mjs (sem ERP). Meses pagos fechados
 * não mudam. Faz MERGE (não apaga meses já no cache).
 *
 * Exit: 0 ok (≥1 célula) · 1 falha · 2 login · 3 arg
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_PAGAS = "https://linx.microvix.com.br/gestor_web/financeiro/relatorio_faturas_periodo_recebidas.asp?ParametroParaFavoritos=pagar";
const CACHE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "financeiro", "dre_despesas_2026.json");
const LOJAS = [{ key: "L1", id: 1 }, { key: "L3", id: 3 }, { key: "L4", id: 4 }, { key: "L5", id: 10 }];
const log = m => process.stderr.write(`[backfill-desp] ${m}\n`);
const pad = n => String(n).padStart(2, "0");
const brToNum = s => parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;

const ANO = parseInt(process.argv[2] || "0", 10);
const MES_INI = parseInt(process.argv[3] || "0", 10);
const MES_FIM = parseInt(process.argv[4] || "0", 10);
if (!ANO || !MES_INI || !MES_FIM || MES_INI > MES_FIM) { log("uso: node backfill_despesas_dre.mjs <ANO> <MES_INI> <MES_FIM>"); process.exit(3); }

async function coletarPago(page, empId, ini, fim) {
  await page.goto(URL_PAGAS, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#empresas_" + empId, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.evaluate(({ ini, fim, empId }) => {
    const setV = (id, v) => { const e = document.getElementById(id); if (e) { e.disabled = false; e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); } };
    setV("data_inicial", ini); setV("data_final", fim);
    document.querySelectorAll('input[id^="empresas_"]').forEach(cb => { cb.checked = false; });
    const e1 = document.getElementById("empresas_" + empId); if (e1) e1.checked = true;
    const rp = document.getElementsByName("receber_ou_pagar")[0]; if (rp) rp.value = "pagar";
  }, { ini, fim, empId });
  await page.evaluate(() => { const r = document.getElementById("conta_debito"); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } });
  await page.waitForTimeout(300);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {}),
    page.click('input[name="Prosseguir"][type="submit"]').catch(() => {}),
  ]);
  await page.waitForTimeout(2000);
  const text = await page.evaluate(() => (document.body.innerText || "").replace(/\r/g, ""));
  const tp = text.match(/Total Pago:\s*R\$\s*([\d.]+,\d{2})/i);
  const categorias = [];
  const catRe = /Total faturas baixadas na Conta Débito\s+(.+?)\s*:\s*R?\$?\s*([\d.]+,\d{2})/g;
  let m; while ((m = catRe.exec(text)) !== null) categorias.push({ nome: m[1].trim(), valor: brToNum(m[2]) });
  return { total: tp ? brToNum(tp[1]) : 0, categorias };
}

let cache; try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch { cache = { ano: ANO, L1: {}, L3: {}, L4: {}, L5: {} }; }
for (const { key } of LOJAS) if (!cache[key]) cache[key] = {};

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`login: ${e.code || ""} ${e.message}`); await ctx.close().catch(() => {}); process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1); }

let okCount = 0;
for (let mes = MES_INI; mes <= MES_FIM; mes++) {
  const last = new Date(ANO, mes, 0).getDate();
  const ini = `01/${pad(mes)}/${ANO}`, fim = `${pad(last)}/${pad(mes)}/${ANO}`;
  const mk = `${ANO}-${pad(mes)}`;
  for (const { key, id } of LOJAS) {
    try {
      const r = await coletarPago(page, id, ini, fim);
      cache[key][mk] = { total: Math.round(r.total * 100) / 100, cats: r.categorias.map(c => ({ nome: c.nome, valor: c.valor })) };
      okCount++;
      log(`  ${key} ${mk}: total=${Math.round(r.total)} cats=${r.categorias.length}`);
    } catch (e) { log(`  ERRO ${key} ${mk}: ${e.message}`); }
  }
}
await ctx.close().catch(() => {});
if (okCount === 0) { log("FATAL: nada coletado"); process.exit(1); }
cache.ano = ANO; cache.atualizadoEm = new Date().toISOString();
fs.writeFileSync(CACHE, JSON.stringify(cache));
log(`OK: ${okCount} loja×mês gravados em ${CACHE}`);
process.exit(0);
