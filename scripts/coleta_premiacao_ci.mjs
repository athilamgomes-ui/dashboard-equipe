#!/usr/bin/env node
/**
 * coleta_premiacao_ci.mjs
 *
 * Coletor da premiação pra rodar na NUVEM (GitHub Actions) — substitui o cron
 * do Mac que falhava quando a máquina dormia.
 *
 * O que faz (determinístico, SEM LLM):
 *  1. Lê loja.html → descobre semana_atual + período (start) da semana.
 *  2. Calcula datas: semana corrente (start→hoje), ONTEM (dia útil anterior), HOJE.
 *  3. Roda Etapa 1 (vendas por vendedora) + Etapa 2 (% Marcas A) via os scripts
 *     existentes (mesma lógica do cron local), credenciais via env (secrets).
 *  4. Grava `premiacao_dados.json` na raiz do repo — os apps leem dele.
 *
 * NÃO edita o HTML (segurança: impossível corromper o app na nuvem).
 *
 * Saída: ../premiacao_dados.json
 * Exit: 0 ok · 1 falha (preserva o JSON anterior, não publica lixo).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const LOJA_HTML = join(REPO, "loja.html");
const OUT = join(REPO, "premiacao_dados.json");
const log = (m) => process.stderr.write(`[coleta-ci] ${m}\n`);

const MESES_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DIAS_PT = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];

function fmt(d) {
  return String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0") + "/" + d.getFullYear();
}
// Dia útil anterior: seg→sáb, dom→sáb, senão D-1.
function ontemUtil(hoje) {
  const d = new Date(hoje); d.setDate(d.getDate()-1);
  if (d.getDay() === 0) d.setDate(d.getDate()-1); // domingo → sábado
  return d;
}

function main() {
  const html = readFileSync(LOJA_HTML, "utf8");
  const semAtual = (html.match(/semana_atual:\s*'(S\d)'/) || [])[1] || "S4";
  // período da semana atual: "DD/MM a DD/MM"
  const semBloco = html.match(/const SEMANAS_MES = \[([\s\S]*?)\];/)[1];
  const linha = semBloco.split("\n").find(l => l.includes(`id:'${semAtual}'`)) || "";
  const per = (linha.match(/periodo:'(\d{2})\/(\d{2}) a (\d{2})\/(\d{2})'/) || []);
  const hoje = new Date();
  const ano = hoje.getFullYear();
  // start da semana corrente (dia/mês do período)
  const startDia = per[1] || "01", startMes = per[2] || String(hoje.getMonth()+1).padStart(2,"0");
  const diSemana = `${startDia}/${startMes}/${ano}`;
  const dfHoje = fmt(hoje);
  const ontem = ontemUtil(hoje);

  const semanas = [
    { id: semAtual, di: diSemana, df: dfHoje },
    { id: "ONTEM",  di: fmt(ontem), df: fmt(ontem) },
    { id: "HOJE",   di: dfHoje, df: dfHoje },
  ];
  log(`semana_atual=${semAtual} | semana ${diSemana}→${dfHoje} | ontem ${fmt(ontem)}`);

  // ── Etapa 1: vendas (com retry — login Microvix é instável: NAV_FAIL) ──
  let e1 = null, lastErr = null;
  for (let tent = 1; tent <= 4; tent++) {
    try {
      log(`Etapa 1 (vendas) — tentativa ${tent}/4...`);
      const e1raw = execFileSync("node", [join(__dirname,"cron_etapa1_vendas.mjs"), JSON.stringify(semanas)],
        { encoding: "utf8", maxBuffer: 50*1024*1024, stdio: ["ignore","pipe","inherit"] });
      e1 = JSON.parse(e1raw);
      break;
    } catch (e) {
      lastErr = e;
      log(`tentativa ${tent} falhou: ${String(e.message).slice(0,100)}`);
      if (tent < 4) execFileSync("sleep", [String(tent * 20)]); // 20/40/60s
    }
  }
  if (!e1) { log(`Etapa 1 falhou após 4 tentativas: ${lastErr?.message}`); process.exit(1); }

  // ── Exclusão cliente 8 (R Maura de Freitas) da L5 ──────────────────────────
  // Venda entre NOSSAS lojas (uma loja comprando da L5), cai toda no VENDEDOR
  // PADRAO → bucket "Outros". Não é venda real → descartar de TODOS os totais.
  // Só L5 (as outras lojas mantêm "Outros" = varejo de vendedora não-cadastrada).
  // Marcas A da L5 não incluem VENDEDOR PADRAO, então o denominador do % MA
  // (totais abaixo) já fica correto ao remover o Outros aqui.
  for (const s of semanas) {
    const blk = e1.L5?.[s.id];
    if (blk && blk.Outros) { log(`L5 ${s.id}: excluindo VENDEDOR PADRAO (cliente 8) R$${blk.Outros}`); delete blk.Outros; }
    if (e1.L5?.[s.id + "_tickets"]) delete e1.L5[s.id + "_tickets"].Outros;
    if (e1.L5?.[s.id + "_pecas"]) delete e1.L5[s.id + "_pecas"].Outros;
  }

  // ── Etapa 2: % Marcas A da semana corrente (totais da Etapa 1) ──
  const totais = {};
  for (const L of ["L1","L3","L4","L5"]) {
    totais[L] = {};
    totais[L][semAtual] = Math.round(Object.values(e1[L][semAtual]||{}).reduce((a,v)=>a+(v||0),0));
  }
  let e2 = null;
  try {
    log("Etapa 2 (marcas A)...");
    const e2raw = execFileSync("node", [join(__dirname,"cron_etapa2_marcas_a.mjs"),
      JSON.stringify([{id:semAtual, di:diSemana, df:dfHoje}]), JSON.stringify(totais)],
      { encoding: "utf8", maxBuffer: 50*1024*1024, stdio: ["ignore","pipe","inherit"] });
    e2 = JSON.parse(e2raw);
  } catch (e) { log(`Etapa 2 falhou (segue sem MA): ${e.message.slice(0,120)}`); }

  const out = {
    coletado_em: `${fmt(hoje)} ${String(hoje.getHours()).padStart(2,"0")}:${String(hoje.getMinutes()).padStart(2,"0")}`,
    mes: `${ano}-${String(hoje.getMonth()+1).padStart(2,"0")}`,
    semana_atual: semAtual,
    semana_periodo: { di: diSemana, df: dfHoje },
    ontem: { data: fmt(ontem), dia_semana: DIAS_PT[ontem.getDay()] },
    hoje:  { data: dfHoje, dia_semana: DIAS_PT[hoje.getDay()] },
    vendas: e1,        // {L1:{S4:{...},ONTEM:{...},HOJE:{...},S4_tickets,...}}
    marcasA: e2,       // {L1:{S4:%}, ...,_indivRS:{...}} | null
  };

  // Sanity: cada loja precisa ter pelo menos algum dado na semana corrente
  const vazias = ["L1","L3","L4","L5"].filter(L => !Object.keys(e1[L][semAtual]||{}).length);
  if (vazias.length === 4) {
    log("TODAS as lojas vazias — coleta provavelmente falhou. NÃO sobrescreve o JSON.");
    process.exit(1);
  }

  writeFileSync(OUT, JSON.stringify(out, null, 1));
  log(`OK → premiacao_dados.json (coletado_em ${out.coletado_em})`);
}

try { main(); } catch (e) { log(`ERRO: ${e.message}`); process.exit(1); }
