#!/usr/bin/env node
/**
 * build_amgomes.mjs — renderiza TODOS os blocos de dados do dashboard_amgomes.html
 * de forma 100% determinística, a partir dos JSONs coletados. SEM LLM.
 *
 * Uso: node build_amgomes.mjs <lojas_out.json> <vend_out.json>
 *   (fatMensal/YoY é atualizado separadamente por atualiza_fatmensal.mjs, ANTES deste build)
 *
 * Regenera, no dashboard_amgomes.html:
 *   - timestamp real (#lastUpdate), badge de data, título da Seção 1
 *   - 4 KPI cards (valor, %meta do período, badge, ordenados por ranking)
 *   - arrays faturado / maiAcum / metas
 *   - rótulos e ordem dos gráficos por loja (makeStoreChart)
 *   - bloco `vendedores` (preservando m12 já existente por nome)
 *
 * Escrita única (read → transforma tudo em memória → write). Idempotente.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = join(__dirname, "..", "dashboard_amgomes.html");

// ── Config (editável) ──
const META_MENSAL = { L1: 140000, L3: 80000, L4: 140000, L5: 90000 };
const LOJA = {
  L1: { emp: "1",  nome: "Casa Beleza Altamira",  cor: "#d97706", chart: "chart_L1", chartTitle: "Casa ATM" },
  L3: { emp: "3",  nome: "Casa Beleza Itaituba",  cor: "#0891b2", chart: "chart_L3", chartTitle: "Casa Itaituba" },
  L4: { emp: "4",  nome: "MissBeleza Altamira",   cor: "#dc2626", chart: "chart_L4", chartTitle: "MB Altamira" },
  L5: { emp: "10", nome: "MissBeleza Santarém",   cor: "#6366f1", chart: "chart_L5", chartTitle: "MB Santarém" },
};
const ORDEM_ARR = ["L5", "L4", "L1", "L3"];   // ordem dos arrays faturado/maiAcum/metas e idx do chart
const IDX = { L5: 0, L4: 1, L1: 2, L3: 3 };
const PESO_DIA = { 0: 0, 1: 19, 2: 16, 3: 15, 4: 16, 5: 16, 6: 18 }; // getDay() → peso (Dom=0)
const MES_ABBR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MEDALHA = ["🥇", "🥈", "🥉", "4º"];

const log = (...a) => console.error("[build]", ...a);
const die = (m) => { log("ERRO:", m); process.exit(1); };

const intBR = s => Math.round(parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0);
const floatBR = s => parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;
const fmtMil = n => n.toLocaleString("pt-BR");
const fmtPct = p => p.toFixed(1).replace(".", ",") + "%";
const primeiroNome = full => {
  const w = full.replace(/\s*\(\d+\)\s*$/, "").trim().split(/\s+/)[0].replace(/\uFFFD/g, "");
  return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w;
};

// ── Ler entradas ──
const arqLojas = process.argv[2] || "/tmp/lojas_out.json";
const arqVend = process.argv[3] || "/tmp/vend_out.json";
const lojasData = JSON.parse(fs.readFileSync(arqLojas, "utf8"));
const vendData = JSON.parse(fs.readFileSync(arqVend, "utf8"));
let html = fs.readFileSync(HTML, "utf8");

// ── Data/hora atuais ──
const agora = new Date();
const dd = String(agora.getDate()).padStart(2, "0");
const mm = String(agora.getMonth() + 1).padStart(2, "0");
const aaaa = agora.getFullYear();
const hh = String(agora.getHours()).padStart(2, "0");
const mi = String(agora.getMinutes()).padStart(2, "0");
const mesIdx = agora.getMonth();           // 0-based
const mesLabel = MES_ABBR[mesIdx];
const mesAntLabel = MES_ABBR[(mesIdx + 11) % 12];
const diaHoje = agora.getDate();

// fração decorrida do mês (por pesos de dia útil) → meta do período
const diasNoMes = new Date(aaaa, mesIdx + 1, 0).getDate();
let pesoElapsed = 0, pesoTotal = 0;
for (let d = 1; d <= diasNoMes; d++) {
  const w = PESO_DIA[new Date(aaaa, mesIdx, d).getDay()];
  pesoTotal += w;
  if (d <= diaHoje) pesoElapsed += w;
}
const fracMes = pesoTotal > 0 ? pesoElapsed / pesoTotal : 1;
log(`período: 01..${dd}/${mm}/${aaaa} · fração do mês = ${(fracMes * 100).toFixed(1)}%`);

// ── Extrair métricas por loja ──
const M = {};
for (const [k, info] of Object.entries(LOJA)) {
  const cells = lojasData?.[info.emp]?.cells;
  if (!cells) die(`empresa ${info.emp} (${k}) ausente em ${arqLojas}`);
  const vliq = intBR(cells[5]);
  const qtd = intBR(cells[1]);
  const margem = floatBR(cells[8]);
  const metaMensal = META_MENSAL[k];
  const metaPeriodo = Math.round(metaMensal * fracMes);
  const pct = metaPeriodo > 0 ? (vliq / metaPeriodo) * 100 : 0;
  M[k] = { ...info, loja: k, vliq, qtd, margem, metaMensal, metaPeriodo, pct };
}

// Sanity-check: pelo menos 1 loja com venda > 0 e 4 lojas presentes
if (Object.keys(M).length !== 4) die("faltam lojas");
if (Object.values(M).every(m => m.vliq === 0)) die("todas as lojas com V.Líquida 0 — coleta suspeita, abortando");

// ── Ranking (por % meta; fração cancela → equivalente a vliq/metaMensal) ──
const ranking = Object.values(M).sort((a, b) => (b.vliq / b.metaMensal) - (a.vliq / a.metaMensal));
ranking.forEach((m, i) => { m.rank = i + 1; });
log("ranking: " + ranking.map(m => `${m.loja}(${fmtPct(m.pct)})`).join(" > "));

const badgeDe = pct => pct >= 80
  ? { cls: "badge-green", txt: "✔ Bom" }
  : pct >= 60 ? { cls: "badge-yellow", txt: "⚡ Atenção" }
              : { cls: "badge-red", txt: "⚠ Risco" };

// ── 1) Badge de data + título + timestamp ──
const badgeData = diaHoje === 1
  ? `📅 01/${mm}/${aaaa} — início do mês (1º dia)`
  : `📅 01–${dd}/${mm}/${aaaa} — acumulado do mês`;
const tituloSecao = diaHoje === 1
  ? `Ranking de Desempenho — 01/${mm}/${aaaa} (início do mês)`
  : `Ranking de Desempenho — 01–${dd}/${mm}/${aaaa} (acumulado do mês)`;

html = html.replace(/<div class="date-badge">[^<]*<\/div>/,
  `<div class="date-badge">${badgeData}</div>`);
html = html.replace(/<div class="last-update" id="lastUpdate">[^<]*<\/div>/,
  `<div class="last-update" id="lastUpdate">Atualizado em ${dd}/${mm}/${aaaa} às ${hh}:${mi}</div>`);
html = html.replace(/(<div class="section-title"><div class="num">1<\/div> )Ranking de Desempenho[^<]*(<\/div>)/,
  `$1${tituloSecao}$2`);

// ── 2) KPI cards (ordenados por rank) ──
function kpiCard(m) {
  const b = badgeDe(m.pct);
  const w = Math.min(100, Math.max(2, Math.round(m.pct)));
  return `    <!-- ${m.nome} — ${m.rank}º por % de meta (${fmtPct(m.pct)}) — ${mesLabel}/${aaaa} (V. Líquida) -->
    <div class="kpi-card rank${m.rank}">
      <div class="kpi-store">${MEDALHA[m.rank - 1]} ${m.nome}</div>
      <div class="kpi-value" style="color:${m.cor};">R$&nbsp;${fmtMil(m.vliq)}</div>
      <div class="kpi-meta">Meta período R$ ${fmtMil(m.metaPeriodo)} · <strong>${fmtPct(m.pct)}</strong></div>
      <span class="badge ${b.cls}">${b.txt}</span>
      <div class="progress-wrap">
        <div class="progress-label"><span>Atingido</span><span>${fmtPct(m.pct)}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${w}%;background:${m.cor};"></div></div>
      </div>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Qtde Peças</div><div class="metric-value" style="font-size:15px;">${fmtMil(m.qtd)}</div></div>
        <div class="metric"><div class="metric-label">V. Líquida</div><div class="metric-value" style="font-size:15px;color:${m.cor};">R$${fmtMil(m.vliq)}</div></div>
        <div class="metric"><div class="metric-label">Margem</div><div class="metric-value" style="font-size:15px;color:#059669;">${fmtPct(m.margem)}</div></div>
      </div>
    </div>`;
}
const novoGrid = `  <div class="grid4" style="margin-bottom:16px;">\n` +
  ranking.map(kpiCard).join("\n") + `\n  </div>\n\n`;
{
  const i0 = html.indexOf('  <div class="grid4" style="margin-bottom:16px;">');
  const i1 = html.indexOf("  <!-- Comparativo mês a mês");
  if (i0 < 0 || i1 < 0) die("âncoras do grid KPI não encontradas");
  html = html.slice(0, i0) + novoGrid + html.slice(i1);
}

// ── 3) Arrays faturado / maiAcum / metas ──
// faturado = mês fechado anterior (lido do fatMensal já atualizado)
let faturadoArr;
{
  const mFat = html.match(/atual:\s*\{[\s\S]*?L1:\s*\[([^\]]*)\][\s\S]*?L3:\s*\[([^\]]*)\][\s\S]*?L4:\s*\[([^\]]*)\][\s\S]*?L5:\s*\[([^\]]*)\]/);
  const prevIdx = mesIdx - 1; // índice 0-based do mês anterior dentro do array (Jan=0)
  if (mFat && prevIdx >= 0) {
    const get = g => g.split(",").map(x => intBR(x.trim()));
    const a = { L1: get(mFat[1]), L3: get(mFat[2]), L4: get(mFat[3]), L5: get(mFat[4]) };
    faturadoArr = ORDEM_ARR.map(k => a[k]?.[prevIdx] ?? 0);
  } else {
    // fallback: mantém o faturado atual do HTML
    const cur = html.match(/const faturado = \[([^\]]*)\]/);
    faturadoArr = cur ? cur[1].split(",").map(x => intBR(x.trim())) : ORDEM_ARR.map(() => 0);
  }
}
const maiAcumArr = ORDEM_ARR.map(k => M[k].vliq);
const metasArr = ORDEM_ARR.map(k => META_MENSAL[k]);

html = html.replace(/const faturado = \[[^\]]*\];[^\n]*/,
  `const faturado = [${faturadoArr.join(", ")}];   // ${mesAntLabel}/${aaaa} — mês completo`);
