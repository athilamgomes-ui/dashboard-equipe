#!/usr/bin/env node
/**
 * precos_tabela.mjs — o preço que a loja REALMENTE pratica, da tabela de preço certa.
 *
 * ⚠️ POR QUE ISTO EXISTE (27/08/2026, corrigido pelo Athila): a coluna "Preço de Tabela" do
 * relatório de saldo — que o snapshot do pipeline coleta — é a TABELA PADRÃO. Altamira (L1 e L4)
 * NÃO vende por ela: vende pela "Tabela Altamira". Itaituba (L3) tem a sua. Só Santarém (L5)
 * usa o cadastro. Exemplo medido no produto 12408:
 *      tabela padrão   R$ 67,89        tabela Altamira  R$ 87,90
 *      última venda real de 25/06/25: R$ 87,90  → quem manda é a tabela da loja.
 * Usar o preço errado infla qualquer teste de "custo maior que o preço".
 *
 * Uso: node precos_tabela.mjs L1 [idTabela]     (L1/L4 → 4 = Altamira)
 * Saída: dados_estoque/precos_<loja>_t<id>.json  { cod: preco }
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";
const DIR=path.dirname(fileURLToPath(import.meta.url));
const OUT=path.join(DIR,"..","dados_estoque");
const U="https://linx.microvix.com.br/gestor_web/produtos/relatorio_lista_precos.asp";
const LOJAS={L1:1,L3:3,L4:4,L5:10};
const loja=(process.argv[2]||"L1").toUpperCase(); const E=LOJAS[loja];
const TAB=process.argv[3]||"4";
if(!E){console.error("loja inválida");process.exit(1);}
const log=m=>console.log(`[precos] ${m}`);
const ctx=await chromium.launchPersistentContext(process.env.MICROVIX_PROFILE||path.join(homedir(),".claude","microvix-cadastro"),{headless:true,viewport:{width:1440,height:900}});
const page=ctx.pages()[0]||await ctx.newPage();
page.on("dialog",d=>d.accept().catch(()=>{}));
await garantirSessao(page,{tokenOpcional:true});
await page.goto(U,{waitUntil:"domcontentloaded",timeout:60000});
await page.waitForSelector("#empresas_1",{timeout:30000}); await page.waitForTimeout(1500);
if(!await page.evaluate(()=>!!document.getElementById("ajuste_precos")?.checked)){
  await page.click("#ajuste_precos").catch(()=>{}); await page.waitForTimeout(900); }
const sel=await page.evaluate(({E,TAB})=>{
  [1,3,4,9,10,11].forEach(i=>{const e=document.getElementById("empresas_"+i); if(e)e.checked=(i===E);});
  document.querySelectorAll("input[name=visao]").forEach(r=>r.checked=(r.value==="A"));
  const a=document.getElementById("ativa"); if(a)a.checked=true;
  const d=document.getElementById("desativa"); if(d)d.checked=true;
  const pv=document.getElementById("preco_venda"); if(pv)pv.checked=true;
  const bar=document.getElementById("barras"); if(bar)bar.checked=true;
  const tp=document.getElementById("tabela_preco");
  if(tp){ if(![...tp.options].some(o=>o.value===TAB)){const o=document.createElement("option");o.value=TAB;o.text="t"+TAB;tp.add(o);} tp.value=TAB; }
  return { tabela: tp?tp.selectedOptions[0]?.text:null };
},{E,TAB});
log(`${loja} (emp ${E}) · tabela selecionada: ${sel.tabela}`);
await page.waitForTimeout(900);
await page.evaluate(()=>{const b=document.getElementById("btnGerarRelatorio"); if(b)b.click();});
let last=-1,st=0,t0=Date.now();
while(Date.now()-t0<900000){ await page.waitForTimeout(2000);
  const n=await page.evaluate(()=>document.querySelectorAll("table tr").length).catch(()=>0);
  if(n!==last){last=n;st=0;} else if(++st>=5) break; }
const r=await page.evaluate(()=>{
  const num=v=>{v=String(v||"").trim().replace(/\./g,"").replace(",","."); const n=parseFloat(v); return isNaN(n)?null:n;};
  const out={};
  for(const v of document.querySelectorAll('input[name^="valor_"]')){
    const tr=v.closest("tr"); if(!tr) continue;
    const cod=(tr.querySelector('input[name^="codigo_"]')||{}).value||"";
    const p=num(v.value); if(cod && p!=null) out[cod]=p;
  }
  return out;});
const n=Object.keys(r).length;
if(n<100){ console.error(`FALHA: só ${n} produtos — relatório vazio/truncado, não vou gravar.`); await ctx.close(); process.exit(10); }
fs.mkdirSync(OUT,{recursive:true});
const dest=path.join(OUT,`precos_${loja}_t${TAB}.json`);
fs.writeFileSync(dest,JSON.stringify({loja,emp:E,tabela:TAB,nome:sel.tabela,geradoEm:new Date().toISOString(),precos:r}));
log(`${n} preços → ${dest}`);
await ctx.close();
