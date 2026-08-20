#!/usr/bin/env node
/**
 * coleta_estoque_custos.mjs — custo médio VERDADEIRO e preço realmente praticado, produto a produto.
 * Fonte: gestor_web/produtos/relatorio_movimento_produto.asp (Histórico de Movimento do Produto).
 *
 * Por que existe: o relatório de saldo traz "Custo Médio Unit." e "Preço de Tabela Unit.", que já
 * bastam para SINALIZAR preço absurdo. Mas o custo de referência do grupo é a coluna
 * "Médio (Histórico) Unit." deste relatório — e o preço de cadastro é notoriamente corrompido,
 * então o preço real é o "Valor Unit." da última SAÍDA de venda.
 *
 * É caro (uma execução por produto, ~3-5s) → roda só para os SUSPEITOS do bloco 5, com cache de
 * 30 dias. O relatório usa a empresa da SESSÃO, então os suspeitos são agrupados por loja e a
 * empresa é trocada uma vez por loja (#topbar_sel_empresa_portal_usuario).
 *
 * Uso:  node coleta_estoque_custos.mjs            → confirma os suspeitos do snapshot
 *       node coleta_estoque_custos.mjs --dump L1 1139
 * Exit: 0 ok (sempre não-fatal para o pipeline) · 2 creds/login
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
const URL_MOV = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_movimento_produto.asp";
const URL_HOME = "https://linx.microvix.com.br/v4/home/index.asp";

const LOJA_TO_EMP = { L1: 1, L3: 3, L4: 4, L5: 10 };
const RAZAO_ALTA = 10;
const MAX = Number(process.env.MAX_CUSTOS || 60);
const TTL_DIAS = 30;
const log = m => process.stderr.write(`[estoque-custos] ${m}\n`);
const pad = n => String(n).padStart(2, "0");
const HOJE = new Date();
const isoHoje = `${HOJE.getFullYear()}-${pad(HOJE.getMonth() + 1)}-${pad(HOJE.getDate())}`;
const numBR = s => { if (s == null) return null; const v = parseFloat(String(s).replace(/\./g, "").replace(",", ".")); return isNaN(v) ? null : v; };

const P_SNAP = path.join(OUT_DIR, "snapshot.json");
const P_OUT = path.join(OUT_DIR, "custos.json");
if (!fs.existsSync(P_SNAP)) { log("snapshot.json não existe — nada a confirmar"); process.exit(0); }
const snap = JSON.parse(fs.readFileSync(P_SNAP, "utf8"));
const cache = fs.existsSync(P_OUT) ? JSON.parse(fs.readFileSync(P_OUT, "utf8")) : { produtos: {} };
cache.produtos = cache.produtos || {};

// ── suspeitos: mesma regra do bloco 5 do build ────────────────────────────
function suspeitos() {
  const out = [];
  for (const [loja, S] of Object.entries(snap.lojas || {})) {
    for (const [cod, p] of Object.entries(S.prods)) {
      if (!p.pre || p.pre <= 0) continue;
      const razao = (p.cus && p.cus > 0) ? p.pre / p.cus : null;
      const suspeito = razao === null || razao >= RAZAO_ALTA || razao <= 1;
      if (!suspeito) continue;
      const c = cache.produtos[`${loja}|${cod}`];
      if (c && c.data && (new Date(isoHoje) - new Date(c.data)) / 86400000 < TTL_DIAS) continue;
      // gravidade: quão fora está × quanto ainda tem em estoque
      const grav = (razao === null ? 1e6 : Math.max(razao, 1 / Math.max(razao, 0.0001))) * (1 + Math.abs(p.sal || 0));
      out.push({ loja, cod, desc: p.d, cus: p.cus, pre: p.pre, sal: p.sal, razao, grav });
    }
  }
  out.sort((a, b) => b.grav - a.grav);
  return out;
}

async function trocarEmpresa(page, E) {
  await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(E => {
    const s = document.getElementById("topbar_sel_empresa_portal_usuario");
    if (s && window.jQuery) { window.jQuery(s).val(String(E)); window.jQuery(s).trigger("change"); }
  }, E).catch(() => {});
  await page.waitForTimeout(4000);
}

async function movimento(page, cod) {
  await page.goto(URL_MOV, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => !!document.getElementById("produto"), { timeout: 20000 }).catch(() => {});
  await page.evaluate(({ cod, d2 }) => {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    const chk = (id, v) => { const e = document.getElementById(id); if (e && e.type === "checkbox") e.checked = v; };
    set("produto", cod);
    set("f_data1", "01/01/2024"); set("f_data2", d2);
    chk("entrada", true); chk("saida", true); chk("saldo", true);
  }, { cod, d2: `${pad(HOJE.getDate())}/${pad(HOJE.getMonth() + 1)}/${HOJE.getFullYear()}` });
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => null);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("a,button,input")].find(x => /gerar relat/i.test(x.textContent || x.value || ""));
    if (b) b.click();
  });
  await nav;
  await page.waitForTimeout(600);
  return await page.evaluate(() => {
    const trs = [...document.querySelectorAll("table tr")];
    let hdr = null, nh = 0;
    for (const tr of trs) {
      const t = (tr.textContent || "").toLowerCase();
      if (/m[ée]dio/.test(t) && /unit/.test(t) && tr.cells && tr.cells.length >= 5) { hdr = [...tr.cells].map(c => (c.textContent || "").trim()); nh = tr.cells.length; break; }
    }
    if (!hdr) return { erro: "cabeçalho do movimento não encontrado", txt: (document.body.innerText || "").slice(0, 400) };
    // ⚠️ a coluna de data se chama "Emissão", não "Data" — procurar por /data/ devolvia -1 e
    // NENHUMA linha era parseada (o cache saía com movimentos:0 e custo real vazio no painel).
    const iData = hdr.findIndex(h => /emiss|data/i.test(h));
    const iLote = hdr.findIndex(h => /^lote/i.test(h));
    const iQtd = hdr.findIndex(h => /^qtd/i.test(h));
    const iMedio = hdr.findIndex(h => /m[ée]dio.*hist/i.test(h)) >= 0 ? hdr.findIndex(h => /m[ée]dio.*hist/i.test(h)) : hdr.findIndex(h => /m[ée]dio/i.test(h));
    const iVUnit = hdr.findIndex(h => /valor\s*unit/i.test(h));
    const iCfop = hdr.findIndex(h => /cfop/i.test(h));
    const linhas = [];
    for (const tr of trs) {
      const c = tr.cells; if (!c || c.length !== nh) continue;
      const g = i => i >= 0 ? (c[i].textContent || "").trim() : "";
      const d = g(iData);
      if (!/^\d{2}\/\d{2}\/\d{2,4}$/.test(d)) continue;
      linhas.push({ data: d, medio: g(iMedio), vunit: g(iVUnit), cfop: g(iCfop), lote: g(iLote), qtd: g(iQtd) });
    }
    // diagnóstico: distribuição de nº de células e amostra crua
    const dist={}; const amostra=[];
    for(const tr of trs){ const n=tr.cells?tr.cells.length:0; dist[n]=(dist[n]||0)+1;
      if(n>=8 && amostra.length<4) amostra.push([...tr.cells].map(c=>(c.textContent||"").trim().slice(0,18))); }
    return { hdr, nh, linhas, dist, amostra };
  });
}

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`garantirSessao falhou: ${e.message}`); await ctx.close().catch(() => {}); process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 0); }

try {
  const iDump = process.argv.indexOf("--dump");
  if (iDump > -1) {
    await trocarEmpresa(page, LOJA_TO_EMP[process.argv[iDump + 1]]);
    console.log(JSON.stringify(await movimento(page, process.argv[iDump + 2]), null, 1));
    await ctx.close(); process.exit(0);
  }

  const alvos = suspeitos().slice(0, MAX);
  const porLoja = {};
  for (const a of alvos) (porLoja[a.loja] = porLoja[a.loja] || []).push(a);
  log(`${alvos.length} suspeitos a confirmar (${Object.entries(porLoja).map(([l, v]) => l + ":" + v.length).join(" ")}) · ${Object.keys(cache.produtos).length} em cache`);

  let ok = 0, erro = 0;
  for (const [loja, lista] of Object.entries(porLoja)) {
    await trocarEmpresa(page, LOJA_TO_EMP[loja]);
    for (const a of lista) {
      try {
        const r = await movimento(page, a.cod);
        if (r.erro) { erro++; continue; }
        const ult = r.linhas[r.linhas.length - 1];
        const vendas = r.linhas.filter(l => /^5[0-9]{3}$/.test(l.cfop || ""));
        const ultVenda = vendas[vendas.length - 1];
        const comLote = r.linhas.filter(l => l.lote && l.lote !== "-").length;
        cache.produtos[`${loja}|${a.cod}`] = {
          data: isoHoje,
          movimentos_com_lote: comLote,
          custo_medio: ult ? numBR(ult.medio) : null,
          ultima_venda: ultVenda ? numBR(ultVenda.vunit) : null,
          ultima_venda_data: ultVenda ? ultVenda.data : null,
          movimentos: r.linhas.length,
        };
        ok++;
        if (ok % 10 === 0) { fs.writeFileSync(P_OUT, JSON.stringify(cache)); log(`  ...${ok}/${alvos.length}`); }
      } catch (e) { erro++; log(`  ${loja}|${a.cod} falhou: ${e.message.split("\n")[0]}`); }
    }
  }
  fs.writeFileSync(P_OUT, JSON.stringify(cache));
  log(`OK · ${ok} confirmados · ${erro} falhas · cache com ${Object.keys(cache.produtos).length} produtos`);
  await ctx.close().catch(() => {});
  process.exit(0);
} catch (e) {
  log(`FALHA (não-fatal): ${e.message}`);
  fs.writeFileSync(P_OUT, JSON.stringify(cache));
  await ctx.close().catch(() => {});
  process.exit(0);
}
