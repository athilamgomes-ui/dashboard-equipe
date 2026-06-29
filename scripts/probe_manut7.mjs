#!/usr/bin/env node
// read-only: submete Form1 -> relatorio_manut_listagem.asp (emp1, marca 2) e parseia a tabela
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[man7] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1600, height: 1000 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const set=(id,v)=>{const e=document.getElementById(id); if(e)e.checked=v;};
    ["chClassIpi","chClassCest","chConfig_tributaria","ch_id_origem_mercadoria","chDescricaoBasica","chReferencia","ch_produto_superfluo","ch_cod_beneficio_fiscal"].forEach(id=>set(id,true));
    [3,4,9,10,11].forEach(i=>set("empresas_"+i,false)); set("empresas_1",true);
    const ms=document.getElementById("marcas");
    if(ms){ if(![...ms.options].some(o=>o.value==="2")){const o=document.createElement("option");o.value="2";o.text="MB";ms.add(o);} [...ms.options].forEach(o=>o.selected=(o.value==="2")); }
  });
  await page.waitForTimeout(300);
  // submit Form1 (action=relatorio_manut_listagem.asp). Pode haver validação onsubmit.
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>null),
    page.evaluate(() => { try{ if(typeof verificaChConfig_tributaria==='function'){} }catch(e){}; document.getElementById("Form1").submit(); }),
  ]);
  // a listagem carrega progressivamente
  let last=-1,stable=0,t0=Date.now();
  while(Date.now()-t0<120000){ await page.waitForTimeout(1500); const n=await page.evaluate(()=>document.querySelectorAll("table tr").length).catch(()=>0); if(n>5){ if(n===last){if(++stable>=4)break;}else stable=0; last=n; } }
  log("URL listagem: " + page.url());
  const out = await page.evaluate(() => {
    let best=null,max=0; for(const t of document.querySelectorAll("table")){const n=t.querySelectorAll("tr").length; if(n>max){max=n;best=t;}}
    if(!best) return {erro:"sem tabela", bodyLen: document.body.innerText.length, bodyHead: document.body.innerText.slice(0,400)};
    const rows=[...best.querySelectorAll("tr")];
    const headers = rows.slice(0,6).map(tr=>[...tr.cells].map(c=>(c.textContent||"").trim().replace(/\s+/g,' ').slice(0,22)));
    const data = rows.slice(0,30).map(tr=>[...tr.cells].map(c=>(c.textContent||"").trim().replace(/\s+/g,' ').slice(0,22)));
    return { nRows: rows.length, headers, data };
  });
  log("nRows="+out.nRows);
  (out.headers||[]).forEach((r,i)=>log(`  H${i}[${r.length}]: ${JSON.stringify(r)}`));
  log("--- data ---");
  (out.data||[]).slice(6,30).forEach((r,i)=>log(`  d${i}[${r.length}]: ${JSON.stringify(r)}`));
  if(out.erro) log("ERRO: "+out.erro+" head="+out.bodyHead);
  writeFileSync("/tmp/manut7.json", JSON.stringify(out,null,1));
  writeFileSync("/tmp/manut7.html", await page.content());
  process.stdout.write(JSON.stringify(out,null,1).slice(0,200));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
