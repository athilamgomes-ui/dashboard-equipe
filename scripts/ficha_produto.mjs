#!/usr/bin/env node
/**
 * ficha_produto.mjs — a ficha completa de um produto, para decidir sobre ele com segurança.
 *
 * Responde as perguntas que o Athila faz antes de desativar ou mexer num código (20/08/2026):
 *   · qual foi a ÚLTIMA VENDA com esse código (o código está em uso?)
 *   · qual foi a ÚLTIMA COMPRA e por qual NOTA (o que a nota diz é o que vale)
 *   · desde quando o código existe (prioridade é sempre o código MAIS ANTIGO)
 *   · o produto ainda tem saldo em alguma loja
 *
 * Fonte: Histórico de Movimento do Produto (todas as lojas), desde 2023.
 * Só leitura. Uso: node ficha_produto.mjs 60953 60714
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D_DIR = path.join(DIR, "..", "dados_estoque");
const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");
const URL_MOV = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_movimento_produto.asp";
const URL_HOME = "https://linx.microvix.com.br/v4/home/index.asp";
// ⚠️ medido em 20/08/2026: o Histórico de Movimento devolve os MESMOS números nas 4 lojas —
// ele é do GRUPO, não da empresa da sessão. Por isso o padrão é consultar UMA loja só (4x mais
// rápido). LOJAS_FICHA=L1,L4 força mais de uma, se um dia isso mudar.
const TODAS = { L1: 1, L3: 3, L4: 4, L5: 10 };
const LOJAS = Object.fromEntries(Object.entries(TODAS).filter(([k]) =>
  (process.env.LOJAS_FICHA || "L1").split(",").includes(k)));
const DESDE = process.env.DESDE || "01/01/2023";
const codigos = process.argv.slice(2).filter(a => /^\d+$/.test(a));
if (!codigos.length) { console.error("uso: node ficha_produto.mjs <cod> [cod...]"); process.exit(1); }
const log = m => process.stderr.write(`[ficha] ${m}\n`);
const pad = n => String(n).padStart(2, "0");
const H = new Date();
const hojeBR = `${pad(H.getDate())}/${pad(H.getMonth() + 1)}/${H.getFullYear()}`;
const ord = d => { const [dd, mm, yy] = d.split("/"); return (yy.length === 2 ? "20" + yy : yy) + mm + dd; };
const num = s => { const v = parseFloat(String(s ?? "").replace(/\./g, "").replace(",", ".")); return isNaN(v) ? 0 : v; };

const snap = (() => { try { return JSON.parse(fs.readFileSync(path.join(D_DIR, "snapshot.json"), "utf8")); } catch { return null; } })();

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
await garantirSessao(page, { log, tokenOpcional: true });

async function trocar(E) {
  await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(E => { const s = document.getElementById("topbar_sel_empresa_portal_usuario"); if (s && window.jQuery) { window.jQuery(s).val(String(E)); window.jQuery(s).trigger("change"); } }, E).catch(() => {});
  await page.waitForTimeout(4500);
}
async function mov(cod) {
  await page.goto(URL_MOV, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => !!document.getElementById("produto"), { timeout: 20000 }).catch(() => {});
  await page.evaluate(({ cod, d1, d2 }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    const chk = (id, v) => { const e = document.getElementById(id); if (e && e.type === "checkbox") e.checked = v; };
    set("produto", cod); set("f_data1", d1); set("f_data2", d2);
    chk("entrada", true); chk("saida", true); chk("saldo", true);
  }, { cod, d1: DESDE, d2: hojeBR });
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => null);
  await page.evaluate(() => { const b = [...document.querySelectorAll("a,button,input")].find(x => /gerar relat/i.test(x.textContent || x.value || "")); if (b) b.click(); });
  await nav; await page.waitForTimeout(400);
  return await page.evaluate(() => {
    const trs = [...document.querySelectorAll("table tr")];
    let hdr = null, nh = 0;
    for (const tr of trs) { const t = (tr.textContent || "").toLowerCase(); if (/m[ée]dio/.test(t) && /unit/.test(t) && tr.cells && tr.cells.length >= 5) { hdr = [...tr.cells].map(c => (c.textContent || "").trim()); nh = tr.cells.length; break; } }
    if (!hdr) return { erro: "sem cabeçalho" };
    const ix = re => hdr.findIndex(h => re.test(h));
    const i = { d: ix(/emiss/i), doc: ix(/doc/i), quem: ix(/cliente|fornec/i), q: ix(/^qtd/i), u: ix(/^unid/i), vu: ix(/valor\s*unit/i), cfop: ix(/cfop/i), sal: ix(/^saldo/i) };
    const L = [];
    for (const tr of trs) {
      const c = tr.cells; if (!c || c.length !== nh) continue;
      const g = k => i[k] >= 0 ? (c[i[k]].textContent || "").trim() : "";
      if (!/^\d{2}\/\d{2}\/\d{2,4}$/.test(g("d"))) continue;
      L.push({ data: g("d"), doc: g("doc"), quem: g("quem").replace(/Arquivo de refer[êe]ncia\s*:.*$/is, "").replace(/\s+/g, " ").trim(), qtd: g("q"), un: g("u"), vunit: g("vu"), cfop: g("cfop").replace(/\D/g, ""), saldo: g("sal") });
    }
    return { linhas: L };
  });
}

const out = {};
for (const [lj, E] of Object.entries(LOJAS)) {
  await trocar(E);
  for (const cod of codigos) {
    const r = await mov(cod).catch(e => ({ erro: e.message.slice(0, 60) }));
    if (r.erro || !r.linhas.length) continue;
    const L = r.linhas.sort((a, b) => ord(a.data) < ord(b.data) ? -1 : 1);
    const vendas = L.filter(x => /^5/.test(x.cfop));
    const compras = L.filter(x => /^[12]/.test(x.cfop));
    (out[cod] = out[cod] || {})[lj] = {
      movimentos: L.length, primeiro: L[0]?.data, ultimo: L[L.length - 1]?.data,
      ultimaVenda: vendas.length ? { data: vendas[vendas.length - 1].data, qtd: vendas[vendas.length - 1].qtd, preco: vendas[vendas.length - 1].vunit, un: vendas[vendas.length - 1].un } : null,
      totalVendido: vendas.reduce((a, b) => a + num(b.qtd), 0),
      ultimaCompra: compras.length ? { data: compras[compras.length - 1].data, doc: compras[compras.length - 1].doc, forn: compras[compras.length - 1].quem, qtd: compras[compras.length - 1].qtd, un: compras[compras.length - 1].un, custo: compras[compras.length - 1].vunit } : null,
      totalComprado: compras.reduce((a, b) => a + num(b.qtd), 0),
      saldoHoje: snap?.lojas?.[lj]?.prods?.[cod]?.sal ?? null,
      saldoTodasLojas: snap ? Object.fromEntries(Object.keys(TODAS).map(x => [x, snap.lojas?.[x]?.prods?.[cod]?.sal ?? null])) : null,
      desc: snap?.lojas?.[lj]?.prods?.[cod]?.d ?? null,
    };
  }
}
fs.writeFileSync(path.join(D_DIR, "ficha_produto.json"), JSON.stringify(out, null, 1));
for (const cod of codigos) {
  const p = out[cod];
  if (!p) { log(`\n=== ${cod}: sem movimento desde ${DESDE} em nenhuma loja ===`); continue; }
  const qq = Object.values(p)[0];
  log(`\n=== ${cod} — ${qq.desc || "?"} ===`);
  for (const [lj, v] of Object.entries(p)) {
    log(`  saldo por loja: ${JSON.stringify(v.saldoTodasLojas)} · ${v.movimentos} movimentos (${v.primeiro} → ${v.ultimo})`);
    log(`      comprou ${Math.round(v.totalComprado)} · vendeu ${Math.round(v.totalVendido)}`);
    if (v.ultimaCompra) log(`      última COMPRA: ${v.ultimaCompra.data} NF ${v.ultimaCompra.doc} · ${v.ultimaCompra.qtd} ${v.ultimaCompra.un} a ${v.ultimaCompra.custo} · ${v.ultimaCompra.forn.slice(0, 34)}`);
    if (v.ultimaVenda) log(`      última VENDA:  ${v.ultimaVenda.data} · ${v.ultimaVenda.qtd} ${v.ultimaVenda.un} a ${v.ultimaVenda.preco}`);
    else log(`      última VENDA:  nunca vendeu desde ${DESDE}`);
  }
}
await ctx.close().catch(() => {});
process.exit(0);
