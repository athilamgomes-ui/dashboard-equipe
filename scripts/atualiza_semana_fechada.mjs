#!/usr/bin/env node
/**
 * atualiza_semana_fechada.mjs — grava a RECOLETA FINAL de uma semana FECHADA
 * (janela completa, incluindo o sábado inteiro) em DADOS[mes][Lx] no painel e
 * em VENDAS_HIST[Lx] no loja.html.
 *
 * POR QUE EXISTE (21/09/2026): o pipeline determinístico (build_premiacao.mjs)
 * só toca a semana CORRENTE e aborta por imutabilidade se uma semana anterior
 * mudar. Mas o último run de sábado acontece às 16h, com a loja ainda aberta —
 * a semana fechava com a tarde de sábado faltando. O SKILL do cron manda refazer
 * "a coleta FINAL da semana fechada" ANTES de congelar, e isso era feito editando
 * o HTML na mão. Este script faz esse passo de forma determinística e validada,
 * como o congelar_semana.mjs fez com o congelamento.
 *
 * Uso:
 *   node atualiza_semana_fechada.mjs <mesKey> <semId> <etapa1.json> <cliente8.json> [--dry] [--commit "txt"]
 *   ex: node atualiza_semana_fechada.mjs 2026-09 S3 /tmp/s3_etapa1.json /tmp/s3_cliente8.json --dry
 *
 * ORDEM CORRETA:  recoleta → ESTE script → congelar_semana.mjs
 *
 * GUARDAS (aborta sem gravar):
 *  - semana JÁ congelada em HISTORICO_PREMIOS → imutável, recoleta proibida;
 *  - semId == semana_atual → é trabalho do build, não deste script;
 *  - semana ainda não fechou (df >= hoje);
 *  - queda de faturamento > 2% em qualquer loja → coleta suspeita/parcial;
 *  - qualquer semana DIFERENTE de semId mudou após a edição;
 *  - '},,' ou <script> que não compila.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO = "/Users/elkgomes/Desktop/claude/dashboard-equipe";
const PAINEL = path.join(REPO, "dashboard_premiacao.html");
const LOJA = path.join(REPO, "loja.html");
const LOJAS = ["L1", "L3", "L4", "L5"];

const mesKey = process.argv[2];
const semId = process.argv[3];
const arqE1 = process.argv[4];
const arqC8 = process.argv[5];
const DRY = process.argv.includes("--dry");
const ci = process.argv.indexOf("--commit");
const COMENTARIO = ci > -1 ? process.argv[ci + 1] : "";
if (!mesKey || !semId || !arqE1) {
  console.error('uso: atualiza_semana_fechada.mjs <mesKey> <semId> <etapa1.json> <cliente8.json> [--dry] [--commit "txt"]');
  process.exit(3);
}
const die = (m, c = 1) => { console.error("ABORTADO: " + m); process.exit(c); };

// ── helpers (mesma semântica do build_premiacao.mjs) ───────────────────────
const r1 = (n) => Number((Math.round(n * 10) / 10).toFixed(1));
const jsKey = (n) => (/^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(n) ? n : `'${String(n).replace(/'/g, "\\'")}'`);
const somaObj = (o) => Object.values(o || {}).reduce((s, v) => s + (Number(v) || 0), 0);
const fromBR = (s) => { const [d, m, a] = s.split("/").map(Number); return new Date(a, m - 1, d); };

function matchBrace(src, openIdx) {
  const open = src[openIdx], close = open === "{" ? "}" : "]";
  let depth = 0, mode = null;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (mode === "'" || mode === '"' || mode === "`") { if (c === "\\") { i++; continue; } if (c === mode) mode = null; continue; }
    if (mode === "//") { if (c === "\n") mode = null; continue; }
    if (mode === "/*") { if (c === "*" && n === "/") { mode = null; i++; } continue; }
    if (c === "'" || c === '"' || c === "`") { mode = c; continue; }
    if (c === "/" && n === "/") { mode = "//"; i++; continue; }
    if (c === "/" && n === "*") { mode = "/*"; i++; continue; }
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") { depth--; if (depth === 0 && c === close) return i; }
  }
  throw new Error("matchBrace: fim do arquivo sem fechar");
}
function extractConst(html, nome) {
  const m = html.indexOf(`const ${nome} = `);
  if (m < 0) throw new Error(`const ${nome} não encontrado`);
  const openIdx = html.indexOf("{", m);
  const closeIdx = matchBrace(html, openIdx);
  const objText = html.slice(openIdx, closeIdx + 1);
  return { start: openIdx, end: closeIdx + 1, objText, obj: Function(`"use strict";return (${objText});`)() };
}
function subRegion(html, from, to, chaveRegex) {
  const m = html.slice(from, to).match(chaveRegex);
  if (!m) return null;
  const open = from + m.index + m[0].length - 1;
  return { open, close: matchBrace(html, open) };
}
function emitirObj(obj, ordem, ints = true) {
  const parts = [];
  const emit = (k, v) => parts.push(`${jsKey(k)}:${ints ? Math.round(v) : r1(v)}`);
  if (obj.Outros != null) emit("Outros", obj.Outros);
  for (const n of ordem) if (n !== "Outros" && obj[n] != null) emit(n, obj[n]);
  for (const [k, v] of Object.entries(obj)) if (k !== "Outros" && !ordem.includes(k)) emit(k, v);
  return `{${parts.join(",")}}`;
}
function upsertInlineKey(inner, sid, valorTxt) {
  const re = new RegExp(`(\\b${sid}:)(-?[\\d.]+|\\{[^}]*\\})`);
  if (re.test(inner)) return inner.replace(re, `$1${valorTxt}`);
  return inner.replace(/\s*$/, "") + `${inner.trim() === "" ? "" : ","}${sid}:${valorTxt}`;
}

// ── entrada ────────────────────────────────────────────────────────────────
const etapa1 = JSON.parse(fs.readFileSync(arqE1, "utf8"));
let cliente8 = {};
try { cliente8 = JSON.parse(fs.readFileSync(arqC8 || "", "utf8")); } catch { /* sem subtração */ }

