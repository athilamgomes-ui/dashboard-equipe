import { chromium } from "playwright";
import { homedir } from "node:os"; import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const P=join(homedir(),".claude","microvix-profile");
const URL="https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";
const log=m=>process.stderr.write(`[visao] ${m}\n`);
const ctx=await chromium.launchPersistentContext(P,{headless:true,viewport:{width:1500,height:950}});
const page=ctx.pages()[0]||await ctx.newPage();
try{
  await garantirSessao(page,{log,tokenOpcional:true});
  await page.goto(URL,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForSelector("#f_data1",{timeout:15000}); await page.waitForTimeout(1200);
  // estado da visão e do widget de marca
  const est=await page.evaluate(()=>{
    const v=document.getElementById("Form1_id_visao");
    const marcaChks=[...document.querySelectorAll('input[type=checkbox]')].filter(c=>/marca/i.test(c.name||c.id||'')).slice(0,5).map(c=>({n:c.name,id:c.id,v:c.value,ck:c.checked}));
    const marcaSel=document.querySelector('select[name="marcas"]');
    return {visaoValue:v?v.value:null, visaoOpts:v?[...v.options].map(o=>({v:o.value,s:o.selected,t:o.textContent.trim()})):null,
      marcaSelSelected:marcaSel?[...marcaSel.selectedOptions].map(o=>o.value):null, marcaChkSample:marcaChks};
  });
  log("ESTADO INICIAL: "+JSON.stringify(est));
  // TENTATIVA: zerar id_visao (value=""), setar datas/empresa/analitico, gerar
  await page.evaluate(()=>{
    const v=document.getElementById("Form1_id_visao");
    if(v){ // adiciona opção vazia e seleciona
      const has=[...v.options].some(o=>o.value==="");
      if(!has){const o=document.createElement("option");o.value="";o.text="(nenhuma)";v.insertBefore(o,v.firstChild);}
      v.value=""; v.dispatchEvent(new Event("change"));
    }
    const setR=(n,val)=>{const r=[...document.querySelectorAll(`input[name="${n}"]`)].find(x=>x.value===val);if(r){r.checked=true;r.dispatchEvent(new Event("click"));}};
    [...document.querySelectorAll('input[id^="empresas_"]')].forEach(cb=>cb.checked=false);
    document.getElementById("empresas_3").checked=true;
    document.getElementById("f_data1").value="01/07/2026"; document.getElementById("f_data2").value="31/07/2026";
    setR("f_sintetico","N"); setR("f_agrupamento","nenhum");
    const tc=document.querySelector('select[name="tipo_custo"]'); if(tc) tc.value="medio_epoca";
  });
  await Promise.all([page.waitForLoadState("networkidle",{timeout:20000}).catch(()=>{}),page.evaluate(()=>document.querySelector('input[name="Form1_SubmitVisao"]')?.click())]);
  await page.waitForTimeout(2000);
  await page.evaluate(()=>{document.querySelectorAll('input[id="empresas_1"]').forEach(cb=>cb.checked=false);document.querySelectorAll('input[id="empresas_3"]').forEach(cb=>cb.checked=true);});
  await Promise.all([page.waitForNavigation({waitUntil:"domcontentloaded",timeout:60000}).catch(()=>{}),page.evaluate(()=>{const b=[...document.querySelectorAll("button,input")].find(el=>(el.textContent||"").trim()==="OK"||el.value==="OK");if(b)b.click();})]);
  await page.waitForTimeout(4000);
  const info=await page.evaluate(()=>{
    const h=(document.body.innerText||"");
    const marca=(h.match(/Marca:[^\n]*/)||[''])[0];
    const totRow=[...document.querySelectorAll("table tr")].find(r=>[...r.querySelectorAll("td")].some(c=>c.textContent.trim()==="Totais"));
    const tot=totRow?[...totRow.querySelectorAll("td")].map(c=>c.textContent.trim()):null;
    return {marca, tot};
  });
  log("APÓS zerar visão → "+JSON.stringify(info));
  await ctx.close().catch(()=>{}); process.exit(0);
}catch(e){log("FALHA "+e.message);await ctx.close().catch(()=>{});process.exit(1);}
