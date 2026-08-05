#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// coleta_infinitepay.mjs — baixa o movimento do dia de uma loja na InfinitePay e
// grava os DOIS arquivos que a Conferência de Caixa já sabe ler:
//
//   ~/.claude/caixa-arquivos/L1 extrato 04-08.csv      (conta: PIX, depósitos)
//   ~/.claude/caixa-arquivos/L1 maquininha 04-08.csv   (cobrança a cobrança)
//
// POR QUE GERAR CSV EM VEZ DE CLICAR EM "BAIXAR ARQUIVO": o painel web exige
// abrir "Relatório" → "Baixar arquivo" → escolher período no calendário →
// marcar formato, e o botão final fica desabilitado até tudo estar preenchido.
// Automatizar esses cliques quebra a cada redesign. As telas consomem APIs
// próprias — é nelas que falamos, do mesmo jeito que o coletor do Microvix usa
// POST direto em vez de navegar. O CSV sai idêntico ao exportado à mão, então o
// parser do painel (`lerExtrato`/`lerTransacoes`) não precisa saber de nada.
//
// ⚠️ OS FILTROS DE DATA DA API NÃO SÃO CONFIÁVEIS. `/api/statements` ignora
// start_date/final_date (testado: 5 combinações de nome devolvem exatamente os
// mesmos 100 registros) e o `sales/search` devolveu registro de HOJE numa
// janela pedida de ONTEM. Por isso TODO recorte de data aqui é feito no
// cliente, depois de baixar. Confiar no filtro do servidor produziria arquivo
// com dia trocado — e o painel cruzaria contra o dia errado do ERP sem avisar.
//
// ⚠️ FUSO: as APIs devolvem UTC ("...T13:39:03.844Z" = 10:39 em Belém/SP). O
// recorte e a formatação usam America/Sao_Paulo. Sem isso, tudo que a loja
// vendeu depois das 21h cairia no dia seguinte.
//
// Uso:  node coleta_infinitepay.mjs L1 2026-08-04
//       node coleta_infinitepay.mjs L1            (padrão: ontem)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { contextoLogado } from "./infinitepay_sessao.mjs";

const DIR = path.join(os.homedir(), ".claude", "caixa-arquivos");
const TZ = "America/Sao_Paulo";

// ── datas ────────────────────────────────────────────────────────────────────
const partes = (iso) => {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, diaBR: `${p.day}/${p.month}/${p.year}`,
           hora: `${p.hour}:${p.minute}:${p.second}`, hm: `${p.hour}:${p.minute}` };
};
const ontem = () => { const d = new Date(); d.setDate(d.getDate() - 1); return partes(d.toISOString()).dia; };

