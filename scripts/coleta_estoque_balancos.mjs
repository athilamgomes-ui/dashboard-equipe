#!/usr/bin/env node
/**
 * coleta_estoque_balancos.mjs — balanços (inventário) das 4 lojas via API do lb-erpwebapp.
 *
 * Regra nº 1: Playwright headless, NUNCA Chrome MCP.
 *
 * Autenticação (ver memória microvix-api-balanco-inventario):
 *   garantirSessao() → trocar empresa no #topbar_sel_empresa_portal_usuario do v4/home →
 *   abrir gestor_web/produtos/balanco_validar_permissao.asp → CAPTURAR o header `authorization`
 *   da primeira requisição a suprimentoswebapi-prod → disparar as chamadas por ctx.request
 *   (fetch dentro da página falha por CORS).
 *
 * Cache: balanço FINALIZADO é imutável — o conteúdo só é baixado uma vez.
 *   dados_estoque/balancos.json = { atualizado_em, listas:{emp:[meta]}, itens:{idBalanco:[...]} }
 *
 * Uso:  node coleta_estoque_balancos.mjs            → atualiza o cache
 *       node coleta_estoque_balancos.mjs --probe    → só imprime o resumo (datas distintas)
 * Exit: 0 ok · 1 falha · 2 creds/login
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, "..");
const OUT_DIR = path.join(RAIZ, "dados_estoque");
const CACHE = path.join(OUT_DIR, "balancos.json");
const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");

const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const DATA_INICIAL = "2024-01-01";
// balanços que NÃO são contagem física (injeção de saldo) — excluídos da reconciliação
const NAO_CONTAGEM = /AJUSTE|ZERAR|SEM\s*BALAN[ÇC]O/i;
const URL_HOME = "https://linx.microvix.com.br/v4/home/index.asp";
const URL_BALANCO = "https://linx.microvix.com.br/gestor_web/produtos/balanco_validar_permissao.asp";

const PROBE = process.argv.includes("--probe");
const log = m => process.stderr.write(`[estoque-bal] ${m}\n`);
const hoje = new Date();
const isoHoje = hoje.toISOString().slice(0, 10);

fs.mkdirSync(OUT_DIR, { recursive: true });
let cache = { atualizado_em: null, listas: {}, itens: {} };
if (fs.existsSync(CACHE)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch { log("cache ilegível — recomeçando"); }
}
cache.listas = cache.listas || {};
cache.itens = cache.itens || {};

function salvar() {
  cache.atualizado_em = new Date().toISOString();
  fs.writeFileSync(CACHE, JSON.stringify(cache));
}

// ── resumo (também é o --probe) ─────────────────────────────────────────────
function resumo() {
  const linhas = [];
  for (const E of EMPRESAS) {
    const lista = (cache.listas[String(E)] || []).filter(b => b.finalizado && !b.ajuste);
    const datas = [...new Set(lista.map(b => b.data))].sort();
    const comItens = lista.filter(b => cache.itens[String(b.id)]);
    const prods = new Set();
    for (const b of comItens) for (const it of cache.itens[String(b.id)]) prods.add(it.cod);
    linhas.push(`${EMP_TO_LOJA[E]} (emp ${E}): ${lista.length} balanços de contagem · ` +
      `${datas.length} datas distintas · ${prods.size} produtos contados · ` +
      `mais antigo ${datas[0] || "—"} · mais novo ${datas[datas.length - 1] || "—"}`);
  }
  const excl = [];
  for (const E of EMPRESAS) for (const b of (cache.listas[String(E)] || [])) if (b.ajuste) excl.push(`${EMP_TO_LOJA[E]} #${b.id} ${b.data} "${b.nome}"`);
  linhas.push(`${excl.length} balanços NÃO-contagem ignorados: ${excl.join(" · ") || "nenhum"}`);
  return linhas.join("\n");
}

if (PROBE) {
  if (!cache.atualizado_em) { log("cache vazio — rode sem --probe primeiro"); process.exit(1); }
  process.stdout.write(resumo() + "\n");
  process.exit(0);
}

// ── coleta ──────────────────────────────────────────────────────────────────
async function trocarEmpresa(page, E) {
  await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
  const ok = await page.evaluate(E => {
    const s = document.getElementById("topbar_sel_empresa_portal_usuario");
    if (!s || !window.jQuery) return false;
    window.jQuery(s).val(String(E));
    window.jQuery(s).trigger("change");   // ⚠️ recarrega a página
    return true;
  }, E).catch(() => false);
  if (!ok) throw new Error(`select de empresa não encontrado (emp ${E})`);
  await page.waitForTimeout(4000);
}

// Abre o painel do balanço e devolve {auth, base} capturados do tráfego do SPA.
async function capturarAuth(page, timeoutMs = 45000) {
  let achado = null;
  const onReq = req => {
    if (achado) return;
    const u = req.url();
    if (!/suprimentoswebapi-prod\.microvix\.com\.br/i.test(u)) return;
    const h = req.headers();
    const a = h["authorization"] || h["Authorization"];
    if (a) achado = { auth: a, base: u.split("/api/")[0] + "/api" };
  };
  page.on("request", onReq);
  try {
    await page.goto(URL_BALANCO, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    const t0 = Date.now();
    while (!achado && Date.now() - t0 < timeoutMs) await page.waitForTimeout(500);
  } finally {
    page.off("request", onReq);
  }
  if (!achado) throw new Error("header authorization do suprimentoswebapi não apareceu");
  return achado;
}

async function api(ctx, { auth, base }, rota, { method = "GET", data = null, query = "" } = {}) {
  const url = `${base}/${rota}${query}`;
  const opts = { headers: { authorization: auth, accept: "application/json" }, timeout: 60000 };
  if (data) { opts.data = data; opts.headers["content-type"] = "application/json"; }
  const r = method === "POST" ? await ctx.request.post(url, opts) : await ctx.request.get(url, opts);
  if (!r.ok()) throw new Error(`${rota} HTTP ${r.status()}`);
  return await r.json();
}

const t0 = Date.now();
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

let baixados = 0, falhas = 0;
try {
  for (const E of EMPRESAS) {
    log(`── emp ${E} (${EMP_TO_LOJA[E]}) — trocando empresa e capturando token...`);
    await trocarEmpresa(page, E);
    const cred = await capturarAuth(page);
    log(`token OK (${cred.auth.length} chars) · base ${cred.base}`);

    const r = await api(ctx, cred, "Balanco/FiltrarBalancos", {
      method: "POST",
      data: { dataInicial: DATA_INICIAL, dataFinal: isoHoje, idEmpresa: E },
    });
    const brutos = r.Balancos || r.balancos || [];
    // ⚠️ o painel às vezes devolve balanço de outra loja — conferir IdEmpresa registro a registro
    const lista = brutos
      .filter(b => Number(b.IdEmpresa ?? b.idEmpresa) === E)
      .map(b => {
        const nome = String(b.Descricao ?? b.Nome ?? "").trim();
        const dRaw = b.DataLancamento ?? b.DataBalanco ?? b.Data ?? null;
        return {
          id: Number(b.IdBalanco ?? b.idBalanco),
          nome,
          data: dRaw ? String(dRaw).slice(0, 10) : null,
          status: Number(b.IdStatusBalanco ?? b.idStatusBalanco),
          finalizado: Number(b.IdStatusBalanco ?? b.idStatusBalanco) === 3,
          deposito: Number(b.IdDeposito ?? 1),
          // ⚠️ NÃO é contagem: "AJUSTE" (injeção de saldo) e "ZERAR ... SEM BALANÇO".
          // A seção interna quase sempre se chama "AJUSTE" (206 de 271 balanços da L4),
          // então o marcador confiável é o NOME do balanço, nunca o da seção.
          ajuste: NAO_CONTAGEM.test(nome),
          emp: E,
        };
      })
      .filter(b => b.id && b.data);
    cache.listas[String(E)] = lista;
    log(`emp ${E}: ${brutos.length} brutos → ${lista.length} da loja · ` +
        `${lista.filter(b => b.finalizado && !b.ajuste).length} de contagem finalizados`);

    // conteúdo dos que faltam (finalizado é imutável). Os NÃO-contagem (AJUSTE/ZERAR) também
    // são baixados: ficam fora da reconciliação, mas o painel mostra o que eles injetaram.
    const faltam = lista.filter(b => b.finalizado && !cache.itens[String(b.id)]);
    log(`emp ${E}: baixando conteúdo de ${faltam.length} balanços...`);
    for (const b of faltam) {
      try {
        const d = await api(ctx, cred, "Balanco/ObterDadosConferenciaBalanco", { query: `?idBalanco=${b.id}` });
        const arr = [
          ...(d.DadosComDivergenciaConferenciaBalanco || []),
          ...(d.DadosSemDivergenciaConferenciaBalanco || []),
        ];
        cache.itens[String(b.id)] = arr.map(it => ({
          cod: String(it.CodigoProduto ?? "").trim(),
          nome: String(it.Nome ?? "").trim(),
          ref: String(it.Referencia ?? "").trim(),
          saldo_erp: Number(it.SaldoAnteriorERP ?? 0),
          contado: Number(it.QuantidadeTotalConferencia ?? 0),
          ajuste: Number(it.QuantidadeAjuste ?? 0),
          tipo_ajuste: it.TipoAjuste ?? null,
          // ⚠️ ValorProduto é PREÇO DE VENDA (não custo) — correção de 19/08/2026
          preco: Number(it.ValorProduto ?? 0),
        })).filter(x => x.cod);
        baixados++;
        if (baixados % 20 === 0) { salvar(); log(`  ...${baixados} baixados`); }
      } catch (e) {
        falhas++;
        log(`  balanço ${b.id} (${b.nome}) FALHOU: ${e.message}`);
      }
    }
    salvar();
  }

  salvar();
  log(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s · ${baixados} balanços novos · ${falhas} falhas`);
  process.stdout.write(resumo() + "\n");
  await ctx.close().catch(() => {});
  process.exit(falhas > 0 && baixados === 0 ? 1 : 0);
} catch (e) {
  log(`FALHA: ${e.message}`);
  salvar();
  await ctx.close().catch(() => {});
  process.exit(1);
}
