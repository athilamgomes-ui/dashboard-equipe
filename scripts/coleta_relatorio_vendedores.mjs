#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// coleta_relatorio_vendedores.mjs — Faturamento > Relatórios > Performance por
// Vendedor, para as empresas 1 (Casa da Beleza Altamira) e 4 (MissBeleza
// Altamira), de UM dia. Escreve JSON no stdout; logs no stderr.
//
// Uso:  node coleta_relatorio_vendedores.mjs [dd/mm/aaaa]     (padrão: ontem)
//
// ⚠️ ENCODING: o Microvix responde em windows-1252. `r.text()` corrompe acento
// ("BRUNA FIGUEIR?") e já apagou formas de pagamento inteiras de outra coleta
// em 29/07/2026. Por isso lemos arrayBuffer + TextDecoder e ABORTAMOS se sobrar
// caractere de substituição — melhor não mandar relatório do que mandar nome errado.
//
// ⚠️ VOCABULÁRIO DA TELA (confirmado no index.js do próprio relatório, 28/08/2026):
//     Tickets        = qtde_vendas          ← é o "nº de vendas / clientes atendidos"
//     Qtde Peças     = qtde_pecas
//     PA             = peças / tickets
//     TM             = valor / tickets
//     IPO / CMV%     = vlr_ipo / vlr_cmv
// O total de cada loja na tela é a soma das linhas dela — mas a tela também mostra
// um TOTAL GERAL somando as duas empresas. São linhas diferentes; não misturar.
//
// ⚠️ LOJA ZERADA: uma loja com 0 vendas em dia útil quase sempre é coleta
// parcial, não dia ruim (aconteceu 07/08 e 22/08/2026 na premiação, e o painel
// publicou R$ 0 como se fosse verdade). Aqui isso vira erro: sem relatório é
// melhor que relatório mentiroso. Dia sem movimento nas DUAS lojas (domingo) é
// legítimo e sai marcado como semMovimento.
// ─────────────────────────────────────────────────────────────────────────────
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = process.env.MICROVIX_PROFILE || join(homedir(), ".claude", "microvix-profile");
const EMPRESAS = [
  { emp: 1, loja: "Casa da Beleza" },
  { emp: 4, loja: "MissBeleza" },
];

const log = m => process.stderr.write(`[rel-vend] ${m}\n`);

function ontemBR() {
  const d = new Date(Date.now() - 864e5);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const dia = process.argv[2] || ontemBR();
if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dia)) { log(`data inválida: "${dia}" (esperado dd/mm/aaaa)`); process.exit(2); }

const t0 = Date.now();
log(`coletando performance por vendedor de ${dia} (empresas ${EMPRESAS.map(e => e.emp).join(", ")})`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());

