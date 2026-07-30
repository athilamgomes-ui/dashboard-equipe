let D = null;   // preenchido só após a senha correta

document.getElementById("selo-data").textContent = PUBLICO.geradoEmBR;
document.getElementById("selo-janela").textContent =
  PUBLICO.janela && PUBLICO.janela.ini
    ? PUBLICO.janela.ini.slice(8,10)+"/"+PUBLICO.janela.ini.slice(5,7)+" a "+PUBLICO.janela.fim.slice(8,10)+"/"+PUBLICO.janela.fim.slice(5,7)
    : "—";

function b64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
async function decifrar(pass){
  const salt=b64(PAYLOAD.salt),iv=b64(PAYLOAD.iv),data=b64(PAYLOAD.data);
  const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:PAYLOAD.iters,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,data));
}
async function abrir(pass){
  D = JSON.parse(await decifrar(pass));
  document.getElementById('lock').style.display='none';
  document.getElementById('app').style.display='block';
  iniciar();
  try{ sessionStorage.setItem('caixa_ok', pass); }catch(e){}
}
async function tentarSenha(e){
  e.preventDefault();
  const err=document.getElementById('lockerr'); err.textContent='…';
  try{ await abrir(document.getElementById('senha').value); err.textContent=''; }
  catch(_){ err.textContent='Senha incorreta.'; }
  return false;
}
// reabre sem pedir senha de novo na mesma aba
(async()=>{ try{ const s=sessionStorage.getItem('caixa_ok'); if(s) await abrir(s); }catch(e){} })();

