// Vendas por produto com custo escolhido + preço realizado. Perfil ISOLADO (não briga com o cron).
// Uso: node coleta_custo.mjs <tipo_custo> <di> <df>   ex: node coleta_custo.mjs compra 01/06/2026 21/08/2026
import { chromium } from "playwright-core";
import { garantirSessao } from "./microvix_auth.mjs";
import { writeFileSync } from "node:fs";
const log = m => process.stderr.write(`[c] ${m}\n`);
const U = "https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";
const EMP = { L1: 1, L4: 4, L3: 3, L5: 10 };
const TC = process.argv[2] || "compra", DI = process.argv[3] || "01/06/2026", DF = process.argv[4] || "21/08/2026";
const OUT = `/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas/custo_${TC}.json`;
const ctx = await chromium.launchPersistentContext(process.env.HOME + "/.claude/microvix-analise", { headless: true, viewport: { width: 1900, height: 1100 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", async d => { log("DIALOG: " + d.message().slice(0, 90)); await d.accept().catch(() => {}); });
await garantirSessao(page, { log, tokenOpcional: true });
const out = { _tipo_custo: TC, _periodo: [DI, DF], _coletado_em: new Date().toISOString() };
for (const [lj, e] of Object.entries(EMP)) {
  await page.goto(U, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#f_data1", { timeout: 25000 });
  await page.waitForTimeout(2500);
  await page.evaluate(({ e, di, df, tc }) => {
    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(c => c.checked = false);
    const el = document.getElementById("empresas_" + e); if (el) el.checked = true;
    document.getElementById("f_data1").value = di;
    document.getElementById("f_data2").value = df;
    const t = document.querySelector("select[name=tipo_custo]"); if (t) { t.value = tc; t.dispatchEvent(new Event("change")); }
    document.querySelectorAll('input[name=markup_margem]').forEach(c => c.checked = true);
  }, { e, di: DI, df: DF, tc: TC });
  // "Prosseguir >" -> listagem_relat_prod_vend3.asp (assíncrono). NÃO usar submit_form.
  await page.evaluate(() => { const b = [...document.querySelectorAll("a,button,input")].find(x => /prosseguir/i.test((x.textContent || "") + (x.value || ""))); if (b) b.click(); });
  let r = null, ant = -1, est = 0;
  for (let i = 0; i < 300; i++) {
    await page.waitForTimeout(2000);
    const n = await page.evaluate(() => [...document.querySelectorAll("table tr")].map(t => [...t.querySelectorAll("td")].map(c => c.innerText || "")).filter(l => l.length >= 6 && /^\d{2,7}$/.test((l[0] || "").trim())).length).catch(() => 0);
    if (n > 0 && n === ant) { if (++est >= 3) { r = await page.evaluate(() => { const cs = [...document.querySelectorAll("table tr")].map(t => [...t.querySelectorAll("td,th")].map(c => (c.innerText || "").replace(/\s+/g, " ").trim())); return { head: cs.filter(l => l.length > 6).find(l => l.some(c => /margem|markup|custo/i.test(c))) || [], prods: cs.filter(l => l.length >= 6 && /^\d{2,7}$/.test((l[0] || "").trim())) }; }); break; } } else est = 0;
    ant = n;
  }
  if (!r) { log(`${lj}: NÃO GEROU`); continue; }
  if (!out._head) out._head = r.head;
  out[lj] = r.prods;
  log(`${lj}: ${r.prods.length} produtos`);
  writeFileSync(OUT, JSON.stringify(out));   // grava a cada loja — se morrer no meio, não perde tudo
}
log("HEAD: " + JSON.stringify(out._head));
log("gravado em " + OUT);
await ctx.close();