// ── CSV ──────────────────────────────────────────────────────────────────────
const cel = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const linha = (arr) => arr.map(cel).join(",");
const brl = (centavos) => (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── captura dos headers de autenticação ──────────────────────────────────────
// A sessão vive em cookies do profile, mas as APIs exigem o header Authorization
// que o app monta em runtime. Em vez de tentar reproduzir a lógica dele, deixa o
// app fazer a chamada dele e reaproveita o cabeçalho — e a repetição sai pelo
// APIRequestContext do Playwright, que não passa por CORS.
async function capturarHeaders(page, rota, padrao) {
  let cap = null;
  const ouvinte = (req) => { if (!cap && padrao.test(req.url())) cap = { url: req.url(), headers: req.headers() }; };
  page.on("request", ouvinte);
  await page.goto("https://app.infinitepay.io" + rota, { waitUntil: "domcontentloaded", timeout: 60000 });
  for (let i = 0; i < 20 && !cap; i++) await page.waitForTimeout(700);
  page.off("request", ouvinte);
  if (!cap) throw new Error("não capturei a chamada de " + rota + " (o app mudou? sessão caiu?)");
  return { base: cap.url.split("?")[0], headers: cap.headers };
}

// ── extrato da conta ─────────────────────────────────────────────────────────
async function baixarExtrato(ctx, page, dia) {
  const { base, headers } = await capturarHeaders(page, "/statements", /\/api\/statements/);
  const linhas = [];
  let cursor = null, paginas = 0, passou = false;

  // Feed do mais recente para o mais antigo. Para no primeiro registro anterior
  // ao dia pedido — mas só depois de ter visto o dia, senão para antes da hora
  // quando a coleta roda de madrugada.
  while (paginas < 40 && !passou) {
    const qs = "limit=100" + (cursor ? "&next_page=" + encodeURIComponent(cursor) : "");
    const r = await ctx.request.get(base + "?" + qs, { headers });
    if (!r.ok()) throw new Error("/api/statements → " + r.status());
    const j = await r.json();
    const arr = j.data || [];
    if (!arr.length) break;
    for (const t of arr) {
      const p = partes(t.dateTime);
      if (p.dia === dia) linhas.push([p.dia, p.hora, t.type || "", t.title || "", t.subtitle || "", t.formattedAmount || ""]);
      else if (p.dia < dia) passou = true;
    }
    const prox = j.pagination?.nextPage;
    if (!prox || prox === cursor) break;      // cursor que não anda = laço infinito
    cursor = prox; paginas++;
  }
  const cab = ["Data", "Hora", "Tipo de transação", "Nome", "Detalhe", "Valor"];
  return [linha(cab), ...linhas.map(linha)].join("\n") + "\n";
}

// ── relatório da maquininha ──────────────────────────────────────────────────
const MEIO = { credit: "Crédito", debit: "Débito", pix: "Pix", voucher: "Voucher" };
const STATUS = { approved: "Aprovada", denied: "Negada", canceled: "Cancelada", refunded: "Estornada" };
const ORIGEM = { pos: "Maquininha", tap: "InfiniteTap", online: "Online", link: "Link de pagamento" };

async function baixarMaquininha(ctx, page, dia) {
  const { base, headers } = await capturarHeaders(page, "/sales?tab=table", /sales-index\/v1\/sales\/search/);
  // Pede uma janela folgada (o filtro do servidor não é confiável) e recorta aqui.
  const de = new Date(dia + "T00:00:00-03:00"); de.setDate(de.getDate() - 1);
  const ate = new Date(dia + "T23:59:59-03:00"); ate.setDate(ate.getDate() + 1);
  const linhas = [];
  let pagina = 1;

  while (pagina <= 20) {
    const qs = new URLSearchParams({
      from_date: de.toISOString(), to_date: ate.toISOString(),
      pg: "true", limit: "100", page: String(pagina),
    });
    const r = await ctx.request.get(base + "?" + qs, { headers });
    if (!r.ok()) throw new Error("sales/search → " + r.status());
    const j = await r.json();
    const arr = j.results || [];
    if (!arr.length) break;
    for (const t of arr) {
      const p = partes(t.datetime);
      if (p.dia !== dia) continue;
      const taxa = (t.amount ?? 0) - (t.net_amount ?? 0);
      linhas.push([
        p.diaBR + " " + p.hm,
        MEIO[t.method] || t.method || "",
        t.brand || "",
        t.installments > 1 ? t.installments + "x" : "À Vista",
        ORIGEM[t.transaction_origin] || t.transaction_origin || "",
        t.serial_number ? "NS: " + t.serial_number : "",
        t.id || "",
        STATUS[t.status] || t.status || "",
        brl(t.amount ?? 0),
        brl(t.net_amount ?? 0),
        "- " + brl(taxa),
        t.fee_percentage ?? "",
        t.plan_or_description || "",
        t.nsu || "",
        "",                                  // Origem - Nome: é o portador; não vem na API
      ]);
    }
    const total = j.pagination?.total_pages ?? j.pagination?.totalPages ?? 1;
    if (pagina >= total) break;
    pagina++;
  }
  const cab = ["Data e hora", "Meio - Meio", "Meio - Bandeira", "Meio - Parcelas", "Tipo - Origem",
    "Tipo - Dados adicionais", "Identificador", "Status", "Valor (R$)", "Líquido (R$)",
    "Taxa Aplicada - Valor(R$)", "Taxa Aplicada - Aplicada(%)", "Plano", "NSU", "Origem - Nome"];
  return [linha(cab), ...linhas.map(linha)].join("\n") + "\n";
}

// ── principal ────────────────────────────────────────────────────────────────
export async function coletar(loja, dia) {
  fs.mkdirSync(DIR, { recursive: true });
  const { ctx, page } = await contextoLogado(loja);
  try {
    const [dd, mm] = [dia.slice(8, 10), dia.slice(5, 7)];
    const saida = [];
    for (const [rotulo, fn] of [["extrato", baixarExtrato], ["maquininha", baixarMaquininha]]) {
      const csv = await fn(ctx, page, dia);
      const nLinhas = csv.trim().split("\n").length - 1;
      // O nome COMEÇA pela loja de propósito: é assim que o painel confere de quem
      // é o arquivo (`lojaDoNome`) — o relatório da adquirente não tem coluna de
      // empresa e já houve conferência inteira feita com o arquivo da loja errada.
      const arq = path.join(DIR, `${loja} ${rotulo} ${dd}-${mm}.csv`);
      fs.writeFileSync(arq, csv);
      saida.push({ rotulo, arq, linhas: nLinhas });
      console.log(`  ${rotulo}: ${nLinhas} linha(s) → ${path.basename(arq)}`);
    }
    return saida;
  } finally {
    await ctx.close().catch(() => {});
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  const loja = process.argv[2];
  const dia = process.argv[3] || ontem();
  if (!loja) { console.error("uso: node coleta_infinitepay.mjs L1 [2026-08-04]"); process.exit(2); }
  console.log(`InfinitePay ${loja} · ${dia}`);
  coletar(loja, dia)
    .then(() => process.exit(0))
    .catch(e => { console.error("❌ " + (e.message || e)); process.exit(e.code === "SESSAO_EXPIRADA" ? 10 : 1); });
}
