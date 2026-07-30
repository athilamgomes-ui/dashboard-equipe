#!/usr/bin/env node
/**
 * coleta_conferencia_caixa.mjs — coleta a Conferência Diária dos Caixas do Microvix
 * para as 4 lojas (L1=1, L3=3, L4=4, L5=10), dia a dia.
 *
 * Fonte no ERP: Faturamento > Loja > Relatórios > Conferência de Caixas
 *               faturamento/relatorio_conferencia_caixa.asp   (1 empresa + 1 dia por request)
 *
 * O relatório traz, POR OPERADOR DE CAIXA, cada forma de pagamento em três colunas:
 *   Valor Calculado (o que o ERP registrou)  ×  Valor Informado (o que a loja declarou
 *   no fechamento)  ×  Diferença. Mais sangria, suprimento e saldo inicial/final.
 *
 * ⚠️ CONSOLIDAÇÃO POR LOJA É FEITA AQUI, NÃO NO ERP.
 *   O checkbox "Listar conferência consolidada" do ERP NÃO junta operadores — continua
 *   listando um bloco por usuário. Em Itaituba (L3) as vendas saem no usuário `admitb`
 *   e o fechamento é lançado no `caixaitb`; olhando por operador aparece falta de 100%
 *   num e sobra de 100% no outro. Por isso somamos todos os operadores da loja no dia.
 *
 * Cache incremental: dias já coletados com data < hoje-MARGEM_DIAS não são recoletados
 * (a loja pode lançar o fechamento com atraso, daí a margem). Saída acumulada em
 * conferencia_caixa_raw.json.
 *
 * Uso:  node coleta_conferencia_caixa.mjs            (janela padrão, incremental)
 *       DIAS=90 node coleta_conferencia_caixa.mjs    (janela maior)
 *       FORCE_FULL=1 node coleta_conferencia_caixa.mjs  (ignora cache, recoleta tudo)
 *       ONLY_EMP=1 node ...                          (uma loja só, debug)
 *
 * stdout: nada (grava o JSON). stderr: log. Exit 0 = ok, 1 = falha.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const OUT = join(RAIZ, "conferencia_caixa_raw.json");
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const B = "https://linx.microvix.com.br/gestor_web/";
const URL_CONF = B + "faturamento/relatorio_conferencia_caixa.asp";
const URL_PLANOS = B + "faturamento/relat_fat_planos.asp";
const URL_RECEBER = B + "financeiro/relatorio_faturas_periodo.asp?tipolanc=receber&filtro_adm_cartao=S&lancamento=S";

const LOJAS = [
  { key: "L1", id: 1, nome: "Casa da Beleza Altamira" },
  { key: "L3", id: 3, nome: "Casa da Beleza Itaituba" },
  { key: "L4", id: 4, nome: "MissBeleza Altamira" },
  { key: "L5", id: 10, nome: "MissBeleza Santarém" },
];
const ALVO = process.env.ONLY_EMP ? LOJAS.filter(l => String(l.id) === process.env.ONLY_EMP) : LOJAS;

const DIAS = parseInt(process.env.DIAS || "45", 10);
const MARGEM_DIAS = 3;            // dias recentes sempre recoletados (fechamento atrasado)
const FORCE_FULL = process.env.FORCE_FULL === "1";

const log = (...a) => process.stderr.write("[conf-caixa] " + a.join(" ") + "\n");
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const br = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const isoParaBr = s => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

/** "1.234,56" → 1234.56 · "-" / "" → null */
function num(s) {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t || t === "-") return null;
  const v = parseFloat(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

// ── Linhas do relatório → chaves internas ────────────────────────────────────
const FORMAS = [
  [/^Total Dinheiro\s*\(\+\)/i, "dinheiro"],
  [/^Total Chq\.\s*Vista\s*\(\+\)/i, "chq_vista"],
  [/^Total Chq\.\s*Prazo\s*\(\+\)/i, "chq_prazo"],
  [/^Total Credi[áa]rio\s*\(\+\)/i, "crediario"],
  [/^Total Cart[ãa]o\s*\(\+\)/i, "cartao"],
  [/^Total Conv[êe]nio\s*\(\+\)/i, "convenio"],
  [/^Total PIX\s*\(\+\)/i, "pix"],
  [/^QR Linx\s*\(\+\)/i, "qrlinx"],
  [/^Total Dep[óo]sito Banc[áa]rio\s*\(\+\)/i, "deposito"],
  [/^Total Fidelidade\/Cashback\s*\(\+\)/i, "cashback"],
  [/^Total Link Pagamento\s*\(\+\)/i, "link_pgto"],
  [/^Sangria/i, "sangria"],
  [/^Suprimentos\s*\(\+\)/i, "suprimentos"],
  [/^Devolu[çc][õo]es\s*\(-\)/i, "devolucoes"],
];

/**
 * Faz o parse do innerText do relatório de conferência (1 loja, 1 dia).
 * Retorna { operadores:[...], consolidado:{...} }.
 */
export function parseConferencia(txt) {
  const linhas = txt.split("\n");
  const operadores = [];
  let atual = null;

  const fechaBloco = () => { if (atual) operadores.push(atual); atual = null; };

  for (let i = 0; i < linhas.length; i++) {
    const raw = linhas[i];
    const linha = raw.replace(/ /g, " ");
    const cols = linha.split("\t").map(c => c.trim());
    const head = cols[0] || "";

    // Cabeçalho de operador: "136870 - Marines.casadabeleza"
    const mOp = /^(\d{4,})\s*-\s*(.+?)$/.exec(head);
    if (mOp && /Detalhar Vendas/i.test(linha)) {
      fechaBloco();
      atual = {
        login_id: mOp[1],
        login: mOp[2].trim(),
        formas: {},
        cartao_administradoras: [],
        saldo_inicial: null,
        saldo_final: null,
        total: { calc: null, inf: null, dif: null },
      };
      continue;
    }
    if (!atual) continue;

    // Sublinha de administradora de cartão: "   STONE PAGAMENTOS*  2.611,22  0,00  -2.611,22"
    if (/^\s+/.test(raw) && cols.length >= 4 && !/Vendas \*|Recebimento de Faturas|Cart[ãa]o de (D[ée]bito|Cr[ée]dito)|^\s*(Dinheiro|PIX|Cart[ãa]o|Chq)/i.test(head)) {
      const nomeAdm = head.replace(/\*+$/, "").trim();
      const c = num(cols[1]);
      // "Faturas Baixadas pelo Financeiro" aparece indentado igual, mas não é administradora
      const ehAdm = nomeAdm && !/^Total/i.test(nomeAdm) && !/Faturas Baixadas|Recebimento de faturas/i.test(nomeAdm);
      if (ehAdm && c != null && /[A-Za-z]/.test(nomeAdm)) {
        atual.cartao_administradoras.push({ nome: nomeAdm, calc: c, inf: num(cols[2]) });
      }
      continue;
    }

    // Linhas de forma de pagamento (nível raiz, 3 colunas numéricas)
    if (!/^\s/.test(raw)) {
      for (const [re, chave] of FORMAS) {
        if (re.test(head)) {
          atual.formas[chave] = { calc: num(cols[1]), inf: num(cols[2]), dif: num(cols[3]) };
          break;
        }
      }
    }

    // "Totais" → a linha de valores vem logo abaixo, começando com tab
    if (/^Totais\s*$/i.test(head)) {
      for (let j = i + 1; j < Math.min(i + 4, linhas.length); j++) {
        const c2 = linhas[j].split("\t").map(c => c.trim());
        if (c2.length >= 4 && num(c2[1]) != null) {
          atual.total = { calc: num(c2[1]), inf: num(c2[2]), dif: num(c2[3]) };
          break;
        }
      }
    }

    const mSi = /Saldo Inicial\(em Dinheiro\):\s*R\$\s*(-?[\d.,]+)/i.exec(linha);
    if (mSi) atual.saldo_inicial = num(mSi[1]);
    const mSf = /Saldo Final\(em Dinheiro\):\s*R\$\s*(-?[\d.,]+)/i.exec(linha);
    if (mSf) atual.saldo_final = num(mSf[1]);
  }
  fechaBloco();

  // ── Consolidação por LOJA (soma todos os operadores) ──
  const cons = { formas: {}, total: { calc: 0, inf: 0, dif: 0 }, cartao_administradoras: {}, saldo_final: null };
  const chaves = new Set();
  operadores.forEach(o => Object.keys(o.formas).forEach(k => chaves.add(k)));
  for (const k of chaves) {
    let calc = 0, inf = 0;
    for (const o of operadores) {
      calc += o.formas[k]?.calc || 0;
      inf += o.formas[k]?.inf || 0;
    }
    cons.formas[k] = { calc: +calc.toFixed(2), inf: +inf.toFixed(2), dif: +(inf - calc).toFixed(2) };
  }
  for (const o of operadores) {
    cons.total.calc += o.total.calc || 0;
    cons.total.inf += o.total.inf || 0;
    for (const a of o.cartao_administradoras) {
      cons.cartao_administradoras[a.nome] = +((cons.cartao_administradoras[a.nome] || 0) + (a.calc || 0)).toFixed(2);
    }
  }
  cons.total.calc = +cons.total.calc.toFixed(2);
  cons.total.inf = +cons.total.inf.toFixed(2);
  cons.total.dif = +(cons.total.inf - cons.total.calc).toFixed(2);
  // saldo final em dinheiro: soma dos operadores que têm saldo
  const saldos = operadores.map(o => o.saldo_final).filter(v => v != null);
  cons.saldo_final = saldos.length ? +saldos.reduce((a, b) => a + b, 0).toFixed(2) : null;
  const saldosI = operadores.map(o => o.saldo_inicial).filter(v => v != null);
  cons.saldo_inicial = saldosI.length ? +saldosI.reduce((a, b) => a + b, 0).toFixed(2) : null;

  // ── Status do dia ──
  //   sem_movimento : ERP não registrou venda nenhuma (domingo/feriado)
  //   nao_fechado   : houve venda mas ninguém lançou o fechamento (informado zerado)
  //   ok            : fechou e bateu
  //   divergente    : fechou e sobrou/faltou
  const DIF_TOL = 0.01;
  let status;
  if (cons.total.calc === 0 && cons.total.inf === 0) status = "sem_movimento";
  else if (cons.total.inf === 0) status = "nao_fechado";
  else if (Math.abs(cons.formas.dinheiro?.dif || 0) <= DIF_TOL && Math.abs(cons.total.dif) <= DIF_TOL) status = "ok";
  else status = "divergente";
  cons.status = status;

  return { operadores, consolidado: cons };
}

// ── Coleta rápida: POST direto no listagem_conferencia_caixa.asp ────────────
// Recarregar a tela de filtros a cada consulta custava ~108s por item (45 dias × 4
// lojas = mais de 2h). O form posta em listagem_conferencia_caixa.asp; serializando
// o form UMA vez e mandando fetch por item, cai para poucos segundos.
// O HTML da resposta é injetado num container fora da tela (NÃO display:none — aí o
// innerText degrada para textContent e perde os \t que separam as colunas da tabela).
const URL_LISTAGEM = "https://linx.microvix.com.br/gestor_web/faturamento/listagem_conferencia_caixa.asp";

export async function prepararFormBase(page) {
  await page.goto(URL_CONF, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector('select[name="empresa"]', { timeout: 25000 });
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const form = document.querySelector('form[name="Form1"][action*="listagem_conferencia_caixa"]')
      || [...document.forms].find(f => /listagem_conferencia_caixa/.test(f.getAttribute("action") || ""));
    if (!form) throw new Error("form da conferência não encontrado");
    // Liga as opções que queremos em todas as consultas
    for (const n of ["listar_saldo_inicio_fim", "somar_recebimentos_faturas_por_forma_pagamento"]) {
      const e = form.querySelector(`[name="${n}"]`); if (e) e.checked = true;
    }
    const pares = [];
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === "checkbox" || el.type === "radio") { if (el.checked) pares.push([el.name, el.value]); continue; }
      if (el.tagName === "SELECT" && el.multiple) {
        [...el.selectedOptions].forEach(o => pares.push([el.name, o.value])); continue;
      }
      if (el.type === "button") continue;
      pares.push([el.name, el.value]);
    }
    // container off-screen (visível para o layout → innerText mantém os \t)
    if (!document.getElementById("__conf_box")) {
      const d = document.createElement("div");
      d.id = "__conf_box";
      d.style.cssText = "position:absolute;left:-99999px;top:0;width:1400px;";
      document.body.appendChild(d);
    }
    return pares;
  });
}

