#!/usr/bin/env node
/**
 * baseline_justa.mjs
 *
 * Responde: "qual meta é justa pra essa vendedora nessa métrica?"
 *
 * POR QUE EXISTE (15/07/2026): as sugestões ancoravam a meta na SEMANA ANTERIOR.
 * Quando aquela semana era fora da curva pra cima, a meta nascia impossível.
 * Caso Brunna (L3, W28): ticket da S1/jul foi R$82,6 — a MELHOR semana da vida
 * dela (média ~R$71). Pedimos +10% em cima do pico → R$91, que ela nunca fez.
 * Ela cresceu 57% em vendas e mesmo assim levou carimbo de "não funcionou".
 *
 * A REGRA QUE ESTE SCRIPT IMPLEMENTA:
 *   1. Monta a série histórica da pessoa (todas as semanas FECHADAS de DADOS).
 *   2. Se a última semana desviar >=15% da mediana, ela é outlier → ancora na
 *      MEDIANA, não no pico (nem no vale: outlier pra baixo também é injusto,
 *      ancorar nele regala a meta).
 *   3. Calcula o alvo e diz EM QUANTAS DAS SEMANAS HISTÓRICAS ela já alcançou
 *      esse valor. Essa é a prova real de que a meta é possível:
 *      "já fez 3 de 10 vezes" = desafio · "0 de 10" = fantasia.
 *
 * USO:
 *   node baseline_justa.mjs                                  # todas, ticket médio, +10%
 *   node baseline_justa.mjs --metrica vendas --crescimento 15
 *   node baseline_justa.mjs --loja L3 --vendedora Brunna
 *   node baseline_justa.mjs --json                           # saída JSON pra script
 *
 * SEMPRE rodar antes de gerar sugestão com meta relativa (ticket_medio,
 * vendas_individuais). Ver SKILL.md secao 5.7.
 */
import { chromium } from 'playwright';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAINEL = join(__dirname, '..', 'dashboard_premiacao.html');
const LIMIAR_OUTLIER = 15; // % de desvio da mediana a partir do qual a semana é fora da curva

function arg(nome, padrao = null) {
  const i = process.argv.indexOf('--' + nome);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : padrao;
}
const temFlag = (n) => process.argv.includes('--' + n);

const METRICA = arg('metrica', 'ticket_medio');
const CRESC = parseFloat(arg('crescimento', '10'));
const SO_LOJA = arg('loja');
const SO_VEND = arg('vendedora');
// Só pra métrica 'vendas': em quantos dias trabalhados a meta deve ser cumprida.
// A série é normalizada em R$/dia; o alvo final é remultiplicado por isto.
const DIAS_ALVO = parseInt(arg('dias', '6'), 10);

function mediana(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Dias TRABALHADOS (seg–sáb; domingo não abre) no `periodo` de uma semana.
 *
 * As semanas do painel NÃO têm o mesmo tamanho: '01/07–04/07' tem 4 dias,
 * '01/05 a 10/05' tem 9, '22/06–30/06' tem 8. Comparar vendas TOTAIS entre
 * semanas de tamanhos diferentes distorce a mediana pra baixo e inventa
 * outlier onde só houve calendário. Ticket médio é razão (imune), vendas não.
 * Aceita os dois separadores usados no HTML: '–' e ' a '.
 */
function diasTrabalhados(periodo, ano) {
  const m = String(periodo || '').match(/(\d{2})\/(\d{2})\s*(?:–|-|a)\s*(\d{2})\/(\d{2})/);
  if (!m) return null;
  const ini = new Date(ano, +m[2] - 1, +m[1]);
  const fim = new Date(ano, +m[4] - 1, +m[3]);
  if (isNaN(ini) || isNaN(fim) || fim < ini) return null;
  let n = 0;
  for (const d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0) n++; // 0 = domingo
  }
  return n || null;
}

const b = await chromium.launch();
const p = await b.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
await p.goto('file://' + PAINEL);
await p.waitForTimeout(1500);
if (erros.length) { console.error('[baseline] painel com erro de JS:', erros.join(' | ')); process.exit(1); }