// ── util ──
const nf = n => (n<0?"-":"") + "R$ " + Math.abs(Math.round(n||0)).toLocaleString("pt-BR");
const nf2 = n => (n<0?"-":"") + "R$ " + Math.abs(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const dBR = s => { const [y,m,d]=s.split("-"); return d+"/"+m; };
const diaSem = s => { const [y,m,d]=s.split("-").map(Number); return ["dom","seg","ter","qua","qui","sex","sáb"][new Date(y,m-1,d).getDay()]; };
const corLoja = k => (D.lojas.find(l=>l.key===k)||{}).cor || "#64748b";
const nomeLoja = k => { const l=D.lojas.find(x=>x.key===k); return l ? l.nome+" "+l.cidade : k; };
const cls = v => Math.abs(v)<0.01 ? "zero" : (v<0 ? "falta" : "sobra");
const PILL = {
  ok:['p-ok','bateu'], divergente:['p-div','diferença'],
  nao_fechado:['p-nf','não fechado'], sem_movimento:['p-sm','sem movimento'],
  nao_conferido:['p-nc','sem contagem'], sem_base:['p-sm','sem base']
};

const selLoja = document.getElementById("f-loja");

function filtrados(){
  const lj = selLoja.value, np = parseInt(document.getElementById("f-per").value,10);
  let ds = D.dias.slice();
  if (lj) ds = ds.filter(d => d.loja===lj);
  if (np < 999) {
    const datas = [...new Set(D.dias.map(d=>d.data))].sort();
    const corte = datas[Math.max(0, datas.length-np)];
    ds = ds.filter(d => d.data >= corte);
  }
  return ds.sort((a,b)=> a.data<b.data?1:a.data>b.data?-1:a.loja.localeCompare(b.loja));
}
const kpi = (lbl,val,sub,cor,corVal) =>
  '<div class="kpi" style="--kc:'+cor+';'+(corVal?'--kv:'+corVal:'')+'"><div class="lbl">'+lbl+'</div><div class="val">'+val+'</div><div class="sub">'+(sub||'')+'</div></div>';

// ══ 1. CONFERÊNCIA ══
function rConf(){
  const ds = filtrados();
  const conferidos = ds.filter(d => d.conf==="ok" || d.conf==="divergente");
  const naoFech    = ds.filter(d => d.conf==="nao_fechado");
  const naoConf    = ds.filter(d => d.conf==="nao_conferido");
  const div        = ds.filter(d => d.conf==="divergente");
  const comMov     = ds.filter(d => d.conf!=="sem_movimento");

  const deriva = conferidos.reduce((a,d)=>a+(d.caixa.residuo||0),0);
  const piores = div.slice().sort((a,b)=>Math.abs(b.caixa.residuo)-Math.abs(a.caixa.residuo));
  const pior = piores[0];
  const lojasSemConf = [...new Set(naoConf.map(d=>d.loja))];

  // A mesma tolerância de R$ 1,00/dia, aplicada ao acumulado: R$ 17 em 43 dias é
  // arredondamento de troco, não rombo — pintar de vermelho seria alarme falso.
  const limiteDeriva = Math.max(1, conferidos.length * D.tolerancia);
  const corDeriva = Math.abs(deriva) <= limiteDeriva ? "var(--ok)" : "var(--falta)";

  document.getElementById("kpi-conf").innerHTML =
    kpi("Deriva acumulada", nf2(deriva), conferidos.length+" dia(s) conferido(s)", corDeriva, corDeriva) +
    kpi("Maior diferença num dia", pior ? nf2(pior.caixa.residuo) : "—",
        pior ? pior.loja+" · "+dBR(pior.data) : "tudo dentro de "+nf2(D.tolerancia),
        "var(--falta)", pior?"var(--falta)":"var(--ok)") +
    kpi("Caixas não fechados", naoFech.length, "de "+comMov.length+" dia(s) com movimento",
        "var(--alerta)", naoFech.length?"#b45309":"") +
    kpi("Dias sem contagem", naoConf.length,
        lojasSemConf.length ? lojasSemConf.join(", ")+": informado = sistema" : "todas contam o caixa",
        "#7c3aed", naoConf.length?"#6d28d9":"var(--ok)");

  const linhas = ds.map(d => {
    const p = PILL[d.conf] || PILL.sem_movimento;
    const c = d.caixa || {};
    const temCalculo = c.esperado != null;
    // Conferência de caixa se faz no centavo: o caixa da L1 em 03/07 tinha 786,85,
    // não 787. Nada de arredondar nesta tabela.
    const mostra = v => v==null ? '<span class="zero">—</span>' : nf2(v);
    return '<tr>'+
      '<td><b>'+dBR(d.data)+'</b> <span style="color:var(--muted);font-size:11px">'+diaSem(d.data)+'</span></td>'+
      '<td style="text-align:left"><span class="loja-tag" style="background:'+corLoja(d.loja)+'">'+d.loja+'</span></td>'+
      '<td class="num zero">'+mostra(c.anterior)+'</td>'+
      '<td class="num">'+mostra(c.calc)+'</td>'+
      '<td class="num">'+(c.sangria?nf2(c.sangria):'<span class="zero">—</span>')+'</td>'+
      '<td class="num">'+(temCalculo?nf2(c.esperado):'<span class="zero">—</span>')+'</td>'+
      // Em dia sem movimento o ERP devolve 0, mas o dinheiro continua na gaveta:
      // mostrar "R$ 0" ali daria a entender que o caixa foi zerado.
      '<td class="num"><b>'+((d.conf==="nao_fechado"||d.conf==="sem_movimento")?'<span class="zero">—</span>':nf2(c.inf))+'</b></td>'+
      '<td class="'+(temCalculo?cls(c.residuo):"zero")+'">'+(temCalculo?nf2(c.residuo):"—")+'</td>'+
      '<td><span class="pill '+p[0]+'">'+p[1]+'</span></td>'+
    '</tr>';
  }).join("");

  document.getElementById("t-conf").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Caixa anterior</th>'+
    '<th>Dinheiro do dia</th><th>Sangria</th><th>Caixa esperado</th><th>Caixa informado</th>'+
    '<th>Diferença</th><th style="text-align:left">Status</th></tr></thead>'+
    '<tbody>'+(linhas || '<tr><td colspan="9" class="vazio">Sem dados no período.</td></tr>')+'</tbody>';
}

// ══ 2. FORMAS ══
const FORMAS = [
  ["dinheiro","Dinheiro","#059669"],["pix","PIX","#0891b2"],["cartao","Cartão","#6366f1"],
  ["crediario","Crediário","#f59e0b"],["qrlinx","QR Linx","#8b5cf6"],["convenio","Convênio","#ec4899"],
  ["deposito","Depósito","#0ea5e9"],["cashback","Cashback","#84cc16"],["link_pgto","Link pgto","#f43f5e"],
];
function rFormas(){
  const ds = filtrados();
  const tot = {}; let geral = 0;
  FORMAS.forEach(([k]) => { tot[k] = ds.reduce((a,d)=>a+(d[k]?.calc||0),0); geral += tot[k]; });
  const dev = ds.reduce((a,d)=>a+(d.devolucoes?.calc||0),0);

  const mix = FORMAS.filter(([k])=>tot[k]>0).sort((a,b)=>tot[b[0]]-tot[a[0]]);
  document.getElementById("mixbar").innerHTML = mix.map(([k,n,c])=>{
    const p = geral? tot[k]/geral*100 : 0;
    return '<div style="width:'+p+'%;background:'+c+'" title="'+n+'">'+(p>7?p.toFixed(0)+"%":"")+'</div>';
  }).join("");
  document.getElementById("mixleg").innerHTML = mix.map(([k,n,c])=>
    '<span><i style="background:'+c+'"></i>'+n+' '+nf(tot[k])+'</span>').join("");

  const dinPct = geral? tot.dinheiro/geral*100 : 0;
  document.getElementById("kpi-formas").innerHTML =
    kpi("Total registrado", nf(geral), ds.length+" dia(s)-loja", "var(--accent)") +
    kpi("Dinheiro em espécie", nf(tot.dinheiro), dinPct.toFixed(1).replace(".",",")+"% do total", "#059669") +
    kpi("PIX", nf(tot.pix), (geral?(tot.pix/geral*100).toFixed(1).replace(".",","):"0")+"% do total", "#0891b2") +
    kpi("Cartão", nf(tot.cartao), (geral?(tot.cartao/geral*100).toFixed(1).replace(".",","):"0")+"% do total", "#6366f1") +
    kpi("Devoluções", nf(dev), "saída por devolução", "#f43f5e");

  // por loja × forma
  const lojas = selLoja.value ? [selLoja.value] : D.lojas.map(l=>l.key);
  const cabec = '<thead><tr><th style="text-align:left">Loja</th>'+mix.map(([k,n])=>'<th>'+n+'</th>').join("")+'<th>Total</th></tr></thead>';
  const corpo = lojas.map(lj=>{
    const dl = ds.filter(d=>d.loja===lj);
    const t = mix.map(([k])=>dl.reduce((a,d)=>a+(d[k]?.calc||0),0));
    const s = t.reduce((a,b)=>a+b,0);
    return '<tr><td><span class="loja-tag" style="background:'+corLoja(lj)+'">'+lj+'</span> '+nomeLoja(lj)+'</td>'+
      t.map(v=>'<td class="num">'+nf(v)+'</td>').join("")+'<td class="num"><b>'+nf(s)+'</b></td></tr>';
  }).join("");
  document.getElementById("t-formas").innerHTML = cabec+'<tbody>'+corpo+'</tbody>';

  // planos (bandeiras)
  const bp = document.getElementById("box-planos");
  if (D.planos && D.planos.formas && D.planos.formas.length) {
    bp.style.display = "";
    const linhas = D.planos.formas.map(f=>{
      const cab = '<tr><td colspan="2" style="background:var(--card2);font-weight:800;font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted)">'+f.forma+' — '+nf(f.total)+'</td></tr>';
      const ps = f.planos.slice().sort((a,b)=>b.valor-a.valor)
        .map(p=>'<tr><td style="padding-left:24px">'+p.nome+'</td><td class="num">'+nf(p.valor)+'</td></tr>').join("");
      return cab+ps;
    }).join("");
    document.getElementById("t-planos").innerHTML =
      '<thead><tr><th style="text-align:left">Plano</th><th>Valor</th></tr></thead><tbody>'+linhas+'</tbody>';
    bp.querySelector(".hint").textContent = "as 4 lojas somadas · "+D.planos.periodo.ini+" a "+D.planos.periodo.fim;
  } else { bp.style.display = "none"; }
}

// ══ 3. SANGRIA ══
// ⚠️ NÃO usar o "Saldo Inicial/Final (em Dinheiro)" do ERP aqui. Esse campo contradiz a
// conferência real: em 28/07 ele dava −R$ 38,85 para a L4 enquanto o caixa físico era
// R$ 1.047,40 e fechava certo. Mostrá-lo pintava de vermelho justamente a loja que mais
// acerta. O saldo exibido é o caixa informado (a gaveta), o mesmo da aba Conferência.
function rSangria(){
  const ds = filtrados();
  const comMov = ds.filter(d=>d.conf!=="sem_movimento");
  const sang = ds.reduce((a,d)=>a+(d.caixa?.sangria||0),0);
  const sup = ds.reduce((a,d)=>a+(d.caixa?.suprimento||0),0);
  const dinheiro = ds.reduce((a,d)=>a+(d.caixa?.calc||0),0);
  const semSangria = comMov.filter(d=>(d.caixa?.calc||0)>0 && !(d.caixa?.sangria>0));

  // caixa atual = último valor informado de cada loja no período
  const lojas = selLoja.value ? [selLoja.value] : D.lojas.map(l=>l.key);
  let caixaHoje = 0, comCaixa = 0;
  lojas.forEach(lj=>{
    const ult = ds.filter(d=>d.loja===lj && d.caixa && d.caixa.inf>0 && d.conf!=="nao_fechado" && d.conf!=="sem_movimento")[0];
    if (ult) { caixaHoje += ult.caixa.inf; comCaixa++; }
  });

  document.getElementById("kpi-sangria").innerHTML =
    kpi("Sangria no período", nf2(sang), (dinheiro? (sang/dinheiro*100).toFixed(0)+"% do dinheiro vendido" : "dinheiro retirado"), "#7c3aed") +
    kpi("Na gaveta agora", nf2(caixaHoje), comCaixa+" loja(s) · último fechamento", "#059669") +
    kpi("Suprimento", nf2(sup), "dinheiro colocado (troco)", "#0891b2") +
    kpi("Dias sem sangria", semSangria.length, "vendeu em dinheiro e não retirou", "var(--alerta)", semSangria.length?"#b45309":"");

  const linhas = ds.map(d=>{
    const c = d.caixa || {};
    const p = PILL[d.conf] || PILL.sem_movimento;
    const mudo = d.conf==="nao_fechado" || d.conf==="sem_movimento";
    return '<tr>'+
      '<td><b>'+dBR(d.data)+'</b> <span style="color:var(--muted);font-size:11px">'+diaSem(d.data)+'</span></td>'+
      '<td style="text-align:left"><span class="loja-tag" style="background:'+corLoja(d.loja)+'">'+d.loja+'</span></td>'+
      '<td class="num">'+nf2(c.calc||0)+'</td>'+
      '<td class="num">'+(c.sangria?nf2(c.sangria):'<span class="zero">—</span>')+'</td>'+
      '<td class="num">'+(c.suprimento?nf2(c.suprimento):'<span class="zero">—</span>')+'</td>'+
      '<td class="num"><b>'+(mudo?'<span class="zero">—</span>':nf2(c.inf))+'</b></td>'+
      '<td><span class="pill '+p[0]+'">'+p[1]+'</span></td>'+
    '</tr>';
  }).join("");

  document.getElementById("t-sangria").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Dinheiro do dia</th><th>Sangria</th>'+
    '<th>Suprimento</th><th>Caixa no fim do dia</th><th style="text-align:left">Status</th></tr></thead>'+
    '<tbody>'+(linhas || '<tr><td colspan="7" class="vazio">Sem dados no período.</td></tr>')+'</tbody>';
}

// ══ 4. BANCO ══
function rBanco(){
  const ds = filtrados();
  const vendCartao = ds.reduce((a,d)=>a+(d.cartao?.calc||0),0);
  const rec = D.recebivel || {};
  const venc = (rec.porVencimento||[]).filter(v=>v.valor>0);
  const totalRec = rec.totalGeral || venc.reduce((a,b)=>a+b.valor,0);

  // administradoras que apareceram nas vendas do período (lado "vendeu")
  const admVenda = {};
  ds.forEach(d => Object.entries(d.adms||{}).forEach(([n,v]) => { admVenda[n] = (admVenda[n]||0)+v; }));
  const listaVenda = Object.entries(admVenda).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);

  const hoje = new Date().toISOString().slice(0,10);
  const em30 = new Date(Date.now()+30*864e5).toISOString().slice(0,10);
  const prox30 = venc.filter(v=>v.data>=hoje && v.data<=em30).reduce((a,b)=>a+b.valor,0);

  document.getElementById("kpi-banco").innerHTML =
    kpi("Cartão vendido", nf(vendCartao), "no período filtrado", "#6366f1") +
    kpi("A receber (total)", nf(totalRec), rec.periodo ? "venc. até "+rec.periodo.fim : "próximos 3 meses", "#0891b2") +
    kpi("Cai nos próximos 30 dias", nf(prox30), venc.filter(v=>v.data>=hoje&&v.data<=em30).length+" data(s) de vencimento", "#7c3aed") +
    kpi("Administradoras", listaVenda.length, "usadas nas vendas do período", "#059669");

  // calendário: quanto entra por dia (do mais próximo ao mais distante)
  const futuros = venc.filter(v=>v.data>=hoje).slice(0,45);
  const linhas = futuros.map(v=>
    '<tr><td><b>'+dBR(v.data)+'</b> <span style="color:var(--muted);font-size:11px">'+diaSem(v.data)+'</span></td>'+
    '<td class="num">'+nf(v.valor)+'</td></tr>').join("");
  document.getElementById("t-banco").innerHTML =
    '<thead><tr><th style="text-align:left">Vencimento</th><th>Entra no banco</th></tr></thead>'+
    '<tbody>'+(linhas || '<tr><td colspan="2" class="vazio">Sem recebível em aberto.</td></tr>')+'</tbody>';

  // administradoras do lado da venda
  const tAdm = document.getElementById("t-banco-adm");
  if (tAdm) {
    tAdm.innerHTML =
      '<thead><tr><th style="text-align:left">Administradora</th><th>Vendido no período</th></tr></thead><tbody>'+
      (listaVenda.map(([n,v])=>'<tr><td>'+n+'</td><td class="num">'+nf(v)+'</td></tr>').join("")
        || '<tr><td colspan="2" class="vazio">Sem venda no cartão no período.</td></tr>')+'</tbody>';
  }
}

// ══ 5. CONCILIAÇÃO DA MAQUININHA (tudo no navegador — o arquivo não é enviado a lugar nenhum) ══