try {
  await garantirSessao(page, { log, tokenOpcional: true });   // service.asp autoriza pela SESSÃO (ERP migrou auth 30/07/2026)
} catch (e) {
  log(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(10);
}

let bruto;
try {
  bruto = await page.evaluate(async ({ dia, empresas }) => {
    const out = {};
    for (const { emp } of empresas) {
      const r = await fetch(
        "/gestor_web/faturamento/relatorios/performance_por_vendedor/performance_por_vendedor_service.asp",
        {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "multipart/form-data" },
          body: JSON.stringify({
            EmpresasSelecionadasParam: String(emp),
            DataInicial: dia,
            DataFinal: dia,
            ConsiderarEntradaGarantiaNacional: true,
            op: "Listar",
          }),
        }
      );
      if (r.status !== 200) { out[emp] = { erro: `HTTP ${r.status}` }; continue; }
      // windows-1252 → sem isto os acentos viram U+FFFD
      const txt = new TextDecoder("windows-1252").decode(await r.arrayBuffer());
      if (/Sess.o expirada/i.test(txt)) { out[emp] = { erro: "SESSAO_EXPIRADA" }; continue; }
      if (txt.includes("�")) { out[emp] = { erro: "ENCODING" }; continue; }
      try { out[emp] = { linhas: JSON.parse(txt) }; }
      catch { out[emp] = { erro: "PARSE" }; }
    }
    return out;
  }, { dia, empresas: EMPRESAS });
} catch (e) {
  log(`falha na consulta: ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(10);
}
await ctx.close().catch(() => {});

// ── normalização ─────────────────────────────────────────────────────────────
// "1.436,68" (pt-BR) e "1436,67999124527" (cru da API) no mesmo campo.
const num = s => parseFloat(String(s ?? "").replace(/\./g, "").replace(",", ".")) || 0;
const int = s => parseInt(String(s ?? "").replace(/\D/g, ""), 10) || 0;

const titulo = s => s.toLowerCase().replace(/(^|[\s'-])([a-zà-ÿ])/g, (_, a, b) => a + b.toUpperCase());

const lojas = [];
for (const { emp, loja } of EMPRESAS) {
  const r = bruto[emp];
  if (!r || r.erro) { log(`empresa ${emp}: ${r?.erro || "sem resposta"}`); process.exit(10); }

  const vendedores = [];
  let total = { tickets: 0, pecas: 0, valor: 0 };
  for (const row of r.linhas) {
    const nomeFull = (row.nome_vendedor || "").trim();
    if (!nomeFull || /^Total/i.test(nomeFull)) continue;      // linha de total do próprio relatório
    const tickets = int(row.qtde_vendas);                      // coluna "Tickets" da tela
    const pecas = int(row.qtde_pecas);                         // coluna "Qtde Peças Atual"
    const valor = num(row.vlr_vendas);                         // coluna "Valor Atual"
    if (!tickets && !pecas && !valor) continue;
    total.tickets += tickets; total.pecas += pecas; total.valor += valor;
    vendedores.push({
      nome: titulo(nomeFull.replace(/\s*\(\d+\)\s*$/, "")),
      cod: row.cod_vendedor,
      tickets,
      pecas,
      valor: +valor.toFixed(2),
      pa: tickets ? +(pecas / tickets).toFixed(2) : 0,
      tm: tickets ? +(valor / tickets).toFixed(2) : 0,
      cmv: +num(row.vlr_cmv).toFixed(2),                       // % — fica no JSON, fora da mensagem
      semVendedor: /VENDEDOR\s*PADR(AO|ÃO)/i.test(nomeFull),
    });
  }
  vendedores.sort((a, b) => b.valor - a.valor);
  total.valor = +total.valor.toFixed(2);
  total.pa = total.tickets ? +(total.pecas / total.tickets).toFixed(2) : 0;
  total.tm = total.tickets ? +(total.valor / total.tickets).toFixed(2) : 0;
  lojas.push({ emp, loja, total, vendedores });
  log(`  ${loja} (emp ${emp}): ${vendedores.length} vendedor(es), ${total.tickets} tickets, R$ ${total.valor.toFixed(2)}`);
}

// ── sanidade ─────────────────────────────────────────────────────────────────
const zeradas = lojas.filter(l => l.total.valor === 0);
const semMovimento = zeradas.length === lojas.length;         // domingo/feriado: legítimo
if (zeradas.length && !semMovimento) {
  log(`ABORTANDO: ${zeradas.map(l => l.loja).join(" e ")} com R$ 0 enquanto a outra vendeu — quase certo coleta parcial, não dia ruim.`);
  process.exit(10);
}

// Linha "Total Geral" da tela: soma das DUAS empresas. Existe no relatório, mas é
// uma linha à parte — nunca deve entrar no número de uma loja sozinha.
const grupo = lojas.reduce((a, l) => ({
  tickets: a.tickets + l.total.tickets,
  pecas: a.pecas + l.total.pecas,
  valor: +(a.valor + l.total.valor).toFixed(2),
}), { tickets: 0, pecas: 0, valor: 0 });
grupo.pa = grupo.tickets ? +(grupo.pecas / grupo.tickets).toFixed(2) : 0;
grupo.tm = grupo.tickets ? +(grupo.valor / grupo.tickets).toFixed(2) : 0;

log(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s${semMovimento ? " — sem movimento nas duas lojas" : ""}`);
process.stdout.write(JSON.stringify({ dia, coletadoEm: new Date().toISOString(), semMovimento, lojas, grupo }, null, 1));
