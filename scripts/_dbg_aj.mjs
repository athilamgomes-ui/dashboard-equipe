import { chromium } from "playwright";
import { homedir } from "node:os"; import path from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const P=path.join(homedir(),".claude","microvix-profile");
const log=m=>process.stderr.write("[dbg] "+m+"\n");
const ctx=await chromium.launchPersistentContext(P,{headless:true,viewport:{width:1400,height:900}});
const page=ctx.pages()[0]||await ctx.newPage(); page.on("dialog",d=>d.accept().catch(()=>{}));
await garantirSessao(page,{log,tokenOpcional:true});
const U="https://linx.microvix.com.br/gestor_web/produtos/ajuste_qtde.asp?produto=";
for (const cod of ["156","171"]) {
  await page.goto(U+cod,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForTimeout(2500);
  log("frames: "+page.frames().map(f=>f.url().slice(-60)).join(" | "));
  for (const f of page.frames()) {
    const campos = await f.evaluate(()=>[...document.querySelectorAll("input,select")].map(e=>e.name+"="+String(e.value||"").slice(0,14)).filter(x=>/novo_saldo|hdn_|motivo|deposito|velho/i.test(x))).catch(()=>[]);
    if (campos.length) log("   frame "+f.url().slice(-45)+" → "+JSON.stringify(campos));
  }
  const r=await page.evaluate(()=>({
    url:location.href,
    campos:[...document.querySelectorAll("input,select")].map(e=>e.name+"="+(e.value||"").slice(0,20)).filter(e=>/novo_saldo|hdn_|velho|saldo|motivo|deposito/i.test(e.name||"")),
    txt:(document.body.innerText||"").replace(/\s+/g," ").slice(0,300)
  }));
  log(cod+" → "+r.url);
  log("   campos: "+JSON.stringify(r.campos));
  log("   txt: "+r.txt);
}
await ctx.close();
