#!/usr/bin/env node
// read-only: inspeciona relatorio_manut.asp — campos default + roda p/ 1 marca e mostra colunas de saída
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[man3] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1500, height: 950 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  const form = await page.evaluate(() => {
    const checks = [...document.querySelectorAll("input[type=checkbox]")].map(c => {
      let lbl=""; if(c.id){const l=document.querySelector(`label[for="${c.id}"]`); if(l)lbl=l.textContent.trim();}
      if(!lbl){const p=c.closest("td,label,div,li"); if(p)lbl=(p.textContent||"").trim().slice(0,45);}
      return { id:c.id, name:c.name, checked:c.checked, lbl:lbl.replace(/\s+/g,' ').slice(0,45) };
    });
    const radios = [...document.querySelectorAll("input[type=radio]:checked")].map(r=>({name:r.name,val:r.value}));
    const selects = [...document.querySelectorAll("select")].map(s=>({ id:s.id, name:s.name, nOpts:s.options.length }));
    const title = document.title;
    return { title, nChecks: checks.length, checks, radios, selects };
  });
  log(`title="${form.title}" checks=${form.nChecks}`);
  log("CHECKBOXES (marcados por padrão = [x]):");
  form.checks.forEach(c => log(`  [${c.checked?'x':' '}] ${c.id||c.name} = "${c.lbl}"`));
  log("selects: " + JSON.stringify(form.selects));
  writeFileSync("/tmp/manut3_form.json", JSON.stringify(form, null, 1));
  process.stdout.write(JSON.stringify(form, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
