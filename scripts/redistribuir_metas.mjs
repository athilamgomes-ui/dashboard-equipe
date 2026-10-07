#!/usr/bin/env node
/**
 * redistribuir_metas.mjs — motor de redistribuição de metas semanais (regra do Athila).
 *
 * REGRA (definida 07/10/2026):
 *  - meta ideal (base) = meta da semana no início do mês. meta real = meta após ajuste.
 *    venda real = o que vendeu (realizado). Meta do MÊS é fixa (teto).
 *  - Toda semana que fecha: realizado(semanas fechadas) + metas(semanas restantes) = teto.
 *    Recalcula as RESTANTES a partir da IDEAL, distribuindo a diferença:
 *     · SOBRA (vendeu a mais → metas caem): achata o PICO (desce a semana mais alta até o
 *       nível da próxima; a sobra miúda sai da semana FINAL).
 *     · FALTA (vendeu a menos → metas sobem): preenche o VALE (sobe a semana mais baixa das
 *       não-finais; poupa a última), sem passar o teto da semana.
 *  - Sem arredondamento (valores exatos). Qualquer diferença mexe (sem limiar).
 *
 * USO: node redistribuir_metas.mjs <mes-YYYY-MM> [--apply]
 *   sem --apply: só calcula e imprime. com --apply: grava DADOS do painel + Supabase + Worker.
 */
import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const PAINEL = join(__dirname, "..", "dashboard_premiacao.html");
const WORKER_URL = "https://premiacao-amgomes.nhf6t85hdk.workers.dev";
const SUPA_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const CAP = { L1: 40000, L3: 23000, L4: 40000, L5: 23000 };

const MES = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!/^\d{4}-\d{2}$/.test(MES || "")) { console.error("uso: redistribuir_metas.mjs YYYY-MM [--apply]"); process.exit(1); }

// ── A REGRA (pura, testável): dado ideais das restantes + alvo da soma + teto, devolve metas ──
export function redistribuir(ideais, alvoSoma, capSemana) {
  const metas = ideais.slice();
  let diff = Math.round((alvoSoma - metas.reduce((a, b) => a + b, 0)));
  if (diff === 0) return metas;
  const n = metas.length;
  if (diff < 0) {
    // SOBRA: remover S, achatando o pico; sobra miúda sai da FINAL (último índice).
    let S = -diff;
    let guard = 0;
    while (S > 0 && guard++ < 10000) {
      const maxv = Math.max(...metas);
      const topIdx = metas.map((m, i) => (m === maxv ? i : -1)).filter(i => i >= 0);
      const abaixo = metas.filter(m => m < maxv);
      const prox = abaixo.length ? Math.max(...abaixo) : 0;
      const removivelNivelando = (maxv - prox) * topIdx.length;
      if (removivelNivelando <= S) {
        for (const i of topIdx) metas[i] = prox;
        S -= removivelNivelando;
      } else {
        // tira do pico preferindo a semana FINAL (maior índice) primeiro
        for (let k = topIdx.length - 1; k >= 0 && S > 0; k--) {
          const i = topIdx[k];
          const rem = Math.min(S, metas[i] - prox);
          metas[i] -= rem; S -= rem;
        }
      }
    }
  } else {
    // FALTA: somar D, preenchendo o vale das NÃO-finais (poupa o último); sem passar o teto.
    let D = diff;
    const ultimo = n - 1;
    let guard = 0;
    while (D > 0 && guard++ < 10000) {
      const cands = metas.map((m, i) => ({ m, i })).filter(x => x.i !== ultimo && x.m < capSemana);
      if (!cands.length) {
        // não-finais esgotadas (teto) → usa a última, respeitando o teto
        if (metas[ultimo] < capSemana) { const rem = Math.min(D, capSemana - metas[ultimo]); metas[ultimo] += rem; D -= rem; }
        else break; // tudo no teto — não cabe (não deve acontecer com teto do mês coerente)
      } else {
        const minv = Math.min(...cands.map(x => x.m));
        const vale = cands.filter(x => x.m === minv);                 // mais baixas
        const maiores = cands.map(x => x.m).filter(m => m > minv);
        const prox = Math.min(capSemana, maiores.length ? Math.min(...maiores) : capSemana);
        const espacoAteProx = (prox - minv) * vale.length;
        if (espacoAteProx <= D && espacoAteProx > 0) {
          for (const x of vale) metas[x.i] = prox;
          D -= espacoAteProx;
        } else {
          // sobe as do vale (preferindo início/meio = menor índice primeiro) até consumir D
          for (const x of vale.sort((a, b) => a.i - b.i)) { if (D <= 0) break; const rem = Math.min(D, prox - x.i, prox - minv); metas[x.i] += Math.min(D, prox - minv); D -= Math.min(D, prox - minv); }
          if (espacoAteProx === 0) break;
        }
      }
    }
  }
  return metas;
}