// CSV com campos entre aspas e vírgula decimal dentro ("118,00") — split simples não serve.
function parseCSV(txt){
  txt = txt.replace(/^﻿/,"");
  const linhas=[]; let campo="", linha=[], dentro=false;
  for (let i=0;i<txt.length;i++){
    const ch=txt[i];
    if (dentro){
      if (ch === '"'){ if (txt[i+1] === '"'){ campo+='"'; i++; } else dentro=false; }
      else campo+=ch;
    } else if (ch === '"') dentro=true;
    else if (ch === ","){ linha.push(campo); campo=""; }
    else if (ch === "\n"){ linha.push(campo); linhas.push(linha); linha=[]; campo=""; }
    else if (ch !== "\r") campo+=ch;
  }
  if (campo || linha.length){ linha.push(campo); linhas.push(linha); }
  if (!linhas.length) return [];
  const cab=linhas[0].map(c=>c.trim());
  return linhas.slice(1).filter(l=>l.some(c=>c.trim())).map(l=>{
    const o={}; cab.forEach((c,i)=>o[c]=(l[i]||"").trim()); return o;
  });
}

// Aceita "118,00", "R$ 1.234,56", "+R$ 53,90", "-R$ 2.838,00" e "'- 0,56" (o extrato
// da InfinitePay exporta a taxa com apóstrofo na frente).
const brNum = s => {
  let t=String(s||"").trim().replace(/^'/,"").replace(/R\$/g,"").replace(/\s/g,"");
  if(!t) return 0;
  let sinal=1;
  if (t.startsWith("-")){ sinal=-1; t=t.slice(1); }
  else if (t.startsWith("+")) t=t.slice(1);
  const v = /,\d{1,2}$/.test(t) ? parseFloat(t.replace(/\./g,"").replace(",",".")) : parseFloat(t.replace(/,/g,""));
  return Number.isFinite(v)? sinal*Math.round(v*100)/100 : 0;
};

// Data em "dd/mm/aaaa" ou "aaaa-mm-dd" → ISO
const dataISO = s => {
  const t=String(s||"").trim();
  let m=/(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return m[1]+"-"+m[2]+"-"+m[3];
  m=/(\d{2})\/(\d{2})\/(\d{4})/.exec(t);
  if (m) return m[3]+"-"+m[2]+"-"+m[1];
  return null;
};

// Acha a coluna por palavras-chave, tolerando variações de nome entre adquirentes.
function acharCol(obj, ...alternativas){
  const chaves=Object.keys(obj);
  for (const alt of alternativas){
    const re=new RegExp(alt,"i");
    const k=chaves.find(c=>re.test(c));
    if (k) return k;
  }
  return null;
}

// A equipe carrega DOIS arquivos por loja e eles têm formatos diferentes:
//  · relatório da maquininha — uma linha por cobrança (tem "Meio"/forma e Status)
//  · extrato da conta        — uma linha por lançamento bancário (tem "Tipo de transação"
//                              e "Detalhe": Pix Recebido/Enviado, Depósito de vendas...)
// Antes o painel só conhecia o primeiro e devolvia "não reconheci as colunas" para o extrato.
function detectarTipo(linhas){
  if (!linhas.length) return null;
  const a=linhas[0];
  if (acharCol(a,"tipo de transa") && acharCol(a,"detalhe")) return "extrato";
  if (acharCol(a,"meio - meio","^meio","forma de pagamento","tipo de pagamento")) return "maquininha";
  return null;
}

// Extrato da conta: separa PIX recebido/enviado, depósitos de venda (liquidação de cartão)
// e estornos. O sinal vem no próprio valor ("+R$ 53,90" / "-R$ 2.838,00").
function lerExtrato(linhas){
  const a=linhas[0];
  const cData=acharCol(a,"^data$","^data"), cHora=acharCol(a,"^hora"),
        cTipo=acharCol(a,"tipo de transa"), cDet=acharCol(a,"detalhe"),
        cNome=acharCol(a,"^nome"), cValor=acharCol(a,"^valor");
  if (!cData || !cTipo || !cValor)
    throw new Error("é um extrato de conta, mas não achei as colunas de data, tipo e valor.");
  const out=[];
  for (const l of linhas){
    const d=dataISO(l[cData]); if (!d) continue;
    const tipo=(l[cTipo]||"").toLowerCase(), det=(cDet?l[cDet]:"").toLowerCase();
    const v=brNum(l[cValor]);
    let classe=null;
    if (/pix/.test(tipo)) classe = /enviad/.test(det) ? "pix_enviado" : "pix_recebido";
    else if (/dep[óo]sito/.test(tipo)) classe="deposito";
    else if (/cancelamento|estorno/.test(tipo) || /estorno/.test(det)) classe="estorno";
    else classe="outro";
    out.push({ id:out.length, d, h:(cHora?l[cHora]:"").slice(0,5), v:Math.abs(v), sinal:v<0?-1:1,
                classe, tipo:(l[cTipo]||"").trim(), det:(cDet?l[cDet]:"").trim(),
                nome:cNome?(l[cNome]||"").trim():"", u:false });
  }
  if (!out.length) throw new Error("o extrato não tem lançamentos com data reconhecível");
  return out;
}

function lerTransacoes(linhas){
  if (!linhas.length) throw new Error("arquivo vazio ou sem linhas de dados");
  const a=linhas[0];
  const cData=acharCol(a,"^data e hora","^data"), cValor=acharCol(a,"^valor \\(","^valor$","valor bruto"),
        cMeio=acharCol(a,"meio - meio","forma","tipo de pagamento","^meio"),
        cStatus=acharCol(a,"status"), cBand=acharCol(a,"bandeira"),
        cNsu=acharCol(a,"nsu","identificador"), cNome=acharCol(a,"origem - nome","cliente","portador"),
        cLiq=acharCol(a,"^l[íi]quido"), cTaxa=acharCol(a,"taxa aplicada - valor"),
        cParc=acharCol(a,"parcelas"), cTaxaPct=acharCol(a,"taxa aplicada - aplicada");
  if (!cData || !cValor || !cMeio)
    throw new Error("não reconheci as colunas. Preciso de data, valor e forma de pagamento (meio).");

  const out=[];
  for (const l of linhas){
    const st=(cStatus? l[cStatus] : "").toLowerCase();
    if (cStatus && !/aprovad|autorizad|confirmad|paga/.test(st)) continue;   // ignora negada/cancelada
    const meio=(l[cMeio]||"").toLowerCase();
    const m=/(\d{2})\/(\d{2})\/(\d{4})/.exec(l[cData]||"");
    if (!m) continue;
    const hora=(/(\d{2}:\d{2})/.exec(l[cData]||"")||[])[1] || "";
    out.push({
      d:m[3]+"-"+m[2]+"-"+m[1], h:hora, v:brNum(l[cValor]),
      cartao:/cr[eé]dito|d[eé]bito|card|cart/.test(meio),
      meio:(l[cMeio]||"").trim(), band:cBand?(l[cBand]||"").trim():"",
      nsu:cNsu?(l[cNsu]||"").trim():"", nome:cNome?(l[cNome]||"").trim():"",
      // "recebimento" = o líquido que a adquirente vai repassar (bruto menos taxa)
      liq:cLiq?brNum(l[cLiq]):null, taxa:cTaxa?Math.abs(brNum(l[cTaxa])):null,
      parcelas:cParc?(l[cParc]||"").trim():"", taxaInf:cTaxaPct?parseFloat(String(l[cTaxaPct]).replace(",","."))||0:null,
      id:out.length, u:false,
    });
  }
  if (!out.length) throw new Error("nenhuma transação aprovada encontrada no arquivo");
  return out;
}

const diasEntre = (a,b) => Math.round((new Date(a+"T00:00:00") - new Date(b+"T00:00:00"))/864e5);

// Motor genérico: casa uma lista de lançamentos externos contra um campo de forma de
// pagamento do ERP. Serve tanto para cartão (relatório da maquininha) quanto para PIX
// (extrato da conta) — a lógica de casamento é a mesma, só muda o campo comparado.
function conciliarForma(loja, externos, campo, rotulo, todosExternos){
  const movLoja = (D.movimento && D.movimento[loja]) || [];
  if (!movLoja.length) throw new Error("o painel ainda não tem o movimento diário da "+loja+" — rode a atualização do dashboard antes.");
  if (!externos.length) throw new Error("o arquivo não tem lançamentos de "+rotulo);

  const datas = externos.map(t=>t.d).sort();
  const ini=datas[0], fim=datas[datas.length-1];

  // O painel só tem o movimento de uma janela. Se o arquivo for de fora dela, o lado do
  // ERP viria vazio e TODO lançamento apareceria como "sem venda" — erro grave e
  // silencioso. Melhor recusar com a mensagem certa.
  if (D.movimentoPeriodo){
    const jIni=isoDe(D.movimentoPeriodo.ini), jFim=isoDe(D.movimentoPeriodo.fim);
    if (fim < jIni || ini > jFim)
      throw new Error("o arquivo vai de "+dBR(ini)+" a "+dBR(fim)+", mas o painel só tem o movimento do ERP de "
        +dBR(jIni)+" a "+dBR(jFim)+". Carregue um arquivo desse período.");
  }

  const erp = movLoja.filter(x=>x[campo]>0 && x.d>=ini && x.d<=fim).map(x=>({...x,u:false}));
  const centavos=[], agrupadas=[];

  const casar=(jan,tol,reg)=>{
    for (const t of externos){
      if (t.u) continue;
      for (const e of erp){
        if (e.u || Math.abs(diasEntre(e.d,t.d))>jan) continue;
        if (Math.abs(e[campo]-t.v)<=tol){
          t.u=e.u=true; e.parId=t.id;
          if (reg && Math.abs(e[campo]-t.v)>0.005) reg.push({e,t});
          break;
        }
      }
    }
  };
  [0,1,3].forEach(j=>casar(j,0.005));
  [0,1].forEach(j=>casar(j,0.15,centavos));

  // um lançamento pagando 2 ou 3 documentos
  for (const t of externos){
    if (t.u) continue;
    const c=erp.filter(e=>!e.u && Math.abs(diasEntre(e.d,t.d))<=1);
    let achou=false;
    for (const k of [2,3]){
      for (const combo of combinacoes(c,k)){
        if (Math.abs(combo.reduce((a,x)=>a+x[campo],0)-t.v)<=0.05){
          t.u=true; combo.forEach(x=>{x.u=true; x.parId=t.id;});
          agrupadas.push({t,docs:combo}); achou=true; break;
        }
      }
      if (achou) break;
    }
  }

  // sobras: tenta explicar como forma de pagamento trocada
  const trocadas=[], soExterno=[], soErp=[];
  for (const t of externos.filter(x=>!x.u)){
    // Ordena pelo mais próximo em valor e depois em data: com tolerância frouxa dava par
    // errado (conta R$ 31,60 casando com documento de R$ 31,70, que era outra venda).
    const cand = movLoja
      .filter(e=>Math.abs(diasEntre(e.d,t.d))<=1 && Math.abs(e.v-t.v)<=0.05 && e[campo]<=0.005)
      .sort((a,b)=>Math.abs(a.v-t.v)-Math.abs(b.v-t.v) || Math.abs(diasEntre(a.d,t.d))-Math.abs(diasEntre(b.d,t.d)));
    if (cand.length){
      const e=cand[0], formas=[];
      if(e.din>0) formas.push("dinheiro "+nf2(e.din));
      if(e.car>0) formas.push("cartão "+nf2(e.car));
      if(e.pix>0) formas.push("PIX "+nf2(e.pix));
      if(e.lnk>0) formas.push("link "+nf2(e.lnk));
      trocadas.push({lado:"externo", t, e, formas:formas.join(", ")||"outra forma", ambiguo:cand.length>1});
    } else soExterno.push(t);
  }
  // Do lado do ERP, só vale como "forma trocada" se houver no arquivo um lançamento que
  // seja PAGAMENTO DE CLIENTE em outra forma. Depósito de venda (liquidação do cartão),
  // PIX enviado (transferência) e estorno não são pagamento — antes entravam aqui e
  // produziam falso positivo do tipo "venda paga com Depósito de vendas".
  const pagamentos = (todosExternos||[]).filter(t=>
    !externos.includes(t) && (t.classe===undefined || t.classe==="pix_recebido"));
  for (const e of erp.filter(x=>!x.u)){
    const cand = pagamentos.filter(t=>Math.abs(diasEntre(t.d,e.d))<=1 && Math.abs(t.v-e[campo])<=0.05);
    if (cand.length) trocadas.push({lado:"erp", t:cand[0], e, formas:cand[0].meio||cand[0].tipo||"outra forma", ambiguo:cand.length>1});
    else soErp.push(e);
  }

  return {
    loja, campo, rotulo, ini, fim,
    totERP: erp.reduce((a,e)=>a+e[campo],0),
    totExt: externos.reduce((a,t)=>a+t.v,0),
    nERP: erp.length, nExt: externos.length,
    externos, erp, centavos, agrupadas, trocadas, soExterno, soErp,
  };
}

function combinacoes(arr,k){
  const out=[]; const rec=(i,atual)=>{
    if (atual.length===k){ out.push(atual.slice()); return; }
    if (out.length>4000) return;                 // trava: não travar o navegador
    for (let j=i;j<arr.length;j++){ atual.push(arr[j]); rec(j+1,atual); atual.pop(); }
  };
  rec(0,[]); return out;
}
const isoDe = br => { const p=br.split("/"); return p[2]+"-"+p[1]+"-"+p[0]; };


// ══ HISTÓRICO DAS CONCILIAÇÕES (Supabase, cifrado no navegador) ══════════════
// O conteúdo é cifrado AQUI, com a senha do painel, antes de sair da máquina.
// O Supabase guarda um blob que nem ele nem quem tiver a chave anon consegue ler.
// Em claro sobem só loja, período e nome dos arquivos, para dar pra listar.
const SUPA_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const SUPA_TAB = "conferencia_caixa_conciliacoes";
const supaHead = extra => Object.assign(
  { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY, "Content-Type": "application/json" }, extra||{});

function senhaAtual(){
  try { return sessionStorage.getItem("caixa_ok"); } catch(e){ return null; }
}

// ⚠️ btoa(String.fromCharCode(...arr)) estoura o limite de argumentos com array grande.
// O payload aqui tem centenas de KB (resultado + CSVs originais) e o erro vinha como
// RangeError, mascarado pelo catch como "sem conexão para salvar". Converter em blocos.
function paraB64(buf){
  const u = new Uint8Array(buf);
  let s = "";
  for (let i=0;i<u.length;i+=0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i+0x8000));
  return btoa(s);
}

async function cifrarTexto(texto, senha){
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const km = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    {name:"PBKDF2", salt, iterations:PAYLOAD.iters, hash:"SHA-256"}, km,
    {name:"AES-GCM", length:256}, false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, enc.encode(texto));
  return { salt:paraB64(salt), iv:paraB64(iv), iters:PAYLOAD.iters, payload:paraB64(ct) };
}
async function decifrarTexto(env, senha){
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    {name:"PBKDF2", salt:b64(env.salt), iterations:env.iters, hash:"SHA-256"}, km,
    {name:"AES-GCM", length:256}, false, ["decrypt"]);
  return new TextDecoder().decode(
    await crypto.subtle.decrypt({name:"AES-GCM", iv:b64(env.iv)}, key, b64(env.payload)));
}