export async function coletarDiaRapido(page, base, empId, dataBr) {
  const txt = await page.evaluate(async ({ base, empId, dataBr, url }) => {
    const p = new URLSearchParams();
    for (const [k, v] of base) {
      if (k === "empresa") { p.append(k, String(empId)); continue; }
      if (k === "data") { p.append(k, dataBr); continue; }
      p.append(k, v);
    }
    p.set("empresa", String(empId));
    p.set("data", dataBr);
    const r = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: p.toString(),
    });
    // ⚠️ O Microvix serve as telas ASP em windows-1252, e `r.text()` assume UTF-8 quando o
    // header não traz charset. Sem isso "Cartão" vira "Cart�o" e os regexes de Cartão,
    // Crediário, Convênio, Depósito e Devoluções não casam — as formas COM ACENTO somem
    // silenciosamente do relatório (dinheiro e PIX passam, e o erro fica invisível).
    const buf = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "";
    let charset = (/charset=([\w-]+)/i.exec(ct) || [])[1];
    if (!charset) {
      const inicio = new TextDecoder("windows-1252").decode(buf.slice(0, 4096));
      charset = (/charset=([\w-]+)/i.exec(inicio) || [])[1] || "windows-1252";
    }
    let html;
    try { html = new TextDecoder(charset).decode(buf); }
    catch { html = new TextDecoder("windows-1252").decode(buf); }
    const box = document.getElementById("__conf_box");
    box.innerHTML = html;
    const t = box.innerText || "";
    box.innerHTML = "";
    return t;
  }, { base, empId, dataBr, url: URL_LISTAGEM });

  return interpretarResposta(txt, dataBr);
}

