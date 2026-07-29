#!/usr/bin/env node
/**
 * build_conferencia_caixa.mjs — ÚNICO escritor de conferencia_caixa.html.
 * Lê conferencia_caixa_raw.json (gerado por coleta_conferencia_caixa.mjs) e
 * renderiza o painel com os dados EMBUTIDOS (padrão vendas/compras/financeiro).
 *
 * Uso: node build_conferencia_caixa.mjs
 * Exit: 0 ok · 20 build falhou (o .sh restaura a versão anterior).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

// ── senha do painel (NUNCA vai pro repo): env ou Keychain (amgomes-caixa / caixa-web) ──
// Criada com a mesma senha do painel Financeiro, mas em entrada própria — dá pra rotacionar
// uma sem mexer na outra.
function getSenha() {
  if (process.env.CAIXA_SENHA) return process.env.CAIXA_SENHA;
  for (const [conta, servico] of [["caixa-web", "amgomes-caixa"], ["financeiro-web", "amgomes-financeiro"]]) {
    try {
      return execSync(`security find-generic-password -a ${conta} -s ${servico} -w`,
        { stdio: ["ignore", "pipe", "ignore"] }).toString().replace(/\n$/, "");
    } catch { /* tenta a próxima */ }
  }
  return null;
}
const ITERS = 200000;
function cifrar(plain, senha) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(senha, salt, ITERS, 32, "sha256");
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return {
    salt: salt.toString("base64"), iv: iv.toString("base64"),
    data: Buffer.concat([ct, c.getAuthTag()]).toString("base64"), iters: ITERS,
  };
}
const RAIZ = path.join(DIR, "..");
const RAW = path.join(RAIZ, "conferencia_caixa_raw.json");
const OUT = path.join(RAIZ, "conferencia_caixa.html");

const raw = JSON.parse(fs.readFileSync(RAW, "utf8"));
if (!raw.dias || !Object.keys(raw.dias).length) {
  console.error("conferencia_caixa_raw.json sem dias coletados");
  process.exit(20);
}

const LOJAS = [
  { key: "L1", nome: "Casa da Beleza", cidade: "Altamira", cor: "#d97706" },
  { key: "L3", nome: "Casa da Beleza", cidade: "Itaituba", cor: "#0891b2" },
  { key: "L4", nome: "MissBeleza", cidade: "Altamira", cor: "#dc2626" },
  { key: "L5", nome: "MissBeleza", cidade: "Santarém", cor: "#6366f1" },
];

// ── Monta a série por loja/dia, já limpa para o front ──
const dias = Object.values(raw.dias)
  .filter(d => d && d.data)
  .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.loja.localeCompare(b.loja)));

const F = (o, k) => ({
  calc: o?.formas?.[k]?.calc ?? 0,
  inf: o?.formas?.[k]?.inf ?? 0,
  dif: o?.formas?.[k]?.dif ?? 0,
});

const DADOS = {
  geradoEm: raw.geradoEm || null,
  geradoEmBR: raw.geradoEmBR || "—",
  janela: raw.janela || {},
  lojas: LOJAS,
  dias: dias.map(d => ({
    data: d.data,
    loja: d.loja,
    status: d.status,
    total: d.total,
    saldoIni: d.saldo_inicial,
    saldoFim: d.saldo_final,
    dinheiro: F(d, "dinheiro"),
    cartao: F(d, "cartao"),
    pix: F(d, "pix"),
    crediario: F(d, "crediario"),
    convenio: F(d, "convenio"),
    deposito: F(d, "deposito"),
    qrlinx: F(d, "qrlinx"),
    cashback: F(d, "cashback"),
    link_pgto: F(d, "link_pgto"),
    devolucoes: F(d, "devolucoes"),
    sangria: F(d, "sangria"),
    suprimentos: F(d, "suprimentos"),
    operadores: (d.operadores || []).map(o => ({
      login: o.login,
      total: o.total,
      dinheiro: o.dinheiro,
      sangria: o.sangria,
    })),
    adms: d.cartao_administradoras || {},
  })),
  planos: raw.planos || null,
  recebivel: raw.recebivel || null,
};