let painel = fs.readFileSync(PAINEL, "utf8");
let loja = fs.readFileSync(LOJA, "utf8");
const DADOS0 = extractConst(painel, "DADOS").obj;
const LOJAS_BASE = extractConst(painel, "LOJAS_BASE").obj;
const HP = extractConst(painel, "HISTORICO_PREMIOS").obj;

const mesAntes = DADOS0[mesKey];
if (!mesAntes) die(`mês ${mesKey} sem estrutura no painel`);
if (mesAntes.semana_atual === semId) die(`${semId} é a semana CORRENTE — quem atualiza é o build_premiacao.mjs`);

const semMeta = (mesAntes.L1.semanas || []).find((s) => s.id === semId);
if (!semMeta) die(`semana ${semId} não existe em ${mesKey}`);
const mm = semMeta.periodo.match(/(\d{2})\/(\d{2})\s*(?:–|—|-|a)\s*(\d{2})\/(\d{2})/);
if (!mm) die(`periodo ilegível: ${semMeta.periodo}`);
const ano = Number(mesKey.slice(0, 4));
const dfD = fromBR(`${mm[3]}/${mm[4]}/${ano}`);
const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
if (dfD >= hoje) die(`semana ${semId} (${semMeta.periodo}) ainda NÃO fechou — recoleta final só depois do fim da janela`);

for (const L of LOJAS) {
  if (HP[mesKey]?.[L]?._pool && semId in HP[mesKey][L]._pool) {
    die(`${L} ${semId} JÁ está congelada em HISTORICO_PREMIOS — semana fechada é IMUTÁVEL. Nada foi alterado.`, 2);
  }
  if (!etapa1[L] || typeof etapa1[L][semId] !== "object") die(`coleta incompleta: ${L}.${semId} ausente no etapa1.json`);
}

// ── cliente 8 (venda entre lojas): subtrai do Outros ───────────────────────
// MESMA semântica do aplicarCliente8() do build_premiacao.mjs — inclusive apagar
// a chave Outros quando zera (senão o diff foge do padrão dos commits de cron) e
// descontar as PEÇAS/TICKETS da venda entre lojas (invariante: cliente 8 fora de
// todo total, em valor E em volume).
const avisos = [];
for (const L of LOJAS) {
  const c8 = cliente8?.[L]?.[semId];
  if (!c8 || !(c8.valor > 0)) continue;
  const v = etapa1[L][semId];
  const outros = v.Outros || 0;
  if (c8.valor <= outros) {
    v.Outros = Math.round(outros - c8.valor);
    if (v.Outros === 0) delete v.Outros;
  } else {
    avisos.push(`cliente 8 em ${L}/${semId} = R$${c8.valor.toFixed(2)} > Outros (R$${Math.round(outros)}) — Outros zerado; REVISAR quem registrou a venda entre lojas`);
    if (outros > 0) delete v.Outros;
  }
  const pec = etapa1[L][`${semId}_pecas`];
  if (pec?.Outros != null) { pec.Outros = Math.max(0, pec.Outros - (c8.qtde || 0)); if (pec.Outros === 0) delete pec.Outros; }
  const tk = etapa1[L][`${semId}_tickets`];
  if (tk?.Outros != null) { tk.Outros = Math.max(0, tk.Outros - (c8.vendas || 0)); if (tk.Outros === 0) delete tk.Outros; }
}

