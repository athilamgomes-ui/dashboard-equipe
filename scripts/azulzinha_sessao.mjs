#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// azulzinha_sessao.mjs — sessão do portal Azulzinha da Caixa (adquirente da L4).
//
// A L4 (MissBeleza Altamira) não tem conta InfinitePay: a maquininha dela é a
// Azulzinha, da Caixa. Mesmo padrão da InfinitePay: o Athila loga UMA vez numa
// janela visível e a sessão fica no profile; as coletas seguintes rodam
// headless. Nenhuma senha entra em script, Keychain ou variável de ambiente —
// e eu não preencho campo de login de banco.
//
// ⚠️ Profile PRÓPRIO (`~/.claude/azulzinha-profile`). Nunca o microvix-profile
// (disputado por ~20 scripts) nem o da InfinitePay.
//
//   node azulzinha_sessao.mjs login    ← janela visível, você entra
//   node azulzinha_sessao.mjs status   ← a sessão está viva?
//   node azulzinha_sessao.mjs olhar    ← descreve a tela logada (para mapear o portal)
// ─────────────────────────────────────────────────────────────────────────────
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const URL_PORTAL = "https://portal.azulzinhadacaixa.com.br/Login";
const PERFIL = path.join(os.homedir(), ".claude", "azulzinha-profile");
const MARCADOR = path.join(PERFIL, ".sessao.json");

// Regra positiva, como na InfinitePay: só vale como logado se a tela mostrar
// algo que SÓ existe dentro do portal. Na dúvida responde não — falso positivo
// faria o robô "coletar" a tela de login e publicar vazio como se fosse o
// movimento do dia.
async function estaLogado(page) {
  if (/\/login/i.test(page.url())) return false;
  if (await page.locator('input[type="password"]').count().catch(() => 0)) return false;
  const txt = await page.locator("body").innerText().catch(() => "");
  if (/esqueci minha senha|acessar o portal|informe seu cpf|primeiro acesso/i.test(txt)) return false;
  return /vendas|extrato|transa|recebimento|movimenta|antecipa|maquininha|sair/i.test(txt);
}

export async function abrirContexto({ headless = true } = {}) {
  fs.mkdirSync(PERFIL, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PERFIL, {
    headless, viewport: { width: 1400, height: 900 },
    acceptDownloads: true, locale: "pt-BR", timezoneId: "America/Sao_Paulo",
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  return { ctx, page };
}

export async function contextoLogado() {
  const { ctx, page } = await abrirContexto({ headless: true });
  await page.goto(URL_PORTAL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);
  if (!(await estaLogado(page))) {
    await ctx.close().catch(() => {});
    const e = new Error("sessão do portal Azulzinha expirou. Refaça: node azulzinha_sessao.mjs login");
    e.code = "SESSAO_EXPIRADA";
    throw e;
  }
  return { ctx, page };
}

const cmds = {
  async login() {
    const { ctx, page } = await abrirContexto({ headless: false });
    await page.goto(URL_PORTAL, { waitUntil: "domcontentloaded", timeout: 60000 });
    console.log("\n🔓 Janela aberta no portal Azulzinha — faça o login (e o 2FA, se pedir).");
    console.log("   Não toco em nenhum campo; só fico esperando você entrar. (10 min)\n");
    const limite = Date.now() + 10 * 60 * 1000;
    let ok = false;
    while (Date.now() < limite) {
      await page.waitForTimeout(3000);
      if (await estaLogado(page).catch(() => false)) {
        await page.waitForTimeout(4000);
        if (await estaLogado(page).catch(() => false)) { ok = true; break; }
      }
    }
    if (ok) {
      fs.writeFileSync(MARCADOR, JSON.stringify({ logadoEm: new Date().toISOString(), url: page.url() }, null, 2));
      console.log("✅ Sessão salva em " + PERFIL);
      console.log("   URL logada: " + page.url());
    } else console.log("⏱️ Não detectei login em 10 min.");
    await ctx.close().catch(() => {});
    if (!ok) process.exit(1);
  },

  async status() {
    try {
      const { ctx, page } = await contextoLogado();
      console.log("✅ sessão viva — " + page.url());
      await ctx.close().catch(() => {});
    } catch (e) { console.log("❌ " + (e.message || e)); process.exit(1); }
  },

  // Descreve a tela logada: rotas do menu e controles. É o que uso para achar
  // o relatório de vendas antes de escrever o coletor.
  async olhar() {
    const { ctx, page } = await contextoLogado();
    console.log("URL:", page.url(), "| título:", await page.title());
    const info = await page.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const links = [...document.querySelectorAll("a[href]")].filter(vis)
        .map(a => (a.getAttribute("href") || "") + "  ⟵  " + (a.innerText || "").trim().replace(/\s+/g, " ").slice(0, 40));
      const bts = [...document.querySelectorAll("button,[role=button]")].filter(vis)
        .map(b => (b.innerText || b.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ")).filter(t => t && t.length < 40);
      return { links: [...new Set(links)].slice(0, 40), bts: [...new Set(bts)].slice(0, 25) };
    });
    console.log("\n── rotas ──"); info.links.forEach(l => console.log("  ", l));
    console.log("\n── botões ──", JSON.stringify(info.bts));
    await ctx.close().catch(() => {});
  },
};

if (import.meta.url === "file://" + process.argv[1]) {
  const [cmd] = process.argv.slice(2);
  const fn = cmds[cmd];
  if (!fn) { console.error("comandos: login | status | olhar"); process.exit(2); }
  fn().catch(e => { console.error("❌ " + (e.message || e)); process.exit(1); });
}
