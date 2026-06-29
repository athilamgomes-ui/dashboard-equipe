#!/usr/bin/env node
// read-only: lista TODAS as opções de coluna (listar*/f_*) do relatorio_produtos + checa classificacao_fiscal.asp
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[p7] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_produtos.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1200);
  const cols = await page.evaluate(() => {
    // todos os checkboxes de coluna: pega o <label> associado ou texto vizinho
    const all = [...document.querySelectorAll("input[type=checkbox]")].filter(c => /^listar|^f_/.test(c.id) || /^f_/.test(c.name));
    return all.map(c => {
      let lbl = "";
      if (c.id) { const l = document.querySelector(`label[for="${c.id}"]`); if (l) lbl = l.textContent.trim(); }
      if (!lbl) { let n = c.nextSibling; while (n && !lbl) { if (n.textContent) lbl = n.textContent.trim(); n = n.nextSibling; } }
      if (!lbl) { const p = c.parentElement; if (p) lbl = (p.textContent || "").trim().slice(0, 40); }
      return { id: c.id, name: c.name, label: lbl.replace(/\s+/g, " ").slice(0, 40) };
    });
  });
  log("colunas:");
  cols.forEach(c => log(`  ${c.id||c.name} = "${c.label}"`));
  // checa telas de classificação fiscal / NCM
  for (const u of [
    "https://linx.microvix.com.br/gestor_web/produtos/classificacao_fiscal.asp",
    "https://linx.microvix.com.br/gestor_web/produtos/relatorio_classificacao_fiscal.asp",
    "https://linx.microvix.com.br/gestor_web/produtos/cadastro_classificacao_fiscal.asp",
  ]) {
    try { const r = await page.goto(u, { waitUntil: "domcontentloaded", timeout: 20000 }); const t = await page.title().catch(()=>''); log(`${u.split('/produtos/')[1]} -> ${r?r.status():'?'} "${t.slice(0,40)}"`); } catch (e) { log(`${u.split('/produtos/')[1]} ERRO`); }
  }
  process.stdout.write(JSON.stringify({ cols }, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
