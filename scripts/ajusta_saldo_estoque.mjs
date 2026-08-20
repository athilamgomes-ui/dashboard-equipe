#!/usr/bin/env node
/**
 * ajusta_saldo_estoque.mjs — executa ajustes de saldo AUTORIZADOS a partir de um arquivo de plano.
 *
 * ⚠️ ESCREVE EM PRODUÇÃO. Só roda a partir de `dados_estoque/plano_ajuste.json`
 *    = [{loja, cod, desc, novo_saldo, motivo, grupo}]
 *
 * A escrita de verdade mora em `estoque_ajuste_core.mjs`, compartilhada com
 * `aplica_contagem_estoque.mjs` (a via do painel) — as travas de empresa e de leitura do form
 * são as mesmas nos dois caminhos, e o log append-only é o mesmo arquivo.
 *
 * Uso:
 *   node ajusta_saldo_estoque.mjs --dry-run
 *   node ajusta_saldo_estoque.mjs --loja L1 [--grupo negativos]
 * Exit: 0 ok · 1 falha · 2 creds/login
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { aplicarLoja, D_DIR, P_LOG } from "./estoque_ajuste_core.mjs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");
const arg = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const DRY = process.argv.includes("--dry-run");
const LOJA = arg("--loja"), GRUPO = arg("--grupo");
const log = m => process.stderr.write(`[ajuste] ${m}\n`);

const P_PLANO = path.join(D_DIR, "plano_ajuste.json");
if (!fs.existsSync(P_PLANO)) { log("plano_ajuste.json não existe — nada a fazer"); process.exit(1); }
let plano = JSON.parse(fs.readFileSync(P_PLANO, "utf8"));
if (LOJA) plano = plano.filter(p => p.loja === LOJA);
if (GRUPO) plano = plano.filter(p => p.grupo === GRUPO);
if (!plano.length) { log("plano vazio depois dos filtros"); process.exit(1); }
const lojas = [...new Set(plano.map(p => p.loja))];
if (!DRY && lojas.length > 1) { log(`ERRO: ${lojas.length} lojas no plano — rode UMA loja por vez com --loja`); process.exit(1); }

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`garantirSessao falhou: ${e.message}`); await ctx.close().catch(() => {}); process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1); }

let ok = 0, erro = 0, pulado = 0;
try {
  for (const lj of lojas) {
    const r = await aplicarLoja(ctx, page, lj, plano.filter(p => p.loja === lj), { dry: DRY, log });
    ok += r.ok; erro += r.erro; pulado += r.pulado;
  }
  log(`FIM · ${ok} ${DRY ? "seriam ajustados" : "ajustados"} · ${pulado} pulados · ${erro} erros · log em ${P_LOG}`);
  await ctx.close().catch(() => {});
  process.exit(erro ? 1 : 0);
} catch (e) {
  log(`FALHA: ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(1);
}
