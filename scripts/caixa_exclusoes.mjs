#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// caixa_exclusoes.mjs — tira da conferência lançamentos que NÃO são venda.
//
// Nem tudo que passa na maquininha ou cai na conta é venda de loja: aporte de
// capital do sócio, transferência entre contas, estorno de fornecedor. Esses
// lançamentos existem de verdade na adquirente, mas não têm (nem deveriam ter)
// venda correspondente no ERP — então apareceriam como "cobrança sem venda" e
// mandariam o Athila caçar dinheiro que está exatamente onde deveria.
//
// ⚠️ Por que arquivo de regra e não apagar a linha na mão: apagar resolve UMA
// vez. Na próxima reconciliação do mesmo dia o lançamento volta, e o próximo
// aporte vira o mesmo susto. A regra fica registrada, com motivo e data.
//
// ⚠️ O casamento é ESTRITO (loja + dia + valor exato, ±R$ 0,01). Regra frouxa
// aqui esconderia venda real — que é o oposto do que a conferência existe para
// fazer. Cada exclusão é um lançamento específico, nunca um padrão amplo.
//
// Config: ~/.claude/caixa-exclusoes.json
//   [{ "loja":"L4", "dia":"2026-10-28", "valor":20000.00, "motivo":"..." }]
//
// Uso:  node caixa_exclusoes.mjs            (aplica na pasta de arquivos)
//       node caixa_exclusoes.mjs --listar
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DIR = path.join(os.homedir(), ".claude", "caixa-arquivos");
export const CONFIG = path.join(os.homedir(), ".claude", "caixa-exclusoes.json");

export function regras() {
  if (!fs.existsSync(CONFIG)) return [];
  try { return JSON.parse(fs.readFileSync(CONFIG, "utf8")); } catch { return []; }
}

// "1.234,56" / "+R$ 20.000,00" / "20000.00" → 20000.00
const num = (s) => {
  const t = String(s || "").replace(/[^\d,.-]/g, "");
  if (!t) return NaN;
  return /,\d{1,2}$/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", "."))
                             : parseFloat(t.replace(/,/g, ""));
};

// Aplica as regras a um CSV já gravado. Devolve quantas linhas saíram.
export function aplicarNoArquivo(arq, loja, dia) {
  const alvos = regras().filter(r => r.loja === loja && r.dia === dia);
  if (!alvos.length) return { removidas: 0 };

  const txt = fs.readFileSync(arq, "utf8");
  const linhas = txt.split("\n");
  const cab = linhas[0] || "";
  // Acha a coluna de valor: "Valor (R$)" na maquininha, "Valor" no extrato.
  const cols = cab.split(",");
  const iVal = cols.findIndex(c => /^"?valor/i.test(c.trim()));
  if (iVal < 0) return { removidas: 0, aviso: "não achei coluna de valor em " + path.basename(arq) };

  const fora = [];
  const mantidas = linhas.filter((l, i) => {
    if (i === 0 || !l.trim()) return true;
    // split simples serve: nossos CSVs só usam aspas em campos de valor
    const campos = l.match(/("[^"]*"|[^,]*)/g).filter((_, k) => k % 2 === 0);
    const v = num(campos[iVal]);
    const bate = alvos.find(r => Math.abs(v - r.valor) < 0.01);
    if (bate) { fora.push({ valor: v, motivo: bate.motivo }); return false; }
    return true;
  });

  if (fora.length) fs.writeFileSync(arq, mantidas.join("\n"));
  return { removidas: fora.length, detalhe: fora };
}

// Varre a pasta inteira e aplica o que casar.
export function aplicarNaPasta(dir = DIR) {
  let total = 0;
  for (const nome of fs.readdirSync(dir).filter(f => /\.csv$/i.test(f))) {
    const m = nome.match(/^(L[1345]) .* (\d{2})-(\d{2})\.csv$/);
    if (!m) continue;
    const [, loja, dd, mm] = m;
    const dia = new Date().getFullYear() + "-" + mm + "-" + dd;
    const r = aplicarNoArquivo(path.join(dir, nome), loja, dia);
    if (r.removidas) {
      total += r.removidas;
      for (const f of r.detalhe)
        console.log(`  ⊘ ${nome}: fora R$ ${f.valor.toLocaleString("pt-BR", {minimumFractionDigits:2})} — ${f.motivo}`);
    }
  }
  return total;
}

if (import.meta.url === "file://" + process.argv[1]) {
  if (process.argv.includes("--listar")) {
    const r = regras();
    console.log(r.length + " exclusão(ões) registrada(s):");
    for (const x of r) console.log(`  ${x.loja} ${x.dia} · R$ ${Number(x.valor).toLocaleString("pt-BR",{minimumFractionDigits:2})} — ${x.motivo}`);
  } else {
    const n = aplicarNaPasta();
    console.log(n ? `${n} lançamento(s) excluído(s) da conferência.` : "nada a excluir.");
  }
}
