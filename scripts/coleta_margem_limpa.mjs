#!/usr/bin/env node
/**
 * coleta_margem_limpa.mjs — "descontamina" a margem da tela do dashboard de vendas.
 *
 * A margem da tela vem do "Vendas por Lojas" com CUSTO DE HOJE. Produtos com custo médio cadastrado
 * errado — perto de ZERO (< R$0,10 → margem ~100%, infla) ou ABSURDAMENTE ALTO (custo ≥ preço →
 * margem negativa, deprime) — poluem esse número. Este script:
 *   1) recoleta o FATURAMENTO+QTD por produto do mês via coleta_prod_vendidos.mjs (modo época — é o
 *      que parseia os 1200+ produtos de forma confiável; só usamos fat e qtd dele, não o custo);
 *   2) pega o CUSTO DE HOJE por produto do snapshot de estoque (dados_estoque/snapshot.json, campo
 *      'cus' — é exatamente o custo de hoje que a tela usa) e o preço ('pre');
 *   3) marca contaminado quem tem custo hoje < R$0,10 OU custo hoje ≥ preço (absurdamente alto);
 *   4) recalcula a margem limpa (custo hoje) e quanto do faturamento foi excluído.
 *
 * ⚠️ escreve a saída de cada loja em ARQUIVO (não pipe) — o stdout do coletor passa de 64KB e o pipe
 *    do execFileSync trunca (bug observado 20/08: L1/L5 "Unterminated string at 65500").
 *
 * Roda SÓ no run da tarde (≥17h) do pipeline — coleta nova no ERP (~1min/loja).
 * Uso: node coleta_margem_limpa.mjs           (mês corrente, 4 lojas → stdout JSON)
 *      node coleta_margem_limpa.mjs 01/07/2026 31/07/2026
 * Exit: 0 ok (mesmo com loja faltando), 1 se nenhuma coletou.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, mkdtempSync, openSync, closeSync } from "node:fs";
import { tmpdir } from "node:os";

const DIR = dirname(fileURLToPath(import.meta.url));
const COLETOR = join(DIR, "coleta_prod_vendidos.mjs");
const SNAP = join(DIR, "..", "dados_estoque", "snapshot.json");
const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const log = m => process.stderr.write(`[margemlimpa] ${m}\n`);

const CUSTO_MIN = 0.10;   // custo hoje abaixo disso = cadastro zerado (margem inflada)

const hoje = new Date();
const dd = String(hoje.getDate()).padStart(2, "0");
const mm = String(hoje.getMonth() + 1).padStart(2, "0");
const yyyy = hoje.getFullYear();
const DI = process.argv[2] || `01/${mm}/${yyyy}`;
const DF = process.argv[3] || `${dd}/${mm}/${yyyy}`;

const TMP = mkdtempSync(join(tmpdir(), "margemlimpa-"));

// custo de hoje por produto por loja (snapshot de estoque)
let snap = {};
try { snap = JSON.parse(readFileSync(SNAP, "utf8")).lojas; }
catch (e) { log(`AVISO: snapshot de estoque ilegível (${e.message}); sem custo hoje não dá pra descontaminar`); process.exit(1); }

function coletaLojaFat(emp) {
  // modo época só pra ter faturamento+qtd confiáveis por produto (o custo vem do snapshot).
  // stdout vai pra ARQUIVO (fd), não pipe — o output passa de 64KB e o pipe do execFileSync trunca.
  const arq = join(TMP, `pv_${emp}.json`);
  const fd = openSync(arq, "w");
  try { execFileSync("node", [COLETOR, String(emp), DI, DF, "N", "nenhum", "medio_epoca"], { stdio: ["ignore", fd, "ignore"], timeout: 300000 }); }
  finally { closeSync(fd); }
  return JSON.parse(readFileSync(arq, "utf8"));
}

function descontamina(rows, custoHoje) {
  let fatTot = 0, custoTot = 0, fatExc = 0, custoExc = 0, nExc = 0, semCusto = 0;
  for (const r of rows) {
    const fat = r.faturamento, qtd = r.qtd;
    const info = custoHoje[r.cod];
    if (!info) { semCusto++; fatTot += fat; continue; }   // sem custo hoje: conta no total, não exclui
    const cus = info.cus || 0, pre = info.pre || 0;
    const custo = cus * qtd;
    fatTot += fat; custoTot += custo;
    const precoUnit = qtd > 0 ? fat / qtd : 0;             // preço realizado por unidade
    const contaminado = (cus > 0 && cus < CUSTO_MIN) || (cus > 0 && cus >= precoUnit);  // zerado OU custo≥preço
    if (contaminado) { fatExc += fat; custoExc += custo; nExc++; }
  }
  const fatKeep = fatTot - fatExc, custoKeep = custoTot - custoExc;
  return {
    fatTotal: Math.round(fatTot),
    margemRaw: fatTot > 0 ? Math.round((fatTot - custoTot) / fatTot * 1000) / 10 : 0,
    margemLimpa: fatKeep > 0 ? Math.round((fatKeep - custoKeep) / fatKeep * 1000) / 10 : 0,
    fatExcluido: Math.round(fatExc),
    pctExcluido: fatTot > 0 ? Math.round(fatExc / fatTot * 1000) / 10 : 0,
    nExcluidos: nExc,
    semCusto,
  };
}

const out = { geradoEm: DF, periodo: { di: DI, df: DF }, criterio: { custoMin: CUSTO_MIN, regra: "custo hoje < R$0,10 OU custo hoje >= preço unit" } };
let ok = 0;
for (const emp of EMPRESAS) {
  const loja = EMP_TO_LOJA[emp];
  const custoHoje = (snap[loja] && snap[loja].prods) || {};
  try {
    const d = coletaLojaFat(emp);
    if (!d.rows || !d.rows.length) { log(`${loja}: sem linhas — pulando`); continue; }
    out[loja] = descontamina(d.rows, custoHoje);
    log(`${loja}: raw ${out[loja].margemRaw}% → limpa ${out[loja].margemLimpa}% · excluído ${out[loja].pctExcluido}% do fat (${out[loja].nExcluidos} prod; ${out[loja].semCusto} s/ custo)`);
    ok++;
  } catch (e) {
    log(`${loja} FALHOU: ${String(e.message).split("\n")[0]}`);
  }
}
if (ok === 0) { log("nenhuma loja coletada"); process.exit(1); }
if (ok < 4) log(`AVISO: só ${ok}/4 lojas`);
process.stdout.write(JSON.stringify(out));
