#!/usr/bin/env node
/*
 * REFRESH DO COMPROMETIDO EM TRÂNSITO (headless) — 08/09/2026.
 * Abre o planejamento.html headless (mesma técnica do auto_entregar_planejamento.mjs). O carregar()
 * da página roda detectarFaturamentos() + autoAvancarStatus() + persistirComprometido(), que regrava
 * a tabela Supabase pedidos_comprometido com o em-trânsito FRESCO (ENVIADO+FATURADO sem _noERP).
 * Reusar a página = ZERO divergência de lógica com a tela de pedidos.
 *
 * POR QUÊ: o snapshot só era gravado quando alguém ABRIA a página no navegador. Em 03/09/2026 o
 * escritor (persistirComprometido) foi apagado por uma corrida read-modify-write e o snapshot
 * congelou 5 dias — o Financeiro passou a mostrar em-trânsito velho (L1 out 114.289 vs 94.478 real).
 * Rodar isto no início do pipeline do Financeiro garante o snapshot fresco no momento do build.
 *
 * Exit 0 sempre que a página carregou e o snapshot foi (re)gravado nos últimos ~2min; 1 se falhou.
 * Não escreve nada além do que a própria página escreve (pedidos + pedidos_comprometido, anon).
 */
import { chromium } from "playwright";
const URL = "https://athilamgomes-ui.github.io/dashboard-equipe/planejamento.html?refresh=" + Date.now();
const SB_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const log = m => process.stderr.write(`[refresh-comprometido] ${m}\n`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("pageerror", e => log("ERRO na página: " + String(e.message).split("\n")[0]));
try {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(
    () => window.DB && Array.isArray(window.DB.pedidos) && window.DB.pedidos.length > 0,
    { timeout: 60000 }
  );
  await page.waitForTimeout(3500); // deixa detectarFaturamentos + persistirComprometido (upsert) terminarem
  await browser.close();

  // verifica que o snapshot foi regravado agora (atualizado_em recente)
  const r = await fetch(`${SB_URL}/rest/v1/pedidos_comprometido?id=eq.1&select=atualizado_em`,
    { headers: { apikey: SB_ANON, Authorization: "Bearer " + SB_ANON } });
  const row = r.ok ? (await r.json())[0] : null;
  const at = row && row.atualizado_em ? new Date(row.atualizado_em) : null;
  const idadeMin = at ? Math.round((Date.now() - at.getTime()) / 60000) : null;
  if (idadeMin != null && idadeMin <= 3) { log(`snapshot regravado há ${idadeMin}min — OK`); process.exit(0); }
  log(`AVISO: snapshot com ${idadeMin == null ? "?" : idadeMin} min — a página pode não ter gravado`);
  process.exit(1);
} catch (e) {
  log("FALHA: " + String(e.message || e).split("\n")[0]);
  try { await browser.close(); } catch {}
  process.exit(1);
}
