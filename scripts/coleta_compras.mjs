#!/usr/bin/env node
/**
 * coleta_compras.mjs — Coleta Playwright headless para o DASHBOARD DE COMPRAS.
 *
 * Substitui a coleta via Chrome MCP (que falhava em background — WebSocket morto).
 * Roda 100% headless via perfil persistente (~/.claude/microvix-profile) + Keychain,
 * sem depender da extensão Claude in Chrome.
 *
 * Produz `compras_raw.json` no formato esperado por build_dashboard.py:
 *   { saldos:{L1:{brand:{prods:[{c,d,r,v,s,t}]}},...}, notas:[...], pendentes:{"1":{NFes},...} }
 *
 * Uso:
 *   node coleta_compras.mjs            → coleta tudo e grava compras_raw.json
 *   node coleta_compras.mjs saldos     → só saldos (stdout JSON, debug)
 *   node coleta_compras.mjs notas      → só notas
 *   node coleta_compras.mjs pendentes  → só pendentes
 *
 * Exit codes: 0=ok, 1=falha genérica, 2=creds/login.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const OUT_RAW = "/Users/elkgomes/Desktop/claude/compras/compras_raw.json";
const stage = (process.argv[2] || "all").toLowerCase();

const log = m => process.stderr.write(`[compras] ${m}\n`);

const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };

const URL_SALDO = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp";
const URL_NOTAS = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_notas.asp?modulo=estoque";
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";

const pad = n => String(n).padStart(2, "0");
const fmtBR = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const HOJE = new Date();

// Espera a tabela ASP de RESULTADO terminar de renderizar. Os relatórios
// carregam linhas progressivamente, mas a página do formulário (pré-submit) já
// tem algumas linhas próprias — por isso só começamos a contar estabilidade
// DEPOIS que a contagem cresce além de `baseline + minDelta` (resultado começou
// a chegar). Resolve quando para de crescer por `stableNeeded` checagens.
async function aguardarTabelaEstavel(page, { baseline = 0, minDelta = 100, maxMs = 150000, intervalo = 1500, stableNeeded = 3 } = {}) {
  let last = -1, stable = 0, started = false;
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(intervalo);
    const n = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);
    if (!started) {
      if (n >= baseline + minDelta) started = true; else { last = n; continue; }
    }
    if (n === last) {
      if (++stable >= stableNeeded) return n;
    } else {
      stable = 0;
    }
    last = n;
  }
  return last;
}

// Navegação com retry (blips de rede ocasionais: ERR_INTERNET_DISCONNECTED).
async function gotoRetry(page, url, { tentativas = 3, timeout = 45000 } = {}) {
  let err;
  for (let i = 0; i < tentativas; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout });
      return;
    } catch (e) {
      err = e;
      log(`goto falhou (${i + 1}/${tentativas}): ${e.message.split("\n")[0]} — retry em 4s`);
      await page.waitForTimeout(4000);
    }
  }
  throw err;
}

// "12/01/26" (dd/mm/yy) → "2026-01-12" ISO + {mes, ano}
function brDateToISO(s) {
  const m = /(\d{2})\/(\d{2})\/(\d{2,4})/.exec(String(s || "").trim());
  if (!m) return null;
  let [, dd, mm, yy] = m;
  const ano = yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
  return { iso: `${ano}-${mm}-${dd}`, mes: parseInt(mm, 10), ano };
}
function parseNumBR(s) {
  s = String(s || "").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ======================= SALDOS (Etapa 2/3) =======================
async function coletaSaldoLoja(page, E) {
  log(`saldo loja emp${E}: navegando...`);
  await gotoRetry(page, URL_SALDO);
  await page.waitForSelector("#empresas_1", { timeout: 20000 });
  await page.waitForTimeout(800);
  const baseline = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);

  await page.evaluate(({ E, d60, hoje, ini }) => {
    const fd = document;
    const set = (id, v) => { const e = fd.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    set("empresas_" + E, true);

    const sv = (id, v) => { const e = fd.getElementById(id); if (e) e.value = v; };
    sv("data1", d60); sv("data2", hoje);          // vendas 60d
    const c1 = fd.querySelector("[name=data1_compra]"); if (c1) c1.value = ini;
    const c2 = fd.querySelector("[name=data2_compra]"); if (c2) c2.value = hoje;

    set("controle_dif_periodo", true);
    set("exibe_estoque_transito", true);
    set("somenteDisp", false);

    const dep = fd.querySelector("select[name=depositos]");
    if (dep) [...dep.options].forEach(o => o.selected = true);

    // Analítica + agrupar por Marca, SEM filtro de marca
    const fa = fd.querySelector("input[name=formas][value=A]"); if (fa) fa.checked = true;
    const ag = fd.querySelector("select[name=f_agrupamento]");
    if (ag) [...ag.options].forEach(o => o.selected = (o.text.trim() === "Marca"));
  }, {
    E,
    d60: fmtBR(new Date(HOJE.getTime() - 60 * 86400000)),
    hoje: fmtBR(HOJE),
    ini: `01/01/${HOJE.getFullYear()}`,
  });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("input[type=submit], input[type=button], button, a")]
      .find(b => /^gerar/i.test((b.value || b.textContent || "").trim()));
    if (btn) btn.click();
  });

  // Aguardar render completo (tabela carrega progressivamente)
  await aguardarTabelaEstavel(page, { baseline, minDelta: 200, maxMs: 180000 });
  const byBrand = await page.evaluate(() => {
    const num = s => { s = String(s || "").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, ""); const n = parseFloat(s); return isNaN(n) ? 0 : n; };
    let curBrand = null;
    const out = {};
    let prodCount = 0;
    for (const tr of document.querySelectorAll("tr")) {
      const txt = (tr.textContent || "").trim();
      const m = txt.match(/Marca:\s*([A-ZÁÉÍÓÚÇÃÕ0-9 .\-\/\&]+?)\s*\((\d+)\)/i);
      if (m) { curBrand = m[1].trim(); continue; }
      const c = tr.cells; if (!c || c.length !== 11) continue;
      const cod = (c[0].textContent || "").trim(); if (!/^\d+$/.test(cod)) continue;
      if (!curBrand || /GERAL/.test(curBrand)) continue;
      if (!out[curBrand]) out[curBrand] = { prods: [] };
      out[curBrand].prods.push({
        c: cod, d: (c[1].textContent || "").trim(), r: (c[2].textContent || "").trim(),
        v: num(c[8].textContent), t: num(c[9].textContent), s: num(c[10].textContent),
      });
      prodCount++;
    }
    return prodCount > 0 ? out : null;
  });
  if (!byBrand) throw new Error(`saldo emp${E}: tabela não renderizou`);
  const nb = Object.keys(byBrand).length;
  const np = Object.values(byBrand).reduce((a, b) => a + b.prods.length, 0);
  log(`saldo loja emp${E}: ${nb} marcas, ${np} produtos`);
  return byBrand;
}

async function coletaSaldos(ctx, page) {
  // Sequencial (1 loja por vez) — relatório pesado; paralelo saturava o servidor
  // e derrubava a conexão. ~15-30s por loja, ~1-2min total.
  const saldos = {};
  for (const E of EMPRESAS) {
    try {
      saldos[EMP_TO_LOJA[E]] = await coletaSaldoLoja(page, E);
    } catch (e) {
      log(`saldo emp${E} FALHOU: ${e.message}`);
      saldos[EMP_TO_LOJA[E]] = {};
    }
  }
  return saldos;
}

// ======================= NOTAS (Etapa 3.5) =======================
async function coletaNotas(page) {
  log(`notas: navegando...`);
  await gotoRetry(page, URL_NOTAS);
  await page.waitForSelector("#empresas_1", { timeout: 20000 });
  await page.waitForTimeout(800);
  const baseline = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);

  await page.evaluate(({ hoje, ini }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.checked = v; };
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    [1, 3, 4, 10].forEach(i => set("empresas_" + i, true));
    document.getElementById("data1").value = ini;
    document.getElementById("data2").value = hoje;
    // tipo_data = data_documento (Emissão)
    document.querySelectorAll("input[name=tipo_data]").forEach(r => { r.checked = (r.value === "data_documento"); });
    // tipo_listagem = A (Analítica)
    document.querySelectorAll("input[name=tipo_listagem]").forEach(r => { r.checked = (r.value === "A"); });
    // CFOP [E] ... COMPRA
    const sel = document.getElementById("cfop");
    if (sel) {
      [...sel.options].forEach(o => o.selected = /\[E\][\s\S]*COMPRA/.test((o.text || "").toUpperCase()));
      try { window.jQuery && window.jQuery(sel).multiselect("refresh"); } catch (e) {}
    }
  }, { hoje: fmtBR(HOJE), ini: `01/01/${HOJE.getFullYear()}` });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("input[type=submit], button")].find(b => /gerar/i.test(b.value || b.textContent || ""));
    if (btn) btn.click();
  });

  // Aguardar render completo (tabela carrega progressivamente — ~10s p/ ano todo)
  await aguardarTabelaEstavel(page, { baseline, minDelta: 100, maxMs: 120000 });
  // Parse: caminhar linhas; header de nota = 10 cells com data em [0]; item = 7 cells com código numérico em [0]
  const notas = await page.evaluate(() => {
    const trs = [...document.querySelectorAll("table tr")];
    if (trs.length < 8) return null;
    const out = [];
    let cur = null;
    let sawHeader = false;
    for (const tr of trs) {
      const c = tr.cells; if (!c) continue;
      const cells = [...c].map(x => (x.textContent || "").trim());
      if (c.length === 10 && /^\d{2}\/\d{2}\/\d{2,4}$/.test(cells[0])) {
        // nota header
        if (cur) out.push(cur);
        const doc = (cells[3] || "").split(/\s|\n/)[0].trim();
        cur = {
          emissao: cells[0], lcto: cells[1], doc,
          natureza: cells[4], forn: cells[5],
          valor: cells[8], emp: cells[9], itens: [],
        };
        sawHeader = true;
      } else if (c.length === 7 && /^\d+$/.test(cells[0])) {
        // item de nota
        if (cur) cur.itens.push({ c: cells[0], sub: cells[6] });
      }
    }
    if (cur) out.push(cur);
    return sawHeader ? out : null;
  });
  if (!notas) throw new Error("notas: tabela não renderizou");

  // Normalizar
  const EMP = { "1": "L1", "3": "L3", "4": "L4", "10": "L5" };
  const norm = [];
  for (const n of notas) {
    const de = brDateToISO(n.emissao);
    const dl = brDateToISO(n.lcto);
    if (!de) continue;
    const loja = EMP[String(parseInt(n.emp, 10))];
    if (!loja) continue;
    norm.push({
      loja, doc: n.doc, data: de.iso, mes: de.mes, ano: de.ano,
      data_lancamento: dl ? dl.iso : null,
      valor: parseNumBR(n.valor), forn: n.forn,
      itens: n.itens.map(it => ({ c: it.c, v: parseNumBR(it.sub) })),
    });
  }
  log(`notas: ${norm.length} notas (${notas.length} brutas)`);
  return norm;
}

// ======================= PENDENTES (Etapa 3.6) =======================
async function coletaPendentes(page) {
  log(`pendentes: navegando entrada_nfe...`);
  await gotoRetry(page, URL_NFE);
  // aguardar token_api
  let token = null;
  for (let i = 0; i < 30; i++) {
    token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null);
    if (token) break;
    await page.waitForTimeout(500);
  }
  if (!token) throw new Error("pendentes: token_api indisponível");
  log(`pendentes: token_api OK (${token.length} chars)`);

  const out = await page.evaluate(async (empresas) => {
    const pad = n => String(n).padStart(2, "0");
    const now = new Date();
    const d90 = new Date(now.getTime() - 90 * 86400000);
    const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T03:00:00.000Z`;
    const token = localStorage.getItem("token_api");
    const base = (localStorage.getItem("url_fiscal_api") || "https://fiscalwebapi-prod.microvix.com.br").replace(/\/$/, "");
    const res = {};
    for (const E of empresas) {
      try {
        const r = await fetch(base + "/api/NfeEntrada/ObterListaNFesPendentesPorEmpresa", {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify({ IdEmpresa: E, DataInicial: iso(d90), DataFinal: iso(now), Status: "Validos" }),
        });
        const txt = await r.text();
        try { res[String(E)] = JSON.parse(txt); }
        catch { res[String(E)] = { NFes: [], _erro: "json parse", _status: r.status }; }
      } catch (e) {
        res[String(E)] = { NFes: [], _erro: String(e) };
      }
    }
    return res;
  }, EMPRESAS);

  for (const E of EMPRESAS) {
    const n = (out[String(E)] && out[String(E)].NFes) ? out[String(E)].NFes.length : 0;
    log(`pendentes emp${E}: ${n} NFes`);
  }
  return out;
}

// ======================= MAIN =======================
const t0 = Date.now();
log(`launch headless (stage=${stage})...`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());

try {
  await garantirSessao(page, { log });
} catch (e) {
  log(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
}

try {
  if (stage === "saldos") {
    const r = await coletaSaldos(ctx, page);
    process.stdout.write(JSON.stringify(r));
  } else if (stage === "notas") {
    const r = await coletaNotas(page);
    process.stdout.write(JSON.stringify(r));
  } else if (stage === "pendentes") {
    const r = await coletaPendentes(page);
    process.stdout.write(JSON.stringify(r));
  } else {
    // ALL — saldos (sequencial) primeiro, depois notas e pendentes na page principal
    const saldos = await coletaSaldos(ctx, page);
    const notas = await coletaNotas(page);
    const pendentes = await coletaPendentes(page);
    const raw = { saldos, notas, pendentes, _coletado_em: new Date().toISOString() };
    writeFileSync(OUT_RAW, JSON.stringify(raw));
    const totProds = Object.values(saldos).reduce((a, lj) => a + Object.values(lj || {}).reduce((x, b) => x + b.prods.length, 0), 0);
    log(`compras_raw.json gravado: saldos=${totProds} produtos, notas=${notas.length}, pendentes={${EMPRESAS.map(E => (pendentes[String(E)]?.NFes?.length || 0)).join(",")}}`);
  }
  log(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await ctx.close().catch(() => {});
  process.exit(0);
} catch (e) {
  log(`FALHA: ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(1);
}
