#!/usr/bin/env node
/**
 * build_estoque.mjs — ÚNICO escritor de dashboard_estoque.html.
 *
 * Lê os JSONs de dados_estoque/ (balanços, snapshot, janelas, depósito 2, notas, custos)
 * e renderiza os 6 blocos do painel com os dados EMBUTIDOS e CIFRADOS (o repo é público).
 *
 * O agente NUNCA edita o HTML na mão. Timestamp exibido = hora REAL da coleta (estático).
 *
 * Uso:  node build_estoque.mjs
 * Exit: 0 ok · 20 build falhou (o .sh restaura a versão anterior)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pecasJanela } from "./estoque_janelas.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(DIR, "..");
const D_DIR = path.join(RAIZ, "dados_estoque");
const OUT = path.join(RAIZ, "dashboard_estoque.html");

const LOJAS = [
  { key: "L1", emp: 1, nome: "Casa da Beleza", cidade: "Altamira", cor: "#f59e0b" },
  { key: "L3", emp: 3, nome: "Casa da Beleza", cidade: "Itaituba", cor: "#3b82f6" },
  { key: "L4", emp: 4, nome: "MissBeleza", cidade: "Altamira", cor: "#a855f7" },
  { key: "L5", emp: 10, nome: "MissBeleza", cidade: "Santarém", cor: "#10b981" },
];
const EMP_TO_LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const DIAS_BALANCO = Number(process.env.DIAS_BALANCO || 120);
const RUIDO = 3;                       // ±3 unidades = ruído de contagem
const RAZAO_ALTA = 10;                 // preço ≥ 10× o custo médio
const PRECO_ABSURDO = 1000;            // R$ 1.000+ num varejo de beleza é quase sempre erro de digitação
const TOP_PRECOS = 600;

const log = m => process.stderr.write(`[build-estoque] ${m}\n`);
const morre = m => { log("ERRO: " + m); process.exit(20); };
const ler = (f, obr = true) => {
  const p = path.join(D_DIR, f);
  if (!fs.existsSync(p)) { if (obr) morre(`${f} não existe — coleta não rodou`); return null; }
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { if (obr) morre(`${f} ilegível: ${e.message}`); return null; }
};

// ── senha do painel (repo é PÚBLICO: custo, preço e valor de estoque não vão em texto puro) ──
function getSenha() {
  if (process.env.ESTOQUE_SENHA) return process.env.ESTOQUE_SENHA;
  for (const [conta, servico] of [["estoque-web", "amgomes-estoque"], ["caixa-web", "amgomes-caixa"], ["financeiro-web", "amgomes-financeiro"]]) {
    try { return execSync(`security find-generic-password -a ${conta} -s ${servico} -w`, { stdio: ["ignore", "pipe", "ignore"] }).toString().replace(/\n$/, ""); } catch {}
  }
  return null;
}
const ITERS = 200000;
function cifrar(plain, senha) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(senha, salt, ITERS, 32, "sha256");
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return { salt: salt.toString("base64"), iv: iv.toString("base64"), data: Buffer.concat([ct, c.getAuthTag()]).toString("base64"), iters: ITERS };
}

// ── entradas ──────────────────────────────────────────────────────────────
const bal = ler("balancos.json");
const snap = ler("snapshot.json");
const jan = ler("janelas.json");
const dep2 = ler("deposito2.json", false) || { lojas: {} };
const notas = ler("notas.json", false) || { notas: [], canceladas: [], nf: {} };
const custos = ler("custos.json", false) || { produtos: {} };
// log append-only dos ajustes de saldo executados — é a PROVA do que foi zerado.
// Sem ele, zerar um negativo apagaria a própria evidência que a estratégia quer medir.
const ajustes = ler("ajustes_saldo.json", false) || { ajustes: [] };
const zerado = {};
for (const a of (ajustes.ajustes || [])) {
  if (!a.ok) continue;
  const k = `${a.loja}|${a.cod}`;
  if (!zerado[k] || a.quando > zerado[k].quando) zerado[k] = a;
}
const P_HN = path.join(D_DIR, "hist_negativos.json");
const P_HD = path.join(D_DIR, "hist_deposito2.json");
const histNeg = fs.existsSync(P_HN) ? JSON.parse(fs.readFileSync(P_HN, "utf8")) : {};
const histDep = fs.existsSync(P_HD) ? JSON.parse(fs.readFileSync(P_HD, "utf8")) : {};

if (!snap.lojas || Object.keys(snap.lojas).length !== 4) morre(`snapshot tem ${Object.keys(snap.lojas || {}).length} lojas (esperado 4)`);
const geradoEm = snap.gerado_em;
// idade real do dado de CADA loja (a coleta pode cobrir só algumas)
const coletaLoja = {};
for (const L of LOJAS) coletaLoja[L.key] = snap.lojas[L.key]?.coletado_em || snap.gerado_em;
const isoHoje = geradoEm.slice(0, 10);
const dBR = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "—";
const diasEntre = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// ── utilitários de produto ────────────────────────────────────────────────
// fator de conversão prometido pelo descritivo: "C/12", "C/ 144", "DZ", "PCT C/10", "CX 24"
function fatorDoNome(desc) {
  const d = (desc || "").toUpperCase();
  let m = d.match(/\bC\/\s*(\d{1,4})\b/) || d.match(/\bCX\s*(\d{1,4})\b/) || d.match(/\bPCT\.?\s*C?\/?\s*(\d{1,4})\b/);
  if (m) return { n: parseInt(m[1], 10), termo: m[0].trim() };
  if (/\bD[ÚU]?Z(IA|\.)?\b|\bDZ\b/.test(d)) return { n: 12, termo: "DZ" };
  if (/\bPCT\b|\bPACOTE\b/.test(d)) return { n: null, termo: "PCT" };
  if (/\bCX\b|\bCAIXA\b/.test(d)) return { n: null, termo: "CX" };
  return null;
}

// ══════════════════════════ BLOCO 1 — RECONCILIAÇÃO ════════════════════════
// última contagem por (loja, produto), só balanços de CONTAGEM finalizados na janela
const corteISO = (() => { const d = new Date(new Date(isoHoje).getTime() - DIAS_BALANCO * 86400000); return d.toISOString().slice(0, 10); })();
const ultimaContagem = {};       // loja → cod → {data, contado, bal, nome}
const contadoAlgumaVez = {};     // loja → Set(cod)  (qualquer data, para a cobertura)
for (const L of LOJAS) {
  ultimaContagem[L.key] = {}; contadoAlgumaVez[L.key] = new Set();
  const lista = (bal.listas[String(L.emp)] || []).filter(b => b.finalizado && !b.ajuste)
    .sort((a, b) => a.data < b.data ? -1 : a.data > b.data ? 1 : a.id - b.id);
  for (const b of lista) {
    for (const it of (bal.itens[String(b.id)] || [])) {
      contadoAlgumaVez[L.key].add(it.cod);
      if (b.data >= corteISO) ultimaContagem[L.key][it.cod] = { data: b.data, contado: it.contado, bal: b.id, nome: b.nome };
    }
  }
}

// entradas/vendas somando os pedaços mensais da janela (mesma decomposição do coletor)
const janIdx = jan.janelas || {};
const faltando = new Set();
function movimento(loja, cod, dataBal) {
  let ent = 0, ven = 0;
  for (const p of pecasJanela(dataBal, isoHoje)) {
    const j = janIdx[`${loja}|${p.ini}|${p.fim}`];
    if (!j) { faltando.add(`${loja}|${p.ini}|${p.fim}`); continue; }
    const mv = j.mov[cod];
    if (mv) { ent += mv[0]; ven += mv[1]; }
  }
  return { ent, ven };
}

// entradas de notas CANCELADAS por (loja, cod), a partir da data do balanço
const cancPorLoja = {};
for (const n of (notas.canceladas || [])) {
  const d = n.lancamento || n.emissao;
  if (!d) continue;
  (cancPorLoja[n.loja] = cancPorLoja[n.loja] || []).push({ data: d, doc: n.doc, itens: n.itens });
}
function canceladasDesde(loja, cod, desde) {
  let q = 0; const docs = [];
  for (const n of (cancPorLoja[loja] || [])) {
    if (n.data < desde || n.data > isoHoje) continue;
    for (const it of n.itens) if (it.cod === cod && it.q) { q += it.q; docs.push(n.doc); }
  }
  return { q, docs };
}

// entrada por nota (para reconhecer a assinatura da divisão ÷2)
const entradaNota = {};   // loja|cod → total entrado por nota não-cancelada na janela
for (const n of (notas.notas || [])) {
  const d = n.lancamento || n.emissao; if (!d) continue;
  for (const it of n.itens) {
    const k = `${n.loja}|${it.cod}`;
    (entradaNota[k] = entradaNota[k] || []).push({ data: d, doc: n.doc, q: it.q });
  }
}

const itensRecon = [];
const porLoja = {};
for (const L of LOJAS) {
  const S = snap.lojas[L.key];
  const contados = ultimaContagem[L.key];
  let comBal = 0, fecham = 0, semDoc = 0, semSnapshot = 0;
  for (const [cod, c] of Object.entries(contados)) {
    const p = S.prods[cod];
    if (!p) { semSnapshot++; continue; }   // contado mas ausente do catálogo de hoje — fora da conta
    comBal++;
    const { ent, ven } = movimento(L.key, cod, c.data);
    const canc = canceladasDesde(L.key, cod, c.data);
    const esperado = c.contado + (ent - canc.q) - ven;
    const dif = (p.sal + p.tra) - esperado;
    if (Math.abs(dif) < 0.001) { fecham++; continue; }
    semDoc += Math.abs(dif);
    itensRecon.push({
      loja: L.key, cod, desc: p.d, ref: p.r, marca: S.marca[cod] || "—",
      bal_data: c.data, bal_nome: c.nome, bal_id: c.bal,
      contado: c.contado, ent, canc: canc.q, canc_docs: canc.docs.slice(0, 3), ven,
      sal: p.sal, tra: p.tra, esperado: +esperado.toFixed(2), dif: +dif.toFixed(2),
      custo: p.cus, preco: p.pre,
    });
  }
  porLoja[L.key] = { comBalanco: comBal, fecham, pct: comBal ? +(100 * fecham / comBal).toFixed(1) : null, unidades: +semDoc.toFixed(0), semSnapshot };
  if (semSnapshot) log(`${L.key}: ${semSnapshot} produtos contados não aparecem no catálogo de hoje (fora da conta)`);
}
if (faltando.size) log(`AVISO: ${faltando.size} janelas ausentes do cache (entradas/vendas incompletas): ${[...faltando].slice(0, 5).join(" · ")}`);

// ── classificação das diferenças ──────────────────────────────────────────
const idx = {};                       // loja|cod → item
for (const it of itensRecon) idx[`${it.loja}|${it.cod}`] = it;
const dep2Saldo = (loja, cod) => (dep2.lojas?.[loja]?.prods?.[cod]?.sal) || 0;
const quase = (a, b, tol) => Math.abs(a - b) <= tol;

for (const it of itensRecon) {
  const a = Math.abs(it.dif);
  const par = it.loja === "L1" ? idx[`L4|${it.cod}`] : it.loja === "L4" ? idx[`L1|${it.cod}`] : null;

  // 1) foi para o depósito 2 (Devolvidos) — movimento documentado, só que de depósito
  const d2 = dep2Saldo(it.loja, it.cod);
  if (it.dif < 0 && d2 > 0 && d2 >= a * 0.9) {
    it.classe = "deposito2"; it.detalhe = `${d2} un. no depósito 2 (Devolvidos)`; continue;
  }

  // 2) divisão ÷2 de nota (assinatura: o que saiu = floor(entrada/2); ímpar fica a maior parte no CNPJ)
  if (par && it.dif * par.dif < 0) {
    const tol = Math.max(1, a * 0.05);
    const origem = it.dif < 0 ? it : par, destino = it.dif < 0 ? par : it;
    const metade = Math.floor(origem.ent / 2);
    if (metade > 0 && quase(Math.abs(origem.dif), metade, tol) && quase(destino.dif, metade, tol)) {
      it.classe = "divisao2";
      it.detalhe = `entrada de ${origem.ent} em ${origem.loja} · ${metade} foi para ${destino.loja} (÷2)`;
      continue;
    }
    // 3) transferência espelhada L1↔L4 (some numa, aparece na outra)
    if (quase(it.dif + par.dif, 0, Math.max(1, a * 0.1))) {
      it.classe = "espelhado";
      it.detalhe = `${it.dif < 0 ? "saiu de" : "entrou em"} ${it.loja} e ${it.dif < 0 ? "apareceu em" : "sumiu de"} ${par.loja} (${Math.abs(par.dif)} un.)`;
      continue;
    }
  }

  // 4) pacote × unidade
  const f = fatorDoNome(it.desc);
  if (f && f.n && f.n > 1 && a >= f.n && Math.abs(a % f.n) < 0.001) {
    it.classe = "pacote"; it.detalhe = `múltiplo exato de ${f.n} (descritivo "${f.termo}") — ${a / f.n} pacote(s)`; continue;
  }

  // 5) ruído de contagem
  if (a <= RUIDO) { it.classe = "ruido"; it.detalhe = `diferença de ${it.dif} un.`; continue; }

  // 6) o resto — é o buraco que interessa
  it.classe = "semdoc";
  it.detalhe = it.canc ? `${it.canc} un. em nota cancelada já descontadas` : "";
}
itensRecon.sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif));

// ══════════════════════════ BLOCO 2 — COBERTURA ════════════════════════════
const cobertura = [];
for (const L of LOJAS) {
  const S = snap.lojas[L.key];
  const porMarca = {};
  for (const [cod, p] of Object.entries(S.prods)) {
    if (!(p.sal > 0)) continue;
    const marca = S.marca[cod] || "—";
    const m = porMarca[marca] = porMarca[marca] || { skus: 0, contados: 0, un: 0, valor: 0 };
    m.skus++; m.un += p.sal; m.valor += p.sal * (p.cus || 0);
    if (contadoAlgumaVez[L.key].has(cod)) m.contados++;
  }
  for (const [marca, m] of Object.entries(porMarca)) {
    if (m.skus < 3) continue;                     // marca com 1–2 SKUs não diz nada
    cobertura.push({ loja: L.key, marca, skus: m.skus, contados: m.contados, pct: +(100 * m.contados / m.skus).toFixed(0), un: Math.round(m.un), valor: Math.round(m.valor) });
  }
}
cobertura.sort((a, b) => a.pct - b.pct || b.valor - a.valor);

// ══════════════════════════ BLOCO 3 — SALDO NEGATIVO ═══════════════════════
const negativos = [];
for (const L of LOJAS) {
  const S = snap.lojas[L.key];
  for (const [cod, p] of Object.entries(S.prods)) {
    if (!(p.sal < 0)) { delete histNeg[`${L.key}|${cod}`]; continue; }
    const k = `${L.key}|${cod}`;
    // piso documental: se a última contagem já registrava saldo negativo, a data dela vale
    const c = ultimaContagem[L.key][cod];
    if (!histNeg[k]) histNeg[k] = { desde: isoHoje, fonte: "1º registro" };
    if (c && c.data < histNeg[k].desde && histNeg[k].fonte !== "balanço") histNeg[k] = { desde: c.data, fonte: "balanço" };
    const z = zerado[k];
    negativos.push({
      loja: L.key, cod, desc: p.d, marca: S.marca[cod] || "—", sal: p.sal,
      custo: p.cus, preco: p.pre, desde: histNeg[k].desde, fonte: histNeg[k].fonte,
      dias: diasEntre(histNeg[k].desde, isoHoje),
      // reincidente = foi zerado e VOLTOU a ficar negativo: é a prova de que o produto existe
      // de verdade e vende, e de quanto de venda estava rodando sem entrada correspondente.
      reincidente: !!z, zerado_em: z ? z.quando.slice(0, 10) : null,
      saldo_antes_zeramento: z ? z.saldo_anterior : null, grupo_zeramento: z ? z.grupo : null,
    });
  }
}
negativos.sort((a, b) => a.sal - b.sal);

// ══════════════════════════ BLOCO 4 — DEPÓSITO 2 (VENCIDOS) ════════════════
const vencidos = [];
for (const L of LOJAS) {
  const S = dep2.lojas?.[L.key];
  if (!S) continue;
  for (const [cod, p] of Object.entries(S.prods)) {
    if (!(p.sal > 0)) { delete histDep[`${L.key}|${cod}`]; continue; }
    const k = `${L.key}|${cod}`;
    if (!histDep[k]) histDep[k] = { desde: isoHoje, fonte: "1º registro" };
    vencidos.push({
      loja: L.key, cod, desc: p.d, marca: S.marca[cod] || "—", sal: p.sal,
      custo: p.cus, preco: p.pre, valor: +((p.cus || 0) * p.sal).toFixed(2),
      desde: histDep[k].desde, fonte: histDep[k].fonte, dias: diasEntre(histDep[k].desde, isoHoje),
    });
  }
}
vencidos.sort((a, b) => b.valor - a.valor);

// ══════════════════════════ BLOCO 5 — PREÇO ABSURDO ════════════════════════
// ⚠️ o custo aqui é o "Custo Médio Unit." do relatório; o custo VERDADEIRO é o
// "Médio (Histórico) Unit." do relatório de movimento — coletado só para os suspeitos.
const precos = [];
for (const L of LOJAS) {
  const S = snap.lojas[L.key];
  for (const [cod, p] of Object.entries(S.prods)) {
    const cus = p.cus, pre = p.pre;
    if (!pre || pre <= 0) continue;
    if (p.sal === 0 && !(ultimaContagem[L.key][cod])) continue;      // ignora item morto sem saldo nem contagem
    let tipo = null, razao = null;
    if (!cus || cus <= 0) tipo = "sem_custo";
    else {
      razao = pre / cus;
      if (razao >= RAZAO_ALTA) tipo = pre >= PRECO_ABSURDO ? "preco_absurdo" : "razao_alta";
      else if (razao <= 1) tipo = "abaixo_custo";
    }
    if (!tipo) continue;
    const conf = custos.produtos?.[`${L.key}|${cod}`] || null;
    precos.push({
      loja: L.key, cod, desc: p.d, marca: S.marca[cod] || "—", custo: cus, preco: pre,
      // ⚠️ razão pequena precisa de casas decimais: arredondar 0,02 para 1 casa vira 0 e
      // some da ordenação (foi assim que os preços absurdos ficaram escondidos no 1º build)
      razao: razao == null ? null : +razao.toFixed(razao < 1 ? 4 : 1),
      exposicao: Math.round(Math.abs(p.sal || 0) * (cus || 0)),
      sal: p.sal, tipo,
      custo_real: conf?.custo_medio ?? null, preco_praticado: conf?.ultima_venda ?? null, conf_data: conf?.data ?? null,
    });
  }
}
// ordem por gravidade prática: preço absurdo em reais primeiro (é erro de digitação visível no
// caixa), depois quem vende abaixo do custo (perde dinheiro em cada venda), depois razão alta,
// e por último os sem custo médio (é falta de dado, não erro de preço).
const ORDEM = { preco_absurdo: 0, abaixo_custo: 1, razao_alta: 2, sem_custo: 3 };
precos.sort((a, b) => ORDEM[a.tipo] - ORDEM[b.tipo] ||
  (a.tipo === "preco_absurdo" ? b.preco - a.preco :
   a.tipo === "abaixo_custo" ? b.exposicao - a.exposicao :
   a.tipo === "razao_alta" ? (b.razao || 0) - (a.razao || 0) : b.exposicao - a.exposicao));
const precosTop = precos.slice(0, TOP_PRECOS);

// ══════════════════════════ BLOCO 6 — FATOR DE CONVERSÃO ═══════════════════
// a cópia da NF mostra "Fat. Conv. Utilizado" = "-" quando não há fator cadastrado NAQUELA empresa
const fator = [];
const vistos = new Set();
for (const nf of Object.values(notas.nf || {})) {
  for (const it of (nf.itens || [])) {
    const f = fatorDoNome(it.desc);
    if (!f) continue;
    // it.fat === null → a cópia nem tinha a coluna (ela é condicional): sem evidência, não acusa.
    if (it.fat == null) continue;
    const semFator = it.fat === "" || it.fat === "-" || it.fat === "0" || Number(String(it.fat).replace(",", ".")) === 1;
    if (!semFator) continue;
    const k = `${nf.loja}|${it.cod}`;
    if (vistos.has(k)) continue;
    vistos.add(k);
    const p = snap.lojas[nf.loja]?.prods?.[it.cod];
    fator.push({
      loja: nf.loja, cod: it.cod, desc: it.desc, und: it.und || "—", fat: it.fat || "-",
      n: f.n, termo: f.termo, doc: nf.doc, data: nf.data, qtd: it.qtd,
      sal: p?.sal ?? null, marca: snap.lojas[nf.loja]?.marca?.[it.cod] || "—",
    });
  }
}
fator.sort((a, b) => (b.n || 0) - (a.n || 0));

// ══════════════════════════ KPIs e montagem ════════════════════════════════
const kpis = {};
for (const L of LOJAS) {
  const S = snap.lojas[L.key];
  let skus = 0, un = 0, valor = 0;
  for (const p of Object.values(S.prods)) { if (p.sal > 0) { skus++; un += p.sal; valor += p.sal * (p.cus || 0); } }
  kpis[L.key] = { skus, un: Math.round(un), valor: Math.round(valor), ...porLoja[L.key] };
}

const excluidos = [];
for (const L of LOJAS)
  for (const b of (bal.listas[String(L.emp)] || []))
    if (b.ajuste) excluidos.push({ loja: L.key, id: b.id, data: b.data, nome: b.nome, itens: (bal.itens[String(b.id)] || []).length });

const DADOS = {
  geradoEm, geradoEmBR: `${dBR(isoHoje)} às ${new Date(geradoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
  diasBalanco: DIAS_BALANCO, corteBalanco: corteISO,
  lojas: LOJAS, kpis, coletaLoja,
  recon: itensRecon, cobertura, negativos, vencidos, precos: precosTop, fator, excluidos,
  zeramentos: Object.values(zerado).map(a => ({ loja: a.loja, cod: a.cod, desc: a.desc, grupo: a.grupo,
    quando: a.quando.slice(0, 10), de: a.saldo_anterior, para: a.saldo_confirmado })),
  precosPorTipo: precos.reduce((a, p) => (a[p.tipo] = (a[p.tipo] || 0) + 1, a), {}),
  janelaNotas: notas.janela || null,
  totalPrecos: precos.length,
  janelasFaltando: [...faltando],
};

fs.writeFileSync(P_HN, JSON.stringify(histNeg));
fs.writeFileSync(P_HD, JSON.stringify(histDep));
fs.writeFileSync(path.join(D_DIR, "estoque_dados.json"), JSON.stringify(DADOS));

log(`recon: ${itensRecon.length} produtos que não fecham · ` + LOJAS.map(L => `${L.key} ${porLoja[L.key].pct ?? "—"}%`).join(" · "));
log(`cobertura ${cobertura.length} marca×loja · negativos ${negativos.length} · depósito 2 ${vencidos.length} · preços ${precos.length} (top ${precosTop.length}) · fator ${fator.length}`);

const SENHA = getSenha();
if (!SENHA) morre("senha do painel não encontrada (env ESTOQUE_SENHA ou Keychain amgomes-estoque/amgomes-caixa) — sem ela o painel iria pro repo público em texto puro");
const PAYLOAD = cifrar(JSON.stringify(DADOS), SENHA);
const PUBLICO = { geradoEmBR: DADOS.geradoEmBR, diasBalanco: DIAS_BALANCO };

const APP_JS = fs.readFileSync(path.join(DIR, "estoque_app.js"), "utf8");
const CSS = fs.readFileSync(path.join(DIR, "estoque_app.css"), "utf8");
const HTML_BODY = fs.readFileSync(path.join(DIR, "estoque_app.html"), "utf8");

const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>Estoque · A.M. Gomes</title>
<meta name="theme-color" content="#0f172a"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head><body>
${HTML_BODY}
<script>
const PUBLICO = ${JSON.stringify(PUBLICO)};
const PAYLOAD = ${JSON.stringify(PAYLOAD)};
</script>
<script>${APP_JS}</script>
</body></html>`;

fs.writeFileSync(OUT, html);
log(`dashboard_estoque.html gravado (${(html.length / 1024 / 1024).toFixed(2)} MB) · coleta de ${DADOS.geradoEmBR}`);
process.exit(0);