// ── Os dados são SENSÍVEIS (falta de caixa com nome de operador) e o repo do painel é
//    público → o JSON vai CIFRADO no HTML e só é decifrado no navegador com a senha. ──
const SENHA = getSenha();
if (!SENHA) {
  console.error("senha do painel não encontrada (env CAIXA_SENHA ou Keychain amgomes-caixa) — abortando");
  console.error("sem senha o painel iria pro repo público em texto puro");
  process.exit(20);
}
const PAYLOAD = cifrar(JSON.stringify(DADOS), SENHA);

// Só metadados não-sensíveis ficam em claro (para o cabeçalho antes do login).
const PUBLICO = {
  geradoEmBR: DADOS.geradoEmBR,
  janela: DADOS.janela,
  qtdDias: DADOS.dias.length,
};

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#7c3aed">
<title>Conferência de Caixa — A.M. Gomes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f0f4f8; --card:#fff; --card2:#f8fafc;
  --text:#0f172a; --text2:#334155; --muted:#64748b; --border:#e2e8f0;
  --accent:#7c3aed;
  --ok:#059669; --falta:#dc2626; --sobra:#0891b2; --alerta:#f59e0b; --neutro:#94a3b8;
  --shadow:0 1px 3px rgba(15,23,42,.06), 0 6px 20px rgba(15,23,42,.05);
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{
  background:radial-gradient(900px 460px at 100% -8%, rgba(124,58,237,.10), transparent 60%),var(--bg);
  color:var(--text);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  min-height:100vh;font-size:15px;-webkit-font-smoothing:antialiased;
}
.wrap{max-width:1180px;margin:0 auto;padding:0 18px 60px}

/* header */
.hdr{display:flex;align-items:center;gap:14px;padding:26px 0 6px;flex-wrap:wrap}
.hdr .ico{width:50px;height:50px;border-radius:15px;background:linear-gradient(135deg,#7c3aed,#0891b2);
  display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:0 8px 22px rgba(124,58,237,.32)}
.hdr h1{font-size:23px;font-weight:800;letter-spacing:-.4px}
.hdr p{color:var(--muted);font-size:12.5px;margin-top:2px;font-weight:500}
.voltar{margin-left:auto;text-decoration:none;color:var(--muted);font-size:12.5px;font-weight:600;
  border:1px solid var(--border);background:var(--card);padding:8px 13px;border-radius:9px}
.voltar:hover{color:var(--accent);border-color:var(--accent)}

/* selo de coleta — timestamp REAL, estático, escrito pelo pipeline */
.selo{display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--border);
  border-radius:9px;padding:7px 12px;font-size:11.5px;color:var(--muted);font-weight:600;margin:6px 0 4px}
.selo b{color:var(--text2);font-weight:700}
.selo .pulse{width:7px;height:7px;border-radius:50%;background:var(--ok)}

/* tabs */
.tabs{display:flex;gap:6px;margin:16px 0 4px;overflow-x:auto;padding-bottom:4px}
.tab{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:10px 15px;
  font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;white-space:nowrap;transition:.15s}
.tab:hover{border-color:var(--accent);color:var(--accent)}
.tab.on{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 4px 14px rgba(124,58,237,.28)}
.pane{display:none;animation:fade .2s ease}
.pane.on{display:block}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

/* filtros */
.filtros{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}
.filtros select{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:8px 11px;
  font-size:12.5px;font-weight:600;color:var(--text2);font-family:inherit;cursor:pointer}
.filtros label{font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.5px}

/* KPIs */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:12px;margin:14px 0 18px}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:15px 16px;box-shadow:var(--shadow);
  position:relative;overflow:hidden}
.kpi::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px;background:var(--kc,var(--accent))}
.kpi .lbl{font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;font-weight:700;margin-bottom:7px}
.kpi .val{font-size:22px;font-weight:800;letter-spacing:-.6px;color:var(--kv,var(--text))}
.kpi .sub{font-size:11.5px;color:var(--muted);margin-top:4px;font-weight:500}

/* tabela */
.box{background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);
  overflow:hidden;margin-bottom:18px}
