#!/usr/bin/env node
/**
 * coleta_amgomes_mensal.mjs <ANO> [MES_FINAL] [DIA_FINAL]
 *
 * Coleta o faturamento (Venda Líquida) MÊS A MÊS de cada loja em uma única
 * sessão do Microvix (login uma vez, várias consultas ao relatório Vendas por Lojas).
 *
 * - ANO: ano civil (ex.: 2025 ou 2026)
 * - MES_FINAL: último mês a coletar (1–12). Default = 12.
 * - DIA_FINAL: dia-limite aplicado APENAS ao último mês (MES_FINAL). Opcional.
 *   Se informado, o último mês é coletado de 01 até DIA_FINAL (mês parcial).
 *   Se omitido, todos os meses são coletados inteiros (01 até último dia).
 *
 * ⚠️ Para comparação YoY SIMÉTRICA: chamar os DOIS anos com o MESMO
 *   MES_FINAL e DIA_FINAL (ex.: ano corrente e anterior ambos "6 10" →
 *   junho 01–10 nos dois). Assim o mês em curso nunca compara parcial vs inteiro.
 *
 * Saída JSON no stdout (ordem [L5, L4, L1, L3] em cada array, igual a maiAcum):
 *   { ano, meses:[1..N], L5:[...], L4:[...], L1:[...], L3:[...] }
 * Valores = Venda Líquida (inteiros). Mês sem dado vira 0.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
import { rankingCliente } from "./cliente8_ranking.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_REL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_vendas_lojas.asp";
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const COD_EXCLUIR = "8";   // R MAURA DE FREITAS — venda entre lojas, não conta no total

function logErr(msg) { process.stderr.write(`[mensal] ${msg}\n`); }

const ANO = parseInt(process.argv[2] || "0", 10);
if (!ANO) { logErr("uso: node coleta_amgomes_mensal.mjs <ANO> [MES_FINAL]"); process.exit(2); }
const MES_FINAL = parseInt(process.argv[3] || "12", 10);
const DIA_FINAL = process.argv[4] ? parseInt(process.argv[4], 10) : null;

const pad = n => String(n).padStart(2, "0");
const ultimoDia = (ano, mes) => new Date(ano, mes, 0).getDate(); // mes 1-12

// Monta a lista de períodos (um por mês)
const periodos = [];
for (let m = 1; m <= MES_FINAL; m++) {
  const di = `01/${pad(m)}/${ANO}`;
  // DIA_FINAL só se aplica ao último mês (MES_FINAL); demais meses = inteiros
  const dfDia = (m === MES_FINAL && DIA_FINAL) ? DIA_FINAL : ultimoDia(ANO, m);
  const df = `${pad(dfDia)}/${pad(m)}/${ANO}`;
  periodos.push({ mes: m, di, df });
}

const t0 = Date.now();
logErr(`launch headless... ano=${ANO} meses=1..${MES_FINAL}`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());

try {
  await garantirSessao(page, { log: logErr });
} catch (e) {
  logErr(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
}

const out = { ano: ANO, meses: periodos.map(p => p.mes), L5: [], L4: [], L1: [], L3: [] };

for (const { mes, di, df } of periodos) {
  logErr(`mês ${mes}: ${di} a ${df}`);
  await page.goto(URL_REL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#empresas_1", { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.evaluate(({ di, df }) => {
    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb => cb.checked = false);
    for (const id of [1, 3, 4, 10]) {
      const el = document.getElementById("empresas_" + id);
      if (el) el.checked = true;
    }
    const d1 = document.getElementById("periodo_inicial");
    const d2 = document.getElementById("periodo_final");
    if (d1) d1.value = di;
    if (d2) d2.value = df;
  }, { di, df });

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('input[type=submit]')]
      .find(b => /gerar|filtr|ok/i.test(b.value || ""));
    if (btn) btn.click();
  });

  let rows = null;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    rows = await page.evaluate(() => {
      const trs = [...document.querySelectorAll("table tr")];
      const out = [];
      for (const tr of trs) {
        const cells = [...tr.querySelectorAll("td, th")].map(c => c.textContent.trim());
        if (cells.length >= 6 && /^\d+\s*-/.test(cells[0])) out.push(cells);
      }
      return out;
    });
    if (rows && rows.length > 0) break;
  }

  const porEmp = { 1: 0, 3: 0, 4: 0, 10: 0 };
  if (rows) {
    for (const cells of rows) {
      const m = cells[0].match(/^(\d+)\s*-/);
      if (!m) continue;
      const emp = parseInt(m[1], 10);
      if (!(emp in porEmp)) continue;
      const vliq = Math.round(parseFloat((cells[5] || "0").replace(/\./g, "").replace(",", ".")) || 0);
      porEmp[emp] = vliq;
    }
  } else {
    logErr(`  mês ${mes}: tabela não apareceu — gravando 0`);
  }

  // Excluir cliente 8 (R MAURA — venda entre lojas) de cada loja neste mês.
  // Não-fatal: ranking que falhar subtrai 0 e loga.
  for (const emp of [1, 3, 4, 10]) {
    try {
      const c8 = await rankingCliente(page, emp, di, df, COD_EXCLUIR);
      if (c8.valor > 0) {
        porEmp[emp] = Math.max(0, porEmp[emp] - Math.round(c8.valor));
        logErr(`  mês ${mes} emp${emp}: -cliente${COD_EXCLUIR} R$${c8.valor.toFixed(2)} → ${porEmp[emp]}`);
      }
    } catch (e) {
      logErr(`  mês ${mes} emp${emp}: ranking cliente${COD_EXCLUIR} falhou — mantém valor cheio`);
    }
  }

  out.L5.push(porEmp[10]);
  out.L4.push(porEmp[4]);
  out.L1.push(porEmp[1]);
  out.L3.push(porEmp[3]);
  logErr(`  mês ${mes}: L1=${porEmp[1]} L3=${porEmp[3]} L4=${porEmp[4]} L5=${porEmp[10]} (líq. cliente${COD_EXCLUIR})`);
}

logErr(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.stdout.write(JSON.stringify(out));
await ctx.close().catch(() => {});
process.exit(0);
