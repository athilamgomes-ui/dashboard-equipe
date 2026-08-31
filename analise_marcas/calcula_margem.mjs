// Margem líquida real por marca. Regras fiscais do Athila (25/08/2026) — ver README.md
import fs from "fs";
const W = "/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas";
const A = JSON.parse(fs.readFileSync(W + "/custo_compra.json", "utf8"));        // custo da nota  (custo col6, preco col9)
const B = JSON.parse(fs.readFileSync(W + "/custo_medio_epoca.json", "utf8"));   // custo do dia   (custo col6, preco col10)
const F = JSON.parse(fs.readFileSync(W + "/fiscal_por_setor.json", "utf8"));
const STP = JSON.parse(fs.readFileSync("/Users/elkgomes/Desktop/claude/dashboard-equipe/st_pa_ncm.json", "utf8"));
const MAR = JSON.parse(fs.readFileSync(W + "/cod_marca.json", "utf8"));
const PREF = STP.ncm_st.map(String).sort((a, b) => b.length - a.length);
const ehST = n => { n = String(n || "").replace(/\D/g, ""); return n ? PREF.some(c => n.startsWith(c)) : null; };
const ncm = {}, cfg = {};
for (const a of Object.values(F.lojas)) for (const p of a) { if (p.ncm) ncm[p.codigo] = p.ncm; if (p.configTxt) cfg[p.codigo] = p.configTxt; }
const num = s => { const t = String(s ?? "").trim(); const v = parseFloat(t.replace(/\./g, "").replace(",", ".")); return isNaN(v) ? 0 : v; };
const CF = { L1: 0.209, L3: 0.30, L4: 0.25, L5: 0.30 };
const VAR = 0.027 + 0.01 + 0.02;  // cartão + comissão + outros (imposto entra por produto)
const FAT = [2,3,4,5,6,10,12,20,24,25,36,48,50,100,144,200,250,500,1000];
const perto = (r, f) => Math.abs(r - f) / f < 0.12;
const marcas = {}; const diag = { ok: 0, pack: 0, veneno: 0, semCusto: 0, semNCM: 0, descartado: 0 };
const fiscalErrado = {};
for (const lj of ["L1", "L4", "L3", "L5"]) {
  const bi = {}; for (const r of B[lj] || []) bi[r[0].trim()] = { c: num(r[6]), p: num(r[10]) };
  for (const r of A[lj] || []) {
    const cod = r[0].trim(), q = num(r[5]), cA = num(r[6]), preco = num(r[9]);
    const m = MAR[cod]; if (!m || q <= 0 || preco <= 0) continue;
    const b = bi[cod], cB = b ? b.c : 0;
    // --- custo reconciliado (as duas fontes têm defeitos opostos) ---
    let custo = 0; const razao = cA > 0 && cB > 0 ? cA / cB : 0;
    if (cA > 0 && cB > 0) {
      if (razao > 0.7 && razao < 1.45) { custo = cB; diag.ok++; }
      else if (razao > 1.45 && FAT.some(f => perto(razao, f))) { custo = cB; diag.pack++; }
      else if (razao < 0.7) { custo = cA; diag.veneno++; }
      else { diag.descartado++; continue; }
    } else if (cB > 0) { custo = cB; diag.ok++; } else { diag.semCusto++; continue; }
    if (custo <= 0 || custo / preco > 1.6) { diag.descartado++; continue; }
    // --- regra fiscal ---
    const n = ncm[cod]; if (!n) { diag.semNCM++; continue; }
    const st = ehST(n);
    const custoEf = st ? custo * 1.21 : custo;   // regra 1: ST paga 21% na entrada
    const imposto = st ? 0 : 0.19;               // regra 1 e 3
    // cadastro divergente do NCM (para a lista do contador)
    const c = cfg[cod] || "";
    const cadST = /SUBSTITUICAO|^ST/i.test(c);
    if (st !== null && cadST !== st) {
      const k = cod; (fiscalErrado[k] ||= { cod, desc: r[1], ncm: n, cadastro: c, deveria: st ? "ST" : "TI", rec: 0 });
      fiscalErrado[k].rec += q * preco;
    }
    const rec = q * preco;
    (marcas[m] ||= { rec: 0, lucro: 0, recCob: 0, st: 0, nst: 0, n: 0 });
    const g = marcas[m];
    g.rec += rec; g.n++;
    g.lucro += rec * (1 - custoEf / preco - VAR - CF[lj] - imposto);
    if (st) g.st += rec; else g.nst += rec;
  }
}
const L = Object.entries(marcas).map(([m, v]) => ({ m, rec: v.rec, liq: v.lucro / v.rec, stPct: v.st / v.rec, n: v.n })).filter(x => x.rec > 4000).sort((a, b) => b.rec - a.rec);
fs.writeFileSync(W + "/margem_final.json", JSON.stringify({ diag, marcas: L, fiscalErrado: Object.values(fiscalErrado).sort((a, b) => b.rec - a.rec) }, null, 1));
const brl = n => Math.round(n).toLocaleString("pt-BR"), pc = n => (n * 100).toFixed(1).replace(".", ",") + "%";
console.log("DIAG: " + JSON.stringify(diag));
console.log(`\n${L.length} marcas · R$ ${brl(L.reduce((s, x) => s + x.rec, 0))} (jun–ago/2026)\n`);
console.log("MARCA".padEnd(24) + "RECEITA".padStart(10) + "LÍQUIDA".padStart(9) + "  %ST" .padStart(7) + "  prod");
for (const x of L) console.log(x.m.slice(0, 22).padEnd(24) + brl(x.rec).padStart(10) + pc(x.liq).padStart(9) + pc(x.stPct).padStart(7) + "  " + x.n);
const A17 = L.filter(x => x.liq >= 0.17);
console.log(`\n≥17% líquido: ${A17.length} de ${L.length} marcas = ${pc(A17.reduce((s, x) => s + x.rec, 0) / L.reduce((s, x) => s + x.rec, 0))} da receita`);
const fe = Object.values(fiscalErrado);
console.log(`\nCADASTRO FISCAL DIVERGENTE DO NCM: ${fe.length} produtos, R$ ${brl(fe.reduce((s, x) => s + x.rec, 0))} vendidos em 3 meses`);
