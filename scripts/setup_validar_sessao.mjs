#!/usr/bin/env node
/**
 * setup_validar_sessao.mjs
 *
 * Substitui o antigo setup_microvix_login.mjs (interativo). Faz login
 * AUTOMÁTICO no perfil dedicado do Playwright usando as credenciais
 * gravadas no Keychain (via setup_credenciais.mjs). Valida que o token
 * api_token_lma foi gerado.
 *
 * Uso:
 *   node scripts/setup_validar_sessao.mjs
 *
 * Exit codes:
 *   0  perfil pronto, token OK
 *   1  erro genérico
 *   2  credenciais ausentes (rodar setup_credenciais.mjs) ou login falhou
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");

function log(msg) { process.stderr.write(`[setup_validar_sessao] ${msg}\n`); }

(async () => {
  console.log(`=== Validação de sessão Microvix ===`);
  console.log(`Profile: ${PROFILE_DIR}\n`);

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
  let exitCode = 0;
  try {
    const page = ctx.pages()[0] || (await ctx.newPage());
    const token = await garantirSessao(page, { log });
    console.log(`OK — sessão válida, api_token_lma com ${token.length} chars.`);
    console.log(`Cron pode rodar headless agora: node scripts/cron_etapa1_vendas.mjs '<semanas_json>'`);
  } catch (e) {
    console.error(`FALHA: ${e.message}`);
    if (e.code === "NO_CREDS") {
      console.error(`→ rode: node scripts/setup_credenciais.mjs`);
      exitCode = 2;
    } else if (e.code === "LOGIN_FAIL") {
      console.error(`→ senha provavelmente mudou. Rode: node scripts/setup_credenciais.mjs`);
      exitCode = 2;
    } else {
      exitCode = 1;
    }
  } finally {
    await ctx.close().catch(() => {});
    process.exit(exitCode);
  }
})();