html = html.replace(/const maiAcum  = \[[^\]]*\];[^\n]*/,
  `const maiAcum  = [${maiAcumArr.join(", ")}];   // ${mesLabel}/${aaaa} — acum 01–${dd}/${mm} (V. Líquida — Vendas por Lojas)`);
html = html.replace(/const metas    = \[[^\]]*\];[^\n]*/,
  `const metas    = [${metasArr.join(", ")}];   // Meta ${mesLabel}/${aaaa}`);

// ── 4) Rótulos e ordem dos gráficos ──
html = html.replace(/labels: \[[^\]]*Acum[^\]]*\],/,
  `labels: ['${mesAntLabel}/${String(aaaa).slice(2)}', '${mesLabel} Acum', 'Meta ${mesLabel}'],`);
{
  const novoCharts = ranking.map(m =>
    `makeStoreChart('${m.chart}', ${IDX[m.loja]}, '${m.cor}');  // ${m.loja} ${m.nome} — rank${m.rank}`
  ).join("\n");
  html = html.replace(/(makeStoreChart\('chart_L\d+', \d+, '#[0-9a-fA-F]+'\);[^\n]*\n?){4}/, novoCharts + "\n");
}

// ── 4b) Cards dos gráficos (DOM) na MESMA ordem do ranking dos KPIs (lojas correspondem 1-a-1) ──
{
  const iIni = html.indexOf("<!-- CHARTSGRID_INICIO -->");
  const iFim = html.indexOf("<!-- CHARTSGRID_FIM -->");
  if (iIni < 0 || iFim < 0) {
    log("aviso: marcadores CHARTSGRID ausentes — ordem dos gráficos não sincronizada.");
  } else {
    const yy2 = String(aaaa).slice(2);
    const cards = ranking.map(m =>
`    <div class="card">
      <div class="card-title"><span>📊</span> ${m.chartTitle} · ${mesAntLabel}/${yy2} · ${mesLabel} Acum · Meta</div>
      <div style="position:relative;height:180px;"><canvas id="${m.chart}"></canvas></div>
    </div>`).join("\n");
    const novoGrid =
`<!-- CHARTSGRID_INICIO --> <!-- ordem = ranking dos KPIs (gerado por build_amgomes.mjs) -->
  <div class="grid4">
${cards}
  </div>
  `;
    html = html.slice(0, iIni) + novoGrid + html.slice(iFim);
  }
}

