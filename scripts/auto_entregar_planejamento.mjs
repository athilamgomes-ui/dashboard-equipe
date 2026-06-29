#!/usr/bin/env node
/*
 * AUTO-AVANÇO DE STATUS NO PLANEJAMENTO (headless) — 29/06/2026.
 * Marca pedidos como FATURADO/ENTREGUE automaticamente quando a NF correspondente
 * aparece no ERP (emitida → FATURADO; lançada/deu entrada → ENTREGUE), CASO A EQUIPE ESQUEÇA.
 *
 * COMO: abre a PRÓPRIA página planejamento.html headless. O carregar() dela já roda
 * detectarFaturamentos() + autoAvancarStatus() (mesmíssimo código que a equipe usa no navegador),
 * que faz o match (marca+valor, aliases, combinação de NFs) e PATCH no Supabase. Reusar a página
 * = ZERO divergência de lógica. Aqui só observamos/loggamos o que foi avançado (DB._autoAv) e as
 * sugestões não-fortes que ficaram pendentes de confirmação humana (DB._sug).
 *
 * DRY=1 → intercepta e ABORTA os PATCH em /rest/v1/pedidos (não grava nada; só mostra o que faria).
 * Sem env → produção (deixa a página gravar).
 */
import { chromium } from "playwright";
const URL = "https://athilamgomes-ui.github.io/dashboard-equipe/planejamento.html?auto=" + Date.now();
const DRY = process.env.DRY === "1";
const log = m => process.stderr.write(`[auto-entrega] ${m}\n`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
let bloqueados = 0;
if (DRY) {
  await page.route(/\/rest\/v1\/pedidos/, route => {
    const m = route.request().method();
    if (m === "PATCH" || m === "POST" || m === "DELETE") { bloqueados++; return route.abort(); }
    return route.continue();
  });
}
page.on("pageerror", e => log("ERRO na página: " + String(e.message).split("\n")[0]));

try {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  // espera o carregar() concluir: DB.pedidos carregado e autoAvancarStatus já rodou (_autoAv definido)
  await page.waitForFunction(
    () => window.DB && Array.isArray(window.DB.pedidos) && window.DB.pedidos.length > 0 && Array.isArray(window.DB._autoAv),
    { timeout: 60000 }
  ).catch(() => log("aviso: timeout esperando carregar()/auto-avanço — pode não haver NFes (cm nulo) ou erro de rede"));
  await page.waitForTimeout(2500); // deixa os PATCH terminarem
  const r = await page.evaluate(() => ({
    pedidos: (window.DB && window.DB.pedidos || []).length,
    autoAv: (window.DB && window.DB._autoAv) || [],
    sug: (window.DB && window.DB._sug) || [],
    nfesEm: (window.DB && window.DB.nfesEm) || "",
  }));
  log(`pedidos: ${r.pedidos} · NFes ERP de: ${r.nfesEm || "?"}`);
  if (r.autoAv.length) {
    log(`AVANÇADOS automaticamente (${r.autoAv.length}):`);
    for (const a of r.autoAv) log(`  • ${a.marca}/${a.loja}: ${a.de} → ${a.para} (NF ${a.nf}, ${a.data})`);
  } else log("nenhum pedido para avançar (tudo já no status certo).");
  if (r.sug.length) {
    log(`sugestões NÃO-fortes (precisam de confirmação humana no app, ${r.sug.length}):`);
    for (const s of r.sug) log(`  ? ${s.marca}/${s.loja}: ${s.de} → ${s.para} (NF ${s.nf}, R$ ${s.valor} vs pedido R$ ${s.va})`);
  }
  if (DRY) log(`DRY-RUN: ${bloqueados} escrita(s) ao Supabase BLOQUEADA(S) — nada foi alterado.`);
} catch (e) {
  log("FALHA: " + String(e.message || e).split("\n")[0]);
  process.exitCode = 1;
} finally {
  await browser.close();
}
