#!/usr/bin/env node
/**
 * build_premiacao.mjs — ÚNICO ESCRITOR dos HTMLs da premiação
 * (dashboard_premiacao.html + loja.html). 100% determinístico, SEM LLM.
 *
 * Mesmo papel do build_amgomes.mjs no dashboard de vendas: recebe os JSONs das
 * coletas e re-renderiza SÓ os blocos de dados da semana corrente + agregados
 * vivos, por cirurgia de string escopada (brace-matching por região) — o diff
 * gerado é idêntico ao padrão dos commits de cron (ex.: 3d00949 de 28/07/2026).
 *
 * MODOS:
 *   --janelas
 *       Lê o painel, determina mês/semana corrente pelas janelas `periodo` de
 *       DADOS[mes][L1].semanas e imprime JSON com os argumentos prontos pras
 *       coletas (etapa1 = Sx+ONTEM+HOJE; cliente8 = Sx+MES).
 *       Exit: 0 ok · 5 mês sem estrutura no painel (rollover pendente = agente)
 *             · 4 hoje fora de qualquer janela (ex.: domingo).
 *
 *   --prep-etapa2 <etapa1.json> <cliente8.json>
 *       Valida a coleta (4 lojas presentes) e imprime JSON {semanas, totais}
 *       prontos pra CLI do cron_etapa2_marcas_a.mjs. Totais da semana corrente
 *       já vêm com o cliente 8 subtraído; total do MES = semanas fechadas do
 *       HTML (já ajustadas na época) + semana corrente fresca.
 *       Exit: 0 ok · 6 sanity da coleta falhou.
 *
 *   --render <etapa1.json> <etapa2.json> <stores.json> <cliente8.json> <coletado_em>
 *       Reescreve os blocos nos DOIS HTMLs. <coletado_em> = 'DD/MM/AAAA HH:MM'
 *       (hora REAL do fim da Etapa 1 — vira DADOS_COLETADO_EM; nunca page-load).
 *       Grava resumo em /tmp/premiacao_build_resumo.txt e avisos em
 *       /tmp/premiacao_build_warns.txt (pro wrapper usar no commit/push).
 *       Exit: 0 ok · 1 falha (wrapper restaura os backups).
 *
 * REGRAS DE NEGÓCIO QUE ESTE BUILD GARANTE (ver SKILL.md do cron):
 *   - Semanas FECHADAS são snapshots imutáveis: o build SÓ toca a semana
 *     corrente (vendas/tickets/pecas/cmv/marcasA_loja[Sx]) e os agregados
 *     vivos (marcasA_indiv, DADOS_LOJA, ontem/hoje). S1..S(x-1) ficam
 *     byte a byte como estavam. HISTORICO_PREMIOS nunca é tocado.
 *   - Meta Real: as metas de semanas vêm dos stores (Supabase metas_semanais
 *     autoritativo via sync_premiacao_stores.mjs) e são aplicadas no hardcoded.
 *   - Cliente 8 (R MAURA): subtraído do "Outros" da semana corrente (valor,
 *     peças, tickets). Se valor > Outros → zera Outros e AVISA (revisão manual).
 *   - Overrides de sugestões: aplicados por cima (mais recente já vem resolvido
 *     do sync), NOS DOIS HTMLs — SUGESTOES precisa ficar idêntico entre eles.
 *     status:'pendente' só vira 'aprovada' se houver override do Athila.
 *   - Etapa 2 indisponível pra alguma chave → valor anterior PRESERVADO (não zera).
 *   - DADOS_COLETADO_EM = hora real da coleta (string estática).
 */
import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const PAINEL = join(REPO, "dashboard_premiacao.html");
const LOJA = join(REPO, "loja.html");
const AVAL_JSON = join(REPO, "avaliacoes_premiacao.json");
const RESUMO_FILE = "/tmp/premiacao_build_resumo.txt";
const WARNS_FILE = "/tmp/premiacao_build_warns.txt";

const LOJAS = ["L1", "L3", "L4", "L5"];
const log = (...a) => console.error("[build-premiacao]", ...a);
const die = (msg, code = 1) => { log("ERRO:", msg); process.exit(code); };

const WARNS = [];
const warn = (m) => { WARNS.push(m); log("AVISO:", m); };

// ── util: parse números/formatos ────────────────────────────────────────────
const r1 = (n) => Number((Math.round(n * 10) / 10).toFixed(1)); // 1 casa, 34.0→34
const pct = (num, den) => (den > 0 ? r1((num / den) * 100) : 0);
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// nome vira chave JS sem aspas se for identificador válido (Bárbara ok; 'Bruna F.' não)
const jsKey = (name) => (/^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(name) ? name : `'${name.replace(/'/g, "\\'")}'`);
const jsStr = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " ")}'`;

// ── util: brace matching ciente de strings/comentários ──────────────────────
function matchBrace(src, openIdx) {
  if (src[openIdx] !== "{" && src[openIdx] !== "[") throw new Error(`matchBrace: char em ${openIdx} é '${src[openIdx]}'`);
  const open = src[openIdx], close = open === "{" ? "}" : "]";
  let depth = 0, i = openIdx, mode = null; // mode: "'", '"', '`', '//', '/*'
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (mode === "'" || mode === '"' || mode === "`") {
      if (c === "\\") { i++; continue; }
      if (c === mode) mode = null;
      continue;
    }
    if (mode === "//") { if (c === "\n") mode = null; continue; }
    if (mode === "/*") { if (c === "*" && n === "/") { mode = null; i++; } continue; }
    if (c === "'" || c === '"' || c === "`") { mode = c; continue; }
    if (c === "/" && n === "/") { mode = "//"; i++; continue; }
    if (c === "/" && n === "*") { mode = "/*"; i++; continue; }
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") { depth--; if (depth === 0 && c === close) return i; }
  }
  throw new Error("matchBrace: fim do arquivo sem fechar");
}

