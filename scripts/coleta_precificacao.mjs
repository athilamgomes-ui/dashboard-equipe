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
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const REPO = "/Users/elkgomes/Desktop/claude/dashboard-equipe";
const OUT = REPO + "/precificacao_dados.json";
const CRON = process.env.PUSH === "1";      // modo agendado: trava + git push
const LOCKDIR = "/tmp/precificacao_update.lock.d";
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
// GATILHO (29/06/2026): dispara pela ENTRADA da NF no ERP (campo LancadaNoMicrovix da API), não mais pelo status ENTREGUE do Planejamento.
// Como a API não traz a DATA do lançamento, guardamos em precificacao_lancadas.json quando cada NF foi vista lançada pela 1ª vez e mostramos as dos últimos N dias.
const DIAS_ENTRADA = Number(process.env.DIAS_ENTRADA || process.env.DIAS_ENTREGA) || 3; // dias que a NF fica visível DEPOIS de detectada como precificada (regra "some 3 dias após precificar")
const DIAS_INICIO = Number(process.env.DIAS_INICIO) || 3;   // janela p/ uma NF aparecer: entrada no ERP ≤ N dias (regra do usuário 08/07: "só busque as dos últimos 3 dias").
const STATE_FILE = REPO + "/precificacao_lancadas.json"; // estado local (gitignored): { "<chave>": {desde:"YYYY-MM-DD" (1ª aparição), aplicadoDesde:"ISO"|null (quando detectou preço já aplicado no ERP)} }
const NF_FILTER = process.env.NF ? String(process.env.NF).split(",").map(s => s.trim()).filter(Boolean) : null; // teste: NF=9341 ou NF=684024,684025 node ... → puxa só essa(s) NF(s), ignora o gatilho
const loadState = () => {
  try {
    const raw = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    const out = {};
    for (const [k, v] of Object.entries(raw)) out[k] = typeof v === "string" ? { desde: v, aplicadoDesde: null } : v; // migra formato antigo (string) → objeto
    return out;
  } catch { return null; }
};
const saveState = s => { try { writeFileSync(STATE_FILE, JSON.stringify(s, null, 0)); } catch (e) { log("aviso: não salvou estado lançadas: " + e.message); } };
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