/**
 * Domingo/feriado: a loja não abre, o relatório volta sem nenhum bloco de operador
 * (e às vezes sem sequer o cabeçalho "Valor Calculado"). Isso é um dia SEM MOVIMENTO,
 * não um erro — tratar como erro faria todo domingo sumir do painel.
 * Só é erro de verdade quando a resposta não é o relatório (sessão caiu, página de erro).
 */
function interpretarResposta(txt, dataBr) {
  // Guarda de encoding: se o texto veio com caracteres de substituição, os rótulos
  // acentuados (Cartão, Crediário, Convênio, Depósito, Devoluções) não vão casar e as
  // formas somem sem erro nenhum. Falhar alto é melhor que publicar cartão zerado.
  if (/�/.test(txt)) {
    throw new Error(`resposta com encoding quebrado (${dataBr}) — charset do ERP não foi respeitado`);
  }
  if (/Valor Calculado/i.test(txt)) return parseConferencia(txt);

  const ehTelaDoRelatorio = /conferência dos caixas|conferencia dos caixas|conferência diária|Detalhar Vendas|Vendas Abortadas/i.test(txt);
  const pareceLoginOuErro = /Sess.o expirada|sessao_expirada|f_senha|lmxta-login|Erro interno|Runtime Error/i.test(txt);

  if (ehTelaDoRelatorio && !pareceLoginOuErro) {
    return {
      operadores: [],
      consolidado: {
        formas: {}, total: { calc: 0, inf: 0, dif: 0 },
        cartao_administradoras: {}, saldo_inicial: null, saldo_final: null,
        status: "sem_movimento",
      },
    };
  }
  throw new Error(`resposta do POST não parece o relatório de conferência (${dataBr}, ${txt.length} chars)`);
}

