#!/usr/bin/env node
// read-only: extrai a função obterRelatorioProdutos / URLs de AJAX do relatorio_manut.asp
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[man6] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  const r = await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp", { waitUntil: "domcontentloaded", timeout: 40000 });
  const html = await page.content();
  writeFileSync("/tmp/relatorio_manut.html", html);
  log(`html len=${html.length}`);
  // todas as URLs .asp referenciadas
  const asps = [...new Set([...html.matchAll(/['"(]([\w./?=&%-]*\.asp[\w./?=&%-]*)['")]/gi)].map(m=>m[1]))].filter(u=>!/relatorio_manut\.asp$/.test(u));
  log("URLs .asp referenciadas:");
  asps.forEach(u=>log("  "+u.slice(0,120)));
  // recorta a função obterRelatorioProdutos
  const fi = html.indexOf("function obterRelatorioProdutos");
  if (fi>=0) {
    const chunk = html.slice(fi, fi+1800);
    log("\n--- obterRelatorioProdutos (1800c) ---\n"+chunk);
  } else log("função obterRelatorioProdutos não achada por nome");
  // procura padrões de ajax/post/url:
  const ajaxUrls = [...new Set([...html.matchAll(/(?:url|action|ajax)\s*[:=]\s*['"]([^'"]+)['"]/gi)].map(m=>m[1]))].filter(u=>/\.asp|api/i.test(u));
  log("\npossíveis url de ajax:"); ajaxUrls.forEach(u=>log("  "+u.slice(0,120)));
  process.stdout.write(JSON.stringify({asps, ajaxUrls}, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
