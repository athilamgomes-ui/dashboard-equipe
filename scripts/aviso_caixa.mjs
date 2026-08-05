#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// aviso_caixa.mjs — monta e envia o resumo diário da conferência de caixa.
//
// Dois canais, mesma mensagem:
//   whatsapp  — WhatsApp Cloud API (oficial, Meta). Token no Keychain
//               `whatsapp-amgomes/token`; config em ~/.claude/caixa-aviso.json
//   telegram  — Bot API. Token no Keychain `telegram-amgomes/botToken`.
//
// ⚠️ REGRA DA MENSAGEM: loja que fechou vira UMA linha. Só quem não fechou ganha
// detalhe. Um resumo que lista tudo todo dia deixa de ser lido em uma semana, e
// aí o dia em que faltar dinheiro passa batido junto com o resto.
//
// ⚠️ WhatsApp: mensagem iniciada pela empresa fora da janela de 24h EXIGE
// template aprovado, e **parâmetro de template não pode conter quebra de
// linha** (a API rejeita). Por isso o resumo é montado como uma lista de linhas
// avulsas, uma por parâmetro — não como um texto único.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const CONFIG = path.join(os.homedir(), ".claude", "caixa-aviso.json");
const PAINEL = "https://athilamgomes-ui.github.io/dashboard-equipe/conferencia_caixa.html";

const chaveiro = (servico, conta) => {
  try {
    return execFileSync("/usr/bin/security",
      ["find-generic-password", "-s", servico, "-a", conta, "-w"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("não achei " + conta + " no Keychain (serviço " + servico + ").");
  }
};

const R$ = n => "R$ " + Math.abs(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pl = (n, um, varios) => n + " " + (n === 1 ? um : varios);
const dBR = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7);

// ── texto ────────────────────────────────────────────────────────────────────
// Recebe os resumos do conciliar_headless (resumir()). Devolve linhas soltas:
// o Telegram junta com \n, o WhatsApp manda uma por parâmetro.
export function montarLinhas(resumos, dia) {
  const linhas = [];
  const ok = resumos.filter(r => r.ok);
  const ruim = resumos.filter(r => !r.ok);

  for (const r of ruim) {
    const partes = [];
    for (const f of [r.cartao, r.pix].filter(Boolean)) {
      const det = [];
      if (f.semVendaNoERP.n) det.push(f.semVendaNoERP.n + " cobrada(s) sem venda " + R$(f.semVendaNoERP.v));
      if (f.semCobranca.n) det.push(f.semCobranca.n + " venda(s) sem cobrança " + R$(f.semCobranca.v));
      if (!det.length) continue;
      partes.push(f.rotulo + " " + (f.dif < 0 ? "-" : "+") + R$(f.dif) + " (" + det.join("; ") + ")");
    }
    if (r.erros?.length) partes.push("falha: " + r.erros.map(e => e.erro).join("; ").slice(0, 90));
    linhas.push("⚠️ " + r.loja + ": " + (partes.join(" · ") || "conferir no painel"));
  }

  if (ok.length) {
    const tot = ok.reduce((a, r) => a + ((r.cartao?.totExt || 0) + (r.pix?.totExt || 0)), 0);
    linhas.push("✅ " + ok.map(r => r.loja).join(", ") + (ok.length > 1 ? " fecharam" : " fechou") + " — " + R$(tot));
  }
  if (!linhas.length) linhas.push("nenhuma loja conferida (sem arquivo?)");

  // ── parâmetros do template do WhatsApp ──
  // A Meta recusou o desenho "uma linha por loja, uma variável por linha":
  // `error_subcode 2388293` — "a proporção entre palavras e parâmetros excede o
  // limite". Ela exige texto fixo em volta das variáveis. Por isso o template
  // tem 4 campos com rótulo próprio, e não N linhas soltas.
  // ⚠️ Parâmetro não pode ter quebra de linha nem vir vazio.
  const desc = (r) => {
    const f = [r.cartao, r.pix].filter(Boolean).sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif))[0];
    return f ? r.loja + " (" + f.rotulo + " " + (f.dif < 0 ? "-" : "+") + R$(f.dif) + ")" : r.loja;
  };
  // O "principal ponto" é o maior buraco em dinheiro do dia inteiro — é o que
  // decide se o Athila larga o que está fazendo agora ou olha depois.
  const casos = [];
  for (const r of resumos)
    for (const f of [r.cartao, r.pix].filter(Boolean)) {
      if (f.semVendaNoERP.n) casos.push({ v: f.semVendaNoERP.v, t: r.loja + " com " + pl(f.semVendaNoERP.n, "cobrança", "cobranças") + " na maquininha sem venda no sistema, total de " + R$(f.semVendaNoERP.v) });
      if (f.semCobranca.n) casos.push({ v: f.semCobranca.v, t: r.loja + " com " + pl(f.semCobranca.n, "venda", "vendas") + " no sistema sem cobrança correspondente, total de " + R$(f.semCobranca.v) });
    }
  casos.sort((a, b) => b.v - a.v);
  const totOk = ok.reduce((a, r) => a + ((r.cartao?.totExt || 0) + (r.pix?.totExt || 0)), 0);

  const whatsapp = [
    dBR(dia),
    ruim.length ? ruim.map(desc).join(" e ") : "nenhuma, todas fecharam",
    casos.length ? casos[0].t : "nada a verificar hoje",
    ok.length ? ok.map(r => r.loja).join(", ") + ", com " + R$(totOk) + " conferidos" : "nenhuma",
  ];

  return { titulo: "Conferência de caixa · " + dBR(dia), linhas, painel: PAINEL, whatsapp };
}

