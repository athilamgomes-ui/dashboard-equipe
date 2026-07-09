#!/usr/bin/env node
/*
 * DETECTOR RÁPIDO DE ENTRADA DE NFe (09/07/2026 — "o colaborador termina de lançar e precisa
 * precificar NA HORA"). Roda a cada 2 min via launchd (com.amgomes.precificacaofast).
 *
 * O que faz (leve, ~15-25s): abre sessão, consulta a lista de NFes das 4 empresas (só API, sem
 * relatórios), e compara o status "lançada" de cada NF com o rastreador (chaves "T|" do
 * precificacao_lancadas.json — o MESMO estado do coletor). Se detectar NF de marca mapeada que
 * virou LANÇADA agora (era pendente), carimba a 1ª aparição no estado e dispara NA SEQUÊNCIA:
 *   1) coleta expressa:  PUSH=1 SKIP_PRECO=1 coleta_precificacao.mjs  (~60-90s — publica a NF na
 *      tela SÓ com preço sugerido; a preservação mantém os preços atuais já conhecidos das outras)
 *   2) coleta completa:  PUSH=1 coleta_precificacao.mjs               (preenche o preço atual do ERP)
 *
 * Locks: usa o MESMO /tmp/precificacao_update.lock.d do coletor — se o cron de 15 min estiver
 * rodando, pula o ciclo (o cron já vai captar a transição de qualquer forma).
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const REPO = "/Users/elkgomes/Desktop/claude/dashboard-equipe";
const STATE_FILE = REPO + "/precificacao_lancadas.json";
const LOCKDIR = "/tmp/precificacao_update.lock.d";
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const FORN_MARCAS = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/compras/fornecedor_marcas.json", "utf8"));
const MARCAS_NAO_REVENDA = new Set(["SOLIDER", "MULTIBAG"]);
const EXCL_NAT = /(AMOSTRA|REMESSA EM CONSIGNA|BONIFIC|DEVOLU|RETORNO|TRANSFER)/i;
const norm = s => String(s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const log = m => process.stderr.write(`[detecta] ${new Date().toISOString().slice(11, 19)} ${m}\n`);

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

// lock: se o coletor (cron/watcher) está rodando, pula — ele mesmo capta a transição
try { if (Date.now() - statSync(LOCKDIR).mtimeMs > 30 * 60000) rmSync(LOCKDIR, { recursive: true, force: true }); } catch {}
try { mkdirSync(LOCKDIR); } catch { log("coletor em execução — pulando ciclo"); process.exit(0); }

let novas = [];
try {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  try {
    await garantirSessao(page, { log: () => {} });
    await page.goto(URL_NFE, { waitUntil: "domcontentloaded", timeout: 45000 });
    let token = null;
    for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
    if (!token) throw new Error("token indisponível");
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
            body: JSON.stringify({ IdEmpresa: E, DataInicial: iso(d90), DataFinal: iso(now), Status: "Todos" }),
          });
          res[String(E)] = JSON.parse(await r.text());
        } catch (e) { res[String(E)] = { NFes: [] }; }
      }
      return res;
    }, EMPRESAS);

    let state = {};
    try {
      const rawSt = JSON.parse(readFileSync(STATE_FILE, "utf8"));
      for (const [k, v] of Object.entries(rawSt)) state[k] = typeof v === "string" ? { desde: v, aplicadoDesde: null } : v;
    } catch {}
    const todayISO = new Date().toISOString().slice(0, 10);
    let dirty = false;
    for (const E of EMPRESAS) {
      const loja = EMP_TO_LOJA[E];
      for (const nfe of ((raw[String(E)] && raw[String(E)].NFes) || [])) {
        if (EXCL_NAT.test(nfe.NaturezaOperacao || "")) continue;
        const mk = fornBrand(nfe.DadosEmitente || {});
        if (!mk || MARCAS_NAO_REVENDA.has(norm(mk))) continue;
        const ch = String(nfe.Chave || (loja + "-" + nfe.Numero));
        const tk = "T|" + ch;
        const lancNow = !!nfe.LancadaNoMicrovix;
        const prev = state[tk];
        const transicao = lancNow && prev && prev.l === false;
        if (!prev || prev.l !== lancNow) { state[tk] = { l: lancNow, ts: todayISO }; dirty = true; }
        if (transicao && !state[ch]) {
          state[ch] = { desde: todayISO, aplicadoDesde: null }; dirty = true;
          novas.push(`${loja} NF ${nfe.Numero} (${mk})`);
        }
      }
    }
    if (dirty) writeFileSync(STATE_FILE, JSON.stringify(state, null, 0));
  } finally { await ctx.close().catch(() => {}); }
} catch (e) {
  log("falha na checagem: " + String(e.message || e).split("\n")[0]);
} finally {
  try { rmSync(LOCKDIR, { recursive: true, force: true }); } catch {}
}

if (novas.length) {
  log(`⚡ ENTRADA AGORA: ${novas.join(" · ")} — coleta expressa + completa`);
  try { execSync("PUSH=1 SKIP_PRECO=1 /opt/homebrew/bin/node coleta_precificacao.mjs", { cwd: REPO + "/scripts", stdio: "pipe" }); log("expressa publicada (NF na tela, preço sugerido)"); }
  catch (e) { log("expressa falhou: " + String(e.message || e).split("\n")[0]); }
  try { execSync("PUSH=1 /opt/homebrew/bin/node coleta_precificacao.mjs", { cwd: REPO + "/scripts", stdio: "pipe" }); log("completa publicada (preço atual do ERP preenchido)"); }
  catch (e) { log("completa falhou: " + String(e.message || e).split("\n")[0]); }
} else {
  log("nenhuma entrada nova");
}
