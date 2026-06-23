#!/usr/bin/env node
/**
 * coleta_nfes_erp.mjs — coletor LEVE de NFes (pendentes + lançadas recentes) para o
 * app de PLANEJAMENTO DE COMPRAS. Roda 100% headless (reusa microvix_auth + perfil
 * persistente ~/.claude/microvix-profile + Keychain), independente do dashboard de Compras.
 *
 * Pensado para rodar de poucas em poucas horas (ex.: a cada 2h) e deixar o app com o
 * faturamento/entrada bem mais fresco que a coleta 1×/dia do Compras.
 *
 * Saída: lista enxuta [{loja, nf, marca, data, valor, origem, fornecedor}] — mesmo formato
 * que o app já consome (chegadas). Grava na tabela Supabase `nfes_erp` (1 linha jsonb) e,
 * em modo --file, também num JSON local para debug.
 *
 * Uso:
 *   node coleta_nfes_erp.mjs            → coleta e grava no Supabase
 *   node coleta_nfes_erp.mjs --file     → coleta e grava /tmp/nfes_erp.json (debug, sem Supabase)
 *
 * Exit: 0=ok, 2=creds/login, 1=falha.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const SUPABASE_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const FORN_MARCAS = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/compras/fornecedor_marcas.json", "utf8"));

const FILE_MODE = process.argv.includes("--file");
const log = m => process.stderr.write(`[nfes] ${m}\n`);

const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const URL_NOTAS = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_notas.asp?modulo=estoque";

const HOJE = new Date();
const ANO = HOJE.getFullYear();
const pad = n => String(n).padStart(2, "0");
const fmtBR = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const CUTOFF_DIAS = 45;
const CUTOFF = new Date(HOJE.getTime() - CUTOFF_DIAS * 86400000);

// fornecedor → marca (porta de forn_brand_raw do build_dashboard.py). Multi-marca ('+') → null.
function fornBrand(emit) {
  const cnpj = String(emit?.Documento || "").replace(/[.\/-]/g, "");
  let v = (FORN_MARCAS.por_cnpj || {})[cnpj];
  if (v == null) {
    const nome = String(emit?.Nome || "").toUpperCase();
    for (const [sub, mk] of Object.entries(FORN_MARCAS.por_nome_substring || {})) {
      if (nome.includes(String(sub).toUpperCase())) { v = mk; break; }
    }
  }
  if (!v || String(v).includes("+")) return null; // multi-marca → deixa o app casar por valor
  return v;
}
function fornIgnorado(nome) {
  const up = String(nome || "").toUpperCase();
  const lst = (FORN_MARCAS._ignorar_no_dashboard || {}).por_nome_substring || [];
  return lst.some(s => up.includes(String(s).toUpperCase()));
}

const EXCL_NAT = /(AMOSTRA|REMESSA EM CONSIGNA|BONIFIC|DEVOLU|RETORNO|TRANSFER)/i;
const EXCL_CFOP = new Set(["5152","6152","5910","6910","5911","6911","5912","6912","5201","6201","5202","6202","1411","2411","3411"]);
function keepNfe(nfe) {
  const nat = nfe.NaturezaOperacao || "";
  if (EXCL_NAT.test(nat)) return false;
  const cfops = (nfe.Produtos || []).map(p => String(p.CFOP || ""));
  if (cfops.length && cfops.every(c => EXCL_CFOP.has(c))) return false;
  return true;
}

function parseNumBR(s) {
  s = String(s || "").replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
  const n = parseFloat(s); return isNaN(n) ? 0 : n;
}
function brDateToISO(s) {
  const m = /(\d{2})\/(\d{2})\/(\d{2,4})/.exec(String(s || "").trim());
  if (!m) return null;
  let [, dd, mm, yy] = m;
  const ano = yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
  return { iso: `${ano}-${mm}-${dd}`, mes: parseInt(mm, 10), ano };
}
async function gotoRetry(page, url, { tentativas = 3, timeout = 45000 } = {}) {
  let err;
  for (let i = 0; i < tentativas; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout }); return; }
    catch (e) { err = e; log(`goto falhou (${i + 1}): ${e.message.split("\n")[0]} — retry`); await page.waitForTimeout(4000); }
  }
  throw err;
}
async function aguardarTabelaEstavel(page, { baseline = 0, minDelta = 100, maxMs = 120000, intervalo = 1500, stableNeeded = 3 } = {}) {
  let last = -1, stable = 0, started = false; const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(intervalo);
    const n = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);
    if (!started) { if (n >= baseline + minDelta) started = true; else { last = n; continue; } }
    if (n === last) { if (++stable >= stableNeeded) return n; } else stable = 0;
    last = n;
  }
  return last;
}

// ===== PENDENTES (API SEFAZ) =====
async function coletaPendentes(page) {
  log("pendentes: navegando entrada_nfe...");
  await gotoRetry(page, URL_NFE);
  let token = null;
  for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
  if (!token) throw new Error("token_api indisponível");
  const raw = await page.evaluate(async (empresas) => {
    const pad = n => String(n).padStart(2, "0");
    const now = new Date(); const d90 = new Date(now.getTime() - 90 * 86400000);
    const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T03:00:00.000Z`;
    const token = localStorage.getItem("token_api");
    const base = (localStorage.getItem("url_fiscal_api") || "https://fiscalwebapi-prod.microvix.com.br").replace(/\/$/, "");
    const res = {};
    for (const E of empresas) {
      try {
        const r = await fetch(base + "/api/NfeEntrada/ObterListaNFesPendentesPorEmpresa", {
          method: "POST", headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify({ IdEmpresa: E, DataInicial: iso(d90), DataFinal: iso(now), Status: "Validos" }),
        });
        res[String(E)] = JSON.parse(await r.text());
      } catch (e) { res[String(E)] = { NFes: [], _erro: String(e) }; }
    }
    return res;
  }, EMPRESAS);

  const out = [];
  for (const E of EMPRESAS) {
    const loja = EMP_TO_LOJA[E];
    const nfes = (raw[String(E)] && raw[String(E)].NFes) || [];
    let kept = 0;
    for (const nfe of nfes) {
      const de = nfe.DataEmissao; if (!de) continue;
      let dt; try { dt = new Date(de.replace("Z", "+00:00")); } catch { continue; }
      if (dt.getFullYear() !== ANO) continue;          // só ano corrente
      if (dt < CUTOFF) continue;                        // últimos 45d
      if (!keepNfe(nfe)) continue;
      const emit = nfe.DadosEmitente || {};
      if (fornIgnorado(emit.Nome)) continue;
      const valor = (nfe.ValorTotalNota || 0) || (nfe.Produtos || []).reduce((a, p) => a + (p.ValorBruto || 0), 0);
      out.push({ loja, nf: String(nfe.Numero || ""), marca: fornBrand(emit) || "(sem marca)", data: de.slice(0, 10), valor: Math.round(valor * 100) / 100, origem: "pendente", fornecedor: emit.Nome || "" });
      kept++;
    }
    log(`pendentes ${loja}: ${kept}/${nfes.length}`);
  }
  return out;
}

// ===== LANÇADAS (relatorio_notas, últimos 45d por lançamento) =====
async function coletaLancadas(page) {
  log("lançadas: navegando relatorio_notas...");
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
    document.querySelectorAll("input[name=tipo_data]").forEach(r => { r.checked = (r.value === "data_documento"); });
    document.querySelectorAll("input[name=tipo_listagem]").forEach(r => { r.checked = (r.value === "A"); });
    const sel = document.getElementById("cfop");
    if (sel) { [...sel.options].forEach(o => o.selected = /\[E\][\s\S]*COMPRA/.test((o.text || "").toUpperCase())); try { window.jQuery && window.jQuery(sel).multiselect("refresh"); } catch (e) {} }
  }, { hoje: fmtBR(HOJE), ini: fmtBR(new Date(HOJE.getTime() - 70 * 86400000)) });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const b = [...document.querySelectorAll("input[type=submit], button")].find(x => /gerar/i.test(x.value || x.textContent || "")); if (b) b.click(); });
  await aguardarTabelaEstavel(page, { baseline, minDelta: 50, maxMs: 90000 });
  const notas = await page.evaluate(() => {
    const trs = [...document.querySelectorAll("table tr")]; const out = []; let cur = null, saw = false;
    for (const tr of trs) {
      const c = tr.cells; if (!c) continue;
      const cells = [...c].map(x => (x.textContent || "").trim());
      if (c.length === 10 && /^\d{2}\/\d{2}\/\d{2,4}$/.test(cells[0])) {
        if (cur) out.push(cur);
        cur = { emissao: cells[0], lcto: cells[1], doc: (cells[3] || "").split(/\s|\n/)[0].trim(), forn: cells[5], valor: cells[8], emp: cells[9] };
        saw = true;
      }
    }
    if (cur) out.push(cur);
    return saw ? out : [];
  });
  const EMP = { "1": "L1", "3": "L3", "4": "L4", "10": "L5" };
  const out = [];
  for (const n of notas) {
    const de = brDateToISO(n.emissao), dl = brDateToISO(n.lcto);
    if (!de) continue;
    const loja = EMP[String(parseInt(n.emp, 10))]; if (!loja) continue;
    const lctoDate = dl ? new Date(dl.iso + "T12:00:00") : null;
    if (!lctoDate || lctoDate < CUTOFF) continue;       // lançadas nos últimos 45d
    if (de.ano !== ANO) continue;
    out.push({ loja, nf: n.doc, marca: fornBrand({ Nome: n.forn }) || "(sem marca)", data: de.iso, valor: parseNumBR(n.valor), origem: "lancada", fornecedor: n.forn });
  }
  log(`lançadas: ${out.length} (${notas.length} brutas)`);
  return out;
}

async function gravarSupabase(lista) {
  const body = JSON.stringify({ id: 1, dados: lista, atualizado_em: new Date().toISOString() });
  const r = await fetch(`${SUPABASE_URL}/rest/v1/nfes_erp`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body,
  });
  if (!r.ok) throw new Error("supabase " + r.status + " " + (await r.text()).slice(0, 300));
}

// ===== MAIN (com retry interno: login do ERP às vezes trava no v4/home) =====
async function runOnce() {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  try {
    await garantirSessao(page, { log });
    const pend = await coletaPendentes(page);
    let lanc = [];
    try { lanc = await coletaLancadas(page); } catch (e) { log(`lançadas FALHOU (segue só com pendentes): ${e.message}`); }
    const lancKeys = new Set(lanc.map(x => x.loja + "|" + x.nf));
    const lista = lanc.concat(pend.filter(p => !lancKeys.has(p.loja + "|" + p.nf)));
    log(`total: ${lista.length} (pendentes ${pend.length}, lançadas ${lanc.length})`);
    if (FILE_MODE) {
      writeFileSync("/tmp/nfes_erp.json", JSON.stringify({ atualizado_em: new Date().toISOString(), dados: lista }, null, 1));
      log("gravado /tmp/nfes_erp.json");
    } else {
      await gravarSupabase(lista);
      log("gravado no Supabase (nfes_erp)");
    }
    await ctx.close().catch(() => {});
    return true;
  } catch (e) {
    await ctx.close().catch(() => {});
    throw e;
  }
}

const t0 = Date.now();
log(`launch headless (file=${FILE_MODE})...`);
let ok = false;
for (let i = 1; i <= 4; i++) {
  try { await runOnce(); ok = true; break; }
  catch (e) {
    if (e.code === "NO_CREDS" || e.code === "LOGIN_FAIL") { log(`creds/login: ${e.message}`); process.exit(2); }
    log(`tentativa ${i}/4 falhou: ${(e.message || "").split("\n")[0]} — ${i < 4 ? `retry em ${i * 20}s` : "desisto"}`);
    if (i < 4) await new Promise(r => setTimeout(r, i * 20000));
  }
}
log(`${ok ? "OK" : "FALHOU"} em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.exit(ok ? 0 : 1);
