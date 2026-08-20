#!/usr/bin/env node
/**
 * coleta_margem_limpa.mjs — "descontamina" a margem da tela do dashboard de vendas.
 *
 * A margem que aparece no dashboard vem do "Vendas por Lojas" com CUSTO DE HOJE. Produtos com
 * custo médio cadastrado errado — perto de ZERO (< R$0,10 → margem ~100%, infla) ou ABSURDAMENTE
 * ALTO (custo ≥ preço → margem negativa, deprime) — poluem esse número. Este script recoleta as
 * vendas do mês POR PRODUTO (custo=medio, mesmo custo de hoje da tela) via coleta_prod_vendidos.mjs,
 * exclui os produtos contaminados e recalcula a margem limpa + quanto do faturamento foi excluído.
 *
 * Roda SÓ no run da tarde (≥17h) do pipeline de vendas — é coleta nova no ERP (~1min/loja).
 * Uso: node coleta_margem_limpa.mjs            (mês corrente, 4 lojas → stdout JSON)
 *      node coleta_margem_limpa.mjs 01/07/2026 31/07/2026   (período explícito)
 * Exit: 0 ok (mesmo com loja faltando), 1 se nenhuma loja coletou.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const COLETOR = join(DIR, "coleta_prod_vendidos.mjs");
const EMPRESAS = [1, 3, 4, 10];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const log = m => process.stderr.write(`[margemlimpa] ${m}\n`);

// limiares de contaminação (o que a #2 pediu)
const CUSTO_MIN = 0.10;   // custo unit abaixo disso = cadastro zerado (margem inflada)
const MARGEM_ABSURDA = 0; // margem da linha < 0 (custo ≥ preço) = custo absurdamente alto

const hoje = new Date();
const dd = String(hoje.getDate()).padStart(2, "0");
const mm = String(hoje.getMonth() + 1).padStart(2, "0");
const yyyy = hoje.getFullYear();
const DI = process.argv[2] || `01/${mm}/${yyyy}`;
const DF = process.argv[3] || `${dd}/${mm}/${yyyy}`;

function coletaLoja(emp) {
  // custo=medio → mesma base de custo de HOJE que a tela usa
  const out = execFileSync("node", [COLETOR, String(emp), DI, DF, "N", "nenhum", "medio"], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"], timeout: 240000,
  });
  return JSON.parse(out);
}

function descontamina(rows) {
  let fatTot = 0, custoTot = 0, fatExc = 0, custoExc = 0, nExc = 0;
  for (const r of rows) {
    const fat = r.faturamento, custo = r.custoEpoca;  // com custo=medio, custoEpoca = custo hoje × qtd
    fatTot += fat; custoTot += custo;
    const margemLinha = fat > 0 ? (fat - custo) / fat * 100 : 0;
    const contaminado = (r.custoUnit > 0 && r.custoUnit < CUSTO_MIN) || margemLinha < MARGEM_ABSURDA;
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
  };
}

const out = { geradoEm: `${DF}`, periodo: { di: DI, df: DF }, criterio: { custoMin: CUSTO_MIN, margemAbsurda: MARGEM_ABSURDA } };
let ok = 0;
for (const emp of EMPRESAS) {
  const loja = EMP_TO_LOJA[emp];
  try {
    const d = coletaLoja(emp);
    if (!d.rows || !d.rows.length) { log(`${loja}: sem linhas — pulando`); continue; }
    out[loja] = descontamina(d.rows);
    log(`${loja}: raw ${out[loja].margemRaw}% → limpa ${out[loja].margemLimpa}% · excluído ${out[loja].pctExcluido}% do fat (${out[loja].nExcluidos} prod)`);
    ok++;
  } catch (e) {
    log(`${loja} FALHOU: ${String(e.message).split("\n")[0]}`);
  }
}
if (ok === 0) { log("nenhuma loja coletada"); process.exit(1); }
if (ok < 4) log(`AVISO: só ${ok}/4 lojas`);
process.stdout.write(JSON.stringify(out));
