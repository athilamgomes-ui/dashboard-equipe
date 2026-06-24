#!/usr/bin/env node
/**
 * coleta_precificacao.mjs — coleta NFes (com detalhe fiscal por item) das marcas×lojas que
 * têm pedido ENTREGUE recente (últimos DIAS_ENTREGA dias) no Planejamento de Compras (Supabase).
 * Para a rotina de PRECIFICAÇÃO. 100% headless (reusa microvix_auth + perfil + Keychain).
 * NÃO grava nada no ERP — só lê. A janela de NF é ampla (90d) pois a NF pode ser emitida
 * dias antes da entrega; quem filtra é o cruzamento com os pedidos ENTREGUE.
 *
 * Saída: /Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_dados.json
 *   { gerado_em, lojas: { L1:[nfe...], L3, L4, L5 } }
 *   nfe = { id, numero, serie, fornecedor, cnpj, data_emissao, valor, lancada, itens:[...] }
 *   item = { cprod, ean, descricao, qtd, cfop, marca,
 *            valor_bruto, desconto, frete, seguro, outras, ipi, icms_st, fcp_st,
 *            custo_cheio_total, custo_unit_cheio }
 *
 * Custo cheio (opção b) = ValorTotalLiquido + frete + seguro + outras + IPI + ICMS-ST + FCP-ST.
 *
 * Uso: node coleta_precificacao.mjs        → grava o JSON
 * Exit: 0=ok, 2=creds/login, 1=falha.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const OUT = "/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_dados.json";
const FORN_MARCAS = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/compras/fornecedor_marcas.json", "utf8"));
const ICMS_UF = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_icms_estados.json", "utf8"));
const PARAMS = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_params.json", "utf8"));
const MARCA_IDS = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/compras/marca_ids.json", "utf8"));
const ST_PA = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/st_pa_ncm.json", "utf8"));
const ST_NCM = (ST_PA.ncm_st || []).map(String).sort((a, b) => b.length - a.length); // prefixos mais longos primeiro
const URL_LISTA_PRECOS = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_lista_precos.asp";
// produto é ST no PA se o NCM (8 díg.) começa com algum código da lista SEFA-PA
function ncmEhST(ncm) {
  const n = String(ncm || "").replace(/\D/g, "");
  if (!n) return false;
  return ST_NCM.some(c => n.startsWith(c));
}

const SUPABASE_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";

const log = m => process.stderr.write(`[precos] ${m}\n`);
const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const LOJA_TO_GROUP = { L1: "ALTAMIRA", L4: "ALTAMIRA", L3: "ITAITUBA", L5: "SANTAREM" };
const MARCA_ALIAS = { GAMA: ["BRASITECH"] }; // pedido marca → marcas de NF equivalentes (fornecedor fatura com outro nome)
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const HOJE = new Date();
const ANO = HOJE.getFullYear();
const CUTOFF_DIAS = 90;       // janela ampla p/ achar a NF (a NF pode ser dias antes da entrega)
const DIAS_ENTREGA = Number(process.env.DIAS_ENTREGA) || 2; // só pedidos ENTREGUE com data_entrega nos últimos N dias (regra do usuário; override p/ teste: DIAS_ENTREGA=14 node ...)
const NF_FILTER = process.env.NF ? String(process.env.NF).trim() : null; // teste: NF=9341 node ... → puxa só essa NF, ignora o filtro ENTREGUE
const PROC_SKIP_PRECO = process.env.SKIP_PRECO === "1"; // pula a coleta de preço atual do ERP (debug rápido)
const norm = s => String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
// marca (normalizada) \u2192 c\u00f3digos no ERP (ex.: PROBELLE \u2192 ["858","366"])
const MARCA_TO_CODES = {};
for (const [nome, v] of Object.entries(MARCA_IDS)) {
  if (nome.startsWith("_")) continue;
  MARCA_TO_CODES[norm(nome)] = (Array.isArray(v) ? v : [v]).map(String);
}
// tokens p/ casar descri\u00e7\u00e3o (sem acento; separa letra/d\u00edgito: "20VOL"\u2192["20","VOL"]; descarta ru\u00eddo)
const STOP_TOK = new Set(["ML", "UN", "G", "KG", "DE", "DA", "DO", "C", "P"]);
function descTokens(s) {
  return String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ").replace(/([A-Z])(\d)/g, "$1 $2").replace(/(\d)([A-Z])/g, "$1 $2")
    .split(/\s+/).filter(t => t && !STOP_TOK.has(t));
}
function matchScore(aTok, bTok) {
  if (!aTok.length) return 0;
  const b = new Set(bTok); let hit = 0;
  for (const t of aTok) if (b.has(t)) hit++;
  return hit / aTok.length; // fra\u00e7\u00e3o dos tokens da NF presentes na descri\u00e7\u00e3o do ERP
}

// CST/CSOSN que indicam ICMS por Substitui\u00e7\u00e3o Tribut\u00e1ria (ST) \u2192 SEM cr\u00e9dito a abater
const CST_ST = new Set(["10", "30", "60", "70", "90"]);
const CSOSN_ST = new Set(["201", "202", "203", "500", "900"]);
// cr\u00e9dito de ICMS por item (Lucro Real): com ST \u2192 0; sen\u00e3o \u2192 % de ICMS REAL destacado na NF.
// Fallback (NF sem ICMS destacado e fornecedor n\u00e3o-Simples): al\u00edquota interestadual pela UF de origem.
function creditoIcmsItem(tx, icmsStValor, uf) {
  if (!tx) return 0;
  const cst = String(tx.cst || "").padStart(2, "0").slice(-2);
  const csosn = String(tx.csosn || "");
  const temST = (Number(icmsStValor) > 0) || CST_ST.has(cst) || CSOSN_ST.has(csosn);
  if (temST) return 0;
  const pct = tx.icms_pct;
  if (pct != null && isFinite(Number(pct))) return Math.max(0, Number(pct)) / 100; // ICMS real da NF (preferencial)
  if (csosn) return 0;                                   // fornecedor Simples sem ICMS destacado \u2192 sem cr\u00e9dito
  if (uf && ICMS_UF.por_uf[uf] != null) return ICMS_UF.por_uf[uf]; // fallback por estado de origem
  return ICMS_UF.default || 0;
}

// pedidos ENTREGUE (últimos DIAS_ENTREGA dias) no Planejamento → set de "GRUPO|MARCA" alvo
async function alvosEntregues() {
  const since = new Date(HOJE.getTime() - DIAS_ENTREGA * 86400000).toISOString().slice(0, 10);
  const url = `${SUPABASE_URL}/rest/v1/pedidos?status=eq.ENTREGUE&data_entrega=gte.${since}&select=loja,marca,valor_total,data_entrega`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!r.ok) throw new Error("supabase pedidos " + r.status);
  const peds = await r.json();
  const set = new Set();
  for (const p of peds) {
    const g = norm(p.loja), m = norm(p.marca);
    if (!g || !m) continue;
    set.add(g + "|" + m);
    (MARCA_ALIAS[m] || []).forEach(a => set.add(g + "|" + norm(a)));
  }
  log(`pedidos ENTREGUE (≤${DIAS_ENTREGA}d, desde ${since}): ${peds.length} → ${set.size} alvos (grupo|marca)`);
  return set;
}

// fornecedor (CNPJ ou nome) → marca; multi-marca ('+') ou desconhecido → null
function fornBrand(emit) {
  const cnpj = String(emit?.Documento || "").replace(/[.\/-]/g, "");
  let v = (FORN_MARCAS.por_cnpj || {})[cnpj];
  if (v == null) {
    const nome = String(emit?.Nome || "").toUpperCase();
    for (const [sub, mk] of Object.entries(FORN_MARCAS.por_nome_substring || {})) {
      if (nome.includes(String(sub).toUpperCase())) { v = mk; break; }
    }
  }
  if (!v || String(v).includes("+")) return null;
  return v;
}
function fornIgnorado(nome) {
  const up = String(nome || "").toUpperCase();
  const lst = (FORN_MARCAS._ignorar_no_dashboard || {}).por_nome_substring || [];
  return lst.some(s => up.includes(String(s).toUpperCase()));
}

// excluir devoluções/transferências/bonificações/amostras/consignação (não é compra p/ revenda)
const EXCL_NAT = /(AMOSTRA|REMESSA EM CONSIGNA|BONIFIC|DEVOLU|RETORNO|TRANSFER)/i;
const EXCL_CFOP = new Set(["5152","6152","5910","6910","5911","6911","5912","6912","5201","6201","5202","6202","1411","2411","3411"]);
function keepNfe(nfe) {
  if (EXCL_NAT.test(nfe.NaturezaOperacao || "")) return false;
  const cfops = (nfe.Produtos || []).map(p => String(p.CFOP || ""));
  if (cfops.length && cfops.every(c => EXCL_CFOP.has(c))) return false;
  return true;
}
const num = v => { const n = Number(v); return isNaN(n) ? 0 : n; };

// Preço de venda atual no ERP (Estoque > Relatórios > Lista de Preços, produtos ativos somente).
// Filtra por marca (códigos); devolve [{cod,ean,desc,preco}]. Tenta até 3x (o filtro de marca às vezes falha).
async function relatorioPrecosErp(page, empresa, tabelaNome, marcaCodes) {
  let melhor = { tabela: null, rows: [] };
  for (let tent = 1; tent <= 3; tent++) {
    await gotoRetry(page, URL_LISTA_PRECOS);
    await page.waitForSelector("#empresas_" + empresa, { timeout: 20000 });
    await page.waitForTimeout(1000);
    const tabUsada = await page.evaluate(({ empresa, tabelaNome, marcaCodes }) => {
      [1, 3, 4, 9, 10, 11].forEach(i => { const e = document.getElementById("empresas_" + i); if (e) e.checked = (i === empresa); });
      document.querySelectorAll("input[name=visao]").forEach(r => r.checked = (r.value === "A"));
      const a = document.getElementById("ativa"); if (a) a.checked = true;
      const d = document.getElementById("desativa"); if (d) d.checked = false;
      const bar = document.getElementById("barras"); if (bar) bar.checked = true;
      const ms = document.getElementById("marcas");
      if (ms && marcaCodes && marcaCodes.length) {
        const c = String(marcaCodes[0]);
        if (![...ms.options].some(o => o.value === c)) { const o = document.createElement("option"); o.value = c; o.text = "marca " + c; ms.add(o); }
        [...ms.options].forEach(o => o.selected = (o.value === c)); ms.value = c;
      }
      const tp = document.getElementById("tabela_preco");
      let usada = null;
      if (tp) {
        const alvo = String(tabelaNome || "").toLowerCase().replace(/tabela/i, "").trim();
        let opt = [...tp.options].find(o => alvo && (o.text || "").toLowerCase().includes(alvo));
        if (!opt) opt = [...tp.options].find(o => /padr/i.test(o.text || "")) || tp.options[0];
        if (opt) { tp.value = opt.value; usada = opt.text; }
      }
      return usada;
    }, { empresa, tabelaNome, marcaCodes });
    await page.waitForTimeout(1200);
    // re-assertar a marca imediatamente antes de gerar (JS/widget às vezes reseta) e disparar
    await page.evaluate((marcaCodes) => {
      const ms = document.getElementById("marcas");
      if (ms && marcaCodes && marcaCodes.length) {
        const c = String(marcaCodes[0]);
        if (![...ms.options].some(o => o.value === c)) { const o = document.createElement("option"); o.value = c; o.text = "marca " + c; ms.add(o); }
        [...ms.options].forEach(o => o.selected = (o.value === c)); ms.value = c;
      }
      const b = document.getElementById("btnGerarRelatorio"); if (b) b.click();
    }, marcaCodes);
    let last = -1, stable = 0; const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
      await page.waitForTimeout(1200);
      const n = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);
      if (n !== last) { last = n; stable = 0; } else if (++stable >= 4) break;
    }
    const rows = await page.evaluate(() => {
      const parse = v => { v = String(v || "").trim().replace(/\./g, "").replace(",", "."); const n = parseFloat(v); return isNaN(n) ? null : n; };
      const out = [];
      for (const v of document.querySelectorAll('input[name^="valor_"]')) {
        const tr = v.closest("tr"); if (!tr) continue;
        const cod = (tr.querySelector('input[name^="codigo_"]') || {}).value || "";
        let ean = null; const a = [...tr.querySelectorAll("a")].find(x => /codebars/i.test(x.getAttribute("href") || ""));
        if (a) ean = (a.textContent || "").trim();
        const desc = (tr.cells[1] && tr.cells[1].textContent || "").trim();
        const p = parse(v.value);
        if (p != null) out.push({ cod, ean, desc, preco: p });
      }
      return out;
    });
    if (rows.length > melhor.rows.length || (melhor.rows.length === 0)) melhor = { tabela: tabUsada, rows };
    if (rows.length > 0 && rows.length < 3000) { melhor = { tabela: tabUsada, rows }; break; } // filtro funcionou
    log(`  filtro marca falhou (tent ${tent}/3, ${rows.length} prod) — retry`);
  }
  return melhor;
}

async function gotoRetry(page, url, { tentativas = 3, timeout = 45000 } = {}) {
  let err;
  for (let i = 0; i < tentativas; i++) {
    try { await page.goto(url, { waitUntil: "domcontentloaded", timeout }); return; }
    catch (e) { err = e; log(`goto falhou (${i + 1}): ${String(e.message).split("\n")[0]} — retry`); await page.waitForTimeout(4000); }
  }
  throw err;
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  try {
    await garantirSessao(page, { log });
    await gotoRetry(page, URL_NFE);
    let token = null;
    for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
    if (!token) throw new Error("token_api indisponível");

    const alvos = NF_FILTER ? null : await alvosEntregues();
    if (NF_FILTER) log(`MODO TESTE: puxando só a NF ${NF_FILTER} (ignorando filtro ENTREGUE)`);

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
            body: JSON.stringify({ IdEmpresa: E, DataInicial: iso(d90), DataFinal: iso(now), Status: "Todos" }), // "Todos" inclui as já lançadas (com detalhe de itens) — necessário p/ casar com ENTREGUE
          });
          res[String(E)] = JSON.parse(await r.text());
        } catch (e) { res[String(E)] = { NFes: [], _erro: String(e) }; }
      }
      return res;
    }, EMPRESAS);

    const cutoff = new Date(HOJE.getTime() - CUTOFF_DIAS * 86400000);
    const lojas = { L1: [], L3: [], L4: [], L5: [] };
    let totItens = 0;
    for (const E of EMPRESAS) {
      const loja = EMP_TO_LOJA[E];
      const nfes = (raw[String(E)] && raw[String(E)].NFes) || [];
      let kept = 0;
      for (const nfe of nfes) {
        const de = nfe.DataEmissao; if (!de) continue;
        let dt; try { dt = new Date(String(de).replace("Z", "+00:00")); } catch { continue; }
        if (dt.getFullYear() !== ANO) continue;
        if (dt < cutoff) continue;
        if (!keepNfe(nfe)) continue;
        const emit = nfe.DadosEmitente || {};
        if (fornIgnorado(emit.Nome)) continue;
        const marcaForn = fornBrand(emit);
        if (NF_FILTER) {
          if (String(nfe.Numero) !== NF_FILTER) continue; // modo teste: só a NF pedida
        } else {
          // SÓ NFes de marca×loja que tenham pedido ENTREGUE recente no Planejamento
          if (!marcaForn) continue;
          const chave = (LOJA_TO_GROUP[loja] || "") + "|" + norm(marcaForn);
          if (!alvos.has(chave)) continue;
        }
        const itens = (nfe.Produtos || []).map(p => {
          const valorBase = num(p.ValorTotalLiquido) || (num(p.ValorBruto) - num(p.ValorDesconto));
          const custoTotal = valorBase + num(p.ValorFrete) + num(p.ValorSeguro) + num(p.ValorOutrasDespesas) + num(p.vIPI) + num(p.ValorICMSST) + num(p.ValorFCPST);
          const qtd = num(p.QuantidadeComercial) || 1;
          return {
            cprod: String(p.CProd || ""),
            ean: String(p.CEAN || ""),
            descricao: String(p.DescricaoProduto || ""),
            qtd,
            cfop: String(p.CFOP || ""),
            marca: marcaForn,
            valor_bruto: num(p.ValorBruto),
            desconto: num(p.ValorDesconto),
            frete: num(p.ValorFrete),
            seguro: num(p.ValorSeguro),
            outras: num(p.ValorOutrasDespesas),
            ipi: num(p.vIPI),
            icms_st: num(p.ValorICMSST),
            fcp_st: num(p.ValorFCPST),
            custo_cheio_total: Math.round(custoTotal * 100) / 100,
            custo_unit_cheio: Math.round((custoTotal / qtd) * 10000) / 10000,
            cst: null, icms_pct: null, credito_icms_pct: 0, // preenchidos depois via BuscarDetalhesNFe
            preco_atual: null, // preço de venda atual no ERP (preenchido depois via Lista de Preços)
          };
        });
        if (!itens.length) continue;
        totItens += itens.length;
        lojas[loja].push({
          id: nfe.Id,
          chave_nfe: String(nfe.Chave || ""),
          numero: String(nfe.Numero || ""),
          serie: String(nfe.Serie || ""),
          fornecedor: String(emit.Nome || ""),
          cnpj: String(emit.Documento || ""),
          data_emissao: dt.toISOString().slice(0, 10),
          valor: num(nfe.Valor),
          lancada: !!nfe.LancadaNoMicrovix,
          natureza: String(nfe.NaturezaOperacao || ""),
          itens,
        });
        kept++;
      }
      // mais recentes primeiro
      lojas[loja].sort((a, b) => (a.data_emissao < b.data_emissao ? 1 : -1));
      log(`${loja}: ${kept} NFes mantidas (de ${nfes.length})`);
    }

    // ===== Enriquecer lendo o XML da NFe, PRODUTO POR PRODUTO (fonte autoritativa) =====
    // Crédito de ICMS por item: só se NÃO for ST. ST = CST 10/30/60/70, ICMS-ST destacado, OU tem CEST.
    const nfList = [];
    for (const L of Object.keys(lojas)) for (const nf of lojas[L]) nfList.push({ id: nf.id, chave: nf.chave_nfe, doc: nf.cnpj });
    if (nfList.length) {
      const det = await page.evaluate(async (nfList) => {
        const token = localStorage.getItem("token_api");
        const base = (localStorage.getItem("url_fiscal_api") || "").replace(/\/$/, "");
        const H = { Authorization: token, "Content-Type": "application/json" };
        const tag = (s, t) => { const m = s.match(new RegExp("<" + t + "\\b[^>]*>([\\s\\S]*?)</" + t + ">")); return m ? m[1].trim() : null; };
        const out = {};
        for (const nf of nfList) {
          try {
            let chave = nf.chave, doc = nf.doc;
            if (!chave) { const d = await (await fetch(base + "/api/NfeEntrada/BuscarDetalhesNFe", { method: "POST", headers: H, body: JSON.stringify({ IdNfe: nf.id }) })).json(); chave = d.ChaveNFe; doc = doc || (d.Emitente || {}).Documento; }
            const r = await fetch(base + "/api/NfeEntrada/BaixarNFe", { method: "POST", headers: H, body: JSON.stringify({ IdNfe: nf.id, ChaveNFe: chave, DocumentoEmitente: doc }) });
            const xml = await r.text();
            const uf = (() => { const e = xml.match(/<enderEmit>([\s\S]*?)<\/enderEmit>/); return e ? tag(e[1], "UF") : null; })();
            const prod = {};
            for (const d of (xml.match(/<det\b[\s\S]*?<\/det>/g) || [])) {
              const cProd = tag(d, "cProd"); if (!cProd) continue;
              const vProd = parseFloat(tag(d, "vProd") || "0");
              const cest = tag(d, "CEST");
              const icmsBlk = (d.match(/<ICMS>([\s\S]*?)<\/ICMS>/) || [])[1] || "";
              const grpTag = (icmsBlk.match(/<ICMS(\w+)>/) || [])[1] || "";
              const cst = tag(icmsBlk, "CST"); const csosn = tag(icmsBlk, "CSOSN");
              const vICMS = parseFloat(tag(icmsBlk, "vICMS") || "0");
              const pICMS = parseFloat(tag(icmsBlk, "pICMS") || "0");
              const vICMSST = parseFloat(tag(icmsBlk, "vICMSST") || "0");
              const ncm = tag(d, "NCM");
              prod[cProd] = { cst, csosn, grpTag, orig: tag(icmsBlk, "orig"), vICMS, pICMS, vICMSST, vProd, cest, ncm };
            }
            out[nf.id] = { uf, prod };
          } catch (e) { out[nf.id] = { uf: null, prod: {}, erro: String(e).slice(0, 80) }; }
        }
        return out;
      }, nfList);

      const CST_ST_X = new Set(["10", "30", "60", "70"]);
      let comCredito = 0, comST = 0, semInfo = 0;
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) {
        const d = det[nf.id] || { uf: null, prod: {} };
        nf.uf = d.uf;
        for (const it of nf.itens) {
          const tx = (d.prod || {})[it.cprod];
          if (!tx) { semInfo++; it.cst = null; it.icms_pct = null; it.ncm = null; it.st = false; it.st_motivo = null; it.credito_icms_pct = 0; continue; }
          const cstN = String(tx.cst || "").padStart(2, "0").slice(-2);
          const ncm = String(tx.ncm || "").replace(/\D/g, "");
          const stPorNcm = ncmEhST(ncm);                                    // PRIMÁRIO: NCM na lista SEFA-PA
          const sinalNF = CST_ST_X.has(cstN) || Number(tx.vICMSST) > 0 || !!tx.cest; // fallback: sinais da NF
          const temST = stPorNcm || sinalNF;
          it.cst = tx.cst != null ? (tx.orig != null ? tx.orig + tx.cst : tx.cst) : (tx.csosn != null ? "CSOSN " + tx.csosn : null);
          it.icms_pct = Number(tx.pICMS) || 0;
          it.ncm = ncm || null; it.cest = tx.cest || null;
          it.st = temST;
          it.st_motivo = stPorNcm ? "ncm" : (sinalNF ? "nf" : null); // "nf" = NF sinaliza ST mas NCM fora da lista → revisar
          it.credito_icms_pct = (!temST && Number(tx.vICMS) > 0 && tx.vProd > 0) ? (tx.vICMS / tx.vProd) : 0;
          if (it.credito_icms_pct > 0) comCredito++; else comST++;
        }
      }
      const revisar = [];
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) for (const it of nf.itens) if (it.st_motivo === "nf") revisar.push(it.ncm);
      log(`XML por item: ${nfList.length} NFes; c/ crédito=${comCredito}, ST sem crédito=${comST}, sem info=${semInfo}; ST só por sinal-NF (revisar NCM)=${revisar.length}`);
    }

    // ===== Preço de venda atual no ERP (Lista de Preços), por LOJA × MARCA =====
    // Filtra o relatório pela marca (códigos do ERP) e casa cada item por EAN, senão por descrição.
    for (const L of Object.keys(lojas)) {
      if (PROC_SKIP_PRECO) break;
      if (!lojas[L].length) continue;
      const empresa = (PARAMS.lojas[L] || {}).empresa;
      const tabelaNome = (PARAMS.lojas[L] || {}).tabela_preco;
      if (!empresa) continue;
      // agrupar itens por marca
      const porMarca = {};
      for (const nf of lojas[L]) for (const it of nf.itens) {
        const codes = MARCA_TO_CODES[norm(it.marca)];
        if (!codes) continue;
        (porMarca[norm(it.marca)] = porMarca[norm(it.marca)] || { codes, itens: [] }).itens.push(it);
      }
      for (const [mk, g] of Object.entries(porMarca)) {
        try {
          const { tabela, rows } = await relatorioPrecosErp(page, empresa, tabelaNome, g.codes);
          const porEan = {}; for (const r of rows) if (r.ean) porEan[r.ean] = r.preco;
          const filtroOk = rows.length > 0 && rows.length < 3000; // se trouxe o catálogo todo, NÃO casar por descrição (evita cruzar marcas)
          const rowsTok = filtroOk ? rows.map(r => ({ ...r, tok: descTokens(r.desc) })) : [];
          let porEanN = 0, porDescN = 0;
          for (const it of g.itens) {
            if (it.ean && porEan[it.ean] != null) { it.preco_atual = porEan[it.ean]; porEanN++; continue; }
            if (!filtroOk) continue; // sem filtro de marca confiável → só EAN
            const tk = descTokens(it.descricao); let best = null, bestS = 0;
            for (const r of rowsTok) { const s = matchScore(tk, r.tok); if (s > bestS) { bestS = s; best = r; } }
            if (best && bestS >= 0.6) { it.preco_atual = best.preco; porDescN++; }
          }
          log(`preços ERP ${L}/${mk} (emp ${empresa}, ${tabela || "?"}, ${rows.length} prod, filtro=${filtroOk ? "ok" : "FALHOU→só EAN"}): ${porEanN} EAN + ${porDescN} desc / ${g.itens.length}`);
        } catch (e) { log(`preços ERP ${L}/${mk} FALHOU: ${String(e.message || e).split("\n")[0]}`); }
      }
    }

    const payload = { gerado_em: new Date().toISOString(), cutoff_dias: CUTOFF_DIAS, dias_entrega: DIAS_ENTREGA, lojas };
    writeFileSync(OUT, JSON.stringify(payload, null, 2));
    log(`OK → ${OUT} (${totItens} itens em ${Object.values(lojas).reduce((s, a) => s + a.length, 0)} NFes)`);
  } catch (e) {
    log(`FALHA: ${String(e.message || e).split("\n")[0]}`);
    process.exitCode = e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1;
  } finally {
    await ctx.close();
  }
})();
