#!/usr/bin/env node
/**
 * coleta_estoque_entradas.mjs — quem teve ENTRADA numa janela longa, por loja.
 * Usado pelo critério "produto que não existe": sem entrada desde 01/01/2023.
 *
 * Roda o relatório de saldo com `sem_movimentacao` DESLIGADO (só quem se moveu) e janela de
 * compra longa. Produto ausente da lista = nenhuma entrada e nenhuma venda no período.
 *
 * Uso: node coleta_estoque_entradas.mjs 2023-01-01 L1,L4
 * Saída: dados_estoque/entradas_desde.json  { desde, lojas:{L1:{cod:[ent,ven]}} }
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const D_DIR = path.join(DIR, "..", "dados_estoque");
// MICROVIX_PROFILE permite rodar numa consulta de LEITURA sem brigar com o cron da precificação
// (que abre o ~/.claude/microvix-profile de 15 em 15 min, seg-sáb 08:00–19:45, e derruba o
// navegador de quem estiver usando: "Target page, context or browser has been closed").
const PROFILE_DIR = process.env.MICROVIX_PROFILE || path.join(homedir(), ".claude", "microvix-profile");
const URL = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp";
const LOJA_TO_EMP = { L1: 1, L3: 3, L4: 4, L5: 10 };

const DESDE = process.argv[2] || "2023-01-01";
const LOJAS = (process.argv[3] || "L1,L4").split(",");
const log = m => process.stderr.write(`[entradas] ${m}\n`);
const pad = n => String(n).padStart(2, "0");
const H = new Date();
const hojeBR = `${pad(H.getDate())}/${pad(H.getMonth() + 1)}/${H.getFullYear()}`;
const brDe = s => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`sessão: ${e.message}`); await ctx.close().catch(() => {}); process.exit(2); }

const out = { desde: DESDE, gerado_em: new Date().toISOString(), lojas: {} };
try {
  for (const lj of LOJAS) {
    const E = LOJA_TO_EMP[lj];
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("#empresas_1", { timeout: 20000 });
    await page.waitForTimeout(700);
    await page.evaluate(({ E, d1, d2 }) => {
      const set = (id, v) => { const e = document.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
      const sn = (n, v) => { const e = document.querySelector(`input[name=${n}]`); if (e) e.checked = v; };
      [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false)); set("empresas_" + E, true);
      const sv = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      sv("data1", d1); sv("data2", d2);
      const c1 = document.querySelector("[name=data1_compra]"); if (c1) c1.value = d1;
      const c2 = document.querySelector("[name=data2_compra]"); if (c2) c2.value = d2;
      set("controle_dif_periodo", true); set("exibe_estoque_transito", true); set("somenteDisp", false);
      sn("sem_movimentacao", false); sn("saldo_positivo", false);
      const dep = document.querySelector("select[name=depositos]"); if (dep) [...dep.options].forEach(o => o.selected = (o.value === "1"));
      const fa = document.querySelector("input[name=formas][value=A]"); if (fa) fa.checked = true;
      const ag = document.querySelector("select[name=f_agrupamento]"); if (ag) [...ag.options].forEach(o => o.selected = (o.text.trim() === "Marca"));
    }, { E, d1: brDe(DESDE), d2: hojeBR });
    const nav = page.waitForNavigation({ waitUntil: "load", timeout: 900000 }).catch(() => null);
    await page.evaluate(() => { const b = [...document.querySelectorAll("input[type=submit],input[type=button],button,a")].find(x => /^gerar/i.test((x.value || x.textContent || "").trim())); if (b) b.click(); });
    if (!(await nav)) throw new Error(`${lj}: relatório não terminou de carregar (seria truncado)`);
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const num = s => { s = String(s || "").trim(); if (!s || s === "-") return 0; const v = parseFloat(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "")); return isNaN(v) ? 0 : v; };
      const trs = [...document.querySelectorAll("tr")];
      let hdr = null;
      for (const tr of trs) { const t = (tr.textContent || "").toLowerCase(); if (/c[óo]digo/.test(t) && /saldo/.test(t) && tr.cells && tr.cells.length > 5) { hdr = [...tr.cells].map(c => (c.textContent || "").trim()); break; } }
      if (!hdr) return { erro: "cabeçalho não encontrado" };
      const n = hdr.length, prods = {};
      for (const tr of trs) {
        const c = tr.cells; if (!c || c.length !== n) continue;
        const cod = (c[0].textContent || "").trim(); if (!/^\d+$/.test(cod)) continue;
        prods[cod] = [num(c[4].textContent), num(c[n - 3].textContent)];   // [entradas, vendas]
      }
      return { n: Object.keys(prods).length, prods };
    });
    if (r.erro || !r.n) throw new Error(`${lj}: ${r.erro || "sem linhas"}`);
    out.lojas[lj] = r.prods;
    log(`${lj}: ${r.n} produtos com movimento desde ${DESDE} em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  // Preserva as lojas que NÃO foram coletadas nesta execução (mesmo padrão do coleta_estoque_saldo).
  // Sem isso, rodar só L3,L5 apagava o dado de L1,L4 — e o que some é justamente a evidência
  // "comprou 3, vendeu 339" que identifica erro de fator de conversão.
  const P_OUT = path.join(D_DIR, "entradas_desde.json");
  try {
    const antigo = JSON.parse(fs.readFileSync(P_OUT, "utf8"));
    for (const [lj, prods] of Object.entries(antigo.lojas || {})) {
      if (!out.lojas[lj]) { out.lojas[lj] = prods; log(`${lj}: preservado da coleta anterior (${Object.keys(prods).length} produtos)`); }
    }
  } catch (_) { /* primeira execução: não há o que preservar */ }
  fs.writeFileSync(P_OUT, JSON.stringify(out));
  log(`OK → dados_estoque/entradas_desde.json (lojas: ${Object.keys(out.lojas).join(", ")})`);
  await ctx.close().catch(() => {}); process.exit(0);
} catch (e) {
  log(`FALHA: ${e.message}`);
  await ctx.close().catch(() => {}); process.exit(1);
}