// ── relatório antes/depois + sanity ────────────────────────────────────────
console.log(`=== RECOLETA FINAL ${mesKey} ${semId} (${semMeta.periodo})${DRY ? "  [DRY-RUN]" : ""} ===\n`);
const calc = {};
for (const L of LOJAS) {
  const antes = mesAntes[L].vendas[semId] || {};
  const depois = etapa1[L][semId];
  const tA = Math.round(somaObj(antes)), tD = Math.round(somaObj(depois));
  const meta = (mesAntes[L].semanas.find((s) => s.id === semId) || {}).meta || 0;
  const delta = tD - tA;
  const queda = tA > 0 ? (delta / tA) * 100 : 0;
  if (queda < -2) die(`${L}: recoleta R$${tD} é ${r1(-queda)}% MENOR que o gravado R$${tA} — coleta parcial/suspeita, nada gravado`);
  const ordem = [...new Set([...Object.keys(antes).filter((n) => n !== "Outros"), ...(LOJAS_BASE[L]?.vendedoras || [])])];
  calc[L] = { ordem, depois, tA, tD, meta };
  console.log(`${L}  R$${tA.toLocaleString("pt-BR")} → R$${tD.toLocaleString("pt-BR")}  (${delta >= 0 ? "+" : ""}R$${delta.toLocaleString("pt-BR")})  · meta R$${meta.toLocaleString("pt-BR")} · ${r1((tA / meta) * 100)}% → ${r1((tD / meta) * 100)}%`);
  for (const n of [...new Set([...Object.keys(antes), ...Object.keys(depois)])]) {
    const a = Math.round(antes[n] || 0), d = Math.round(depois[n] || 0);
    if (a !== d) console.log(`     ${n.padEnd(12)} ${String(a).padStart(7)} → ${String(d).padStart(7)}`);
  }
  console.log("");
}
for (const a of avisos) console.log("AVISO: " + a);

// ── cirurgia no painel (DADOS[mes][Lx]) ────────────────────────────────────
const dadosSpan = extractConst(painel, "DADOS");
const reg = subRegion(painel, dadosSpan.start, dadosSpan.end, new RegExp(`'${mesKey}':\\s*\\{`));
if (!reg) die(`região '${mesKey}' não encontrada no DADOS do painel`);
let regTxt = painel.slice(reg.open, reg.close + 1);

