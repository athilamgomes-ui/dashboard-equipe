#!/usr/bin/env node
/**
 * coleta_marca_metricas.mjs — Top marcas por loja com 3 MÉTRICAS (unidades, R$, margem),
 * para o quadro "Top 10 Marcas" do dashboard de Vendas com filtro alternável.
 *
 * Fonte: coleta_prod_vendidos.mjs em modo ANALÍTICO agrupado por marca (sintetico=N,
 * agrup=codigo_marca, custo=medio_epoca) — dá produto a produto COM a marca, faturamento e custo.
 * Agrega por marca: un=Σqtd, rs=Σfaturamento, mg=(rs-Σcusto)/rs. Período = ANO (01/01→hoje),
 * igual ao quadro antigo (coleta_top_marcas).
 *
 * ⚠️ Preserva a REGRA das lixas Santa Clara (nível produto): ignora produtos "LIXA" da marca
 *    Santa Clara (dados como troco → inflavam a contagem). Mesma regra do coleta_top_marcas.
 * ⚠️ stdout de cada loja vai pra ARQUIVO (o output passa de 64KB e o pipe do execFileSync trunca).
 *
 * É coleta pesada (~1,5-2min/loja) → roda SÓ no run da tarde (≥17h) do pipeline.
 * Uso: node coleta_marca_metricas.mjs           (ano corrente, 4 lojas → stdout JSON)
 *      node coleta_marca_metricas.mjs 01/01/2026 20/08/2026
 * Exit: 0 ok (mesmo com loja faltando), 1 se nenhuma coletou.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, openSync, closeSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const DIR = dirname(fileURLToPath(import.meta.url));
const COLETOR = join(DIR, "coleta_prod_vendidos.mjs");
const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const LIXA = /\bLIXA\b/i;                       // exclusão de produto (dentro de Santa Clara)
const EXCLUI_LIXA_MARCA = "santa clara";
const log = m => process.stderr.write(`[marcametr] ${m}\n`);

const pad = n => String(n).padStart(2, "0");
const hoje = new Date();
const DI = process.argv[2] || `01/01/${hoje.getFullYear()}`;
const DF = process.argv[3] || `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`;
const TMP = mkdtempSync(join(tmpdir(), "marcametr-"));

function coletaLoja(emp) {
  const arq = join(TMP, `pv_${emp}.json`);
  const fd = openSync(arq, "w");
  try { execFileSync("node", [COLETOR, String(emp), DI, DF, "N", "codigo_marca", "medio_epoca"], { stdio: ["ignore", fd, "ignore"], timeout: 300000 }); }
  finally { closeSync(fd); }
  return JSON.parse(readFileSync(arq, "utf8"));
}

const CUSTO_MIN = 0.10;   // custo unit época abaixo disso = cadastro zerado (infla a margem)

function agregaPorMarca(rows) {
  const M = {};
  for (const r of rows) {
    const marca = (r.marca || "").trim();
    if (!marca || /GERAL/i.test(marca)) continue;
    if (marca.toLowerCase() === EXCLUI_LIXA_MARCA && LIXA.test(r.desc)) continue;  // lixa Santa Clara
    const a = M[marca] || (M[marca] = { un: 0, rs: 0, fatClean: 0, custoClean: 0, nExcl: 0 });
    a.un += r.qtd; a.rs += r.faturamento;   // unidades e R$ = TUDO
    // Margem LIMPA: ignora linha de custo inválido (época) — near-zero (infla) OU custo>preço (estouro
    // por saldo negativo). Assim a margem por marca não é distorcida pelos artefatos de estoque.
    const custoInvalido = (r.custoUnit > 0 && r.custoUnit < CUSTO_MIN) || (r.custoEpoca > r.faturamento);
    if (!custoInvalido && r.faturamento > 0) { a.fatClean += r.faturamento; a.custoClean += r.custoEpoca; }
    else a.nExcl++;
  }
  const out = {};
  for (const [marca, a] of Object.entries(M)) {
    if (a.rs <= 0 && a.un <= 0) continue;
    out[marca] = { un: Math.round(a.un), rs: Math.round(a.rs), mg: a.fatClean > 0 ? Math.round((a.fatClean - a.custoClean) / a.fatClean * 1000) / 10 : 0 };
  }
  return out;
}

const out = { geradoEm: DF, periodo: { ini: DI, fim: DF } };
let ok = 0;
for (const emp of EMPRESAS) {
  const loja = EMP_TO_LOJA[emp];
  try {
    const d = coletaLoja(emp);
    if (!d.rows || !d.rows.length) { log(`${loja}: sem linhas — pulando`); continue; }
    out[loja] = agregaPorMarca(d.rows);
    log(`${loja}: ${Object.keys(out[loja]).length} marcas (fat total R$${d.totais.faturamento.toFixed(0)})`);
    ok++;
  } catch (e) {
    log(`${loja} FALHOU: ${String(e.message).split("\n")[0]}`);
  }
}
if (ok === 0) { log("nenhuma loja coletada"); process.exit(1); }
if (ok < 4) log(`AVISO: só ${ok}/4 lojas`);
process.stdout.write(JSON.stringify(out));