// Salva (ou substitui) a conciliação da loja. Guarda resultado + arquivos originais,
// para dar pra reprocessar se o algoritmo melhorar.
// ?teste=1 na URL desliga a gravação. Existe porque minhas verificações automatizadas
// rodavam contra a página publicada e cada upload regravava a conferência no Supabase —
// o Athila apagava o registro e ele voltava sozinho. Teste não pode sujar dado real.
const MODO_TESTE = typeof location !== "undefined" && /[?&]teste=1/.test(location.search);

async function salvarConciliacao(lj){
  const c = conciliacoes[lj];
  if (!c) return;
  if (MODO_TESTE) { c.statusSalvo = "modo teste — não gravado"; rConcil(); return; }
  const senha = senhaAtual();
  if (!senha) { c.statusSalvo = "sem senha na sessão — não deu para cifrar"; return; }

  const per = periodoDe(c);
  if (!per) { c.statusSalvo = "sem período reconhecível"; return; }

  try{
    const conteudo = JSON.stringify({
      versao: 1,
      loja: lj,
      cartao: c.cartao || null,
      pix: c.pix || null,
      conta: c.conta || null,
      arquivos: c.arquivos,        // inclui o conteúdo bruto (ver carregarArquivos)
    });
    const env = await cifrarTexto(conteudo, senha);
    const corpo = {
      loja: lj, periodo_ini: per.ini, periodo_fim: per.fim,
      arquivos: c.arquivos.map(a=>({nome:a.nome, tipo:a.tipo})),
      ...env,
    };
    const r = await fetch(SUPA_URL+"/rest/v1/"+SUPA_TAB+"?on_conflict=loja,periodo_ini,periodo_fim", {
      method:"POST", headers: supaHead({Prefer:"resolution=merge-duplicates,return=minimal"}),
      body: JSON.stringify(corpo),
    });
    if (r.ok){ c.statusSalvo = "salva"; }
    else if (r.status===404 || r.status===400){
      c.statusSalvo = "a tabela do histórico ainda não existe no Supabase (rode conferencia_caixa_conciliacoes.sql)";
    } else {
      c.statusSalvo = "não consegui salvar (erro "+r.status+")";
    }
  }catch(e){
    // Não engolir a causa: este catch já escondeu um RangeError da cifragem como se
    // fosse falta de rede, e custou uma investigação inteira.
    c.statusSalvo = "falhou ao salvar: " + (e && e.message ? e.message : e);
  }
  rConcil();
  carregarHistorico();
}

function periodoDe(c){
  const ps=[c.cartao, c.pix].filter(Boolean);
  if (!ps.length) return null;
  return { ini: ps.map(p=>p.ini).sort()[0], fim: ps.map(p=>p.fim).sort().slice(-1)[0] };
}

let historico = [];
async function carregarHistorico(){
  const el = document.getElementById("c-historico");
  if (!el) return;
  // Mostra só a loja selecionada. Listar todas ao mesmo tempo confundia tanto quanto
  // o resultado acumulado: a pessoa escolhia uma empresa e via conferências de outras.
  const cl = document.getElementById("c-loja");
  const lj = cl ? cl.value : "";
  try{
    const r = await fetch(SUPA_URL+"/rest/v1/"+SUPA_TAB+
      "?select=id,loja,periodo_ini,periodo_fim,arquivos,criado_em"+
      (lj ? "&loja=eq."+encodeURIComponent(lj) : "")+
      "&order=criado_em.desc&limit=100",
      { headers: supaHead() });
    if (!r.ok){
      el.innerHTML = '<div class="hist-aviso">Histórico indisponível'+
        (r.status===404?': a tabela ainda não foi criada no Supabase.':' (erro '+r.status+').')+'</div>';
      return;
    }
    historico = await r.json();
  }catch(e){
    el.innerHTML = '<div class="hist-aviso">Sem conexão para ler o histórico.</div>';
    return;
  }
  if (!historico.length){
    el.innerHTML = '<div class="hist-aviso">Nenhuma conferência guardada'+(lj?" para a "+esc2(lj):"")+' ainda.</div>';
    return;
  }
  el.innerHTML =
    '<table><thead><tr><th>Guardada em</th><th style="text-align:left">Loja</th>'+
    '<th style="text-align:left">Período</th><th style="text-align:left">Arquivos</th><th></th></tr></thead><tbody>'+
    historico.map(h=>{
      const dt=new Date(h.criado_em);
      const quando=String(dt.getDate()).padStart(2,"0")+"/"+String(dt.getMonth()+1).padStart(2,"0")+" "+
                   String(dt.getHours()).padStart(2,"0")+":"+String(dt.getMinutes()).padStart(2,"0");
      return '<tr><td>'+quando+'</td>'+
        '<td style="text-align:left"><span class="loja-tag" style="background:'+corLoja(h.loja)+'">'+esc2(h.loja)+'</span></td>'+
        '<td style="text-align:left">'+dBR(h.periodo_ini)+' a '+dBR(h.periodo_fim)+'</td>'+
        '<td style="text-align:left" class="zero">'+esc2((h.arquivos||[]).map(a=>a.tipo).join(" + "))+'</td>'+
        '<td><button class="btn-abrir" onclick="abrirHistorico('+h.id+')">abrir</button>'+
        '<button class="btn-excluir" title="excluir do histórico" onclick="excluirHistorico('+h.id+')">×</button></td></tr>';
    }).join("")+'</tbody></table>';
}

