#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// infinitepay_sessao.mjs — sessão do painel web da InfinitePay.
//
// UM LOGIN, TRÊS EMPRESAS. O acesso do Athila tem as contas das lojas dentro do
// mesmo login; a troca é feita em https://app.infinitepay.io/select-account.
// Por isso existe UM profile só (`~/.claude/infinitepay-profile`) e a loja é
// escolhida antes de cada coleta — não três sessões, como eu tinha suposto.
//
// POR QUE ASSIM: nenhuma senha entra em script, Keychain ou env. Aliás nem
// existe senha — o acesso web da InfinitePay é por QR Code lido no app do
// celular. O Athila loga UMA vez numa janela visível (`login`) e a sessão fica
// no profile. Quando ela cair, alguém escaneia de novo: não há re-login
// automático possível nesse modelo.
//
// ⚠️ NUNCA usar o ~/.claude/microvix-profile aqui. Ele é disputado por ~20
// scripts (a precificação entra de 15 em 15 min) e o lock do Singleton já
// derrubou coleta.
//
//   node infinitepay_sessao.mjs login       ← janela visível, você escaneia o QR
//   node infinitepay_sessao.mjs contas      ← lista as empresas do acesso
//   node infinitepay_sessao.mjs status      ← a sessão está viva? troca de conta funciona?
// ─────────────────────────────────────────────────────────────────────────────
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const URL_APP = "https://app.infinitepay.io";
export const URL_CONTAS = URL_APP + "/select-account";
export const LOJAS = ["L1", "L3", "L5"];          // L4 não tem conta InfinitePay
const PERFIL = path.join(os.homedir(), ".claude", "infinitepay-profile");
const MARCADOR = path.join(PERFIL, ".sessao.json");
export const MAPA = path.join(os.homedir(), ".claude", "caixa-contas-infinitepay.json");

// loja → { handle, cnpj, confirmado }. Fora do repositório: o repo é público e
// isto tem CNPJ das empresas.
export function mapaContas() {
  if (!fs.existsSync(MAPA)) throw new Error("não achei " + MAPA + " — rode `node infinitepay_sessao.mjs contas`.");
  return JSON.parse(fs.readFileSync(MAPA, "utf8"));
}

// Detecção de "estou logado?".
//
// ⚠️ A primeira versão perguntava "tem campo de senha? tem <nav>?" e deu FALSO
// POSITIVO na hora: a tela de login não tem input nenhum, só o QR Code. O script
// gravou "sessão salva" sem ninguém ter logado. Agora a regra é positiva —
// só vale se aparecer algo que SÓ existe dentro da conta. Na dúvida responde
// não: falso negativo custa um login; falso positivo faz o robô "coletar" a
// tela de login e publicar vazio como se fosse o movimento do dia.
async function estaLogado(page) {
  if (/\/(login|signin|entrar|auth)/i.test(page.url())) return false;
  if (await page.locator('input[type="password"]').count().catch(() => 0)) return false;
  const txt = await page.locator("body").innerText().catch(() => "");
  if (/escaneie|qr\s*code|abra o app|entre na infinitepay/i.test(txt)) return false;
  return /saldo|extrato|movimenta|transfer|cobran|maquininha|recebiment|suas contas/i.test(txt);
}

