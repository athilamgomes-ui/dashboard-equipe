#!/usr/bin/env node
// read-only: localizar o relatório "Manutenção" (Suprimentos>Estoque>Relatorios>Manutenção) e inspecionar campos
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[man] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  // 1) acha link "Manutenção" no menu v4
  await page.goto("https://linx.microvix.com.br/v4/home/index.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1200);
  const raw = await page.content();
  const cand = [...raw.matchAll(/["'(]([^"'()]*manuten[^"'()]*\.asp[^"'()]*)["')]/gi)].map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i);
  log(`URLs c/ "manuten": ${cand.length}`);
  cand.forEach(u => log("  " + u.slice(0, 130)));
  // links de texto contendo Manutenção
  const txtLinks = await page.evaluate(() => [...document.querySelectorAll("a")].filter(a => /manuten/i.test(a.textContent||"")).map(a => ({ t: (a.textContent||"").trim().slice(0,40), h: (a.getAttribute("href")||a.getAttribute("onclick")||"").slice(0,140) })));
  log(`links texto Manutenção: ${txtLinks.length}`);
  txtLinks.forEach(l => log(`  "${l.t}" -> ${l.h}`));

  // 2) tenta abrir candidatos diretos e inspecionar o form
  const tryUrls = cand.map(u => u.startsWith("http") ? u : ("https://linx.microvix.com.br/gestor_web/" + u.replace(/^\//, "")));
  tryUrls.push("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manutencao.asp");
  tryUrls.push("https://linx.microvix.com.br/gestor_web/produtos/manutencao_produtos.asp");
  let found = null;
  for (const u of [...new Set(tryUrls)]) {
    try {
      const r = await page.goto(u, { waitUntil: "domcontentloaded", timeout: 25000 });
      const title = await page.title().catch(()=>'');
      if (r && r.status() === 200 && !/404/.test(title)) {
        await page.waitForTimeout(1500);
        const info = await page.evaluate(() => {
          const checks = [...document.querySelectorAll("input[type=checkbox]")].map(c => {
            let lbl=""; if (c.id){const l=document.querySelector(`label[for="${c.id}"]`); if(l)lbl=l.textContent.trim();}
            if(!lbl){const p=c.closest("td,label,div,li"); if(p)lbl=(p.textContent||"").trim().slice(0,40);}
            return { id:c.id, name:c.name, checked:c.checked, lbl:lbl.replace(/\s+/g,' ').slice(0,40) };
          });
          const trib = checks.filter(c => /ncm|cest|tribut|icms|cst|csosn|fiscal|origem|fcp|aliquot|class/i.test(c.lbl+c.name+c.id));
          return { title: document.title, nChecks: checks.length, trib };
        });
        log(`OK ${u.split('/').pop()} title="${info.title.slice(0,40)}" nChecks=${info.nChecks} tribCols=${info.trib.length}`);
        if (info.trib.length) { info.trib.forEach(c => log(`    [${c.checked?'x':' '}] ${c.id||c.name} = "${c.lbl}"`)); found = { url:u, info }; }
        if (found) break;
      }
    } catch (e) {}
  }
  writeFileSync("/tmp/manut.json", JSON.stringify({ cand, txtLinks, found }, null, 1));
  process.stdout.write(JSON.stringify({ cand, txtLinks, found }, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