const dados = await p.evaluate(({ METRICA }) => {
  const out = [];
  // Roster ativo: LOJAS_BASE só lista quem trabalha hoje. Desligadas (Rosana,
  // Elianna, Alcione) e caixa (Lucas) continuam no histórico de DADOS, mas não
  // faz sentido calcular meta pra elas.
  const ativas = {};
  for (const L of ['L1', 'L3', 'L4', 'L5']) ativas[L] = (LOJAS_BASE[L]?.vendedoras) || [];
  for (const mes of Object.keys(DADOS)) {
    const M = DADOS[mes];
    if (!M || typeof M !== 'object' || !M.L1) continue;
    // Semana corrente ainda está aberta (dados parciais) — nunca entra na série.
    const aberta = M.semana_atual || null;
    for (const L of ['L1', 'L3', 'L4', 'L5']) {
      const d = M[L];
      if (!d || !d.vendas) continue;
      const periodos = {};
      for (const s of (d.semanas || [])) periodos[s.id] = s.periodo || null;
      for (const semId of Object.keys(d.vendas)) {
        if (semId === aberta) continue;
        const vendas = d.vendas[semId] || {};
        const tickets = (d.tickets || {})[semId] || {};
        for (const nome of Object.keys(vendas)) {
          if (nome === 'Outros') continue;
          if (!ativas[L].includes(nome)) continue;
          const v = vendas[nome], t = tickets[nome];
          let valor = null;
          if (METRICA === 'ticket_medio') { if (t > 0 && v > 0) valor = v / t; }
          else { if (v > 0) valor = v; }
          if (valor === null) continue;
          out.push({ mes, loja: L, semana: semId, nome, valor, periodo: periodos[semId] });
        }
      }
    }
  }
  return out;
}, { METRICA });
await b.close();

// Normaliza vendas por dia trabalhado — sem isso a semana de 4 dias entra na
// série competindo com a de 6 e a mediana desaba. Ticket médio não precisa.
const NORMALIZA = METRICA !== 'ticket_medio';
const semDias = [];
for (const r of dados) {
  r.dias = diasTrabalhados(r.periodo, +r.mes.slice(0, 4));
  if (NORMALIZA) {
    if (!r.dias) { semDias.push(`${r.mes}/${r.semana} (${r.loja})`); continue; }
    r.valor_bruto = r.valor;
    r.valor = r.valor / r.dias; // vira R$/dia
  }
}
if (NORMALIZA && semDias.length) {
  console.error('[baseline] ⚠️ sem período legível, semanas ignoradas:', [...new Set(semDias)].join(', '));
}

// agrupa por pessoa
const por = {};
for (const r of dados) {
  if (NORMALIZA && !r.dias) continue;
  const k = r.loja + '|' + r.nome;
  (por[k] = por[k] || []).push(r);
}

const resultados = [];
for (const k of Object.keys(por).sort()) {
  const [loja, nome] = k.split('|');
  if (SO_LOJA && loja !== SO_LOJA) continue;
  if (SO_VEND && nome.toLowerCase() !== SO_VEND.toLowerCase()) continue;
  const serie = por[k].sort((a, b2) => (a.mes + a.semana).localeCompare(b2.mes + b2.semana));
  const vals = serie.map((x) => x.valor);
  if (vals.length < 3) continue; // sem histórico suficiente pra falar de mediana

  const med = mediana(vals);
  const maxi = Math.max(...vals);
  const ultima = serie[serie.length - 1];
  const desvio = (ultima.valor / med - 1) * 100;
  const outlier = Math.abs(desvio) >= LIMIAR_OUTLIER;
  // Ancora na mediana quando a última semana foi fora da curva — pra cima (pico
  // vira meta impossível) OU pra baixo (vale vira meta regalada).
  const ancora = outlier ? med : ultima.valor;
  const alvoPedido = ancora * (1 + CRESC / 100);
  const conta = (alvo) => vals.filter((v) => v >= alvo).length;

  // TESTE DE REALIDADE. Ancorar na mediana não basta: a Naila desviou +14,8% e
  // escapou do corte de outlier por 0,2pp, gerando um alvo que ela nunca fez em
  // 7 semanas. A pergunta que decide é outra — ELA JÁ FEZ ISSO ALGUMA VEZ?
  //   já fez em >=50% das semanas → fácil demais, não é meta
  //   já fez ao menos 1 vez       → desafio justo (ela tem prova de que consegue)
  //   nunca fez, mas <=5% do topo → no limite (stretch honesto, avisar)
  //   nunca fez e acima do topo   → fantasia: rebaixa o alvo pro máximo histórico
  let alvo = alvoPedido, ajustado = false, veredito;
  const jaFezPedido = conta(alvoPedido);
  if (jaFezPedido / vals.length >= 0.5) veredito = 'FACIL';
  else if (jaFezPedido >= 1) veredito = 'DESAFIO_JUSTO';
  else if (alvoPedido <= maxi * 1.05) veredito = 'NO_LIMITE';
  else { alvo = maxi; ajustado = true; veredito = 'REBAIXADO_PRO_MAXIMO'; }

  const jaFez = conta(alvo);
  const alvoIngenuo = ultima.valor * (1 + CRESC / 100);

  resultados.push({
    loja, nome, metrica: METRICA, n_semanas: vals.length,
    ...(NORMALIZA ? {
      normalizado_por_dia: true, dias_alvo: DIAS_ALVO,
      alvo_semana: +(alvo * DIAS_ALVO).toFixed(0),
      mediana_semana: +(med * DIAS_ALVO).toFixed(0),
    } : {}),
    mediana: +med.toFixed(2),
    minimo: +Math.min(...vals).toFixed(2),
    maximo: +maxi.toFixed(2),
    ultima_semana: ultima.mes + '/' + ultima.semana,
    ultima_valor: +ultima.valor.toFixed(2),
    desvio_da_mediana_pct: +desvio.toFixed(1),
    baseline_outlier: outlier,
    ancora_recomendada: +ancora.toFixed(2),
    alvo_pedido: +alvoPedido.toFixed(2),
    alvo_recomendado: +alvo.toFixed(2),
    alvo_ajustado: ajustado,
    ja_alcancou: `${jaFez}/${vals.length}`,
    alvo_ingenuo: +alvoIngenuo.toFixed(2),
    ja_alcancou_ingenuo: `${conta(alvoIngenuo)}/${vals.length}`,
    veredito,
    serie: serie.map((x) => ({ q: x.mes + '/' + x.semana, v: +x.valor.toFixed(2) })),
  });
}