.box-h{padding:14px 17px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.box-h h3{font-size:14.5px;font-weight:700;letter-spacing:-.2px}
.box-h .hint{font-size:11.5px;color:var(--muted);font-weight:500}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px}
th{background:var(--card2);text-align:right;padding:10px 12px;font-size:10.5px;color:var(--muted);
  text-transform:uppercase;letter-spacing:.5px;font-weight:700;border-bottom:1px solid var(--border);white-space:nowrap}
th:first-child,td:first-child{text-align:left}
td{padding:10px 12px;text-align:right;border-bottom:1px solid var(--border);font-variant-numeric:tabular-nums}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover{background:var(--card2)}
.num{font-weight:600}
.falta{color:var(--falta);font-weight:700}
.sobra{color:var(--sobra);font-weight:700}
.zero{color:var(--neutro)}

/* pills de status */
.pill{display:inline-block;padding:3px 9px;border-radius:7px;font-size:10.5px;font-weight:700;white-space:nowrap}
.p-ok{background:rgba(5,150,105,.11);color:var(--ok)}
.p-div{background:rgba(220,38,38,.11);color:var(--falta)}
.p-nf{background:rgba(245,158,11,.13);color:#b45309}
.p-sm{background:rgba(148,163,184,.15);color:var(--muted)}

.loja-tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10.5px;font-weight:800;color:#fff}

/* barra de mix */
.mixbar{display:flex;height:26px;border-radius:8px;overflow:hidden;margin:6px 0 10px;border:1px solid var(--border)}
.mixbar div{display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;color:#fff}
.leg{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--muted);font-weight:600}
.leg span i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px}

.vazio{padding:30px 18px;text-align:center;color:var(--muted);font-size:13px}

/* tela de senha */
.lock{max-width:380px;margin:70px auto;background:var(--card);border:1px solid var(--border);
  border-top:3px solid var(--accent);border-radius:16px;padding:30px 28px;box-shadow:var(--shadow);text-align:center}
.lock h2{font-size:17px;font-weight:800;margin-bottom:6px}
.lock p{color:var(--muted);font-size:12.5px;margin-bottom:16px;line-height:1.55}
.lock input{width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:10px;
  font-size:14px;font-family:inherit;margin-bottom:10px;text-align:center}