// ── Coleta de 1 (loja, dia) — caminho lento, via navegação (fallback) ────────
async function coletarDia(page, empId, dataBr) {
  await page.goto(URL_CONF, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector('select[name="empresa"]', { timeout: 20000 });
  await page.waitForTimeout(500);
  await page.evaluate(({ empId, dataBr }) => {
    const sel = document.getElementsByName("empresa")[0];
    if (sel) { sel.value = String(empId); sel.dispatchEvent(new Event("change", { bubbles: true })); }
    const d = document.getElementById("data");
    if (d) { d.disabled = false; d.value = dataBr; d.dispatchEvent(new Event("change", { bubbles: true })); }
    // Saldo inicial/final em dinheiro + recebimento de faturas somado nas formas
    for (const n of ["listar_saldo_inicio_fim", "somar_recebimentos_faturas_por_forma_pagamento"]) {
      const e = document.getElementsByName(n)[0]; if (e) e.checked = true;
    }
  }, { empId, dataBr });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {}),
    page.click('[name="Cadastrar"]').catch(() => {}),
  ]);
  await page.waitForTimeout(1600);
  const txt = await page.evaluate(() => (document.body.innerText || ""));
  return interpretarResposta(txt, dataBr);
}

// ── Mix de formas de pagamento por plano/bandeira (período, 1 request p/ 4 lojas) ──
async function coletarPlanos(page, di, df) {
  await page.goto(URL_PLANOS, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#data_i", { timeout: 20000 });
  await page.waitForTimeout(400);
  await page.evaluate(({ di, df, ids }) => {
    const s = (id, v) => { const e = document.getElementById(id); if (e) { e.disabled = false; e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); } };
    s("data_i", di); s("data_f", df);
    document.querySelectorAll('input[id^="empresas_"]').forEach(cb => { cb.checked = false; });
    for (const id of ids) { const e = document.getElementById("empresas_" + id); if (e) e.checked = true; }
  }, { di, df, ids: ALVO.map(l => l.id) });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {}),
    page.click('input[name="B1"]').catch(() => {}),
  ]);
  await page.waitForTimeout(1800);
  const txt = await page.evaluate(() => (document.body.innerText || ""));

  // Formato: blocos "Nome da Forma" → linhas "PLANO (id)\tvalor" → "Total da Forma" → "\tvalor\t%"
  const formas = [];
  let formaAtual = null;
  for (const linha of txt.split("\n")) {
    const cols = linha.split("\t").map(c => c.trim());
    const h = cols[0] || "";
    const mPlano = /^(.+?)\s*\((\d+)\)$/.exec(h);
    if (mPlano && num(cols[1]) != null) {
      if (formaAtual) formaAtual.planos.push({ nome: mPlano[1].trim(), id: mPlano[2], valor: num(cols[1]) });
      continue;
    }
    if (/^Total da Forma/i.test(h)) continue;
    if (/^Total Geral/i.test(h)) { formaAtual = null; continue; }
    if (h && !num(cols[1]) && cols.length <= 2 && !/^(Faturamento|Per[íi]odo|Vendedor|S[ée]rie|Usu[áa]rio|Empresa|Mostrar|Nome Plano|Valor|%)/i.test(h)) {
      formaAtual = { forma: h, planos: [], total: 0 };
      formas.push(formaAtual);
    }
  }
  for (const f of formas) f.total = +f.planos.reduce((a, p) => a + (p.valor || 0), 0).toFixed(2);
  return formas.filter(f => f.planos.length);
}

