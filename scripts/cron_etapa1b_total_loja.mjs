#!/usr/bin/env node
/**
 * cron_etapa1b_total_loja.mjs
 *
 * Etapa 1B: total de Venda Líquida POR LOJA (do relatório "Vendas por Lojas"
 * do Microvix). Esse total inclui vendas SEM vendedor associado (serviços,
 * devoluções, vendas registradas pelo gerente sem código de vendedor) — coisa
 * que a Etapa 1 (Performance por Vendedor) NÃO conta.
 *
 * Use esse total pra alimentar DADOS_LOJA.vendido_semana/vendido_mes
 * (mostrado pra vendedora e pro Athila como "total da loja").
 * Performance por Vendedor continua sendo a fonte da distribuição individual
 * (necessária pra calcular prêmio por vendedora).
 *
 * USO:
 *   node scripts/cron_etapa1b_total_loja.mjs '[{"id":"S1","di":"01/05/2026","df":"09/05/2026"},...]'
 *
 * STDOUT: JSON {L1:{S1:R$,...}, L3:..., L4:..., L5:...}
 * STDERR: logs de progresso
 *
 * Exit codes: 0=ok, 1=fail, 2=creds, 3=arg
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_REL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_vendas_lojas.asp";

const EMPRESA_PARA_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };

function logErr(msg) { process.stderr.write(`[etapa1b] ${msg}\n`); }

/**
 * Pra um período (di, df), retorna {1: vendaLiquida_L1, 3: ..., 4: ..., 10: ...}.
 * Faz 1 chamada que já traz as 4 lojas de uma vez (vantagem do relatório
 * Vendas por Lojas: aceita múltiplos `empresas=N` no form-encoded).
 */
async function fetchTotalLojas(page, dataInicial, dataFinal) {
  // Navega pra resetar form
  await page.goto(URL_REL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#empresas_1", { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Preenche form
  await page.evaluate(({di, df}) => {
    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb => cb.checked = false);
    for (const id of [1, 3, 4, 10]) {
      const el = document.getElementById("empresas_" + id);
      if (el) el.checked = true;
    }
    const d1 = document.getElementById("periodo_inicial");
    const d2 = document.getElementById("periodo_final");
    if (d1) d1.value = di;
    if (d2) d2.value = df;
  }, { di: dataInicial, df: dataFinal });

  // Submete (botão "Gerar Relatório >")
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('input[type=submit]')]
      .find(b => /gerar|filtr|ok/i.test(b.value || ""));
    if (btn) btn.click();
  });

  // Aguarda tabela renderizar — procura linhas com "X - NOME EMPRESA"
  let tableRows = null;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    tableRows = await page.evaluate(() => {
      const trs = [...document.querySelectorAll("table tr")];
      const out = [];
      for (const tr of trs) {
        const cells = [...tr.querySelectorAll("td")].map(c => c.textContent.trim());
        if (cells.length >= 6 && /^\d+\s*-/.test(cells[0])) {
          out.push(cells);
        }
      }
      return out;
    });
    if (tableRows && tableRows.length > 0) break;
  }

  if (!tableRows || tableRows.length === 0) {
    logErr(`${dataInicial}–${dataFinal}: tabela não apareceu em 30s`);
    return {};
  }

  // Parse: cells[0]="X - NOME", cells[5]="Venda Líquida" (formato BR: "1.234,56")
  const out = {};
  for (const cells of tableRows) {
    const m = cells[0].match(/^(\d+)\s*-/);
    if (!m) continue;
    const empId = parseInt(m[1], 10);
    const vlrTxt = cells[5];
    if (!vlrTxt) continue;
    const vlr = parseFloat(vlrTxt.replace(/\./g, "").replace(",", "."));
    if (!isNaN(vlr)) out[empId] = vlr;
  }
  return out;
}

async function main(semanas) {
  if (!Array.isArray(semanas) || semanas.length === 0) {
    logErr("uso: cron_etapa1b_total_loja.mjs '[{id,di,df},...]'");
    process.exit(3);
  }

  const t0 = Date.now();
  logErr(`launch headless...`);
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());

  try {
    await garantirSessao(page, { log: logErr });
  } catch (e) {
    logErr(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
    await ctx.close().catch(() => {});
    if (e.code === "NO_CREDS" || e.code === "LOGIN_FAIL") process.exit(2);
    process.exit(1);
  }

  const out = { L1: {}, L3: {}, L4: {}, L5: {} };
  for (const s of semanas) {
    logErr(`${s.id} (${s.di}–${s.df})...`);
    const totais = await fetchTotalLojas(page, s.di, s.df);
    for (const [empId, vlr] of Object.entries(totais)) {
      const loja = EMPRESA_PARA_LOJA[empId];
      if (loja) {
        out[loja][s.id] = Math.round(vlr);
        logErr(`  ${loja}: R$ ${vlr.toFixed(2)}`);
      }
    }
  }

  logErr(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.stdout.write(JSON.stringify(out));
  await ctx.close().catch(() => {});
  process.exit(0);
}

const arg = process.argv[2];
if (!arg) {
  logErr("Faltam argumentos.");
  process.exit(3);
}
let semanas;
try { semanas = JSON.parse(arg); } catch (e) {
  logErr(`erro parseando JSON: ${e.message}`);
  process.exit(3);
}
main(semanas);
