#!/usr/bin/env node
/**
 * classifica_santaclara.mjs — decide PACOTE vs UNIDADE para cada produto Santa Clara,
 * usando o relatório "Histórico de Movimento do Produto" (fonte confiável = preço REAL de venda,
 * coluna "Valor Unit." das saídas 5102/5405 — a coluna "Preço Venda Unit." é cadastro corrompido).
 * Regra: se o preço da venda mais recente ~ custo do PACOTE → PACOTE; se ~ custo da UNIDADE → UNIDADE.
 * Entrada: /tmp/sc_input.json [{cprod,cod_erp,desc,N,packcost,preco_atual}]
 * Saída:   /tmp/sc_classe.json
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_movimento_produto.asp";
const log = m => process.stderr.write(`[sc] ${m}\n`);
const IN = JSON.parse(readFileSync("/tmp/sc_input.json", "utf8"));
const OUT = "/tmp/sc_classe.json";
const numBR = s => { if (!s) return null; const v = parseFloat(String(s).replace(/\./g, "").replace(",", ".")); return isNaN(v) ? null : v; };

async function relatorio(page, codErp) {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!document.getElementById("produto"), { timeout: 20000 }).catch(() => {});
  await page.evaluate(({ prod }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    const chk = (id, v) => { const e = document.getElementById(id); if (e && e.type === "checkbox") e.checked = v; };
    set("produto", prod);
    set("f_data1", "01/01/2024");
    const d = new Date(); const p = n => String(n).padStart(2, "0");
    set("f_data2", `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`);
    const sel = document.getElementById("custo_para_saldo"); if (sel) sel.value = "p";
    chk("entrada", true); chk("saida", true); chk("saldo", true);
  }, { prod: codErp });
  const link = await page.evaluateHandle(() => [...document.querySelectorAll("a,button,input")].find(b => /gerar relat/i.test(b.textContent || b.value || "")));
  await Promise.all([
    page.waitForNavigation({ timeout: 20000 }).catch(() => null),
    link.asElement()?.click().catch(() => {}),
  ]);
  await page.waitForTimeout(1500);
  return await page.evaluate(() => document.body ? document.body.innerText.replace(/[ \t]+/g, " ") : "");
}

// extrai a venda (5102/5403/5405...) mais recente → preço = "Valor Unit."
function ultimaVenda(txt) {
  const vendas = [];
  for (const linha of txt.split("\n")) {
    // data ... UN <saldo> <ValorUnit> <ValorTotal> <PVU> <PVT> <CFOP-venda>
    const m = linha.match(/(\d{2}\/\d{2}\/\d{2,4}).*?\bUN\s+(-?[\d.]+,\d+)\s+([\d.]+,\d+)\s+([\d.]+,\d+)\s+[\d.]+,\d+\s+[\d.]+,\d+\s+(5[0-9]{3})\b/);
    if (!m) continue;
    const cfop = m[5];
    if (!/^(5102|5101|5103|5104|5403|5405|5401)$/.test(cfop)) continue; // só venda
    const [dd, mm, yy] = m[1].split("/");
    const yr = yy.length === 2 ? "20" + yy : yy;
    vendas.push({ data: m[1], ord: `${yr}${mm}${dd}`, valorUnit: numBR(m[3]), cfop });
  }
  if (!vendas.length) return null;
  vendas.sort((a, b) => a.ord < b.ord ? 1 : -1);
  return vendas[0];
}

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try {
  await garantirSessao(page, { log });
  const res = [];
  let i = 0;
  for (const prod of IN) {
    i++;
    let venda = null, erro = null;
    for (let tent = 0; tent < 2 && !venda; tent++) {
      try { venda = ultimaVenda(await relatorio(page, prod.cod_erp)); }
      catch (e) { erro = String(e).slice(0, 60); await page.waitForTimeout(2000); }
    }
    // classificação
    const unitCost = prod.packcost / prod.N;
    let classe, base;
    if (venda && venda.valorUnit != null) {
      // regra econômica: o pacote inteiro nunca é vendido abaixo do próprio custo →
      // preço de venda ≥ custo do pacote ⟹ PACOTE; abaixo disso ⟹ UNIDADE.
      classe = venda.valorUnit >= prod.packcost * 0.85 ? "pacote" : "unidade";
      base = "venda";
    } else {
      // fallback: preço atual (menos confiável) — só sinaliza
      const pa = prod.preco_atual;
      classe = pa == null ? "sem_dado" : (pa > prod.packcost * 0.6 ? "pacote" : "unidade");
      base = pa == null ? "nenhum" : "preco_atual";
    }
    res.push({ ...prod, venda_preco: venda?.valorUnit ?? null, venda_data: venda?.data ?? null, classe, base, erro });
    if (i % 10 === 0 || i === IN.length) { writeFileSync(OUT, JSON.stringify(res, null, 1)); log(`${i}/${IN.length} — ${prod.cod_erp} ${prod.desc.slice(0, 20)} → ${classe} (${base}${venda ? " " + venda.valorUnit : ""})`); }
  }
  writeFileSync(OUT, JSON.stringify(res, null, 1));
  const c = res.reduce((a, r) => (a[r.classe] = (a[r.classe] || 0) + 1, a), {});
  log(`FIM: ${JSON.stringify(c)} — salvo em ${OUT}`);
} catch (e) {
  log("ERRO FATAL " + String(e));
} finally {
  await ctx.close();
}
