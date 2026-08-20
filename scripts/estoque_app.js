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
const CLASSES = {
  semdoc:["p-semdoc","sem documento"], espelhado:["p-espelhado","espelhado L1↔L4"],
  divisao2:["p-divisao2","divisão ÷2"], pacote:["p-pacote","pacote × unidade"],
  ruido:["p-ruido","ruído ±3"], deposito2:["p-deposito2","foi p/ depósito 2"]
};
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
const base = arr => filtraQ(filtraLoja(arr));

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
      '<div class="sub" style="margin-top:7px">'+(k.skus||0).toLocaleString("pt-BR")+' SKUs com saldo · '+nf(k.valor)+' a custo médio'+
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
function renderRec(){
  let arr = base(D.recon);
  if(fClasse) arr = arr.filter(x=>x.classe===fClasse);
  const cont = {}; for(const it of filtraLoja(D.recon)) cont[it.classe]=(cont[it.classe]||0)+1;
  const chips = Object.keys(CLASSES).map(k=>
    '<span class="pill '+CLASSES[k][0]+'" style="cursor:pointer;opacity:'+(fClasse&&fClasse!==k?.45:1)+'" onclick="setClasse(\''+k+'\')">'+
    CLASSES[k][1]+' '+(cont[k]||0)+'</span>').join(' ')+
    ' <span class="pill p-ruido" style="cursor:pointer" onclick="setClasse(\'\')">todas</span>';
  const linhas = arr.slice(0,4000).map(it=>{
    const c = CLASSES[it.classe]||["p-ruido",it.classe||"—"];
    return '<tr><td>'+pillLoja(it.loja)+'</td><td class="num">'+it.cod+'</td><td class="d">'+esc(it.desc)+
      '<div class="hint">'+esc(it.marca)+' · balanço '+dBR(it.bal_data)+' “'+esc(it.bal_nome)+'”</div></td>'+
      '<td class="num">'+nq(it.contado)+'</td><td class="num">'+nq(it.ent)+(it.canc?'<span class="neg"> −'+nq(it.canc)+'</span>':'')+'</td>'+
      '<td class="num">'+nq(it.ven)+'</td><td class="num">'+nq(it.esperado)+'</td>'+
      '<td class="num">'+nq(it.sal)+(it.tra?'<span class="hint"> +'+nq(it.tra)+' trâns.</span>':'')+'</td>'+
      '<td class="num '+cls(it.dif)+'">'+(it.dif>0?"+":"")+nq(it.dif)+'</td>'+
      '<td><span class="pill '+c[0]+'">'+c[1]+'</span></td>'+
      '<td class="d hint">'+esc(it.detalhe||"")+'</td></tr>';
  });
  const cols=[{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Contado",n:1},{t:"Entradas",n:1},{t:"Vendas",n:1},{t:"Esperado",n:1},{t:"Saldo hoje",n:1},{t:"Diferença",n:1},{t:"Classificação"},{t:"Detalhe"}];
  document.getElementById("p-rec").innerHTML =
    '<div style="margin-bottom:12px">'+chips+'</div>'+
    box("Produtos que não fecham", arr.length.toLocaleString("pt-BR")+" de "+filtraLoja(D.recon).length.toLocaleString("pt-BR")+" divergências"+(arr.length>4000?" (exibindo 4.000)":""),
      tabela(cols, linhas),
      "<b>esperado = contado no balanço + entradas − notas canceladas − vendas</b>, na janela que vai da data do balanço até a coleta. "+
      "<b>diferença = (saldo de hoje + estoque em trânsito) − esperado</b>: é a quantidade exata que se moveu <b>sem documento</b>. "+
      "Notas canceladas entram na conta porque o relatório conta a entrada da nota cancelada <i>e</i> a da relançada — sem isso, "+
      "nota relançada aparece como sumiço. Só entram balanços de <b>contagem</b> finalizados dos últimos "+D.diasBalanco+" dias "+
      "(desde "+dBR(D.corteBalanco)+"); balanços de <b>AJUSTE</b> são injeção de saldo, não contagem, e ficam fora.");
}
function setClasse(k){ fClasse=k; renderRec(); }
function selecionarLoja(k){
  lojaSel = k;
  try{ localStorage.setItem('estoque_loja', k); }catch(e){}
  renderLojaBar(); renderKpis(); renderAviso(); pintar();
}

// ── 2. cobertura ──
function renderCob(){
  const arr = filtraQ(filtraLoja(D.cobertura));
  const linhas = arr.map(c=>{
    const cr = c.pct>=90?"#4ade80":c.pct>=50?"#fbbf24":"#f87171";
    return '<tr><td>'+pillLoja(c.loja)+'</td><td class="d">'+esc(c.marca)+'</td>'+
      '<td class="num">'+c.skus+'</td><td class="num">'+c.contados+'</td>'+
      '<td class="num" style="color:'+cr+';font-weight:700">'+c.pct+'%</td>'+
      '<td class="num">'+c.un.toLocaleString("pt-BR")+'</td><td class="num">'+nf(c.valor)+'</td>'+
      '<td style="width:130px"><div class="bar"><i style="width:'+c.pct+'%;background:'+cr+'"></i></div></td></tr>';
  });
  document.getElementById("p-cob").innerHTML = box("Cobertura de balanço por marca", "da pior para a melhor · marcas com ao menos 3 SKUs",
    tabela([{t:"Loja"},{t:"Marca"},{t:"SKUs com saldo",n:1},{t:"Já contados",n:1},{t:"Cobertura",n:1},{t:"Unidades",n:1},{t:"Valor a custo",n:1},{t:""}], linhas),
    "Compara os SKUs que têm saldo positivo hoje com os que já apareceram em <b>algum</b> balanço de contagem (qualquer data). "+
    "Cobertura baixa = o balanço com o nome da marca não cobriu a marca inteira — é onde recontar rende. Onde a cobertura é alta e a "+
    "reconciliação fecha, <b>não vale recontar</b>.");
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
    tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Saldo",n:1},{t:"Exposição",n:1},{t:"Negativo desde"},{t:"Dias",n:1},{t:"Reincidência"},{t:"Contagem real"}], linhas),
    "Saldo negativo é venda sem entrada correspondente — e é o que <b>explode o custo médio</b> quando a próxima nota entra "+
    "(média ponderada dividida por denominador quase zero). <b>“Negativo desde”</b>: o ERP não guarda essa data, então o pipeline "+
    "registra a primeira execução em que viu o produto negativo — por isso muitos aparecem como <b>1º registro</b> hoje e a antiguidade "+
    "real só aparece com o tempo. Quando a última contagem já mostrava saldo negativo, vale a data do <b>balanço</b>. "+
    "Corrigir com quantidade fixa (foi o que os balanços de AJUSTE de junho fizeram) zera o saldo mas deixa o custo torto. "+
    "<b>Reincidência</b>: produto que foi zerado e voltou a ficar negativo — é a prova de que ele <b>existe e vende</b>, "+
    "e o tamanho do negativo novo mede quanta venda está rodando sem entrada correspondente. O que foi zerado fica "+
    "registrado em <code>dados_estoque/ajustes_saldo.json</code>, com saldo de antes e de depois.");
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
    box("Depósito 2 — Devolvidos (com defeito)", arr.length.toLocaleString("pt-BR")+" produtos · "+nf(tot)+" a custo médio",
    tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Saldo",n:1},{t:"Valor a custo",n:1},{t:"No depósito desde"},{t:"Dias parados",n:1}], linhas),
    "Saldo parado no depósito <b>2 · Devolvidos (com defeito)</b>, esperando nota de baixa. Enquanto a nota não sai, esse valor "+
    "continua contando como estoque. Os depósitos cadastrados são <b>Estoque [1]</b>, <b>Devolvidos (com defeito) [2]</b>, "+
    "<b>CD [3]</b> e <b>Cultura Cacheada [4]</b> — a reconciliação usa só o depósito 1, e um produto que aparece aqui e some de lá "+
    "é classificado como <b>“foi p/ depósito 2”</b>, não como sumiço. <b>Dias parados</b> conta desde a primeira execução que viu o item aqui.");
}

// ── 5. preço × custo ──
const TIPO_PRECO = {
  preco_absurdo:["p-alerta","preço absurdo"], abaixo_custo:["p-alerta","preço ≤ custo"],
  razao_alta:["p-pacote","razão alta"], sem_custo:["p-ruido","sem custo médio"]
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
    tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Custo médio",n:1},{t:"Preço de tabela",n:1},{t:"Razão",n:1},{t:"Saldo",n:1},{t:"Exposição",n:1},{t:"Custo real (histórico)",n:1},{t:"Última venda",n:1},{t:"Sinal"}], linhas),
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

// ── 6. fator de conversão ──
function renderFat(){
  const arr = base(D.fator);
  const linhas = arr.map(f=>
    '<tr><td>'+pillLoja(f.loja)+'</td><td class="num">'+f.cod+'</td><td class="d">'+esc(f.desc)+'<div class="hint">'+esc(f.marca)+'</div></td>'+
    '<td><span class="pill p-pacote">'+esc(f.termo)+(f.n?" = "+f.n+" un.":"")+'</span></td>'+
    '<td>'+esc(f.und)+'</td><td class="neg">'+esc(f.fat)+'</td><td class="num">'+esc(f.qtd)+'</td>'+
    '<td>'+esc(f.doc)+'</td><td>'+dBR(f.data)+'</td><td class="num">'+(f.sal!=null?nq(f.sal):"—")+'</td></tr>');
  document.getElementById("p-fat").innerHTML = box("Fator de conversão ausente",
    arr.length.toLocaleString("pt-BR")+" produtos · janela de notas "+(D.janelaNotas?dBR(D.janelaNotas.ini)+" a "+dBR(D.janelaNotas.fim):"—"),
    tabela([{t:"Loja"},{t:"Cód",n:1},{t:"Produto"},{t:"Descritivo promete"},{t:"Und."},{t:"Fat. conv. usado"},{t:"Qtd. na NF",n:1},{t:"Nota"},{t:"Lançada em"},{t:"Saldo hoje",n:1}], linhas),
    "O descritivo diz <b>C/12, C/144, DZ ou PCT</b>, mas a NF entrou com <b>Fat. Conv. Utilizado = “-”</b>, ou seja: "+
    "<b>não há fator cadastrado</b>. Entra 1 caixa e o ERP dá entrada de 1 unidade — o saldo nasce errado e a venda tira errado. "+
    "⚠️ O fator fica no cadastro do produto e é <b>por empresa</b>: o mesmo código pode estar certo numa loja e errado na outra, "+
    "por isso a loja aparece na primeira coluna. A prova é a própria nota listada.");
}

const RENDER = { rec:renderRec, cob:renderCob, neg:renderNeg, dev:renderDev, pre:renderPre, fat:renderFat };
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