// ── Movimento Diário ANALÍTICO (documento a documento) ──────────────────────
// Base da conciliação de cartão contra o relatório da adquirente (InfinitePay etc.):
// sem o valor por documento não há como achar "venda no cartão que não passou na
// maquininha" nem "cobrança na maquininha sem venda".
// ⚠️ O innerText desse relatório quebra cada documento em várias linhas (célula com
// <br> e links). Extrair pelas <td> da tabela é o único jeito estável.
const URL_MOVDIARIO = B + "faturamento/relatorio_diario.asp";

async function coletarMovimentoDiario(page, empId, di, df) {
  await page.goto(URL_MOVDIARIO, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#empresas_" + empId, { timeout: 25000 });
  await page.waitForTimeout(700);
  await page.evaluate(({ di, df, empId }) => {
    const s = (id, v) => { const e = document.getElementById(id); if (e) { e.disabled = false; e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); } };
    s("f_datainicial", di); s("f_datafinal", df);
    document.querySelectorAll('input[id^="empresas_"]').forEach(cb => { cb.checked = false; });
    const e = document.getElementById("empresas_" + empId); if (e) e.checked = true;
    const an = [...document.getElementsByName("f_sintetico")].find(r => r.value === "A"); if (an) an.checked = true;
    const val = [...document.getElementsByName("ListarNotas")].find(r => r.value === "V"); if (val) val.checked = true;
  }, { di, df, empId });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 240000 }).catch(() => {}),
    page.click('input[name="B1"]').catch(() => {}),
  ]);
  await page.waitForTimeout(3500);

  return page.evaluate(() => {
    const n = s => { const t = String(s || "").replace(/\s/g, "").trim();
      if (!t || t === "-") return 0;
      const v = parseFloat(t.replace(/\./g, "").replace(",", ".")); return Number.isFinite(v) ? v : 0; };
    let alvo = null, cols = null;
    for (const t of document.querySelectorAll("table")) {
      for (const tr of t.querySelectorAll("tr")) {
        const cel = [...tr.children].map(c => (c.textContent || "").replace(/\s+/g, " ").trim());
        if (cel.some(c => /Valor do Documento/i.test(c)) && cel.some(c => /^Cart/i.test(c))) { alvo = t; cols = cel; break; }
      }
      if (alvo) break;
    }
    if (!alvo) return { erro: "tabela do movimento diário não encontrada" };
    const i = re => cols.findIndex(c => new RegExp(re, "i").test(c));
    const iDoc = i("Doc"), iVal = i("Valor do Documento"), iDin = i("^Dinheiro$"),
          iCar = i("^Cart"), iPix = i("^Pix$"), iLink = i("Link de Pagamento");
    // TODAS as colunas de forma de pagamento. Sem somar todas, um documento pago em
    // crediário ou convênio apareceria com "pagamentos < venda" e viraria inconsistência
    // falsa no cruzamento das 4 colunas.
    const COLS_PAG = ["^Dinheiro$", "^Ch\\.Vista$", "^Ch\\.Prazo$", "^Credi", "^Cart",
                      "^Conv[êe]nio$", "^Pix$", "^Dep[óo]sito Banc", "Fidelidade",
                      "QR Linx", "Link de Pagamento", "Outras Moedas"];
    const idxPag = COLS_PAG.map(r => i(r)).filter(x => x >= 0);
    const out = [];
    for (const tr of alvo.querySelectorAll("tr")) {
      const cel = [...tr.children].map(c => (c.textContent || "").replace(/\s+/g, " ").trim());
      const m = /^(\d{2})\/(\d{2})\/(\d{2,4})/.exec(cel[0] || "");
      if (!m) continue;
      const ano = m[3].length === 2 ? "20" + m[3] : m[3];
      out.push({
        d: `${ano}-${m[2]}-${m[1]}`,
        doc: (cel[iDoc] || "").replace(/\s*\|\s*/, "|"),
        v: n(cel[iVal]),
        din: n(cel[iDin]),
        car: n(cel[iCar]),
        pix: n(cel[iPix]),
        lnk: iLink >= 0 ? n(cel[iLink]) : 0,
        pag: +idxPag.reduce((a, j) => a + n(cel[j]), 0).toFixed(2),   // soma de TODAS as formas
      });
    }
    return { docs: out };
  });
}

