#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// coleta_azulzinha.mjs — movimento da L4 (MissBeleza Altamira) no portal
// Azulzinha da Caixa, no mesmo formato que a Conferência de Caixa já lê:
//
//   ~/.claude/caixa-arquivos/L4 maquininha 03-09.csv   (cartão, por transação)
//   ~/.claude/caixa-arquivos/L4 extrato 03-09.csv      (PIX recebido)
//
// ⚠️ RODA COM JANELA VISÍVEL, NÃO HEADLESS. O portal é protegido por Radware
// Bot Manager: em headless ele devolve CAPTCHA ("Let's make sure you're human")
// em vez da página. Com janela normal passa. Não existe contorno legítimo para
// isso — e resolver CAPTCHA está fora de questão —, então a coleta da L4 abre
// uma janela por ~30s. É o preço de conferir esta loja.
//
// ⚠️ A resposta traz a lista em `data.Vendas.List` (NÃO `ListaVendas`, que é o
// nome da variável de tela). Ler a chave errada devolve lista vazia em silêncio
// e a loja aparece como "sem movimento" — custou meia hora de investigação.
//
// ⚠️ Taxa e ValorLíquido vêm ZERADOS deste portal. As colunas correspondentes
// são OMITIDAS do CSV de propósito: mandar zero faria o painel acusar
// "bruto − taxa ≠ líquido" em toda linha. Consequência: a L4 confere o BRUTO
// contra o ERP, mas não dá para checar taxa efetiva por bandeira como nas
// outras lojas.
//
// Uso:  node coleta_azulzinha.mjs 2026-09-03      (padrão: ontem)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { abrirContexto } from "./azulzinha_sessao.mjs";

const DIR = path.join(os.homedir(), ".claude", "caixa-arquivos");
const URL_VENDAS = "https://portal.azulzinhadacaixa.com.br/MinhasVendas?Router=0";
const LOJA = "L4";

const cel = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const linha = a => a.map(cel).join(",");
const brl = n => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ontem = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };

export async function coletar(dia) {
  fs.mkdirSync(DIR, { recursive: true });
  const { ctx, page } = await abrirContexto({ headless: false });   // ver aviso acima
  try {
    let req = null;
    page.on("request", r => {
      if (!req && /ListaDiaVendasV3\/DataActionGetVendasV3/.test(r.url()))
        req = { url: r.url(), headers: r.headers(), body: r.postData() };
    });
    await page.goto(URL_VENDAS, { waitUntil: "domcontentloaded", timeout: 60000 });
    for (let i = 0; i < 20 && !req; i++) await page.waitForTimeout(800);

    // O portal às vezes abre um modal de novidade por cima de tudo ("Menu de
    // vendas ainda melhor!"), e aí qualquer clique falha por interceptação.
    for (const rot of [/^Pular$/, /^Fechar$/, /^Entendi$/]) {
      const b = page.getByText(rot).first();
      if (await b.count().catch(() => 0)) { await b.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1000); }
    }
    if (!req) throw new Error("não capturei a chamada de vendas do portal (mudou a tela? sessão caiu?)");

    // Reproduz a chamada da própria tela trocando só o período e a página.
    const vendas = [];
    let pagina = 1, totalPaginas = 1;
    while (pagina <= totalPaginas && pagina <= 30) {
      const j = JSON.parse(req.body);
      j.screenData.variables.IsHoje = false;
      j.screenData.variables.Periodo = { DataInicio: dia, DataFim: dia };
      j.screenData.variables.Pagination = { Count: "0", CurrentPage: String(pagina), TotalPaginas: "0", MaxRecords: 100 };
      const r = await ctx.request.post(req.url, { headers: req.headers, data: j });
      if (!r.ok()) throw new Error("portal respondeu " + r.status());
      const d = (await r.json()).data || {};
      const lista = d.Vendas?.List || [];
      totalPaginas = Number(d.TotalPaginas || 1) || 1;
      vendas.push(...lista);
      if (!lista.length) break;
      pagina++;
    }

    const dd = dia.slice(8, 10), mm = dia.slice(5, 7);
    const saida = [];

    // ── cartão ──
    const cartoes = vendas.filter(v => /cr[ée]dito|d[ée]bito/i.test(v.DadosTransacaoDetalheVendasV3?.Modalidade || ""));
    const cabMaq = ["Data e hora", "Meio - Meio", "Meio - Bandeira", "Meio - Parcelas", "Tipo - Origem",
      "Identificador", "Status", "Valor (R$)", "Plano", "NSU", "Origem - Nome"];
    const linhasMaq = cartoes.map((v, i) => {
      const t = v.DadosTransacaoDetalheVendasV3 || {}, val = v.ValoresDetalheVendasV3 || {};
      return linha([
        dd + "/" + mm + "/" + dia.slice(0, 4) + " " + String(v.HoraVenda || "").slice(0, 5),
        t.Modalidade || "", t.BandeiraCartao || "",
        Number(t.Parcelas) > 1 ? t.Parcelas + "x" : "À Vista",
        "Maquininha", t.CodigoReferenciaCartao || String(i + 1),
        v.Status || "", brl(val.ValorBruto), "", t.CodigoReferenciaCartao || "", "",
      ]);
    });
    const arqMaq = path.join(DIR, `${LOJA} maquininha ${dd}-${mm}.csv`);
    fs.writeFileSync(arqMaq, [linha(cabMaq), ...linhasMaq].join("\n") + "\n");
    saida.push({ tipo: "maquininha", arq: arqMaq, n: linhasMaq.length });

    // ── PIX (vira "extrato", que é o formato que o painel concilia como PIX) ──
    const pix = vendas.filter(v => /pix/i.test(v.DadosTransacaoDetalheVendasV3?.Modalidade || ""));
    const cabExt = ["Data", "Hora", "Tipo de transação", "Nome", "Detalhe", "Valor"];
    const linhasExt = pix.map(v => linha([
      v.DataVenda, v.HoraVenda || "", "Pix", "Pix recebido", "Recebido",
      "+R$ " + brl(v.ValoresDetalheVendasV3?.ValorBruto),
    ]));
    const arqExt = path.join(DIR, `${LOJA} extrato ${dd}-${mm}.csv`);
    fs.writeFileSync(arqExt, [linha(cabExt), ...linhasExt].join("\n") + "\n");
    saida.push({ tipo: "extrato", arq: arqExt, n: linhasExt.length });

    for (const s of saida) console.log(`  ${s.tipo}: ${s.n} linha(s) → ${path.basename(s.arq)}`);
    const soma = vendas.reduce((a, v) => a + Number(v.ValoresDetalheVendasV3?.ValorBruto || 0), 0);
    console.log(`  total do portal: ${vendas.length} transações · R$ ${brl(soma)}`);
    return saida;
  } finally {
    await ctx.close().catch(() => {});
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  const dia = process.argv[2] || ontem();
  console.log(`Azulzinha ${LOJA} · ${dia}`);
  coletar(dia).then(() => process.exit(0))
    .catch(e => { console.error("❌ " + (e.message || e)); process.exit(e.code === "SESSAO_EXPIRADA" ? 10 : 1); });
}
