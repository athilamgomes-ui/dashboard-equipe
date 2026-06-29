import { chromium } from "playwright";
import { homedir } from "node:os"; import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const log=m=>process.stderr.write(`[a] ${m}\n`);
const ctx=await chromium.launchPersistentContext(join(homedir(),".claude","microvix-profile"),{headless:true,viewport:{width:1600,height:1000}});
const page=ctx.pages()[0]||await ctx.newPage();
await garantirSessao(page,{log});
await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp",{waitUntil:"domcontentloaded",timeout:45000});
await page.waitForTimeout(1000);
// inspeciona radios f_listar_desativa
const radios=await page.evaluate(()=>[...document.querySelectorAll("input[name=f_listar_desativa]")].map(r=>({id:r.id,val:r.value,checked:r.checked,lbl:(document.querySelector(`label[for="${r.id}"]`)?.textContent||r.parentElement?.textContent||"").replace(/\s+/g,' ').trim().slice(0,40)})));
log("radios: "+JSON.stringify(radios));
await page.evaluate(()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.checked=v;};
 ["chConfig_tributaria","chClassIpi"].forEach(id=>set(id,true));
 [1,3,4,9,10,11].forEach(i=>set("empresas_"+i,false)); set("empresas_1",true);
 // tenta marcar "ativos somente": geralmente listar_desativado1=ativos
 const r=[...document.querySelectorAll("input[name=f_listar_desativa]")]; if(r[0])r[0].checked=true; if(r[1])r[1].checked=false;
});
await Promise.all([page.waitForNavigation({waitUntil:"domcontentloaded",timeout:90000}).catch(()=>null),page.evaluate(()=>document.getElementById("Form1").submit())]);
await page.waitForTimeout(8000);
const info=await page.evaluate(()=>{const b=document.body.innerText; const m=b.match(/de\s*(\d+)\s*p[aá]gina/i); const sel=document.getElementById("slt_pg"); return {pgTxt:m?m[1]:null, sltPgN: sel?sel.options.length:null};});
log("paginas (ativos): "+JSON.stringify(info));
await ctx.close();
