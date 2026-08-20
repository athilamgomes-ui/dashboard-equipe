#!/usr/bin/env node
/**
 * analisa_unidade_tributavel.mjs — os fornecedores preenchem a conversão no XML da NF-e?
 *
 * Toda NF-e traz duas quantidades por item: `qCom`/`uCom` (comercial — como o fornecedor vende,
 * ex. 1 CX) e `qTrib`/`uTrib` (tributável — a unidade do fisco, ex. 48 UN). Quando qTrib > qCom,
 * o XML **já traz o fator de conversão pronto**. Quando qCom == qTrib, não traz nada.
 *
 * Isso decide se o parâmetro `UtilizaUnidadeTributavel` resolveria o problema de pacote×unidade
 * ou não — e para quais fornecedores. Só leitura, não escreve nada.
 *
 * Uso: node analisa_unidade_tributavel.mjs [quantasNFes]
 * Saída: dados_estoque/unidade_tributavel.json + resumo por fornecedor no stderr
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
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const EMPRESAS = [1, 3, 4, 10];
const MAX = Number(process.argv[2] || 40);
const log = m => process.stderr.write(`[utrib] ${m}\n`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
page.on("dialog", d => d.accept().catch(() => {}));
try { await garantirSessao(page, { log, tokenOpcional: true }); }
catch (e) { log(`sessão: ${e.message}`); await ctx.close().catch(() => {}); process.exit(2); }

await page.goto(URL_NFE, { waitUntil: "domcontentloaded", timeout: 45000 });
let token = null;
for (let i = 0; i < 40 && !token; i++) {
  token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null);
  if (!token) await page.waitForTimeout(500);
}
if (!token) { log("token_api indisponível — sem ele não dá para baixar o XML"); await ctx.close(); process.exit(1); }
log(`token_api OK (${token.length} chars)`);

const res = await page.evaluate(async ({ empresas, max }) => {
  const token = localStorage.getItem("token_api");
  const base = (localStorage.getItem("url_fiscal_api") || "https://fiscalwebapi-prod.microvix.com.br").replace(/\/$/, "");
  const H = { Authorization: token, "Content-Type": "application/json" };
  const tag = (s, t) => { const m = s.match(new RegExp("<" + t + "\\b[^>]*>([\\s\\S]*?)</" + t + ">")); return m ? m[1].trim() : null; };
  const pad = n => String(n).padStart(2, "0");
  const hoje = new Date(), ini = new Date(hoje.getTime() - 180 * 86400000);
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T03:00:00.000Z`;

  // lista de NFes recentes por empresa
  const nfes = [];
  for (const E of empresas) {
    try {
      const r = await fetch(base + "/api/NfeEntrada/ObterListaNFesPendentesPorEmpresa", {
        method: "POST", headers: H,
        body: JSON.stringify({ IdEmpresa: E, DataInicial: iso(ini), DataFinal: iso(hoje), Status: "Validos" }),
      });
      const j = await r.json();
      for (const n of (j.NFes || [])) nfes.push({ emp: E, id: n.IdNfe || n.Id, chave: n.ChaveNFe || n.Chave, emit: n.NomeEmitente || n.RazaoSocialEmitente || n.Emitente || "?", doc: n.DocumentoEmitente || n.CnpjEmitente });
    } catch (e) { /* segue */ }
  }
  const amostra = nfes.slice(0, max);

  const porForn = {};
  let lidas = 0, erros = 0;
  for (const nf of amostra) {
    try {
      let chave = nf.chave, doc = nf.doc;
      if (!chave) {
        const d = await (await fetch(base + "/api/NfeEntrada/BuscarDetalhesNFe", { method: "POST", headers: H, body: JSON.stringify({ IdNfe: nf.id }) })).json();
        chave = d.ChaveNFe; doc = doc || (d.Emitente || {}).Documento;
      }
      const r = await fetch(base + "/api/NfeEntrada/BaixarNFe", { method: "POST", headers: H, body: JSON.stringify({ IdNfe: nf.id, ChaveNFe: chave, DocumentoEmitente: doc }) });
      const xml = await r.text();
      const emitBlk = (xml.match(/<emit>([\s\S]*?)<\/emit>/) || [])[1] || "";
      const nome = tag(emitBlk, "xNome") || nf.emit;
      const f = porForn[nome] = porForn[nome] || { notas: 0, itens: 0, comFator: 0, exemplos: [] };
      f.notas++;
      for (const d of (xml.match(/<det\b[\s\S]*?<\/det>/g) || [])) {
        const qCom = parseFloat(tag(d, "qCom") || "0");
        const qTrib = parseFloat(tag(d, "qTrib") || "0");
        const uCom = tag(d, "uCom"), uTrib = tag(d, "uTrib");
        f.itens++;
        if (qCom > 0 && qTrib > qCom) {
          f.comFator++;
          if (f.exemplos.length < 3) f.exemplos.push({ desc: (tag(d, "xProd") || "").slice(0, 42), qCom, uCom, qTrib, uTrib, fator: +(qTrib / qCom).toFixed(2) });
        } else if (f.exemplos.length < 3 && f.comFator === 0) {
          f.exemplos.push({ desc: (tag(d, "xProd") || "").slice(0, 42), qCom, uCom, qTrib, uTrib, fator: 1 });
        }
      }
      lidas++;
    } catch (e) { erros++; }
  }
  return { total: nfes.length, lidas, erros, porForn };
}, { empresas: EMPRESAS, max: MAX });

fs.mkdirSync(D_DIR, { recursive: true });
fs.writeFileSync(path.join(D_DIR, "unidade_tributavel.json"), JSON.stringify(res, null, 1));
log(`${res.total} NFes na janela · ${res.lidas} XMLs lidos · ${res.erros} erros`);
const lista = Object.entries(res.porForn).sort((a, b) => b[1].itens - a[1].itens);
log("fornecedor · itens · com fator no XML");
for (const [nome, f] of lista) {
  const pct = f.itens ? Math.round(100 * f.comFator / f.itens) : 0;
  log(`  ${pct.toString().padStart(3)}%  ${String(f.comFator).padStart(4)}/${String(f.itens).padEnd(4)} ${nome.slice(0, 44)}`);
  for (const e of f.exemplos.slice(0, 2))
    log(`         ex: ${e.desc} → ${e.qCom} ${e.uCom} = ${e.qTrib} ${e.uTrib}${e.fator > 1 ? "  (fator " + e.fator + ")" : "  (sem fator)"}`);
}
await ctx.close().catch(() => {});
process.exit(0);
