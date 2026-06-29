#!/usr/bin/env node
// read-only: extrair URL do item de menu "Manutenção" (Suprimentos>Estoque>Relatorios) e abrir capturando rede
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[man2] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
const navs = [];
page.on("request", r => { const u = r.url(); if (/\.asp/i.test(u) && /microvix/.test(u) && !/home\/index/.test(u)) navs.push(u.slice(0,160)); });
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/v4/home/index.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  const raw = await page.content();
  // pega cada ocorrência de "Manuten" e mostra 200 chars ao redor pra ver url/onclick/data
  const idxs = []; let i = -1;
  while ((i = raw.indexOf("Manuten", i + 1)) !== -1 && idxs.length < 12) idxs.push(i);
  log(`ocorrências "Manuten": ${idxs.length}`);
  idxs.forEach(ix => {
    const ctxs = raw.slice(Math.max(0, ix - 160), ix + 60).replace(/\s+/g, " ");
    log("  …" + ctxs + "…");
  });
  // procura por estrutura de menu JS com url + label manutenção (relatorio de produtos)
  const urlNear = [...raw.matchAll(/(\w[\w\/_.-]*\.asp[^"'<>\s]*)["'][^"'<>]{0,80}Manuten/gi)].map(m=>m[1]);
  const urlNear2 = [...raw.matchAll(/Manuten[^"'<>]{0,80}["']([\w\/_.-]*\.asp[^"'<>\s]*)/gi)].map(m=>m[1]);
  log("urls perto de Manuten (antes): " + JSON.stringify([...new Set(urlNear)]));
  log("urls perto de Manuten (depois): " + JSON.stringify([...new Set(urlNear2)]));
  writeFileSync("/tmp/manut2_raw.html", raw);
  process.stdout.write(JSON.stringify({ urlNear:[...new Set(urlNear)], urlNear2:[...new Set(urlNear2)] }, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
