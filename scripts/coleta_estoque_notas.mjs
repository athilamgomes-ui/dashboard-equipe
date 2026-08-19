#!/usr/bin/env node
/**
 * coleta_estoque_notas.mjs — notas de ENTRADA (inclusive CANCELADAS) e o fator de conversão.
 * Fonte: gestor_web/produtos/relatorio_notas.asp?modulo=estoque (Playwright headless).
 *
 * Por que canceladas importam: o relatório de saldo conta a entrada da nota que foi cancelada
 * E a da relançada, mas o estoque físico recebeu uma vez só. Sem subtrair a cancelada, o produto
 * aparece como "sumiu sem documento" (caso Nathydras / Alho Therapy, agosto/2026).
 *
 * Fator de conversão (bloco 6): a cópia da NF tem a coluna "Fat. Conv. Utilizado".
 * "-" = não há fator cadastrado NAQUELA EMPRESA (o fator é por empresa).
 *
 * Saída: dados_estoque/notas.json { janela, notas:[...], canceladas:[...], nf:{ "loja|doc": {itens} } }
 * A cópia de cada NF é cacheada por (loja, documento) — nota lançada não muda.
 *
 * Uso:  node coleta_estoque_notas.mjs [dias]        (padrão: desde o balanço mais antigo usado)
 *       node coleta_estoque_notas.mjs --nf L4 12345 (debug: dump da cópia de uma nota)
 * Exit: 0 ok · 1 falha · 2 creds/login
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(DIR, "..", "dados_estoque");
const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");
const URL_NOTAS = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_notas.asp?modulo=estoque";

const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const DIAS_BALANCO = Number(process.env.DIAS_BALANCO || 120);
const MAX_NF = Number(process.env.MAX_NF || 120);     // cópias de NF novas por execução
const log = m => process.stderr.write(`[estoque-notas] ${m}\n`);

const pad = n => String(n).padStart(2, "0");
const HOJE = new Date();
const isoHoje = `${HOJE.getFullYear()}-${pad(HOJE.getMonth() + 1)}-${pad(HOJE.getDate())}`;
const isoParaBR = s => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const brParaISO = s => {
  const m = /(\d{2})\/(\d{2})\/(\d{2,4})/.exec(String(s || "").trim());
  if (!m) return null;
  const ano = m[3].length === 2 ? "20" + m[3] : m[3];
  return `${ano}-${m[2]}-${m[1]}`;
};
const numBR = s => {
  s = String(s || "").trim();
  if (!s || s === "-") return 0;
  const v = parseFloat(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, ""));
  return isNaN(v) ? 0 : v;
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const P_OUT = path.join(OUT_DIR, "notas.json");
const cache = (() => { try { return JSON.parse(fs.readFileSync(P_OUT, "utf8")); } catch { return {}; } })();
cache.nf = cache.nf || {};

// janela = do balanço mais antigo ainda usado até hoje
function janela() {
  const corte = new Date(HOJE.getTime() - DIAS_BALANCO * 86400000);
  return { ini: `${corte.getFullYear()}-${pad(corte.getMonth() + 1)}-${pad(corte.getDate())}`, fim: isoHoje };
}

async function rodarRelatorio(page, { ini, fim, canceladas }) {
  await page.goto(URL_NOTAS, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#empresas_1", { timeout: 20000 });
  await page.waitForTimeout(800);
  const baseline = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(() => 0);

  await page.evaluate(({ d1, d2, canceladas }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.checked = v; };
    [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
    [1, 3, 4, 10].forEach(i => set("empresas_" + i, true));      // ⚠️ nunca 9 nem 11
    document.getElementById("data1").value = d1;
    document.getElementById("data2").value = d2;
    // data de LANÇAMENTO: é quando a nota mexeu no estoque (o relatório de saldo conta por aí)
    document.querySelectorAll("input[name=tipo_data]").forEach(r => { r.checked = (r.value === "data_lancamento"); });
    document.querySelectorAll("input[name=tipo_listagem]").forEach(r => { r.checked = (r.value === "A"); });   // analítica
    // todos os CFOP de ENTRADA — compra, transferência, bonificação, devolução de cliente…
    const sel = document.getElementById("cfop");
    if (sel) {
      [...sel.options].forEach(o => o.selected = /^\s*\[E\]/.test((o.text || "").toUpperCase()));
      try { window.jQuery && window.jQuery(sel).multiselect("refresh"); } catch (e) {}
    }
    const canc = document.querySelector("input[name=SomenteCanceladas]");
    if (canc) canc.checked = !!canceladas;
  }, { d1: isoParaBR(ini), d2: isoParaBR(fim), canceladas });
  await page.waitForTimeout(400);

  // mesmo cuidado do relatório de saldo: esperar o `load` da navegação, não "as linhas pararem"
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 300000 }).catch(() => null);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("input[type=submit], button")].find(x => /gerar/i.test(x.value || x.textContent || ""));
    if (b) b.click();
  });
  if (!(await nav)) throw new Error("relatório de notas não terminou de carregar (resultado seria truncado)");
  await page.waitForTimeout(1200);

  return await page.evaluate(() => {
    const trs = [...document.querySelectorAll("table tr")];
    const out = []; let cur = null, viuHeader = false;
    for (const tr of trs) {
      const c = tr.cells; if (!c) continue;
      const cells = [...c].map(x => (x.textContent || "").trim());
      if (c.length === 10 && /^\d{2}\/\d{2}\/\d{2,4}$/.test(cells[0])) {
        if (cur) out.push(cur);
        const doc = (cells[3] || "").split(/\s|\n/)[0].trim();
        // ⚠️ a cópia da NF é o link `imprime_doc.asp` da célula do NÚMERO do documento.
        // A linha tem outros links (configuração de ICMS-ST, chave NF-e, plano de pagamento):
        // pegar "o primeiro <a> da linha" traz a tela errada e a cópia falha em 100% dos casos.
        let href = null;
        for (const a of tr.querySelectorAll("a[href]")) {
          const h = a.getAttribute("href") || "";
          if (/imprime_doc\.asp/i.test(h)) { href = h; break; }
        }
        cur = { emissao: cells[0], lcto: cells[1], doc, natureza: cells[4], forn: cells[5], valor: cells[8], emp: cells[9], href, itens: [] };
        viuHeader = true;
      } else if (c.length === 7 && /^\d+$/.test(cells[0])) {
        if (cur) cur.itens.push({ c: cells[0], d: cells[1], cfop: cells[2], qtde: cells[4], sub: cells[6] });
      }
    }
    if (cur) out.push(cur);
    return viuHeader ? out : null;
  });
}

function normalizar(brutas, canceladas) {
  const out = [];
  for (const n of brutas || []) {
    const emp = parseInt(n.emp, 10);
    const loja = EMP_TO_LOJA[emp];
    if (!loja) continue;                                   // ignora empresas 9 e 11
    out.push({
      loja, emp, doc: n.doc, cancelada: !!canceladas,
      emissao: brParaISO(n.emissao), lancamento: brParaISO(n.lcto),
      forn: n.forn, natureza: n.natureza, valor: numBR(n.valor),
      // o fator de conversão é POR EMPRESA — o link vem com empresa_doc vazio
      href: n.href ? (/empresa_doc=\d/.test(n.href) ? n.href : n.href.replace(/empresa_doc=?$/, "") + (n.href.includes("empresa_doc=") ? "" : "&") + "empresa_doc=" + emp) : null,
      itens: n.itens.map(it => ({ cod: it.c, desc: it.d, cfop: it.cfop, q: numBR(it.qtde), v: numBR(it.sub) })),
    });
  }
  return out;
}

// ── cópia da NF: a coluna "Fat. Conv. Utilizado" prova se há fator cadastrado ──
async function copiaNF(ctx, href) {
  const p = await ctx.newPage();
  try {
    const url = href.startsWith("http") ? href : new URL(href, "https://linx.microvix.com.br/gestor_web/produtos/").href;
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await p.waitForTimeout(1200);
    return await p.evaluate(() => {
      const trs = [...document.querySelectorAll("table tr")];
      let hdr = null, nh = 0;
      for (const tr of trs) {
        const t = (tr.textContent || "").toLowerCase();
        if (/descri/.test(t) && /qtd/.test(t) && tr.cells && tr.cells.length >= 8) {
          hdr = [...tr.cells].map(c => (c.textContent || "").trim()); nh = tr.cells.length; break;
        }
      }
      if (!hdr) return { erro: "cabeçalho da cópia da NF não encontrado" };
      const iCod = 0;
      const iDesc = hdr.findIndex(h => /descri/i.test(h));
      const iUnd = hdr.findIndex(h => /^und/i.test(h));
      const iQtd = hdr.findIndex(h => /^qtd/i.test(h));
      const iFat = hdr.findIndex(h => /fat\.?\s*conv/i.test(h));
      const itens = [];
      for (const tr of trs) {
        const c = tr.cells; if (!c || c.length !== nh) continue;
        const cod = (c[iCod].textContent || "").trim();
        if (!/^\d+$/.test(cod)) continue;
        const g = i => i >= 0 ? (c[i].textContent || "").trim() : "";
        // fat = null quando a coluna "Fat. Conv. Utilizado" NEM EXISTE nesta cópia (ela é
        // condicional). Null = sem evidência; "-" = evidência de que não há fator cadastrado.
        itens.push({ cod, desc: g(iDesc), und: g(iUnd), qtd: g(iQtd), fat: iFat >= 0 ? g(iFat) : null });
      }
      return { hdr, temColunaFat: iFat >= 0, itens };
    });
  } finally { await p.close().catch(() => {}); }
}

// ── main ───────────────────────────────────────────────────────────────────
const t0 = Date.now();
const jan = janela();
log(`janela ${jan.ini} → ${jan.fim}`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try {
  await garantirSessao(page, { log, tokenOpcional: true });
} catch (e) {
  log(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
}

try {
  // debug: dump da cópia de uma nota
  const iNF = process.argv.indexOf("--nf");
  if (iNF > -1) {
    const notas = normalizar(await rodarRelatorio(page, { ...jan, canceladas: false }), false);
    const alvo = notas.find(n => n.doc === process.argv[iNF + 2] && n.loja === process.argv[iNF + 1]);
    if (!alvo) { log("nota não encontrada na janela"); process.exit(1); }
    log(`href: ${alvo.href}`);
    console.log(JSON.stringify(await copiaNF(ctx, alvo.href), null, 1));
    await ctx.close(); process.exit(0);
  }

  const normais = normalizar(await rodarRelatorio(page, { ...jan, canceladas: false }), false);
  log(`notas de entrada: ${normais.length}`);
  const canc = normalizar(await rodarRelatorio(page, { ...jan, canceladas: true }), true);
  log(`notas CANCELADAS: ${canc.length}`);

  // cópias de NF (fator de conversão) — só as que ainda não estão em cache
  const pend = normais.filter(n => n.href && !cache.nf[`${n.loja}|${n.doc}`]);
  const alvo = pend.slice(-MAX_NF);       // as mais recentes primeiro (a lista vem cronológica)
  log(`cópias de NF: ${cache.nf ? Object.keys(cache.nf).length : 0} em cache · ${pend.length} pendentes · baixando ${alvo.length}`);
  let okNF = 0, erroNF = 0;
  for (const n of alvo) {
    try {
      const r = await copiaNF(ctx, n.href);
      if (r.erro) { erroNF++; continue; }
      cache.nf[`${n.loja}|${n.doc}`] = { loja: n.loja, doc: n.doc, data: n.lancamento, temColunaFat: !!r.temColunaFat, itens: r.itens };
      okNF++;
      if (okNF % 20 === 0) log(`  ...${okNF} cópias`);
    } catch (e) { erroNF++; }
  }
  log(`cópias de NF: ${okNF} novas · ${erroNF} falhas`);

  const out = { gerado_em: new Date().toISOString(), janela: jan, notas: normais, canceladas: canc, nf: cache.nf };
  fs.writeFileSync(P_OUT, JSON.stringify(out));
  log(`OK em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await ctx.close().catch(() => {});
  process.exit(normais.length ? 0 : 1);
} catch (e) {
  log(`FALHA: ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(1);
}