// Excluir é irreversível e some para todo mundo (o histórico é compartilhado) — por isso
// pede confirmação nomeando loja e período, não só "tem certeza?".
async function excluirHistorico(id){
  const h = historico.find(x=>x.id===id);
  const alvo = h ? (h.loja+" · "+dBR(h.periodo_ini)+" a "+dBR(h.periodo_fim)) : ("registro "+id);
  if (!confirm("Excluir a conferência de "+alvo+" do histórico?\n\nIsso apaga para toda a equipe e não dá para desfazer.")) return;
  const err=document.getElementById("c-erro"); err.textContent="";
  try{
    const r = await fetch(SUPA_URL+"/rest/v1/"+SUPA_TAB+"?id=eq."+id, { method:"DELETE", headers: supaHead() });
    if (!r.ok) throw new Error("erro "+r.status);
    // se estava aberta na tela, tira também
    if (h && conciliacoes[h.loja] && conciliacoes[h.loja].doHistorico) { delete conciliacoes[h.loja]; rConcil(); }
    await carregarHistorico();
  }catch(e){ err.textContent="❌ não consegui excluir: "+(e.message||e); }
}

async function abrirHistorico(id){
  const err=document.getElementById("c-erro"); err.textContent="";
  const senha=senhaAtual();
  if (!senha){ err.textContent="❌ senha não está na sessão — recarregue e entre de novo."; return; }
  try{
    const r = await fetch(SUPA_URL+"/rest/v1/"+SUPA_TAB+"?id=eq."+id+"&select=*", { headers: supaHead() });
    const [row] = await r.json();
    if (!row) throw new Error("registro não encontrado");
    const c = JSON.parse(await decifrarTexto(row, senha));
    conciliacoes[c.loja] = {
      loja: c.loja, arquivos: c.arquivos, cartao: c.cartao, pix: c.pix,
      conta: c.conta, statusSalvo: "salva", doHistorico: true,
    };
    const cl=document.getElementById("c-loja");
    if (cl) cl.value = c.loja;          // mantém o seletor coerente com o que está na tela
    rConcil();
    document.getElementById("c-resultado").scrollIntoView({behavior:"smooth"});
  }catch(e){
    err.textContent="❌ não consegui abrir: "+(e.message||e);
  }
}

// ── estado e render ──
const conciliacoes = {};   // loja -> resultado

// Plano de pagamento legível. Vem da maquininha quando a venda casou (é lá que está a
// parcela); quando só existe no ERP, cai para a forma que o documento registrou.
function planoDe(x){
  if (x.meio){
    const m = x.meio.toLowerCase();
    if (/pix/.test(m)) return "PIX";
    if (/d[ée]bito/.test(m)) return "Débito";
    if (/dinheiro/.test(m)) return "Dinheiro";
    if (/cr[ée]dito/.test(m)){
      const p = String(x.parcelas||"").trim();
      if (!p || /vista/i.test(p)) return "Crédito 1x";
      const n = parseInt(p,10);
      return Number.isFinite(n) ? "Crédito "+n+"x" : "Crédito "+p;
    }
    return x.meio;
  }
  const f=[];
  if (x.din>0) f.push("Dinheiro");
  if (x.pixErp>0) f.push("PIX");
  if (x.cartaoErp>0) f.push("Cartão");
  if (x.lnk>0) f.push("Link");
  return f.join("+") || "—";
}
// Taxa REAL cobrada: (bruto − líquido) / bruto. É o que o dinheiro mostra, não o que a
// adquirente informa na coluna dela — a comparação entre as duas é justamente o ponto.
const taxaReal = x => (x.bruto>0 && x.liq!=null) ? ((x.bruto - x.liq) / x.bruto * 100) : null;

