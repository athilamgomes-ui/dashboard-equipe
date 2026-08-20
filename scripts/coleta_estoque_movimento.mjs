#!/usr/bin/env node
/**
 * coleta_estoque_movimento.mjs — busca a JUSTIFICATIVA do que sobrou sem explicação.
 *
 * Para cada produto que a reconciliação não conseguiu explicar, puxa o **Histórico de Movimento do
 * Produto** na janela do balanço até hoje. Esse relatório mostra TODA movimentação — inclusive as
 * que não têm nota: ajuste de saldo manual, transferência, devolução, balanço. É o que responde
 * "para onde foi" quando a conta não fecha.
 *
 * Só roda para os SEM EXPLICAÇÃO (é caro: ~4 s por produto), lendo a lista do próprio painel.
 * O relatório usa a empresa da SESSÃO → agrupa por loja e troca a empresa uma vez por loja.
 *
 * Uso:  node coleta_estoque_movimento.mjs            (padrão: MAX_MOV=250)
 *       MAX_MOV=60 node coleta_estoque_movimento.mjs
 * Exit: 0 (nunca derruba o pipeline — o painel degrada mostrando "não investigado")
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
const LOJA_TO_EMP = { L1: 1, L3: 3, L4: 4, L5: 10 };
const MAX = Number(process.env.MAX_MOV || 250);
const TTL_DIAS = 7;
const log = m => process.stderr.write(`[movimento] ${m}\n`);
const pad = n => String(n).padStart(2, "0");
const H = new Date();
const isoHoje = `${H.getFullYear()}-${pad(H.getMonth() + 1)}-${pad(H.getDate())}`;
const brDe = s => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const numBR = s => { const v = parseFloat(String(s ?? "").replace(/\./g, "").replace(",", ".")); return isNaN(v) ? null : v; };

const P_DADOS = path.join(D_DIR, "estoque_dados.json");
const P_OUT = path.join(D_DIR, "movimentos.json");
if (!fs.existsSync(P_DADOS)) { log("estoque_dados.json não existe — rode o build antes"); process.exit(0); }
const dados = JSON.parse(fs.readFileSync(P_DADOS, "utf8"));
const cache = fs.existsSync(P_OUT) ? JSON.parse(fs.readFileSync(P_OUT, "utf8")) : { produtos: {} };
cache.produtos = cache.produtos || {};

// alvos = o que a reconciliação marcou como "sumiu sem explicação", os de maior dinheiro primeiro
const alvos = dados.recon
  .filter(x => x.classe === "semdoc")
  .filter(x => {
    const c = cache.produtos[`${x.loja}|${x.cod}`];
    return !(c && c.data && (new Date(isoHoje) - new Date(c.data)) / 86400000 < TTL_DIAS);
  })
  .sort((a, b) => Math.abs(b.dif) * (b.custo || 0) - Math.abs(a.dif) * (a.custo || 0))
  .slice(0, MAX);

if (!alvos.length) { log("nada sem explicação para investigar"); process.exit(0); }

async function trocarEmpresa(page, E) {
  await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(E => {
    const s = document.getElementById("topbar_sel_empresa_portal_usuario");
    if (s && window.jQuery) { window.jQuery(s).val(String(E)); window.jQuery(s).trigger("change"); }
  }, E).catch(() => {});
  await page.waitForTimeout(4500);
}

async function movimento(page, cod, desde) {
  await page.goto(URL_MOV, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => !!document.getElementById("produto"), { timeout: 20000 }).catch(() => {});
  await page.evaluate(({ cod, d1, d2 }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    const chk = (id, v) => { const e = document.getElementById(id); if (e && e.type === "checkbox") e.checked = v; };
    set("produto", cod); set("f_data1", d1); set("f_data2", d2);
    chk("entrada", true); chk("saida", true); chk("saldo", true);
  }, { cod, d1: brDe(desde), d2: brDe(isoHoje) });
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => null);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("a,button,input")].find(x => /gerar relat/i.test(x.textContent || x.value || ""));
    if (b) b.click();
  });
  await nav;
  await page.waitForTimeout(500);
  return await page.evaluate(() => {
    const trs = [...document.querySelectorAll("table tr")];
    let hdr = null, nh = 0;
    for (const tr of trs) {
      const t = (tr.textContent || "").toLowerCase();
      if (/m[ée]dio/.test(t) && /unit/.test(t) && tr.cells && tr.cells.length >= 5) { hdr = [...tr.cells].map(c => (c.textContent || "").trim()); nh = tr.cells.length; break; }
    }
    if (!hdr) return { erro: "cabeçalho não encontrado" };
    const ix = re => hdr.findIndex(h => re.test(h));
    // ⚠️ a coluna de data se chama "Emissão", não "Data" (bug que já zerou este parser antes)
    const iData = ix(/emiss|data/i), iDoc = ix(/doc/i), iCli = ix(/cliente|fornec/i),
          iQtd = ix(/^qtd/i), iCfop = ix(/cfop/i), iSaldo = ix(/^saldo/i);
    const linhas = [];
    for (const tr of trs) {
      const c = tr.cells; if (!c || c.length !== nh) continue;
      const g = i => i >= 0 ? (c[i].textContent || "").trim() : "";
      const d = g(iData);
      if (!/^\d{2}\/\d{2}\/\d{2,4}$/.test(d)) continue;
      linhas.push({ data: d, doc: g(iDoc), quem: g(iCli), qtd: g(iQtd), cfop: g(iCfop), saldo: g(iSaldo) });
    }
    return { linhas };
  });
}

// classifica cada movimento em linguagem de prateleira
function classificar(l) {
  const cfop = (l.cfop || "").replace(/\D/g, "");
  const quem = (l.quem || "").toUpperCase();
  const doc = (l.doc || "").toUpperCase();
  if (!cfop) return "mexeram no saldo sem nota";
  // 1xxx/2xxx = entrada · 5xxx/6xxx = saída (o 2º dígito em diante é o mesmo dos dois lados)
  const entrada = /^[12]/.test(cfop), resto = cfop.slice(1);
  if (/TRANSF/.test(doc + quem) || /^15[12]/.test(resto)) return "transferência entre lojas";
  if (/^10[1-9]|^40[1-9]|^55[0-9]/.test(resto)) return entrada ? "entrada de compra" : "venda";
  if (/^20[12]|^41[01]/.test(resto)) return entrada ? "devolução de cliente" : "devolução ao fornecedor";
  if (/^9[0-9]{2}/.test(resto)) return "remessa ou bonificação";
  return (entrada ? "outra entrada" : "outra saída") + " (CFOP " + cfop + ")";
}

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`sessão falhou: ${e.message}`); await ctx.close().catch(() => {}); process.exit(0); }

const porLoja = {};
for (const a of alvos) (porLoja[a.loja] = porLoja[a.loja] || []).push(a);
log(`${alvos.length} produtos sem explicação a investigar (${Object.entries(porLoja).map(([l, v]) => l + ":" + v.length).join(" ")})`);

let ok = 0, erro = 0;
try {
  for (const [loja, lista] of Object.entries(porLoja)) {
    await trocarEmpresa(page, LOJA_TO_EMP[loja]);
    for (const a of lista) {
      try {
        const r = await movimento(page, a.cod, a.bal_data);
        if (r.erro) { erro++; continue; }
        const resumo = {};
        for (const l of r.linhas) {
          const k = classificar(l);
          const q = numBR(l.qtd) || 0;
          resumo[k] = resumo[k] || { qtd: 0, n: 0, ultima: null };
          resumo[k].qtd += q; resumo[k].n++; resumo[k].ultima = l.data;
        }
        cache.produtos[`${loja}|${a.cod}`] = {
          data: isoHoje, desde: a.bal_data, movimentos: r.linhas.length, resumo,
          sem_nota: resumo["mexeram no saldo sem nota"] || null,
        };
        ok++;
        if (ok % 10 === 0) { fs.writeFileSync(P_OUT, JSON.stringify(cache)); log(`  ...${ok}/${alvos.length}`); }
      } catch (e) { erro++; log(`  ${loja}|${a.cod}: ${e.message.split("\n")[0]}`); }
    }
  }
  fs.writeFileSync(P_OUT, JSON.stringify(cache));
  log(`OK · ${ok} investigados · ${erro} falhas · cache com ${Object.keys(cache.produtos).length}`);
} catch (e) {
  fs.writeFileSync(P_OUT, JSON.stringify(cache));
  log(`FALHA (não-fatal): ${e.message}`);
}
await ctx.close().catch(() => {});
process.exit(0);