// ── Recebível de cartão (o que ainda vai cair no banco), agrupado por administradora ──
async function coletarRecebivelCartao(page, di, df) {
  await page.goto(URL_RECEBER, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#data_inicial", { timeout: 20000 });
  await page.waitForTimeout(400);
  await page.evaluate(({ di, df, ids }) => {
    const s = (id, v) => { const e = document.getElementById(id); if (e) { e.disabled = false; e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); } };
    s("data_inicial", di); s("data_final", df);
    document.querySelectorAll('input[id^="empresas_"]').forEach(cb => { cb.checked = false; });
    for (const id of ids) { const e = document.getElementById("empresas_" + id); if (e) e.checked = true; }
    // Agrupa por VENCIMENTO. Tentei por cliente/fornecedor (cod_clientex) para separar por
    // administradora, mas o relatório não emitiu os subtotais por grupo. Por vencimento o
    // formato "Subtotal do grupo DD/MM/AAAA em reais" é estável — e responde a pergunta que
    // interessa: quanto cai no banco em cada dia.
    const r = document.getElementById("data_venc");
    if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
  }, { di, df, ids: ALVO.map(l => l.id) });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {}),
    page.click('input[name="Prosseguir"][type="submit"]').catch(() => {}),
  ]);
  await page.waitForTimeout(2500);
  const txt = await page.evaluate(() => (document.body.innerText || ""));

  // Cada bloco de vencimento fecha com:
  //   "Subtotal do grupo 01/07/2026 em reais\tR$ 6.560,19\tR$ 6.560,19"
  const porVencimento = [];
  for (const l of txt.split("\n")) {
    const m = /Subtotal do grupo\s+(\d{2}\/\d{2}\/\d{4})\s+em reais\s*\t*\s*R\$\s*([\d.,]+)/i.exec(l);
    if (m) {
      const [dd, mm, yyyy] = m[1].split("/");
      porVencimento.push({ data: `${yyyy}-${mm}-${dd}`, valor: num(m[2]) });
    }
  }
  porVencimento.sort((a, b) => (a.data < b.data ? -1 : 1));
  const mGeral = /Total Geral a Receber:\s*R\$\s*([\d.,]+)/i.exec(txt);
  const somaGrupos = +porVencimento.reduce((a, b) => a + (b.valor || 0), 0).toFixed(2);
  return {
    porVencimento,
    totalGeral: mGeral ? num(mGeral[1]) : somaGrupos,
    somaGrupos,   // se divergir do totalGeral, o parse perdeu algum bloco
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
// Só executa a coleta quando o arquivo é chamado direto. Importar o módulo
// (ex.: testar o parser) não dispara login nem navegação.
const EH_PRINCIPAL = process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1]);
if (!EH_PRINCIPAL) {
  // exporta só o parser
} else {

const hoje = new Date();
// Ordem: do MAIS RECENTE para o mais antigo. Se a coleta for interrompida no meio,
// o que já está no cache é justamente o período que mais interessa.
const dias = [];
for (let i = 0; i < DIAS; i++) {
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
  dias.push(iso(d));
}

const limiteRecoleta = iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - MARGEM_DIAS));