function rConcil(){
  const chips=document.getElementById("c-carregados");
  const lojas=Object.keys(conciliacoes);
  chips.innerHTML = lojas.map(lj=>{
    const c=conciliacoes[lj];
    const arq=c.arquivos.map(a=>a.tipo==="extrato"?"extrato":"maquininha").join(" + ");
    const st=c.statusSalvo==="salva" ? ' <span title="guardada no histórico">💾</span>'
           : c.statusSalvo ? ' <span class="chip-alerta" title="'+esc2(c.statusSalvo)+'">⚠</span>' : '';
    return '<span class="chip-arq">✓ '+lj+' · '+arq+st+' <button onclick="removerConcil(\''+lj+'\')" title="tirar da tela (não apaga do histórico)">×</button></span>';
  }).join("");

  const res=document.getElementById("c-resultado");
  if (!lojas.length){ res.style.display="none"; res.innerHTML=""; return; }
  res.style.display="block";

  const tagLoja=l=>'<span class="loja-tag" style="background:'+corLoja(l)+'">'+l+'</span>';
  const juntar=(campo,f)=>lojas.flatMap(l=>{
    const r=conciliacoes[l][campo];
    return r? f(r).map(x=>({...x,loja:l})) : [];
  });
  const somar=(campo,f)=>lojas.reduce((a,l)=>{ const r=conciliacoes[l][campo]; return a+(r?f(r):0); },0);
  const temCampo=campo=>lojas.some(l=>conciliacoes[l][campo]);

  let html="";

  // ── KPIs ──
  const kpis=[];
  if (temCampo("cartao")){
    const e=somar("cartao",r=>r.totERP), m=somar("cartao",r=>r.totExt);
    kpis.push(kpi("Cartão no ERP", nf2(e), somar("cartao",r=>r.nERP)+" documento(s)", "#6366f1"));
    kpis.push(kpi("Cartão na maquininha", nf2(m), somar("cartao",r=>r.nExt)+" transação(ões)", "#0891b2"));
    kpis.push(kpi("Diferença no cartão", nf2(e-m), Math.abs(e-m)<=0.5?"praticamente fecha":"não fecha",
      Math.abs(e-m)<=0.5?"var(--ok)":"var(--falta)", Math.abs(e-m)<=0.5?"var(--ok)":"var(--falta)"));
  }
  if (temCampo("pix")){
    const e=somar("pix",r=>r.totERP), m=somar("pix",r=>r.totExt);
    kpis.push(kpi("PIX no ERP", nf2(e), somar("pix",r=>r.nERP)+" documento(s)", "#0891b2"));
    kpis.push(kpi("PIX na conta", nf2(m), somar("pix",r=>r.nExt)+" recebimento(s)", "#059669"));
    kpis.push(kpi("Diferença no PIX", nf2(e-m), Math.abs(e-m)<=0.5?"praticamente fecha":"não fecha",
      Math.abs(e-m)<=0.5?"var(--ok)":"var(--falta)", Math.abs(e-m)<=0.5?"var(--ok)":"var(--falta)"));
  }
  const nInc = juntar("cartao",r=>r.trocadas).length+juntar("cartao",r=>r.soExterno).length+juntar("cartao",r=>r.soErp).length
             + juntar("pix",r=>r.trocadas).length+juntar("pix",r=>r.soExterno).length+juntar("pix",r=>r.soErp).length;
  kpis.push(kpi("Inconsistências", nInc, nInc?"exigem ação":"nada a corrigir",
    nInc?"var(--falta)":"var(--ok)", nInc?"var(--falta)":"var(--ok)"));
  html += '<div class="kpis">'+kpis.join("")+'</div>';

  // ── movimento da conta (só quando há extrato) ──
  const contas=lojas.filter(l=>conciliacoes[l].conta);
  if (contas.length){
    html += caixaBox("🏦 Movimento da conta", "o que entrou e saiu no período do extrato",
      '<thead><tr><th style="text-align:left">Loja</th><th>PIX recebido</th><th>Depósitos de venda</th>'+
      '<th>PIX enviado</th><th>Estornos</th><th style="text-align:left">Período</th></tr></thead><tbody>'+
      contas.map(l=>{const c=conciliacoes[l].conta;
        return '<tr><td style="text-align:left">'+tagLoja(l)+'</td>'+
        '<td class="num">'+nf2(c.pixRecebido)+'</td>'+
        '<td class="num">'+nf2(c.depositos)+' <span class="zero">('+c.nDepositos+')</span></td>'+
        '<td class="num zero">'+nf2(c.pixEnviado)+'</td>'+
        '<td class="'+(c.estornos>0?"falta":"zero")+'">'+nf2(c.estornos)+'</td>'+
        '<td style="text-align:left" class="zero">'+dBR(c.ini)+' a '+dBR(c.fim)+'</td></tr>';}).join("")+'</tbody>',
      "<b>Depósitos de venda</b> é a liquidação do cartão caindo na conta (já líquida de taxa), "+
      "por isso não bate com o cartão vendido. <b>PIX enviado</b> é transferência para outra conta.");
  }


  // ── CRUZAMENTO DAS 4 COLUNAS ──────────────────────────────────────────────
  // 1 venda no ERP (total do documento) · 2 pagamentos lançados nesse documento
  // 3 venda na maquininha (bruto cobrado) · 4 recebimento (líquido, já sem a taxa)
  // A linha acende quando qualquer um dos cruzamentos não fecha.
  function tabelaCruzamento(){
    const TOLC = 0.05;

    const linhas = [];
    lojas.forEach(l=>{
      const r = conciliacoes[l] && conciliacoes[l].cartao;
      if (!r) return;
      // pares casados + documentos sem cobrança
      const porId = {};
      r.externos.forEach(t=>{ porId[t.id]=t; });
      // uma cobrança pode ter pago vários documentos — nesses casos o bruto é do
      // conjunto, não da linha, e comparar documento a documento acenderia falso.
      const quantosDocs = {};
      r.erp.forEach(e=>{ if (e.parId!=null) quantosDocs[e.parId]=(quantosDocs[e.parId]||0)+1; });
      r.erp.forEach(e=>{
        const t = (e.parId!=null ? porId[e.parId] : null) || null;
        const agrupada = t && quantosDocs[e.parId] > 1;
        linhas.push({ loja:l, d:e.d, doc:e.doc, venda:e.v, pag:(e.pag!=null?e.pag:null),
                      cartaoErp:e.car, pixErp:e.pix, din:e.din, lnk:e.lnk,
                      bruto:t?t.v:null, liq:t?t.liq:null, taxa:t?t.taxa:null,
                      hora:t?t.h:"", meio:t?t.meio:"", band:t?t.band:"",
                      parcelas:t?t.parcelas:"", taxaInf:t?t.taxaInf:null,
                      agrupada, nDocs:t?quantosDocs[e.parId]:0 });
      });
      // cobranças sem documento no ERP
      r.externos.filter(t=>!t.u).forEach(t=>{
        linhas.push({ loja:l, d:t.d, doc:null, venda:null, pag:null, cartaoErp:null,
                      pixErp:0, din:0, lnk:0,
                      bruto:t.v, liq:t.liq, taxa:t.taxa, hora:t.h,
                      meio:t.meio, band:t.band, parcelas:t.parcelas, taxaInf:t.taxaInf });
      });
    });
    if (!linhas.length) return "";

    linhas.forEach(x=>{
      const p=[];
      if (x.venda!=null && x.pag!=null && Math.abs(x.venda-x.pag)>TOLC)
        p.push("a venda ("+nf2(x.venda)+") não bate com os pagamentos lançados ("+nf2(x.pag)+")");
      if (x.cartaoErp!=null && x.bruto==null)
        p.push("cartão no ERP sem cobrança na maquininha");
      if (x.bruto!=null && x.cartaoErp==null)
        p.push("cobrança na maquininha sem venda no ERP");
      if (!x.agrupada && x.cartaoErp!=null && x.bruto!=null && Math.abs(x.cartaoErp-x.bruto)>TOLC)
        p.push("cartão no ERP ("+nf2(x.cartaoErp)+") ≠ cobrado na maquininha ("+nf2(x.bruto)+")");
      if (!x.agrupada && x.bruto!=null && x.liq!=null && x.taxa!=null && Math.abs(x.bruto-x.taxa-x.liq)>TOLC)
        p.push("bruto − taxa ≠ líquido");
      // a adquirente informa uma taxa e cobra outra
      const tr = taxaReal(x);
      if (tr!=null && x.taxaInf!=null && x.taxaInf>0 && Math.abs(tr-x.taxaInf)>0.05)
        p.push("taxa cobrada "+tr.toFixed(2).replace(".",",")+"% ≠ informada "+String(x.taxaInf).replace(".",",")+"%");
      x.problemas=p;
    });

    const ruins = linhas.filter(x=>x.problemas.length);
    const soRuins = document.getElementById("c-so-inconsistentes");
    const mostrar = (soRuins && soRuins.checked) ? ruins : linhas;
    mostrar.sort((a,b)=> (b.problemas.length-a.problemas.length) || (a.d<b.d?1:a.d>b.d?-1:0));

    const cel = (v, extra) => v==null ? '<td class="num zero">—</td>' : '<td class="num'+(extra||"")+'">'+nf2(v)+'</td>';
    const corpo = mostrar.slice(0,600).map(x=>
      '<tr class="'+(x.problemas.length?"linha-ruim":"")+'"'+
        (x.problemas.length?' title="'+esc2(x.problemas.join(" · "))+'"':'')+'>'+
      '<td><b>'+dBR(x.d)+'</b>'+(x.hora?' <span style="color:var(--muted);font-size:11px">'+esc2(x.hora)+'</span>':'')+'</td>'+
      '<td style="text-align:left">'+tagLoja(x.loja)+'</td>'+
      '<td style="text-align:left">'+(x.doc?esc2(x.doc):'<span class="zero">sem documento</span>')+'</td>'+
      '<td style="text-align:left">'+esc2(planoDe(x))+'</td>' +
      cel(x.venda) + cel(x.pag) +
      (x.agrupada
        ? '<td class="num zero" title="uma cobrança pagou '+x.nDocs+' documentos">'+nf2(x.bruto)+' ⋯</td>'+
          '<td class="num zero">'+(x.liq!=null?nf2(x.liq):"—")+' ⋯</td>'
        : cel(x.bruto) + cel(x.liq)) +
      '<td style="text-align:left">'+(x.problemas.length
          ? '<span class="motivo">'+esc2(x.problemas[0])+(x.problemas.length>1?' (+'+(x.problemas.length-1)+')':'')+'</span>'
          : '<span class="pill p-ok">bateu</span>')+'</td></tr>').join("");

    // O resumo vem ANTES da tabela: com 300+ linhas de detalhe, quem precisa da visão
    // por plano nunca chegaria até ela rolando.
    return resumoTaxas(linhas) +
      '<div class="box"><div class="box-h"><h3>🔀 Cruzamento das 4 pontas</h3>'+
      '<span class="hint">'+ruins.length+' de '+linhas.length+' linhas com inconsistência</span>'+
      '<label class="filtro-inc"><input type="checkbox" id="c-so-inconsistentes"'+
      ((soRuins&&soRuins.checked)?" checked":"")+' onchange="rConcil()"> só as inconsistentes</label>'+
      '</div><div class="scroll"><table class="compacta">'+
      '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th style="text-align:left">Doc.</th>'+
      '<th style="text-align:left">Plano</th>'+
      '<th>1 · Venda</th><th>2 · Pagtos</th><th>3 · Maquin.</th><th>4 · Receb.</th>'+
      '<th style="text-align:left">O que não bate</th></tr></thead><tbody>'+corpo+'</tbody></table></div>'+
      (mostrar.length>600?'<div class="nota">Mostrando as 600 primeiras de '+mostrar.length+' linhas.</div>':'')+
      '<div class="nota"><b>1</b> é o total do documento no ERP e <b>2</b> a soma de todas as formas de '+
      'pagamento lançadas nele — diferença aí é venda registrada sem o pagamento correspondente. '+
      '<b>3</b> é o que a maquininha cobrou e <b>4</b> o líquido que a adquirente vai repassar '+
      '(bruto menos a taxa), por isso 4 é sempre um pouco menor que 3.</div></div>';
  }

  // Resumo por plano: é o que se compara com a tabela de taxas da adquirente.
  function resumoTaxas(linhas){
    const g = {};
    linhas.forEach(x=>{
      const tr = taxaReal(x); if (tr==null) return;
      const p = planoDe(x);
      (g[p] = g[p] || {n:0, bruto:0, liq:0, infPond:0, infBase:0, min:Infinity, max:-Infinity});
      g[p].n++; g[p].bruto += x.bruto; g[p].liq += x.liq;
      // ⚠️ A informada tem de ser ponderada pelo bruto, igual à efetiva. Média simples
      // contra média ponderada acusava divergência onde não havia (Crédito 1x em vermelho
      // só porque as operações grandes têm bandeira mais barata).
      if (x.taxaInf!=null && x.taxaInf>0) { g[p].infPond += x.taxaInf * x.bruto; g[p].infBase += x.bruto; }
      g[p].min = Math.min(g[p].min, tr); g[p].max = Math.max(g[p].max, tr);
    });
    const chaves = Object.keys(g).sort((a,b)=>g[b].bruto-g[a].bruto);
    if (!chaves.length) return "";
    return '<div class="box"><div class="box-h"><h3>💳 Taxa efetiva por plano</h3>'+
      '<span class="hint">calculada de (bruto − líquido) ÷ bruto — para comparar com a tabela da adquirente</span></div>'+
      '<div class="scroll"><table><thead><tr><th style="text-align:left">Plano</th><th>Operações</th>'+
      '<th>Bruto</th><th>Líquido</th><th>Taxa paga</th><th>Taxa efetiva</th><th>Faixa</th>'+
      '<th>Informada</th></tr></thead><tbody>'+
      chaves.map(p=>{ const x=g[p];
        const ef = x.bruto>0 ? (x.bruto-x.liq)/x.bruto*100 : 0;
        const inf = x.infBase > 0 ? (x.infPond / x.infBase) : null;
        const fora = inf!=null && Math.abs(ef-inf)>0.05;
        return '<tr><td style="text-align:left"><b>'+esc2(p)+'</b></td>'+
          '<td class="num zero">'+x.n+'</td>'+
          '<td class="num">'+nf2(x.bruto)+'</td>'+
          '<td class="num">'+nf2(x.liq)+'</td>'+
          '<td class="num">'+nf2(x.bruto-x.liq)+'</td>'+
          '<td class="num'+(fora?" falta":"")+'"><b>'+ef.toFixed(2).replace(".",",")+'%</b></td>'+
          '<td class="num zero">'+(x.min===x.max?"—":x.min.toFixed(2).replace(".",",")+"% a "+x.max.toFixed(2).replace(".",",")+"%")+'</td>'+
          '<td class="num zero">'+(inf!=null?inf.toFixed(2).replace(".",",")+"%":"—")+'</td></tr>'; }).join("")+
      '</tbody></table></div>'+
      '<div class="nota">A <b>taxa efetiva</b> sai do dinheiro que entrou, não do que a adquirente declara. '+
      'Quando a coluna <b>informada</b> difere, a linha fica vermelha — é aí que vale abrir o contrato. '+
      'A <b>faixa</b> mostra a menor e a maior taxa vista naquele plano: variação grande num mesmo plano '+
      'costuma indicar bandeiras com preço diferente.</div></div>';
  }

  // ── blocos por forma ──
  if (temCampo("cartao")) html += tabelaCruzamento();
  if (temCampo("cartao")) html += blocosForma("cartao","Cartão","maquininha");
  if (temCampo("pix"))    html += blocosForma("pix","PIX","conta");
  res.innerHTML = html;

  function caixaBox(titulo,hint,tabela,nota){
    return '<div class="box"><div class="box-h"><h3>'+titulo+'</h3>'+
      (hint?'<span class="hint">'+hint+'</span>':'')+'</div>'+
      '<div class="scroll"><table>'+tabela+'</table></div>'+
      (nota?'<div class="nota">'+nota+'</div>':'')+'</div>';
  }
  function vazioOk(msg){ return '<tbody><tr><td class="vazio-ok">✓ '+msg+'</td></tr></tbody>'; }

  function blocosForma(campo,rot,ladoExt){
    const trocadas=juntar(campo,r=>r.trocadas), soExt=juntar(campo,r=>r.soExterno),
          soErp=juntar(campo,r=>r.soErp), cent=juntar(campo,r=>r.centavos), agr=juntar(campo,r=>r.agrupadas);
    let h="";

    // totais por dia
    const porDia={};
    lojas.forEach(l=>{ const r=conciliacoes[l][campo]; if(!r) return;
      r.erp.forEach(e=>{ (porDia[e.d]=porDia[e.d]||{a:0,b:0,na:0,nb:0}).a+=e[campo]; porDia[e.d].na++; });
      r.externos.forEach(t=>{ (porDia[t.d]=porDia[t.d]||{a:0,b:0,na:0,nb:0}).b+=t.v; porDia[t.d].nb++; });
    });
    const dias=Object.keys(porDia).sort().reverse();
    h += caixaBox(rot+" — totais por dia", "ERP × "+ladoExt,
      '<thead><tr><th>Data</th><th>ERP</th><th>'+ladoExt.charAt(0).toUpperCase()+ladoExt.slice(1)+'</th>'+
      '<th>Diferença</th><th>docs / lançamentos</th></tr></thead><tbody>'+
      dias.map(d=>{const p=porDia[d], dif=Math.round((p.a-p.b)*100)/100;
        return '<tr><td><b>'+dBR(d)+'</b> <span style="color:var(--muted);font-size:11px">'+diaSem(d)+'</span></td>'+
          '<td class="num">'+nf2(p.a)+'</td><td class="num">'+nf2(p.b)+'</td>'+
          '<td class="'+cls(dif)+'">'+nf2(dif)+'</td>'+
          '<td class="num zero">'+p.na+' / '+p.nb+'</td></tr>';}).join("")+'</tbody>');

    h += caixaBox("⚠️ "+rot+": forma de pagamento trocada",
      "entrou como "+rot+" mas a venda foi finalizada de outro jeito",
      trocadas.length
        ? '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Valor</th>'+
          '<th style="text-align:left">Na '+ladoExt+'</th><th style="text-align:left">No ERP</th><th style="text-align:left">Documento</th></tr></thead><tbody>'+
          trocadas.sort((a,b)=>a.t.d<b.t.d?1:-1).map(x=>
            '<tr><td><b>'+dBR(x.t.d)+'</b> '+(x.t.h?'<span style="color:var(--muted);font-size:11px">'+x.t.h+'</span>':'')+'</td>'+
            '<td style="text-align:left">'+tagLoja(x.loja)+'</td>'+
            '<td class="num falta">'+nf2(x.t.v)+'</td>'+
            '<td style="text-align:left">'+esc2((x.t.meio||x.t.tipo||"")+(x.t.band?" "+x.t.band:""))+'</td>'+
            '<td style="text-align:left">'+esc2(x.formas)+'</td>'+
            '<td style="text-align:left">'+esc2(x.e.doc)+(x.ambiguo?' <span style="color:var(--alerta)" title="mais de um documento com esse valor">⚠</span>':'')+'</td></tr>').join("")+'</tbody>'
        : vazioOk("nenhuma forma de pagamento trocada"),
      "O dinheiro entrou, mas está classificado errado no ERP. Não falta valor — falta corrigir a forma, "+
      "senão a conferência de caixa e o recebível ficam ambos errados.");

    h += caixaBox("🔴 "+rot+" na "+ladoExt+", sem venda no ERP", "entrou dinheiro e não há venda com esse valor",
      soExt.length
        ? '<thead><tr><th>Data</th><th>Hora</th><th style="text-align:left">Loja</th><th>Valor</th>'+
          '<th style="text-align:left">Detalhe</th><th style="text-align:left">Cliente</th></tr></thead><tbody>'+
          soExt.sort((a,b)=>a.d<b.d?1:-1).map(t=>
            '<tr><td><b>'+dBR(t.d)+'</b></td><td class="num zero">'+esc2(t.h)+'</td>'+
            '<td style="text-align:left">'+tagLoja(t.loja)+'</td>'+
            '<td class="num falta"><b>'+nf2(t.v)+'</b></td>'+
            '<td style="text-align:left">'+esc2((t.meio||t.tipo||"")+(t.band?" "+t.band:""))+'</td>'+
            '<td style="text-align:left">'+esc2(t.nome||t.nsu||"")+'</td></tr>').join("")+
          '<tr><td colspan="3"><b>Total</b></td><td class="num falta"><b>'+nf2(soExt.reduce((a,t)=>a+t.v,0))+'</b></td><td colspan="2"></td></tr></tbody>'
        : vazioOk("todo "+rot+" da "+ladoExt+" tem venda no ERP"));

    h += caixaBox("🟠 "+rot+" no ERP, sem lançamento na "+ladoExt, "venda finalizada sem entrada correspondente",
      soErp.length
        ? '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>'+rot+' no ERP</th>'+
          '<th>Total do documento</th><th style="text-align:left">Documento</th></tr></thead><tbody>'+
          soErp.sort((a,b)=>a.d<b.d?1:-1).map(e=>
            '<tr><td><b>'+dBR(e.d)+'</b></td><td style="text-align:left">'+tagLoja(e.loja)+'</td>'+
            '<td class="num falta"><b>'+nf2(e[campo])+'</b></td><td class="num zero">'+nf2(e.v)+'</td>'+
            '<td style="text-align:left">'+esc2(e.doc)+'</td></tr>').join("")+
          '<tr><td colspan="2"><b>Total</b></td><td class="num falta"><b>'+nf2(soErp.reduce((a,e)=>a+e[campo],0))+'</b></td><td colspan="2"></td></tr></tbody>'
        : vazioOk("todo "+rot+" do ERP tem lançamento na "+ladoExt),
      campo==="pix"
        ? "Venda registrada como PIX que não caiu nesta conta. Pode ter caído em outra chave — ou ter sido paga em dinheiro, e aí sobra na gaveta."
        : "Pode ser venda em outra maquininha, ou venda finalizada como cartão sem a cobrança ter acontecido.");

    if (cent.length) h += caixaBox("🟡 "+rot+": diferença de centavos", "mesmo lançamento, valor diferente",
      '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>ERP</th><th>'+ladoExt+'</th>'+
      '<th>Diferença</th><th style="text-align:left">Documento</th></tr></thead><tbody>'+
      cent.sort((a,b)=>a.e.d<b.e.d?1:-1).map(x=>
        '<tr><td><b>'+dBR(x.e.d)+'</b></td><td style="text-align:left">'+tagLoja(x.loja)+'</td>'+
        '<td class="num">'+nf2(x.e[campo])+'</td><td class="num">'+nf2(x.t.v)+'</td>'+
        '<td class="'+cls(x.e[campo]-x.t.v)+'">'+nf2(x.e[campo]-x.t.v)+'</td>'+
        '<td style="text-align:left">'+esc2(x.e.doc)+'</td></tr>').join("")+'</tbody>');

    if (agr.length) h += caixaBox("✅ "+rot+": um lançamento pagando vários documentos", "normal — registrado para conferência",
      '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Lançamento</th><th style="text-align:left">Documentos</th></tr></thead><tbody>'+
      agr.map(x=>'<tr><td><b>'+dBR(x.t.d)+'</b></td><td style="text-align:left">'+tagLoja(x.loja)+'</td>'+
        '<td class="num">'+nf2(x.t.v)+'</td><td style="text-align:left">'+
        x.docs.map(dd=>esc2(dd.doc)+" ("+nf2(dd[campo])+")").join(" + ")+'</td></tr>').join("")+'</tbody>');

    return h;
  }
}
const esc2 = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function removerConcil(lj){ delete conciliacoes[lj]; rConcil(); }

