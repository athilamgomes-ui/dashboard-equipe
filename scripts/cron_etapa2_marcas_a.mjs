#!/usr/bin/env node
/**
 * cron_etapa2_marcas_a.mjs
 *
 * Etapa 2 do cron premiacao: % Marcas A por loja por semana (visão 22 do Microvix).
 * 100% headless via Playwright — não depende de Chrome MCP.
 *
 * USO:
 *   node scripts/cron_etapa2_marcas_a.mjs '[{"id":"S1","di":"01/05/2026","df":"09/05/2026"},...]' '<totais_loja_json>'
 *
 *   - argv[2]: array de semanas JSON [{id, di, df}]
 *   - argv[3]: JSON {L1: {S1: 41806, S2: 29170, ...}, L3: ..., L4: ..., L5: ...}
 *     (vindos da Etapa 1; usado pra calcular o % marcas A = vendasA / total_loja × 100)
 *
 * STDOUT: JSON {L1: {S1: 20.9, ...}, L3: {...}, L4: {...}, L5: {...}}
 *
 * STDERR: logs de progresso (não interfere no parse).
 *
 * Exit codes:
 *   0 - ok
 *   1 - falha genérica
 *   2 - credenciais inválidas / login falhou
 *   3 - argumento inválido
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");

const URL_RELATORIO =
  "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";

const EMPRESAS = [1, 3, 4, 10];
const LOJA_POR_EMPRESA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };

function logErr(msg) {
  process.stderr.write(`[cron_etapa2] ${msg}\n`);
}

/**
 * Roda o relatório "Vendas 30%- A" (visão 22) pra uma empresa+período e retorna
 * o R$ total vendido em marcas A (cells[7] da linha Totais).
 *
 * ⚠️ BUG VISÃO 22: ao submeter, o ERP injeta checkboxes duplicados de empresa 1
 * no DOM. Antes de clicar OK, precisamos remover TODOS os checkboxes de empresa 1
 * e remarcar SÓ a empresa desejada.
 */
async function fetchMarcasA(page, empresaId, dataInicial, dataFinal) {
  // Sempre nova navegação pra resetar estado e evitar context destroyed
  await page.goto(URL_RELATORIO, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#f_data1", { timeout: 15000 });
  await page.waitForTimeout(1500);

  // PASSO 1: configurar form (empresa N, datas, visão 22)
  await page.evaluate(({empId, di, df}) => {
    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb => cb.checked = false);
    const el = document.getElementById("empresas_" + empId);
    if (el) el.checked = true;
    document.getElementById("f_data1").value = di;
    document.getElementById("f_data2").value = df;
    const v = document.getElementById("Form1_id_visao");
    if (v) { v.value = "22"; v.dispatchEvent(new Event("change")); }
  }, {empId: empresaId, di: dataInicial, df: dataFinal});

  // PASSO 2: submeter visão (carrega as marcas A no form via JS)
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}),
    page.click('input[name="Form1_SubmitVisao"]'),
  ]);
  await page.waitForTimeout(2000);
  // Garante que o form está pronto antes de mexer no DOM
  await page.waitForSelector('input[id="empresas_1"]', { timeout: 10000 }).catch(() => {});

  // PASSO 3: BUG VISÃO 22 — empresa 1 injetada. Desmarca tudo e remarca só a desejada.
  await page.evaluate((empId) => {
    document.querySelectorAll('input[id="empresas_1"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[value="1"][type="checkbox"]').forEach(cb => cb.checked = false);
    // remarca a empresa correta (pode haver duplicatas - clica todos)
    document.querySelectorAll(`input[id="empresas_${empId}"]`).forEach(cb => cb.checked = true);
    // alguns elementos têm value mas id diferente
    document.querySelectorAll(`input[value="${empId}"][type="checkbox"]`).forEach(cb => cb.checked = true);
  }, empresaId);

  // PASSO 4: verificar via DOM que SÓ a empresa desejada está marcada
  const empresasMarcadas = await page.evaluate(() => {
    return [...document.querySelectorAll('input[type=checkbox][id^="empresas_"]:checked')].map(cb => cb.id.replace('empresas_',''));
  });
  // Filtra só ids numéricos (alguns checkboxes podem ser de outros grupos)
  const empNums = empresasMarcadas.filter(x => /^\d+$/.test(x));
  if (empNums.length !== 1 || empNums[0] !== String(empresaId)) {
    logErr(`⚠ empresas marcadas inesperadas: ${JSON.stringify(empNums)} (esperava ${empresaId})`);
  }

  // PASSO 5: clicar OK pra gerar o relatório
  await page.evaluate(() => {
    const ok = [...document.querySelectorAll("button, input[type=button], input[type=submit], a")]
      .find(el => el.textContent.trim() === "OK" || el.value === "OK");
    if (ok) ok.click();
  });

  // PASSO 6: aguardar tabela de resultados (procurar "Totais" row)
  let totRowCells = null;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    totRowCells = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("table tr")];
      const tr = rows.find(r => [...r.querySelectorAll("td")].some(c => c.textContent.trim() === "Totais"));
      if (!tr) return null;
      return [...tr.querySelectorAll("td")].map(c => c.textContent.trim());
    });
    if (totRowCells) break;
  }

  if (!totRowCells) {
    logErr(`empresa ${empresaId} ${dataInicial}-${dataFinal}: linha Totais não apareceu em 30s`);
    return 0;
  }

  // Verificar cabeçalho "Empresa(s): N" pra detectar contaminação
  const cabecalho = await page.evaluate(() => (document.body.innerText || "").slice(0, 200));
  const empMatch = cabecalho.match(/Empresa\(s\):\s*([\d,\s]+)/);
  if (empMatch) {
    const empListed = empMatch[1].replace(/\s/g, "").split(",");
    if (empListed.length > 1 || empListed[0] !== String(empresaId)) {
      logErr(`⚠ contaminação detectada: cabeçalho diz "Empresa(s): ${empMatch[1]}" (esperava só ${empresaId})`);
    }
  }

  // Extrai cells[7] = Pr.Venda Líq.
  const cellTxt = totRowCells[7];
  if (!cellTxt) {
    logErr(`empresa ${empresaId} ${dataInicial}-${dataFinal}: cells[7] vazio. totRow=${JSON.stringify(totRowCells)}`);
    return 0;
  }
  // Formato BR: "1.234,56" → 1234.56
  const valor = parseFloat(cellTxt.replace(/\./g, "").replace(",", "."));
  return isNaN(valor) ? 0 : valor;
}

