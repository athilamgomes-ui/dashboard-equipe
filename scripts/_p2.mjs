import { chromium } from "playwright";
import { homedir } from "node:os"; import path from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const P=path.join(homedir(),".claude","microvix-profile");
const log=m=>process.stderr.write("[p2] "+m+"\n");
const ctx=await chromium.launchPersistentContext(P,{headless:true,viewport:{width:1400,height:900}});
const page=ctx.pages()[0]||await ctx.newPage(); page.on("dialog",d=>d.accept().catch(()=>{}));
await garantirSessao(page,{log,tokenOpcional:true});
await page.goto("https://linx.microvix.com.br/v4/home/index.asp",{waitUntil:"domcontentloaded",timeout:30000});
await page.waitForTimeout(2500);
const r=await page.evaluate(()=>{
  const out=[];
  for(const a of document.querySelectorAll("a[data-endereco]")){
    const t=(a.textContent||"").trim();
    if(/produto|unidade|convers/i.test(t)) out.push(t+" :: "+a.getAttribute("data-endereco"));
  }
  return [...new Set(out)];
});
log("telas de produto:\n   "+r.join("\n   "));
// captura as APIs da tela nova de produtos
const vistos=new Set();
page.on("request",q=>{ const u=q.url(); if(/webapi|\/api\//i.test(u)) vistos.add(u.split("?")[0]); });
const alvo=r.find(x=>/Produtos\s+\(Novo\)/i.test(x));
if(alvo){
  const end=alvo.split(":: ")[1];
  const u="https://linx.microvix.com.br/gestor_web/"+end;
  log("abrindo "+u);
  await page.goto(u,{waitUntil:"domcontentloaded",timeout:40000}).catch(e=>log("goto: "+e.message.slice(0,60)));
  await page.waitForTimeout(9000);
  log("url final: "+page.url().slice(0,120));
  log("APIs:\n   "+[...vistos].slice(0,15).join("\n   "));
}
await ctx.close();