async function carregarArquivos(files){
  const err=document.getElementById("c-erro");
  err.textContent="";
  const lj=document.getElementById("c-loja").value;
  const erros=[];
  for (const f of files){
    try{
      if (!/\.csv$/i.test(f.name))
        throw new Error("só aceito .csv — no xlsx eu não consigo ler. Exporte em CSV.");
      const txt=await f.text();
      const linhas=parseCSV(txt);
      const tipo=detectarTipo(linhas);
      const alvo = conciliacoes[lj] = conciliacoes[lj] || {loja:lj, arquivos:[]};

      if (tipo==="maquininha"){
        const trans=lerTransacoes(linhas);
        const cartoes=trans.filter(t=>t.cartao);
        alvo.cartao = conciliarForma(lj, cartoes, "car", "cartão", trans);
        alvo.arquivos.push({nome:f.name, tipo:"maquininha", conteudo:txt});
      } else if (tipo==="extrato"){
        const ext=lerExtrato(linhas);
        const recebidos=ext.filter(t=>t.classe==="pix_recebido");
        alvo.pix = conciliarForma(lj, recebidos, "pix", "PIX recebido", ext);
        alvo.conta = {
          pixRecebido: recebidos.reduce((a,t)=>a+t.v,0),
          pixEnviado: ext.filter(t=>t.classe==="pix_enviado").reduce((a,t)=>a+t.v,0),
          depositos: ext.filter(t=>t.classe==="deposito").reduce((a,t)=>a+t.v,0),
          nDepositos: ext.filter(t=>t.classe==="deposito").length,
          estornos: ext.filter(t=>t.classe==="estorno").reduce((a,t)=>a+t.v,0),
          ini: ext.map(t=>t.d).sort()[0], fim: ext.map(t=>t.d).sort().slice(-1)[0],
        };
        alvo.arquivos.push({nome:f.name, tipo:"extrato", conteudo:txt});
      } else {
        throw new Error("não reconheci o arquivo. Espero o relatório da maquininha (com coluna de forma de pagamento) ou o extrato da conta (com \\u0022Tipo de transação\\u0022 e \\u0022Detalhe\\u0022).");
      }
    }catch(e){
      erros.push("❌ "+f.name+": "+(e.message||e));
    }
  }
  err.innerHTML=erros.join("<br>");
  rConcil();
  // Guarda sozinho: o pedido é que a conferência não se perca ao fechar a aba.
  for (const lj2 of Object.keys(conciliacoes)) {
    if (!conciliacoes[lj2].doHistorico) await salvarConciliacao(lj2);
  }
}