async function main(semanas, totaisLoja) {
  if (!Array.isArray(semanas) || semanas.length === 0) {
    logErr("uso: cron_etapa2_marcas_a.mjs '[{id,di,df}]' '{L1:{S1:N,...}}'");
    process.exit(3);
  }
  if (!totaisLoja || typeof totaisLoja !== "object") {
    logErr("totaisLoja deve ser objeto {L1:{S1:N}, ...}");
    process.exit(3);
  }

  const t0 = Date.now();
  logErr(`launch headless (profile=${PROFILE_DIR})...`);
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1400, height: 900 },
  });
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

  for (const empresaId of EMPRESAS) {
    const loja = LOJA_POR_EMPRESA[empresaId];
    for (const s of semanas) {
      logErr(`${loja} ${s.id} (${s.di}–${s.df})...`);
      let valorA = 0;
      // Retry simples: tenta 2x antes de desistir
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          valorA = await fetchMarcasA(page, empresaId, s.di, s.df);
          break;
        } catch (e) {
          logErr(`  attempt ${attempt+1} erro: ${e.message.slice(0,100)}`);
          if (attempt === 0) await page.waitForTimeout(2000);
        }
      }
      const total = (totaisLoja[loja] || {})[s.id] || 0;
      const pct = total > 0 ? (valorA / total * 100) : 0;
      out[loja][s.id] = Math.round(pct * 10) / 10; // 1 casa decimal
      logErr(`  → vendasA R$${valorA.toFixed(2)} / total R$${total} = ${out[loja][s.id]}%`);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  logErr(`OK em ${elapsed}s`);
  process.stdout.write(JSON.stringify(out));
  await ctx.close().catch(() => {});
  process.exit(0);
}

// ─── ENTRY POINT ────────────────────────────────────────────────────────────
const semanasArg = process.argv[2];
const totaisArg = process.argv[3];
if (!semanasArg || !totaisArg) {
  logErr("Faltam argumentos. Uso:");
  logErr("  node cron_etapa2_marcas_a.mjs '<semanas_json>' '<totais_loja_json>'");
  process.exit(3);
}
let semanas, totais;
try {
  semanas = JSON.parse(semanasArg);
  totais = JSON.parse(totaisArg);
} catch (e) {
  logErr(`erro parseando JSON: ${e.message}`);
  process.exit(3);
}
main(semanas, totais);