// ── 5) Vendedores (preserva m12 por nome) ──
{
  const iIni = html.indexOf("// ─── VENDEDORES_INICIO");
  const iFim = html.indexOf("// ─── VENDEDORES_FIM");
  if (iIni < 0 || iFim < 0) die("marcadores VENDEDORES não encontrados");
  const trecho = html.slice(iIni, iFim);
  // m12 atual por loja+primeiroNome
  const m12Map = {};
  const objMatch = trecho.match(/const vendedores = (\{[\s\S]*\});/);
  if (objMatch) {
    try {
      const atual = Function('"use strict";return (' + objMatch[1] + ');')();
      for (const [loja, arr] of Object.entries(atual)) {
        m12Map[loja] = {};
        for (const v of arr) if (v.m12 != null) m12Map[loja][primeiroNome(v.n).toLowerCase()] = v.m12;
      }
    } catch (e) { log("aviso: não consegui parsear vendedores antigos p/ m12: " + e.message); }
  }
  const linhasLoja = loja => {
    const arr = (vendData[loja] || []).filter(x => x && x.n);
    return arr.map(v => {
      const nome = primeiroNome(v.n);
      const m12 = m12Map[loja]?.[nome.toLowerCase()];
      const campo = `{n:'${nome}', v:${v.v}, t:${v.t}, tm:${v.tm}${m12 != null ? `, m12:${m12}` : ""}}`;
      return "    " + campo;
    }).join(",\n");
  };
  const novoVend = `// ─── VENDEDORES_INICIO ───────────────────────────────
// Formato: {n: nome, v: venda_liquida, t: tickets, tm: ticket_medio, m12: média 12m}
// Gerado por build_amgomes.mjs — NÃO editar manualmente
const vendedores = {
  L1: [
${linhasLoja("L1")}
  ],
  L3: [
${linhasLoja("L3")}
  ],
  L4: [
${linhasLoja("L4")}
  ],
  L5: [
${linhasLoja("L5")}
  ]
};
`;
  html = html.slice(0, iIni) + novoVend + html.slice(iFim);
}

fs.writeFileSync(HTML, html);
log(`OK — dashboard regenerado (${mesLabel}/${aaaa}, ${dd}/${mm} ${hh}:${mi}).`);
process.exit(0);
