#!/usr/bin/env node
/**
 * congelar_semana.mjs — grava o snapshot IMUTÁVEL de uma semana FECHADA
 * em HISTORICO_PREMIOS[mes][Lx] nos DOIS HTMLs (painel + loja).
 *
 * Uso: node congelar_semana.mjs <mesKey> <semId> [--commit "<comentario>"] [--dry]
 *   ex: node congelar_semana.mjs 2026-08 S5 --dry
 *
 * Regras aplicadas (ver SKILL.md do cron dashboard-premiacao-update):
 *  - em_pct = total da semana (TODAS as chaves de vendas, inclui "Outros") / META REAL
 *  - pool   = getPool(em_pct, marcasA_loja[sem])  → SEMANAL_TABLE + bônus MA>=30
 *  - distribuição: proporcional entre as vendedoras do ROSTER (LOJAS_BASE),
 *    excluindo caixa e excluindo "Outros"; sobra ajustada por MAIOR RESTO
 *    para a soma bater exatamente o pool.
 *  - NUNCA sobrescreve uma semana já congelada (aborta).
 */
import fs from "node:fs";
import path from "node:path";

const REPO = "/Users/elkgomes/Desktop/claude/dashboard-equipe";
const PAINEL = path.join(REPO, "dashboard_premiacao.html");
const LOJA = path.join(REPO, "loja.html");

const mesKey = process.argv[2];
const semId = process.argv[3];
const DRY = process.argv.includes("--dry");
const ci = process.argv.indexOf("--commit");
const COMENTARIO = ci > -1 ? process.argv[ci + 1] : "";
if (!mesKey || !semId) { console.error("uso: congelar_semana.mjs <mesKey> <semId> [--commit \"txt\"] [--dry]"); process.exit(3); }

const SEMANAL_TABLE = [[120,420,470],[110,350,400],[100,280,330],[90,180,230],[80,100,120],[70,80,100],[0,0,0]];
function getPool(em_pct, ma) {
  const bonus = ma >= 30;
  if (em_pct >= 120) { const base = 420 + Math.floor((em_pct - 120) / 10) * 10; return bonus ? base + 50 : base; }
  for (const [min, b, bn] of SEMANAL_TABLE) if (em_pct >= min) return bonus ? bn : b;
  return 0;
}

function extrai(html, nome) {
  const i = html.search(new RegExp("const\\s+" + nome + "\\s*="));
  if (i < 0) throw new Error("não achei " + nome);
  let s = html.indexOf("{", i), d = 0, end = -1;
  for (let k = s; k < html.length; k++) { const c = html[k]; if (c === "{") d++; else if (c === "}") { d--; if (d === 0) { end = k; break; } } }
  return { obj: eval("(" + html.slice(s, end + 1) + ")"), ini: s, fim: end };
}

const painel = fs.readFileSync(PAINEL, "utf8");
const DADOS = extrai(painel, "DADOS").obj;
const LOJAS_BASE = extrai(painel, "LOJAS_BASE").obj;
const VENDEDORAS_META = extrai(painel, "VENDEDORAS_META").obj;
const HP = extrai(painel, "HISTORICO_PREMIOS").obj;
const isCaixa = (v) => (VENDEDORAS_META[v]?.badges || []).includes("caixa");

const mes = DADOS[mesKey];
if (!mes) { console.error("mês " + mesKey + " sem estrutura"); process.exit(1); }

const resultado = {};
for (const L of ["L1", "L3", "L4", "L5"]) {
  const ld = mes[L];
  const sem = (ld.semanas || []).find((s) => s.id === semId);
  if (!sem) { console.error(L + ": semana " + semId + " não existe"); process.exit(1); }
  if (HP[mesKey]?.[L]?._pool && semId in HP[mesKey][L]._pool) {
    console.error("ABORTADO: " + L + " " + semId + " JÁ está congelada (imutável). Nada foi alterado.");
    process.exit(2);
  }
  const vendas = ld.vendas[semId] || {};
  const total = Object.values(vendas).reduce((a, b) => a + (b || 0), 0);
  const em_pct = sem.meta > 0 ? (total / sem.meta) * 100 : 0;
  const ma = (ld.marcasA_loja || {})[semId] || 0;
  const pool = total > 0 ? getPool(Math.round(em_pct * 10) / 10, ma) : 0;

  // distribuição proporcional entre o roster (sem caixa, sem "Outros")
  const roster = LOJAS_BASE[L].vendedoras;
  const base = roster.filter((v) => !isCaixa(v) && (vendas[v] || 0) > 0);
  const somaBase = base.reduce((a, v) => a + vendas[v], 0);
  const share = {};
  for (const v of roster) share[v] = 0;
  if (pool > 0 && somaBase > 0) {
    const exato = base.map((v) => ({ v, x: (pool * vendas[v]) / somaBase }));
    let acc = 0;
    for (const e of exato) { share[e.v] = Math.floor(e.x); acc += share[e.v]; }
    // maior resto até fechar o pool exato
    const restos = exato.map((e) => ({ v: e.v, r: e.x - Math.floor(e.x) })).sort((a, b) => b.r - a.r);
    let sobra = pool - acc;
    for (let i = 0; i < sobra; i++) share[restos[i % restos.length].v] += 1;
  }
  resultado[L] = { total, em_pct: Math.round(em_pct * 10) / 10, ma, pool, share, roster, meta: sem.meta, periodo: sem.periodo };
}

