import { chromium } from "playwright";
import { homedir } from "node:os"; import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const P=join(homedir(),".claude","microvix-profile");
const URL="https://linx.microvix.com.br/gestor_web/faturamento/relatorio_prod_vendidos.asp?ajusteMenu=S";
const log=m=>process.stderr.write(`[hdr] ${m}\n`);
const ctx=await chromium.launchPersistentContext(P,{headless:true,viewport:{width:1500,height:950}});
const page=ctx.pages()[0]||await ctx.newPage();
try{
  await garantirSessao(page,{log,tokenOpcional:true});
  await page.goto(URL,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForSelector("#f_data1",{timeout:15000}); await page.waitForTimeout(1200);
  // inspeciona defaults do multiselect vendedores/setores/series ANTES de gerar
  const defaults=await page.evaluate(()=>{
    const sel=n=>{const s=document.querySelector(`select[name="${n}"]`);if(!s)return null;return{selected:[...s.selectedOptions].map(o=>o.value),count:s.options.length,multiple:s.multiple};};
    return {vendedores:sel('vendedores'),setores:sel('setores'),series:sel('series'),cfops:sel('cfops'),
      chk:{lista_produtos:!!document.querySelector('input[name=lista_produtos]')?.checked,
           lista_servicos:!!document.querySelector('input[name=lista_servicos]')?.checked,
           lista_devolucoes:!!document.querySelector('input[name=lista_devolucoes]')?.checked,
           oper_n:!!document.querySelector('input[name=oper_n]')?.checked}};
  });
  log("DEFAULTS: "+JSON.stringify(defaults));
  await page.evaluate(()=>{
    const setR=(n,v)=>{const r=[...document.querySelectorAll(`input[name="${n}"]`)].find(x=>x.value===v);if(r){r.checked=true;r.dispatchEvent(new Event("click"));}};
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
    const grupos=[...document.querySelectorAll("table tr")].filter(r=>r.querySelectorAll("td").length===1).map(r=>r.textContent.trim()).filter(t=>/Vendedor|Marca|Setor/i.test(t));
    return {header:(document.body.innerText||"").slice(0,600), grupos};
  });
  log("HEADER:\n"+info.header);
  log("GRUPOS: "+JSON.stringify(info.grupos));
  await ctx.close().catch(()=>{}); process.exit(0);
}catch(e){log("FALHA "+e.message);await ctx.close().catch(()=>{});process.exit(1);}