function parseFimPeriodo(periodo, ano) {
  const m = periodo.match(/(\d{2})\/(\d{2})\D+(\d{2})\/(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(ano, +m[4] - 1, +m[3]));
}

async function main() {
  let html = fs.readFileSync(PAINEL, "utf8");
  const dd = html.match(/const DADOS\s*=\s*(\{[\s\S]*?\});\s*\n/);
  let DADOS; eval("DADOS=" + dd[1]);
  const mes = DADOS[MES];
  if (!mes) { console.error(`DADOS['${MES}'] não existe`); process.exit(1); }
  const ano = +MES.slice(0, 4);
  const hojeUTC = new Date(); const hoje = new Date(Date.UTC(hojeUTC.getFullYear(), hojeUTC.getMonth(), hojeUTC.getDate()));
  const porLoja = {};

  for (const loja of ["L1", "L3", "L4", "L5"]) {
    const L = mes[loja];
    const fechadas = [], restantes = [];
    for (const s of L.semanas) {
      const fim = parseFimPeriodo(s.periodo, ano);
      (fim && fim <= hoje ? fechadas : restantes).push(s);
    }
    if (!restantes.length) { porLoja[loja] = null; continue; } // última semana fechou — nada a redistribuir
    let realizado = 0;
    for (const s of fechadas) for (const v of Object.values((L.vendas || {})[s.id] || {})) realizado += (+v || 0);
    realizado = Math.round(realizado);
    const alvoRestantes = L.meta_mensal - realizado;
    const ideaisRest = restantes.map(s => (s.base != null ? s.base : s.meta)); // ideal
    const novas = redistribuir(ideaisRest, alvoRestantes, CAP[loja]);
    porLoja[loja] = { fechadas, restantes, realizado, alvoRestantes, ideaisRest, novas,
      mapNovo: Object.fromEntries(restantes.map((s, i) => [s.id, novas[i]])) };
  }

  // relatório
  for (const loja of ["L1", "L3", "L4", "L5"]) {
    const p = porLoja[loja];
    if (!p) { console.log(`\n${loja} · sem semanas restantes — nada a redistribuir`); continue; }
    console.log(`\n${loja} · realizado(fechadas)=${p.realizado} · restantes devem somar ${p.alvoRestantes}`);
    p.restantes.forEach((s, i) => {
      const ideal = p.ideaisRest[i], nova = p.novas[i], d = nova - ideal;
      console.log(`  ${s.id} ideal ${ideal} → real ${nova} ${d === 0 ? "" : (d > 0 ? "(+" + d + ")" : "(" + d + ")")}`);
    });
    console.log(`  soma restantes=${p.novas.reduce((a, b) => a + b, 0)} · mês=${p.realizado + p.novas.reduce((a, b) => a + b, 0)} (teto ${mes[loja].meta_mensal})`);
  }

  if (!APPLY) { console.log("\n(dry-run — rode com --apply pra gravar)"); return; }

  // grava DADOS do painel (meta das restantes; base intacto) + Supabase + Worker
  const iKey = html.indexOf(`'${MES}':`); const braceStart = html.indexOf("{", iKey);
  let depth = 0, regEnd = -1;
  for (let j = braceStart; j < html.length; j++) { const c = html[j]; if (c === "{") depth++; else if (c === "}") { depth--; if (depth === 0) { regEnd = j; break; } } }
  let region = html.slice(braceStart, regEnd + 1);
  for (const loja of ["L1", "L3", "L4", "L5"]) {
    if (!porLoja[loja]) continue;
    const map = porLoja[loja].mapNovo;
    // atualiza meta: dentro do bloco da loja, pra cada semana restante, troca meta:NN
    const lreg = region.match(new RegExp(`(\\n    ${loja}: \\{[\\s\\S]*?semanas: \\[)([\\s\\S]*?)(\\n\\s*\\],)`));
    if (!lreg) { console.error("não achou semanas de", loja); process.exit(1); }
    let semTxt = lreg[2];
    for (const [id, nova] of Object.entries(map)) {
      semTxt = semTxt.replace(new RegExp(`(\\{id:'${id}'[^}]*?meta:)\\d+`), `$1${nova}`);
    }
    region = region.replace(lreg[0], lreg[1] + semTxt + lreg[3]);
  }
  html = html.slice(0, braceStart) + region + html.slice(regEnd + 1);
  fs.writeFileSync(PAINEL, html);
  console.log("\nDADOS do painel atualizado.");

  // Supabase + Worker (só as restantes mudam de meta)
  const ISO = new Date().toISOString();
  const rows = [];
  for (const loja of ["L1", "L3", "L4", "L5"]) { if (!porLoja[loja]) continue; for (const [id, nova] of Object.entries(porLoja[loja].mapNovo)) rows.push({ mes: MES, loja, semana: id, meta: nova, atualizado_em: ISO }); }
  const rS = await fetch(`${SUPA_URL}/rest/v1/metas_semanais?on_conflict=mes,loja,semana`, { method: "POST", headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(rows) });
  console.log("Supabase", rS.status);
  for (const loja of ["L1", "L3", "L4", "L5"]) {
    if (!porLoja[loja]) continue;
    const todas = mes[loja].semanas.map(s => ({ id: s.id, nova: porLoja[loja].mapNovo[s.id] ?? s.meta }));
    const r = await fetch(`${WORKER_URL}/metas-loja`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mes: MES, loja, tipo: "custom", em: ISO, metas: todas }) });
    console.log("Worker", loja, r.status);
  }
  console.log("FIM_OK (rodar atualizar_premiacao.sh pra espelhar o loja.html)");
}
main().catch(e => { console.error("ERRO", e); process.exit(1); });
