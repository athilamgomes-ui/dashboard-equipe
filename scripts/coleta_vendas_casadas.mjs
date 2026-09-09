#!/usr/bin/env node
/**
 * coleta_vendas_casadas.mjs
 *
 * Coleta, por VENDA (cupom), o vendedor + produtos das 4 lojas, classifica cada cupom
 * como "venda casada" (2+ subfunções complementares da MESMA família) e agrega por
 * dia/loja/vendedora. Grava em casadas.json (fora do loja.html, que o build da premiação
 * regravaria). O app lê esse JSON.
 *
 * Fonte: movimento diário (relatorio_diario.asp) + detalhe (imprime_doc.asp) — mesma
 * lógica do coleta_conferencia_caixa.mjs (único lugar com vendedor+produtos por venda).
 *
 * USO: node coleta_vendas_casadas.mjs [di dd/mm/aaaa] [df dd/mm/aaaa]
 *   sem args = hoje. Ex.: node coleta_vendas_casadas.mjs 08/09/2026 08/09/2026
 * ENV: LOJAS=1,4 restringe as empresas (default 1,3,4,10 = L1,L3,L4,L5)
 *
 * Exit: 0 ok · 1 falha · 2 credenciais · 30 (o wrapper .sh trata o lock)
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const OUT = join(REPO, "casadas.json");
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const B = "https://linx.microvix.com.br/gestor_web/";
const URL_MOVDIARIO = B + "faturamento/relatorio_diario.asp";
const RETENCAO_DIAS = 45;

const LOJA_POR_EMP = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const EMPS = (process.env.LOJAS ? process.env.LOJAS.split(",").map(Number) : [1, 3, 4, 10]);
const WAIT = +(process.env.WAIT_MS || 1200), INTERDOC = +(process.env.INTERDOC_MS || 200), RETRIES = +(process.env.RETRIES || 3);

const hoje = new Date();
const brData = d => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
const DI = process.argv[2] || brData(hoje);
const DF = process.argv[3] || DI;
const log = m => process.stderr.write(`[casadas] ${m}\n`);
function num(s){ if(s==null)return null; const t=String(s).trim(); if(!t||t==="-")return null; const v=parseFloat(t.replace(/\./g,"").replace(",",".")); return Number.isFinite(v)?v:null; }

// ── Classificador de família/subfunção (produtos de revenda de beleza) ───────
const norm = s => (s||"").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function classifica(desc){
  const d = norm(desc);
  if (/\bOX\b|OXIDANTE|REVELAD|AGUA OXIGENADA|\d+\s*VOL\b|\bVOL\b/.test(d)) return {f:"COLORACAO",s:"OX"};
  if (/DESCOLORANTE|\bPO\s+DESCOL|POWDER|\bPO DESC/.test(d)) return {f:"COLORACAO",s:"PO"};
  if (/MATIZ|PIGMENTANTE|TONALIZANTE/.test(d)) return {f:"COLORACAO",s:"MATIZ"};
  if (/COL CR|COLORACAO|\bTINTA\b|IGORA|MAJIREL|NUANCE|BIONDISS|\b\d[.\/]\d+\b|LOURO|LOIRO|CASTANHO|RUIVO|ACOBREAD/.test(d)) return {f:"COLORACAO",s:"TINTA"};
  if (/SHAMPOO|\bSH\b|SHAMP/.test(d)) return {f:"LAVAGEM",s:"SHAMPOO"};
  if (/CONDICIONADOR|\bCOND\b/.test(d)) return {f:"LAVAGEM",s:"COND"};
  if (/MASCARA|MASC\b|MASC\./.test(d)) return {f:"LAVAGEM",s:"MASCARA"};
  if (/LEAVE-?IN|LEAVEIN/.test(d)) return {f:"LAVAGEM",s:"LEAVEIN"};
  if (/AMPOLA|POWER DOSE|DOSE UNICA/.test(d)) return {f:"LAVAGEM",s:"AMPOLA"};
  if (/RECONSTRUT|TRATAMENTO|HOME CARE|KIT SH/.test(d)) return {f:"LAVAGEM",s:"TRAT"};
  if (/\bOLEO\b|OIL\b|ARGAN/.test(d)) return {f:"LAVAGEM",s:"OLEO"};
  if (/CHAPINHA|PRANCHA|SECADOR|BABYLI|\bESCOVA\b|MODELADOR/.test(d)) return {f:"STYLING",s:"FERRAMENTA"};
  if (/PROTETOR TERMICO|TERMOPROT|PROTECAO TERMICA/.test(d)) return {f:"STYLING",s:"PROTETOR"};
  if (/CREME P\/? ?PENTEAR|CREME PARA PENTEAR|CURLY|CACHO|GELATINA|ATIVADORA|FLUIDO|DEFRIZ|POMADA|\bCERA\b(?!.*DEP)|FIXADOR|SPRAY|FINALIZAD|MAGICA DO LISO/.test(d)) return {f:"STYLING",s:"FINALIZADOR"};
  if (/ESMALTE/.test(d)) return {f:"UNHA",s:"ESMALTE"};
  if (/ACETONA|REMOVEDOR.*ESMALTE|REMOVEDOR DE ESMALTE/.test(d)) return {f:"UNHA",s:"REMOVEDOR"};
  if (/CUTICULA|AMACIANTE CUTIC/.test(d)) return {f:"UNHA",s:"CUTICULA"};
  if (/BASE (RECUPERAD|FORTALEC|COMERCIAL|P\/? ?UNHA)|EXTRA BRILHO|TOP COAT|COBERTURA/.test(d)) return {f:"UNHA",s:"BASE_TOP"};
  if (/ALICATE|CORTADOR UNHA|LIXA|PALITO/.test(d)) return {f:"UNHA",s:"INSTRUMENTO"};
  if (/CERA DEP|CERA DEPIL|CERA .*(MACA|MEL|CHOCOLATE|QUENTE)|DEPILAT/.test(d)) return {f:"DEPILACAO",s:"CERA"};
  if (/PAPEL DEPIL|ROLETE|ESPATULA|BASTAO/.test(d)) return {f:"DEPILACAO",s:"ACESSORIO"};
  return {f:null,s:null};
}
function ehCasada(itens){
  const porFam = {};
  for (const it of (itens||[])) { const c = classifica(it.desc); if (!c.f) continue; (porFam[c.f]=porFam[c.f]||new Set()).add(c.s); }
  return Object.values(porFam).some(subs => subs.size >= 2);
}

async function coletarMovimento(page, empId, di, df){
  await page.goto(URL_MOVDIARIO, { waitUntil:"domcontentloaded", timeout:45000 });
  await page.waitForSelector("#empresas_"+empId, { timeout:25000 });
  await page.waitForTimeout(700);
  await page.evaluate(({di,df,empId})=>{
    const s=(id,v)=>{const e=document.getElementById(id);if(e){e.disabled=false;e.value=v;e.dispatchEvent(new Event("change",{bubbles:true}));}};
    s("f_datainicial",di); s("f_datafinal",df);
    document.querySelectorAll('input[id^="empresas_"]').forEach(cb=>{cb.checked=false;});
    const e=document.getElementById("empresas_"+empId); if(e)e.checked=true;
    const an=[...document.getElementsByName("f_sintetico")].find(r=>r.value==="A"); if(an)an.checked=true;
    const val=[...document.getElementsByName("ListarNotas")].find(r=>r.value==="V"); if(val)val.checked=true;
  },{di,df,empId});
  await Promise.all([ page.waitForNavigation({waitUntil:"domcontentloaded",timeout:240000}).catch(()=>{}), page.click('input[name="B1"]').catch(()=>{}) ]);
  await page.waitForTimeout(3500);
  return page.evaluate(()=>{
    const n=s=>{const t=String(s||"").replace(/\s/g,"").trim();if(!t||t==="-")return 0;const v=parseFloat(t.replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,""));return Number.isFinite(v)?v:0;};
    let alvo=null,cols=null;
    for(const t of document.querySelectorAll("table")){for(const tr of t.querySelectorAll("tr")){const cel=[...tr.children].map(c=>(c.textContent||"").replace(/\s+/g," ").trim());if(cel.some(c=>/Valor do Documento/i.test(c))&&cel.some(c=>/^Cart/i.test(c))){alvo=t;cols=cel;break;}}if(alvo)break;}
    if(!alvo)return{erro:"tabela não encontrada"};
    const i=re=>cols.findIndex(c=>new RegExp(re,"i").test(c));
    const iDoc=i("Doc");
    const out=[];
    for(const tr of alvo.querySelectorAll("tr")){
      const cel=[...tr.children].map(c=>(c.textContent||"").replace(/\s+/g," ").trim());
      const m=/^(\d{2})\/(\d{2})\/(\d{2,4})/.exec(cel[0]||""); if(!m)continue;
      const ano=m[3].length===2?"20"+m[3]:m[3];
      const a=tr.querySelector("td.coluna-doc-emp a, a[onclick*=imprime_doc]"); const oc=a?(a.getAttribute("onclick")||""):"";
      const gid=(/identificador=(\{[^}]+\})/.exec(oc)||[])[1]||null;
      const ser=(/[?&]serie=([^&"']+)/.exec(oc)||[])[1]||null;
      out.push({ d:`${ano}-${m[2]}-${m[1]}`, doc:(cel[iDoc]||"").replace(/\s*\|\s*/,"|"), gid, ser });
    }
    return {docs:out};
  });
}
async function detalhar(page, empId, mov, wait){
  if(!mov.gid)return null;
  const doc=String(mov.doc).split("|")[0];
  const u=B+"faturamento/imprime_doc.asp?listarNotas=V&identificador="+encodeURIComponent(mov.gid)+"&documento="+doc+"&serie="+(mov.ser||"")+"&empresa_doc="+empId+"&operacao=S&ecf=0&cod_cliente=1&reinicio=0&chk_deposito_rel_mov_diario=";
  await page.goto(u,{waitUntil:"domcontentloaded",timeout:45000});
  await page.waitForTimeout(wait);
  const txt=await page.evaluate(()=>document.body.innerText||"");
  if(!/Detalhamento da Nota|Dados Complementares/i.test(txt))return null;
  const mv=/Vend\.\/Comprador:\s*(\d+)\s*-\s*(.+)/i.exec(txt);
  const vendedor=mv?mv[2].trim():null;
  const itens=[]; const linhas=txt.split("\n");
  for(let i=0;i<linhas.length;i++){const cod=linhas[i].trim();if(!/^\d{3,}$/.test(cod))continue;
    for(let j=i+1;j<=i+3&&j<linhas.length;j++){if(!/^\t/.test(linhas[j]))continue;const f=linhas[j].split("\t");if(f.length<9)continue;itens.push({desc:(f[1]||"").replace(/\s*\(Total aproximado[\s\S]*$/i,"").trim()});break;}}
  return {vendedor,itens};
}

(async ()=>{
  const ctx=await chromium.launchPersistentContext(PROFILE_DIR,{headless:true});
  const page=ctx.pages()[0]||(await ctx.newPage());
  // dias -> loja -> vendedora -> {casadas,total}
  const agg={};
  try{
    await garantirSessao(page,{log,tokenOpcional:true});
    for(const empId of EMPS){
      const loja=LOJA_POR_EMP[empId];
      const mv=await coletarMovimento(page,empId,DI,DF);
      if(mv.erro){ log(`ERRO mov ${loja}: ${mv.erro}`); continue; }
      const docs=(mv.docs||[]).filter(d=>d.gid);
      log(`${loja}: ${docs.length} cupons`);
      const feitos=new Set();
      const processa=det=>{ if(!det||!det.vendedor)return; const dia=det._dia; const nome=det.vendedor;
        if(/PADRAO|^\(sem/i.test(nome))return;
        const A=((agg[dia]=agg[dia]||{})[loja]=agg[dia][loja]||{}); const v=(A[nome]=A[nome]||{casadas:0,total:0});
        v.total++; if(ehCasada(det.itens))v.casadas++; };
      // passe 1
      let i=0,ok=0;
      for(const d of docs){ i++; let det=null; for(let t=0;t<2&&!det;t++){try{det=await detalhar(page,empId,d,WAIT);}catch{await page.waitForTimeout(300);}}
        if(det){ok++;det._dia=d.d;feitos.add(d.doc);processa(det);} if(INTERDOC)await page.waitForTimeout(INTERDOC);
        if(i%40===0)log(`${loja} ${i}/${docs.length} (ok ${ok})`); }
      // repescagem dos que faltaram (espera maior)
      const faltam=docs.filter(d=>!feitos.has(d.doc));
      if(faltam.length){ log(`${loja} repescando ${faltam.length}...`); let r=0;
        for(const d of faltam){ let det=null; for(let t=0;t<RETRIES&&!det;t++){try{det=await detalhar(page,empId,d,WAIT+600);}catch{await page.waitForTimeout(400);}}
          if(det){r++;det._dia=d.d;processa(det);} await page.waitForTimeout(INTERDOC+150); }
        log(`${loja} repescagem +${r}/${faltam.length}`); }
      log(`${loja} OK`);
    }
    // merge no casadas.json existente
    let base={atualizado_em:null,def:"subfuncoes-complementares-mesma-familia",dias:{}};
    try{ base=JSON.parse(fs.readFileSync(OUT,"utf8")); base.dias=base.dias||{}; }catch{}
    for(const dia of Object.keys(agg)) base.dias[dia]=agg[dia]; // datas recoletadas sobrescrevem
    // poda datas antigas
    const corte=new Date(Date.now()-RETENCAO_DIAS*864e5).toISOString().slice(0,10);
    for(const dia of Object.keys(base.dias)) if(dia<corte)delete base.dias[dia];
    base.atualizado_em=new Date().toISOString();
    fs.writeFileSync(OUT,JSON.stringify(base,null,1));
    log(`gravado ${OUT} — dias: ${Object.keys(base.dias).sort().join(", ")}`);
    log("FIM_OK");
  }catch(e){ log("ERRO_FATAL: "+(e&&e.message||e)); process.exitCode=1; }
  finally{ await ctx.close().catch(()=>{}); }
})();