if (temFlag('json')) { console.log(JSON.stringify(resultados, null, 2)); process.exit(0); }

// Na métrica 'vendas' a série está em R$/dia — exibimos sempre já convertido
// pra semana-alvo, senão os números não conversam com o que o Athila vê.
const K = NORMALIZA ? DIAS_ALVO : 1;
const R$ = (v) => (METRICA === 'ticket_medio' ? 'R$' + v.toFixed(0) : 'R$' + Math.round(v * K).toLocaleString('pt-BR'));
console.log(`\n📐 BASELINE JUSTA — ${METRICA} · crescimento pedido: +${CRESC}%`);
console.log(`   (outlier = última semana desviou ≥${LIMIAR_OUTLIER}% da mediana → ancora na mediana)`);
if (NORMALIZA) console.log(`   ⚖️  série normalizada por dia trabalhado; valores exibidos p/ semana de ${DIAS_ALVO} dias`);
console.log('');
const VD = {
  FACIL: '😴 fácil demais', DESAFIO_JUSTO: '✅ desafio justo',
  NO_LIMITE: '🔥 no limite dela', REBAIXADO_PRO_MAXIMO: '⛔ era fantasia → rebaixei',
};
console.log('loja  vendedora    n  mediana  última    desvio  âncora    ALVO  já fez  veredito');
console.log('─'.repeat(88));
for (const r of resultados) {
  const flag = r.baseline_outlier ? '⚠️ ' : '   ';
  const dv = (r.desvio_da_mediana_pct > 0 ? '+' : '') + r.desvio_da_mediana_pct + '%';
  console.log(
    r.loja.padEnd(5) + ' ' + r.nome.padEnd(11) + String(r.n_semanas).padStart(2) + '  ' +
    R$(r.mediana).padStart(6) + '  ' + R$(r.ultima_valor).padStart(6) + ' ' + flag + dv.padStart(7) + '  ' +
    R$(r.ancora_recomendada).padStart(6) + '  ' + R$(r.alvo_recomendado).padStart(6) + '  ' +
    r.ja_alcancou.padStart(5) + '  ' + VD[r.veredito]
  );
  if (r.baseline_outlier) {
    console.log(`      └─ ancorar na última semana daria ${R$(r.alvo_ingenuo)} — já alcançado ${r.ja_alcancou_ingenuo}`);
  }
  if (r.alvo_ajustado) {
    console.log(`      └─ +${CRESC}% sobre a âncora daria ${R$(r.alvo_pedido)}, acima do topo histórico (${R$(r.maximo)}) — nunca feito`);
  }
}
console.log('\nSérie usada (semanas fechadas):');
for (const r of resultados) console.log(`  ${r.loja} ${r.nome.padEnd(11)} ${r.serie.map((x) => R$(x.v)).join(' → ')}`);
console.log('');