for (const L of LOJAS) {
  const c = calc[L];
  const lreg = subRegion(regTxt, 0, regTxt.length, new RegExp(`\\n\\s{4}${L}:\\s*\\{`));
  if (!lreg) die(`bloco ${L} não encontrado na região ${mesKey}`);
  let ltxt = regTxt.slice(lreg.open, lreg.close + 1);

  const vreg = subRegion(ltxt, 0, ltxt.length, /\n\s*vendas:\s*\{/);
  if (!vreg) die(`vendas{} não encontrado em ${L}/${mesKey}`);
  let vtxt = ltxt.slice(vreg.open, vreg.close + 1);
  const reLinha = new RegExp(`(\\n\\s*)${semId}:\\{[^\\n]*?\\},?`);
  if (!reLinha.test(vtxt)) die(`linha ${semId} não encontrada em vendas de ${L} — formato inesperado`);
  vtxt = vtxt.replace(reLinha, `$1${semId}:${emitirObj(c.depois, c.ordem)},`);
  ltxt = ltxt.slice(0, vreg.open) + vtxt + ltxt.slice(vreg.close + 1);

  for (const [campo, dadosCampo, ints] of [
    ["tickets", etapa1[L][`${semId}_tickets`], true],
    ["pecas", etapa1[L][`${semId}_pecas`], true],
    ["cmv", etapa1[L][`${semId}_cmv`], false],
  ]) {
    if (!dadosCampo || !Object.keys(dadosCampo).length) continue;
    const objTxt = emitirObj(dadosCampo, c.ordem, ints);
    ltxt = ltxt.replace(new RegExp(`(\\n\\s*${campo}:\\s*\\{)(.*?)(\\},?)(?=\\n)`, "s"), (m0, a, inner, z) => {
      if (inner.includes("\n")) return m0;
      return a + upsertInlineKey(inner, semId, objTxt).replace(/\s+$/, " ") + z;
    });
  }
  regTxt = regTxt.slice(0, lreg.open) + ltxt + regTxt.slice(lreg.close + 1);
}
painel = painel.slice(0, reg.open) + regTxt + painel.slice(reg.close + 1);

// ── cirurgia no loja.html (VENDAS_HIST[Lx].vendas) ─────────────────────────
{
  const span = extractConst(loja, "VENDAS_HIST");
  let bloco = loja.slice(span.start, span.end);
  for (const L of LOJAS) {
    const c = calc[L];
    const lreg = subRegion(bloco, 0, bloco.length, new RegExp(`${L}:\\s*\\{`));
    if (!lreg) die(`bloco ${L} não encontrado em VENDAS_HIST`);
    let ltxt = bloco.slice(lreg.open, lreg.close + 1);
    const vreg = subRegion(ltxt, 0, ltxt.length, /\n\s*vendas:\s*\{/);
    if (!vreg) die(`VENDAS_HIST.${L}.vendas não encontrado`);
    let vtxt = ltxt.slice(vreg.open, vreg.close + 1);
    const reLinha = new RegExp(`(\\n\\s*)${semId}:\\{[^\\n]*?\\},?`);
    if (!reLinha.test(vtxt)) die(`linha ${semId} não encontrada em VENDAS_HIST.${L}.vendas`);
    vtxt = vtxt.replace(reLinha, `$1${semId}:${emitirObj(c.depois, c.ordem)},`);
    ltxt = ltxt.slice(0, vreg.open) + vtxt + ltxt.slice(vreg.close + 1);
    bloco = bloco.slice(0, lreg.open) + ltxt + bloco.slice(lreg.close + 1);
  }
  loja = loja.slice(0, span.start) + bloco + loja.slice(span.end);
}

// ── VALIDAÇÃO antes de gravar ──────────────────────────────────────────────
for (const [nome, html] of [["dashboard_premiacao.html", painel], ["loja.html", loja]]) {
  if (html.includes("},,")) die(`vírgula dupla '},,' gerada em ${nome}`);
  for (const [i, m] of [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].entries()) {
    try { new Function(m[1]); } catch (e) { die(`${nome} <script> bloco ${i} inválido: ${e.message}`); }
  }
}
const mesDepois = extractConst(painel, "DADOS").obj[mesKey];
for (const L of LOJAS) {
  for (const [sid, v] of Object.entries(mesAntes[L].vendas || {})) {
    if (sid === semId) continue;
    if (JSON.stringify(v) !== JSON.stringify(mesDepois[L].vendas[sid]))
      die(`IMUTABILIDADE VIOLADA: ${L}.vendas.${sid} mudou — nada gravado`);
  }
  const got = Math.round(somaObj(mesDepois[L].vendas[semId]));
  if (got !== calc[L].tD) die(`${L}: pós-edição ${semId} = R$${got}, esperado R$${calc[L].tD}`);
}
const vhDepois = extractConst(loja, "VENDAS_HIST").obj;
for (const L of LOJAS) {
  const got = Math.round(somaObj(vhDepois[L].vendas[semId]));
  if (got !== calc[L].tD) die(`loja.html ${L}: ${semId} = R$${got}, esperado R$${calc[L].tD}`);
}
console.log("validação OK (imutabilidade das demais semanas + JS + totais batem nos 2 arquivos)");

if (DRY) { console.log("\n[DRY-RUN] nada gravado."); process.exit(0); }

fs.writeFileSync(PAINEL, painel);
fs.writeFileSync(LOJA, loja);
console.log(`\ngravado: ${PAINEL}\ngravado: ${LOJA}`);

if (ci > -1) {
  const resumo = LOJAS.map((L) => `${L} ${calc[L].tA}→${calc[L].tD}`).join(" · ");
  const msg = `premiação: recoleta FINAL ${semId} (${semMeta.periodo}) — ${resumo}` + (COMENTARIO ? `\n\n${COMENTARIO}` : "");
  execFileSync("git", ["-C", REPO, "add", "dashboard_premiacao.html", "loja.html"]);
  execFileSync("git", ["-C", REPO, "commit", "-q", "-m", msg]);
  console.log("commit feito.");
}
