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

const brNum = s => {
  const t=String(s||"").trim().replace(/R\$\s*/,"");
  if(!t) return 0;
  // "1.234,56" (pt-BR) ou "1234.56"
  const v = /,\d{1,2}$/.test(t) ? parseFloat(t.replace(/\./g,"").replace(",",".")) : parseFloat(t.replace(/,/g,""));
  return Number.isFinite(v)? Math.round(v*100)/100 : 0;
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

function lerTransacoes(linhas){
  if (!linhas.length) throw new Error("arquivo vazio ou sem linhas de dados");
  const a=linhas[0];
  const cData=acharCol(a,"^data e hora","^data"), cValor=acharCol(a,"^valor \\(","^valor$","valor bruto"),
        cMeio=acharCol(a,"meio - meio","forma","tipo de pagamento","^meio"),
        cStatus=acharCol(a,"status"), cBand=acharCol(a,"bandeira"),
        cNsu=acharCol(a,"nsu","identificador"), cNome=acharCol(a,"origem - nome","cliente","portador");
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
      u:false,
    });
  }
  if (!out.length) throw new Error("nenhuma transação aprovada encontrada no arquivo");
  return out;
}

const diasEntre = (a,b) => Math.round((new Date(a+"T00:00:00") - new Date(b+"T00:00:00"))/864e5);

