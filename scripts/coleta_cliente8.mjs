#!/usr/bin/env node
/**
 * coleta_cliente8.mjs
 *
 * Coleta, por EMPRESA e PERÍODO, o valor faturado para um CLIENTE específico
 * (padrão = código 8 "R MAURA DE FREITAS LTDA") via o relatório
 * Faturamento → Relatórios → Ranking de Clientes (relatorio_ranking.asp →
 * listagem_relat_ranking.asp). É o filtro REAL por cliente, independente do
 * vendedor — usado pra EXCLUIR vendas entre lojas (uma loja comprando da outra)
 * do faturamento da premiação.
 *
 * Uso:
 *   node coleta_cliente8.mjs '<semanas_json>' [codigoCliente]
 *   semanas_json: [{"id":"S4","di":"22/06/2026","df":"30/06/2026"}, ...]
 *
 * Saída (stdout JSON):
 *   { L1:{S4:{valor,qtde,vendas}}, L3:{...}, L4:{...}, L5:{...}, _cliente:8 }
 *   valor/qtde = 0 quando o cliente não comprou daquela loja no período.
 *
 * Exit: 0 ok · 1 falha · 2 creds inválidas
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_ranking.asp";
const EMP_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const log = (m) => process.stderr.write(`[cliente8] ${m}\n`);

const semanas = JSON.parse(process.argv[2] || "[]");
const COD = String(process.argv[3] || "8");
if (!Array.isArray(semanas) || !semanas.length) { log("sem semanas"); process.exit(3); }

// "11.887,58" -> 11887.58
const num = (s) => parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true });
const page = ctx.pages()[0] || (await ctx.newPage());
try { await garantirSessao(page, { log }); }
catch (e) { log(`auth fail ${e.code||""}`); await ctx.close().catch(()=>{}); process.exit(e.code==="NO_CREDS"||e.code==="LOGIN_FAIL"?2:1); }

// Roda o ranking de UM empresa × período e extrai a linha do cliente COD.
async function rankingCliente(emp, di, df) {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#empresas_10", { state: "attached", timeout: 15000 });
  await page.evaluate(({ emp, di, df }) => {
    document.querySelectorAll('input[id^="empresas_"]').forEach((c) => (c.checked = false));
    const e = document.getElementById("empresas_" + emp); if (e) e.checked = true;
    document.getElementById("data1").value = di;
    document.getElementById("data2").value = df;
    const lim = document.getElementById("limite"); if (lim) lim.value = lim.options[0].value; // 'todos'
    const ps = [...document.querySelectorAll('input[name="produtos_servicos"]')]; if (ps.length) ps[ps.length - 1].checked = true; // Ambos
  }, { emp, di, df });
  await Promise.all([
    page.waitForNavigation({ timeout: 30000 }).catch(() => null),
    page.evaluate(() => document.forms.Form1.submit()),
  ]);
  await page.waitForTimeout(1200);
  // Linhas: "Pos | Cliente('8-R MAURA...') | Valor | Qtde | Vendas | Ticket"
  return await page.evaluate((cod) => {
    for (const tr of document.querySelectorAll("table tr")) {
      const c = [...tr.querySelectorAll("td")].map((x) => x.textContent.trim());
      if (c.length >= 4 && new RegExp("^" + cod + "\\s*-").test(c[1] || "")) {
        return { valor: c[2], qtde: c[3], vendas: c[4] };
      }
    }
    return null;
  }, COD);
}

const out = { _cliente: COD };
for (const emp of [1, 3, 4, 10]) {
  const loja = EMP_LOJA[emp];
  out[loja] = {};
  for (const s of semanas) {
    try {
      const r = await rankingCliente(emp, s.di, s.df);
      out[loja][s.id] = r ? { valor: num(r.valor), qtde: num(r.qtde), vendas: num(r.vendas) } : { valor: 0, qtde: 0, vendas: 0 };
      if (out[loja][s.id].valor) log(`${loja} ${s.id} (${s.di}-${s.df}): cliente ${COD} = R$${out[loja][s.id].valor} / ${out[loja][s.id].qtde}pç`);
    } catch (e) {
      log(`${loja} ${s.id} erro: ${e.message.slice(0, 80)} — assumindo 0`);
      out[loja][s.id] = { valor: 0, qtde: 0, vendas: 0 };
    }
  }
}

process.stdout.write(JSON.stringify(out));
await ctx.close().catch(() => {});
process.exit(0);
