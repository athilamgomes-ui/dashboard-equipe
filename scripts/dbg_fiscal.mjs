import { chromium } from "playwright";
import { homedir } from "node:os"; import { join } from "node:path"; import { writeFileSync } from "node:fs";
import { garantirSessao } from "/Users/elkgomes/Desktop/claude/dashboard-equipe/scripts/microvix_auth.mjs";
const log=m=>process.stderr.write(`[dbg] ${m}\n`);
const ctx=await chromium.launchPersistentContext(join(homedir(),".claude","microvix-profile"),{headless:true,viewport:{width:1600,height:1000}});
const page=ctx.pages()[0]||await ctx.newPage();
await garantirSessao(page,{log});
await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp",{waitUntil:"domcontentloaded",timeout:45000});
await page.waitForTimeout(1000);
await page.evaluate(()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.checked=v;};
 ["chClassIpi","chClassCest","chConfig_tributaria","ch_id_origem_mercadoria"].forEach(id=>set(id,true));
 [1,3,4,9,10,11].forEach(i=>set("empresas_"+i,false)); set("empresas_1",true);
 const ms=document.getElementById("marcas"); if(ms)[...ms.options].forEach(o=>o.selected=(o.value===""));});
await Promise.all([page.waitForNavigation({waitUntil:"domcontentloaded",timeout:90000}).catch(()=>null),
 page.evaluate(()=>document.getElementById("Form1").submit())]);
let last=-1,stable=0,t0=Date.now();
while(Date.now()-t0<240000){await page.waitForTimeout(2500);const n=await page.evaluate(()=>document.querySelectorAll("table tr").length).catch(()=>0);log(`rows=${n}`);if(n>10){if(n===last){if(++stable>=5)break;}else stable=0;last=n;}}
const info=await page.evaluate(()=>{
 const body=document.body.innerText;
 const pag=/p[áa]gina|pagina[cç][aã]o|pr[óo]xim|registros|total/i.test(body);
 const tot=(body.match(/(\d[\d.]{2,})\s*(produtos|registros|itens)/i)||[])[0];
 const cfgCount=(document.body.innerHTML.match(/TI-PA|SUBSTITU|TRIBUTAD/gi)||[]).length;
 return {len:body.length, pag, tot, cfgCount, tail: body.slice(-500)};
});
log("info: "+JSON.stringify(info,null,1));
writeFileSync("/tmp/list_full.html", await page.content());
await ctx.close();
