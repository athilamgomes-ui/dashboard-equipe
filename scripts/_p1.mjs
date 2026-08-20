import { chromium } from "playwright";
import { homedir } from "node:os"; import path from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const P=path.join(homedir(),".claude","microvix-profile");
const log=m=>process.stderr.write("[p1] "+m+"\n");
const ctx=await chromium.launchPersistentContext(P,{headless:true,viewport:{width:1400,height:900}});
const page=ctx.pages()[0]||await ctx.newPage(); page.on("dialog",d=>d.accept().catch(()=>{}));
await garantirSessao(page,{log,tokenOpcional:true});
await page.goto("https://linx.microvix.com.br/gestor_web/produtos/relatorio_produtos.asp",{waitUntil:"domcontentloaded",timeout:45000});
await page.waitForTimeout(1500);
const r=await page.evaluate(()=>{
  const out=[];
  for(const c of document.querySelectorAll("input[type=checkbox]")){
    let lbl="";
    const id=c.id; if(id){ const l=document.querySelector(`label[for="${id}"]`); if(l) lbl=(l.textContent||"").trim(); }
    if(!lbl){ const p=c.parentElement; lbl=(p?p.textContent:"").trim().slice(0,40); }
    out.push((c.name||c.id)+" = "+lbl);
  }
  return out;
});
log("opções do relatório:\n   "+r.join("\n   "));
await ctx.close();