// (gatilho antigo por pedido ENTREGUE no Planejamento foi substituído pelo gatilho de ENTRADA no ERP — LancadaNoMicrovix)
// data de lançamento (entrada) por NF, da tabela nfes_erp do Supabase (coletor próprio, atualiza a cada 2h): { "L5|684024": "2026-06-29" }
async function dataLctoErp() {
  const map = {};
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/nfes_erp?select=dados&limit=1`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!r.ok) throw new Error("status " + r.status);
    const rows = await r.json();
    for (const it of ((rows[0] && rows[0].dados) || [])) {
      if (it.origem !== "lancada" || !it.data_lcto || !it.nf || !it.loja) continue;
      const k = it.loja + "|" + String(it.nf).replace(/^0+/, "");
      if (!map[k] || it.data_lcto > map[k]) map[k] = it.data_lcto; // mantém o lançamento mais recente
    }
    log(`data_lcto do nfes_erp: ${Object.keys(map).length} NFs lançadas mapeadas`);
  } catch (e) { log("aviso: nfes_erp indisponível (" + e.message + ") — usando só o estado local de 1ª-vez-visto"); }
  return map;
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
// marcas mapeadas mas que NÃO são p/ revenda (uso interno: sacolas etc) → fora da precificação
const MARCAS_NAO_REVENDA = new Set(["SOLIDER", "MULTIBAG"]);
const marcaNaoRevenda = mk => MARCAS_NAO_REVENDA.has(norm(mk));

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
async function relatorioPrecosErp(page, empresa, tabelaNome, marcaCodes, tabelaId) {
  let melhor = { tabela: null, rows: [] };
  for (let tent = 1; tent <= 5; tent++) { // 5 tentativas: o relatório do ERP falha transitoriamente ("0 prod") quando há muitas consultas seguidas
    await gotoRetry(page, URL_LISTA_PRECOS);
    await page.waitForSelector("#empresas_" + empresa, { timeout: 20000 });
    await page.waitForTimeout(1000);
    // ⚠️ ESSENCIAL (fix 06/07/2026): "Ajuste de Preços" precisa estar LIGADO — é o que renderiza os inputs
    // valor_* que o parser lê. A opção é sticky por usuário no ERP; se alguém usar o relatório em modo
    // leitura, ela desliga e a coleta passa a achar 0 produtos. E precisa ser via CLIQUE REAL (dispara o
    // onclick que monta a grade editável); marcar .checked à toa cai em modo texto sem os inputs.
    const ajChecked = await page.evaluate(() => !!document.getElementById("ajuste_precos")?.checked);
    if (!ajChecked) { await page.click("#ajuste_precos").catch(() => {}); await page.waitForTimeout(700); }
    const incluirInativos = tent >= 4; // fallback: se as 1ªs tentativas (só ativos) não acharam nada, inclui inativos (marca nova com produtos ainda desativados, ex. Depimiel)
    const tabInfo = await page.evaluate(({ empresa, tabelaNome, tabelaId, marcaCodes, incluirInativos }) => {
      [1, 3, 4, 9, 10, 11].forEach(i => { const e = document.getElementById("empresas_" + i); if (e) e.checked = (i === empresa); });
      document.querySelectorAll("input[name=visao]").forEach(r => r.checked = (r.value === "A"));
      const a = document.getElementById("ativa"); if (a) a.checked = true;
      const d = document.getElementById("desativa"); if (d) d.checked = !!incluirInativos;
      const bar = document.getElementById("barras"); if (bar) bar.checked = true;
      const pv = document.getElementById("preco_venda"); if (pv) pv.checked = true; // ajustar Preço de Venda (não custo)
      const ms = document.getElementById("marcas");
      if (ms && marcaCodes && marcaCodes.length) {
        const c = String(marcaCodes[0]);
        if (![...ms.options].some(o => o.value === c)) { const o = document.createElement("option"); o.value = c; o.text = "marca " + c; ms.add(o); }
        [...ms.options].forEach(o => o.selected = (o.value === c)); ms.value = c;
      }
      const tp = document.getElementById("tabela_preco");
      let usada = null, opcoes = null, casou = false;
      if (tp) {
        opcoes = [...tp.options].map(o => o.text);
        // ⚠️ As tabelas de preço são específicas por empresa e o dropdown só lista as da empresa LOGADA
        // (sempre emp 1/Altamira no headless). Por isso Itaituba/Santarém não aparecem por nome. Solução:
        // selecionar pelo ID da tabela (injetando a option, igual à marca) — o relatório honra o ID submetido.
        if (tabelaId != null && String(tabelaId) !== "") {
          const t = String(tabelaId);
          let opt = [...tp.options].find(o => o.value === t);
          if (!opt) { opt = document.createElement("option"); opt.value = t; opt.text = "tabela " + t; tp.add(opt); }
          tp.value = t; usada = opt.text; casou = true;
        } else {
          const semAcento = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          const alvo = semAcento(tabelaNome).replace(/tabela/g, "").trim();
          let opt = [...tp.options].find(o => alvo && semAcento(o.text).includes(alvo));
          if (opt) casou = true;
          if (!opt) opt = [...tp.options].find(o => /padr/i.test(o.text || "")) || tp.options[0];
          if (opt) { tp.value = opt.value; usada = opt.text; }
        }
      }
      return { usada, opcoes, casou };
    }, { empresa, tabelaNome, tabelaId, marcaCodes, incluirInativos });
    if (tabInfo && !tabInfo.casou) log(`  ⚠️ tabela "${tabelaNome}" NÃO encontrada (emp ${empresa}) — usando "${tabInfo.usada}". Opções: ${(tabInfo.opcoes || []).join(" | ")}`);
    const tabUsada = (tabInfo && tabInfo.usada) || null;
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
        const ref = (tr.cells[2] && tr.cells[2].textContent || "").trim(); // coluna Referência = código do fornecedor (cprod da NF)
        const p = parse(v.value);
        if (p != null) out.push({ cod, ean, desc, ref, preco: p });
      }
      return out;
    });
    if (rows.length > melhor.rows.length || (melhor.rows.length === 0)) melhor = { tabela: tabUsada, rows };
    if (rows.length > 0 && rows.length < 3000) { melhor = { tabela: tabUsada, rows }; break; } // filtro funcionou
    log(`  filtro marca falhou (tent ${tent}/3, ${rows.length} prod) — retry`);
  }
  return melhor;
}

// ===== Preço sugerido PADRÃO (espelha precificacao.html: margemMarca/custoEfetivo/calc/arredonda90) =====
// Usado SÓ p/ DETECTAR se a NF já foi precificada no ERP (comparar com preco_atual do relatório de preços).
// Não conhece overrides manuais de margem/preço feitos no navegador (localStorage) — se a equipe editar
// a mão, a detecção automática pode não bater; por isso a NF nunca desaparece sozinha antes de bater.
function margemPadraoMarca(marca) {
  const m = PARAMS.margem || {};
  if (marca && m._por_marca && m._por_marca[marca] != null) return m._por_marca[marca];
  return m._default != null ? m._default : 0.15;
}
function custoPctNode(cfg, campo) { const g = PARAMS.globais || {}; return cfg[campo] != null ? cfg[campo] : (g[campo] || 0); }
function arredonda90Node(p) { let c = Math.floor(p) + 0.90; if (c < p - 1e-9) c += 1; return Math.round(c * 100) / 100; }
function creditoItemNode(item, uf, cfg) {
  if (uf === "PA") return 0; // compra dentro do estado: imposto de entrada 0%
  if (cfg.regime !== "lucro_real") return 0;
  return Number(item.credito_icms_pct) || 0;
}
function stEntradaPctNode(item, uf, cfg) {
  if (uf === "PA") return 0; // compra dentro do estado: imposto de entrada 0%
  if (!item.st) return 0;
  const t = PARAMS.st_entrada_por_uf || {};
  const r = t[uf];
  return r != null ? r : (t._default || 0);
}
function precoSugeridoPadrao(item, uf, loja) {
  const cfg = PARAMS.lojas[loja] || {};
  const base = item.custo_unit_cheio;
  const custo = item.st ? base * (1 + stEntradaPctNode(item, uf, cfg)) : base * (1 - creditoItemNode(item, uf, cfg));
  const imposto = item.st ? 0 : (cfg.imposto || 0);
  const fixos = imposto + custoPctNode(cfg, "cartao") + custoPctNode(cfg, "comissao") + custoPctNode(cfg, "outros") + (cfg.custo_fixo || 0);
  const div = 1 - fixos - margemPadraoMarca(item.marca);
  if (div <= 0) return null;
  return arredonda90Node(custo / div);
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
  if (CRON) { // trava p/ não sobrepor execuções agendadas (limpa lock órfão > 30min)
    try { if (Date.now() - statSync(LOCKDIR).mtimeMs > 30 * 60000) rmSync(LOCKDIR, { recursive: true, force: true }); } catch {}
    try { mkdirSync(LOCKDIR); } catch { log("já em execução — saindo"); process.exit(30); }
  }
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", d => d.accept().catch(() => {})); // "Sessão expirada" no relatório de preços é espúrio/não-fatal — aceitar e seguir (o relatório renderiza mesmo assim)
  try {
    await garantirSessao(page, { log });
    await gotoRetry(page, URL_NFE);
    let token = null;
    for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
    if (!token) throw new Error("token_api indisponível");

    if (NF_FILTER) log(`MODO TESTE: puxando só a NF ${NF_FILTER} (ignorando gatilho de entrada)`);

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

    // GATILHO POR ENTRADA NO ERP + FICA NA TELA ATÉ SER PRECIFICADA (pedido do usuário 06/07/2026).
    // state[chave] = {desde: 1ª aparição, aplicadoDesde: quando detectou preço já aplicado no ERP, ou null}.
    // Regra: uma vez que apareceu, NUNCA some sozinha enquanto não for detectada como precificada
    // (ver precoSugeridoPadrao + bloco de detecção após a coleta de preços do ERP, mais abaixo).
    // DIAS_ENTRADA só conta DEPOIS de detectada — vira o prazo de permanência pós-precificação, não mais
    // a janela de exibição desde a entrada. data_lcto do nfes_erp continua servindo só p/ decidir se uma
    // NF NOVA (ainda sem state) é recente o bastante p/ começar a aparecer (evita reviver NF antiga já paga).
    const lctoMap = NF_FILTER ? {} : await dataLctoErp();
    const state = loadState() || {};
    const janelaMs = DIAS_ENTRADA * 86400000;      // remoção: dias visível DEPOIS de precificada
    const janelaInicioMs = DIAS_INICIO * 86400000; // início: entrada no ERP ≤ N dias p/ COMEÇAR a aparecer
    const todayISO = HOJE.toISOString().slice(0, 10);
    let stateDirty = false;
    // poda SÓ entradas já precificadas há muito tempo (>30d pós-aplicação) — nunca poda as ainda não precificadas
    for (const k of Object.keys(state)) {
      const e = state[k];
      if (e && e.aplicadoDesde) { const t = Date.parse(e.aplicadoDesde); if (isNaN(t) || (HOJE.getTime() - t) > 30 * 86400000) { delete state[k]; stateDirty = true; } }
    }
    // elegibilidade por NF: começa a aparecer (evidência de entrada recente) e continua até ser precificada
    const elegivel = (loja, nfe) => {
      if (!nfe.LancadaNoMicrovix) return false;
      const numN = String(nfe.Numero).replace(/^0+/, "");
      const ch = String(nfe.Chave || (loja + "-" + nfe.Numero));
      let entry = state[ch];
      if (!entry) {
        // NF nova: só COMEÇA a aparecer com EVIDÊNCIA de entrada recente = data_lcto do nfes_erp ≤ DIAS_INICIO.
        // SEM data_lcto não inicia (pode ser entrada antiga que saiu da janela do nfes_erp; uma entrada de verdade
        // ganha data_lcto na próxima rodada do coletor de NFes, ≤2h, e aí começa a aparecer).
        const entISO = lctoMap[loja + "|" + numN];
        const entMs = entISO ? Date.parse(entISO) : NaN;
        if (isNaN(entMs) || (HOJE.getTime() - entMs) > janelaInicioMs) return false;
        entry = { desde: todayISO, aplicadoDesde: null };
        state[ch] = entry; stateDirty = true; // carimba a 1ª aparição = hoje
      }
      // já foi detectada como precificada há mais de DIAS_ENTRADA dias → não mostra mais
      if (entry.aplicadoDesde && (HOJE.getTime() - Date.parse(entry.aplicadoDesde)) >= janelaMs) return false;
      return true; // enquanto não detectada como precificada, FICA NA TELA indefinidamente
    };

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
          if (!NF_FILTER.includes(String(nfe.Numero))) continue; // modo teste: só a(s) NF(s) pedida(s)
        } else {
          // GATILHO: entrada no ERP + visível por DIAS_ENTRADA dias a partir da 1ª aparição (depois some)
          if (!marcaForn) continue; // sem marca mapeada não dá p/ buscar preço ERP nem precificar com referência
          if (marcaNaoRevenda(marcaForn)) continue; // sacolas/uso interno não vão p/ precificação
          if (!elegivel(loja, nfe)) continue;
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
            preco_atual: null, cod_erp: null, match_tipo: null, // preço/código internos do ERP (preenchidos via Lista de Preços)
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
      const tabelaId = (PARAMS.lojas[L] || {}).tabela_id;
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
          const { tabela, rows } = await relatorioPrecosErp(page, empresa, tabelaNome, g.codes, tabelaId);
          // Índice por EAN (código de barras exibido no relatório).
          const porEan = {}; for (const r of rows) if (r.ean) porEan[r.ean] = r;
          // Índice por REFERÊNCIA (= código do fornecedor/cprod). SEGURO: só usa referências ÚNICAS —
          // se duas linhas têm a mesma referência com preços diferentes, marca ambígua e NÃO associa.
          // Necessário porque o relatório mostra só UM código de barras por produto (às vezes o interno,
          // não o EAN da NF) — aí o match por EAN falha mesmo o produto existindo. A referência resolve.
          const refMap = {};
          for (const r of rows) {
            const k = String(r.ref || "").toUpperCase().trim(); if (!k) continue;
            if (refMap[k] === undefined) refMap[k] = r;
            else if (refMap[k] === null || refMap[k].preco !== r.preco) refMap[k] = null; // ambígua → descarta
          }
          let porEanN = 0, porRefN = 0;
          for (const it of g.itens) {
            if (it.preco_atual != null) continue;
            // 1º: EAN exato (código de barras). 2º (fallback): referência exata (cprod ↔ Referência).
            if (it.ean && it.ean !== "SEM GTIN" && porEan[it.ean] != null) {
              const r = porEan[it.ean]; it.preco_atual = r.preco; it.cod_erp = r.cod; it.match_tipo = "ean"; porEanN++;
            } else {
              const k = String(it.cprod || "").toUpperCase().trim();
              if (k && refMap[k]) { const r = refMap[k]; it.preco_atual = r.preco; it.cod_erp = r.cod; it.match_tipo = "ref"; porRefN++; }
            }
          }
          log(`preços ERP ${L}/${mk} (emp ${empresa}, ${tabela || "?"}, ${rows.length} prod): ${porEanN} por EAN + ${porRefN} por referência = ${porEanN + porRefN}/${g.itens.length}`);
        } catch (e) { log(`preços ERP ${L}/${mk} FALHOU: ${String(e.message || e).split("\n")[0]}`); }
      }
    }

    // Preserva preços já capturados numa coleta anterior p/ itens que ficaram SEM preço nesta rodada.
    // O relatório do ERP às vezes falha transitoriamente ("0 prod") — isso NÃO deve apagar um preço bom
    // que já tínhamos. Casa por chave da NF + EAN (ou + cprod) — mesmo produto da mesma nota, seguro.
    try {
      const ant = JSON.parse(readFileSync(OUT, "utf8"));
      const antMap = {};
      for (const L of Object.keys(ant.lojas || {})) for (const nf of (ant.lojas[L] || [])) for (const it of (nf.itens || [])) {
        if (it.preco_atual == null) continue;
        const base = String(nf.chave_nfe || (L + "-" + nf.numero));
        if (it.ean) antMap[base + "|E|" + it.ean] = it;
        if (it.cprod) antMap[base + "|R|" + String(it.cprod).toUpperCase()] = it;
      }
      let preservados = 0;
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) for (const it of nf.itens) {
        if (it.preco_atual != null) continue;
        const base = String(nf.chave_nfe || (L + "-" + nf.numero));
        const prev = (it.ean && antMap[base + "|E|" + it.ean]) || (it.cprod && antMap[base + "|R|" + String(it.cprod).toUpperCase()]);
        if (prev) { it.preco_atual = prev.preco_atual; it.cod_erp = prev.cod_erp; it.match_tipo = (prev.match_tipo || "prev").replace(/\*$/, "") + "*"; preservados++; }
      }
      if (preservados) log(`preços preservados de coleta anterior (falha transitória do relatório): ${preservados}`);
    } catch {}

    // ===== DETECÇÃO: a NF já foi precificada no ERP? (2 sinais, OR) =====
    // A ÚNICA forma de mudar preço em lote é importando o .txt no ERP (Ajuste de Preço por Lote) —
    // não existe um log/auditoria dedicado dessa importação (investigado 06/07/2026: a tela de
    // upload não guarda histórico). Então detectamos o EFEITO da importação no relatório de preços,
    // por 2 sinais complementares (um item resolve se qualquer um bater):
    //   (a) preco_atual no ERP == preço sugerido PADRÃO calculado agora (±R$0,01) — caso comum.
    //   (b) preco_atual MUDOU desde a 1ª vez que vimos essa NF (guardado em entry.baseline por EAN)
    //       — cobre quando a equipe edita a margem/preço na mão antes de importar (não bateria com
    //       o padrão calculado, mas o preço no ERP mudou = foi importado algo).
    // TODOS os itens com EAN (os que entram no .txt) precisam resolver p/ considerar a NF precificada.
    // Ao bater pela 1ª vez, carimba aplicadoDesde=agora; a NF continua na tela por mais DIAS_ENTRADA
    // dias e só então some (pedido do usuário: "enquanto não precificou fica; os 3 dias contam só
    // depois de precificar").
    if (!NF_FILTER) {
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) {
        const comEan = nf.itens.filter(it => it.ean && it.ean !== "SEM GTIN");
        const ch = String(nf.chave_nfe || (L + "-" + nf.numero));
        const entry = state[ch] || (state[ch] = { desde: todayISO, aplicadoDesde: null });
        if (!entry.baseline) entry.baseline = {};
        let algumDadoValido = false;
        const resolvidos = comEan.map(it => {
          if (it.preco_atual == null) return null; // ainda sem dado de preço nesta rodada — não decide nada
          algumDadoValido = true;
          if (entry.baseline[it.ean] == null) { entry.baseline[it.ean] = it.preco_atual; stateDirty = true; } // carimba o preço "antes de precificar" na 1ª vez que vemos dado
          const sug = precoSugeridoPadrao(it, nf.uf, L);
          const bateuSugerido = sug != null && Math.abs(sug - it.preco_atual) <= 0.01;
          const mudouDoBaseline = Math.abs(it.preco_atual - entry.baseline[it.ean]) > 0.01;
          return bateuSugerido || mudouDoBaseline;
        });
        const bateu = comEan.length > 0 && algumDadoValido && resolvidos.every(r => r === true);
        if (bateu && !entry.aplicadoDesde) {
          entry.aplicadoDesde = HOJE.toISOString(); stateDirty = true;
          log(`✅ ${L} NF ${nf.numero}: preço aplicado no ERP (${comEan.length} item(ns) c/ EAN resolvidos) — some da tela em ${DIAS_ENTRADA}d`);
        }
      }
      saveState(state); // sempre grava (arquivo pequeno) — garante que a migração de formato antigo também persista
    }

    const totNfes = Object.values(lojas).reduce((s, a) => s + a.length, 0);
    const totRaw = EMPRESAS.reduce((s, E) => s + (((raw[String(E)] || {}).NFes || []).length), 0);
    if (totNfes === 0 && totRaw === 0) { log("API não retornou NFes (provável falha de sessão) — PRESERVANDO arquivo anterior."); process.exitCode = 10; await ctx.close(); return; }
    if (totNfes === 0) log("nenhuma entrada nos últimos " + DIAS_ENTRADA + "d — fila vazia (tela limpa).");
    // só grava/publica se o CONTEÚDO das NFes mudou (ignora gerado_em) — evita commit a cada 15 min só pelo timestamp
    const lojasStr = JSON.stringify(lojas);
    let mudou = true;
    try { mudou = JSON.stringify(JSON.parse(readFileSync(OUT, "utf8")).lojas) !== lojasStr; } catch {}
    if (!mudou) { log(`sem mudança de conteúdo (${totNfes} NFes) — não regrava nem publica.`); await ctx.close(); if (CRON) { try { rmSync(LOCKDIR, { recursive: true, force: true }); } catch {} } return; }
    const payload = { gerado_em: new Date().toISOString(), cutoff_dias: CUTOFF_DIAS, dias_entrada: DIAS_ENTRADA, lojas };
    writeFileSync(OUT, JSON.stringify(payload, null, 2));
    log(`OK → ${OUT} (${totItens} itens em ${totNfes} NFes)`);
    if (CRON) { // publica no GitHub Pages (só se mudou)
      try {
        const ch = execSync("git status --porcelain precificacao_dados.json", { cwd: REPO }).toString().trim();
        if (ch) { execSync("git add precificacao_dados.json && git commit -q -m 'precificacao: dados (coleta agendada)' && git push -q origin main", { cwd: REPO }); log("publicado no GitHub Pages"); }
        else log("sem mudança — nada a publicar");
      } catch (e) { log("git push falhou: " + String(e.message || e).split("\n")[0]); }
    }
  } catch (e) {
    log(`FALHA: ${String(e.message || e).split("\n")[0]}`);
    process.exitCode = e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1;
  } finally {
    await ctx.close();
    if (CRON) { try { rmSync(LOCKDIR, { recursive: true, force: true }); } catch {} }
  }
})();
