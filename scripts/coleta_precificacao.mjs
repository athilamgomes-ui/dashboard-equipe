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
// Preços de venda FIXOS por EAN (definidos manualmente pelo usuário) — injetados em item.preco_manual.
const PRECOS_MANUAIS = (() => { try { return JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_precos_manuais.json", "utf8")).precos || {}; } catch { return {}; } })();
// Código INTERNO do ERP por CNPJ do fornecedor + cprod (inclui kits, chave "KIT-<cprods ordenados>").
// Para NF que precisa exportar o .txt por "Código" (não "Código de Barras"): produtos novos cujo EAN
// da nota não bate com o cadastro, e kits que não têm EAN na nota. Ex.: Franca/Nathydras+Varcare. (05/08/2026)
const CODIGOS_ERP = (() => { try { return JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_codigos_erp.json", "utf8")); } catch { return {}; } })();
// Ajustes manuais por NF p/ alinhar o dashboard ao ROMANEIO (bonificação a manter, embalagem a remover,
// custo de kit a forçar). Chave "CNPJ:numeroNF". Ver precificacao_ajustes_nf.json. (10/08/2026)
const AJUSTES_NF = (() => { try { return JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_ajustes_nf.json", "utf8")); } catch { return {}; } })();
const ajusteNf = (cnpj, numero) => AJUSTES_NF[String(cnpj || "").replace(/\D/g, "") + ":" + String(numero || "")] || null;
// Último preço de venda REAL por EAN (Histórico de Movimento). Só EXIBIÇÃO (campo preco_ultima_venda) —
// NÃO é preço fixo/trava, NÃO entra no cálculo nem na detecção. Referência p/ cadastro com duplicados. (21/08/2026)
const ULTIMA_VENDA = (() => { try { return JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_ultima_venda.json", "utf8")).precos || {}; } catch { return {}; } })();
// Preço de MERCADO (pesquisa na internet: mediana/preço mais constante) + FRETE p/ interior PA, por EAN.
// Só EXIBIÇÃO (campo preco_mercado) — NÃO é trava, NÃO entra no cálculo. É o teto competitivo real. (25/08/2026)
const PRECO_MERCADO = (() => { try { return JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_preco_mercado.json", "utf8")).precos || {}; } catch { return {}; } })();
// Ponte EAN->código interno (persistente) + BALANÇO (dados_estoque/snapshot.json) — FALLBACK do preço atual.
// Quando o relatório de Lista de Preços falha (token_api caiu na migração de auth), o preço atual vem do
// balanço via EAN->código->preço. O mapa cresce sozinho quando o relatório funciona. (02/09/2026, Opção B do Athila)
const EAN_COD_FILE = "/Users/elkgomes/Desktop/claude/dashboard-equipe/precificacao_ean_cod.json";
const EAN_COD = (() => { try { return JSON.parse(readFileSync(EAN_COD_FILE, "utf8")).ean_cod || {}; } catch { return {}; } })();
const BALANCO = (() => { try { return JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/dados_estoque/snapshot.json", "utf8")).lojas || {}; } catch { return {}; } })();
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
// CONVERS\u00c3O CAIXA\u2192UNIDADE POR DESCRI\u00c7\u00c3O (13/07/2026 \u2014 marca Santa Clara).
// Diferente da Talge: o XML N\u00c3O traz o fator (qCom == qTrib em todos os itens); a quantidade da
// embalagem vive s\u00f3 no TEXTO ("C/12", "PCT C/50", "C/100 UN"...). Extrai o divisor da descri\u00e7\u00e3o.
// ROLO = unidade inteira (vendido inteiro; regra confirmada usu\u00e1rio 13/07). Armadilhas tratadas:
// C/12COMP (dentes do pente), 80G (gramatura), 127V, 150ML, REF.222 \u2192 N\u00c3O s\u00e3o divisor.
const divisorDescricao = desc => {
  const s = norm(desc);
  if (/\bROLO\b/.test(s) || /\bR\.C\//.test(s)) return 1;              // rolo = 1 unidade
  let m = s.match(/C\/\s*(\d+)\s*CXS?\s*C\/\s*(\d+)/);                 // "C/10 CXS C/5" \u2192 50
  if (m) return Number(m[1]) * Number(m[2]);
  m = s.match(/C\/\s*(\d+)\s*(?:UNID|UNDS?|UN|PE[C\u00c7]AS?|PC)\b/);       // "C/100 UN"
  if (m) return Number(m[1]);
  m = s.match(/\bPCT\.?\s*(\d+)\s*(?:UNID|UNDS?|UN|PE[C\u00c7]AS?|PC)\b/);  // "PCT 100 PECAS"
  if (m) return Number(m[1]);
  for (const mm of s.matchAll(/C\/\s*(\d+)([A-Z]?)/g)) {              // "C/12" puro (exclui C/12COMP)
    if (mm[2]) continue;                                              // d\u00edgito seguido de letra \u2192 especifica\u00e7\u00e3o
    const n = Number(mm[1]); if (n >= 2) return n;
  }
  return 1;
};
// marca (normalizada) \u2192 c\u00f3digos no ERP (ex.: PROBELLE \u2192 ["858","366"])
const MARCA_TO_CODES = {};
const MARCA_CANON = {}; // marca normalizada \u2192 nome can\u00f4nico (p/ rotular o item com a grafia oficial)
for (const [nome, v] of Object.entries(MARCA_IDS)) {
  if (nome.startsWith("_")) continue;
  MARCA_TO_CODES[norm(nome)] = (Array.isArray(v) ? v : [v]).map(String);
  MARCA_CANON[norm(nome)] = nome;
}
// Keywords marca\u2192[termos] de FONTE \u00daNICA (mesma que o dashboard de Compras usa). Fallback p/ detectar
// a marca de um PRODUTO NOVO (ainda sem pre\u00e7o no ERP) numa NF multi-marca, pela descri\u00e7\u00e3o. Termos
// que come\u00e7am com "\b" s\u00e3o regex (word-boundary); demais s\u00e3o substring (comparado em norm()). (04/08/2026)
const BRAND_KEYWORDS = {};
try {
  const kwRaw = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/compras/marca_keywords.json", "utf8"));
  for (const [mk, kws] of Object.entries(kwRaw)) {
    if (mk.startsWith("_") || !Array.isArray(kws)) continue;
    BRAND_KEYWORDS[mk] = kws.map(kw => String(kw).startsWith("\\b") ? { re: new RegExp(kw, "i") } : { sub: norm(kw) });
  }
} catch (e) { /* sem keywords \u2192 fallback por descri\u00e7\u00e3o fica inativo (s\u00f3 ERP resolve a marca) */ }
// detecta a marca de UM produto pela descri\u00e7\u00e3o; `restrito` (Set de marcas can\u00f4nicas) limita \u00e0s candidatas.
// Retorna a marca can\u00f4nica s\u00f3 se houver match \u00daNICO (amb\u00edguo entre 2+ ou nenhum \u2192 null, mais seguro).
function marcaPorDescricao(desc, restrito) {
  const d = norm(desc); const hits = [];
  for (const [mk, kws] of Object.entries(BRAND_KEYWORDS)) {
    if (restrito && !restrito.has(mk)) continue;
    if (kws.some(k => k.re ? k.re.test(d) : d.includes(k.sub))) hits.push(mk);
  }
  return hits.length === 1 ? hits[0] : null;
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

// valor bruto do mapa fornecedor→marca (CNPJ tem prioridade sobre substring do nome); pode ter '+' (multi-marca)
function fornBrandRaw(emit) {
  const cnpj = String(emit?.Documento || "").replace(/[.\/-]/g, "");
  let v = (FORN_MARCAS.por_cnpj || {})[cnpj];
  if (v == null) {
    const nome = String(emit?.Nome || "").toUpperCase();
    for (const [sub, mk] of Object.entries(FORN_MARCAS.por_nome_substring || {})) {
      if (nome.includes(String(sub).toUpperCase())) { v = mk; break; }
    }
  }
  return v || null;
}
// fornecedor (CNPJ ou nome) → marca; multi-marca ('+') ou desconhecido → null
function fornBrand(emit) {
  const v = fornBrandRaw(emit);
  if (!v || String(v).includes("+")) return null;
  return v;
}
// fornecedor multi-marca ('+') → lista de marcas CANDIDATAS (ex. Franca → ["Varcare","Nathydras"]).
// A marca de cada item é resolvida POR-ITEM na fase de preços do ERP: consulta o relatório de cada
// candidata e atribui ao item a marca cujo relatório contém o EAN/referência dele. (04/08/2026)
function fornMarcasCandidatas(emit) {
  const v = fornBrandRaw(emit);
  if (!v || !String(v).includes("+")) return [];
  return String(v).split("+").map(s => s.trim()).filter(Boolean);
}
function fornIgnorado(nome) {
  const up = String(nome || "").toUpperCase();
  const lst = (FORN_MARCAS._ignorar_no_dashboard || {}).por_nome_substring || [];
  return lst.some(s => up.includes(String(s).toUpperCase()));
}
// marcas mapeadas mas que NÃO são p/ revenda (uso interno: sacolas etc) → fora da precificação.
// Fonte: fornecedor_marcas.json → _uso_interno.marcas (de-para versionado no repo compras; a lista
// hardcoded antiga fica só de fallback se a chave sumir do JSON). (28/07/2026)
const MARCAS_NAO_REVENDA = new Set(((FORN_MARCAS._uso_interno || {}).marcas || ["Solider", "MultiBag"]).map(m => norm(m)));
const marcaNaoRevenda = mk => MARCAS_NAO_REVENDA.has(norm(mk));

// CFOP de amostra/bonificação/devolução/transferência/consignação — NÃO é compra p/ revenda.
const EXCL_CFOP = new Set(["5152","6152","5910","6910","5911","6911","5912","6912","5201","6201","5202","6202","1411","2411","3411","5917","6917","5918","6918"]);
// item de compra/revenda = tem CFOP e ele NÃO está na lista de excluídos
const cfopRevenda = c => { c = String(c || ""); return !!c && !EXCL_CFOP.has(c); };
// Mantém a NF se tiver PELO MENOS UM item de compra real. Assim uma NF MISTA — itens de venda +
// alguns sachês de amostra, que o fornecedor emite como "REMESSA DE AMOSTRA GRÁTIS" (ex. Franca NF
// 926: 53 itens CFOP 6102 de compra + 6 linhas de amostra/brinde) — NÃO é jogada fora inteira pela
// natureza; as linhas de amostra/bonificação saem depois no filtro POR-ITEM. Uma NF 100% amostra/
// devolução/transferência/consignação tem todos os CFOPs excluídos → cai fora aqui. (04/08/2026,
// antes a natureza "AMOSTRA" derrubava a NF inteira e sumia uma compra de R$18 mil.)
function keepNfe(nfe) {
  const cfops = (nfe.Produtos || []).map(p => String(p.CFOP || ""));
  return cfops.some(cfopRevenda);
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
        const custo = parse(tr.cells[7] && tr.cells[7].textContent); // coluna Custo/Líq = custo REAL no cadastro do ERP (não o da nota fiscal, que p/ alguns forn. vem reduzida)
        const p = parse(v.value);
        if (p != null) out.push({ cod, ean, desc, ref, custo, preco: p });
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
    await garantirSessao(page, { log, tokenOpcional: true });  // usa token_api (sobreviveu); só travava no garantirSessao (ERP migrou api_token_lma 30/07)
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
    // BOTÃO "✅ Concluída" (13/07/2026): a equipe marca a NF como precificada na tela → linha na tabela
    // Supabase precificacao_concluidas. Aqui aplicamos: aplicadoDesde retroativo (concluida_em − janela)
    // → a NF sai imediatamente e NÃO volta (o state lembra). Falha na consulta não trava a coleta.
    try {
      const rc = await fetch(`${SUPABASE_URL}/rest/v1/precificacao_concluidas?select=chave,concluida_em`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      if (rc.ok) {
        let aplicadas = 0;
        for (const c of await rc.json()) {
          const retro = new Date(Date.parse(c.concluida_em || Date.now()) - DIAS_ENTRADA * 86400000).toISOString();
          const e = state[c.chave];
          if (e && !e.aplicadoDesde) { e.aplicadoDesde = retro; aplicadas++; }
          else if (!e) { state[c.chave] = { desde: new Date().toISOString().slice(0, 10), aplicadoDesde: retro }; aplicadas++; }
        }
        if (aplicadas) log(`✅ concluídas pelo botão aplicadas: ${aplicadas}`);
      }
    } catch {}
    const janelaMs = DIAS_ENTRADA * 86400000;      // remoção: dias visível DEPOIS de precificada
    const janelaInicioMs = DIAS_INICIO * 86400000; // início: entrada no ERP ≤ N dias p/ COMEÇAR a aparecer
    const todayISO = HOJE.toISOString().slice(0, 10);
    let stateDirty = false;
    // poda SÓ entradas já precificadas há muito tempo (>30d pós-aplicação) — nunca poda as ainda não precificadas
    for (const k of Object.keys(state)) {
      const e = state[k];
      if (e && e.aplicadoDesde) { const t = Date.parse(e.aplicadoDesde); if (isNaN(t) || (HOJE.getTime() - t) > 30 * 86400000) { delete state[k]; stateDirty = true; } }
    }
    // poda rastreadores de transição (T|) antigos (>60d)
    for (const k of Object.keys(state)) {
      if (!k.startsWith("T|")) continue;
      const t = Date.parse(state[k]?.ts || ""); if (isNaN(t) || (HOJE.getTime() - t) > 60 * 86400000) { delete state[k]; stateDirty = true; }
    }
    // elegibilidade por NF: começa a aparecer (evidência de entrada recente) e continua até ser precificada
    const elegivel = (loja, nfe) => {
      const numN = String(nfe.Numero).replace(/^0+/, "");
      const ch = String(nfe.Chave || (loja + "-" + nfe.Numero));
      const lancNow = !!nfe.LancadaNoMicrovix;
      // DETECÇÃO POR TRANSIÇÃO (09/07/2026 — "tem que ser instantâneo"): rastreia o status lançada de
      // TODA NF vista (chave "T|<chave>"). Quando uma NF que era PENDENTE aparece LANÇADA, é a entrada
      // acontecendo AGORA → libera na hora, SEM depender do data_lcto do nfes_erp (que atualiza a cada 2h).
      const tk = "T|" + ch;
      const prev = state[tk];
      const transicaoAgora = lancNow && prev && prev.l === false;
      if (!prev || prev.l !== lancNow) { state[tk] = { l: lancNow, ts: todayISO }; stateDirty = true; }
      if (!lancNow) return false;
      let entry = state[ch];
      if (!entry) {
        // NF nova COMEÇA a aparecer se: (a) TRANSIÇÃO pendente→lançada detectada agora (instantâneo), OU
        // (b) data_lcto do nfes_erp ≤ DIAS_INICIO (fallback p/ NF que nunca foi vista pendente).
        // SEM nenhuma das duas evidências não inicia (pode ser lançada antiga já precificada).
        const entISO = lctoMap[loja + "|" + numN];
        const entMs = entISO ? Date.parse(entISO) : NaN;
        const lctoRecente = !isNaN(entMs) && (HOJE.getTime() - entMs) <= janelaInicioMs;
        if (!transicaoAgora && !lctoRecente) return false;
        entry = { desde: todayISO, aplicadoDesde: null };
        state[ch] = entry; stateDirty = true; // carimba a 1ª aparição = hoje
        if (transicaoAgora) log(`⚡ entrada AGORA detectada por transição: ${loja} NF ${nfe.Numero}`);
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
      let kept = 0, pend = 0;
      for (const nfe of nfes) {
        const de = nfe.DataEmissao; if (!de) continue;
        let dt; try { dt = new Date(String(de).replace("Z", "+00:00")); } catch { continue; }
        if (dt.getFullYear() !== ANO) continue;
        if (dt < cutoff) continue;
        if (!keepNfe(nfe)) continue;
        const emit = nfe.DadosEmitente || {};
        if (fornIgnorado(emit.Nome)) continue;
        const marcaForn = fornBrand(emit);
        // ⚠️ MARCA NÃO MAPEADA NUNCA SOME (28/07/2026 — defeito mais caro do pipeline).
        // Antes: `if (!marcaForn) continue` fazia a NFe DESAPARECER do dashboard sem deixar traço
        // (nem entrava no rastreio T| do state) — em 15/07 o usuário precificou na mão e "foi pra
        // venda com o preço errado"; em julho ditou 6+ códigos de marca no chat (La Bening=1015,
        // Depimiel=313, Felps=1000, Talge=243, Depilflax=957, Catharine Hill=346).
        // Agora: a NFe ENTRA com marca_pendente=true e marca = razão social do fornecedor. Sem o
        // código da marca não há "preço atual ERP" (o filtro do relatório exige o código), mas o
        // preço SUGERIDO sai normal e a tela mostra o badge "⚠️ marca não mapeada". Fornecedor
        // multi-marca ('+', split pendente) também cai aqui. Fica na tela até "✅ Concluída".
        const marcaCandidatas = fornMarcasCandidatas(emit); // >0 = fornecedor multi-marca mapeado (resolve por-item na fase de preços)
        // "pendente" (badge "marca não mapeada") SÓ quando o fornecedor não tem NENHUM mapeamento —
        // nem marca única (fornBrand) nem multi-marca ('+'). Multi-marca (ex. Franca=Varcare+Nathydras)
        // NÃO é pendente: a marca é resolvida item a item adiante. (05/08/2026 — banner era falso alarme)
        const marcaPendente = !marcaForn && !marcaCandidatas.length;
        if (NF_FILTER) {
          if (!NF_FILTER.includes(String(nfe.Numero))) continue; // modo teste: só a(s) NF(s) pedida(s)
        } else {
          // GATILHO: entrada no ERP + visível por DIAS_ENTRADA dias a partir da 1ª aparição (depois some)
          if (marcaForn && marcaNaoRevenda(marcaForn)) continue; // sacolas/uso interno não vão p/ precificação
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
            marca: marcaForn || String(emit.Nome || "").trim(), // sem marca mapeada → razão social (rótulo) + marca_pendente na NF
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
            preco_manual: PRECOS_MANUAIS[String(p.CEAN || "")] ?? null, // preço de venda FIXO por EAN (sobrepõe o sugerido na tela)
          };
        });
        if (!itens.length) continue;
        // FILTRO POR-ITEM: numa NF mista de compra, tira as linhas de amostra/bonificação/devolução
        // (CFOP excluído) p/ não precificar sachê grátis. (04/08/2026 — Franca NF 926)
        {
          // Ajuste por NF: linhas de bonificação/amostra que o usuário quer MANTER (ex. Franca NF 931:
          // Máscara Alho de bonificação precisa aparecer p/ precificar). Marcadas com bonificacao=true.
          const aj = ajusteNf(emit.Documento, nfe.Numero);
          const manter = (aj && aj.manter_cfop_excluido) || [];
          const ehManter = it => manter.some(m => String(m.cprod) === String(it.cprod) && (!m.cfop || String(m.cfop) === String(it.cfop)));
          const antes = itens.length;
          const rev = itens.filter(it => cfopRevenda(it.cfop) || ehManter(it));
          let mantidas = 0;
          for (const it of rev) if (!cfopRevenda(it.cfop) && ehManter(it)) { it.bonificacao = true; mantidas++; }
          if (rev.length < antes) log(`  NF ${nfe.Numero}/${loja}: ${antes - rev.length} linha(s) de amostra/bonificação removida(s)${mantidas ? ` (${mantidas} bonificação MANTIDA por ajuste)` : ""}`);
          itens.length = 0; itens.push(...rev);
          if (!itens.length) continue;
        }
        // ===== Detecção de KIT por LINHA (04/08/2026, regra do usuário) =====
        // O fornecedor manda o kit "montado" como linhas SEPARADAS na NF (o kit em si não tem linha).
        // Kit = 1 linha "CAIXA KIT..." + as N linhas adjacentes (antes OU depois) de MESMA quantidade
        // ("C/ N PROD" dá o N; padrão 3). Também há "cronograma" SEM caixa: run de ≥3 máscaras seguidas
        // de mesma quantidade. O MESMO produto pode vir em linhas diferentes como AVULSO e como
        // componente de kit (quantidades diferentes) → a marcação é POR LINHA, nunca por cprod. Os
        // componentes são agrupados depois num item sintético (bundle); avulsos precificam normal.
        {
          const ehCaixa = d => /CAIXA\s*KIT/i.test(d || "");
          const ehMasc = d => norm(d).includes("MASCARA");
          let kseq = 0;
          for (let i = 0; i < itens.length; i++) {           // (1) kits ancorados por CAIXA KIT
            if (!ehCaixa(itens[i].descricao)) continue;
            const Q = itens[i].qtd; const m = /C\/\s*(\d+)\s*PROD/i.exec(itens[i].descricao); const N = m ? +m[1] : 3;
            const cands = [];
            if (i + N < itens.length) cands.push(Array.from({ length: N }, (_, k) => i + 1 + k));
            if (i - N >= 0) cands.push(Array.from({ length: N }, (_, k) => i - N + k));
            const comp = cands.find(idxs => idxs.every(j => itens[j]._kitId == null && itens[j].qtd === Q && !ehCaixa(itens[j].descricao)));
            if (comp) { const id = kseq++; itens[i]._kitId = id; itens[i]._kitBox = true; for (const j of comp) itens[j]._kitId = id; }
          }
          // (2) cronograma: ≥3 máscaras seguidas, mesma qtd, SEM caixa. ⚠️ TRAVA: só procura numa NF que
          // JÁ tem CAIXA KIT (kseq>0). Sem isso, 3 máscaras individuais seguidas de mesma qtd (comum em
          // Salon Line etc.) viravam kit falso. NF com cronograma real (Franca) sempre tem caixas junto.
          // Ajuste por NF: desmembrar_cronograma=true deixa as máscaras do cronograma como AVULSAS — loja
          // que zerou o kit e vende as máscaras separadas (ex. L3 NF 932). (11/08/2026)
          const _ajCrono = ajusteNf(emit.Documento, nfe.Numero);
          if (kseq > 0 && !(_ajCrono && _ajCrono.desmembrar_cronograma)) for (let i = 0; i < itens.length;) {
            if (itens[i]._kitId != null || !ehMasc(itens[i].descricao)) { i++; continue; }
            let j = i;
            while (j + 1 < itens.length && itens[j + 1]._kitId == null && ehMasc(itens[j + 1].descricao) && itens[j + 1].qtd === itens[i].qtd) j++;
            if (j - i + 1 >= 3) { const id = kseq++; for (let k = i; k <= j; k++) itens[k]._kitId = id; i = j + 1; } else i++;
          }
          if (kseq) log(`  NF ${nfe.Numero}/${loja}: ${kseq} kit(s) detectado(s)`);
        }
        // DEDUP: a NFe pode trazer o MESMO produto em várias linhas (<det>) — para precificar
        // queremos 1 linha por produto. Agrupa por cprod (fallback ean/descrição), somando qtd e
        // custos; recalcula o custo unitário. (14/07/2026 — NF 538 trazia 1003329 duplicado.)
        // A chave inclui o papel (_kitId) p/ NÃO fundir linha de kit com a de avulso do mesmo cprod.
        const SOMAR = ["qtd", "valor_bruto", "desconto", "frete", "seguro", "outras", "ipi", "icms_st", "fcp_st", "custo_cheio_total"];
        const dedup = new Map();
        for (const it of itens) {
          const chave = String(it.cprod || it.ean || it.descricao || "").toUpperCase().trim() + "|" + (it._kitId == null ? "avulso" : "kit" + it._kitId + (it._kitBox ? "box" : ""));
          const prev = dedup.get(chave);
          if (!prev) { dedup.set(chave, it); continue; }
          for (const c of SOMAR) prev[c] = Math.round(((prev[c] || 0) + (it[c] || 0)) * 10000) / 10000;
          prev.custo_unit_cheio = prev.qtd ? Math.round((prev.custo_cheio_total / prev.qtd) * 10000) / 10000 : prev.custo_unit_cheio;
        }
        const itensU = [...dedup.values()];
        if (itensU.length < itens.length) log(`  NF ${nfe.Numero}/${loja}: ${itens.length - itensU.length} linha(s) duplicada(s) mescladas`);
        itens.length = 0; itens.push(...itensU);
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
          ...(marcaPendente ? { marca_pendente: true } : {}), // badge "⚠️ marca não mapeada" na tela; ausente = mapeada (JSON não muda p/ NFes normais)
          ...(marcaCandidatas.length ? { marca_candidatas: marcaCandidatas } : {}), // multi-marca: marca resolvida por-item na fase de preços do ERP
          itens,
        });
        kept++;
        if (marcaPendente) { pend++; log(`  ⚠️ ${loja} NF ${nfe.Numero} SEM marca mapeada (forn "${emit.Nome}") — mantida com marca_pendente`); }
      }
      // mais recentes primeiro
      lojas[loja].sort((a, b) => (a.data_emissao < b.data_emissao ? 1 : -1));
      log(`${loja}: ${kept} NFes mantidas (de ${nfes.length})${pend ? ` — ${pend} com marca NÃO mapeada (pendente)` : ""}`);
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
              const qCom = parseFloat(tag(d, "qCom") || "0");   // qtd comercial (ex.: 1 CX)
              const qTrib = parseFloat(tag(d, "qTrib") || "0"); // qtd tributável (ex.: 10 UN) → fator CX→unidade
              prod[cProd] = { cst, csosn, grpTag, orig: tag(icmsBlk, "orig"), vICMS, pICMS, vICMSST, vProd, cest, ncm, qCom, qTrib };
            }
            out[nf.id] = { uf, prod };
          } catch (e) { out[nf.id] = { uf: null, prod: {}, erro: String(e).slice(0, 80) }; }
        }
        return out;
      }, nfList);

      const CST_ST_X = new Set(["10", "30", "60", "70"]);
      const MARCAS_POR_CAIXA = new Set((PARAMS.marcas_por_caixa || []).map(norm)); // preço deve ser por UNIDADE, não por caixa (fator do XML qTrib/qCom)
      // Santa Clara: "dividir ou não" é decisão POR PRODUTO (o XML não traz fator; a qtd está na descrição).
      const SC = norm("Santa Clara");
      const SC_UNID = PARAMS.santa_clara_por_unidade || {};              // cProd → 'auto' | número (vende UNIDADE: divide)
      const SC_AMBOS = (PARAMS.santa_clara_ambos_categorias || []).map(norm); // substrings (ex.: LIXA) que vendem pacote E unidade
      const SC_AMBOS_EXC = (PARAMS.santa_clara_ambos_excecoes || []).map(norm); // batem em SC_AMBOS mas vendem só o PACOTE (ex.: REFIL de lixa)
      const scDivisorConfig = cfg => (cfg === "auto" || cfg === true) ? null : Number(cfg); // null = ler da descrição
      let comCredito = 0, comST = 0, semInfo = 0, convCaixa = 0;
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) {
        const d = det[nf.id] || { uf: null, prod: {} };
        nf.uf = d.uf;
        for (const it of nf.itens) {
          const tx = (d.prod || {})[it.cprod];
          if (!tx) { semInfo++; it.cst = null; it.icms_pct = null; it.ncm = null; it.st = false; it.st_motivo = null; it.credito_icms_pct = 0; continue; }
          // CONVERSÃO CAIXA→UNIDADE (13/07/2026 — marca Talge entra em CX; preço tem que ser da unidade).
          // fator = qTrib/qCom (unidades por caixa, lido do XML). Divide o custo unitário e multiplica a qtd.
          if (MARCAS_POR_CAIXA.has(norm(it.marca)) && tx.qCom > 0 && tx.qTrib > tx.qCom) {
            const fator = tx.qTrib / tx.qCom;
            it.unidades_por_caixa = Math.round(fator * 100) / 100;
            it.custo_unit_cheio = Math.round((it.custo_unit_cheio / fator) * 10000) / 10000; // custo por UNIDADE
            it.qtd = Math.round((it.qtd * fator) * 100) / 100; // qtd em UNIDADES
            convCaixa++;
          } else if (norm(it.marca) === SC) {
            // Santa Clara: controle por produto. Divisor da descrição, exceto override numérico na config.
            const cfgUnid = SC_UNID[String(it.cprod)];
            const dsc = norm(it.descricao);
            const ehLixa = SC_AMBOS.some(c => dsc.includes(c)) && !SC_AMBOS_EXC.some(c => dsc.includes(c));
            if (cfgUnid != null) {
              // vende UNIDADE → divide (preço da tela é por unidade)
              const fator = scDivisorConfig(cfgUnid) ?? divisorDescricao(it.descricao);
              if (fator > 1) {
                it.unidades_por_caixa = fator;
                it.custo_unit_cheio = Math.round((it.custo_unit_cheio / fator) * 10000) / 10000; // custo por UNIDADE
                it.qtd = Math.round((it.qtd * fator) * 100) / 100; // qtd em UNIDADES
                convCaixa++;
              }
            } else if (ehLixa) {
              // vende PACOTE E UNIDADE → NÃO divide; só anota o divisor p/ a tela derivar o preço unitário
              const fator = divisorDescricao(it.descricao);
              if (fator > 1) it.unidades_no_pacote = fator;
            }
            // demais produtos Santa Clara: vende o PACOTE → não mexe (preço da tela é o do pacote)
          }
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
      log(`XML por item: ${nfList.length} NFes; c/ crédito=${comCredito}, ST sem crédito=${comST}, sem info=${semInfo}; ST só por sinal-NF (revisar NCM)=${revisar.length}; itens convertidos CX→unidade=${convCaixa}`);
    }

    // ===== Agrupa componentes de KIT num item sintético (bundle) — 04/08/2026 =====
    // Depois da fase ST (cada componente já tem seu st): junta os componentes de cada kit num único
    // item cujo custo = SOMA dos componentes + a caixa. O kit NÃO tem EAN na NF (o produto-kit tem
    // código próprio no ERP, que não está nesta nota) → ean vazio; o usuário informa depois p/ o .txt.
    // A marca do kit é resolvida na fase de preços a seguir (fallback por descrição pega os nomes dos
    // componentes). ST do kit = ST de qualquer componente. Avulsos seguem intactos.
    let kitsCriados = 0;
    for (const L of Object.keys(lojas)) for (const nf of lojas[L]) {
      const grupos = {}; const resto = [];
      for (const it of nf.itens) {
        if (it._kitId == null) { resto.push(it); continue; }
        (grupos[it._kitId] = grupos[it._kitId] || []).push(it);
      }
      const sinteticos = [];
      for (const membros of Object.values(grupos)) {
        const comps = membros.filter(m => !m._kitBox);
        const caixa = membros.find(m => m._kitBox);
        if (comps.length < 2) { resto.push(...membros.map(m => { delete m._kitId; delete m._kitBox; return m; })); continue; } // sem trio → trata como avulso
        const Q = comps[0].qtd || 1;
        const custoTotal = Math.round(membros.reduce((s, m) => s + (m.custo_cheio_total || 0), 0) * 100) / 100;
        const nomeComp = comps.map(c => c.descricao.replace(/\s+\d.*$/, "").trim());
        sinteticos.push({
          cprod: "KIT-" + comps.map(c => c.cprod).sort((a, b) => (+a || 0) - (+b || 0) || String(a).localeCompare(b)).join("-"), // único e ESTÁVEL (ordena componentes) — chave p/ mapear o código interno do kit

          ean: "", // kit não tem EAN na NF → usuário informa depois (precificacao_eans_manuais / kit)
          descricao: "KIT: " + comps.map(c => c.descricao).join(" + "),
          qtd: Q, cfop: comps[0].cfop, marca: comps[0].marca,
          valor_bruto: 0, desconto: 0, frete: 0, seguro: 0, outras: 0, ipi: 0, icms_st: 0, fcp_st: 0,
          custo_cheio_total: custoTotal, custo_unit_cheio: Math.round((custoTotal / Q) * 10000) / 10000,
          cst: null, icms_pct: null, credito_icms_pct: 0,
          st: comps.some(c => c.st), st_motivo: comps.some(c => c.st) ? "kit" : null,
          ncm: (comps.find(c => c.ncm) || {}).ncm || null, cest: null,
          preco_atual: null, cod_erp: null, match_tipo: null, preco_manual: null,
          kit: true,
          kit_componentes: comps.map(c => ({ cprod: c.cprod, ean: c.ean, desc: c.descricao, qtd: c.qtd, custo_cheio_total: c.custo_cheio_total })),
        });
        kitsCriados++;
      }
      nf.itens = [...resto, ...sinteticos];
    }
    if (kitsCriados) log(`kits agrupados (bundle): ${kitsCriados}`);

    // ===== Ajustes manuais por NF: alinhar ao ROMANEIO (remover embalagem, forçar custo de kit) =====
    // Complementa manter_cfop_excluido (aplicado no filtro por-item). remover_cprod tira itens que não
    // são de venda (ex. bobina shrink que o romaneio embute no kit); custo_kit força o custo unitário
    // do kit/avulso p/ o valor do romaneio. Roda após o bundle (as chaves KIT-... já existem).
    let ajRemovidos = 0, ajCustos = 0;
    for (const L of Object.keys(lojas)) for (const nf of lojas[L]) {
      const aj = ajusteNf(nf.cnpj, nf.numero);
      if (!aj) continue;
      if (aj.remover_cprod && aj.remover_cprod.length) {
        const rem = new Set(aj.remover_cprod.map(String));
        const antes = nf.itens.length;
        nf.itens = nf.itens.filter(it => !rem.has(String(it.cprod)));
        ajRemovidos += antes - nf.itens.length;
      }
      if (aj.custo_kit) {
        for (const it of nf.itens) {
          const v = aj.custo_kit[String(it.cprod)];
          if (v != null) {
            it.custo_unit_cheio = Math.round(Number(v) * 10000) / 10000;
            it.custo_cheio_total = Math.round(Number(v) * (it.qtd || 1) * 100) / 100;
            ajCustos++;
          }
        }
      }
    }
    if (ajRemovidos || ajCustos) log(`ajustes por NF (romaneio): ${ajRemovidos} item(ns) removido(s), ${ajCustos} custo(s) forçado(s)`);

    // ===== Código INTERNO do ERP p/ o .txt (import por "Código", não "Código de Barras") =====
    // Quando o fornecedor está em CODIGOS_ERP.por_cnpj, cada item (avulso por cprod; kit pela chave
    // "KIT-<cprods ordenados>") recebe it.codigo_erp — o .txt sai com esse código no lugar do EAN.
    let comCodErp = 0;
    for (const L of Object.keys(lojas)) for (const nf of lojas[L]) {
      const mapa = (CODIGOS_ERP.por_cnpj || {})[String(nf.cnpj || "").replace(/\D/g, "")];
      if (!mapa) continue;
      for (const it of nf.itens) { const c = mapa[String(it.cprod)]; if (c) { it.codigo_erp = String(c); comCodErp++; } }
    }
    if (comCodErp) log(`código interno do ERP anexado a ${comCodErp} item(ns)`);

    // ===== Preço de venda atual no ERP (Lista de Preços), por LOJA × MARCA =====
    // Consulta o relatório por marca (código do ERP) e casa cada item por EAN (fallback: referência/cprod).
    // MULTI-MARCA (04/08/2026): fornecedor com marcas candidatas (ex. Franca → Varcare+Nathydras) tem a
    // marca de CADA item resolvida aqui — o item recebe a marca cujo relatório de preços contém o EAN/ref
    // dele (o ERP é a fonte da verdade da marca, não a descrição). Assim multi-marca também ganha "preço
    // atual do ERP" e passa a usar a margem da marca correta.
    const setPreco = (it, r, tipo) => { it.preco_atual = r.preco; it.cod_erp = r.cod; it.custo_erp = r.custo; it.match_tipo = tipo; };
    const matchEan = (it, ix) => (it.ean && it.ean !== "SEM GTIN" && ix.porEan[it.ean] != null) ? ix.porEan[it.ean] : null;
    const matchRef = (it, ix) => { const k = String(it.cprod || "").toUpperCase().trim(); return (k && ix.refMap[k]) ? ix.refMap[k] : null; };
    // Match por CÓDIGO INTERNO do ERP: kits (e produtos cujo EAN/ref da nota não bate) não têm EAN nem
    // referência que case, mas têm codigo_erp (de CODIGOS_ERP). O relatório traz o código em r.cod. (10/08/2026)
    const matchCod = (it, ix) => { const c = String(it.codigo_erp || "").trim(); return (c && ix.porCod && ix.porCod[c] != null) ? ix.porCod[c] : null; };
    for (const L of Object.keys(lojas)) {
      if (PROC_SKIP_PRECO) break;
      if (!lojas[L].length) continue;
      const empresa = (PARAMS.lojas[L] || {}).empresa;
      const tabelaNome = (PARAMS.lojas[L] || {}).tabela_preco;
      const tabelaId = (PARAMS.lojas[L] || {}).tabela_id;
      if (!empresa) continue;
      // (a) itens já com marca mapeada, agrupados por marca
      const porMarca = {};
      for (const nf of lojas[L]) for (const it of nf.itens) {
        const codes = MARCA_TO_CODES[norm(it.marca)];
        if (!codes) continue;
        (porMarca[norm(it.marca)] = porMarca[norm(it.marca)] || { codes, mk: it.marca, itens: [] }).itens.push(it);
      }
      // (b) itens de NF multi-marca (marca ainda pendente) + marcas candidatas a consultar
      const multiItens = []; const candSet = new Set();
      for (const nf of lojas[L]) {
        if (!nf.marca_candidatas || !nf.marca_candidatas.length) continue;
        const cands = nf.marca_candidatas.map(norm).filter(m => MARCA_TO_CODES[m]);
        for (const m of cands) candSet.add(m);
        for (const it of nf.itens) if (it.preco_atual == null) multiItens.push({ it, cands });
      }
      // consulta cada marca (mapeada + candidata) UMA vez; guarda os índices por EAN e referência
      const idx = {};
      for (const m of new Set([...Object.keys(porMarca), ...candSet])) {
        const codes = MARCA_TO_CODES[m]; if (!codes) continue;
        try {
          const { tabela, rows } = await relatorioPrecosErp(page, empresa, tabelaNome, codes, tabelaId);
          const porEan = {}; for (const r of rows) if (r.ean) porEan[r.ean] = r;
          const porCod = {}; for (const r of rows) if (r.cod) porCod[String(r.cod).trim()] = r; // índice por código interno (p/ kits sem EAN/ref)
          // Índice por REFERÊNCIA (= cprod). SEGURO: só referências ÚNICAS — duas linhas com a mesma
          // referência e preços diferentes = ambíguo → descarta (o relatório mostra só 1 código de barras
          // por produto, às vezes o interno, então o match por EAN às vezes falha e a referência resolve).
          const refMap = {};
          for (const r of rows) {
            const k = String(r.ref || "").toUpperCase().trim(); if (!k) continue;
            if (refMap[k] === undefined) refMap[k] = r;
            else if (refMap[k] === null || refMap[k].preco !== r.preco) refMap[k] = null;
          }
          idx[m] = { porEan, porCod, refMap, tabela, rows };
        } catch (e) { log(`preços ERP ${L}/${m} FALHOU: ${String(e.message || e).split("\n")[0]}`); }
      }
      // 1) itens de marca mapeada: casam na própria marca (EAN → senão referência)
      for (const [m, g] of Object.entries(porMarca)) {
        const ix = idx[m]; if (!ix) continue;
        let ean = 0, cod = 0, ref = 0;
        for (const it of g.itens) {
          if (it.preco_atual != null) continue;
          const re = matchEan(it, ix); if (re) { setPreco(it, re, "ean"); ean++; continue; }
          const rc = matchCod(it, ix); if (rc) { setPreco(it, rc, "cod"); cod++; continue; }
          const rr = matchRef(it, ix); if (rr) { setPreco(it, rr, "ref"); ref++; }
        }
        log(`preços ERP ${L}/${g.mk} (emp ${empresa}, ${ix.tabela || "?"}, ${ix.rows.length} prod): ${ean} por EAN + ${cod} por código + ${ref} por referência = ${ean + cod + ref}/${g.itens.length}`);
      }
      // 2) itens multi-marca: a 1ª candidata que casar define a marca real do item (EAN tem prioridade
      //    sobre referência entre TODAS as candidatas, p/ não fixar a marca errada por um ref ambíguo).
      if (multiItens.length) {
        let porErp = 0, porDesc = 0;
        for (const { it, cands } of multiItens) {
          if (it.preco_atual != null) continue;
          // (a) ERP é a fonte da verdade: casa por EAN (prioridade), senão por código interno (kits), senão por referência
          let m = cands.find(c => idx[c] && matchEan(it, idx[c]));
          if (!m) m = cands.find(c => idx[c] && matchCod(it, idx[c]));
          if (!m) m = cands.find(c => idx[c] && matchRef(it, idx[c]));
          if (m) {
            const ix = idx[m]; const re = matchEan(it, ix); const rc = re ? null : matchCod(it, ix);
            setPreco(it, re || rc || matchRef(it, ix), re ? "ean" : (rc ? "cod" : "ref"));
            it.marca = MARCA_CANON[m] || it.marca; it.marca_detectada = true; it.marca_fonte = "erp"; porErp++;
            continue;
          }
          // (b) produto NOVO (ainda sem preço no ERP) → detecta marca pela DESCRIÇÃO, restrito às candidatas
          const restr = new Set(cands.map(c => MARCA_CANON[c]).filter(Boolean));
          const mk = marcaPorDescricao(it.descricao, restr);
          if (mk) { it.marca = mk; it.marca_detectada = true; it.marca_fonte = "descricao"; porDesc++; }
        }
        log(`multi-marca ${L}: ${porErp} por ERP + ${porDesc} por descrição = ${porErp + porDesc}/${multiItens.length} itens com marca`);
      }
      // 3) NF multi-marca com TODOS os itens resolvidos deixa de ser "pendente" (some o badge da tela)
      for (const nf of lojas[L]) {
        if (!nf.marca_candidatas) continue;
        if (nf.itens.every(it => it.marca_detectada)) { delete nf.marca_pendente; delete nf.marca_candidatas; }
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

    // ===== FALLBACK do PREÇO ATUAL pelo BALANÇO (Opção B) — quando o relatório de Lista de Preços falha =====
    // O balanço (dados_estoque/snapshot.json) traz o preço de venda ATUAL por loja. Ponte: EAN->código
    // (mapa persistente) -> preço do balanço da loja. NÃO sobrepõe preço FRESCO do relatório (só null/preservado*).
    // Também faz o mapa EAN->código crescer com os códigos que o relatório trouxe (cresce quando o relatório volta).
    try {
      let mapDirty = false;
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) for (const it of nf.itens) {
        if (it.cod_erp != null && it.ean && it.ean !== "SEM GTIN" && it.match_tipo !== "balanco") {
          const e = String(it.ean);
          if (EAN_COD[e] !== String(it.cod_erp)) { EAN_COD[e] = String(it.cod_erp); mapDirty = true; }
        }
      }
      let viaBalanco = 0;
      for (const L of Object.keys(lojas)) {
        const prods = (BALANCO[L] || {}).prods || {};
        if (!Object.keys(prods).length) continue;
        for (const nf of lojas[L]) for (const it of nf.itens) {
          const fresco = it.preco_atual != null && it.match_tipo && !String(it.match_tipo).endsWith("*") && it.match_tipo !== "balanco";
          if (fresco) continue; // respeita preço fresco do relatório (quando token_api voltar)
          const cod = EAN_COD[String(it.ean || "")];
          if (!cod) continue;
          const p = prods[cod];
          if (p && Number(p.pre) > 0) { it.preco_atual = Math.round(Number(p.pre) * 100) / 100; it.cod_erp = cod; it.match_tipo = "balanco"; viaBalanco++; }
        }
      }
      if (viaBalanco) log(`preço atual via BALANÇO (relatório indisponível): ${viaBalanco} item(ns)`);
      if (mapDirty) { try { writeFileSync(EAN_COD_FILE, JSON.stringify({ _doc: "Mapa EAN->codigo interno (ponte p/ preco atual via balanco quando o relatorio falha). Cresce quando o relatorio funciona.", atualizado_em: new Date().toISOString().slice(0, 10), ean_cod: EAN_COD }, null, 0)); log(`mapa EAN->código atualizado (${Object.keys(EAN_COD).length} EANs)`); } catch {} }
    } catch (e) { log("fallback balanço falhou: " + String(e.message || e)); }

    // ===== Último preço de venda REAL (exibição, por EAN) — NÃO é trava =====
    let comUltVenda = 0;
    if (Object.keys(ULTIMA_VENDA).length) {
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) for (const it of nf.itens) {
        const uv = ULTIMA_VENDA[String(it.ean || "")];
        if (uv && uv.preco != null) { it.preco_ultima_venda = uv.preco; it.preco_ultima_venda_data = uv.data || null; comUltVenda++; }
      }
      if (comUltVenda) log(`último preço de venda (exibição) anexado a ${comUltVenda} item(ns)`);
    }

    // ===== Preço de MERCADO + frete (exibição, por EAN) — NÃO é trava =====
    let comMercado = 0;
    if (Object.keys(PRECO_MERCADO).length) {
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) for (const it of nf.itens) {
        const m = PRECO_MERCADO[String(it.ean || "")];
        if (m && (m.total != null || m.mercado != null)) {
          const mercado = m.mercado != null ? m.mercado : null;
          const frete = m.frete != null ? m.frete : 0;
          const total = m.total != null ? m.total : (mercado != null ? Math.round((mercado + frete) * 100) / 100 : null);
          it.preco_mercado = { mercado, frete, total, n: m.n || null, faixa: m.faixa || null, data: m.data || null, obs: m.obs || null };
          comMercado++;
        }
      }
      if (comMercado) log(`preço de mercado (exibição) anexado a ${comMercado} item(ns)`);
    }

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
        // ≥60% dos itens COM DADO resolvidos = NF precificada (13/07/2026 — exigir 100% nunca fechava:
        // a equipe mantém o preço antigo de propósito em parte dos itens, então "todos" era inalcançável)
        const validos = resolvidos.filter(r => r !== null);
        const okCount = validos.filter(r => r === true).length;
        const bateu = comEan.length > 0 && algumDadoValido && validos.length > 0 && okCount >= 2 && (okCount / validos.length) >= 0.6;
        if (bateu && !entry.aplicadoDesde) {
          // NF antiga (na tela há >3d) detectada agora → sai imediatamente (já teve seus 3 dias de exposição);
          // NF fresca → fica os 3 dias normais após a precificação
          const naTelaMs = HOJE.getTime() - Date.parse(entry.desde || todayISO);
          entry.aplicadoDesde = naTelaMs > janelaMs ? new Date(HOJE.getTime() - janelaMs).toISOString() : HOJE.toISOString();
          stateDirty = true;
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