function conciliar(loja, trans){
  const movLoja = (D.movimento && D.movimento[loja]) || [];
  if (!movLoja.length) throw new Error("o painel ainda não tem o movimento diário da "+loja+" — rode a atualização do dashboard antes.");

  const cartoes = trans.filter(t=>t.cartao);
  if (!cartoes.length) throw new Error("o arquivo não tem transações de cartão");
  const datas = cartoes.map(t=>t.d).sort();
  const ini=datas[0], fim=datas[datas.length-1];

  // O painel só tem o movimento de uma janela. Se o relatório da maquininha for de fora
  // dela, o lado do ERP viria vazio e TODA transação apareceria como "sem venda" — erro
  // grave e silencioso. Melhor recusar com a mensagem certa.
  if (D.movimentoPeriodo){
    const jIni=isoDe(D.movimentoPeriodo.ini), jFim=isoDe(D.movimentoPeriodo.fim);
    if (ini < jIni || fim > jFim)
      throw new Error("o relatório vai de "+dBR(ini)+" a "+dBR(fim)+", mas o painel só tem o movimento do ERP de "
        +dBR(jIni)+" a "+dBR(jFim)+". Carregue um relatório desse período.");
  }

  // ERP: só documentos com cartão, dentro da janela do relatório da maquininha
  const erp = movLoja.filter(x=>x.car>0 && x.d>=ini && x.d<=fim).map(x=>({...x,u:false}));

  const centavos=[], agrupadas=[];
  const casar=(jan,tol,reg)=>{
    for (const t of cartoes){
      if (t.u) continue;
      for (const e of erp){
        if (e.u || Math.abs(diasEntre(e.d,t.d))>jan) continue;
        if (Math.abs(e.car-t.v)<=tol){
          t.u=e.u=true; e.par=t;
          if (reg && Math.abs(e.car-t.v)>0.005) reg.push({e,t});
          break;
        }
      }
    }
  };
  [0,1,3].forEach(j=>casar(j,0.005));
  [0,1].forEach(j=>casar(j,0.15,centavos));

  // uma cobrança pagando 2 ou 3 documentos
  for (const t of cartoes){
    if (t.u) continue;
    const c=erp.filter(e=>!e.u && Math.abs(diasEntre(e.d,t.d))<=1);
    let achou=false;
    for (const k of [2,3]){
      const combos=combinacoes(c,k);
      for (const combo of combos){
        if (Math.abs(combo.reduce((a,x)=>a+x.car,0)-t.v)<=0.05){
          t.u=true; combo.forEach(x=>x.u=true); agrupadas.push({t,docs:combo}); achou=true; break;
        }
      }
      if (achou) break;
    }
  }

  // sobras: tenta explicar como forma de pagamento trocada
  const trocadas=[], soMaquina=[], soErp=[];
  for (const t of cartoes.filter(x=>!x.u)){
    const cand = movLoja.filter(e=>Math.abs(diasEntre(e.d,t.d))<=1 && Math.abs(e.v-t.v)<=0.10 && e.car<=0.005);
    if (cand.length){
      const e=cand[0];
      const formas=[];
      if(e.din>0) formas.push("dinheiro "+nf2(e.din));
      if(e.pix>0) formas.push("PIX "+nf2(e.pix));
      if(e.lnk>0) formas.push("link "+nf2(e.lnk));
      trocadas.push({lado:"maquina", t, e, formas:formas.join(", ")||"outra forma", ambiguo:cand.length>1});
    } else soMaquina.push(t);
  }
  for (const e of erp.filter(x=>!x.u)){
    const cand = trans.filter(t=>!t.cartao && Math.abs(diasEntre(t.d,e.d))<=1 && Math.abs(t.v-e.car)<=0.10);
    if (cand.length) trocadas.push({lado:"erp", t:cand[0], e, formas:cand[0].meio, ambiguo:cand.length>1});
    else soErp.push(e);
  }

  return {
    loja, ini, fim,
    totERP: erp.reduce((a,e)=>a+e.car,0),
    totMaq: cartoes.reduce((a,t)=>a+t.v,0),
    nERP: erp.length, nMaq: cartoes.length,
    trans, cartoes, erp, centavos, agrupadas, trocadas, soMaquina, soErp,
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

// ── estado e render ──
const conciliacoes = {};   // loja -> resultado

function rConcil(){
  const chips=document.getElementById("c-carregados");
  const lojas=Object.keys(conciliacoes);
  chips.innerHTML = lojas.map(lj=>
    '<span class="chip-arq">✓ '+lj+' · '+conciliacoes[lj].nome+' <button onclick="removerConcil(\''+lj+'\')" title="remover">×</button></span>').join("");

  const res=document.getElementById("c-resultado");
  if (!lojas.length){ res.style.display="none"; return; }
  res.style.display="block";

  // junta todas as lojas carregadas
  const R=lojas.map(l=>conciliacoes[l].r);
  const somar=f=>R.reduce((a,r)=>a+f(r),0);
  const juntar=f=>R.flatMap(r=>f(r).map(x=>({...x,loja:r.loja})));

  const totERP=somar(r=>r.totERP), totMaq=somar(r=>r.totMaq);
  const trocadas=juntar(r=>r.trocadas), soMaq=juntar(r=>r.soMaquina),
        soErp=juntar(r=>r.soErp), cent=juntar(r=>r.centavos), agr=juntar(r=>r.agrupadas);
  const nInc=trocadas.length+soMaq.length+soErp.length;

  document.getElementById("kpi-concil").innerHTML =
    kpi("Cartão no ERP", nf2(totERP), somar(r=>r.nERP)+" documento(s)", "#6366f1") +
    kpi("Cartão na maquininha", nf2(totMaq), somar(r=>r.nMaq)+" transação(ões)", "#0891b2") +
    kpi("Diferença", nf2(totERP-totMaq), Math.abs(totERP-totMaq)<=0.5?"praticamente fecha":"o total não fecha",
        Math.abs(totERP-totMaq)<=0.5?"var(--ok)":"var(--falta)", Math.abs(totERP-totMaq)<=0.5?"var(--ok)":"var(--falta)") +
    kpi("Inconsistências", nInc, nInc? "exigem ação" : "nada a corrigir",
        nInc?"var(--falta)":"var(--ok)", nInc?"var(--falta)":"var(--ok)");

  // totais por dia
  const porDia={};
  R.forEach(r=>{
    r.erp.forEach(e=>{ (porDia[e.d]=porDia[e.d]||{erp:0,maq:0,ne:0,nm:0}).erp+=e.car; porDia[e.d].ne++; });
    r.cartoes.forEach(t=>{ (porDia[t.d]=porDia[t.d]||{erp:0,maq:0,ne:0,nm:0}).maq+=t.v; porDia[t.d].nm++; });
  });
  const dias=Object.keys(porDia).sort().reverse();
  document.getElementById("t-concil-dias").innerHTML =
    '<thead><tr><th>Data</th><th>ERP</th><th>Maquininha</th><th>Diferença</th><th>docs / transações</th></tr></thead><tbody>'+
    dias.map(d=>{ const p=porDia[d]; const dif=Math.round((p.erp-p.maq)*100)/100;
      return '<tr><td><b>'+dBR(d)+'</b> <span style="color:var(--muted);font-size:11px">'+diaSem(d)+'</span></td>'+
        '<td class="num">'+nf2(p.erp)+'</td><td class="num">'+nf2(p.maq)+'</td>'+
        '<td class="'+cls(dif)+'">'+nf2(dif)+'</td>'+
        '<td class="num zero">'+p.ne+' / '+p.nm+'</td></tr>';}).join("")+'</tbody>';

  const tagLoja=l=>'<span class="loja-tag" style="background:'+corLoja(l)+'">'+l+'</span>';
  const vazio=(id,msg)=>document.getElementById(id).innerHTML='<tbody><tr><td class="vazio-ok">✓ '+msg+'</td></tr></tbody>';

  // trocadas
  if (trocadas.length) document.getElementById("t-trocada").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Valor</th>'+
    '<th style="text-align:left">Na maquininha</th><th style="text-align:left">No ERP</th><th style="text-align:left">Documento</th></tr></thead><tbody>'+
    trocadas.sort((a,b)=>a.t.d<b.t.d?1:-1).map(x=>
      '<tr><td><b>'+dBR(x.t.d)+'</b> '+(x.t.h?'<span style="color:var(--muted);font-size:11px">'+x.t.h+'</span>':'')+'</td>'+
      '<td style="text-align:left">'+tagLoja(x.loja)+'</td>'+
      '<td class="num falta">'+nf2(x.t.v)+'</td>'+
      '<td style="text-align:left">'+esc2(x.t.meio)+(x.t.band?" "+esc2(x.t.band):"")+'</td>'+
      '<td style="text-align:left">'+esc2(x.formas)+'</td>'+
      '<td style="text-align:left">'+esc2(x.e.doc)+(x.ambiguo?' <span style="color:var(--alerta)" title="mais de um documento com esse valor">⚠</span>':'')+'</td></tr>').join("")+'</tbody>';
  else vazio("t-trocada","nenhuma forma de pagamento trocada");

  // só maquininha
  if (soMaq.length) document.getElementById("t-so-maquina").innerHTML =
    '<thead><tr><th>Data</th><th>Hora</th><th style="text-align:left">Loja</th><th>Valor</th>'+
    '<th style="text-align:left">Forma</th><th style="text-align:left">Cliente / NSU</th></tr></thead><tbody>'+
    soMaq.sort((a,b)=>a.d<b.d?1:-1).map(t=>
      '<tr><td><b>'+dBR(t.d)+'</b></td><td class="num zero">'+esc2(t.h)+'</td>'+
      '<td style="text-align:left">'+tagLoja(t.loja)+'</td>'+
      '<td class="num falta"><b>'+nf2(t.v)+'</b></td>'+
      '<td style="text-align:left">'+esc2(t.meio)+(t.band?" "+esc2(t.band):"")+'</td>'+
      '<td style="text-align:left">'+esc2(t.nome||t.nsu)+'</td></tr>').join("")+
    '<tr><td colspan="3"><b>Total</b></td><td class="num falta"><b>'+nf2(soMaq.reduce((a,t)=>a+t.v,0))+'</b></td><td colspan="2"></td></tr></tbody>';
  else vazio("t-so-maquina","toda cobrança da maquininha tem venda no ERP");

  // só ERP
  if (soErp.length) document.getElementById("t-so-erp").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Cartão no ERP</th><th>Total do documento</th><th style="text-align:left">Documento</th></tr></thead><tbody>'+
    soErp.sort((a,b)=>a.d<b.d?1:-1).map(e=>
      '<tr><td><b>'+dBR(e.d)+'</b></td><td style="text-align:left">'+tagLoja(e.loja)+'</td>'+
      '<td class="num falta"><b>'+nf2(e.car)+'</b></td><td class="num zero">'+nf2(e.v)+'</td>'+
      '<td style="text-align:left">'+esc2(e.doc)+'</td></tr>').join("")+
    '<tr><td colspan="2"><b>Total</b></td><td class="num falta"><b>'+nf2(soErp.reduce((a,e)=>a+e.car,0))+'</b></td><td colspan="2"></td></tr></tbody>';
  else vazio("t-so-erp","todo cartão do ERP tem cobrança na maquininha");

  // centavos
  if (cent.length) document.getElementById("t-centavos").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>ERP</th><th>Maquininha</th><th>Diferença</th><th style="text-align:left">Documento</th></tr></thead><tbody>'+
    cent.sort((a,b)=>a.e.d<b.e.d?1:-1).map(x=>
      '<tr><td><b>'+dBR(x.e.d)+'</b></td><td style="text-align:left">'+tagLoja(x.loja)+'</td>'+
      '<td class="num">'+nf2(x.e.car)+'</td><td class="num">'+nf2(x.t.v)+'</td>'+
      '<td class="'+cls(x.e.car-x.t.v)+'">'+nf2(x.e.car-x.t.v)+'</td>'+
      '<td style="text-align:left">'+esc2(x.e.doc)+'</td></tr>').join("")+'</tbody>';
  else vazio("t-centavos","nenhuma diferença de centavos");

  // agrupadas
  document.getElementById("bx-agrupada").style.display = agr.length? "" : "none";
  if (agr.length) document.getElementById("t-agrupada").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Cobrança</th><th style="text-align:left">Documentos</th></tr></thead><tbody>'+
    agr.map(x=>'<tr><td><b>'+dBR(x.t.d)+'</b></td><td style="text-align:left">'+tagLoja(x.loja)+'</td>'+
      '<td class="num">'+nf2(x.t.v)+'</td><td style="text-align:left">'+
      x.docs.map(dd=>esc2(dd.doc)+" ("+nf2(dd.car)+")").join(" + ")+'</td></tr>').join("")+'</tbody>';
}
const esc2 = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function removerConcil(lj){ delete conciliacoes[lj]; rConcil(); }

async function carregarArquivos(files){
  const err=document.getElementById("c-erro");
  err.textContent="";
  const lj=document.getElementById("c-loja").value;
  for (const f of files){
    try{
      if (!/\.csv$/i.test(f.name)) throw new Error("só aceito .csv — exporte o relatório da maquininha em CSV.");
      const txt=await f.text();
      const trans=lerTransacoes(parseCSV(txt));
      const r=conciliar(lj, trans);
      conciliacoes[lj]={nome:f.name, r};
    }catch(e){
      err.textContent="❌ "+f.name+": "+(e.message||e);
    }
  }
  rConcil();
}

function render(){ rConf(); rFormas(); rSangria(); rBanco(); }

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
  const dz=document.getElementById("dropzone"), fi=document.getElementById("c-file");
  dz.addEventListener("click", ()=>fi.click());
  fi.addEventListener("change", e=>{ carregarArquivos([...e.target.files]); fi.value=""; });
  ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.add("on"); }));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.remove("on"); }));
  dz.addEventListener("drop", e=>{ carregarArquivos([...(e.dataTransfer?.files||[])]); });

  render();
}