// extrai `const NOME = {...};` → {start, end (exclusivo, depois de ;), objText, obj}
function extractConst(html, nome) {
  const m = html.indexOf(`const ${nome} = `);
  if (m < 0) throw new Error(`const ${nome} não encontrado`);
  const openIdx = html.indexOf(nome.match(/AVALIACOES/) ? "[" : "{", m);
  const closeIdx = matchBrace(html, openIdx);
  const objText = html.slice(openIdx, closeIdx + 1);
  let obj;
  try { obj = Function(`"use strict";return (${objText});`)(); }
  catch (e) { throw new Error(`parse de ${nome} falhou: ${e.message}`); }
  return { start: openIdx, end: closeIdx + 1, objText, obj };
}

// região de um sub-objeto `chave: {` dentro de [from,to) — retorna {open, close}
function subRegion(html, from, to, chaveRegex) {
  const slice = html.slice(from, to);
  const m = slice.match(chaveRegex);
  if (!m) return null;
  const open = from + m.index + m[0].length - 1; // último char do match deve ser '{'
  const close = matchBrace(html, open);
  return { open, close };
}

// ── datas ───────────────────────────────────────────────────────────────────
function hojeInfo(now = new Date()) {
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const aaaa = now.getFullYear();
  return { now, dd, mm, aaaa, mesKey: `${aaaa}-${mm}`, dataBR: `${dd}/${mm}/${aaaa}`, dow: now.getDay() };
}
const toBR = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const fromBR = (s) => { const [d, m, a] = s.split("/").map(Number); return new Date(a, m - 1, d); };
const DIAS_PT = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

// periodo 'DD/MM–DD/MM' ou 'DD/MM a DD/MM' → {di:'DD/MM/AAAA', df:'DD/MM/AAAA'}
function parsePeriodo(periodo, ano) {
  const m = String(periodo).match(/(\d{2})\/(\d{2})\s*(?:–|—|-|a)\s*(\d{2})\/(\d{2})/);
  if (!m) return null;
  return { di: `${m[1]}/${m[2]}/${ano}`, df: `${m[3]}/${m[4]}/${ano}` };
}

// ── contexto do mês corrente lido do painel ─────────────────────────────────
function contextoDoMes() {
  const painel = fs.readFileSync(PAINEL, "utf8");
  const { dd, mm, aaaa, mesKey, dataBR, now } = hojeInfo();
  const dados = extractConst(painel, "DADOS");
  const mes = dados.obj[mesKey];
  if (!mes || typeof mes !== "object") {
    log(`DADOS['${mesKey}'] ausente/null no painel — estrutura do mês nova é tarefa do agente (rollover).`);
    process.exit(5);
  }
  // janelas a partir da L1 (todas as lojas compartilham os mesmos períodos)
  const semanas = (mes.L1?.semanas || []).map((s) => {
    const w = parsePeriodo(s.periodo, aaaa);
    return w ? { id: s.id, di: w.di, df: w.df, periodo: s.periodo } : null;
  }).filter(Boolean);
  if (!semanas.length) die(`nenhuma semana com periodo parseável em DADOS['${mesKey}'].L1.semanas`);
  const hojeD = fromBR(dataBR);
  const atual = semanas.find((s) => hojeD >= fromBR(s.di) && hojeD <= fromBR(s.df));
  if (!atual) {
    log(`hoje (${dataBR}) fora de qualquer janela de semana do mês ${mesKey} (domingo/dia-vago?)`);
    process.exit(4);
  }
  // ONTEM: dia anterior; se domingo, volta pro sábado
  const ontemD = new Date(now); ontemD.setDate(ontemD.getDate() - 1);
  if (ontemD.getDay() === 0) ontemD.setDate(ontemD.getDate() - 1);
  return {
    painel, mesKey, dd, mm, aaaa, dataBR,
    semanaAtual: atual, semanas,
    ontemBR: toBR(ontemD), ontemDow: DIAS_PT[ontemD.getDay()],
    hojeDow: DIAS_PT[hojeD.getDay()],
    dadosMes: mes,
  };
}

// ── cliente 8: subtrai do Outros da semana corrente (in place no etapa1) ────
function aplicarCliente8(etapa1, cliente8, semId) {
  for (const loja of LOJAS) {
    const c8 = cliente8?.[loja]?.[semId];
    if (!c8 || !(c8.valor > 0)) continue;
    const vendas = etapa1[loja]?.[semId] || {};
    const outros = vendas.Outros || 0;
    if (c8.valor <= outros) {
      vendas.Outros = Math.round(outros - c8.valor);
      if (vendas.Outros === 0) delete vendas.Outros;
    } else {
      if (outros > 0) delete vendas.Outros;
      warn(`cliente 8 em ${loja}/${semId} = R$${c8.valor} > Outros (R$${outros}) — Outros zerado; REVISAR quem registrou a venda entre lojas`);
    }
    const pec = etapa1[loja]?.[`${semId}_pecas`];
    if (pec && pec.Outros != null) { pec.Outros = Math.max(0, pec.Outros - (c8.qtde || 0)); if (pec.Outros === 0) delete pec.Outros; }
    const tk = etapa1[loja]?.[`${semId}_tickets`];
    if (tk && tk.Outros != null) { tk.Outros = Math.max(0, tk.Outros - (c8.vendas || 0)); if (tk.Outros === 0) delete tk.Outros; }
    log(`cliente 8 subtraído: ${loja}/${semId} R$${c8.valor} (${c8.qtde || 0}pç)`);
  }
}

const somaObj = (o) => Object.values(o || {}).reduce((s, v) => s + (Number(v) || 0), 0);

// ── serialização no formato das linhas existentes ───────────────────────────
// ordem: Outros primeiro, depois roster da loja, depois extras
function emitirVendasObj(vendasSem, roster, ints = true) {
  const parts = [];
  const emit = (k, v) => parts.push(`${jsKey(k)}:${ints ? Math.round(v) : r1(v)}`);
  if (vendasSem.Outros != null) emit("Outros", vendasSem.Outros);
  for (const nome of roster) if (vendasSem[nome] != null) emit(nome, vendasSem[nome]);
  for (const [k, v] of Object.entries(vendasSem)) if (k !== "Outros" && !roster.includes(k)) emit(k, v);
  return `{${parts.join(",")}}`;
}

