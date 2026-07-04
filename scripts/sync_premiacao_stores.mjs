// sync_premiacao_stores.mjs — leitura headless dos stores compartilhados da
// premiação (Cloudflare Worker KV + Supabase) pra Etapa 3 do skill
// dashboard-premiacao-update.
//
// Substitui (04/07/2026) a leitura de localStorage via Chrome MCP: o painel do
// Athila e os apps das vendedoras já POSTam tudo direto nos stores, então a
// sincronização vira um fetch simples — zero browser, funciona em cron.
//
// Uso:  node sync_premiacao_stores.mjs            → JSON completo no stdout
//       node sync_premiacao_stores.mjs --resumo   → só contagens (debug rápido)
//
// Saída (JSON):
//   avaliacoes[]    {id_sugestao, resultado, comentario, em}
//   overrides[]     {id_sugestao, status, texto_editado, prazo, em}
//   feedbacks[]     {id_sugestao, loja, vendedora, acao, comentario, em}
//   retornos[]      {id_sugestao, loja, vendedora, status, texto, em}
//   metas_por_loja[] {mes, loja, tipo, metas:[{id, nova}], em, fonte}
//   coletado_em     ISO timestamp
//
// Merge: Worker ∪ Supabase, registro mais recente (em) vence — mesmo critério
// do mergeItens() do painel. Pras metas, o Supabase (metas_semanais) é
// AUTORITATIVO por semana, igual ao boot do painel. Tabelas Supabase ainda não
// criadas (supabase_premiacao_completo.sql pendente) são toleradas: o Worker
// sozinho responde por tudo.

const WORKER_URL = 'https://premiacao-amgomes.nhf6t85hdk.workers.dev';
const SUPA_URL = 'https://valhewbvjwdkkvuejrxa.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4'; // anon key — pública por design (RLS aberto)

async function workerGet(path) {
  const r = await fetch(`${WORKER_URL}${path}`, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Worker ${path} → HTTP ${r.status}`);
  return (await r.json()).items || [];
}

// Tabela pode não existir ainda → retorna null (só o Worker vale).
async function supaSelect(table, query) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${query || 'select=*'}`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function mergeItens(workerItems, supaItems, keyFn) {
  const map = new Map();
  for (const it of (workerItems || [])) map.set(keyFn(it), it);
  for (const it of (supaItems || [])) {
    const k = keyFn(it), cur = map.get(k);
    if (!cur || new Date(it.em || 0) >= new Date(cur.em || 0)) map.set(k, it);
  }
  return [...map.values()];
}

const [wAval, wOver, wFeed, wRet, wMetas, sAval, sOver, sFeed, sRet, sMetas] = await Promise.all([
  workerGet('/avaliacoes'),
  workerGet('/overrides'),
  workerGet('/feedbacks'),
  workerGet('/feedback-retornos'),
  workerGet('/metas-loja'),
  supaSelect('sugestoes_avaliacoes'),
  supaSelect('sugestoes_overrides'),
  supaSelect('feedbacks'),
  supaSelect('feedback_retornos'),
  supaSelect('metas_semanais', 'select=mes,loja,semana,meta,atualizado_em'),
]);

// Metas: base = Worker (traz o tipo); Supabase sobrescreve por (mes,loja,semana).
const metasMap = new Map(); // 'mes|loja' → {mes, loja, tipo, em, fonte, metas: Map(id→nova)}
for (const it of wMetas) {
  if (!it || !Array.isArray(it.metas)) continue;
  const k = `${it.mes}|${it.loja}`;
  const cur = metasMap.get(k);
  if (cur && new Date(cur.em || 0) >= new Date(it.em || 0)) continue;
  metasMap.set(k, { mes: it.mes, loja: it.loja, tipo: it.tipo || 'custom', em: it.em, fonte: 'worker', metas: new Map(it.metas.map(m => [m.id, m.nova])) });
}
for (const row of (sMetas || [])) {
  const k = `${row.mes}|${row.loja}`;
  let e = metasMap.get(k);
  if (!e) { e = { mes: row.mes, loja: row.loja, tipo: 'custom', em: row.atualizado_em, fonte: 'supabase', metas: new Map() }; metasMap.set(k, e); }
  e.metas.set(row.semana, row.meta); // Supabase é autoritativo por semana
  if (e.fonte === 'worker') e.fonte = 'worker+supabase';
}
const metas_por_loja = [...metasMap.values()].map(e => ({
  mes: e.mes, loja: e.loja, tipo: e.tipo, em: e.em, fonte: e.fonte,
  metas: [...e.metas].map(([id, nova]) => ({ id, nova })).sort((a, b) => a.id.localeCompare(b.id)),
}));

const out = {
  avaliacoes: mergeItens(wAval, sAval, x => x.id_sugestao),
  overrides: mergeItens(wOver, sOver, x => x.id_sugestao),
  feedbacks: mergeItens(wFeed, sFeed, x => `${x.id_sugestao}|${x.loja}|${x.vendedora}`),
  retornos: mergeItens(wRet, sRet, x => `${x.id_sugestao}|${x.loja}|${x.vendedora}`),
  metas_por_loja,
  supabase_tabelas_ok: { sugestoes_avaliacoes: sAval !== null, sugestoes_overrides: sOver !== null, feedbacks: sFeed !== null, feedback_retornos: sRet !== null, metas_semanais: sMetas !== null },
  coletado_em: new Date().toISOString(),
};

if (process.argv.includes('--resumo')) {
  console.log(JSON.stringify({
    avaliacoes: out.avaliacoes.length, overrides: out.overrides.length,
    feedbacks: out.feedbacks.length, retornos: out.retornos.length,
    metas_por_loja: out.metas_por_loja.length,
    supabase_tabelas_ok: out.supabase_tabelas_ok, coletado_em: out.coletado_em,
  }, null, 2));
} else {
  console.log(JSON.stringify(out, null, 2));
}
