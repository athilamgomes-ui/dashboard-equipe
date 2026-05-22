#!/usr/bin/env node
/**
 * cron_etapa1_vendas.mjs
 *
 * Etapa 1 do cron `dashboard-premiacao-update` — busca vendas por vendedora
 * no Microvix usando Playwright headless, sem dependência de Chrome MCP.
 *
 * Faz auto-login se a sessão expirou (credenciais lidas do Keychain via
 * microvix_auth.mjs / setup_credenciais.mjs).
 *
 * USO:
 *   node cron_etapa1_vendas.mjs '[{"id":"S1","di":"01/05/2026","df":"09/05/2026"},...]'
 *
 * STDOUT: JSON puro com { L1:{S1:{nome:R$,...},...}, L3, L4, L5 }
 * STDERR: logs de progresso (não interfere no parse do stdout)
 *
 * EXIT CODES:
 *   0  sucesso
 *   1  falha genérica (ver stderr)
 *   2  credenciais inválidas/ausentes → rodar setup_credenciais.mjs
 *   3  argumento inválido
 */
import { chromium } from "playwright";
import { homedir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { garantirSessao } from "./microvix_auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const FETCH_SCRIPT = join(__dirname, "fetch_vendas_microvix.js");

function err(msg) { process.stderr.write(`[cron_etapa1] ${msg}\n`); }

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    err("uso: cron_etapa1_vendas.mjs '<semanas_json>'");
    process.exit(3);
  }
  let semanas;
  try {
    semanas = JSON.parse(arg);
    if (!Array.isArray(semanas) || !semanas.length) throw new Error("semanas vazio");
    for (const s of semanas) {
      if (!s.id || !s.di || !s.df) throw new Error(`semana inválida: ${JSON.stringify(s)}`);
    }
  } catch (e) {
    err(`semanas_json inválido: ${e.message}`);
    process.exit(3);
  }

  const t0 = Date.now();
  err(`launch headless (profile=${PROFILE_DIR})...`);

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: ["--disable-blink-features=AutomationControlled"],
  });

  let exitCode = 0;
  try {
    const page = ctx.pages()[0] || (await ctx.newPage());

    let token;
    try {
      token = await garantirSessao(page, { log: err });
    } catch (e) {
      err(`falha ao garantir sessão: ${e.message} (code=${e.code || "?"})`);
      if (e.code === "NO_CREDS" || e.code === "LOGIN_FAIL") {
        err(`→ rodar: node scripts/setup_credenciais.mjs`);
        exitCode = 2;
      } else {
        exitCode = 1;
      }
      return;
    }

    err(`injetando fetch_vendas_microvix.js...`);
    await page.addScriptTag({ path: FETCH_SCRIPT });

    err(`executando fetchVendasMicrovix com ${semanas.length} semanas...`);
    const tFetch = Date.now();
    const result = await page.evaluate(async (sem) => {
      try {
        const out = await window.fetchVendasMicrovix(sem);
        return { ok: true, data: out };
      } catch (e) {
        return { ok: false, error: String(e && e.message || e) };
      }
    }, semanas);

    if (!result.ok) {
      err(`fetchVendasMicrovix falhou: ${result.error}`);
      if (/TOKEN_EXPIRED|token api_token_lma/i.test(result.error)) {
        // Tenta um retry: re-garantir sessão (pode ter expirado entre garantir e fetch)
        err(`tentando re-login e retry...`);
        try {
          await garantirSessao(page, { log: err });
          await page.addScriptTag({ path: FETCH_SCRIPT });
          const result2 = await page.evaluate(async (sem) => {
            try { return { ok: true, data: await window.fetchVendasMicrovix(sem) }; }
            catch (e) { return { ok: false, error: String(e && e.message || e) }; }
          }, semanas);
          if (result2.ok) {
            err(`retry OK em ${((Date.now() - tFetch) / 1000).toFixed(1)}s`);
            process.stdout.write(JSON.stringify(result2.data));
            return;
          }
          err(`retry também falhou: ${result2.error}`);
        } catch (e2) {
          err(`re-login falhou: ${e2.message}`);
          if (e2.code === "LOGIN_FAIL" || e2.code === "NO_CREDS") { exitCode = 2; return; }
        }
        exitCode = 2;
      } else {
        exitCode = 1;
      }
      return;
    }

    err(`fetch OK em ${((Date.now() - tFetch) / 1000).toFixed(1)}s. Tempo total: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    process.stdout.write(JSON.stringify(result.data));
  } catch (e) {
    err(`erro inesperado: ${e.message}`);
    exitCode = 1;
  } finally {
    await ctx.close().catch(() => {});
    process.exit(exitCode);
  }
}

main();
