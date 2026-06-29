import { chromium } from "playwright";
import { homedir } from "node:os"; import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const log=m=>process.stderr.write(`[c] ${m}\n`);
const ctx=await chromium.launchPersistentContext(join(homedir(),".claude","microvix-profile"),{headless:true,viewport:{width:1600,height:1000}});
const page=ctx.pages()[0]||await ctx.newPage();
await garantirSessao(page,{log});
async function teste(emp,cfgs,label){
  await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_manut.asp",{waitUntil:"domcontentloaded",timeout:45000});
  await page.waitForTimeout(1000);
  await page.evaluate(({emp,cfgs})=>{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.checked=v;};
    ["chConfig_tributaria","chClassIpi","chClassCest"].forEach(id=>set(id,true));
    [1,3,4,9,10,11].forEach(i=>set("empresas_"+i,false)); set("empresas_"+emp,true);
    // marca filtro config: seleciona no select multiplo + nos checkboxes do multiselect widget
    const s=document.getElementById("select_filtro_config_tributaria");
    if(s)[...s.options].forEach(o=>o.selected=cfgs.includes(o.value));
    document.querySelectorAll("input[name=multiselect_select_filtro_config_tributaria]").forEach(c=>{c.checked=cfgs.includes(c.value);});
  },{emp,cfgs});
  await page.waitForTimeout(300);
  await Promise.all([page.waitForNavigation({waitUntil:"domcontentloaded",timeout:90000}).catch(()=>null),page.evaluate(()=>document.getElementById("Form1").submit())]);
  await page.waitForTimeout(7000);
  const info=await page.evaluate(()=>{const b=document.body.innerText;const m=b.match(/de\s*(\d+)\s*p[aá]gina/i);const nsel=document.querySelectorAll("select[name^=config_tributaria_]").length;return {pg:m?m[1]:null,prodNaPagina:nsel};});
  log(`${label} emp${emp} cfg=${cfgs}: paginas=${info.pg} prod/pagina=${info.prodNaPagina}`);
}
await teste(1,["1","10"],"TI");
await teste(1,["2","11"],"ST");
await ctx.close();
