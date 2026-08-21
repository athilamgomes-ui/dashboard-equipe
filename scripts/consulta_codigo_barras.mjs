#!/usr/bin/env node
/**
 * consulta_codigo_barras.mjs — código de barras (EAN) de uma lista de produtos.
 *
 * Regra do Athila (20/08/2026): só se pode DESATIVAR produto que **não tem** código de barras.
 * Se os dois códigos de um par têm EAN e são diferentes, são produtos diferentes de verdade —
 * o ERP não deixa cadastrar o mesmo EAN em dois produtos. Se só um tem, desativa o que não tem.
 *
 * Fonte: API do painel novo de produtos —
 *   POST suprimentoswebapi-prod/api/CatalogoProdutos/ObterDetalhesProduto {codigoProduto}
 * Só leitura.
 *
 * Uso: node consulta_codigo_barras.mjs 6498 15935 46938 ...
 *      node consulta_codigo_barras.mjs --pares      (usa os pares do painel)
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
const log = m => process.stderr.write(`[ean] ${m}\n`);

let codigos = process.argv.slice(2).filter(a => /^\d+$/.test(a));
let pares = null;
if (process.argv.includes("--pares")) {
  const d = JSON.parse(fs.readFileSync(path.join(D_DIR, "estoque_dados.json"), "utf8"));
  const n_de = desc => {
    const s = String(desc || "").toUpperCase();
    let m = s.match(/\bC\/\s*(\d{1,4})\b/) || s.match(/\bCX\s*(\d{1,4})\b/) || s.match(/\bPCT\.?\s*C?\/?\s*(\d{1,4})\b/);
    if (m) return Number(m[1]);
    if (/\bDZ\b|\bD[UÚ]ZIA\b/.test(s)) return 12;
    return null;
  };
  pares = [];
  const vistos = new Set();
  for (const f of d.fator) {
    if (!f.irmao) continue;
    const a = n_de(f.desc), b = n_de(f.irmao.d);
    if (a && b && a !== b) continue;                       // tamanhos diferentes = produtos legítimos
    const k = [f.cod, f.irmao.cod].sort().join("|") + "|" + f.loja;
    if (vistos.has(k)) continue;
    vistos.add(k);
    pares.push({ loja: f.loja, a: f.cod, aDesc: f.desc, aSal: f.sal, b: f.irmao.cod, bDesc: f.irmao.d, bSal: f.irmao.sal });
  }
  codigos = [...new Set(pares.flatMap(p => [p.a, p.b]))];
}
if (!codigos.length) { log("passe códigos ou --pares"); process.exit(1); }

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
await garantirSessao(page, { log, tokenOpcional: true });

let auth = null, base = null;
page.on("request", r => {
  const u = r.url();
  if (/suprimentoswebapi-prod/i.test(u) && !auth) {
    const a = r.headers()["authorization"];
    if (a) { auth = a; base = u.split("/api/")[0] + "/api"; }
  }
});
await page.goto("https://linx.microvix.com.br/gestor_web/suprimentos/index.html#/listagem-produtos", { waitUntil: "domcontentloaded", timeout: 45000 });
for (let i = 0; i < 40 && !auth; i++) await page.waitForTimeout(500);
if (!auth) { log("sem auth"); await ctx.close(); process.exit(1); }

const H = { authorization: auth, accept: "application/json", "content-type": "application/json" };
const info = {};
for (const cod of codigos) {
  try {
    const r = await ctx.request.post(base + "/CatalogoProdutos/ObterDetalhesProduto", { headers: H, data: { codigoProduto: Number(cod) }, timeout: 45000 });
    if (!r.ok()) { info[cod] = { erro: "HTTP " + r.status() }; continue; }
    const j = await r.json();
    info[cod] = { nome: j.Nome, ean: j.CodigoBarras, aux: j.CodigoAuxiliar, ref: j.Referencia, preco: j.PrecoVenda };
  } catch (e) { info[cod] = { erro: String(e.message).slice(0, 60) }; }
}
fs.writeFileSync(path.join(D_DIR, "codigos_barras.json"), JSON.stringify({ info, pares }, null, 1));

// EAN "de verdade" = 8/12/13/14 dígitos e diferente do próprio código do produto
const ehEAN = (ean, cod) => !!ean && /^\d{8,14}$/.test(String(ean)) && String(ean) !== String(cod);
if (pares) {
  log("PARES — quem pode ser desativado:");
  for (const p of pares) {
    const A = info[p.a] || {}, B = info[p.b] || {};
    const eA = ehEAN(A.ean, p.a), eB = ehEAN(B.ean, p.b);
    let veredito;
    if (eA && eB) veredito = "AMBOS têm EAN → são produtos DIFERENTES, não desativar";
    else if (eA && !eB) veredito = `desativar ${p.b} (sem EAN)`;
    else if (!eA && eB) veredito = `desativar ${p.a} (sem EAN)`;
    else veredito = "NENHUM tem EAN → escolher pelo saldo (desativar o menor, depois de zerar)";
    log(`  ${p.loja} ${p.a} (EAN ${A.ean || "—"}${eA ? "" : " ✗"}, saldo ${p.aSal}) × ${p.b} (EAN ${B.ean || "—"}${eB ? "" : " ✗"}, saldo ${p.bSal})`);
    log(`       ${p.aDesc.slice(0, 46)}`);
    log(`       → ${veredito}`);
  }
} else {
  for (const cod of codigos) log(`  ${cod}: ${JSON.stringify(info[cod])}`);
}
await ctx.close().catch(() => {});
process.exit(0);
