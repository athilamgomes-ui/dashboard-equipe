let D = null;                       // preenchido só depois da senha correta
document.getElementById("selo-data").textContent = PUBLICO.geradoEmBR;

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
  await carregarContagem();
  await carregarVencidos();
  iniciar();
  try{ sessionStorage.setItem('estoque_ok', pass); }catch(e){}
}
async function tentarSenha(e){
  e.preventDefault();
  const err=document.getElementById('lockerr'); err.textContent='…';
  try{ await abrir(document.getElementById('senha').value); err.textContent=''; }
  catch(_){ err.textContent='Senha incorreta.'; }
  return false;
}
(async()=>{ try{ const s=sessionStorage.getItem('estoque_ok'); if(s) await abrir(s); }catch(e){} })();

// ── util ──
const nf  = n => (n<0?"-":"")+"R$ "+Math.abs(Math.round(n||0)).toLocaleString("pt-BR");
const nf2 = n => (n<0?"-":"")+"R$ "+Math.abs(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const nq  = n => (Math.round((n||0)*100)/100).toLocaleString("pt-BR");
const dBR = s => s ? s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4) : "—";
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cor = k => (D.lojas.find(l=>l.key===k)||{}).cor||"#64748b";
const nomeLoja = k => { const l=D.lojas.find(x=>x.key===k); return l? l.nome+" "+l.cidade : k; };
const pillLoja = k => '<span class="pill p-lj" style="background:'+cor(k)+'22;color:'+cor(k)+'">'+k+'</span>';
const cls = v => Math.abs(v)<.001?"zero":(v<0?"neg":"pos");
// Os nomes têm que ser entendidos por quem cuida do estoque, sem legenda: "sem documento" não
// dizia nada. Cada classe responde "para onde foi essa unidade?" em português de prateleira.
const CLASSES = {
  semdoc:["p-semdoc","sumiu sem explicação"],
  espelhado:["p-espelhado","foi para a outra loja"],
  divisao2:["p-divisao2","metade da nota foi para a outra loja"],
  pacote:["p-pacote","erro de pacote × unidade"],
  ruido:["p-ruido","diferença de contagem (até 3 un.)"],
  deposito2:["p-deposito2","foi para Devolvidos"],
  ajuste_mao:["p-pacote","alguém mexeu no saldo sem nota"],
  ajuste_mao_parcial:["p-semdoc","mexeram no saldo — explica só parte"]
};
// Três situações, não duas: explicado por inteiro, explicado em parte, e o que ninguém sabe.
const JUSTIFICADO = { espelhado:1, divisao2:1, pacote:1, ruido:1, deposito2:1, ajuste_mao:1 };
const PARCIAL = { ajuste_mao_parcial:1 };
const tabela = (cols, linhas) =>
  '<div class="scroll"><table><thead><tr>'+cols.map(c=>'<th'+(c.n?' class="num"':'')+'>'+c.t+'</th>').join('')+'</tr></thead><tbody>'+
  (linhas.length?linhas.join(''):'<tr><td colspan="'+cols.length+'"><div class="vazio">nada aqui — ou o filtro não casou</div></td></tr>')+
  '</tbody></table></div>';
const box = (titulo, hint, corpo, nota) =>
  '<div class="box"><div class="box-h"><h3>'+titulo+'</h3><span class="hint">'+hint+'</span></div>'+corpo+
  (nota?'<div class="nota">'+nota+'</div>':'')+'</div>';

let aba = "rec";
// loja selecionada — o Athila pediu UMA loja por vez, não o consolidado (cada loja é uma
// situação: L1 e L4 já foram corrigidas, L3 e L5 esperam conferência física das gerentes).
let lojaSel = (()=>{ try{ return localStorage.getItem('estoque_loja') ?? 'L1'; }catch(e){ return 'L1'; } })();
const inpQ = document.getElementById("f-q");
const filtraLoja = arr => lojaSel ? arr.filter(x=>x.loja===lojaSel) : arr;
function filtraQ(arr){
  const q=(inpQ.value||"").trim().toLowerCase();
  if(!q) return arr;
  return arr.filter(x => (x.desc||"").toLowerCase().includes(q) || (x.marca||"").toLowerCase().includes(q) || String(x.cod||"").includes(q));
}
const base = arr => { let r = filtraQ(filtraLoja(arr)); return fCurva ? r.filter(x=>x.curva===fCurva) : r; };

// ── barra de lojas ──
const AGUARDA_CONFERENCIA = { L3:true, L5:true };
function renderLojaBar(){
  const b=document.getElementById("lojabar");
  const opc=[{key:"",nome:"Todas as lojas",cidade:"consolidado",cor:"#64748b"}].concat(D.lojas);
  b.innerHTML = opc.map(l=>{
    const k=D.kpis[l.key];
    const sub = l.key ? (k? k.pct+"% fecham" : "") : "visão geral";
    return '<div class="lojabtn'+(lojaSel===l.key?' on':'')+'" style="--lc:'+l.cor+'" data-l="'+l.key+'">'+
      (l.key||"Todas")+' <small>'+esc(l.key? l.cidade+" · "+sub : sub)+'</small></div>';
  }).join('');
  for(const el of b.querySelectorAll(".lojabtn")) el.onclick = () => {
    lojaSel = el.dataset.l;
    try{ localStorage.setItem('estoque_loja', lojaSel); }catch(e){}
    renderLojaBar(); renderKpis(); renderAviso(); pintar();
  };
}
function renderAviso(){
  const a=document.getElementById("aviso-loja");
  if(lojaSel && AGUARDA_CONFERENCIA[lojaSel]){
    const n=D.negativos.filter(x=>x.loja===lojaSel);
    a.style.display="block";
    a.innerHTML='⚠️ <b>'+lojaSel+' aguarda conferência física da gerente.</b> São '+n.length+
      ' produtos com saldo negativo ('+Math.round(n.reduce((s,x)=>s+x.sal,0))+' un) e eles <b>não devem ser zerados</b> antes da contagem — '+
      'zerar apaga a evidência de onde está o problema. Em L3, mais da metade do negativo é lixa da Santa Clara.';
  } else if(!lojaSel){
    a.style.display="block";
    a.innerHTML='Você está vendo as <b>quatro lojas somadas</b>. Cada loja é uma situação diferente — '+
      'L1 e L4 já passaram pelo zeramento de 19/08, L3 e L5 ainda não foram tocadas. Para agir, escolha uma loja.';
  } else a.style.display="none";
}

