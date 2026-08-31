#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// enviar_relatorio_vendedores.mjs — monta e envia no WhatsApp o relatório diário
// de performance dos vendedores (Casa da Beleza + MissBeleza, Altamira).
//
// Uso:  node enviar_relatorio_vendedores.mjs <arquivo.json> [--so-texto]
//       --so-texto  = só imprime a mensagem, não envia (para conferir)
//
// ⚠️ WhatsApp Cloud API: mensagem iniciada pela empresa fora da janela de 24h
// EXIGE template aprovado, e **parâmetro de template não aceita quebra de
// linha**. Por isso a lista de vendedores de cada loja vai em UM parâmetro só,
// separada por " · ", em vez de uma linha por pessoa.
//
// ⚠️ ENTREGA NÃO CONFIRMADA no texto livre: a Meta responde "accepted" (entrou
// na fila) mesmo quando descarta a mensagem por estar fora da janela de 24h —
// aconteceu em 06/08/2026. Template aprovado não sofre disso; texto livre sim,
// e por isso só é usado como rede de segurança e sai marcado como incerto.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const CONFIG = path.join(os.homedir(), ".claude", "relatorio-vendedores.json");
const GRAPH = "https://graph.facebook.com/v21.0";

const chaveiro = (servico, conta) => {
  try {
    return execFileSync("/usr/bin/security", ["find-generic-password", "-s", servico, "-a", conta, "-w"],
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch { throw new Error(`não achei ${conta} no Keychain (serviço ${servico}).`); }
};

const R$ = n => "R$ " + (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nBR = n => (n || 0).toLocaleString("pt-BR");
const dec2 = n => (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "SOFIA DE OLIVEIRA MATOS" → "Sofia Oliveira", não "Sofia De": preposição não é
// sobrenome e o relatório vai para gerente ler, não para o sistema.
const CONECTIVOS = new Set(["de", "da", "do", "das", "dos", "e", "di", "del"]);
const nomeCurto = (nome, n = 2) => {
  const p = nome.split(/\s+/).filter(Boolean);
  const out = [p[0]];
  for (let i = 1; i < p.length && out.length < n; i++) if (!CONECTIVOS.has(p[i].toLowerCase())) out.push(p[i]);
  return out.join(" ");
};
const pl = (n, um, varios) => `${nBR(n)} ${n === 1 ? um : varios}`;

// Primeiro nome basta — a gerente sabe quem é. Só desempata com o segundo nome
// quando duas pessoas da MESMA loja têm o mesmo primeiro nome.
function apelidos(vendedores) {
  const primeiro = v => v.nome.split(" ")[0];
  const conta = {};
  for (const v of vendedores) conta[primeiro(v)] = (conta[primeiro(v)] || 0) + 1;
  const nome = v => v.semVendedor ? "Sem vendedor"
    : conta[primeiro(v)] > 1 ? nomeCurto(v.nome) : primeiro(v);
  return new Map(vendedores.map(v => [v, nome(v)]));
}

// Vocabulário igual ao da tela do ERP (Tickets / Qtde Peças / PA / TM), que é como
// o Athila e as gerentes já leem o relatório todo dia.
export function montar(d) {
  const resumo = t => `${pl(t.tickets, "venda", "vendas")} (clientes atendidos), ${pl(t.pecas, "peça", "peças")}, ` +
                      `PA de ${nBR(t.pa)}, ticket médio de ${R$(t.tm)} e total de ${R$(t.valor)}`;

  const listaLoja = l => {
    const ap = apelidos(l.vendedores);
    const txt = l.vendedores
      .map(v => `${ap.get(v)} ${nBR(v.tickets)}v, ${nBR(v.pecas)} pç, PA ${dec2(v.pa)}, TM ${R$(v.tm)}, ${R$(v.valor)}`)
      .join(" · ");
    return txt || "nenhuma venda registrada";
  };

  const l1 = d.lojas.find(l => l.emp === 1), l4 = d.lojas.find(l => l.emp === 4);

  // 5 parâmetros, na ordem do template `relatorio_vendedores_lojas`.
  // Total geral e observação saíram a pedido do Athila em 28/08/2026: o Total Geral
  // era justamente a linha que já tinha se misturado com a da MissBeleza no envio manual.
  const params = [
    d.dia,
    resumo(l1.total), listaLoja(l1),
    resumo(l4.total), listaLoja(l4),
  ];

  // Versão em texto (fallback e conferência) — aqui a quebra de linha é livre.
  const linha = v => `• ${nomeCurto(v.nome)} — ${nBR(v.tickets)} vendas, ` +
                     `${nBR(v.pecas)} pç, PA ${dec2(v.pa)}, TM ${R$(v.tm)}, ${R$(v.valor)}`;
  const texto = [
    `📊 Performance dos vendedores — ${d.dia}`, "",
    `*${l1.loja}*`, resumo(l1.total), ...l1.vendedores.map(linha), "",
    `*${l4.loja}*`, resumo(l4.total), ...l4.vendedores.map(linha),
  ].join("\n");

  return { params, texto };
}

// ── envio ────────────────────────────────────────────────────────────────────
async function enviarWhatsApp(m) {
  if (!fs.existsSync(CONFIG)) throw new Error(`falta ${CONFIG}`);
  const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8")).whatsapp;
  if (!cfg?.phoneNumberId || !cfg?.para) throw new Error(`config incompleta em ${CONFIG}`);
  const token = chaveiro(cfg.keychainServico || "whatsapp-amgomes", cfg.keychainConta || "token");

  const parameters = m.params.map(t => ({ type: "text", text: String(t).replace(/[\n\t]+/g, " ").slice(0, 1000) }));
  const post = body => fetch(`${GRAPH}/${cfg.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: cfg.para, ...body }),
  });

  const r = await post({
    type: "template",
    template: { name: cfg.template || "relatorio_vendedores_diario", language: { code: cfg.idioma || "pt_BR" }, components: [{ type: "body", parameters }] },
  });
  const t = await r.text();
  if (r.ok) return { canal: `whatsapp (template ${cfg.template || "relatorio_vendedores_diario"})`, id: (JSON.parse(t).messages || [{}])[0]?.id || null };

  // 132001/132000/131009 = template inexistente, ainda em análise ou reprovado.
  if (!/13200[01]|131009/.test(t)) throw new Error(`WhatsApp respondeu ${r.status}: ${t.slice(0, 300)}`);

  const r2 = await post({ type: "text", text: { body: m.texto, preview_url: false } });
  const t2 = await r2.text();
  if (!r2.ok) throw new Error(
    `template ainda indisponível (${(JSON.parse(t).error?.message || "").slice(0, 90)}) e o texto livre também falhou (${r2.status}): ${t2.slice(0, 200)}`);
  return { canal: "whatsapp (texto livre)", id: (JSON.parse(t2).messages || [{}])[0]?.id || null, incerto: true };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const arq = process.argv[2];
  if (!arq || !fs.existsSync(arq)) { console.error("uso: enviar_relatorio_vendedores.mjs <arquivo.json> [--so-texto]"); process.exit(2); }
  const d = JSON.parse(fs.readFileSync(arq, "utf8"));
  const m = montar(d);

  // Guarda sempre a mensagem em disco: se o envio falhar, dá para copiar e mandar na mão.
  const saida = path.join(path.dirname(arq), "relatorio_vendedores_mensagem.txt");
  fs.writeFileSync(saida, m.texto + "\n");

  if (process.argv.includes("--so-texto")) { console.log(m.texto); console.error(`\n[texto salvo em ${saida}]`); process.exit(0); }

  if (d.semMovimento) {
    console.error(`[rel-vend] ${d.dia} sem movimento nas duas lojas (domingo/feriado) — não enviei.`);
    process.exit(0);
  }

  try {
    const r = await enviarWhatsApp(m);
    console.error(`[rel-vend] enviado por ${r.canal}${r.id ? ` (id ${r.id})` : ""}` +
      (r.incerto ? " — ⚠️ ENTREGA NÃO CONFIRMADA: texto livre só chega dentro da janela de 24h" : ""));
  } catch (e) {
    console.error(`[rel-vend] FALHA no envio: ${e.message}`);
    console.error(`[rel-vend] a mensagem pronta está em ${saida}`);
    process.exit(11);
  }
}