let cache = { dias: {} };
if (!FORCE_FULL && fs.existsSync(OUT)) {
  try { cache = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { log("cache corrompido — recoletando tudo"); }
  if (!cache.dias) cache.dias = {};
}

const pendentes = [];
for (const dia of dias) {
  for (const loja of ALVO) {
    const k = `${dia}|${loja.key}`;
    const jaTem = cache.dias[k];
    // recoleta se: não tem, ou é dia recente (fechamento pode ter sido lançado depois)
    if (!jaTem || dia >= limiteRecoleta) pendentes.push({ dia, loja, k });
  }
}
log(`janela ${dias[dias.length - 1]} → ${dias[0]} · ${dias.length} dias × ${ALVO.length} lojas (mais recente primeiro)`);
log(`${pendentes.length} coletas pendentes (${Object.keys(cache.dias).length} em cache)`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true });
const page = ctx.pages()[0] || (await ctx.newPage());
let erros = 0;

try {
  await garantirSessao(page, { log });

  // Serializa o form uma vez; se falhar, cai no caminho lento (navegação por item).
  let formBase = null;
  if (pendentes.length) {
    try {
      formBase = await prepararFormBase(page);
      log(`form serializado (${formBase.length} campos) — usando POST direto`);
    } catch (e) {
      log("não consegui serializar o form (" + String(e).slice(0, 80) + ") — caminho lento");
    }
  }

  let feitos = 0, seguidas = 0;
  for (const p of pendentes) {
    try {
      let r;
      try {
        r = formBase
          ? await coletarDiaRapido(page, formBase, p.loja.id, isoParaBr(p.dia))
          : await coletarDia(page, p.loja.id, isoParaBr(p.dia));
      } catch (e1) {
        // "Execution context was destroyed" = a página navegou no meio do evaluate (o ERP
        // às vezes redireciona sozinho). É transitório: reancora o form e tenta mais uma vez.
        if (!/Execution context was destroyed|context was destroyed/i.test(String(e1))) throw e1;
        log(`  retry ${p.k} (contexto destruído)`);
        await page.waitForTimeout(1500);
        formBase = await prepararFormBase(page);
        r = await coletarDiaRapido(page, formBase, p.loja.id, isoParaBr(p.dia));
      }
      seguidas = 0;
      cache.dias[p.k] = {
        data: p.dia,
        loja: p.loja.key,
        empresa: p.loja.id,
        ...r.consolidado,
        operadores: r.operadores.map(o => ({
          login: o.login, login_id: o.login_id,
          total: o.total,
          dinheiro: o.formas.dinheiro || null,
          sangria: o.formas.sangria || null,
        })),
      };
    } catch (e) {
      erros++; seguidas++;
      const msg = String(e);
      log(`FALHA ${p.k}: ${msg.slice(0, 120)}`);

      // O navegador morreu (tipicamente outra sessão/job subiu Playwright no MESMO
      // ~/.claude/microvix-profile e derrubou o nosso). Continuar só produz centenas de
      // falhas idênticas e mascara o problema — aborta na hora, preservando o cache.
      if (/Target page, context or browser has been closed|browser has been closed|Target closed/i.test(msg)) {
        fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
        log("ABORTANDO: o navegador foi fechado por fora.");
        log("Causa provável: outra sessão/job usando ~/.claude/microvix-profile ao mesmo tempo.");
        log("Cheque com: pgrep -fl chrome-headless-shell   (e ver a REGRA de concorrência do CLAUDE.md)");
        await ctx.close().catch(() => {});
        process.exit(1);
      }
      // Falhas seguidas demais = ERP fora do ar ou sessão perdida; não adianta insistir.
      if (seguidas >= 8) {
        fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
        log(`ABORTANDO: ${seguidas} falhas seguidas — ERP instável ou sessão perdida.`);
        await ctx.close().catch(() => {});
        process.exit(1);
      }
    }
    feitos++;
    if (feitos % 10 === 0) {
      log(`  ${feitos}/${pendentes.length} (${erros} erro(s)) · último: ${p.dia} ${p.loja.key}`);
      fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));   // checkpoint parcial
    }
  }

  // Extras do período visível (últimos 30 dias).
  // ⚠️ `dias` está do MAIS RECENTE para o mais antigo: dias[0] é hoje e dias[len-1] o mais
  // velho. Inverter isso manda data_inicial > data_final e o relatório volta vazio.
  const dFim = isoParaBr(dias[0]);
  const dIni = isoParaBr(dias[Math.min(dias.length - 1, 29)]);
  try {
    log("mix de planos de pagamento...");
    cache.planos = { periodo: { ini: dIni, fim: dFim }, formas: await coletarPlanos(page, dIni, dFim) };
  } catch (e) { log("planos falhou: " + String(e).slice(0, 120)); }

  // Movimento diário por documento, por loja — insumo da conciliação de cartão no painel.
  // Janela: do 1º dia do mês anterior até hoje (cobre o mês fechado + o corrente).
  try {
    const hj = new Date();
    const iniMov = br(new Date(hj.getFullYear(), hj.getMonth() - 1, 1));
    const fimMov = br(hj);
    cache.movimento = cache.movimento || {};
    for (const loja of ALVO) {
      log(`movimento diário ${loja.key} (${iniMov}–${fimMov})...`);
      try {
        const r = await coletarMovimentoDiario(page, loja.id, iniMov, fimMov);
        if (r.erro) { log(`  ${loja.key}: ${r.erro}`); continue; }
        cache.movimento[loja.key] = r.docs;
        log(`  ${loja.key}: ${r.docs.length} documentos`);
      } catch (e) { log(`  ${loja.key} falhou: ${String(e).slice(0, 100)}`); }
    }
    cache.movimentoPeriodo = { ini: iniMov, fim: fimMov };
  } catch (e) { log("movimento diário falhou: " + String(e).slice(0, 120)); }

  try {
    log("recebível de cartão...");
    const hj = new Date();
    const fim = new Date(hj.getFullYear(), hj.getMonth() + 3, 0);
    cache.recebivel = { periodo: { ini: br(hj), fim: br(fim) }, ...(await coletarRecebivelCartao(page, br(hj), br(fim))) };
  } catch (e) { log("recebível falhou: " + String(e).slice(0, 120)); }

  cache.geradoEm = new Date().toISOString();
  cache.geradoEmBR = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  cache.janela = { ini: dias[0], fim: dias[dias.length - 1] };
  cache.lojas = LOJAS;
  fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
  log(`OK → ${OUT} (${Object.keys(cache.dias).length} dias-loja, ${erros} erro(s))`);
} finally {
  await ctx.close();
}

// Coleta com muita falha não vira dashboard: melhor preservar a versão anterior (o .sh
// trata exit≠0 como "coleta falhou" e não sobrescreve nada).
if (pendentes.length > 0 && erros / pendentes.length > 0.3) {
  log(`FALHOU: ${erros}/${pendentes.length} coletas com erro (>30%)`);
  process.exit(1);
}
process.exit(0);

}