// ── KPIs ──
function renderKpis(){
  const g=document.getElementById("kpis");
  g.innerHTML = D.lojas.map(L=>{
    const k=D.kpis[L.key]||{};
    const pct = k.pct==null? "—" : k.pct+"%";
    const c = k.pct==null? "#94a3b8" : k.pct>=90? "#4ade80" : k.pct>=70? "#fbbf24" : "#f87171";
    return '<div class="kpi'+(lojaSel&&lojaSel!==L.key?' dim':'')+'" style="--kc:'+L.cor+';--kv:'+c+';cursor:pointer" onclick="selecionarLoja(\''+L.key+'\')">'+
      '<div class="lbl">'+L.key+' · '+esc(L.cidade)+'</div>'+
      '<div class="val">'+pct+'</div>'+
      '<div class="sub">'+(k.fecham||0).toLocaleString("pt-BR")+' de '+(k.comBalanco||0).toLocaleString("pt-BR")+' produtos fecham · '+
      (k.unidades||0).toLocaleString("pt-BR")+' un. sem documento</div>'+
      '<div class="bar"><i style="width:'+(k.pct||0)+'%;background:'+c+'"></i></div>'+
      '<div class="sub" style="margin-top:7px">'+(k.skus||0).toLocaleString("pt-BR")+' produtos na prateleira · '+nf(k.valor)+' foi o que a loja pagou por eles'+
        (function(){
          const c=(D.coletaLoja||{})[L.key];
          if(c==null) return '<br><span style="color:#fbbf24">coleta em data desconhecida</span>';
          const z=new Date(c), dl=new Date(z.getTime()-z.getTimezoneOffset()*60000).toISOString().slice(0,10);
          return dl!==D.geradoEm2 ? '<br><span style="color:#fbbf24">dado de '+dBR(dl)+'</span>' : '';
        })()+'</div>'+
    '</div>';
  }).join('');
}