// ── relatório ──
console.log("\n=== CONGELAMENTO " + mesKey + " " + semId + (DRY ? "  [DRY-RUN]" : "") + " ===");
for (const L of ["L1", "L3", "L4", "L5"]) {
  const r = resultado[L];
  console.log(`\n${L}  ${r.periodo}  vendas R$${r.total.toLocaleString("pt-BR")} / meta R$${r.meta.toLocaleString("pt-BR")} = ${r.em_pct}%  MA ${r.ma}%  → POOL R$${r.pool}`);
  const somaShare = Object.values(r.share).reduce((a, b) => a + b, 0);
  for (const v of r.roster) {
    const tag = isCaixa(v) ? " (caixa — fora da divisão)" : "";
    console.log(`   ${v.padEnd(12)} venda R$${String((mes[L].vendas[semId] || {})[v] || 0).padStart(6)}  →  R$${r.share[v]}${tag}`);
  }
  if (r.pool > 0) console.log(`   soma distribuída = R$${somaShare} (pool R$${r.pool}) ${somaShare === r.pool ? "OK" : "*** DIVERGE ***"}`);
}
if (DRY) { console.log("\n[DRY-RUN] nada gravado."); process.exit(0); }

// ── grava nos dois HTMLs ──
function grava(file) {
  let h = fs.readFileSync(file, "utf8");
  const { ini, fim } = extrai(h, "HISTORICO_PREMIOS");
  let bloco = h.slice(ini, fim + 1);
  for (const L of ["L1", "L3", "L4", "L5"]) {
    const r = resultado[L];
    // localiza o bloco do mês e, dentro dele, o da loja
    const reMes = new RegExp("'" + mesKey + "':\\s*\\{");
    const mMes = reMes.exec(bloco);
    if (!mMes) throw new Error("mês " + mesKey + " ausente em HISTORICO_PREMIOS de " + file);
    // varre a partir do mês até achar a loja
    const reLoja = new RegExp("(\\n\\s*" + L + ":\\s*\\{)", "g");
    reLoja.lastIndex = mMes.index;
    const mLoja = reLoja.exec(bloco);
    if (!mLoja) throw new Error(L + " ausente em " + mesKey + " de " + file);
    // fim do bloco da loja
    let s = bloco.indexOf("{", mLoja.index + mLoja[1].length - 1), d = 0, end = -1;
    for (let k = s; k < bloco.length; k++) { const c = bloco[k]; if (c === "{") d++; else if (c === "}") { d--; if (d === 0) { end = k; break; } } }
    let lojaSrc = bloco.slice(s, end + 1);
    const novo = lojaSrc
      // vendedoras: adiciona , Sx:valor antes do } de cada linha de vendedora
      .replace(/(['"]?)([^'"\n:{}]+)\1:\s*\{([^{}]*)\}/g, (m0, q, nome, corpo) => {
        const n = nome.trim();
        if (n.startsWith("_")) return m0;
        if (!(n in resultado[L].share)) return m0;
        if (new RegExp("\\b" + semId + "\\s*:").test(corpo)) return m0;
        return `${q}${nome}${q}: {${corpo.replace(/\s*$/, "")}, ${semId}:${resultado[L].share[n]}}`;
      })
      .replace(/(_em_pct:\s*\{)([^{}]*)(\})/, (m0, a, corpo, c) =>
        new RegExp("\\b" + semId + "\\s*:").test(corpo) ? m0 : `${a}${corpo.replace(/\s*$/, "")}, ${semId}:${r.em_pct}${c}`)
      .replace(/(_pool:\s*\{)([^{}]*)(\})/, (m0, a, corpo, c) =>
        new RegExp("\\b" + semId + "\\s*:").test(corpo) ? m0 : `${a}${corpo.replace(/\s*$/, "")}, ${semId}:${r.pool}${c}`);
    bloco = bloco.slice(0, s) + novo + bloco.slice(end + 1);
  }
  if (COMENTARIO) {
    const reMes = new RegExp("('" + mesKey + "':\\s*\\{)");
    // funcao de replace (NAO string): o comentario contem "R$1.598" e uma string
    // de substituicao interpretaria $1 como grupo capturado, corrompendo o bloco.
    bloco = bloco.replace(reMes, (m) => m + "\n    " + COMENTARIO.split("\n").join("\n    "));
  }
  h = h.slice(0, ini) + bloco + h.slice(fim + 1);
  // ── VALIDA ANTES DE GRAVAR (nunca deixar o arquivo em estado quebrado) ──
  const chk = extrai(h, "HISTORICO_PREMIOS").obj;
  for (const L of ["L1", "L3", "L4", "L5"]) {
    const g = chk[mesKey][L];
    if (!(semId in g._pool) || g._pool[semId] !== resultado[L].pool) throw new Error("validação falhou em " + file + " " + L);
    if (!(semId in g._em_pct) || g._em_pct[semId] !== resultado[L].em_pct) throw new Error("_em_pct divergente em " + file + " " + L);
    for (const v of Object.keys(resultado[L].share)) {
      if (isCaixa(v)) continue;
      if (!(v in g)) continue;
      if (g[v][semId] !== resultado[L].share[v]) throw new Error("share divergente: " + file + " " + L + " " + v);
    }
  }
  fs.writeFileSync(file, h);
  console.log("validado + gravado: " + path.basename(file));
}
grava(PAINEL);
grava(LOJA);
console.log("\nOK — " + semId + " de " + mesKey + " congelada nos dois HTMLs.");
