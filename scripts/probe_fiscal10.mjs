#!/usr/bin/env node
// read-only: achar a rota/endpoint da tela NOVA de cadastro de produto (v4) que traz NCM+ConfigTributaria
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[p10] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/v4/home/index.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  // varre o HTML do menu por links/rotas que mencionem cadastro de produto
  const links = await page.evaluate(() => {
    const out = [];
    for (const a of document.querySelectorAll("a,[href],[data-url],[onclick]")) {
      const h = a.getAttribute("href") || a.getAttribute("data-url") || a.getAttribute("onclick") || "";
      const txt = (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      if (/produto/i.test(txt + h) && /cadastr|produto/i.test(txt + h)) out.push({ txt, h: h.slice(0, 140) });
    }
    return out.slice(0, 40);
  });
  log(`links produto/cadastro no menu: ${links.length}`);
  links.forEach(l => log(`  "${l.txt}" -> ${l.h}`));
  // também procura no fonte bruto por padrões de URL de cadastro de produto
  const raw = await page.content();
  const urlPat = [...raw.matchAll(/["'(]([^"'()]*(?:cadastro[^"'()]*produto|produto[^"'()]*cadastro|suprimentos[^"'()]*produto)[^"'()]*)["')]/gi)].map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 40);
  log(`padrões de URL no fonte:`);
  urlPat.forEach(u => log(`  ${u.slice(0, 130)}`));
  writeFileSync("/tmp/fiscal10.json", JSON.stringify({ links, urlPat }, null, 1));
  process.stdout.write(JSON.stringify({ links, urlPat }, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
