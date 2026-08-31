#!/usr/bin/env node
/**
 * coleta_ranking_clientes.mjs — quem comprou em qual loja. Leitura pura.
 * Segue EXATAMENTE o padrão de cliente8_ranking.mjs, que é o que funciona:
 * submit por document.forms.Form1.submit(), limite = primeira opção do select
 * ("todos"), e produtos_servicos no último rádio ("Ambos"). Clicar no B1 ou
 * setar limite="9999" NÃO gera o relatório.
 */
import { chromium } from "playwright-core";
import { garantirSessao } from "./microvix_auth.mjs";
import { writeFileSync } from "node:fs";
const log = m => process.stderr.write(`[rk] ${m}\n`);
const URL="https://linx.microvix.com.br/gestor_web/faturamento/relatorio_ranking.asp";
const OUT="/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas/ranking_clientes.json";
const EMP={L1:1,L3:3,L4:4,L5:10};
const DI=process.argv[2]||"01/01/2025", DF=process.argv[3]||"26/08/2026";
const ctx=await chromium.launchPersistentContext(process.env.MICROVIX_PROFILE||process.env.HOME+"/.claude/microvix-analise",{headless:true,viewport:{width:1700,height:1000}});
const page=ctx.pages()[0]||(await ctx.newPage());
page.on("dialog",async d=>{await d.accept().catch(()=>{});});
await garantirSessao(page,{log,tokenOpcional:true});
const out={_periodo:[DI,DF],_coletado_em:new Date().toISOString()};
for(const [lj,emp] of Object.entries(EMP)){
  await page.goto(URL,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForSelector("#empresas_10",{state:"attached",timeout:20000});
  await page.evaluate(({emp,di,df})=>{
    document.querySelectorAll('input[id^="empresas_"]').forEach(c=>c.checked=false);
    const e=document.getElementById("empresas_"+emp); if(e) e.checked=true;
    document.getElementById("data1").value=di;
    document.getElementById("data2").value=df;
    const lim=document.getElementById("limite"); if(lim) lim.value=lim.options[0].value;
    const ps=[...document.querySelectorAll('input[name="produtos_servicos"]')]; if(ps.length) ps[ps.length-1].checked=true;
  },{emp,di:DI,df:DF});
  await Promise.all([
    page.waitForNavigation({timeout:60000}).catch(()=>null),
    page.evaluate(()=>document.forms.Form1.submit()),
  ]);
  let ant=-1,est=0;
  for(let i=0;i<90;i++){ await page.waitForTimeout(2000);
    const n=await page.evaluate(()=>document.querySelectorAll("table tr").length).catch(()=>0);
    if(n>5&&n===ant){ if(++est>=3) break; } else est=0; ant=n; }
  const linhas=await page.evaluate(()=>{
    const r=[];
    for(const tr of document.querySelectorAll("table tr")){
      const c=[...tr.querySelectorAll("td")].map(x=>x.textContent.trim());
      if(c.length>=4){ const m=(c[1]||"").match(/^(\d{1,7})\s*-\s*(.+)$/); if(m) r.push({cod:m[1],nome:m[2].slice(0,60),valor:c[2],qtde:c[3]}); }
    }
    return r;
  });
  out[lj]=linhas;
  log(`${lj}: ${linhas.length} clientes`);
  writeFileSync(OUT,JSON.stringify(out));
}
log("gravado "+OUT);
await ctx.close();
