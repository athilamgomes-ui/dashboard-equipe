#!/usr/bin/env node
/**
 * coleta_top_marcas.mjs — Top marcas por UNIDADES VENDIDAS no ANO (01/01→hoje),
 * por loja, para o quadro "Top 10 Marcas" do dashboard de Vendas.
 *
 * Reaproveita o relatório de saldo do ERP (relatorio_compra_venda_saldo_empresa.asp,
 * Analítica agrupado por Marca) — mesma trilha do dashboard de Compras, mas com a
 * janela de VENDAS = ano corrente inteiro (data1=01/01/AAAA, data2=hoje).
 *
 * Roda 1 empresa por vez (sequencial). Headless via perfil persistente + Keychain.
 *
 * Regra de exclusão (EXCLUIR_PRODUTOS): na Santa Clara, ignora produtos "LIXA"
 * (são dados como troco na loja → inflam o ranking artificialmente).
 *
 * Saída (stdout JSON): { geradoEm, periodo:{ini,fim}, L1:{Marca:un,...}, L3, L4, L5 }
 *
 * Exit codes: 0=ok, 1=falha, 2=creds/login.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_SALDO = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp";
const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };

// Marca (minúsculo) → regex de descrição a EXCLUIR
const EXCLUIR_PRODUTOS = { "santa clara": /\bLIXA\b/i };

const log = m => process.stderr.write(`[topmarcas] ${m}\n`);
const pad = n => String(n).padStart(2, "0");
const fmtBR = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const HOJE = new Date();
const INI = `01/01/${HOJE.getFullYear()}`;
const FIM = fmtBR(HOJE);

async function aguardarTabelaEstavel(page, { baseline = 0, minDelta = 200, maxMs = 180000, intervalo = 1500, stableNeeded = 3 } = {}) {
  let last = -1, stable = 0, started = false;
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(intervalo);
    const n = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);
    if (!started) { if (n >= baseline + minDelta) started = true; else { last = n; continue; } }
    if (n === last) { if (++stable >= stableNeeded) return n; } else { stable = 0; }
    last = n;
  }
  return last;
}

async function gotoRetry(page, url, { tentativas = 3, timeout = 45000 } = {}) {
  let err;
  for (let i = 0; i < tentativas; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout }); return; }
    catch (e) { err = e; log(`goto falhou (${i + 1}/${tentativas}): ${e.message.split("\n")[0]} — retry 4s`); await page.waitForTimeout(4000); }
  }
  throw err;
}

async function coletaLoja(page, E) {
  log(`emp${E}: navegando...`);
  await gotoRetry(page, URL_SALDO);
  await page.waitForSelector("#empresas_1", { timeout: 20000 });
  await page.waitForTimeout(800);
  const baseline = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);

  await page.evaluate(({ E, ini, fim }) => {
    const fd = document;
    const set = (id, v) => { const e = fd.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    set("empresas_" + E, true);
    const sv = (id, v) => { const e = fd.getElementById(id); if (e) e.value = v; };
    sv("data1", ini); sv("data2", fim);                 // vendas = ANO INTEIRO
    const c1 = fd.querySelector("[name=data1_compra]"); if (c1) c1.value = ini;
    const c2 = fd.querySelector("[name=data2_compra]"); if (c2) c2.value = fim;
    set("controle_dif_periodo", true);
    set("exibe_estoque_transito", true);   // garante tabela de 11 colunas (vendas=c[8])
    set("somenteDisp", false);
    const dep = fd.querySelector("select[name=depositos]");
    if (dep) [...dep.options].forEach(o => o.selected = true);
    const fa = fd.querySelector("input[name=formas][value=A]"); if (fa) fa.checked = true;   // Analítica
    const ag = fd.querySelector("select[name=f_agrupamento]");
    if (ag) [...ag.options].forEach(o => o.selected = (o.text.trim() === "Marca"));           // agrupar por Marca
  }, { E, ini: INI, fim: FIM });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("input[type=submit], input[type=button], button, a")]
      .find(b => /^gerar/i.test((b.value || b.textContent || "").trim()));
    if (btn) btn.click();
  });
  await aguardarTabelaEstavel(page, { baseline, minDelta: 200, maxMs: 180000 });

  const result = await page.evaluate(({ excluir }) => {
    const num = s => { s = String(s || "").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, ""); const n = parseFloat(s); return isNaN(n) ? 0 : n; };
    let curBrand = null, prodCount = 0;
    const out = {};
    // regras de exclusão (string marca minúscula → fonte do regex)
    const regras = Object.fromEntries(Object.entries(excluir).map(([k, v]) => [k, new RegExp(v.source, v.flags)]));
    for (const tr of document.querySelectorAll("tr")) {
      const txt = (tr.textContent || "").trim();
      const mm = txt.match(/Marca:\s*([A-ZÁÉÍÓÚÇÃÕ0-9 .\-\/\&]+?)\s*\((\d+)\)/i);
      if (mm) { curBrand = mm[1].trim(); continue; }
      const c = tr.cells; if (!c || c.length !== 11) continue;
      const cod = (c[0].textContent || "").trim(); if (!/^\d+$/.test(cod)) continue;
      if (!curBrand || /GERAL/.test(curBrand)) continue;
      const desc = (c[1].textContent || "").trim();
      const reg = regras[curBrand.toLowerCase()];
      if (reg && reg.test(desc)) continue;            // produto excluído (ex.: lixa Santa Clara)
      const un = num(c[8].textContent);               // [8] = vendas (unidades) da loja no período
      if (un <= 0) { prodCount++; continue; }
      out[curBrand] = (out[curBrand] || 0) + un;
      prodCount++;
    }
    return prodCount > 0 ? out : null;
  }, { excluir: EXCLUIR_PRODUTOS });

  if (!result) throw new Error(`emp${E}: tabela não renderizou`);
  const nb = Object.keys(result).length;
  log(`emp${E}: ${nb} marcas com venda`);
  return result;
}

async function main() {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1280, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  try {
    await garantirSessao(page, { log });
  } catch (e) {
    log(`login falhou: ${e.code || ""} ${e.message}`);
    await ctx.close();
    process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
  }

  const out = { geradoEm: FIM, periodo: { ini: INI, fim: FIM } };
  let ok = 0;
  for (const E of EMPRESAS) {
    try { out[EMP_TO_LOJA[E]] = await coletaLoja(page, E); ok++; }
    catch (e) { log(`emp${E} FALHOU: ${e.message}`); out[EMP_TO_LOJA[E]] = null; }
  }
  await ctx.close();

  if (ok === 0) { log("nenhuma loja coletada"); process.exit(1); }
  if (ok < EMPRESAS.length) log(`AVISO: só ${ok}/${EMPRESAS.length} lojas`);
  process.stdout.write(JSON.stringify(out));
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