export const montarTexto = (m) => [m.titulo, ...m.linhas, "", m.painel].join("\n");

// ── WhatsApp Cloud API ───────────────────────────────────────────────────────
// config: {phoneNumberId, para, template, idioma}
async function enviarWhatsApp(m) {
  if (!fs.existsSync(CONFIG)) throw new Error("falta " + CONFIG + " com phoneNumberId e para.");
  const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8")).whatsapp;
  if (!cfg?.phoneNumberId || !cfg?.para) throw new Error("config do WhatsApp incompleta em " + CONFIG);
  const token = chaveiro("whatsapp-amgomes", "token");

  const params = m.whatsapp.map(t => ({ type: "text", text: t.replace(/[\n\t]+/g, " ").slice(0, 900) }));

  const r = await fetch("https://graph.facebook.com/v21.0/" + cfg.phoneNumberId + "/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cfg.para,
      type: "template",
      template: {
        name: cfg.template || "conferencia_caixa_diaria",
        language: { code: cfg.idioma || "pt_BR" },
        components: [{ type: "body", parameters: params }],
      },
    }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error("WhatsApp respondeu " + r.status + ": " + t.slice(0, 300));
  return { canal: "whatsapp", id: (JSON.parse(t).messages || [{}])[0]?.id || null };
}

// ── Telegram ─────────────────────────────────────────────────────────────────
async function enviarTelegram(m) {
  const token = chaveiro("telegram-amgomes", "botToken");
  let chatId = null;
  try { chatId = JSON.parse(fs.readFileSync(CONFIG, "utf8")).telegram?.chatId; } catch {}
  if (!chatId) {
    // Descobre sozinho pelo /start que o dono mandou — evita pedir o chat_id.
    const u = await (await fetch("https://api.telegram.org/bot" + token + "/getUpdates")).json();
    chatId = u.result?.map(x => x.message?.chat?.id).filter(Boolean).pop();
    if (!chatId) throw new Error("sem chat_id: mande /start para o bot no Telegram e rode de novo.");
    const cfg = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, "utf8")) : {};
    cfg.telegram = { ...(cfg.telegram || {}), chatId };
    fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2));
  }
  const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: montarTexto(m), disable_web_page_preview: true }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error("Telegram: " + JSON.stringify(j).slice(0, 200));
  return { canal: "telegram", id: j.result?.message_id ?? null };
}

// Canal preferido + queda para o outro. Um aviso que não chega é o mesmo que
// pipeline nenhum: se o WhatsApp falhar (template reprovado, token vencido), o
// Telegram salva o dia e o erro fica registrado.
// Canal só entra na fila se estiver realmente configurado. Sem isso, o erro do
// dia em que o WhatsApp falha vinha poluído com "não achei botToken" — um canal
// que o Athila decidiu não usar (05/08/2026), o que atrapalha o diagnóstico.
const configurado = (c) => {
  try { chaveiro(c === "whatsapp" ? "whatsapp-amgomes" : "telegram-amgomes", c === "whatsapp" ? "token" : "botToken"); return true; }
  catch { return false; }
};

export async function enviar(m, { canal } = {}) {
  const cfg = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, "utf8")) : {};
  const ordem = (canal ? [canal] : (cfg.canal === "telegram" ? ["telegram", "whatsapp"] : ["whatsapp", "telegram"]))
    .filter(c => canal === c || configurado(c));
  if (!ordem.length) throw new Error("nenhum canal de aviso configurado (nem WhatsApp nem Telegram).");
  const erros = [];
  for (const c of ordem) {
    try {
      return { ...(c === "whatsapp" ? await enviarWhatsApp(m) : await enviarTelegram(m)), erros };
    } catch (e) { erros.push(c + ": " + (e.message || e)); }
  }
  throw new Error("não consegui avisar por nenhum canal → " + erros.join(" | "));
}

if (import.meta.url === "file://" + process.argv[1]) {
  const arq = process.argv[2];
  const dia = process.argv[3] || new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const canal = (process.argv.find(a => a.startsWith("--canal=")) || "").split("=")[1] || null;
  if (!arq) { console.error("uso: node aviso_caixa.mjs resumos.json [2026-08-04] [--canal=whatsapp|telegram]"); process.exit(2); }
  const m = montarLinhas(JSON.parse(fs.readFileSync(arq, "utf8")), dia);
  console.log("── mensagem ──\n" + montarTexto(m) + "\n");
  enviar(m, { canal })
    .then(r => { console.log("✅ enviado por " + r.canal + (r.id ? " (id " + r.id + ")" : "")); process.exit(0); })
    .catch(e => { console.error("❌ " + e.message); process.exit(1); });
}
