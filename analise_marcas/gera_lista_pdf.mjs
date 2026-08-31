import fs from "fs";
const W="/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas";
const L=JSON.parse(fs.readFileSync(W+"/lista_envio.json","utf8"));
const NOME={L1:"Casa da Beleza Altamira",L4:"Miss Beleza Altamira",L3:"Miss Beleza Itaituba",L5:"Miss Beleza Santarém"};
const CLUBE={L1:"Clube Beleza Altamira",L4:"Clube Miss Altamira",L3:"Clube Miss Itaituba",L5:"Clube Miss Santarém"};
const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
const cap=s=>String(s||"").toLowerCase().replace(/(^|\s)([a-zà-ú])/g,(m,a,b)=>a+b.toUpperCase());
// dias úteis a partir de 31/08/2026 (segunda). Semana do Cliente: 14–19/09.
const DIAS=[];
{ const d=new Date(2026,7,31);
  while(DIAS.length<60){ const dw=d.getDay(); if(dw>=1&&dw<=6){
    const dd=String(d.getDate()).padStart(2,"0"), mm=String(d.getMonth()+1).padStart(2,"0");
    const semanaCliente = (d.getMonth()===8 && d.getDate()>=7 && d.getDate()<=12); // semana ANTERIOR à Semana do Cliente
    DIAS.push({r:`${dd}/${mm}`, cota: semanaCliente?20:10, dow:["dom","seg","ter","qua","qui","sex","sáb"][dw]});
  } d.setDate(d.getDate()+1); } }
for (const lj of ["L4","L5","L1","L3"]) {
  const f=L.filter(x=>x.loja===lj&&!x.interno&&x.cel)
    .sort((a,b)=>(b.recente-a.recente)||(b.gasto-a.gasto));
  const semTel=L.filter(x=>x.loja===lj&&!x.interno&&!x.cel);
  // fatiar pelos dias
  const blocos=[]; let i=0;
  for(const d of DIAS){ if(i>=f.length) break; blocos.push({...d, itens:f.slice(i,i+d.cota)}); i+=d.cota; }
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Lista de contato — ${NOME[lj]}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap">
<style>
@page{size:A4;margin:12mm 11mm}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,sans-serif;font-size:10pt;color:#161314;background:#fff}
.cab{border-bottom:3px solid #A52757;padding-bottom:9px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
.cab .t{font-weight:800;font-size:16pt;color:#A52757;line-height:1.1}
.cab .s{font-size:8.5pt;font-weight:600;color:#6B5C63;text-align:right;line-height:1.4}
.intro{background:#FCEFF4;border-left:3px solid #A52757;padding:9px 13px;margin-bottom:14px;font-size:9pt;line-height:1.5}
.intro b{color:#A52757}
.dia{margin-bottom:11px;page-break-inside:avoid}
.dia .h{background:#F2E7EB;padding:5px 10px;font-weight:800;font-size:9.5pt;display:flex;justify-content:space-between;border-left:3px solid #A52757}
table{border-collapse:collapse;width:100%;font-size:9.5pt}
td{padding:5px 8px;border-bottom:1px solid #E8DDE2}
.ck{width:16px;text-align:center}
.ck span{display:inline-block;width:11px;height:11px;border:1.5px solid #9C8B92}
.nm{font-weight:600}
.tel{white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:700}
.tag{font-size:7.5pt;font-weight:800;color:#A52757;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
.rod{margin-top:16px;padding-top:9px;border-top:1px solid #E8DDE2;font-size:8.5pt;color:#6B5C63}
.semtel{margin-top:14px;padding:10px 13px;border:1px dashed #9C8B92;font-size:9pt}
.semtel b{display:block;margin-bottom:5px}
</style></head><body>
<div class="cab">
  <div class="t">${CLUBE[lj]}<div style="font-size:9.5pt;font-weight:600;color:#161314">Lista de contato — Semana do Cliente</div></div>
  <div class="s">${NOME[lj]}<br>${f.length} clientes · ${blocos.length} dias</div>
</div>
<div class="intro">
  Ligue ou mande mensagem <b>pelo WhatsApp da loja</b>, nesta ordem. Comece se apresentando pelo nome.
  Convide para o <b>${CLUBE[lj]}</b> e mande o link da comunidade.
  <b>Marque o quadradinho</b> de quem já foi contatada. Quem não responder hoje, tente de novo em outro dia.
</div>
${blocos.map(b=>`<div class="dia">
  <div class="h"><span>${b.dow} ${b.r}</span><span>${b.itens.length} contatos${b.cota===20?" · SEMANA DO CLIENTE":""}</span></div>
  <table>${b.itens.map(x=>`<tr><td class="ck"><span></span></td><td class="nm">${esc(cap(x.nome)).slice(0,42)}</td><td class="tel">${esc(x.cel)}</td><td class="tag">${x.recente?"comprou há pouco":""}</td></tr>`).join("")}</table>
</div>`).join("\n")}
${semTel.length?`<div class="semtel"><b>${semTel.length} clientes sem telefone no cadastro</b>
Quando aparecerem na loja, peça o contato e atualize o cadastro. São clientes que já compram aqui.</div>`:""}
<div class="rod">Ordem: quem comprou mais recentemente primeiro, depois quem gastou mais nos últimos 12 meses.
Lista gerada em 27/08/2026 a partir do sistema. Equipe da loja e familiares não entram.</div>
</body></html>`;
  fs.writeFileSync(`${W}/lista_${lj}.html`,html);
  process.stderr.write(`${lj}: ${f.length} clientes em ${blocos.length} dias\n`);
}
