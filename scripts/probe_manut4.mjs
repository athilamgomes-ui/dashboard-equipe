#!/usr/bin/env node
// read-only: roda relatorio_manut.asp p/ 1 marca (emp1) e mostra cabeçalhos + linhas de amostra
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log = m => process.stderr.write(`[man4] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1600, height: 1000 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp", { waitUntil: "networkidle", timeout: 40000 });
  await page.waitForTimeout(1500);
  const baseline = await page.evaluate(() => document.querySelectorAll("table tr").length).catch(()=>0);
  // configura: emp1, marca Marco Boni (2), garante NCM/CEST/Config/Origem marcados
  await page.evaluate(() => {
    const set=(id,v)=>{const e=document.getElementById(id); if(e){e.checked=v;}};
    ["chClassIpi","chClassCest","chConfig_tributaria","ch_id_origem_mercadoria","chDescricaoBasica","chReferencia","ch_produto_superfluo"].forEach(id=>set(id,true));
    // marca Marco Boni = 2 (igual marca_ids)
    const ms=document.getElementById("marcas");
    if(ms){ if(![...ms.options].some(o=>o.value==="2")){const o=document.createElement("option");o.value="2";o.text="MB";ms.add(o);} ms.value="2"; }
  });
  await page.waitForTimeout(300);
  await page.evaluate(()=>{ const b=[...document.querySelectorAll("input[type=submit],button")].find(x=>/gerar|pesquis|relat/i.test((x.value||x.textContent||""))); if(b)b.click(); });
  // espera tabela
  let last=-1,stable=0,t0=Date.now();
  while(Date.now()-t0<90000){ await page.waitForTimeout(1500); const n=await page.evaluate(()=>document.querySelectorAll("table tr").length).catch(()=>0); if(n>baseline+5){ if(n===last){if(++stable>=3)break;}else stable=0; last=n; } }
  const out = await page.evaluate(() => {
    const tables=[...document.querySelectorAll("table")];
    // pega a tabela com mais linhas (resultado)
    let best=null,max=0; for(const t of tables){const n=t.querySelectorAll("tr").length; if(n>max){max=n;best=t;}}
    if(!best) return {erro:"sem tabela"};
    const rows=[...best.querySelectorAll("tr")];
    const sample=rows.slice(0,18).map(tr=>[...tr.cells].map(c=>(c.textContent||"").trim().replace(/\s+/g,' ').slice(0,28)));
    return { nRows: rows.length, sample };
  });
  log(`linhas tabela: ${out.nRows}`);
  (out.sample||[]).forEach((r,i)=>log(`  r${i} [${r.length}]: ${JSON.stringify(r)}`));
  writeFileSync("/tmp/manut4.json", JSON.stringify(out,null,1));
  process.stdout.write(JSON.stringify(out,null,1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