.lock input:focus{outline:none;border-color:var(--accent)}
.lock button{width:100%;padding:11px;border:none;border-radius:10px;background:var(--accent);
  color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.lock button:hover{background:#6d28d9}
.lock .err{color:var(--falta);font-size:12px;min-height:16px;margin-top:8px}
.nota{font-size:11.5px;color:var(--muted);line-height:1.6;padding:12px 17px;background:var(--card2);
  border-top:1px solid var(--border)}
footer{text-align:center;color:var(--muted);font-size:11.5px;padding:26px 0 10px}
@media (max-width:620px){.hdr h1{font-size:19px}.kpi .val{font-size:19px}}
</style>
</head>
<body>
<div class="wrap">

<div class="hdr">
  <div class="ico">🧮</div>
  <div>
    <h1>Conferência de Caixa</h1>
    <p>O que o ERP registrou × o que a loja informou no fechamento</p>
  </div>
  <a class="voltar" href="index.html">← Painel</a>
</div>

<div class="selo">
  <span class="pulse"></span>
  Coleta do ERP: <b id="selo-data">—</b> · janela <b id="selo-janela">—</b>
</div>

<!-- tela de senha: os dados só são decifrados no navegador após a senha correta -->
<div id="lock" class="lock">
  <div style="font-size:30px">🔒</div>
  <h2>Conferência de Caixa</h2>
  <p>Grupo A.M. Gomes · dados protegidos.<br>Digite a senha para visualizar.</p>
  <form onsubmit="return tentarSenha(event)">
    <input id="senha" type="password" placeholder="senha" autocomplete="current-password" autofocus/>
    <button type="submit">Entrar</button>
    <div id="lockerr" class="err"></div>
  </form>
</div>

<div id="app" style="display:none">

<div class="tabs">
  <div class="tab on" data-p="conf">💰 Conferência</div>
  <div class="tab" data-p="formas">💳 Formas de pagamento</div>
  <div class="tab" data-p="sangria">📤 Sangria e saldo</div>
  <div class="tab" data-p="banco">🏦 Cartão → banco</div>
</div>

<div class="filtros">
  <label>Loja</label>
  <select id="f-loja"><option value="">Todas</option></select>
  <label>Período</label>
  <select id="f-per">
    <option value="7">Últimos 7 dias</option>
    <option value="15">Últimos 15 dias</option>
    <option value="30" selected>Últimos 30 dias</option>
    <option value="999">Tudo</option>
  </select>
</div>

<!-- ══ 1. CONFERÊNCIA ══ -->
<div class="pane on" id="p-conf">
  <div class="kpis" id="kpi-conf"></div>
  <div class="box">
    <div class="box-h"><h3>Dia a dia</h3><span class="hint">diferença = informado − calculado · negativo = faltou dinheiro no caixa</span></div>
    <div class="scroll"><table id="t-conf"></table></div>
    <div class="nota">
      <b>Calculado</b> = soma que o ERP registrou nas vendas do dia. <b>Informado</b> = o que a loja
      declarou ao fechar o caixa. Dias marcados como <b>não fechado</b> não têm conferência: ninguém
      lançou o fechamento no ERP, então a diferença não significa falta de dinheiro — significa
      falta do fechamento. Itaituba lança venda e fechamento em usuários diferentes; os valores aqui
      já vêm somados por loja para não gerar falso alarme.
    </div>
  </div>
</div>

<!-- ══ 2. FORMAS DE PAGAMENTO ══ -->
<div class="pane" id="p-formas">
  <div class="kpis" id="kpi-formas"></div>
  <div class="box">
    <div class="box-h"><h3>Mix por forma de pagamento</h3><span class="hint">valor registrado pelo ERP no período</span></div>
    <div style="padding:15px 17px">
      <div class="mixbar" id="mixbar"></div>
      <div class="leg" id="mixleg"></div>
    </div>
    <div class="scroll"><table id="t-formas"></table></div>
  </div>
  <div class="box" id="box-planos">
    <div class="box-h"><h3>Detalhe por bandeira / plano</h3><span class="hint">as 4 lojas somadas</span></div>
    <div class="scroll"><table id="t-planos"></table></div>
  </div>
</div>

<!-- ══ 3. SANGRIA E SALDO ══ -->
<div class="pane" id="p-sangria">
  <div class="kpis" id="kpi-sangria"></div>
  <div class="box">
    <div class="box-h"><h3>Sangria, suprimento e saldo em dinheiro</h3><span class="hint">movimento físico do caixa</span></div>
    <div class="scroll"><table id="t-sangria"></table></div>
    <div class="nota">
      <b>Sangria</b> = retirada de dinheiro do caixa (vai pro cofre/banco). <b>Suprimento</b> = dinheiro
      colocado no caixa (troco). <b>Saldo final</b> negativo indica que saiu mais dinheiro do que entrou
      — normalmente sangria lançada a maior ou troco não registrado.
    </div>
  </div>
</div>

<!-- ══ 4. CARTÃO → BANCO ══ -->
<div class="pane" id="p-banco">
  <div class="kpis" id="kpi-banco"></div>
  <div class="box">
    <div class="box-h"><h3>Vendido no cartão × a receber das administradoras</h3></div>
    <div class="scroll"><table id="t-banco"></table></div>
    <div class="nota">
      Cartão não entra no banco na hora: cada parcela vira um recebível da administradora com data de
      vencimento. A coluna <b>a receber</b> é o que ainda está para cair na conta, por administradora,
      nos próximos 3 meses. Inclui parcelas de vendas de meses anteriores.
    </div>
  </div>
</div>

</div><!-- /#app -->

<footer>Grupo A.M. Gomes · Conferência de Caixa · dados do ERP Microvix</footer>
</div>

<script>
const PUBLICO = ${JSON.stringify(PUBLICO)};
const PAYLOAD = ${JSON.stringify(PAYLOAD)};
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
const PILL = {ok:['p-ok','bateu'], divergente:['p-div','diferença'], nao_fechado:['p-nf','não fechado'], sem_movimento:['p-sm','sem movimento']};

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
  const comFech = ds.filter(d => d.status==="ok" || d.status==="divergente");
  const naoFech = ds.filter(d => d.status==="nao_fechado");
  const div = ds.filter(d => d.status==="divergente");
  const somaDif = comFech.reduce((a,d)=>a+(d.dinheiro.dif||0),0);
  const faltas = comFech.filter(d=>d.dinheiro.dif < -0.01);
  const sobras = comFech.filter(d=>d.dinheiro.dif > 0.01);
  const taxa = ds.filter(d=>d.status!=="sem_movimento").length;

  document.getElementById("kpi-conf").innerHTML =
    kpi("Diferença acumulada", nf2(somaDif), (faltas.length+" dia(s) com falta · "+sobras.length+" com sobra"),
        somaDif < -0.01 ? "var(--falta)" : "var(--ok)", somaDif < -0.01 ? "var(--falta)" : "var(--ok)") +
    kpi("Maior falta num dia", faltas.length ? nf2(Math.min(...faltas.map(d=>d.dinheiro.dif))) : "—",
        faltas.length ? (()=>{const w=faltas.reduce((a,b)=>a.dinheiro.dif<b.dinheiro.dif?a:b); return w.loja+" · "+dBR(w.data);})() : "nenhuma falta",
        "var(--falta)", faltas.length?"var(--falta)":"") +
    kpi("Caixas não fechados", naoFech.length, "de "+taxa+" dia(s) com movimento", "var(--alerta)", naoFech.length?"#b45309":"") +
    kpi("Dias conferidos OK", comFech.length-div.length, "de "+comFech.length+" fechamento(s)", "var(--ok)");

  const linhas = ds.map(d => {
    const p = PILL[d.status] || PILL.sem_movimento;
    return '<tr>'+
      '<td><b>'+dBR(d.data)+'</b> <span style="color:var(--muted);font-size:11px">'+diaSem(d.data)+'</span></td>'+
      '<td style="text-align:left"><span class="loja-tag" style="background:'+corLoja(d.loja)+'">'+d.loja+'</span></td>'+
      '<td class="num">'+nf(d.dinheiro.calc)+'</td>'+
      '<td class="num">'+(d.status==="nao_fechado"?'<span class="zero">—</span>':nf(d.dinheiro.inf))+'</td>'+
      '<td class="'+(d.status==="nao_fechado"?"zero":cls(d.dinheiro.dif))+'">'+(d.status==="nao_fechado"?"—":nf2(d.dinheiro.dif))+'</td>'+
      '<td class="num">'+nf(d.total.calc)+'</td>'+
      '<td class="'+(d.status==="nao_fechado"?"zero":cls(d.total.dif))+'">'+(d.status==="nao_fechado"?"—":nf2(d.total.dif))+'</td>'+
      '<td><span class="pill '+p[0]+'">'+p[1]+'</span></td>'+
    '</tr>';
  }).join("");

  document.getElementById("t-conf").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Dinheiro calculado</th><th>Dinheiro informado</th>'+
    '<th>Diferença</th><th>Total do dia</th><th>Dif. total</th><th style="text-align:left">Status</th></tr></thead>'+
    '<tbody>'+(linhas || '<tr><td colspan="8" class="vazio">Sem dados no período.</td></tr>')+'</tbody>';
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
function rSangria(){
  const ds = filtrados();
  const sang = ds.reduce((a,d)=>a+(d.sangria?.calc||0),0);
  const sup = ds.reduce((a,d)=>a+(d.suprimentos?.calc||0),0);
  const negativos = ds.filter(d=>d.saldoFim!=null && d.saldoFim < 0);
  const difSang = ds.filter(d=>(d.status==="ok"||d.status==="divergente") && Math.abs(d.sangria?.dif||0)>0.01);

  document.getElementById("kpi-sangria").innerHTML =
    kpi("Sangria no período", nf(sang), "dinheiro retirado do caixa", "#7c3aed") +
    kpi("Suprimento", nf(sup), "dinheiro colocado (troco)", "#0891b2") +
    kpi("Dias com saldo negativo", negativos.length, "saiu mais do que entrou", "var(--alerta)", negativos.length?"#b45309":"") +
    kpi("Sangria divergente", difSang.length, "informada ≠ registrada", "var(--falta)", difSang.length?"var(--falta)":"");

  const linhas = ds.map(d=>
    '<tr>'+
      '<td><b>'+dBR(d.data)+'</b> <span style="color:var(--muted);font-size:11px">'+diaSem(d.data)+'</span></td>'+
      '<td style="text-align:left"><span class="loja-tag" style="background:'+corLoja(d.loja)+'">'+d.loja+'</span></td>'+
      '<td class="num">'+nf(d.dinheiro.calc)+'</td>'+
      '<td class="num">'+nf(d.sangria?.calc||0)+'</td>'+
      '<td class="'+(Math.abs(d.sangria?.dif||0)>0.01 && d.status!=="nao_fechado" ? "falta":"zero")+'">'+
        (d.status==="nao_fechado" ? "—" : nf2(d.sangria?.dif||0))+'</td>'+
      '<td class="num">'+nf(d.suprimentos?.calc||0)+'</td>'+
      '<td class="num'+(d.saldoIni<0?" falta":"")+'">'+(d.saldoIni==null?"—":nf2(d.saldoIni))+'</td>'+
      '<td class="num'+(d.saldoFim<0?" falta":"")+'">'+(d.saldoFim==null?"—":nf2(d.saldoFim))+'</td>'+
    '</tr>').join("");

  document.getElementById("t-sangria").innerHTML =
    '<thead><tr><th>Data</th><th style="text-align:left">Loja</th><th>Dinheiro vendido</th><th>Sangria</th>'+
    '<th>Dif. sangria</th><th>Suprimento</th><th>Saldo inicial</th><th>Saldo final</th></tr></thead>'+
    '<tbody>'+(linhas || '<tr><td colspan="8" class="vazio">Sem dados no período.</td></tr>')+'</tbody>';
}

// ══ 4. BANCO ══
function rBanco(){
  const ds = filtrados();
  const vendCartao = ds.reduce((a,d)=>a+(d.cartao?.calc||0),0);
  const rec = D.recebivel || {};
  const adms = (rec.administradoras||[]).filter(a=>a.valor>0).sort((a,b)=>b.valor-a.valor);
  const totalRec = rec.totalGeral || adms.reduce((a,b)=>a+b.valor,0);

  // administradoras vistas nas vendas do período
  const admVenda = {};
  ds.forEach(d => Object.entries(d.adms||{}).forEach(([n,v]) => { admVenda[n] = (admVenda[n]||0)+v; }));
  const listaVenda = Object.entries(admVenda).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);

  document.getElementById("kpi-banco").innerHTML =
    kpi("Cartão vendido", nf(vendCartao), "no período filtrado", "#6366f1") +
    kpi("A receber das adm.", nf(totalRec), rec.periodo ? "venc. até "+rec.periodo.fim : "próximos 3 meses", "#0891b2") +
    kpi("Administradoras", adms.length || listaVenda.length, "com recebível em aberto", "#7c3aed");

  const linhas = listaVenda.map(([n,v])=>{
    const r = adms.find(a => a.nome.toUpperCase().includes(n.toUpperCase().split(" ")[0]));
    return '<tr><td>'+n+'</td><td class="num">'+nf(v)+'</td><td class="num">'+(r?nf(r.valor):'<span class="zero">—</span>')+'</td></tr>';
  }).join("");
  const extras = adms.filter(a => !listaVenda.some(([n])=>a.nome.toUpperCase().includes(n.toUpperCase().split(" ")[0])))
    .map(a=>'<tr><td>'+a.nome+'</td><td class="num zero">—</td><td class="num">'+nf(a.valor)+'</td></tr>').join("");

  document.getElementById("t-banco").innerHTML =
    '<thead><tr><th style="text-align:left">Administradora</th><th>Vendido no período</th><th>A receber (em aberto)</th></tr></thead>'+
    '<tbody>'+((linhas+extras) || '<tr><td colspan="3" class="vazio">Sem recebível de cartão coletado.</td></tr>')+'</tbody>';
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
  render();
}
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`conferencia_caixa.html gerado (${(html.length / 1024).toFixed(0)} KB, ${DADOS.dias.length} dias-loja)`);
