#!/usr/bin/env node
// read-only: captura a resposta AJAX do relatorio_manut (obterRelatorioProdutos) p/ 1 marca
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[man5] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1600, height: 1000 } });
const page = ctx.pages()[0] || (await ctx.newPage());
const caps = [];
page.on("response", async (resp) => {
  try {
    const u = resp.url(); const m = resp.request().method();
    if (!/microvix/.test(u) || /\.(png|jpg|gif|css|woff|svg|ico)(\?|$)/i.test(u)) return;
    if (/home\/index\.asp|filtrogenerico|google/.test(u)) return;
    const t = await resp.text().catch(() => "");
    if (t.length < 50) return;
    const rec = { url: u.slice(0,150), m, st: resp.status(), len: t.length, hasNcm:/ncm/i.test(t), hasCfg:/config.?trib|tributar/i.test(t), postData:(resp.request().postData()||"").slice(0,200) };
    if (rec.hasNcm || rec.hasCfg || /relat|produto|manut/i.test(u)) { rec.body = t.slice(0, 4000); caps.push(rec); }
  } catch (_) {}
});
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const set=(id,v)=>{const e=document.getElementById(id); if(e)e.checked=v;};
    ["chClassIpi","chClassCest","chConfig_tributaria","ch_id_origem_mercadoria"].forEach(id=>set(id,true));
    [3,4,9,10,11].forEach(i=>set("empresas_"+i,false)); set("empresas_1",true);
    const ms=document.getElementById("marcas");
    if(ms){ if(![...ms.options].some(o=>o.value==="2")){const o=document.createElement("option");o.value="2";o.text="MB";ms.add(o);} ms.value="2"; }
  });
  await page.waitForTimeout(300);
  // dispara: tenta a função nativa, senão clica botão Pesquisar
  const fired = await page.evaluate(() => {
    if (typeof obterRelatorioProdutos === "function") { try { obterRelatorioProdutos(document.Form1||document.forms[0]); return "fn"; } catch(e){ return "fn_err:"+e.message; } }
    const b=[...document.querySelectorAll("input[type=submit],input[type=button],button,a")].find(x=>/^pesquisar$/i.test((x.value||x.textContent||"").trim()));
    if(b){b.click(); return "btn";}
    return "none";
  });
  log("trigger: " + fired);
  await page.waitForTimeout(9000);
  log(`capturados: ${caps.length}`);
  caps.forEach(c=>log(`  [${c.st}] ${c.m} ncm=${c.hasNcm} cfg=${c.hasCfg} len=${c.len} ${c.url}\n      POST=${c.postData}`));
  writeFileSync("/tmp/manut5.json", JSON.stringify(caps,null,1));
  // mostra preview do maior body
  const big = caps.sort((a,b)=>b.len-a.len)[0];
  if(big) log("PREVIEW maior body:\n"+big.body);
  process.stdout.write(JSON.stringify(caps.map(c=>({url:c.url,m:c.m,st:c.st,len:c.len,hasNcm:c.hasNcm,hasCfg:c.hasCfg,postData:c.postData})),null,1));
} catch (e) { log("FALHA " + e.message); writeFileSync("/tmp/manut5.json", JSON.stringify(caps,null,1)); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
