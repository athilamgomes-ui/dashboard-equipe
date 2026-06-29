import { chromium } from "playwright";
import { homedir } from "node:os"; import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const log=m=>process.stderr.write(`[p] ${m}\n`);
const ctx=await chromium.launchPersistentContext(PROFILE_DIR,{headless:true});
const page=ctx.pages()[0]||await ctx.newPage();
await garantirSessao(page,{log});
await page.goto("https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html",{waitUntil:"domcontentloaded",timeout:45000});
await page.waitForTimeout(3000);
const out=await page.evaluate(async()=>{
  const token=localStorage.getItem("token_api");
  const sup=(localStorage.getItem("url_suprimentos_api")||"").replace(/\/$/,"");
  const H={Authorization:token,"Content-Type":"application/json"};
  const res={tentativas:[]};
  const cat=(window.SuprimentosApiRoutes||{}).CatalogoProdutos||{};
  res.rotas=cat;
  // PesquisaRapida variações
  for(const b of [
    {Descricao:"ACIDIFICANTE",Pagina:1,QuantidadeRegistros:2},
    {CodigoBarras:"7898746934481"},
    {Pesquisa:{Descricao:"ACIDIFICANTE"},Pagina:1},
    {Filtro:"ACIDIFICANTE",Pagina:1,RegistrosPorPagina:2},
    {TextoPesquisa:"ACIDIFICANTE",Pagina:1,QuantidadeRegistros:2},
    {valorPesquisa:"P02415"},
  ]){
    try{const r=await fetch(cat.PesquisaRapida,{method:"POST",headers:H,body:JSON.stringify(b)});const t=await r.text();res.tentativas.push({rota:"PesquisaRapida",body:b,status:r.status,resp:t.slice(0,400)});}catch(e){res.tentativas.push({body:b,erro:String(e).slice(0,80)});}
  }
  // ObterDetalhesProduto variações
  for(const b of [{Codigo:"P02415"},{CodigoProduto:"P02415"},{IdProduto:0,Codigo:"P02415"},{codigo:"P02415"}]){
    try{const r=await fetch(cat.ObterDetalhesProduto,{method:"POST",headers:H,body:JSON.stringify(b)});const t=await r.text();res.tentativas.push({rota:"ObterDetalhesProduto",body:b,status:r.status,resp:t.slice(0,500)});}catch(e){res.tentativas.push({body:b,erro:String(e).slice(0,80)});}
  }
  return res;
});
console.log(JSON.stringify(out,null,2));
await ctx.close();
