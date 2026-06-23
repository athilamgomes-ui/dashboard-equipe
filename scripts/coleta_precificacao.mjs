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
const norm = s => String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// CST/CSOSN que indicam ICMS por Substitui\u00e7\u00e3o Tribut\u00e1ria (ST) \u2192 SEM cr\u00e9dito a abater
const CST_ST = new Set(["10", "30", "60", "70", "90"]);
const CSOSN_ST = new Set(["201", "202", "203", "500", "900"]);
// cr\u00e9dito de ICMS por item (regra do usu\u00e1rio, Lucro Real): com ST \u2192 0; sem ST \u2192 % de ICMS real da NF (\u22487% nacional / 4% importado)
function creditoIcmsItem(tx, icmsStValor) {
  if (!tx) return 0;
  const cst = String(tx.cst || "").padStart(2, "0").slice(-2);
  const csosn = String(tx.csosn || "");
  const temST = (Number(icmsStValor) > 0) || CST_ST.has(cst) || CSOSN_ST.has(csosn);
  if (temST) return 0;
  return Math.max(0, Number(tx.icms_pct) || 0) / 100;
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

    const alvos = await alvosEntregues();

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
        // SÓ NFes de marca×loja que tenham pedido ENTREGUE recente no Planejamento
        if (!marcaForn) continue;
        const chave = (LOJA_TO_GROUP[loja] || "") + "|" + norm(marcaForn);
        if (!alvos.has(chave)) continue;
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
          };
        });
        if (!itens.length) continue;
        totItens += itens.length;
        lojas[loja].push({
          id: nfe.Id,
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

    // ===== Enriquecer com CST/ICMS% por item (BuscarDetalhesNFe) p/ crédito de ICMS por produto =====
    const ids = [];
    for (const L of Object.keys(lojas)) for (const nf of lojas[L]) ids.push(nf.id);
    if (ids.length) {
      const det = await page.evaluate(async (ids) => {
        const token = localStorage.getItem("token_api");
        const base = (localStorage.getItem("url_fiscal_api") || "").replace(/\/$/, "");
        const url = base + "/api/NfeEntrada/BuscarDetalhesNFe";
        const out = {};
        for (const id of ids) {
          try {
            const r = await fetch(url, { method: "POST", headers: { Authorization: token, "Content-Type": "application/json" }, body: JSON.stringify({ IdNfe: id }) });
            const js = JSON.parse(await r.text());
            const map = {};
            for (const p of (js.Produtos || [])) {
              const cod = String(p.Codigo || "");
              if (cod && !map[cod]) map[cod] = { cst: p.CST, csosn: p.CSOSN, icms_pct: p.PercentualICMS };
            }
            out[id] = map;
          } catch (e) { out[id] = {}; }
        }
        return out;
      }, ids);

      let comCredito = 0, comST = 0, semInfo = 0;
      for (const L of Object.keys(lojas)) for (const nf of lojas[L]) {
        const map = det[nf.id] || {};
        for (const it of nf.itens) {
          const tx = map[it.cprod];
          if (!tx) { semInfo++; continue; }
          it.cst = tx.cst != null ? String(tx.cst) : (tx.csosn != null ? "CSOSN " + tx.csosn : null);
          it.icms_pct = Number(tx.icms_pct) || 0;
          it.credito_icms_pct = creditoIcmsItem(tx, it.icms_st);
          if (it.credito_icms_pct > 0) comCredito++; else comST++;
        }
      }
      log(`detalhe fiscal: ${ids.length} NFes; itens c/ crédito ICMS=${comCredito}, sem crédito (ST/0%)=${comST}, sem info=${semInfo}`);
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
