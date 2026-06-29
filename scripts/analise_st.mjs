#!/usr/bin/env node
/**
 * analise_st.mjs — cruza o cadastro fiscal (fiscal_ncm_ti.json) com a lista de NCMs
 * sujeitos a ICMS-ST no Pará (st_pa_ncm.json) e com os saldos/vendas (compras_raw.json)
 * para achar produtos em config TRIBUTADO INTEGRALMENTE (19%) cujo NCM é ST por lei
 * = "pagando imposto onde não deveria". Gera fiscal_analise.json + imprime resumo.
 */
import { readFileSync, writeFileSync } from "node:fs";

const BASE = "/Users/elkgomes/Desktop/claude/dashboard-equipe";
const fiscal = JSON.parse(readFileSync(`${BASE}/fiscal_ncm_ti.json`, "utf8"));
const stpa = JSON.parse(readFileSync(`${BASE}/st_pa_ncm.json`, "utf8"));
const ST = (stpa.ncm_st || []).map(String).sort((a, b) => b.length - a.length);
const raw = JSON.parse(readFileSync("/Users/elkgomes/Desktop/claude/compras/compras_raw.json", "utf8"));

const onlyDigits = s => String(s || "").replace(/\D/g, "");
function ncmEhST(ncm) { const n = onlyDigits(ncm); if (n.length < 4) return null; return ST.find(c => n.startsWith(c)) || null; }

// código -> marca, e código -> {vendas,saldo} (somando lojas) a partir dos saldos
const codMarca = {}, codGiro = {};
for (const L of Object.keys(raw.saldos || {})) {
  for (const [marca, o] of Object.entries(raw.saldos[L] || {})) {
    for (const p of (o.prods || [])) {
      if (!codMarca[p.c]) codMarca[p.c] = marca;
      const g = codGiro[p.c] || (codGiro[p.c] = { vendas: 0, saldo: 0 });
      g.vendas += (p.v || 0); g.saldo += (p.s || 0);
    }
  }
}

const LOJAS = Object.keys(fiscal.lojas || {});
const erros = [];           // produtos TI com NCM-ST (pagando 19% indevido)
const porNcmOK = {};        // NCM -> contagem (TI corretamente, NCM não-ST)
let totTI = 0, totComNcm = 0, semNcm = 0;
const vistoErro = new Set();

for (const L of LOJAS) {
  for (const p of (fiscal.lojas[L] || [])) {
    totTI++;
    if (!p.ncm) { semNcm++; continue; }
    totComNcm++;
    const hit = ncmEhST(p.ncm);
    if (hit) {
      const giro = codGiro[p.codigo] || { vendas: 0, saldo: 0 };
      erros.push({
        loja: L, codigo: p.codigo, descricao: p.desc, marca: codMarca[p.codigo] || "?",
        ncm: p.ncm, prefixoST: hit, cest: p.cest, config: p.configTxt,
        vendas60d: giro.vendas, saldo: giro.saldo, giraNasLojas: giro.vendas > 0 || giro.saldo > 0,
      });
    } else {
      const k = onlyDigits(p.ncm).slice(0, 8);
      porNcmOK[k] = (porNcmOK[k] || 0) + 1;
    }
  }
}

// agrega erros por (loja) e por (marca) e por (ncm)
const porLoja = {}, porMarca = {}, porNcm = {};
for (const e of erros) {
  porLoja[e.loja] = (porLoja[e.loja] || 0) + 1;
  porMarca[e.marca] = porMarca[e.marca] || { total: 0, giram: 0 };
  porMarca[e.marca].total++; if (e.giraNasLojas) porMarca[e.marca].giram++;
  porNcm[e.ncm] = porNcm[e.ncm] || { total: 0, giram: 0, prefixo: e.prefixoST, exDesc: e.descricao };
  porNcm[e.ncm].total++; if (e.giraNasLojas) porNcm[e.ncm].giram++;
}

const errosGiram = erros.filter(e => e.giraNasLojas);
const out = {
  _gerado_em: new Date().toISOString(),
  resumo: {
    lojas: LOJAS, total_produtos_TI: totTI, com_ncm: totComNcm, sem_ncm: semNcm,
    erros_ncm_st_em_config_TI: erros.length, erros_que_giram: errosGiram.length,
    produtos_TI_corretos_ncm_nao_st: totTI - erros.length - semNcm,
  },
  por_loja: porLoja, por_marca: porMarca, por_ncm: porNcm,
  erros, // detalhe completo
};
writeFileSync(`${BASE}/fiscal_analise.json`, JSON.stringify(out, null, 1));

// resumo no stdout
console.log("==== ANÁLISE ST vs 19% (config TI) ====");
console.log("Lojas coletadas:", LOJAS.join(", "));
console.log(`Produtos em config TI (saem ~19%): ${totTI}  | com NCM: ${totComNcm}  | SEM NCM: ${semNcm}`);
console.log(`\n>>> ERROS (NCM é ST no PA mas produto está em config TI = pagando 19% indevido): ${erros.length}`);
console.log(`    desses, ${errosGiram.length} têm saldo/venda nas lojas (impacto real).`);
console.log("\nPor loja:", JSON.stringify(porLoja));
console.log("\nTop NCMs com erro (NCM | total | giram | exemplo):");
Object.entries(porNcm).sort((a, b) => b[1].giram - a[1].giram || b[1].total - a[1].total).slice(0, 20)
  .forEach(([n, v]) => console.log(`  ${n}  tot=${v.total} giram=${v.giram}  pref=${v.prefixo}  ex="${(v.exDesc || '').slice(0, 36)}"`));
console.log("\nTop marcas com erro (marca | total | giram):");
Object.entries(porMarca).sort((a, b) => b[1].giram - a[1].giram || b[1].total - a[1].total).slice(0, 20)
  .forEach(([m, v]) => console.log(`  ${String(m).slice(0, 28).padEnd(28)} tot=${v.total} giram=${v.giram}`));
console.log("\nExemplos que giram (loja cod marca ncm desc vendas60d saldo):");
errosGiram.sort((a, b) => b.vendas60d - a.vendas60d).slice(0, 25)
  .forEach(e => console.log(`  ${e.loja} ${e.codigo} ${String(e.marca).slice(0,16).padEnd(16)} ${e.ncm} v=${e.vendas60d} s=${e.saldo} "${(e.descricao||'').slice(0,34)}"`));