// atualiza/insere a chave semId num objeto de UMA linha tipo `marcasA_loja: {S1:..,S2:..}`
function upsertInlineKey(linhaInner, semId, valorTxt) {
  const re = new RegExp(`(\\b${semId}:)(-?[\\d.]+|\\{[^}]*\\})`);
  if (re.test(linhaInner)) return linhaInner.replace(re, `$1${valorTxt}`);
  const sep = linhaInner.trim() === "" ? "" : ",";
  return linhaInner.replace(/\s*$/, "") + `${sep}${semId}:${valorTxt}`;
}

// ── casamento nome ERP → canônico (Etapa 2 _indivRS) ────────────────────────
function casarNomeERP(rawNome, roster) {
  const n = norm(rawNome);
  if (!n || n.startsWith("vendedor padrao")) return null;
  const primeiro = n.split(/\s+/)[0];
  for (const c of roster) if (norm(c).split(/\s+/)[0] === primeiro) return c;
  for (const c of roster) if (norm(c).slice(0, 4) === n.slice(0, 4)) return c; // fallback prefixo
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// MODO --janelas
// ════════════════════════════════════════════════════════════════════════════
function modoJanelas() {
  const ctx = contextoDoMes();
  const { semanaAtual, mesKey, mm, aaaa, dataBR, ontemBR } = ctx;
  const out = {
    mesKey,
    semana_atual: semanaAtual.id,
    periodo: semanaAtual.periodo,
    etapa1_semanas: [
      { id: semanaAtual.id, di: semanaAtual.di, df: semanaAtual.df },
      { id: "ONTEM", di: ontemBR, df: ontemBR },
      { id: "HOJE", di: dataBR, df: dataBR },
    ],
    cliente8_semanas: [
      { id: semanaAtual.id, di: semanaAtual.di, df: semanaAtual.df },
      { id: "MES", di: `01/${mm}/${aaaa}`, df: dataBR },
    ],
  };
  process.stdout.write(JSON.stringify(out));
}

// ════════════════════════════════════════════════════════════════════════════
// MODO --prep-etapa2
// ════════════════════════════════════════════════════════════════════════════
function modoPrep(arqE1, arqC8) {
  const ctx = contextoDoMes();
  const etapa1 = JSON.parse(fs.readFileSync(arqE1, "utf8"));
  let cliente8 = {};
  try { cliente8 = JSON.parse(fs.readFileSync(arqC8, "utf8")); } catch { /* sem cliente8 → sem subtração */ }
  const semId = ctx.semanaAtual.id;

  // sanity da coleta: 4 lojas presentes com o objeto da semana corrente
  for (const loja of LOJAS) {
    if (!etapa1[loja] || typeof etapa1[loja][semId] !== "object") {
      log(`sanity FALHOU: ${loja}.${semId} ausente na coleta Etapa 1`);
      process.exit(6);
    }
  }
  if (LOJAS.every((l) => somaObj(etapa1[l][semId]) === 0)) {
    // todas zeradas: legítimo só logo cedo no 1º dia da semana — deixa passar com aviso
    log("AVISO: as 4 lojas com venda 0 na semana corrente (início de semana/manhã cedo?)");
  }

  aplicarCliente8(etapa1, cliente8, semId);

  const totais = {};
  for (const loja of LOJAS) {
    const fechadas = Object.entries(ctx.dadosMes[loja]?.vendas || {})
      .filter(([sid]) => sid !== semId)
      .reduce((s, [, v]) => s + somaObj(v), 0);
    const semAtualTotal = Math.round(somaObj(etapa1[loja][semId]));
    totais[loja] = { [semId]: semAtualTotal, MES: Math.round(fechadas + semAtualTotal) };
  }
  const { mm, aaaa, dataBR } = ctx;
  const semanas = [
    { id: semId, di: ctx.semanaAtual.di, df: ctx.semanaAtual.df },
    { id: "MES", di: `01/${mm}/${aaaa}`, df: dataBR },
  ];
  process.stdout.write(JSON.stringify({ semanas, totais }));
}

// ════════════════════════════════════════════════════════════════════════════
// MODO --render
// ════════════════════════════════════════════════════════════════════════════
function modoRender(arqE1, arqE2, arqStores, arqC8, coletadoEm) {
  if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(coletadoEm || "")) die(`coletado_em inválido: '${coletadoEm}' (esperado 'DD/MM/AAAA HH:MM')`);
  const ctx = contextoDoMes();
  const { mesKey, semanaAtual } = ctx;
  const semId = semanaAtual.id;

  const etapa1 = JSON.parse(fs.readFileSync(arqE1, "utf8"));
  let etapa2 = {}; try { etapa2 = JSON.parse(fs.readFileSync(arqE2, "utf8")); } catch { warn("Etapa 2 sem resultado — marcas A anteriores preservadas"); }
  let stores = {}; try { stores = JSON.parse(fs.readFileSync(arqStores, "utf8")); } catch { warn("Etapa 3 sem resultado (stores inacessíveis) — avaliações/overrides/metas pulados nesta execução"); }
  let cliente8 = {}; try { cliente8 = JSON.parse(fs.readFileSync(arqC8, "utf8")); } catch { warn("cliente 8 não coletado — sem subtração nesta execução (autocorrige no próximo run)"); }

  for (const loja of LOJAS) {
    if (!etapa1[loja] || typeof etapa1[loja][semId] !== "object") die(`Etapa 1 incompleta: ${loja}.${semId} ausente`);
  }
  aplicarCliente8(etapa1, cliente8, semId);

  let painel = fs.readFileSync(PAINEL, "utf8");
  let loja = fs.readFileSync(LOJA, "utf8");

  // ── estado ANTES (pra resumo e pra dados de semanas fechadas) ──
  const dadosAntes = extractConst(painel, "DADOS").obj;
  const mesAntes = dadosAntes[mesKey];
  const lojasBase = extractConst(painel, "LOJAS_BASE").obj;

  // metas vindas dos stores (Meta Real) pro mês corrente: {loja: {Sx: meta}}
  const metasStores = {};
  for (const e of stores.metas_por_loja || []) {
    if (e.mes !== mesKey || !LOJAS.includes(e.loja)) continue;
    metasStores[e.loja] = Object.fromEntries((e.metas || []).filter((m) => typeof m.nova === "number").map((m) => [m.id, m.nova]));
  }

  // ── dados calculados por loja ──
  const calc = {}; // {loja: {vendasSem, totalSem, vendasMesPorV, totalMes, maSem, maMes, indivSem, indivMes, semanasMeta}}
  for (const lk of LOJAS) {
    const roster = (lojasBase[lk]?.vendedoras || []).slice();
    const vendasSem = etapa1[lk][semId];
    const totalSem = Math.round(somaObj(vendasSem));
    // mês por vendedora = semanas fechadas (HTML, imutáveis) + semana corrente fresca
    const vendasMesPorV = {};
    for (const [sid, obj] of Object.entries(mesAntes[lk]?.vendas || {})) {
      if (sid === semId) continue;
      for (const [n, v] of Object.entries(obj)) vendasMesPorV[n] = (vendasMesPorV[n] || 0) + v;
    }
    for (const [n, v] of Object.entries(vendasSem)) vendasMesPorV[n] = (vendasMesPorV[n] || 0) + v;
    const totalMes = Math.round(Object.values(vendasMesPorV).reduce((s, v) => s + v, 0));

    // marcas A: % da loja (Etapa 2); ausente → preserva valor anterior
    const maSem = typeof etapa2?.[lk]?.[semId] === "number" ? etapa2[lk][semId] : (mesAntes[lk]?.marcasA_loja?.[semId] ?? null);
    const maMes = typeof etapa2?.[lk]?.MES === "number" ? etapa2[lk].MES : null;

    // marcas A individuais (R$) casadas pro roster
    const indivSem = {}, indivMes = {};
    for (const [alvo, fonte] of [[indivSem, etapa2?._indivRS?.[lk]?.[semId]], [indivMes, etapa2?._indivRS?.[lk]?.MES]]) {
      for (const [raw, rs] of Object.entries(fonte || {})) {
        const c = casarNomeERP(raw, roster);
        if (c) alvo[c] = (alvo[c] || 0) + rs;
      }
    }
    // metas da semana: hardcoded atual + override dos stores
    const semanasMeta = {};
    for (const s of mesAntes[lk]?.semanas || []) semanasMeta[s.id] = s.meta;
    for (const [sid, nova] of Object.entries(metasStores[lk] || {})) {
      if (semanasMeta[sid] != null && semanasMeta[sid] !== nova) {
        log(`Ajuste de meta aplicado: ${lk} ${sid} R$${semanasMeta[sid]} → R$${nova}`);
        semanasMeta[sid] = nova;
      } else if (semanasMeta[sid] == null) {
        warn(`meta dos stores pra ${lk}/${sid} sem semana correspondente no HTML — ignorada`);
      }
    }
    const somaMetas = Object.values(semanasMeta).reduce((s, v) => s + v, 0);
    const metaMensal = mesAntes[lk]?.meta_mensal || 0;
    if (Math.abs(somaMetas - metaMensal) > 100)
      log(`nota: soma das metas semanais de ${lk} (R$${somaMetas}) ≠ meta mensal (R$${metaMensal}) — mantido como está (não auto-ajusto)`);

    if (totalSem > metaMensal * 1.5) die(`sanity: ${lk} semana corrente R$${totalSem} > 1.5× meta mensal — coleta suspeita`);

    // ordem de emissão: preserva a ordem dos nomes já existentes na linha da semana
    // corrente (diff mínimo), depois roster, depois extras
    const ordem = [...new Set([
      ...Object.keys(mesAntes[lk]?.vendas?.[semId] || {}).filter((n) => n !== "Outros"),
      ...roster,
    ])];
    calc[lk] = { roster, ordem, vendasSem, totalSem, vendasMesPorV, totalMes, maSem, maMes, indivSem, indivMes, semanasMeta };
  }
  // ranking por vendido_mes
  const rank = [...LOJAS].sort((a, b) => calc[b].totalMes - calc[a].totalMes);
  for (const lk of LOJAS) calc[lk].posicao = rank.indexOf(lk) + 1;

  // aviso: semana fechada sem congelamento em HISTORICO_PREMIOS (freeze = tarefa do agente)
  try {
    const hist = extractConst(painel, "HISTORICO_PREMIOS").obj[mesKey] || {};
    const hojeD = fromBR(ctx.dataBR);
    for (const s of ctx.semanas) {
      if (fromBR(s.df) >= hojeD) continue; // não fechou ainda
      const faltam = LOJAS.filter((lk) => !(hist[lk]?._em_pct && hist[lk]._em_pct[s.id] != null));
      if (faltam.length) warn(`semana ${s.id} (${s.periodo}) FECHADA sem congelamento em HISTORICO_PREMIOS: ${faltam.join(",")} — rodar congelamento (tarefa do agente)`);
    }
  } catch (e) { warn(`não consegui checar HISTORICO_PREMIOS: ${e.message}`); }

  // ══ 1) PAINEL: região do mês corrente em DADOS ══
  {
    const dadosSpan = extractConst(painel, "DADOS");
    const reg = subRegion(painel, dadosSpan.start, dadosSpan.end, new RegExp(`'${mesKey}':\\s*\\{`));
    if (!reg) die(`região '${mesKey}' não encontrada no DADOS do painel`);
    let regTxt = painel.slice(reg.open, reg.close + 1);

    // 1a. comentário de cabeçalho "// Atualizado ..." (se existir na 1ª linha do bloco)
    regTxt = regTxt.replace(/(\{\s*\n\s*)\/\/ Atualizado [^\n]*/,
      `$1// Atualizado ${coletadoEm} — pipeline determinístico (build_premiacao.mjs). ${semId} (${semanaAtual.periodo}) ABERTA; semanas anteriores imutáveis.`);

    // 1b. semana_atual do mês
    regTxt = regTxt.replace(/semana_atual:\s*'S\d'/, `semana_atual: '${semId}'`);

    for (const lk of LOJAS) {
      const c = calc[lk];
      const lreg = subRegion(regTxt, 0, regTxt.length, new RegExp(`\\n\\s{4}${lk}:\\s*\\{`));
      if (!lreg) die(`bloco ${lk} não encontrado na região ${mesKey} do painel`);
      let ltxt = regTxt.slice(lreg.open, lreg.close + 1);

      // vendas: substitui/insere a linha da semana corrente
      {
        const vreg = subRegion(ltxt, 0, ltxt.length, /\n\s*vendas:\s*\{/);
        if (!vreg) die(`vendas{} não encontrado em ${lk}/${mesKey}`);
        let vtxt = ltxt.slice(vreg.open, vreg.close + 1);
        const linha = `${semId}:${emitirVendasObj(c.vendasSem, c.ordem)},`;
        const reLinha = new RegExp(`(\\n\\s*)${semId}:\\{[^\\n]*?\\},?`);
        vtxt = reLinha.test(vtxt)
          ? vtxt.replace(reLinha, `$1${linha}`)
          : vtxt.replace(/\n(\s*)\}$/, `\n$1  ${linha}\n$1}`);
        ltxt = ltxt.slice(0, vreg.open) + vtxt + ltxt.slice(vreg.close + 1);
      }
      // marcasA_loja (linha única): atualiza só a chave da semana corrente
      if (c.maSem != null) {
        ltxt = ltxt.replace(/(marcasA_loja:\s*\{)([^}]*)(\})/, (_, a, inner, z) => a + upsertInlineKey(inner, semId, String(r1(c.maSem))) + z);
      }
      // marcasA_indiv (mês): reconstrói do MES fresco (só quem tem venda no mês; caixa fora)
      if (Object.keys(c.indivMes).length) {
        const parts = [];
        for (const nome of c.roster) {
          if (nome === "Outros") continue;
          const vm = c.vendasMesPorV[nome] || 0;
          if (vm <= 0) continue;
          parts.push(`${jsKey(nome)}:${pct(c.indivMes[nome] || 0, vm)}`);
        }
        if (parts.length) ltxt = ltxt.replace(/marcasA_indiv:\s*\{[^}]*\}/, `marcasA_indiv: {${parts.join(",")}}`);
      }
      // tickets / pecas / cmv: substitui só o sub-objeto da semana corrente
      for (const [campo, dadosCampo, ints] of [
        ["tickets", etapa1[lk][`${semId}_tickets`], true],
        ["pecas", etapa1[lk][`${semId}_pecas`], true],
        ["cmv", etapa1[lk][`${semId}_cmv`], false],
      ]) {
        if (!dadosCampo || !Object.keys(dadosCampo).length) continue;
        const objTxt = emitirVendasObj(dadosCampo, c.ordem, ints);
        ltxt = ltxt.replace(new RegExp(`(\\n\\s*${campo}:\\s*\\{)(.*?)(\\},?)(?=\\n)`, "s"), (m0, a, inner, z) => {
          if (inner.includes("\n")) return m0; // segurança: só mexe se for linha única
          return a + upsertInlineKey(inner, semId, objTxt).replace(/\s+$/, " ") + z;
        });
      }
      // metas das semanas (Meta Real dos stores)
      for (const [sid, meta] of Object.entries(c.semanasMeta)) {
        ltxt = ltxt.replace(new RegExp(`(\\{id:'${sid}'[^}]*?meta:)\\d+`), `$1${meta}`);
      }
      regTxt = regTxt.slice(0, lreg.open) + ltxt + regTxt.slice(lreg.close + 1);
    }
    painel = painel.slice(0, reg.open) + regTxt + painel.slice(reg.close + 1);
  }

  // ══ 2) AVALIACOES: merge stores + json canônico + inline (mais recente vence) ══
  {
    let canon = { avaliacoes: [] };
    try { canon = JSON.parse(fs.readFileSync(AVAL_JSON, "utf8")); } catch { /* cria do zero */ }
    const byId = new Map();
    const push = (a) => {
      if (!a?.id_sugestao) return;
      const cur = byId.get(a.id_sugestao);
      if (!cur || String(a.avaliado_em || "") >= String(cur.avaliado_em || "")) byId.set(a.id_sugestao, a);
    };
    try { for (const a of extractConst(painel, "AVALIACOES").obj) push(a); } catch { /* sem inline */ }
    for (const a of canon.avaliacoes || []) push(a);
    let novas = 0;
    for (const a of stores.avaliacoes || []) {
      const item = { id_sugestao: a.id_sugestao, resultado: a.resultado, comentario: a.comentario || "", avaliado_em: String(a.em || "").slice(0, 10) };
      const antes = byId.get(a.id_sugestao);
      if (!antes || antes.resultado !== item.resultado || antes.comentario !== item.comentario) novas++;
      push(item);
    }
    const lista = [...byId.values()].sort((a, b) => a.id_sugestao.localeCompare(b.id_sugestao));
    fs.writeFileSync(AVAL_JSON, JSON.stringify({
      _descricao: canon._descricao || "Arquivo canônico de avaliações de sugestões do dashboard de premiação. Regenerado pelo build_premiacao.mjs (merge dos stores; mais recente vence).",
      atualizado_em: new Date().toISOString().slice(0, 19),
      avaliacoes: lista,
    }, null, 2) + "\n");
    // regenera o inline no painel (só se algo mudou vs parse atual)
    const span = extractConst(painel, "AVALIACOES");
    const linhas = lista.map((a) => `  {id_sugestao:${jsStr(a.id_sugestao)}, resultado:${jsStr(a.resultado)}, comentario:${jsStr(a.comentario || "")}, avaliado_em:${jsStr(a.avaliado_em || "")}},`);
    const novoInline = `[\n  // Sincronizado dos stores (Worker+Supabase) pelo build_premiacao.mjs — merge por id_sugestao, mais recente vence.\n${linhas.join("\n")}\n]`;
    if (JSON.stringify(span.obj) !== JSON.stringify(lista)) {
      painel = painel.slice(0, span.start) + novoInline + painel.slice(span.end);
      log(`AVALIACOES: ${lista.length} itens (${novas} novos/alterados dos stores)`);
    }
  }

  // ══ 3) OVERRIDES de sugestões — aplicados NOS DOIS HTMLs ══
  function aplicarOverrides(html, rotulo) {
    let mudou = 0;
    for (const ov of stores.overrides || []) {
      if (!ov?.id_sugestao || !ov.status) continue;
      const idIdx = html.indexOf(`id:'${ov.id_sugestao}'`);
      if (idIdx < 0) continue; // sugestão de semana antiga fora do arquivo? ignora
      const proxId = html.indexOf("{id:'", idIdx + 5);
      const fim = proxId > 0 ? proxId : idIdx + 4000;
      let slice = html.slice(idIdx, fim);
      const antes = slice;
      slice = slice.replace(/status:\s*'[a-z_]+'/, `status:'${ov.status}'`);
      if (ov.prazo) slice = slice.replace(/prazo:\s*'[a-z_]+'/, `prazo:'${ov.prazo}'`);
      if (ov.texto_editado) slice = slice.replace(/descricao:\s*'(?:[^'\\]|\\.)*'/, `descricao:${jsStr(ov.texto_editado)}`);
      if (slice !== antes) { html = html.slice(0, idIdx) + slice + html.slice(fim); mudou++; }
    }
    if (mudou) log(`${rotulo}: ${mudou} sugestões com override aplicado`);
    return html;
  }
  painel = aplicarOverrides(painel, "painel");
  loja = aplicarOverrides(loja, "loja.html");

  // ══ 4) LOJA.HTML ══
  // 4a. timestamp real da coleta
  if (!/const DADOS_COLETADO_EM = '[^']*';/.test(loja)) die("DADOS_COLETADO_EM não encontrado no loja.html");
  loja = loja.replace(/const DADOS_COLETADO_EM = '[^']*';/, `const DADOS_COLETADO_EM = '${coletadoEm}';`);

  // 4b. DADOS_LOJA por loja
  {
    const span = extractConst(loja, "DADOS_LOJA");
    let bloco = loja.slice(span.start, span.end);
    for (const lk of LOJAS) {
      const c = calc[lk];
      const lreg = subRegion(bloco, 0, bloco.length, new RegExp(`\\n\\s{2}${lk}:\\s*\\{`));
      if (!lreg) die(`DADOS_LOJA.${lk} não encontrado no loja.html`);
      let ltxt = bloco.slice(lreg.open, lreg.close + 1);
      const metaMensal = mesAntes[lk]?.meta_mensal;
      const metaSemana = c.semanasMeta[semId];
      const per = semanaAtual.periodo.match(/(\d{2})\/\d{2}\s*(?:–|—|-|a)\s*(\d{2}\/\d{2})/);
      const label = per ? `Semana ${per[1]} a ${per[2]}` : `Semana ${semId}`;
      const maMesVal = c.maMes != null ? r1(c.maMes) : null;

      if (metaMensal != null) ltxt = ltxt.replace(/meta_mensal:\s*\d+/, `meta_mensal: ${metaMensal}`);
      if (metaSemana != null) ltxt = ltxt.replace(/meta_semana:\s*\d+/, `meta_semana: ${metaSemana}`);
      ltxt = ltxt.replace(/vendido_semana:\s*-?\d+/, `vendido_semana: ${c.totalSem}`);
      ltxt = ltxt.replace(/vendido_mes:\s*-?\d+/, `vendido_mes: ${c.totalMes}`);
      ltxt = ltxt.replace(/posicao_loja:\s*\d+/, `posicao_loja: ${c.posicao}`);
      if (c.maSem != null) ltxt = ltxt.replace(/ma_pct_loja_sem:\s*-?[\d.]+/, `ma_pct_loja_sem: ${r1(c.maSem)}`);
      if (maMesVal != null) ltxt = ltxt.replace(/ma_pct_loja_mes:\s*-?[\d.]+/, `ma_pct_loja_mes: ${maMesVal}`);
      ltxt = ltxt.replace(/semana_atual:\s*'S\d'/, `semana_atual: '${semId}'`);
      ltxt = ltxt.replace(/semana_label:\s*'[^']*'/, `semana_label: '${label}'`);

      // por vendedora: sem/mes/ma_sem/ma_mes — preserva melhorias e o resto da linha
      const nomesNaLinha = [...ltxt.matchAll(/\n\s*'([^']+)':\s*\{sem:/g)].map((m) => m[1]);
      for (const nome of nomesNaLinha) {
        const sem = Math.round(c.vendasSem[nome] || 0);
        const mesV = Math.round(c.vendasMesPorV[nome] || 0);
        const maS = pct(c.indivSem[nome] || 0, sem);
        const maM = pct(c.indivMes[nome] || 0, mesV);
        const re = new RegExp(`('${nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}':\\s*\\{)sem:\\s*-?[\\d.]+,\\s*mes:\\s*-?[\\d.]+,\\s*ma_sem:\\s*-?[\\d.]+,\\s*ma_mes:\\s*-?[\\d.]+`);
        if (!re.test(ltxt)) { warn(`linha da vendedora ${nome} (${lk}) fora do formato esperado — não atualizada`); continue; }
        ltxt = ltxt.replace(re, (m0, a) => {
          // Etapa 2 indisponível por completo → preserva ma_* antigos (não zera)
          const keepMa = !Object.keys(c.indivMes).length; // etapa2 falhou por completo
          if (keepMa) {
            const old = m0.match(/ma_sem:\s*(-?[\d.]+),\s*ma_mes:\s*(-?[\d.]+)/);
            return `${a}sem:${sem}, mes:${mesV}, ma_sem:${old ? old[1] : 0}, ma_mes:${old ? old[2] : 0}`;
          }
          return `${a}sem:${sem}, mes:${mesV}, ma_sem:${maS}, ma_mes:${maM}`;
        });
      }
      // vendedora coletada sem linha no app (contratação nova) → aviso
      for (const nome of Object.keys(c.vendasSem)) {
        if (nome !== "Outros" && !nomesNaLinha.includes(nome)) warn(`${nome} (${lk}) tem venda na semana mas NÃO tem card no loja.html — adicionar via agente/admin`);
      }
      bloco = bloco.slice(0, lreg.open) + ltxt + bloco.slice(lreg.close + 1);
    }
    loja = loja.slice(0, span.start) + bloco + loja.slice(span.end);
  }

  // 4b2. SEMANAS_MES — espelho das janelas do mês corrente (id/label/periodo).
  // Constante estática que a aba "Meu Progresso" percorre; o ROLLOVER precisa
  // mantê-la no mês vigente. Sincroniza aqui a cada run pra nunca ficar presa no
  // mês anterior (bug 04/08/2026: ficou em julho após a virada e faltava a S6).
  {
    const semArr = (mesAntes?.L1?.semanas || []).map((s, i) => {
      const periodo = String(s.periodo || "").replace(/(\d{2}\/\d{2})\s*[–—-]\s*(\d{2}\/\d{2})/, "$1 a $2");
      const label = /^Semana \d+$/.test(s.label || "") ? s.label : `Semana ${i + 1}`;
      return `  {id:'${s.id}', label:'${label}', periodo:'${periodo}'},`;
    });
    if (semArr.length) {
      const novo = `const SEMANAS_MES = [\n${semArr.join("\n")}\n];`;
      const re = /const SEMANAS_MES = \[[\s\S]*?\];/;
      if (re.test(loja)) { loja = loja.replace(re, novo); log(`SEMANAS_MES sincronizado (${semArr.length} semanas de ${mesKey})`); }
      else warn("SEMANAS_MES não encontrado no loja.html — não sincronizado");
    } else warn(`sem semanas em DADOS['${mesKey}'].L1 para sincronizar SEMANAS_MES`);
  }

  // 4b3. HIST_MENSAL_VENDAS — registra meses FECHADOS automaticamente (a "virada").
  // O gráfico "Evolução mês a mês" do loja.html lê essa const; se o mês que fechou
  // não entra aqui, o gráfico fica com buraco (bug julho/2026: pulava jun→ago pra
  // TODAS as vendedoras). Idempotente: só INSERE mês que falta, nunca reescreve os
  // já presentes. Fonte = soma das semanas de DADOS[mês] por vendedora (exclui
  // "Outros"; cliente 8 já vem subtraído). Também espelha META_MENSAL_HIST.
  {
    try {
      const spanH = extractConst(loja, "HIST_MENSAL_VENDAS");
      const histObj = spanH.obj;
      const fechados = Object.keys(dadosAntes).filter((mk) => /^\d{4}-\d{2}$/.test(mk) && mk < mesKey);
      const faltantes = fechados.filter((mk) => !histObj[mk]).sort();
      let blocos = "", inseridos = [];
      for (const mk of faltantes) {
        const mdata = dadosAntes[mk];
        const lojasStr = [];
        for (const lk of LOJAS) {
          const st = mdata?.[lk];
          if (!st || !st.vendas) continue;
          const tot = {};
          for (const sid of Object.keys(st.vendas)) {
            for (const [nome, v] of Object.entries(st.vendas[sid] || {})) {
              if (nome === "Outros") continue;
              tot[nome] = (tot[nome] || 0) + v;
            }
          }
          const pares = Object.entries(tot).filter(([, v]) => v > 0).map(([n, v]) => `'${n.replace(/'/g, "\\'")}':${Math.round(v)}`);
          if (pares.length) lojasStr.push(`    ${lk}: {${pares.join(",")}},`);
        }
        if (lojasStr.length) { blocos += `  '${mk}': {\n${lojasStr.join("\n")}\n  },\n`; inseridos.push(mk); }
      }
      if (blocos) {
        loja = loja.slice(0, spanH.end - 1) + blocos + loja.slice(spanH.end - 1);
        log(`HIST_MENSAL_VENDAS: mês(es) fechado(s) registrado(s) automaticamente: ${inseridos.join(", ")}`);
        // META_MENSAL_HIST — espelha a meta mensal dos meses recém-inseridos
        try {
          const spanM = extractConst(loja, "META_MENSAL_HIST");
          const metaObj = spanM.obj;
          let mblocos = "";
          for (const mk of inseridos) {
            if (metaObj[mk]) continue;
            const linha = LOJAS.map((lk) => `${lk}:${Math.round(dadosAntes[mk]?.[lk]?.meta_mensal || 0)}`).join(", ");
            mblocos += `  '${mk}': {${linha}},\n`;
          }
          if (mblocos) { loja = loja.slice(0, spanM.end - 1) + mblocos + loja.slice(spanM.end - 1); }
        } catch (e) { warn(`META_MENSAL_HIST não sincronizado: ${e.message}`); }
      }
    } catch (e) { warn(`HIST_MENSAL_VENDAS não sincronizado: ${e.message}`); }
  }

  // 4c. VENDAS_HIST por loja (espelho de DADOS: semanas/vendas/marcasA_loja + ontem/hoje)
  {
    const span = extractConst(loja, "VENDAS_HIST");
    let bloco = loja.slice(span.start, span.end);
    for (const lk of LOJAS) {
      const c = calc[lk];
      const lreg = subRegion(bloco, 0, bloco.length, new RegExp(`\\n\\s{2}${lk}:\\s*\\{`));
      if (!lreg) die(`VENDAS_HIST.${lk} não encontrado no loja.html`);
      let ltxt = bloco.slice(lreg.open, lreg.close + 1);

      // metas das semanas
      for (const [sid, meta] of Object.entries(c.semanasMeta)) {
        ltxt = ltxt.replace(new RegExp(`(\\{id:'${sid}'[^}]*?meta:)\\d+`), `$1${meta}`);
      }
      // vendas da semana corrente
      {
        const vreg = subRegion(ltxt, 0, ltxt.length, /\n\s*vendas:\s*\{/);
        if (!vreg) die(`VENDAS_HIST.${lk}.vendas não encontrado`);
        let vtxt = ltxt.slice(vreg.open, vreg.close + 1);
        const linha = `${semId}:${emitirVendasObj(c.vendasSem, c.ordem)},`;
        const reLinha = new RegExp(`(\\n\\s*)${semId}:\\{[^\\n]*?\\},?`);
        vtxt = reLinha.test(vtxt) ? vtxt.replace(reLinha, `$1${linha}`) : vtxt.replace(/\n(\s*)\}$/, `\n$1  ${linha}\n$1}`);
        ltxt = ltxt.slice(0, vreg.open) + vtxt + ltxt.slice(vreg.close + 1);
      }
      // marcasA_loja
      if (c.maSem != null) {
        ltxt = ltxt.replace(/(marcasA_loja:\s*\{)([^}]*)(\})/, (_, a, inner, z) => a + upsertInlineKey(inner, semId, String(r1(c.maSem))) + z);
      }
      // ontem / hoje (linhas 100% derivadas da coleta; filtra Outros)
      const emitDia = (id, dataBRdia, dowNome) => {
        const src = { ...(etapa1[lk]?.[id] || {}) };
        delete src.Outros;
        return `${id.toLowerCase()}: {data:'${dataBRdia}', dia_semana:'${dowNome}', vendas:${emitirVendasObj(src, c.ordem)}},`;
      };
      ltxt = ltxt.replace(/ontem:\s*\{[^\n]*\},?/, emitDia("ONTEM", ctx.ontemBR, ctx.ontemDow));
      ltxt = ltxt.replace(/hoje:\s*\{[^\n]*\},?/, emitDia("HOJE", ctx.dataBR, ctx.hojeDow));
      bloco = bloco.slice(0, lreg.open) + ltxt + bloco.slice(lreg.close + 1);
    }
    loja = loja.slice(0, span.start) + bloco + loja.slice(span.end);
  }

  // ══ 5) VALIDAÇÃO PÓS-EDIÇÃO (antes de gravar) ══
  for (const [nome, html] of [["dashboard_premiacao.html", painel], ["loja.html", loja]]) {
    if (html.includes("},,")) die(`vírgula dupla '},,'' gerada em ${nome} — abortando sem gravar`);
    for (const [i, m] of [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].entries()) {
      try { new Function(m[1]); } catch (e) { die(`${nome} <script> bloco ${i} inválido após edição: ${e.message}`); }
    }
  }
  // reparse estrutural + integridade
  const dadosDepois = extractConst(painel, "DADOS").obj;
  const mesDepois = dadosDepois[mesKey];
  for (const lk of LOJAS) {
    const sems = mesDepois[lk]?.semanas || [];
    if (!sems.length || !sems.every((s) => s && s.id)) die(`semanas de ${lk} corrompidas pós-edição`);
    // imutabilidade: semanas fechadas idênticas ao antes
    for (const [sid, v] of Object.entries(mesAntes[lk].vendas || {})) {
      if (sid === semId) continue;
      if (JSON.stringify(v) !== JSON.stringify(mesDepois[lk].vendas[sid])) die(`IMUTABILIDADE VIOLADA: ${lk}.vendas.${sid} mudou — abortando`);
    }
  }
  // SUGESTOES: o que a VENDEDORA vê tem que bater nos 2 arquivos.
  // Não comparar byte a byte: o painel carrega, de propósito, campos do motor de avaliação
  // (meta_valor, meta_semana_valor, alvo_semana) que o loja.html não usa — comparar tudo fazia
  // o aviso disparar em TODO run e virar ruído ignorado (mesmo destino do sanity da L1, que
  // gritou 22 dias sem ninguém agir). Aqui só avisa o que é acionável: id faltando num dos
  // lados, ou campo que a vendedora realmente lê divergindo. (28/07/2026)
  const CAMPOS_VENDEDORA = ["titulo", "descricao", "prazo", "status", "escopo", "loja", "vendedora", "tipo", "marca", "meta_alvo"];
  try {
    const sp = extractConst(painel, "SUGESTOES").obj;
    const sl = extractConst(loja, "SUGESTOES").obj;
    // forma real: SUGESTOES = { '2026-W31': { semana_label, geradas_em, itens: [ {id,...} ] } }
    const idx = (o) => {
      const m = {};
      for (const sem of Object.values(o || {})) {
        const itens = Array.isArray(sem) ? sem : (sem && Array.isArray(sem.itens) ? sem.itens : []);
        for (const s of itens) if (s && s.id) m[s.id] = s;
      }
      return m;
    };
    const ip = idx(sp), il = idx(sl);
    const faltaLoja = Object.keys(ip).filter((k) => !il[k]);
    const faltaPainel = Object.keys(il).filter((k) => !ip[k]);
    if (faltaLoja.length) warn(`SUGESTOES: ${faltaLoja.length} id(s) no painel e NÃO no loja.html (vendedora não vê): ${faltaLoja.slice(0, 5).join(", ")}`);
    if (faltaPainel.length) warn(`SUGESTOES: ${faltaPainel.length} id(s) no loja.html e NÃO no painel: ${faltaPainel.slice(0, 5).join(", ")}`);
    const dif = Object.keys(ip).filter((k) => il[k] && CAMPOS_VENDEDORA.some((c) => JSON.stringify(ip[k][c]) !== JSON.stringify(il[k][c])));
    if (dif.length) warn(`SUGESTOES: ${dif.length} sugestão(ões) com texto/status divergente entre painel e loja.html — igualar: ${dif.slice(0, 5).join(", ")}`);
  } catch (e) { warn(`comparação de SUGESTOES falhou: ${e.message}`); }

  // ══ 6) GRAVAR + RESUMO ══
  fs.writeFileSync(PAINEL, painel);
  fs.writeFileSync(LOJA, loja);

  const linhas = [];
  linhas.push(`${semId} (${semanaAtual.periodo}) ` + LOJAS.map((lk) => {
    const antes = Math.round(somaObj(mesAntes[lk].vendas?.[semId] || {}));
    const c = calc[lk];
    return `${lk} ${antes}→${c.totalSem}${c.maSem != null ? ` MA ${r1(c.maSem)}%` : ""}`;
  }).join(" · "));
  linhas.push(`mês: ` + LOJAS.map((lk) => `${lk} R$${calc[lk].totalMes} (${pct(calc[lk].totalMes, mesAntes[lk].meta_mensal || 0)}%)`).join(" · "));
  linhas.push(`coletado em ${coletadoEm}`);
  fs.writeFileSync(RESUMO_FILE, linhas.join("\n") + "\n");
  if (WARNS.length) fs.writeFileSync(WARNS_FILE, WARNS.join("\n") + "\n");
  else { try { fs.unlinkSync(WARNS_FILE); } catch { /* ok */ } }
  console.log(linhas.join("\n"));
  log("OK — dois HTMLs regenerados.");
}

// ── main ────────────────────────────────────────────────────────────────────
const modo = process.argv[2];
try {
  if (modo === "--janelas") modoJanelas();
  else if (modo === "--prep-etapa2") modoPrep(process.argv[3], process.argv[4]);
  else if (modo === "--render") modoRender(process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7]);
  else die("uso: build_premiacao.mjs --janelas | --prep-etapa2 <e1.json> <c8.json> | --render <e1.json> <e2.json> <stores.json> <c8.json> '<DD/MM/AAAA HH:MM>'", 3);
} catch (e) {
  die(e.stack || e.message);
}