// Qual empresa está selecionada agora. O handle ($casadabeleza-atm) é a marca
// confiável — o nome fantasia se repete entre as lojas.
export async function identidade(page) {
  const txt = await page.locator("body").innerText().catch(() => "");
  return (txt.match(/\$[a-z0-9][a-z0-9-]*/i) || [null])[0];
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

// Troca a empresa ativa. Idempotente: se já está na conta certa, não faz nada
// (recarregar à toa custa ~8s por loja na coleta diária).
export async function selecionarConta(page, handle) {
  if ((await identidade(page)) === handle) return handle;
  await page.goto(URL_CONTAS, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.getByText(handle, { exact: false }).first().click({ timeout: 15000 });
  await page.waitForTimeout(6000);
  const agora = await identidade(page);
  if (agora !== handle) throw new Error("pedi a conta " + handle + " e caí em " + (agora || "nenhuma"));
  return agora;
}

// Usado pelos coletores: sessão viva + empresa certa selecionada.
//
// ⚠️ A trava de titular existe por causa de um erro real (05/08/2026): antes de
// eu descobrir o seletor de empresa, o login da "L3" foi feito com o app na
// conta de Altamira e o profile ficou apontando para a conta da L1. Sem a
// checagem, o robô geraria "L3 maquininha.csv" com o movimento da L1 e cruzaria
// contra o ERP de Itaituba — divergência inventada dos dois lados, em silêncio.
export async function contextoLogado(loja) {
  const conta = mapaContas()[loja];
  if (!conta) throw new Error("loja " + loja + " não está no mapa de contas (" + MAPA + ")");
  const { ctx, page } = await abrirContexto({ headless: true });
  await page.goto(URL_APP, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3000);
  if (!(await estaLogado(page))) {
    await ctx.close().catch(() => {});
    const e = new Error("sessão da InfinitePay expirou. Refaça: node infinitepay_sessao.mjs login");
    e.code = "SESSAO_EXPIRADA";
    throw e;
  }
  try {
    await selecionarConta(page, conta.handle);
  } catch (err) {
    await ctx.close().catch(() => {});
    const e = new Error("não consegui selecionar a conta da " + loja + " (" + conta.handle + "): " + err.message);
    e.code = "CONTA_TROCADA";
    throw e;
  }
  return { ctx, page, handle: conta.handle };
}

const cmds = {
  async login() {
    const { ctx, page } = await abrirContexto({ headless: false });
    await page.goto(URL_APP, { waitUntil: "domcontentloaded", timeout: 60000 });
    console.log("\n🔓 Janela aberta — escaneie o QR Code com o app da InfinitePay.");
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
      fs.writeFileSync(MARCADOR, JSON.stringify(
        { logadoEm: new Date().toISOString(), handleInicial: await identidade(page) }, null, 2));
      console.log("✅ Sessão salva em " + PERFIL);
      console.log("   A troca de empresa é feita pelo robô a cada coleta — não precisa logar por loja.");
    } else console.log("⏱️ Não detectei login em 10 min.");
    await ctx.close().catch(() => {});
    if (!ok) process.exit(1);
  },

  // Lista o que existe no acesso, para montar/conferir o mapa loja → conta.
  async contas() {
    const { ctx, page } = await abrirContexto({ headless: true });
    await page.goto(URL_CONTAS, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(4000);
    const txt = await page.locator("body").innerText().catch(() => "");
    const achados = [...txt.matchAll(/(\$[a-z0-9][a-z0-9-]*)\s*\n?\s*(\d{14})?/gi)]
      .map(m => ({ handle: m[1], cnpj: m[2] || "—" }));
    console.log("contas no acesso:");
    for (const a of achados) console.log("  " + a.handle.padEnd(24) + a.cnpj);
    let mapa = {}; try { mapa = mapaContas(); } catch {}
    console.log("\nmapa atual (" + MAPA + "):");
    for (const l of LOJAS) {
      const c = mapa[l];
      console.log("  " + l + " → " + (c ? c.handle + (c.confirmado ? "  ✅ confirmado" : "  ⚠️ NÃO confirmado") : "—"));
    }
    await ctx.close().catch(() => {});
  },

  async status() {
    for (const loja of LOJAS) {
      try {
        const { ctx, handle } = await contextoLogado(loja);
        await ctx.close().catch(() => {});
        console.log("✅ " + loja + ": ok (conta " + handle + ")");
      } catch (e) {
        console.log("❌ " + loja + ": " + (e.message || e));
      }
    }
  },
};

if (import.meta.url === "file://" + process.argv[1]) {
  const [cmd, ...resto] = process.argv.slice(2);
  const fn = cmds[cmd];
  if (!fn) { console.error("comandos: login | contas | status"); process.exit(2); }
  fn(resto).catch(e => { console.error("❌ " + (e.message || e)); process.exit(1); });
}
