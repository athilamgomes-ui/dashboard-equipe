#!/usr/bin/env node
// read-only: inspeciona o form do relatorio_produtos.asp (campos, colunas, opcoes de NCM/classif fiscal)
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[p6] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_produtos.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  const form = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll("input,select,textarea")].map(el => {
      const o = { tag: el.tagName, type: el.type || "", name: el.name || "", id: el.id || "" };
      if (el.tagName === "SELECT") o.options = [...el.options].slice(0, 25).map(op => `${op.value}=${(op.text || "").trim().slice(0, 30)}`);
      const lbl = el.closest("td,div,li,label");
      if (lbl) o.ctx = (lbl.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50);
      return o;
    });
    // procura qualquer texto "checkbox de colunas" tipo exibir NCM, classificacao
    const colChecks = [...document.querySelectorAll("input[type=checkbox]")].map(c => ({ name: c.name, id: c.id, ctx: (c.closest("td,div,label,li")?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 45) })).filter(c => c.ctx);
    return { nInputs: inputs.length, inputs: inputs.filter(i => i.type !== "hidden"), colChecks };
  });
  process.stdout.write(JSON.stringify(form, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
