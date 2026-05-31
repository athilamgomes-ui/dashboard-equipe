#!/usr/bin/env node
/**
 * atualiza_fatmensal.mjs — atualiza o bloco `fatMensal` do dashboard_amgomes.html
 * de forma EFICIENTE, reescrevendo apenas o trecho entre os marcadores
 * `// ─── FATMENSAL_INICIO ───` e `// ─── FATMENSAL_FIM ───`.
 *
 * Modos:
 *   light <lojas_out.json>
 *     - Atualiza SOMENTE o mês corrente (último elemento de cada série de `atual`)
 *       reaproveitando a coleta da Etapa 1 (faturamento por loja do mês corrente).
 *     - NÃO faz nenhuma consulta nova ao ERP.
 *     - Se detectar virada de mês / divergência (mês atual ≠ nº de meses armazenados),
 *       NÃO altera nada e sai com código 3 → sinaliza que a skill deve rodar `full`.
 *
 *   full <mensal_atual.json> <mensal_ant.json>
 *     - Reconstrói `atual` e `anterior` a partir das coletas mensais completas
 *       (coleta_amgomes_mensal.mjs). `anterior` é truncado ao mesmo nº de meses de `atual`.
 *
 * lojas_out.json  : {"1":{nome,cells[...]}, "3":..., "4":..., "10":...}  (V.Líquida = cells[5])
 * mensal_*.json   : {ano, meses:[...], L5:[...], L4:[...], L1:[...], L3:[...]}
 *
 * Saída: imprime no stderr o que fez; reescreve o HTML in-place.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = join(__dirname, "..", "dashboard_amgomes.html");
const MARK_INI = "// ─── FATMENSAL_INICIO ───";
const MARK_FIM = "// ─── FATMENSAL_FIM ───";

const log = (...a) => console.error("[fatmensal]", ...a);
const die = (msg, code = 1) => { log("ERRO:", msg); process.exit(code); };

const modo = process.argv[2];
if (!["light", "full"].includes(modo)) die("uso: atualiza_fatmensal.mjs light|full ...", 2);

// ── Ler HTML e extrair o objeto fatMensal atual ──
const html = fs.readFileSync(HTML, "utf8");
const iIni = html.indexOf(MARK_INI);
const iFim = html.indexOf(MARK_FIM);
if (iIni < 0 || iFim < 0 || iFim < iIni) die("marcadores FATMENSAL não encontrados no HTML");

const bloco = html.slice(iIni + MARK_INI.length, iFim);
// Extrai o literal do objeto (do primeiro "{" após "const fatMensal =" até o "};")
const m = bloco.match(/const\s+fatMensal\s*=\s*(\{[\s\S]*?\});/);
if (!m) die("não consegui localizar o literal de fatMensal");
let fatMensal;
try {
  // O literal é JS confiável (nosso arquivo) — avaliar em sandbox de Function.
  fatMensal = Function('"use strict"; return (' + m[1] + ');')();
} catch (e) { die("falha ao avaliar fatMensal: " + e.message); }

const LOJAS = ["L1", "L3", "L4", "L5"];
const intBR = s => Math.round(parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0);

if (modo === "light") {
  const arq = process.argv[3] || "/tmp/lojas_out.json";
  const data = JSON.parse(fs.readFileSync(arq, "utf8"));
  const empToLoja = { "1": "L1", "3": "L3", "4": "L4", "10": "L5" };
  const atualMes = {};
  for (const [emp, loja] of Object.entries(empToLoja)) {
    const cells = data?.[emp]?.cells;
    if (!cells) die(`empresa ${emp} ausente em ${arq}`);
    atualMes[loja] = intBR(cells[5]); // V.Líquida
  }

  const n = fatMensal.atual.L1.length;          // nº de meses já armazenados
  const mesAtual = new Date().getMonth() + 1;   // 1..12
  if (mesAtual !== n) {
    log(`mês atual (${mesAtual}) ≠ meses armazenados (${n}) → virada de mês/divergência. Pedir FULL.`);
    process.exit(3); // sinaliza à skill: rodar modo full
  }

  // Mesmo mês: substituir o último elemento de cada série de `atual`
  for (const loja of LOJAS) fatMensal.atual[loja][n - 1] = atualMes[loja];
  fatMensal.mesParcial = mesAtual;
  log(`light OK — mês ${mesAtual} atualizado: ` +
      LOJAS.map(l => `${l}=${atualMes[l]}`).join(" "));
} else {
  // full
  const arqA = process.argv[3] || "/tmp/mensal_atual.json";
  const arqB = process.argv[4] || "/tmp/mensal_ant.json";
  const A = JSON.parse(fs.readFileSync(arqA, "utf8"));
  const B = JSON.parse(fs.readFileSync(arqB, "utf8"));
  const n = A.L1.length;
  if (!n) die("mensal_atual sem meses");

  fatMensal.anoAtual = A.ano;
  fatMensal.anoAnterior = B.ano;
  fatMensal.mesParcial = A.meses[A.meses.length - 1]; // último mês coletado = corrente
  fatMensal.atual = {};
  fatMensal.anterior = {};
  for (const loja of LOJAS) {
    fatMensal.atual[loja] = A[loja].slice(0, n).map(v => Math.round(v));
    // anterior truncado ao mesmo nº de meses de atual
    fatMensal.anterior[loja] = (B[loja] || []).slice(0, n).map(v => Math.round(v));
    while (fatMensal.anterior[loja].length < n) fatMensal.anterior[loja].push(0);
  }
  log(`full OK — ${n} meses · atual=${A.ano} anterior=${B.ano}`);
}

// ── Re-serializar fatMensal como JS legível ──
const arr = a => "[" + a.join(", ") + "]";
const novo = `${MARK_INI}
const fatMensal = {
  mesesLabel: ${JSON.stringify(fatMensal.mesesLabel).replace(/","/g, "','").replace(/\["/, "['").replace(/"\]/, "']")},
  anoAtual: ${fatMensal.anoAtual},
  anoAnterior: ${fatMensal.anoAnterior},
  mesParcial: ${fatMensal.mesParcial == null ? "null" : fatMensal.mesParcial},
  atual: {
    L1: ${arr(fatMensal.atual.L1)},
    L3: ${arr(fatMensal.atual.L3)},
    L4: ${arr(fatMensal.atual.L4)},
    L5: ${arr(fatMensal.atual.L5)}
  },
  anterior: {
    L1: ${arr(fatMensal.anterior.L1)},
    L3: ${arr(fatMensal.anterior.L3)},
    L4: ${arr(fatMensal.anterior.L4)},
    L5: ${arr(fatMensal.anterior.L5)}
  }
};
`;

const htmlNovo = html.slice(0, iIni) + novo + html.slice(iFim);
fs.writeFileSync(HTML, htmlNovo);
log("HTML reescrito com sucesso.");
process.exit(0);
