#!/usr/bin/env node
/**
 * coleta_financeiro.mjs — coleta o lado "sai" (contas a pagar) e "entra" (a receber)
 * do módulo financeiro do Microvix, por loja (L1=1, L3=3, L4=4, L5=10).
 *
 * Para CADA loja e CADA tipo (pagar/receber):
 *   - relatório de faturas por período, AGRUPADO POR CONTA DÉBITO (dá o DRE)
 *   - janela = 1º dia do mês anterior até último dia de (mês corrente + 3)
 *   - parse: categorias (subtotais), faturas individuais (venc/valor/status), total geral
 *
 * Saída JSON no stdout:
 *   { geradoEm, geradoEmBR, janela:{ini,fim}, lojas:{ L1:{pagar,receber}, L3, L4, L5 } }
 * onde pagar/receber = { totalGeral, qtd, categorias:[{cod,nome,valor}], faturas:[{venc,valor,status}] }
 *
 * Uso: node coleta_financeiro.mjs            (stdout JSON)
 *      ONLY_EMP=1 node coleta_financeiro.mjs (só uma loja, debug)
 *      DEBUG_TXT=1 ...                        (salva innerText em /tmp p/ inspeção)
 *
 * NÃO grava em lugar nenhum — quem consome é o build_financeiro.mjs (dados baked-in no HTML).
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import fs from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_BASE = "https://linx.microvix.com.br/gestor_web/financeiro/relatorio_faturas_periodo.asp?ParametroParaFavoritos=";

const ALL = [
  { key: "L1", id: 1 }, { key: "L3", id: 3 }, { key: "L4", id: 4 }, { key: "L5", id: 10 },
];
const EMPRESAS = process.env.ONLY_EMP ? ALL.filter(e => String(e.id) === process.env.ONLY_EMP) : ALL;
// Grupo vende tudo à vista (PIX/dinheiro/cartão antecipado) → "a receber" não é relevante. Só pagar.
const TIPOS = ["pagar"];

const log = (...a) => process.stderr.write("[financeiro] " + a.join(" ") + "\n");
const pad = n => String(n).padStart(2, "0");

// ── Janela: 1º dia do mês anterior → último dia de (mês corrente + 3) ──
function janela() {
  const h = new Date();
  const ini = new Date(h.getFullYear(), h.getMonth() - 1, 1);
  const fimM = new Date(h.getFullYear(), h.getMonth() + 4, 0); // dia 0 do mês+4 = último dia de mês+3
  const f = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return { ini: f(ini), fim: f(fimM) };
}
const JAN = janela();

const brToNum = s => parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;
const vencISO = (dd, mm, yyyy) => `${yyyy}-${mm}-${dd}`;

// ── FATURAS PAGAS (saída real de caixa): relatório recebidas.asp lado pagar, filtra por data de pagamento ──
const URL_PAGAS = "https://linx.microvix.com.br/gestor_web/financeiro/relatorio_faturas_periodo_recebidas.asp?ParametroParaFavoritos=pagar";
const nowC = new Date();
const mesKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const MES_ATUAL_C = mesKey(nowC);
const MES_ANT_C = mesKey(new Date(nowC.getFullYear(), nowC.getMonth() - 1, 1));
function mesRange(mk) { const [y, m] = mk.split("-").map(Number); const last = new Date(y, m, 0).getDate(); return { ini: `01/${pad(m)}/${y}`, fim: `${pad(last)}/${pad(m)}/${y}` }; }

// Total pago (com juros = saída real) num período de pagamento, para uma loja.
async function coletarPago(page, empId, ini, fim, centrocusto = 0) {
  await page.goto(URL_PAGAS, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#empresas_" + empId, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.evaluate(({ ini, fim, empId, centrocusto }) => {
    const setV = (id, v) => { const e = document.getElementById(id); if (e) { e.disabled = false; e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); } };
    setV("data_inicial", ini); setV("data_final", fim);
    document.querySelectorAll('input[id^="empresas_"]').forEach(cb => { cb.checked = false; });
    const e1 = document.getElementById("empresas_" + empId); if (e1) e1.checked = true;
    const rp = document.getElementsByName("receber_ou_pagar")[0]; if (rp) rp.value = "pagar";
    if (centrocusto) { for (const id of ["centrocusto", "cc"]) { const el = document.getElementById(id); if (el) { el.value = String(centrocusto); el.dispatchEvent(new Event("change", { bubbles: true })); } } }
  }, { ini, fim, empId, centrocusto });
  await page.evaluate(() => { const r = document.getElementById("conta_debito"); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } });
  await page.waitForTimeout(300);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {}),
    page.click('input[name="Prosseguir"][type="submit"]').catch(() => {}),
  ]);
  await page.waitForTimeout(2000);
  const text = await page.evaluate(() => (document.body.innerText || "").replace(/\r/g, ""));
  const tp = text.match(/Total Pago:\s*R\$\s*([\d.]+,\d{2})/i);
  // subtotais por categoria: "Total faturas baixadas na Conta Débito NOME: valor"
  const categorias = [];
  const catRe = /Total faturas baixadas na Conta Débito\s+(.+?)\s*:\s*R?\$?\s*([\d.]+,\d{2})/g;
  let m; while ((m = catRe.exec(text)) !== null) categorias.push({ nome: m[1].trim(), valor: brToNum(m[2]) });
  return { total: tp ? brToNum(tp[1]) : 0, categorias };
}

async function gerarRelatorio(page, tipo, empId, centrocusto = 0) {
  await page.goto(URL_BASE + tipo, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#empresas_" + empId, { timeout: 15000 });
  await page.waitForTimeout(400);

  await page.evaluate(({ ini, fim, empId, tipo, centrocusto }) => {
    const setV = (id, v) => { const e = document.getElementById(id); if (e) { e.disabled = false; e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); } };
    // TOGGLE pagar/receber: campo hidden `receber_ou_pagar` (vazio = pagar por padrão)
    const rp = document.getElementsByName("receber_ou_pagar")[0];
    if (rp) { rp.value = tipo; rp.dispatchEvent(new Event("change", { bubbles: true })); }
    setV("data_inicial", ini); setV("data_final", fim);
    // desligar filtro de vencimento extra (usamos data_inicial/final como período de vencimento exibido)
    const chk = document.getElementById("filtrar_data_vencimento");
    if (chk) { chk.checked = false; chk.dispatchEvent(new Event("change", { bubbles: true })); }
    // marca só a empresa desejada
    document.querySelectorAll('input[id^="empresas_"]').forEach(cb => { cb.checked = false; });
    const emp = document.getElementById("empresas_" + empId); if (emp) emp.checked = true;
    // agrupar por Conta Débito → subtotais por categoria (o DRE)
    const r = document.getElementById("conta_debito"); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
    // filtro opcional de centro de custo (3 = Custo Fixo)
    if (centrocusto) { const cc = document.getElementById("centrocusto"); if (cc) { cc.value = String(centrocusto); cc.dispatchEvent(new Event("change", { bubbles: true })); } }
    // status = todos (default)
  }, { ini: JAN.ini, fim: JAN.fim, empId, tipo, centrocusto });

  await page.waitForTimeout(300);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {}),
    page.click('input[name="Prosseguir"][type="submit"]').catch(async () => {
      await page.evaluate(() => { document.querySelector('input[type="submit"],button[type="submit"]')?.click(); });
    }),
  ]);
  await page.waitForTimeout(2500);

  const text = await page.evaluate(() => (document.body.innerText || "").replace(/\r/g, ""));
  if (process.env.DEBUG_TXT) fs.writeFileSync(`/tmp/fin_${tipo}_${empId}.txt`, text);
  return parseRelatorio(text);
}

const HOJE = (() => { const h = new Date(); return `${h.getFullYear()}-${pad(h.getMonth() + 1)}-${pad(h.getDate())}`; })();
// Segunda-feira (ISO) da semana de uma data ISO — chave de bucket semanal do fluxo
function segunda(iso) {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  const dow = (dt.getDay() + 6) % 7; // 0=segunda
  dt.setDate(dt.getDate() - dow);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}
const r2 = n => Math.round(n * 100) / 100;

function parseRelatorio(text) {
  let m;
  // 1) Categorias (subtotais por Conta Débito) — base do DRE
  const categorias = [];
  const catRe = /Subtotal do grupo\s+(\d+)-(.+?)\s+em\s+[Rr]eais?\s+R\$\s*([\d.]+,\d{2})/g;
  while ((m = catRe.exec(text)) !== null) categorias.push({ cod: parseInt(m[1], 10), nome: m[2].trim(), valor: brToNum(m[3]) });
  // 2) Total geral + qtd
  const tg = text.match(/Total Geral (?:a Pagar|a Receber):?\s*R?\$?\s*([\d.]+,\d{2})/i);
  const qt = text.match(/Quantidade de Faturas\s*:?\s*(\d+)/i);
  // 3) Faturas: "DD/MM/AAAA \t n/m \t R$ valor" → (linha seg.) "R$ valor \t NOME (cod) ... status"
  const faturas = [];
  const fatRe = /(\d{2})\/(\d{2})\/(\d{4})\t\d+\/\d+\tR\$\s*([\d.]+,\d{2})[\s\S]{0,130}?([A-Za-zÀ-ÿ0-9][^\t\n(]{2,70}?)\s*\((\d+)\)[\s\S]{0,150}?(Em aberto|Pago|Compensado)/g;
  while ((m = fatRe.exec(text)) !== null) {
    faturas.push({
      venc: vencISO(m[1], m[2], m[3]), valor: brToNum(m[4]),
      nome: m[5].trim().replace(/\s+/g, " "),
      status: m[7] === "Em aberto" ? "aberto" : (m[7] === "Pago" ? "pago" : "compensado"),
    });
  }
  // ── Agregações compactas (mês, semana, atrasado, top contrapartes) ──
  const porMes = {}, porSemana = {}, porContraparte = {};
  let atrasadoValor = 0, atrasadoQtd = 0, abertoValor = 0;
  for (const f of faturas) {
    const mes = f.venc.slice(0, 7);
    porMes[mes] = porMes[mes] || { total: 0, aberto: 0 };
    porMes[mes].total = r2(porMes[mes].total + f.valor);
    const aberto = f.status === "aberto";
    if (aberto) {
      porMes[mes].aberto = r2(porMes[mes].aberto + f.valor);
      abertoValor = r2(abertoValor + f.valor);
      const sem = segunda(f.venc);
      porSemana[sem] = r2((porSemana[sem] || 0) + f.valor);
      porContraparte[f.nome] = r2((porContraparte[f.nome] || 0) + f.valor);
      if (f.venc < HOJE) { atrasadoValor = r2(atrasadoValor + f.valor); atrasadoQtd++; }
    }
  }
  const topContrapartes = Object.entries(porContraparte)
    .sort((a, b) => b[1] - a[1]).slice(0, 10).map(([nome, valor]) => ({ nome, valor }));
  return {
    totalGeral: tg ? brToNum(tg[1]) : r2(faturas.reduce((s, f) => s + f.valor, 0)),
    qtd: qt ? parseInt(qt[1], 10) : faturas.length,
    abertoValor, atrasadoValor, atrasadoQtd,
    categorias, porMes, porSemana, topContrapartes,
    nFaturas: faturas.length,
  };
}

async function main() {
  const t0 = Date.now();
  log(`janela vencimento: ${JAN.ini} → ${JAN.fim}`);
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  try {
    await garantirSessao(page, { log });
  } catch (e) {
    log(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
    await ctx.close().catch(() => {});
    process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
  }

  const lojas = {};
  let ok = 0;
  for (const emp of EMPRESAS) {
    lojas[emp.key] = {};
    for (const tipo of TIPOS) {
      try {
        const r = await gerarRelatorio(page, tipo, emp.id);
        lojas[emp.key][tipo] = r;
        log(`${emp.key} ${tipo}: total=${r.totalGeral} qtd=${r.qtd} parse=${r.nFaturas} aberto=${r.abertoValor} atrasado=${r.atrasadoValor}(${r.atrasadoQtd}) cats=${r.categorias.length} top=${r.topContrapartes[0]?.nome || "-"}`);
        ok++;
      } catch (e) {
        log(`ERRO ${emp.key} ${tipo}: ${e.message}`);
        lojas[emp.key][tipo] = null;
      }
    }
    // FATURAS PAGAS (saída real de caixa) — mês anterior + mês atual, por data de pagamento.
    // Guardamos as CATEGORIAS pagas por mês; o build calcula o custo fixo (folha+ocupação+serviços,
    // excluindo mercadoria/impostos/financiamento — cc=3 do ERP "vaza" mercadoria, não serve).
    const pago = { porMes: {}, catPorMes: {} };
    for (const mk of [MES_ANT_C, MES_ATUAL_C]) {
      const { ini, fim } = mesRange(mk);
      try {
        const r = await coletarPago(page, emp.id, ini, fim);
        pago.porMes[mk] = r.total;
        pago.catPorMes[mk] = r.categorias;
      } catch (e) { log(`ERRO ${emp.key} pago ${mk}: ${e.message}`); pago.porMes[mk] = null; }
    }
    lojas[emp.key].pago = pago;
    log(`${emp.key} pago: ${MES_ANT_C}=${pago.porMes[MES_ANT_C]} ${MES_ATUAL_C}=${pago.porMes[MES_ATUAL_C]}`);

    // CUSTO FIXO A VENCER = relatório "Faturas a Pagar" filtrado por Centro de Custo = Custo Fixo (3).
    // (o filtro cc=3 FUNCIONA no a-pagar; é o que o usuário usa no ERP). Dá o custo fixo lançado por mês.
    const cfAberto = { porMes: {} };
    try {
      const r = await gerarRelatorio(page, "pagar", emp.id, 3);
      for (const [mk, v] of Object.entries(r.porMes)) cfAberto.porMes[mk] = v.aberto || 0;
    } catch (e) { log(`ERRO ${emp.key} custofixo a-vencer: ${e.message}`); }
    lojas[emp.key].custoFixoAberto = cfAberto;
    log(`${emp.key} custofixo(a vencer cc3): ${Object.entries(cfAberto.porMes).map(([k, v]) => k + "=" + Math.round(v)).join(" ")}`);
  }
  await ctx.close().catch(() => {});

  if (ok === 0) { log("FATAL: nada coletado"); process.exit(1); }
  const now = new Date();
  const out = {
    geradoEm: now.toISOString(),
    geradoEmBR: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    janela: JAN,
    lojas,
  };
  log(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.stdout.write(JSON.stringify(out));
}
main().catch(e => { log("FATAL: " + e.message); process.exit(1); });
