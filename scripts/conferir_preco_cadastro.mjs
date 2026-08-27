#!/usr/bin/env node
/** conferir_preco_cadastro.mjs — o preço de venda REAL no cadastro do ERP, direto da Lista de Preços.
 *
 *  POR QUE: o snapshot do painel de estoque mostra 46 produtos com "preço de tabela" absurdo
 *  (PIRANHA a R$ 215.978,39). Antes de mandar alguém corrigir 46 preços no ERP é preciso saber
 *  se o cadastro está errado MESMO ou se é a minha leitura da coluna do relatório de saldo que
 *  está torta. Esta é a MESMA fonte que o coleta_precificacao.mjs usa (inputs valor_*), então
 *  serve de segunda opinião independente.  Só leitura.
 *
 *  Uso: node conferir_preco_cadastro.mjs "SANTA CLARA:1" "MULTBAG:4"     (marca:empresa)
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_lista_precos.asp";
const ALVOS = process.argv.slice(2).map(a => { const [m, e] = a.split(":"); return { marca: m, emp: Number(e || 1) }; });
const CODS = new Set(["18514", "78827"]);
const log = (m) => console.log(`[preco] ${m}`);

const ctx = await chromium.launchPersistentContext(path.join(homedir(), ".claude", "microvix-profile"), { headless: true, viewport: { width: 1440, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
await garantirSessao(page, { tokenOpcional: true });

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("#empresas_1", { timeout: 25000 });
await page.waitForTimeout(1500);
const marcas = await page.evaluate(() => {
  const ms = document.getElementById("marcas");
  return ms ? [...ms.options].map(o => ({ v: o.value, t: (o.text || "").trim() })) : null;
});
log(`dropdown de marcas: ${marcas ? marcas.length + " opções" : "NÃO ENCONTRADO"}`);

for (const { marca, emp } of ALVOS) {
  // O dropdown de marcas carrega sob demanda (vem com 1 opção). Igual ao coleta_precificacao.mjs,
  // a saída é INJETAR a option com o CÓDIGO da marca — o relatório honra o código submetido.
  const hit = /^\d+$/.test(marca)
    ? { v: marca, t: "marca " + marca }
    : (marcas || []).find(o => o.t.toUpperCase().includes(marca.toUpperCase()));
  if (!hit) { log(`marca "${marca}" não está no dropdown e não é código — pulando`); continue; }
  log(`→ marca ${hit.t} (cod ${hit.v}) na empresa ${emp}`);

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#empresas_1", { timeout: 25000 });
  await page.waitForTimeout(1200);
  const aj = await page.evaluate(() => !!document.getElementById("ajuste_precos")?.checked);
  if (!aj) { await page.click("#ajuste_precos").catch(() => {}); await page.waitForTimeout(900); }
  await page.evaluate(({ emp, cod }) => {
    [1, 3, 4, 9, 10, 11].forEach(i => { const e = document.getElementById("empresas_" + i); if (e) e.checked = (i === emp); });
    document.querySelectorAll("input[name=visao]").forEach(r => r.checked = (r.value === "A"));
    const a = document.getElementById("ativa"); if (a) a.checked = true;
    const d = document.getElementById("desativa"); if (d) d.checked = true;   // inclui inativos
    const bar = document.getElementById("barras"); if (bar) bar.checked = true;
    const pv = document.getElementById("preco_venda"); if (pv) pv.checked = true;
    // ⚠️ sem TABELA DE PREÇO selecionada o relatório volta com 0 linhas (aprendido na marra)
    const tp = document.getElementById("tabela_preco");
    if (tp) { const o = [...tp.options].find(x => /padr/i.test(x.text || "")) || tp.options[0]; if (o) tp.value = o.value; }
    const ms = document.getElementById("marcas");
    if (ms) {
      const c = String(cod);
      if (![...ms.options].some(o => o.value === c)) { const o = document.createElement("option"); o.value = c; o.text = "marca " + c; ms.add(o); }
      [...ms.options].forEach(o => o.selected = (o.value === c)); ms.value = c;
    }
  }, { emp, cod: hit.v });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const b = document.getElementById("btnGerarRelatorio"); if (b) b.click(); });
  let last = -1, stable = 0, t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    await page.waitForTimeout(1200);
    const n = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);
    if (n !== last) { last = n; stable = 0; } else if (++stable >= 4) break;
  }
  const rows = await page.evaluate(() => {
    const parse = v => { v = String(v || "").trim().replace(/\./g, "").replace(",", "."); const n = parseFloat(v); return isNaN(n) ? null : n; };
    const out = [];
    for (const v of document.querySelectorAll('input[name^="valor_"]')) {
      const tr = v.closest("tr"); if (!tr) continue;
      const cod = (tr.querySelector('input[name^="codigo_"]') || {}).value || "";
      const desc = (tr.cells[1]?.textContent || "").trim();
      const custo = parse(tr.cells[7]?.textContent);
      const todas = [...tr.cells].map(c => (c.textContent || "").replace(/\s+/g, " ").trim());
      out.push({ cod, desc, custo, preco: parse(v.value), celulas: todas });
    }
    return out;
  });
  const diag = await page.evaluate(() => ({
    trs: document.querySelectorAll("table tr").length,
    inputsValor: document.querySelectorAll('input[name^="valor_"]').length,
    tabela: document.getElementById("tabela_preco")?.selectedOptions?.[0]?.text || null,
    ajuste: !!document.getElementById("ajuste_precos")?.checked,
    txt: (document.body?.innerText || "").replace(/\s+/g, " ").slice(0, 180),
  }));
  log(`   diag: ${JSON.stringify(diag)}`);
  log(`   ${rows.length} produto(s) no relatório`);
  const achou = rows.filter(r => CODS.has(String(r.cod)));
  if (!achou.length) log(`   ⚠️ nenhum dos códigos ${[...CODS].join("/")} apareceu`);
  for (const r of achou) {
    log(`   ★ cod ${r.cod} — ${r.desc.slice(0, 40)}`);
    log(`       CUSTO no cadastro : ${r.custo}`);
    log(`       PREÇO DE VENDA    : ${r.preco}`);
    log(`       células da linha  : ${JSON.stringify(r.celulas).slice(0, 400)}`);
  }
}
await ctx.close();