// ── 1. reconciliação ──
let fClasse = "";
let fCurva = "";     // "" | S | A | B | C
function setCurva(v){ fCurva = (fCurva===v? "" : v); pintar(); }
const CURVA_COR = { S:"#a855f7", A:"#f59e0b", B:"#3b82f6", C:"#64748b" };
const pillCurva = c => '<span class="pill" style="background:'+CURVA_COR[c]+'22;color:'+CURVA_COR[c]+';font-weight:800">'+c+'</span>';
function barraCurva(arr){
  const cont={S:0,A:0,B:0,C:0};
  for(const x of arr) if(cont[x.curva]!==undefined) cont[x.curva]++;
  return '<div style="margin-bottom:10px">Curva: '+["S","A","B","C"].map(c=>
    '<span class="pill" style="cursor:pointer;background:'+CURVA_COR[c]+(fCurva&&fCurva!==c?'22':'')+';color:'+(fCurva===c?'#fff':CURVA_COR[c])+
    ';font-weight:800;margin-right:5px" onclick="setCurva(\''+c+'\')">'+c+' · '+cont[c]+'</span>').join('')+
    (fCurva?'<span class="pill p-ruido" style="cursor:pointer" onclick="setCurva(\''+fCurva+'\')">limpar</span>':'')+'</div>';
}
let fJust = "sem";     // "sem" = sem justificativa (abre aqui) · "com" · "" = tudo
function setJust(v){ fJust=v; fClasse=""; renderRec(); }
function renderRec(){
  const daLoja = filtraLoja(D.recon);
  const semJust = daLoja.filter(x=>!JUSTIFICADO[x.classe] && !PARCIAL[x.classe]);
  const parcial = daLoja.filter(x=>PARCIAL[x.classe]);
  const comJust = daLoja.filter(x=>JUSTIFICADO[x.classe]);
  let arr = base(D.recon);
  if(fJust==='sem') arr = arr.filter(x=>!JUSTIFICADO[x.classe] && !PARCIAL[x.classe]);
  if(fJust==='parte') arr = arr.filter(x=>PARCIAL[x.classe]);
  if(fJust==='com') arr = arr.filter(x=>JUSTIFICADO[x.classe]);
  if(fClasse) arr = arr.filter(x=>x.classe===fClasse);

  const un = l => Math.round(l.reduce((a,b)=>a+Math.abs(b.dif),0));
  const rs = l => Math.round(l.reduce((a,b)=>a+Math.abs(b.dif)*(b.custo||0),0));
  const unSem = un(semJust), unCom = un(comJust), unPar = un(parcial);
  const rsSem = rs(semJust), rsPar = rs(parcial);
  const subabas =
    '<div class="subtabs">'+
      '<div class="subtab'+(fJust==='sem'?' on':'')+'" onclick="setJust(\'sem\')">'+
        '<b>Sem explicação</b><small>'+semJust.length+' produtos · '+unSem.toLocaleString("pt-BR")+' un · '+nf(rsSem)+'</small></div>'+
      '<div class="subtab'+(fJust==='parte'?' on':'')+'" onclick="setJust(\'parte\')">'+
        '<b>Explicado em parte</b><small>'+parcial.length+' produtos · '+unPar.toLocaleString("pt-BR")+' un · '+nf(rsPar)+'</small></div>'+
      '<div class="subtab'+(fJust==='com'?' on':'')+'" onclick="setJust(\'com\')">'+
        '<b>Explicado por inteiro</b><small>'+comJust.length+' produtos · '+unCom.toLocaleString("pt-BR")+' un</small></div>'+
      '<div class="subtab'+(fJust===''?' on':'')+'" onclick="setJust(\'\')">'+
        '<b>Tudo</b><small>'+daLoja.length+' produtos</small></div>'+
    '</div>';

  // dentro da sub-aba, um chip por motivo (o modelo da conciliação da maquininha)
  const univ = fJust==='sem'? semJust : fJust==='parte'? parcial : fJust==='com'? comJust : daLoja;
  const cont = {}; for(const it of univ) cont[it.classe]=(cont[it.classe]||0)+1;
  const chips = Object.keys(CLASSES).filter(k=>cont[k]).map(k=>
    '<span class="pill '+CLASSES[k][0]+'" style="cursor:pointer;opacity:'+(fClasse&&fClasse!==k?.45:1)+'" onclick="setClasse(\''+k+'\')">'+
    CLASSES[k][1]+' · '+cont[k]+'</span>').join(' ') +
    (fClasse?' <span class="pill p-ruido" style="cursor:pointer" onclick="setClasse(\'\')">limpar</span>':'');

  const linhas = arr.slice(0,4000).map(it=>{
    const c = CLASSES[it.classe]||["p-ruido",it.classe||"—"];
    const rs = Math.abs(it.dif)*(it.custo||0);
    return '<tr><td>'+pillLoja(it.loja)+'</td><td class="num">'+it.cod+'</td><td class="d">'+esc(it.desc)+
      '<div class="hint">'+pillCurva(it.curva)+' '+esc(it.marca)+' · contado em '+dBR(it.bal_data)+' no balanço “'+esc(it.bal_nome)+'”</div></td>'+
      '<td class="num">'+nq(it.contado)+'</td><td class="num">'+nq(it.ent)+(it.canc?'<span class="neg"> −'+nq(it.canc)+'</span>':'')+'</td>'+
      '<td class="num">'+nq(it.ven)+'</td><td class="num">'+nq(it.esperado)+'</td>'+
      '<td class="num">'+nq(it.sal)+(it.tra?'<span class="hint"> +'+nq(it.tra)+' trâns.</span>':'')+'</td>'+
      '<td class="num '+cls(it.dif)+'">'+(it.dif>0?"+":"")+nq(it.dif)+'</td>'+
      '<td class="num">'+(rs?nf(rs):'<span class="hint">—</span>')+'</td>'+
      '<td><span class="pill '+c[0]+'">'+c[1]+'</span></td>'+
      '<td class="d hint">'+esc(it.detalhe||"")+
        (it.movimentos? '<div style="margin-top:4px">'+Object.entries(it.movimentos).map(([k,v])=>
          '<span class="pill p-ruido" style="margin:1px 3px 1px 0">'+esc(k)+' '+Math.round(v.qtd)+' un</span>').join('')+'</div>' : '')+
      '</td></tr>';
  });
  const cols=[{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Contado no balanço",n:1},{t:"Entrou depois",n:1},{t:"Vendeu depois",n:1},{t:"Deveria ter",n:1},{t:"Tem hoje",n:1},{t:"Diferença",n:1},{t:"Quanto isso custou",n:1},{t:"Para onde foi"},{t:"Detalhe"}];
  document.getElementById("p-rec").innerHTML = subabas + barraCurva(univ) +
    '<div style="margin-bottom:12px">'+chips+'</div>'+
    box(fJust==='sem'?"Sumiu e ninguém sabe para onde":fJust==='parte'?"Mexeram no saldo, mas a conta ainda não fecha":fJust==='com'?"Diferenças que já têm explicação":"Todos os produtos que não fecham",
      arr.length.toLocaleString("pt-BR")+" produtos"+(arr.length>4000?" (exibindo 4.000)":""),
      tabela(cols, linhas),
      "A conta de cada linha: <b>o que foi contado no balanço + o que entrou por nota − o que foi vendido = o que deveria ter hoje</b>. "+
      "A <b>diferença</b> é o que sobrou ou faltou em relação a isso, e <b>quanto isso custou</b> é essa diferença multiplicada pelo custo de compra. "+
      "Nota cancelada já entra descontada — sem isso, nota relançada apareceria como sumiço. "+
      "Só entram balanços de contagem dos últimos "+D.diasBalanco+" dias (desde "+dBR(D.corteBalanco)+"); "+
      "balanços de AJUSTE são injeção de saldo, não contagem, e ficam de fora.");
}
function setClasse(k){ fClasse=k; renderRec(); }

function selecionarLoja(k){
  lojaSel = k;
  try{ localStorage.setItem('estoque_loja', k); }catch(e){}
  renderLojaBar(); renderKpis(); renderAviso(); pintar();
}

// ── 2. cobertura ──
let fCob = "";   // "" | feito | naofeito
function setCob(v){ fCob=v; renderCob(); }
function renderCob(){
  let arr = filtraQ(filtraLoja(D.cobertura));
  if(fCob==='feito') arr = arr.filter(c=>c.feito);
  if(fCob==='naofeito') arr = arr.filter(c=>!c.feito);
  const todas = filtraLoja(D.cobertura);
  const nFeito = todas.filter(c=>c.feito).length, nNao = todas.length-nFeito;
  const chips =
    '<span class="pill p-ok" style="cursor:pointer;opacity:'+(fCob&&fCob!=='feito'?.45:1)+'" onclick="setCob(\'feito\')">balanço já feito · '+nFeito+'</span> '+
    '<span class="pill p-semdoc" style="cursor:pointer;opacity:'+(fCob&&fCob!=='naofeito'?.45:1)+'" onclick="setCob(\'naofeito\')">nunca contada · '+nNao+'</span> '+
    '<span class="pill p-ruido" style="cursor:pointer" onclick="setCob(\'\')">todas</span>';
  // ordem: primeiro o que JÁ foi feito, do balanço mais antigo para o mais novo (é o que vence
  // primeiro); depois as marcas nunca contadas, pelas de maior dinheiro parado.
  arr = arr.slice().sort((a,b)=>{
    if(a.feito!==b.feito) return a.feito? -1 : 1;
    if(a.feito) return (a.bal_data||"") < (b.bal_data||"") ? -1 : 1;
    return b.valor-a.valor;
  });
  const hoje = D.geradoEm2;
  const linhas = arr.map(c=>{
    const cr = c.pct>=90?"#4ade80":c.pct>=50?"#fbbf24":"#f87171";
    const dias = c.bal_data ? Math.round((new Date(hoje)-new Date(c.bal_data))/86400000) : null;
    return '<tr><td>'+pillLoja(c.loja)+'</td><td class="d">'+esc(c.marca)+'</td>'+
      '<td>'+(c.bal_data? dBR(c.bal_data)+' <span class="hint">('+dias+' dias · '+esc(c.bal_nome||'')+')</span>'
                        : '<span class="pill p-semdoc">nunca contada</span>')+'</td>'+
      '<td class="num">'+c.skus+'</td><td class="num">'+c.contados+'</td>'+
      '<td class="num" style="color:'+cr+';font-weight:700">'+c.pct+'%</td>'+
      '<td class="num">'+c.un.toLocaleString("pt-BR")+'</td><td class="num">'+nf(c.valor)+'</td>'+
      '<td style="width:120px"><div class="bar"><i style="width:'+c.pct+'%;background:'+cr+'"></i></div></td></tr>';
  });
  document.getElementById("p-cob").innerHTML =
    '<div style="margin-bottom:12px">'+chips+'</div>'+
    box("O quanto cada marca já foi contada", arr.length+" marcas · use a busca acima para filtrar por marca",
    tabela([{t:"Loja"},{t:"Marca"},{t:"Último balanço"},{t:"Produtos na prateleira",n:1},{t:"Já contados",n:1},{t:"Quanto da marca foi contado",n:1},{t:"Unidades",n:1},{t:"Quanto custou esse estoque",n:1},{t:""}], linhas),
    "Compara os produtos que têm saldo hoje com os que já apareceram em <b>algum balanço de contagem</b>. "+
    "<b>Quanto da marca foi contado</b> em 40% quer dizer que 6 de cada 10 produtos da marca nunca foram para a contagem — "+
    "é onde recontar rende. Onde a marca está alta e a reconciliação fecha, <b>não vale recontar</b>. "+
    "<b>Quanto custou esse estoque</b> é o que a loja pagou pela mercadoria que está na prateleira hoje (saldo × custo de compra), "+
    "não o quanto ela vale vendida.");
}

// ═══════════ CONTAGEM CONFERIDA — o painel deixa de só diagnosticar ═══════════
// A pessoa digita a quantidade REAL contada, o valor fica salvo no Supabase (sobrevive ao
// recarregamento) e vira lote de ajuste. Nenhuma quantidade é inferida pelo sistema.
const SB_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";
const SB_H = { apikey: SB_KEY, Authorization: "Bearer "+SB_KEY, "Content-Type": "application/json" };
let CONTAGEM = {};
let sbErro = null;

function quemConfere(){
  let n = null;
  try{ n = localStorage.getItem('estoque_quem'); }catch(e){}
  if(!n){
    n = prompt("Seu nome (fica registrado em cada contagem):","");
    if(n){ try{ localStorage.setItem('estoque_quem', n); }catch(e){} }
  }
  return n || "";
}

async function carregarContagem(){
  try{
    const r = await fetch(SB_URL+"/rest/v1/estoque_contagem?status=in.(conferido,na_fila)&select=*", {headers:SB_H});
    if(!r.ok) throw new Error("HTTP "+r.status);
    CONTAGEM = {}; sbErro = null;
    for(const row of await r.json()) CONTAGEM[row.loja+"|"+row.cod] = row;
  }catch(e){ sbErro = e.message; CONTAGEM = {}; }
}

async function salvarContagem(loja, cod, desc, saldoSistema, qtd, origem){
  const k = loja+"|"+cod, existente = CONTAGEM[k];
  const corpo = { loja, cod:String(cod), descricao:desc, origem, saldo_sistema:saldoSistema,
                  qtd_real:qtd, conferido_por:quemConfere(), conferido_em:new Date().toISOString(), status:'conferido' };
  try{
    const url = existente ? SB_URL+"/rest/v1/estoque_contagem?id=eq."+existente.id : SB_URL+"/rest/v1/estoque_contagem";
    const r = await fetch(url, {method: existente?"PATCH":"POST", headers:{...SB_H, Prefer:"return=representation"}, body:JSON.stringify(corpo)});
    if(!r.ok) throw new Error("HTTP "+r.status);
    const j = await r.json();
    CONTAGEM[k] = Array.isArray(j)? j[0] : j;
    return true;
  }catch(e){ alert("Não consegui salvar a contagem ("+e.message+"). O valor NÃO foi guardado."); return false; }
}

async function apagarContagem(loja, cod){
  const k=loja+"|"+cod, row=CONTAGEM[k];
  if(!row) return;
  try{ await fetch(SB_URL+"/rest/v1/estoque_contagem?id=eq."+row.id,{method:"DELETE",headers:SB_H}); delete CONTAGEM[k]; }catch(e){}
}

function inputContagem(loja, cod, desc, saldo, origem){
  const row = CONTAGEM[loja+"|"+cod];
  const val = row ? row.qtd_real : "";
  const naFila = row && row.status==='na_fila';
  return '<input class="cont" type="number" step="1" value="'+val+'"'+(naFila?' disabled':'')+
    ' data-loja="'+loja+'" data-cod="'+cod+'" data-origem="'+origem+'" data-saldo="'+saldo+'"'+
    ' data-desc="'+esc(desc).replace(/"/g,'&quot;')+'" placeholder="contar"/>'+
    (naFila?'<span class="pill p-ok" style="margin-left:6px">na fila</span>':
      row?'<span class="pill p-ok" style="margin-left:6px">salvo</span>':'');
}

function ligarInputs(){
  for(const el of document.querySelectorAll("input.cont")){
    el.onchange = async () => {
      const v = el.value.trim();
      if(v===""){ await apagarContagem(el.dataset.loja, el.dataset.cod); pintar(); return; }
      const n = Number(v);
      if(!isFinite(n) || n<0){ alert("Quantidade inválida."); el.value=""; return; }
      el.disabled = true;
      await salvarContagem(el.dataset.loja, el.dataset.cod, el.dataset.desc, Number(el.dataset.saldo), n, el.dataset.origem);
      el.disabled = false;
      pintar();
    };
  }
}

function barraLote(){
  if(sbErro) return '<div class="aviso">Não consegui falar com o Supabase (<b>'+esc(sbErro)+'</b>). '+
    'As contagens NÃO estão sendo salvas. Se a tabela ainda não existe, rode <code>scripts/estoque_supabase.sql</code>.</div>';
  const todos = Object.values(CONTAGEM).filter(r=>!lojaSel || r.loja===lojaSel);
  const conf = todos.filter(r=>r.status==='conferido');
  const fila = todos.filter(r=>r.status==='na_fila');
  return '<div class="lote">'+
    '<div><b>'+conf.length+'</b> conferido(s) aguardando lote · <b>'+fila.length+'</b> na fila de aplicação</div>'+
    '<div class="lote-b">'+
      '<button class="btn" onclick="gerarLote()"'+(conf.length?'':' disabled')+'>Gerar lote de ajustes ('+conf.length+')</button>'+
      '<button class="btn urg" onclick="aplicarAgora()"'+(fila.length?'':' disabled')+'>⚡ Aplicar agora</button>'+
    '</div>'+
    '<div class="hint" style="flex-basis:100%">Gerar lote só marca as contagens como prontas — nada é escrito no ERP nesse momento. '+
    'O <b>⚡ Aplicar agora</b> manda as urgentes para o ERP em poucos minutos; o restante entra no lote semanal '+
    '(<code>node aplica_contagem_estoque.mjs</code>). Cada escrita grava saldo de antes e depois no log do projeto.</div>'+
  '</div>';
}

async function gerarLote(){
  const alvo = Object.values(CONTAGEM).filter(r=>r.status==='conferido' && (!lojaSel || r.loja===lojaSel));
  if(!alvo.length) return;
  const urg = confirm(alvo.length+" produto(s) vao para a fila de ajuste.\n\nOK = marcar como URGENTE (aplica pelo botao)\nCancelar = deixar para o lote semanal");
  for(const r of alvo){
    try{
      await fetch(SB_URL+"/rest/v1/estoque_contagem?id=eq."+r.id,{method:"PATCH",headers:SB_H,
        body:JSON.stringify({status:'na_fila', urgente:urg, enfileirado_em:new Date().toISOString()})});
    }catch(e){ alert("Falha ao enfileirar "+r.cod+": "+e.message); }
  }
  await carregarContagem(); pintar();
  alert(alvo.length+" produto(s) na fila"+(urg?" como URGENTE. Clique em Aplicar agora.":". Serao aplicados no lote semanal."));
}

async function aplicarAgora(){
  const fila = Object.values(CONTAGEM).filter(r=>r.status==='na_fila' && r.urgente);
  if(!fila.length){ alert("Nao ha contagens marcadas como urgentes na fila."); return; }
  if(!confirm(fila.length+" produto(s) urgentes serao ESCRITOS NO ERP.\n\nIsso altera o saldo de verdade. Confirmar?")) return;
  try{
    const r = await fetch(SB_URL+"/rest/v1/estoque_trigger?id=eq.1",{method:"PATCH",headers:SB_H,
      body:JSON.stringify({solicitado_em:new Date().toISOString(), solicitado_por:quemConfere()})});
    if(!r.ok) throw new Error("HTTP "+r.status);
    alert("Pedido enviado. A aplicacao roda nos proximos minutos; recarregue a pagina depois para ver o resultado.");
  }catch(e){ alert("Nao consegui enviar o pedido ("+e.message+")."); }
}

// ── 3. negativos ──
function renderNeg(){
  const arr = base(D.negativos);
  const reinc = arr.filter(x=>x.reincidente).length;
  const linhas = arr.slice(0,3000).map(n=>
    '<tr><td>'+pillLoja(n.loja)+'</td><td class="num">'+n.cod+'</td><td class="d">'+esc(n.desc)+'<div class="hint">'+esc(n.marca)+'</div></td>'+
    '<td class="num neg">'+nq(n.sal)+'</td><td class="num">'+nf(n.custo*Math.abs(n.sal))+'</td>'+
    '<td>'+dBR(n.desde)+' <span class="hint">('+n.fonte+')</span></td><td class="num">'+n.dias+'</td>'+
    '<td>'+(n.reincidente?'<span class="pill p-alerta">voltou depois do zeramento de '+dBR(n.zerado_em)+'</span>':'<span class="hint">—</span>')+'</td>'+
    '<td>'+inputContagem(n.loja,n.cod,n.desc,n.sal,'negativos')+'</td></tr>');
  const un = arr.reduce((a,b)=>a+Math.abs(b.sal),0);
  document.getElementById("p-neg").innerHTML = barraLote() + box("Saldo negativo", arr.length.toLocaleString("pt-BR")+" produtos · "+Math.round(un).toLocaleString("pt-BR")+" unidades negativas"+(reinc?" · "+reinc+" reincidentes":""),
    tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Saldo",n:1},{t:"Dinheiro parado (saldo × custo)",n:1},{t:"Negativo desde"},{t:"Dias",n:1},{t:"Reincidência"},{t:"Contagem real"}], linhas),
    "Saldo negativo é venda sem entrada correspondente — e é o que <b>explode o custo médio</b> quando a próxima nota entra "+
    "(média ponderada dividida por denominador quase zero). <b>“Negativo desde”</b>: o ERP não guarda essa data, então o pipeline "+
    "registra a primeira execução em que viu o produto negativo — por isso muitos aparecem como <b>1º registro</b> hoje e a antiguidade "+
    "real só aparece com o tempo. Quando a última contagem já mostrava saldo negativo, vale a data do <b>balanço</b>. "+
    "Corrigir com quantidade fixa (foi o que os balanços de AJUSTE de junho fizeram) zera o saldo mas deixa o custo torto. "+
    "<b>Reincidência</b>: produto que foi zerado e voltou a ficar negativo — é a prova de que ele <b>existe e vende</b>, "+
    "e o tamanho do negativo novo mede quanta venda está rodando sem entrada correspondente. O que foi zerado fica "+
    "registrado em <code>dados_estoque/ajustes_saldo.json</code>, com saldo de antes e de depois.");
}


// ═══════════ VALIDADE — a vencer e já vencidos ═══════════
// O ERP não tem controle de lote em uso, então a planilha da loja é a fonte real. O importador
// é tolerante com o cabeçalho porque cada loja monta a planilha de um jeito.
let VENCIDOS = [];
let vencErro = null;
let previaCSV = null;

const SINONIMOS = {
  cod:        ["codigo","código","cod","cód","sku","referencia","referência","ref"],
  descricao:  ["descricao","descrição","produto","item","nome","descrição do produto"],
  marca:      ["marca","fornecedor","fabricante"],
  quantidade: ["quantidade","qtd","qtde","qt","saldo","unidades"],
  validade:   ["validade","vencimento","data de validade","data validade","venc","dt validade","vence em"],
  lote:       ["lote","batch"]
};
const norm = t => String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();

async function carregarVencidos(){
  try{
    const r = await fetch(SB_URL+"/rest/v1/estoque_vencidos?baixado_em=is.null&select=*&order=validade", {headers:SB_H});
    if(!r.ok) throw new Error("HTTP "+r.status);
    VENCIDOS = await r.json(); vencErro=null;
  }catch(e){ vencErro=e.message; VENCIDOS=[]; }
}

// CSV com ; ou , — respeita aspas
function parseCSV(txt){
  txt = txt.replace(/^\uFEFF/,"");
  const sep = (txt.split("\n")[0].match(/;/g)||[]).length >= (txt.split("\n")[0].match(/,/g)||[]).length ? ";" : ",";
  const linhas=[]; let campo="", linha=[], aspas=false;
  for(let i=0;i<txt.length;i++){
    const c=txt[i];
    if(aspas){ if(c==='"'){ if(txt[i+1]==='"'){campo+='"';i++;} else aspas=false; } else campo+=c; }
    else if(c==='"') aspas=true;
    else if(c===sep){ linha.push(campo); campo=""; }
    else if(c==="\n"){ linha.push(campo); linhas.push(linha); linha=[]; campo=""; }
    else if(c!=="\r") campo+=c;
  }
  if(campo||linha.length){ linha.push(campo); linhas.push(linha); }
  return linhas.filter(l=>l.some(x=>String(x).trim()!==""));
}

function mapearColunas(cab){
  const m={};
  cab.forEach((h,i)=>{
    const n=norm(h);
    for(const [campo,syn] of Object.entries(SINONIMOS))
      if(m[campo]===undefined && syn.some(x=>n===x || n.startsWith(x))) m[campo]=i;
  });
  return m;
}
function dataBR(v){
  const t=String(v||"").trim();
  let m=t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m){ const a=m[3].length===2?"20"+m[3]:m[3]; return a+"-"+m[2].padStart(2,"0")+"-"+m[1].padStart(2,"0"); }
  m=t.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[0];
  m=t.match(/^(\d{1,2})[\/\-](\d{4})$/);            // só mês/ano: assume fim do mês
  if(m){ const ult=new Date(Number(m[2]), Number(m[1]), 0).getDate(); return m[2]+"-"+m[1].padStart(2,"0")+"-"+String(ult); }
  return null;
}
const numPT = v => { const n=parseFloat(String(v||"").replace(/\./g,"").replace(",",".")); return isNaN(n)?null:n; };

function aoEscolherArquivo(input){
  const f = input.files && input.files[0];
  if(!f) return;
  const ehExcel = /\.xlsx?$/i.test(f.name);
  if(!ehExcel && !/\.csv$/i.test(f.name)){
    alert("Consigo ler .xlsx, .xls e .csv. Envie a planilha em um desses formatos.");
    input.value=""; return;
  }
  // Excel direto: a loja monta a planilha no Excel, e antes tinha que salvar como CSV
  // (passo a mais que sempre gerava confusão de separador e acento). Agora lê o .xlsx.
  if(ehExcel){
    if(typeof XLSX === "undefined"){
      alert("O leitor de Excel não carregou (sem internet?). Salve como CSV e tente de novo.");
      input.value=""; return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      try{
        const wb = XLSX.read(new Uint8Array(fr.result), {type:"array", cellDates:false});
        const aba = wb.SheetNames[0];
        // header:1 devolve matriz de linhas, igual ao parseCSV; defval:"" evita buracos.
        const linhas = XLSX.utils.sheet_to_json(wb.Sheets[aba], {header:1, defval:"", raw:false})
          .map(l => l.map(c => String(c==null?"":c).trim()))
          .filter(l => l.some(c => c !== ""));
        if(linhas.length<2){ alert("A planilha parece vazia."); return; }
        previaCSV = { arquivo:f.name, cab:linhas[0], corpo:linhas.slice(1), map:mapearColunas(linhas[0]) };
        renderVal();
      }catch(e){ alert("Não consegui ler esse Excel: "+e.message); }
    };
    fr.readAsArrayBuffer(f);
    return;
  }
  const fr = new FileReader();
  fr.onload = () => {
    const linhas = parseCSV(String(fr.result));
    if(linhas.length<2){ alert("A planilha parece vazia."); return; }
    const map = mapearColunas(linhas[0]);
    previaCSV = { arquivo:f.name, cab:linhas[0], corpo:linhas.slice(1), map };
    renderVal();
  };
  fr.readAsText(f, "utf-8");
}

async function confirmarImportacao(){
  if(!previaCSV) return;
  const { map, corpo, arquivo } = previaCSV;
  if(map.descricao===undefined){ alert("Não achei a coluna de produto/descrição. Renomeie o cabeçalho para 'Produto' ou 'Descrição'."); return; }
  const lj = lojaSel || prompt("De qual loja é esta planilha? (L1, L3, L4 ou L5)","L1");
  if(!lj) return;
  const quem = quemConfere();
  const linhas = corpo.map(l=>({
    loja: lj,
    cod: map.cod!==undefined ? String(l[map.cod]||"").trim() : null,
    descricao: String(l[map.descricao]||"").trim(),
    marca: map.marca!==undefined ? String(l[map.marca]||"").trim() : null,
    quantidade: map.quantidade!==undefined ? numPT(l[map.quantidade]) : null,
    validade: map.validade!==undefined ? dataBR(l[map.validade]) : null,
    lote: map.lote!==undefined ? String(l[map.lote]||"").trim() : null,
    origem: "planilha", importado_por: quem, arquivo,
  })).filter(x=>x.descricao);
  if(!linhas.length){ alert("Nenhuma linha com produto foi encontrada."); return; }
  if(!confirm(linhas.length+" linha(s) serão importadas para a loja "+lj+". Confirmar?")) return;
  try{
    for(let i=0;i<linhas.length;i+=200){
      const r = await fetch(SB_URL+"/rest/v1/estoque_vencidos",{method:"POST",headers:SB_H,body:JSON.stringify(linhas.slice(i,i+200))});
      if(!r.ok) throw new Error("HTTP "+r.status);
    }
    previaCSV=null; await carregarVencidos(); renderVal();
    alert(linhas.length+" linha(s) importadas.");
  }catch(e){ alert("Falha ao importar: "+e.message); }
}

const FAIXAS = [
  {k:"vencido", t:"Já vencido",       min:-99999, max:0},
  {k:"m1", t:"Vence em 1 mês",  min:0,  max:1},
  {k:"m2", t:"2 meses",         min:1,  max:2},
  {k:"m3", t:"3 meses",         min:2,  max:3},
  {k:"m4", t:"4 meses",         min:3,  max:4},
  {k:"m5", t:"5 meses",         min:4,  max:5},
  {k:"m6", t:"6 meses — avisar a marca", min:5, max:6},
  {k:"m12",t:"7 a 12 meses",    min:6,  max:12},
];
function mesesAte(iso, hoje){
  if(!iso) return null;
  const a=new Date(iso), b=new Date(hoje);
  return (a.getFullYear()-b.getFullYear())*12 + (a.getMonth()-b.getMonth()) + (a.getDate()>=b.getDate()?0:-1);
}
let fFaixa = "";
function setFaixa(k){ fFaixa = (fFaixa===k? "" : k); renderVal(); }

function renderVal(){
  const hoje = D.geradoEm2;
  let base_ = VENCIDOS.filter(v=>!lojaSel || v.loja===lojaSel);
  const q=(inpQ.value||"").trim().toLowerCase();
  if(q) base_ = base_.filter(v=>(v.descricao||"").toLowerCase().includes(q)||(v.marca||"").toLowerCase().includes(q)||String(v.cod||"").includes(q));
  for(const v of base_) v._m = mesesAte(v.validade, hoje);

  const cont={}; for(const f of FAIXAS) cont[f.k]=base_.filter(v=>v._m!==null && v._m>=f.min && v._m<f.max).length;
  const semData = base_.filter(v=>v._m===null).length;
  const chips = FAIXAS.map(f=>{
    const cor = f.k==="vencido"?"p-alerta":f.k==="m6"?"p-pacote":f.k==="m12"?"p-ruido":"p-semdoc";
    return '<span class="pill '+cor+'" style="cursor:pointer;opacity:'+(fFaixa&&fFaixa!==f.k?.45:1)+'" onclick="setFaixa(\''+f.k+'\')">'+f.t+' · '+cont[f.k]+'</span>';
  }).join(' ') + (semData?' <span class="pill p-ruido">sem data na planilha · '+semData+'</span>':'');

  let arr = base_;
  if(fFaixa){ const f=FAIXAS.find(x=>x.k===fFaixa); arr = arr.filter(v=>v._m!==null && v._m>=f.min && v._m<f.max); }
  arr = arr.slice().sort((a,b)=>(a.validade||"9999")<(b.validade||"9999")?-1:1);

  const linhas = arr.slice(0,3000).map(v=>
    '<tr><td>'+pillLoja(v.loja)+'</td><td class="num">'+esc(v.cod||"—")+'</td>'+
    '<td class="d">'+esc(v.descricao)+(v.marca?'<div class="hint">'+esc(v.marca)+'</div>':'')+'</td>'+
    '<td class="num">'+(v.quantidade!=null?nq(v.quantidade):"—")+'</td>'+
    '<td>'+(v.validade?dBR(v.validade):'<span class="hint">sem data</span>')+'</td>'+
    '<td class="num '+(v._m===null?"":v._m<0?"neg":v._m<=6?"":"zero")+'">'+(v._m===null?"—":v._m<0?"vencido":v._m+" meses")+'</td>'+
    '<td class="hint">'+esc(v.arquivo||v.origem)+'</td></tr>');

  const importador =
    '<div class="lote">'+
      '<div><b>Planilha de validade da loja</b><div class="hint">O ERP ainda não controla lote, então a planilha que a loja já faz é a fonte. '+
      'Aceita <b>.xlsx</b> direto do Excel — não precisa mais salvar como CSV. (.csv também serve.)</div></div>'+
      '<div class="lote-b"><label class="btn urg" style="cursor:pointer">Enviar planilha (CSV)'+
      '<input type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none" onchange="aoEscolherArquivo(this)"></label></div>'+
    '</div>';

  let previa = "";
  if(previaCSV){
    const m=previaCSV.map;
    const achou = Object.entries({cod:"código",descricao:"produto",marca:"marca",quantidade:"quantidade",validade:"validade",lote:"lote"})
      .map(([k,rot])=> m[k]!==undefined
        ? '<span class="pill p-ok">'+rot+' → “'+esc(previaCSV.cab[m[k]])+'”</span>'
        : '<span class="pill p-semdoc">'+rot+' não encontrada</span>').join(' ');
    const amostra = previaCSV.corpo.slice(0,3).map(l=>'<tr>'+l.slice(0,8).map(c=>'<td>'+esc(String(c).slice(0,26))+'</td>').join('')+'</tr>').join('');
    previa = box("Confira antes de importar: "+esc(previaCSV.arquivo),
      previaCSV.corpo.length+" linhas",
      '<div style="padding:13px 17px">'+achou+'</div>'+
      '<div class="scroll"><table><thead><tr>'+previaCSV.cab.slice(0,8).map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+amostra+'</tbody></table></div>'+
      '<div style="padding:13px 17px;display:flex;gap:9px">'+
        '<button class="btn urg" onclick="confirmarImportacao()">Importar para '+(lojaSel||"a loja que eu escolher")+'</button>'+
        '<button class="btn" onclick="previaCSV=null;renderVal()">Cancelar</button></div>',
      "Eu adivinho as colunas pelo nome do cabeçalho. Se alguma aparecer como <b>não encontrada</b>, "+
      "renomeie a coluna na planilha e envie de novo — <b>produto</b> é obrigatória, o resto é opcional. "+
      "Data aceita 31/12/2026, 31-12-26 ou só 12/2026 (nesse caso conta como o último dia do mês).");
  }

  const aviso = vencErro
    ? '<div class="aviso">Não consegui falar com o Supabase (<b>'+esc(vencErro)+'</b>). Rode <code>scripts/estoque_supabase.sql</code>.</div>'
    : "";

  document.getElementById("p-val").innerHTML = aviso + importador + previa +
    '<div style="margin-bottom:12px">'+chips+'</div>'+
    box(fFaixa==="vencido"?"Produtos já vencidos":"Produtos a vencer",
      arr.length.toLocaleString("pt-BR")+" produtos"+(VENCIDOS.length?"":" — nenhuma planilha importada ainda"),
      tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Quantidade",n:1},{t:"Vence em"},{t:"Falta"},{t:"Origem"}], linhas),
      "A regra da casa é avisar a marca com <b>seis meses</b> de antecedência — é a faixa "+
      "<b>“6 meses — avisar a marca”</b> que dispara a ação; 7 a 12 meses é visão de ano. "+
      "<b>Relatório para o fornecedor:</b> Altamira sai junta (Casa da Beleza + Miss Beleza no mesmo "+
      "relatório, por marca, sem separar loja) porque é assim que o fornecedor recebe e é assim que o "+
      "pedido é feito; Itaituba e Santarém saem separadas. "+
      "Enquanto o controle de lote do ERP não estiver ligado, tudo aqui vem da planilha da loja — e "+
      "mesmo depois de ligar, a mercadoria que já está na prateleira continua vindo daqui, porque o "+
      "lote só passa a existir na entrada de NF-e a partir do dia em que for ativado.");
}

// ── 4. devolvidos ──
function renderDev(){
  const arr = base(D.vencidos);
  const linhas = arr.map(v=>{
    const c = v.dias>=90?"neg":v.dias>=30?"":"zero";
    return '<tr><td>'+pillLoja(v.loja)+'</td><td class="num">'+v.cod+'</td><td class="d">'+esc(v.desc)+'<div class="hint">'+esc(v.marca)+'</div></td>'+
    '<td class="num">'+nq(v.sal)+'</td><td class="num">'+nf(v.valor)+'</td><td>'+dBR(v.desde)+' <span class="hint">('+v.fonte+')</span></td>'+
    '<td class="num '+c+'">'+v.dias+'</td></tr>';
  });
  const tot = arr.reduce((a,b)=>a+b.valor,0);
  const porMarca = {}; for(const v of arr) porMarca[v.marca]=(porMarca[v.marca]||0)+v.valor;
  const top = Object.entries(porMarca).sort((a,b)=>b[1]-a[1]).slice(0,12)
    .map(([m,v])=>'<span class="pill p-ruido">'+esc(m)+' '+nf(v)+'</span>').join(' ');
  if(!D.vencidos.length){
    document.getElementById("p-dev").innerHTML = box("Depósito 2 — Devolvidos (com defeito)","nenhum saldo no depósito 2",
      '<div class="vazio">O depósito 2 está <b>vazio</b> nas quatro lojas.</div>',
      "Não é falha de coleta: a consulta do ano inteiro, sem nenhum filtro, devolve <b>zero linhas</b> nos depósitos "+
      "<b>2 (Devolvidos)</b>, <b>3 (CD)</b> e <b>4 (Cultura Cacheada)</b> — todo o estoque das quatro lojas vive no "+
      "depósito <b>1 (Estoque)</b>. Ou seja: <b>o vencido e o devolvido não estão sendo separados</b>, continuam "+
      "misturados na prateleira até a nota de baixa sair. A tela <b>Transferência entre Depósitos</b> move a mercadoria "+
      "sem ajuste de saldo e sem NF (mesmo estabelecimento) — no dia em que passar a ser usada, este bloco começa a "+
      "mostrar o que está parado e há quantos dias. Enquanto isso, parte desse sumiço aparece no bloco de "+
      "<b>reconciliação</b> como “sem documento”.");
    return;
  }
  document.getElementById("p-dev").innerHTML =
    '<div style="margin-bottom:12px">'+top+'</div>'+
    box("Depósito 2 — Devolvidos (com defeito)", arr.length.toLocaleString("pt-BR")+" produtos · "+nf(tot)+" — é o que a loja pagou por essa mercadoria parada",
    tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Saldo",n:1},{t:"Quanto custou esse estoque",n:1},{t:"No depósito desde"},{t:"Dias parados",n:1}], linhas),
    "Saldo parado no depósito <b>2 · Devolvidos (com defeito)</b>, esperando nota de baixa. Enquanto a nota não sai, esse valor "+
    "continua contando como estoque. Os depósitos cadastrados são <b>Estoque [1]</b>, <b>Devolvidos (com defeito) [2]</b>, "+
    "<b>CD [3]</b> e <b>Cultura Cacheada [4]</b> — a reconciliação usa só o depósito 1, e um produto que aparece aqui e some de lá "+
    "é classificado como <b>“foi p/ depósito 2”</b>, não como sumiço. <b>Dias parados</b> conta desde a primeira execução que viu o item aqui.");
}

// ── 5. preço × custo ──
const TIPO_PRECO = {
  preco_absurdo:["p-alerta","preço digitado errado"], abaixo_custo:["p-alerta","vende abaixo do custo"],
  razao_alta:["p-pacote","razão alta"], pacote_unidade:["p-divisao2","pacote × unidade, não é preço"],
  sem_custo:["p-ruido","sem custo médio"]
};
let fTipo = "";
function setTipo(t){ fTipo=t; renderPre(); }
function renderPre(){
  let arr = base(D.precos);
  if(fTipo) arr = arr.filter(x=>x.tipo===fTipo);
  const chips = Object.keys(TIPO_PRECO).map(k=>
    '<span class="pill '+TIPO_PRECO[k][0]+'" style="cursor:pointer;opacity:'+(fTipo&&fTipo!==k?.45:1)+'" onclick="setTipo(\''+k+'\')">'+
    TIPO_PRECO[k][1]+' '+((D.precosPorTipo||{})[k]||0)+'</span>').join(' ')+
    ' <span class="pill p-ruido" style="cursor:pointer" onclick="setTipo(\'\')">todos</span>';
  const linhas = arr.map(p=>{
    const t = TIPO_PRECO[p.tipo]||["p-ruido",p.tipo];
    return '<tr><td>'+pillLoja(p.loja)+'</td><td class="num">'+p.cod+'</td><td class="d">'+esc(p.desc)+'<div class="hint">'+esc(p.marca)+'</div></td>'+
      '<td class="num">'+(p.custo?nf2(p.custo):"—")+'</td><td class="num'+(p.tipo==="preco_absurdo"?" neg":"")+'">'+nf2(p.preco)+'</td>'+
      '<td class="num '+(p.razao&&p.razao>=10?"neg":"")+'">'+(p.razao!=null?p.razao.toLocaleString("pt-BR")+"×":"—")+'</td>'+
      '<td class="num">'+nq(p.sal)+'</td><td class="num">'+nf(p.exposicao)+'</td>'+
      '<td class="num">'+(p.custo_real!=null?nf2(p.custo_real):'<span class="hint">—</span>')+'</td>'+
      '<td class="num">'+(p.preco_praticado!=null?nf2(p.preco_praticado):'<span class="hint">—</span>')+'</td>'+
      '<td><span class="pill '+t[0]+'">'+t[1]+'</span></td></tr>';
  });
  document.getElementById("p-pre").innerHTML =
    '<div style="margin-bottom:12px">'+chips+'</div>'+
    box("Preço de venda × custo médio",
    arr.length.toLocaleString("pt-BR")+" exibidos de "+(D.totalPrecos||0).toLocaleString("pt-BR")+" sinalizados",
    tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Custo (o que pagamos)",n:1},{t:"Preço de venda",n:1},{t:"Preço ÷ custo",n:1},{t:"Saldo",n:1},{t:"Dinheiro parado (saldo × custo)",n:1},{t:"Custo real (histórico)",n:1},{t:"Preço da última venda",n:1},{t:"Sinal"}], linhas),
    "<b>Onde a razão é absurda, o preço está errado — não o custo.</b> A ordem é por gravidade prática: "+
    "primeiro <b>preço absurdo</b> (acima de R$ 1.000 num varejo de beleza é quase sempre erro de digitação), "+
    "depois <b>preço ≤ custo</b> (perde dinheiro em cada venda), depois razão alta, e por último os que estão "+
    "só sem custo médio. O <b>custo médio</b> e o <b>preço de tabela</b> vêm do relatório de saldo — ⚠️ o custo "+
    "desse relatório é do <b>grupo</b>, não da loja. O <b>custo real</b> e a <b>última venda</b> vêm do Histórico "+
    "de Movimento do Produto (“Médio (Histórico) Unit.”), coletado só para os casos mais graves. "+
    "⚠️ O campo <code>ValorProduto</code> do balanço, que já foi lido como custo, é o <b>preço de venda</b> na data "+
    "da contagem — foi assim que preços de R$ 33.660 viraram “custo corrompido”. "+
    "<b>O painel só sinaliza: quem aplica preço no ERP é você</b>, pelo fluxo do dashboard de precificação.");
}

// ── 6. pacote entrando como unidade ──
function renderFat(){
  const arr = base(D.fator);
  const linhas = arr.map(f=>
    '<tr><td>'+pillLoja(f.loja)+'</td><td class="num">'+f.cod+'</td><td class="d">'+esc(f.desc)+
      '<div class="hint">'+pillCurva(f.curva)+' '+esc(f.marca)+'</div></td>'+
    '<td><span class="pill p-pacote">'+esc(f.termo)+(f.n?" = "+f.n+" un.":"")+'</span></td>'+
    '<td class="num">'+nf2(f.custo)+'</td><td class="num">'+nf2(f.preco)+'</td>'+
    '<td class="num neg">'+f.razao.toLocaleString("pt-BR")+'×</td>'+
    '<td class="num">'+nq(f.sal)+'</td>'+
    '<td><span class="pill p-alerta">'+esc(f.situacao)+'</span></td>'+
    '<td class="d hint">'+(f.irmao? 'existe o código '+f.irmao.cod+' ("'+esc(f.irmao.d).slice(0,32)+'") com saldo '+nq(f.irmao.sal) : 'não achei código irmão para a outra unidade')+'</td></tr>');
  document.getElementById("p-fat").innerHTML =
    '<div class="aviso"><b>O ERP está com o fator de conversão DESLIGADO.</b> Conferido direto na API '+
    'do Microvix: <code>UtilizaFatorConversaoFornecedor = false</code>. Isso quer dizer que <b>não existe '+
    'fator cadastrado para nenhum produto</b> — e é por isso que a coluna “Fat. Conv. Utilizado” nunca '+
    'aparece na cópia da NF. Enquanto ficar assim, chega uma caixa com 144 lixas e o ERP dá entrada de '+
    '<b>1</b>. O saldo nasce errado e a venda tira errado. Ligar isso é uma configuração de parâmetro, '+
    'não é mexer em produto a produto.</div>'+
    box("Produtos onde o pacote e a unidade estão se misturando",
      arr.length.toLocaleString("pt-BR")+" produtos · ordenados pelo dinheiro em jogo",
      tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Descritivo promete"},{t:"Custo (o que pagamos)",n:1},{t:"Preço de venda",n:1},{t:"Preço ÷ custo",n:1},{t:"Saldo",n:1},{t:"O que está errado"},{t:"Código irmão"}], linhas),
      "Como o fator não existe, não dá para olhar a nota — mas dá para olhar <b>preço e custo</b>: quando os "+
      "dois estão na mesma unidade, a razão é um markup normal de varejo (entre 1 e 6). Quando ela "+
      "<b>explode</b>, o custo é da unidade e o preço é do pacote; quando ela <b>inverte</b> (preço menor que "+
      "o custo), é o contrário. Produto que a loja compra E vende como pacote fica de fora desta lista — "+
      "é o caso do PAPEL D.TNT C/100, que estava sendo acusado errado antes. "+
      "<b>Código irmão</b> mostra a solução que a loja já usa hoje: um código para o pacote e outro para a "+
      "unidade, com o mesmo descritivo.");
}

const RENDER = { rec:renderRec, cob:renderCob, neg:renderNeg, val:renderVal, dev:renderDev, pre:renderPre, fat:renderFat };
function pintar(){ RENDER[aba](); ligarInputs(); }

function iniciar(){
  document.getElementById("genDate").textContent = D.geradoEmBR;
  if(lojaSel && !D.lojas.some(l=>l.key===lojaSel)) lojaSel='L1';
  renderLojaBar(); renderAviso(); renderKpis();
  for(const t of document.querySelectorAll(".tab")) t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x===t));
    aba = t.dataset.p;
    document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("on",p.id==="p-"+aba));
    pintar();
  };
  let deb; inpQ.oninput = () => { clearTimeout(deb); deb=setTimeout(pintar,220); };
  pintar();
}