// ══ 6. VENDAS CANCELADAS ══
const crit = (ok,t) => '<span class="crit '+(ok?'crit-ok':'crit-no')+'">'+(ok?'✓':'✗')+' '+t+'</span>';
const CONF_CANC = { forte:['p-ok','voltou'], media:['p-nc','provável'], fraca:['p-nf','duvidoso'] };

function rCanc(){
  const lj = selLoja.value;
  const todas = [];
  Object.keys(D.canceladas||{}).forEach(l=>{
    if (lj && l!==lj) return;
    (D.canceladas[l]||[]).forEach(c=>todas.push({...c, loja:l}));
  });
  // respeita o filtro de período da barra de cima
  const datas=[...new Set(D.dias.map(d=>d.data))].sort();
  const np=parseInt(document.getElementById("f-per").value,10);
  const corte = np<999 ? datas[Math.max(0,datas.length-np)] : "0000";
  const ds = todas.filter(c=>c.d>=corte).sort((a,b)=> a.d<b.d?1:a.d>b.d?-1:(a.h<b.h?1:-1));

  const voltou = ds.filter(c=>c.refeita);
  const fortes = ds.filter(c=>c.refeita && c.refeita.conf==="forte");
  const sem    = ds.filter(c=>!c.refeita);
  const valorSem = sem.reduce((a,c)=>a+c.v,0);
  const semMotivo = ds.filter(c=>!c.motivo).length;

  document.getElementById("kpi-canc").innerHTML =
    kpi("Cancelamentos", ds.length, "no período filtrado", "#7c3aed") +
    kpi("Valor cancelado", nf2(ds.reduce((a,c)=>a+c.v,0)), voltou.length+" voltaram depois", "#0891b2") +
    kpi("Não voltaram", sem.length, nf2(valorSem)+" sem venda equivalente",
        sem.length?"var(--falta)":"var(--ok)", sem.length?"var(--falta)":"var(--ok)") +
    kpi("Sem motivo informado", semMotivo, semMotivo?"ninguém preencheu no POS":"todos justificados",
        "var(--alerta)", semMotivo?"#b45309":"var(--ok)");

  const soSem = document.getElementById("canc-so-sem");
  const mostrar = (soSem && soSem.checked) ? sem : ds;

  const linhas = mostrar.map(c=>{
    const r=c.refeita;
    const p = r ? (CONF_CANC[r.conf]||CONF_CANC.fraca) : ['p-div','não voltou'];
    const formas = r && r.formas && r.formas.length
      ? r.formas.map(f=>f.k+" "+nf2(f.v)).join(", ")
      : (r ? "sem forma" : "—");
    // Quando houve verificação fina, mostra QUAIS critérios bateram — é a diferença
    // entre "achei uma venda do mesmo valor" e "é a mesma venda".
    const criterios = r && r.verificada
      ? '<div class="criterios">'+
        crit(r.mesmoDia,"data") + crit(r.minutos!=null && r.minutos<=30, r.minutos!=null?("hora ±"+r.minutos+"min"):"hora") +
        crit(r.mesmaVendedora,"vendedora") + crit(r.mesmosProdutos,"produtos") + '</div>'
      : "";
    return '<tr class="'+(r?"":"linha-ruim")+'">'+
      '<td><b>'+dBR(c.d)+'</b> <span style="color:var(--muted);font-size:11px">'+esc2(c.h)+'</span></td>'+
      '<td style="text-align:left"><span class="loja-tag" style="background:'+corLoja(c.loja)+'">'+c.loja+'</span></td>'+
      '<td style="text-align:left">'+esc2(c.doc)+'<span class="zero">/'+esc2(c.serie)+'</span></td>'+
      '<td class="num"><b>'+nf2(c.v)+'</b></td>'+
      '<td style="text-align:left" class="zero">'+esc2(c.vendedor.replace(/\s*\(\d+\)$/,""))+'</td>'+
      '<td style="text-align:left">'+(c.motivo?esc2(c.motivo):'<span class="zero">— em branco —</span>')+'</td>'+
      '<td style="text-align:left">'+(r?esc2(r.doc.split("|")[0])+' <span class="zero">'+dBR(r.data)+'</span>':'<span class="zero">—</span>')+'</td>'+
      '<td style="text-align:left">'+(r?'<b>'+esc2(formas)+'</b>'+criterios:'<span class="zero">—</span>')+'</td>'+
      '<td><span class="pill '+p[0]+'">'+p[1]+'</span></td>'+
    '</tr>';
  }).join("");

  document.getElementById("t-canc").innerHTML =
    '<thead><tr><th>Cancelada em</th><th style="text-align:left">Loja</th><th style="text-align:left">Documento</th>'+
    '<th>Valor</th><th style="text-align:left">Vendedor</th><th style="text-align:left">Motivo</th>'+
    '<th style="text-align:left">Venda refeita</th><th style="text-align:left">Paga como</th>'+
    '<th style="text-align:left">Situação</th></tr></thead>'+
    '<tbody>'+(linhas || '<tr><td colspan="9" class="vazio">Nenhum cancelamento no período.</td></tr>')+'</tbody>';
}

function render(){ rConf(); rFormas(); rSangria(); rBanco(); rCanc(); }

// Só roda depois que a senha decifrou os dados (D deixa de ser null).
let iniciado = false;
function iniciar(){
  if (iniciado) return;
  iniciado = true;
  D.lojas.forEach(l => {
    const o=document.createElement("option");
    o.value=l.key; o.textContent=l.key+" · "+l.nome+" "+l.cidade;
    selLoja.appendChild(o);
  });
  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll(".pane").forEach(x=>x.classList.remove("on"));
    t.classList.add("on");
    document.getElementById("p-"+t.dataset.p).classList.add("on");
  }));
  selLoja.addEventListener("change", render);
  document.getElementById("f-per").addEventListener("change", render);

  // ── conciliação: seletor de loja + dropzone ──
  const cl=document.getElementById("c-loja");
  D.lojas.forEach(l=>{
    const o=document.createElement("option");
    o.value=l.key; o.textContent=l.key+" · "+l.nome+" "+l.cidade;
    cl.appendChild(o);
  });
  // Trocar de loja limpa o resultado da tela. Antes o painel acumulava as lojas e a
  // conferência da anterior ficava visível, dando a impressão de ser da loja recém
  // selecionada. Só limpa a TELA — o histórico continua guardado.
  cl.addEventListener("change", ()=>{
    Object.keys(conciliacoes).forEach(k=>delete conciliacoes[k]);
    const err=document.getElementById("c-erro"); if (err) err.innerHTML="";
    rConcil();
    carregarHistorico();
  });

  const dz=document.getElementById("dropzone"), fi=document.getElementById("c-file");
  dz.addEventListener("click", ()=>fi.click());
  fi.addEventListener("change", e=>{ carregarArquivos([...e.target.files]); fi.value=""; });
  ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.add("on"); }));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.remove("on"); }));
  dz.addEventListener("drop", e=>{ carregarArquivos([...(e.dataTransfer?.files||[])]); });
  carregarHistorico();

  render();
}
