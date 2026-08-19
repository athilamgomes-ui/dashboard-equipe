#!/usr/bin/env node
/**
 * _probe_prodvend.mjs — inspeção do formulário relatorio_prod_vendidos.asp.
 * Descobre: selects (name + options), radios/checkboxes de agrupamento/sintetico,
 * botões, e (após gerar 1 vez, visão padrão analítica agrupada por marca) o
 * cabeçalho das colunas da tabela — pra saber onde estão faturamento e custo.
 * NÃO altera nada. Descartável.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";
const log = m => process.stderr.write(`[probe] ${m}\n`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log, tokenOpcional: true });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#f_data1", { timeout: 15000 });
  await page.waitForTimeout(1500);

  const form = await page.evaluate(() => {
    const out = { selects: [], radios: [], checkboxesGroups: {}, buttons: [], textInputsWithF: [] };
    for (const s of document.querySelectorAll("select")) {
      out.selects.push({
        name: s.name || s.id,
        id: s.id,
        options: [...s.options].slice(0, 40).map(o => ({ v: o.value, t: (o.textContent || "").trim().slice(0, 40) })),
      });
    }
    for (const r of document.querySelectorAll("input[type=radio]")) {
      out.radios.push({ name: r.name, value: r.value, checked: r.checked, id: r.id });
    }
    for (const c of document.querySelectorAll("input[type=checkbox]")) {
      const k = c.name || "(sem-name)";
      out.checkboxesGroups[k] = (out.checkboxesGroups[k] || 0) + 1;
    }
    for (const b of document.querySelectorAll("button, input[type=button], input[type=submit]")) {
      out.buttons.push({ tag: b.tagName, name: b.name || "", value: b.value || "", text: (b.textContent || "").trim().slice(0, 30) });
    }
    for (const i of document.querySelectorAll("input[type=text], input[type=hidden]")) {
      if (/f_|agrup|sintetic|visao|saldo/i.test(i.name || i.id)) out.textInputsWithF.push({ name: i.name, id: i.id, value: (i.value || "").slice(0, 30) });
    }
    return out;
  });
  console.log(JSON.stringify(form, null, 1));
  await ctx.close().catch(() => {});
  process.exit(0);
} catch (e) {
  log("FALHA " + e.message);
  await ctx.close().catch(() => {});
  process.exit(1);
}
