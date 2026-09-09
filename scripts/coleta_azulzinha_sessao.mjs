#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// coleta_azulzinha_sessao.mjs — login + coleta de VÁRIOS dias na MESMA sessão.
//
// Existe porque o portal Azulzinha exige o token de 6 dígitos do app a cada
// processo novo de navegador (descoberto em 09/09/2026: a sessão não sobrevive
// ao fechamento). Rodar o coletor uma vez por dia faria o Athila digitar o
// token N vezes. Aqui ele digita UMA vez e o script varre todos os dias.
//
//   node coleta_azulzinha_sessao.mjs 2026-09-04 2026-09-05 2026-09-08
// ─────────────────────────────────────────────────────────────────────────────
import { abrirContexto, estaLogado, URL_PORTAL } from "./azulzinha_sessao.mjs";
import { coletar } from "./coleta_azulzinha.mjs";

const dias = process.argv.slice(2).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
if (!dias.length) { console.error("uso: node coleta_azulzinha_sessao.mjs 2026-09-04 [2026-09-05 ...]"); process.exit(2); }

const alvo = await abrirContexto({ headless: false });
try {
  await alvo.page.goto(URL_PORTAL, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("\n🔓 Janela aberta — faça o login, INCLUINDO o token de 6 dígitos do app.");
  console.log("   Assim que entrar, eu coleto " + dias.length + " dia(s) sem fechar o navegador.\n");

  const limite = Date.now() + 10 * 60 * 1000;
  let ok = false;
  while (Date.now() < limite) {
    await alvo.page.waitForTimeout(3000);
    if (await estaLogado(alvo.page).catch(() => false)) {
      await alvo.page.waitForTimeout(3000);
      if (await estaLogado(alvo.page).catch(() => false)) { ok = true; break; }
    }
  }
  if (!ok) { console.error("⏱️ não detectei login em 10 min"); process.exit(1); }
  console.log("✅ logado — coletando\n");

  for (const dia of dias) {
    console.log("── " + dia + " ──");
    try { await coletar(dia, alvo); }
    catch (e) { console.log("  ❌ " + (e.message || e)); }
  }
} finally {
  await alvo.ctx.close().catch(() => {});
}
process.exit(0);
