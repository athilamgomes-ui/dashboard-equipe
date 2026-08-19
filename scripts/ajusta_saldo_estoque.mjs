#!/usr/bin/env node
/**
 * ajusta_saldo_estoque.mjs — executa ajustes de saldo AUTORIZADOS no Microvix.
 *
 * ⚠️ ESCREVE EM PRODUÇÃO. Só roda a partir de um plano explícito em
 *    dados_estoque/plano_ajuste.json = [{loja, cod, desc, novo_saldo, motivo, grupo}]
 *
 * Garantias:
 *  - uma LOJA por vez; troca a empresa no topbar E confirma lendo hdn_bloqueio_loja_logada
 *    da própria tela de ajuste antes da primeira escrita da loja;
 *  - lê o saldo ATUAL da tela (nunca confia em snapshot) e o grava como saldo_anterior;
 *  - confere o resultado com um GET depois de cada POST;
 *  - grava o log APPEND-ONLY em dados_estoque/ajustes_saldo.json a CADA item (à prova de queda),
 *    NUNCA no scratchpad.
 *
 * Uso:
 *   node ajusta_saldo_estoque.mjs --dry-run            → só lê saldos e mostra o que faria
 *   node ajusta_saldo_estoque.mjs --loja L1            → executa a L1
 *   node ajusta_saldo_estoque.mjs --loja L1 --grupo negativos
 * Exit: 0 ok · 1 falha · 2 creds/login
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D_DIR = path.join(DIR, "..", "dados_estoque");
const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");
const URL_HOME = "https://linx.microvix.com.br/v4/home/index.asp";
const URL_AJUSTE = "https://linx.microvix.com.br/gestor_web/produtos/ajuste_qtde.asp";
const URL_CONFIRMA = "https://linx.microvix.com.br/gestor_web/produtos/confirma_ajuste_qtde.asp";
const CLIENTE_LOGADO = "11129";

const LOJA_TO_EMP = { L1: 1, L3: 3, L4: 4, L5: 10 };
const arg = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const DRY = process.argv.includes("--dry-run");
const LOJA = arg("--loja");
const GRUPO = arg("--grupo");
const log = m => process.stderr.write(`[ajuste] ${m}\n`);

const P_PLANO = path.join(D_DIR, "plano_ajuste.json");
const P_LOG = path.join(D_DIR, "ajustes_saldo.json");
if (!fs.existsSync(P_PLANO)) { log("plano_ajuste.json não existe — nada a fazer"); process.exit(1); }
let plano = JSON.parse(fs.readFileSync(P_PLANO, "utf8"));
if (LOJA) plano = plano.filter(p => p.loja === LOJA);
if (GRUPO) plano = plano.filter(p => p.grupo === GRUPO);
if (!plano.length) { log("plano vazio depois dos filtros"); process.exit(1); }
const lojas = [...new Set(plano.map(p => p.loja))];
if (!DRY && lojas.length > 1) { log(`ERRO: ${lojas.length} lojas no plano — rode UMA loja por vez com --loja`); process.exit(1); }

// log append-only (histórico de TODAS as execuções, nunca sobrescrito)
const registro = fs.existsSync(P_LOG) ? JSON.parse(fs.readFileSync(P_LOG, "utf8")) : { ajustes: [] };
registro.ajustes = registro.ajustes || [];
const gravarLog = () => fs.writeFileSync(P_LOG, JSON.stringify(registro, null, 1));

const numBR = s => { const v = parseFloat(String(s ?? "").replace(/\./g, "").replace(",", ".")); return isNaN(v) ? null : v; };

async function trocarEmpresa(page, E, codTeste) {
  // ⚠️ trigger('change') RECARREGA a home; confirmar a troca só pela própria tela de ajuste,
  // numa navegação separada, e insistir — 4,5s fixos não bastam (a L4 abortou assim em 19/08).
  for (let tent = 1; tent <= 4; tent++) {
    await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1200);
    const ok = await page.evaluate(E => {
      const s = document.getElementById("topbar_sel_empresa_portal_usuario");
      if (!s || !window.jQuery) return false;
      window.jQuery(s).val(String(E)); window.jQuery(s).trigger("change");
      return true;
    }, E).catch(() => false);
    if (!ok) throw new Error("select de empresa não encontrado");
    await page.waitForTimeout(5000);
    const t = await lerAjuste(page, codTeste);
    if (String(t.empresa) === String(E)) return t;
    log(`  troca p/ empresa ${E} não pegou (ERP diz ${t.empresa}) — tentativa ${tent}/4`);
    await page.waitForTimeout(3000);
  }
  return { empresa: null };
}

/** Lê a tela de ajuste: saldo atual + a empresa que o ERP considera logada. */
async function lerAjuste(page, cod) {
  await page.goto(`${URL_AJUSTE}?produto=${encodeURIComponent(cod)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  // ⚠️ page.evaluate / waitForSelector caem num contexto onde o form não existe; os campos só
  // aparecem varrendo page.frames(), e só ~2s depois do domcontentloaded. Diagnosticado em
  // 19/08/2026 — sem esta espera + varredura, a leitura volta null e o script aborta.
  for (let tent = 0; tent < 12; tent++) {
    await page.waitForTimeout(700);
    for (const f of page.frames()) {
      const r = await f.evaluate(() => {
        const g = n => { const e = document.querySelector(`[name=${n}]`); return e ? e.value : null; };
        if (!document.querySelector("[name=novo_saldo]")) return null;
        return {
          novo_saldo: g("novo_saldo"), velho_saldo: g("velho_saldo"),
          empresa: g("hdn_bloqueio_loja_logada"), cliente: g("hdn_bloqueio_empresa_cliente_logado"),
          deposito: g("deposito"), nome: g("nome_produto"),
        };
      }).catch(() => null);
      if (r) return r;
    }
  }
  return { novo_saldo: null, empresa: null };
}

async function _naoUsado(page) {
  for (const f of page.frames()) {
    const r = await f.evaluate(() => {
      const g = n => { const e = document.querySelector(`[name=${n}]`); return e ? e.value : null; };
      if (!document.querySelector("[name=novo_saldo]")) return null;
      return {
        novo_saldo: g("novo_saldo"), velho_saldo: g("velho_saldo"),
        empresa: g("hdn_bloqueio_loja_logada"), cliente: g("hdn_bloqueio_empresa_cliente_logado"),
        deposito: g("deposito"), nome: g("nome_produto"),
      };
    }).catch(() => null);
    if (r) return r;
  }
  return { novo_saldo: null, empresa: null };
}

async function escrever(ctx, page, item, atual, emp) {
  const body = new URLSearchParams({
    produto: String(item.cod),
    nome_produto: String(item.desc || "ajuste"),
    controla_localizacao_wms: "N",
    deposito: "1",
    velho_saldo: String(Math.trunc(atual)),
    novo_saldo: String(item.novo_saldo),
    motivo_ajuste: item.motivo,
    hdn_bloqueio_empresa_cliente_logado: CLIENTE_LOGADO,
    hdn_bloqueio_loja_logada: String(emp),
  });
  const r = await ctx.request.post(URL_CONFIRMA, {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: body.toString(), timeout: 45000,
  });
  return r.status();
}

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`garantirSessao falhou: ${e.message}`); await ctx.close().catch(() => {}); process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1); }

let ok = 0, erro = 0, pulado = 0;
try {
  for (const lj of lojas) {
    const emp = LOJA_TO_EMP[lj];
    const itens = plano.filter(p => p.loja === lj);
    log(`── ${lj} (empresa ${emp}) · ${itens.length} produtos${DRY ? " · DRY-RUN" : ""}`);
    // trava de segurança: o ERP tem que concordar sobre em qual empresa estamos
    const teste = await trocarEmpresa(page, emp, itens[0].cod);
    if (String(teste.empresa) !== String(emp)) {
      log(`ABORTADO: a tela de ajuste diz empresa=${teste.empresa}, esperado ${emp}. Nenhuma escrita feita.`);
      process.exitCode = 1; break;
    }
    log(`empresa confirmada pelo ERP (hdn_bloqueio_loja_logada=${teste.empresa})`);

    for (const item of itens) {
      const t0 = Date.now();
      let atual = null;
      try {
        const tela = await lerAjuste(page, item.cod);
        atual = numBR(tela.novo_saldo);
        if (atual == null) { log(`  ${item.cod}: saldo não lido — PULADO`); pulado++; continue; }
        if (tela.empresa != null && String(tela.empresa) !== String(emp)) { log(`  ${item.cod}: ERP mudou de empresa (${tela.empresa}) — PULADO`); pulado++; continue; }
        if (atual === Number(item.novo_saldo)) { log(`  ${item.cod}: já está em ${atual} — PULADO`); pulado++; continue; }
        if (DRY) { log(`  [dry] ${lj} ${item.cod} ${String(item.desc).slice(0, 28)}: ${atual} → ${item.novo_saldo}`); ok++; continue; }

        const status = await escrever(ctx, page, item, atual, emp);
        const conf = await lerAjuste(page, item.cod);
        const depois = numBR(conf.novo_saldo);
        const bateu = depois === Number(item.novo_saldo);
        registro.ajustes.push({
          quando: new Date().toISOString(), loja: lj, empresa: emp, cod: String(item.cod), desc: item.desc,
          grupo: item.grupo || null, saldo_anterior: atual, saldo_alvo: Number(item.novo_saldo),
          saldo_confirmado: depois, ok: bateu, http: status, motivo: item.motivo, ms: Date.now() - t0,
        });
        gravarLog();
        if (bateu) { ok++; if (ok % 10 === 0) log(`  ...${ok} ajustados`); }
        else { erro++; log(`  ${item.cod}: esperado ${item.novo_saldo}, ERP ficou ${depois} (http ${status})`); }
      } catch (e) {
        erro++;
        registro.ajustes.push({ quando: new Date().toISOString(), loja: lj, cod: String(item.cod), desc: item.desc,
          grupo: item.grupo || null, saldo_anterior: atual, saldo_alvo: Number(item.novo_saldo), ok: false, falha: String(e.message).slice(0, 160) });
        gravarLog();
        log(`  ${item.cod} FALHOU: ${e.message.split("\n")[0]}`);
        if (/browser has been closed|Target closed/i.test(e.message)) throw e;
      }
    }
  }
  gravarLog();
  log(`FIM · ${ok} ${DRY ? "seriam ajustados" : "ajustados"} · ${pulado} pulados · ${erro} erros · log em ${P_LOG}`);
  await ctx.close().catch(() => {});
  process.exit(erro ? 1 : 0);
} catch (e) {
  gravarLog();
  log(`FALHA: ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(1);
}
