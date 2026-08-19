#!/usr/bin/env node
/**
 * coleta_estoque_saldo.mjs — saldo, entradas, vendas, trânsito, custo e preço por loja.
 * Fonte: gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp (Playwright headless).
 *
 * Regra nº 1: NUNCA Chrome MCP. Uma empresa por vez, sequencial (perfil compartilhado).
 *
 * Três tipos de execução do relatório:
 *   SNAPSHOT   — depósito 1 (Estoque), `sem_movimentacao` LIGADO → catálogo inteiro com
 *                saldo/trânsito/custo médio/preço de tabela de HOJE. 1x por loja por execução.
 *   DEPOSITO 2 — idem, depósito 2 "Devolvidos (com defeito)" (bloco 4 do painel).
 *   JANELA     — depósito 1, `sem_movimentacao` DESLIGADO (só quem se moveu) → entradas e
 *                vendas do período. Produto ausente da janela = 0 entradas e 0 vendas.
 *
 * As janelas saem da decomposição por mês (ver SPEC_ESTOQUE.md):
 *   [data_balanço → fim do mês] + meses cheios + [1º do mês corrente → hoje]
 * Tudo que termina antes do mês corrente é IMUTÁVEL → cache permanente em janelas.json.
 * Só as janelas que terminam hoje são recoletadas a cada execução.
 *
 * Uso:  node coleta_estoque_saldo.mjs                → tudo (o que o pipeline chama)
 *       node coleta_estoque_saldo.mjs --so-snapshot  → só snapshot + depósito 2
 * Exit: 0 ok · 1 falha · 2 creds/login
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";
import { pecasJanela, mesDe, fimDoMes, proxMes } from "./estoque_janelas.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(DIR, "..", "dados_estoque");
const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp";

const EMPRESAS = (process.env.EMPS ? process.env.EMPS.split(",").map(Number) : [1, 3, 4, 10]);   // ⚠️ nunca 9 nem 11
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
// Balanço mais antigo que isso não entra na reconciliação (contagem velha = prova fraca,
// e cada data distinta custa uma execução do relatório). Ajustável por env.
const DIAS_BALANCO = Number(process.env.DIAS_BALANCO || 120);
const SO_SNAPSHOT = process.argv.includes("--so-snapshot");

const log = m => process.stderr.write(`[estoque-saldo] ${m}\n`);
const pad = n => String(n).padStart(2, "0");
const HOJE = new Date();
const isoHoje = `${HOJE.getFullYear()}-${pad(HOJE.getMonth() + 1)}-${pad(HOJE.getDate())}`;
const isoParaBR = s => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

fs.mkdirSync(OUT_DIR, { recursive: true });
const P_BAL = path.join(OUT_DIR, "balancos.json");
const P_JAN = path.join(OUT_DIR, "janelas.json");
const P_SNAP = path.join(OUT_DIR, "snapshot.json");
const P_DEP2 = path.join(OUT_DIR, "deposito2.json");

function lerJSON(p, def) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return def; } }

// ── quais janelas cada loja precisa ────────────────────────────────────────
function janelasNecessarias() {
  const bal = lerJSON(P_BAL, null);
  if (!bal) throw new Error("balancos.json não existe — rode coleta_estoque_balancos.mjs antes");
  const corte = new Date(HOJE.getTime() - DIAS_BALANCO * 86400000);
  const isoCorte = `${corte.getFullYear()}-${pad(corte.getMonth() + 1)}-${pad(corte.getDate())}`;
  const mesCorrente = mesDe(isoHoje);
  const out = {};
  for (const E of EMPRESAS) {
    const loja = EMP_TO_LOJA[E];
    const lista = (bal.listas[String(E)] || [])
      .filter(b => b.finalizado && !b.ajuste && b.data >= isoCorte);
    // última contagem por produto → só as datas que realmente são usadas
    const ultima = {};
    for (const b of lista.sort((a, c) => a.data < c.data ? -1 : 1))
      for (const it of (bal.itens[String(b.id)] || [])) ultima[it.cod] = b.data;
    const datas = [...new Set(Object.values(ultima))].sort();
    const jan = new Map();
    for (const d of datas)
      for (const p of pecasJanela(d, isoHoje)) jan.set(`${p.ini}|${p.fim}`, p);
    out[loja] = { emp: E, datas, janelas: [...jan.values()] };
  }
  return out;
}

// ── execução de um relatório ───────────────────────────────────────────────
async function gerar(page, E, { ini, fim, deposito = 1, semMov = false, precos = false, saldoPositivo = false }) {
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#empresas_1", { timeout: 20000 });
  await page.waitForTimeout(700);
  const baseline = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);

  await page.evaluate(({ E, d1, d2, deposito, semMov, precos, saldoPositivo }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
    const setName = (n, v) => { const e = document.querySelector(`input[name=${n}]`); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    set("empresas_" + E, true);                       // ⚠️ nunca empresas 9 nem 11
    const sv = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    sv("data1", d1); sv("data2", d2);                 // janela de VENDAS
    const c1 = document.querySelector("[name=data1_compra]"); if (c1) c1.value = d1;
    const c2 = document.querySelector("[name=data2_compra]"); if (c2) c2.value = d2;   // janela de ENTRADAS
    set("controle_dif_periodo", true);
    set("exibe_estoque_transito", true);
    set("somenteDisp", false);
    setName("sem_movimentacao", !!semMov);            // catálogo inteiro vs só quem se moveu
    setName("saldo_positivo", !!saldoPositivo);       // só saldo > 0 (usado no depósito 2)
    if (precos) { set("custo_medio_unitario", true); set("preco_venda_unitario", true); }
    const dep = document.querySelector("select[name=depositos]");
    if (dep) [...dep.options].forEach(o => o.selected = (o.value === String(deposito)));
    const fa = document.querySelector("input[name=formas][value=A]"); if (fa) fa.checked = true;   // Analítica
    const ag = document.querySelector("select[name=f_agrupamento]");
    if (ag) [...ag.options].forEach(o => o.selected = (o.text.trim() === "Marca"));
  }, { E, d1: isoParaBR(ini), d2: isoParaBR(fim), deposito, semMov, precos, saldoPositivo });
  await page.waitForTimeout(300);

  // O relatório é uma NAVEGAÇÃO cujo HTML chega em streaming: o sinal de que ele terminou é o
  // evento `load`. Contar linhas até "parar de crescer" já entregou relatório TRUNCADO
  // (56.502 linhas e ainda carregando, 19/08/2026). Truncado tem que virar falha, nunca dado.
  const limite = (semMov && !saldoPositivo) ? 1500000 : 420000;   // catálogo inteiro é lento
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: limite }).catch(() => null);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("input[type=submit], input[type=button], button, a")]
      .find(x => /^gerar/i.test((x.value || x.textContent || "").trim()));
    if (b) b.click();
  });
  if (!(await nav)) throw new Error(`relatório não terminou de carregar em ${Math.round(limite / 1000)}s (resultado seria truncado)`);
  await page.waitForTimeout(1500);

  const r = await page.evaluate(() => {
    const num = s => {
      s = String(s || "").trim();
      if (!s || s === "-") return 0;
      const v = parseFloat(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, ""));
      return isNaN(v) ? 0 : v;
    };
    const trs = [...document.querySelectorAll("tr")];
    let hdr = null;
    for (const tr of trs) {
      const t = (tr.textContent || "").toLowerCase();
      if (/c[óo]digo/.test(t) && /saldo/.test(t) && tr.cells && tr.cells.length > 5) {
        hdr = [...tr.cells].map(c => (c.textContent || "").trim()); break;
      }
    }
    if (!hdr) return { erro: "cabeçalho não encontrado" };
    const n = hdr.length;
    const iCusto = hdr.findIndex(h => /custo m[ée]dio/i.test(h));
    const iPreco = hdr.findIndex(h => /pre[çc]o de tabela/i.test(h));
    // as 3 últimas colunas são sempre o bloco DA LOJA (vendas · trânsito · saldo)
    const iVen = n - 3, iTra = n - 2, iSal = n - 1;
    const prods = {}; const marcaDe = {};
    let marca = null, linhas = 0;
    for (const tr of trs) {
      const txt = (tr.textContent || "").trim();
      const m = txt.match(/Marca:\s*([^(]+)\((\d+)\)/i);
      if (m) { marca = m[1].trim(); continue; }
      const c = tr.cells; if (!c || c.length !== n) continue;
      const cod = (c[0].textContent || "").trim();
      if (!/^\d+$/.test(cod)) continue;
      const cell = i => i >= 0 ? (c[i].textContent || "") : "";
      prods[cod] = {
        d: (c[1].textContent || "").trim(),
        r: (c[2].textContent || "").trim(),
        ent: num(cell(4)),
        ven: num(cell(iVen)),
        tra: num(cell(iTra)),
        sal: num(cell(iSal)),
        cus: iCusto >= 0 ? num(cell(iCusto)) : null,
        pre: iPreco >= 0 ? num(cell(iPreco)) : null,
      };
      if (marca && !/^GERAL/i.test(marca)) marcaDe[cod] = marca;
      linhas++;
    }
    return { hdr, n: linhas, prods, marcaDe };
  });
  if (r.erro) throw new Error(r.erro);
  // depósito vazio é resultado legítimo (o cabeçalho renderizou, só não há saldo);
  // nos demais relatórios, zero linhas é falha — nunca dado.
  if (!r.n && !saldoPositivo) throw new Error("relatório sem linhas de produto");
  log(`  emp${E} ${ini}→${fim} dep${deposito}${semMov ? " (catálogo)" : ""}: ${r.n} produtos em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  return r;
}

async function comRetry(fn, tag, tentativas = 3) {
  let err;
  for (let i = 1; i <= tentativas; i++) {
    try { return await fn(); }
    catch (e) {
      err = e;
      if (/browser has been closed|Target closed/i.test(e.message)) throw e;   // sessão concorrente matou o perfil
      log(`  ${tag} falhou (${i}/${tentativas}): ${e.message.split("\n")[0]} — retry em ${i * 15}s`);
      await new Promise(r => setTimeout(r, i * 15000));
    }
  }
  throw err;
}

// ── main ───────────────────────────────────────────────────────────────────
const t0 = Date.now();
const necess = janelasNecessarias();
for (const [lj, v] of Object.entries(necess)) {
  const nv = v.janelas.filter(j => j.volatil).length;
  log(`${lj}: ${v.datas.length} datas de balanço (≤${DIAS_BALANCO}d) → ${v.janelas.length} janelas (${nv} recoletadas hoje)`);
}

const janCache = lerJSON(P_JAN, { janelas: {} });
janCache.janelas = janCache.janelas || {};
// Merge: quando a execução cobre só algumas lojas (EMPS=1,4), as demais são PRESERVADAS do
// snapshot anterior, cada uma com o seu próprio coletado_em — assim o painel nunca mente sobre
// a idade do dado de cada loja.
const snapAnt = lerJSON(P_SNAP, { lojas: {} });
const dep2Ant = lerJSON(P_DEP2, { lojas: {} });
const agora = new Date().toISOString();
const snap = { gerado_em: agora, lojas: { ...(snapAnt.lojas || {}) } };
const dep2 = { gerado_em: agora, lojas: { ...(dep2Ant.lojas || {}) } };

log("launch headless...");
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try {
  await garantirSessao(page, { log, tokenOpcional: true });
} catch (e) {
  log(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
}

let falhas = 0;
try {
  for (const E of EMPRESAS) {
    const loja = EMP_TO_LOJA[E];
    log(`── ${loja} (emp ${E})`);

    // 1) snapshot de hoje (catálogo inteiro, depósito 1, com custo e preço)
    try {
      const r = await comRetry(() => gerar(page, E, { ini: `${mesDe(isoHoje)}-01`, fim: isoHoje, deposito: 1, semMov: true, precos: true }), `${loja} snapshot`);
      snap.lojas[loja] = { prods: r.prods, marca: r.marcaDe, coletado_em: new Date().toISOString() };
    } catch (e) { falhas++; log(`${loja} SNAPSHOT FALHOU: ${e.message}`); }

    // 2) depósito 2 — "Devolvidos (com defeito)"
    try {
      const r = await comRetry(() => gerar(page, E, { ini: `${mesDe(isoHoje)}-01`, fim: isoHoje, deposito: 2, semMov: true, precos: true, saldoPositivo: true }), `${loja} dep2`);
      // só interessa quem tem saldo no depósito 2
      const p = {};
      for (const [cod, v] of Object.entries(r.prods)) if (v.sal !== 0) p[cod] = v;
      dep2.lojas[loja] = { prods: p, marca: r.marcaDe, coletado_em: new Date().toISOString() };
      log(`  ${loja} depósito 2: ${Object.keys(p).length} produtos com saldo`);
    } catch (e) { falhas++; log(`${loja} DEPÓSITO 2 FALHOU: ${e.message}`); }

    if (SO_SNAPSHOT) continue;

    // 3) janelas de entradas/vendas
    for (const j of (necess[loja]?.janelas || [])) {
      const chave = `${loja}|${j.ini}|${j.fim}`;
      if (!j.volatil && janCache.janelas[chave]) continue;         // fechada e já em cache = imutável
      try {
        const r = await comRetry(() => gerar(page, E, { ini: j.ini, fim: j.fim, deposito: 1, semMov: false }), `${loja} ${j.ini}→${j.fim}`);
        const mov = {};
        for (const [cod, v] of Object.entries(r.prods)) if (v.ent || v.ven) mov[cod] = [v.ent, v.ven];
        janCache.janelas[chave] = { ini: j.ini, fim: j.fim, loja, coletado_em: new Date().toISOString(), mov };
        fs.writeFileSync(P_JAN, JSON.stringify(janCache));
      } catch (e) { falhas++; log(`${loja} janela ${j.ini}→${j.fim} FALHOU: ${e.message}`); }
    }
  }

  fs.writeFileSync(P_SNAP, JSON.stringify(snap));
  fs.writeFileSync(P_DEP2, JSON.stringify(dep2));
  fs.writeFileSync(P_JAN, JSON.stringify(janCache));
  const nl = Object.keys(snap.lojas).length;
  log(`OK em ${((Date.now() - t0) / 60000).toFixed(1)}min · snapshot de ${nl} lojas · ${falhas} falhas`);
  await ctx.close().catch(() => {});
  process.exit(nl === EMPRESAS.length ? 0 : 1);
} catch (e) {
  log(`FALHA: ${e.message}`);
  fs.writeFileSync(P_JAN, JSON.stringify(janCache));
  if (Object.keys(snap.lojas).length) fs.writeFileSync(P_SNAP, JSON.stringify(snap));
  await ctx.close().catch(() => {});
  process.exit(1);
}
