// Gera o documento de reunião de uma loja. Uso: node gera_doc_loja.mjs L4
import fs from "fs";
const W="/Users/elkgomes/Desktop/claude/dashboard-equipe/analise_marcas";
const LJ=process.argv[2]||"L4";
const CFG={
 L4:{nome:"Miss Beleza Altamira",arq:"miss_altamira",clube:"Clube Miss Altamira",clubePro:"Clube Miss Altamira Pro",aniv:"07/11",anivTxt:"Aniversário da Miss Beleza",fav:"💗"},
 L1:{nome:"Casa da Beleza Altamira",arq:"casa_altamira",clube:"Clube Beleza Altamira",clubePro:"Clube Beleza Altamira Pro",aniv:"10/10",anivTxt:"Aniversário da Casa da Beleza",fav:"🌸"},
 L5:{nome:"Miss Beleza Santarém",arq:"miss_santarem",clube:"Clube Miss Santarém",clubePro:"Clube Miss Santarém Pro",aniv:"07/11",anivTxt:"Aniversário da Miss Beleza",fav:"💜"},
 L3:{nome:"Miss Beleza Itaituba",arq:"miss_itaituba",clube:"Clube Miss Itaituba",clubePro:"Clube Miss Itaituba Pro",aniv:"07/11",anivTxt:"Aniversário da Miss Beleza",fav:"🌺"},
}[LJ];
const A=JSON.parse(fs.readFileSync(W+"/mensal_2025_ago.json","utf8"));
const B=JSON.parse(fs.readFileSync(W+"/mensal_2026_ago.json","utf8"));
const CSS=fs.readFileSync(W+"/_css_loja.txt","utf8");
const NARR=JSON.parse(fs.readFileSync(W+"/_narrativa.json","utf8"))[LJ];
const M=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto"];
const fp=v=>(v>=0?"+":"")+v.toFixed(0)+"%";

// Duas linhas: 2025 esmaecida, 2026 cheia. Jan a jul (ago ainda não fechou).
const s26=B[LJ].slice(0,7), s25=A[LJ].slice(0,7);
const MM=["Jan","Fev","Mar","Abr","Mai","Jun","Jul"];
const GW=700,GH=270,PL=16,PR=16,PT=44,PB=42;
const todos=[...s26,...s25];
const lo=Math.min(...todos)*0.82, hi=Math.max(...todos)*1.06;
const px=i=>PL+(GW-PL-PR)*(i/(s26.length-1));
const py=v=>GH-PB-((v-lo)/(hi-lo))*(GH-PT-PB);
const caminho=a=>a.map((v,i)=>(i?"L":"M")+px(i).toFixed(1)+" "+py(v).toFixed(1)).join(" ");
const l26=caminho(s26), l25=caminho(s25);
const area26=l26+` L${px(s26.length-1).toFixed(1)} ${GH-PB} L${px(0).toFixed(1)} ${GH-PB} Z`;
const picoI=s26.indexOf(Math.max(...s26));
const grade=[0,.5,1].map(f=>{const y=(GH-PB)-f*(GH-PT-PB);return `    <line class="g-grade" x1="${PL}" y1="${y.toFixed(1)}" x2="${GW-PR}" y2="${y.toFixed(1)}"/>`;}).join("\n");
const dots=s26.map((v,i)=>`    <circle class="g-dot${i===picoI?" pico":""}" cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="${i===picoI?6:4.5}"/>`).join("\n");
const dots25=s25.map((v,i)=>`    <circle class="g-dot25" cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="3"/>`).join("\n");
const eixo=s26.map((v,i)=>`    <text class="g-mes" x="${px(i).toFixed(1)}" y="${(GH-PB+21).toFixed(1)}">${MM[i]}</text>`).join("\n");
const SVG=`<svg viewBox="0 0 ${GW} ${GH}" role="img" aria-label="Faturamento mês a mês de 2026 comparado a 2025, de janeiro a julho">
${grade}
    <path class="g-area" d="${area26}"/>
    <path class="g-linha25" d="${l25}"/>
    <path class="g-linha" d="${l26}"/>
${dots25}
${dots}
${eixo}
    <g class="g-leg">
      <line class="g-linha" x1="${PL}" y1="18" x2="${PL+26}" y2="18"/>
      <text class="g-legt" x="${PL+33}" y="22">2026</text>
      <line class="g-linha25" x1="${PL+86}" y1="18" x2="${PL+112}" y2="18"/>
      <text class="g-legt g-legt25" x="${PL+119}" y="22">2025</text>
    </g>
  </svg>`;

const meses=A[LJ].map((a,i)=>{const p=(B[LJ][i]/a-1)*100;return {m:M[i],p,cls:p>=5?"m-ok":(p>=-8?"m-medio":"m-ruim")};});
const destaqueIdx=NARR.mesDestaque;

const html=`<title>${CFG.nome} — segundo semestre</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap">
<style>${CSS}</style>

<div class="wrap">

<header style="padding-bottom:20px">
  <p class="cap">${CFG.nome} · 1º de setembro de 2026</p>
  <h1>Plano do segundo semestre</h1>
  <p class="lead">Este documento reúne o que foi apresentado na reunião: o resultado do ano
  até aqui, o ${CFG.clube}, as regras de desconto, a premiação e o calendário até dezembro.
  Fica como referência da loja.</p>
</header>

<section class="sec">
  <h2>${NARR.tituloAno}</h2>
  <p>${NARR.introAno}</p>
  <div class="gwrap">
    ${SVG}
    <p class="g-nota">De janeiro a julho. Agosto entra quando o mês fechar.</p>
  </div>
  <p>${NARR.leituraAno}</p>
</section>

<section class="sec">
  <h2>${NARR.destaqueTitulo}</h2>
  <p class="destaque-frase">${NARR.destaqueNumero}</p>
  <p class="n-legenda">${NARR.destaqueLegenda}</p>
  <div class="forte">
    <h3>${NARR.forteTitulo}</h3>
    <p>${NARR.forteTexto}</p>
  </div>
  <p>${NARR.agosto}</p>
  <p><strong>${NARR.objetivo}</strong></p>
</section>

<section class="sec">
  <h2>Treinamento toda segunda-feira</h2>
  <div class="caixa">
    <p>A partir de agora há <strong>treinamento semanal com a Dona Elk, toda segunda-feira</strong>.</p>
    <p>É lá que serão trabalhados ticket médio, fidelização de cliente, uso do desconto e
    conhecimento das marcas. Dúvida sobre produto, sobre como conduzir um atendimento ou
    como montar uma venda deve ser levada para a segunda-feira.</p>
  </div>
</section>

<section class="sec">
  <h2>${CFG.clube}</h2>
  <p>A loja passa a ter dois clubes de cliente:</p>
  <div class="calend">
    <div class="ev"><span class="quando">${CFG.clube}</span><span class="oque">Cliente final</span>
      <span class="obs">Nome, CPF, telefone, CEP e data de nascimento.</span></div>
    <div class="ev"><span class="quando">${CFG.clubePro}</span><span class="oque">Profissional da beleza</span>
      <span class="obs">CNPJ ou CPF, nome da profissional ou do salão, telefone e data de nascimento. O Instagram do trabalho é registrado junto.</span></div>
  </div>
  <h3>O que a cliente ganha ao se cadastrar</h3>
  <div class="caixa">
    <div class="vantagem"><span class="ord">1</span><span class="cont">
      <span class="vt">Compra antes de o produto ir para a prateleira</span>
      <span class="vd">Toda mercadoria que chega é anunciada na comunidade do WhatsApp do clube.
      Quem é do clube compra primeiro — não disputa a última unidade.</span></span></div>
    <div class="vantagem"><span class="ord">2</span><span class="cont">
      <span class="vt">Aviso pessoal quando chega a marca dela</span>
      <span class="vd">A loja acompanha o que cada cliente costuma comprar. Quando chega a marca
      que é a cara dela, ela recebe mensagem no privado — não é aviso para todo mundo, é para ela.</span></span></div>
    <div class="vantagem"><span class="ord">3</span><span class="cont">
      <span class="vt">Promoções que só o clube tem</span>
      <span class="vd">Haverá promoções em áreas específicas da loja válidas apenas para clientes
      cadastradas. Quem não é do clube não participa.</span></span></div>
    <div class="vantagem"><span class="ord">4</span><span class="cont">
      <span class="vt">Convite para eventos e workshops</span>
      <span class="vd">As vagas são limitadas e o convite vai primeiro para o clube.</span></span></div>
    <div class="vantagem"><span class="ord">5</span><span class="cont">
      <span class="vt">10% no mês do aniversário</span>
      <span class="vd">São 10% em <strong>uma compra</strong>, em qualquer produto da loja.
      A cliente escolhe o dia: vale em qualquer dia do mês do aniversário dela, não precisa
      ser na data. Para usar, ela apresenta a mensagem de parabéns que recebeu da loja.</span></span></div>
    <div class="vantagem"><span class="ord">6</span><span class="cont">
      <span class="vt">Direito a desconto nas compras</span>
      <span class="vd">Quem não tem cadastro não tem desconto. Ter cadastro dá direito ao
      desconto — não significa desconto em toda compra.</span></span></div>
  </div>
  <p>Para comprar usando o cadastro, a cliente apresenta documento. O cadastro é pessoal e
  não pode ser usado por outra pessoa.</p>
</section>

<section class="sec">
  <h2>Como o Clube funciona na prática</h2>
  <p>São quatro passos. Todos acontecem pelo número da loja.</p>
  <div class="calend">
    <div class="ev"><span class="quando">1</span><span class="oque">Cadastrar no caixa</span>
      <span class="obs">CPF, nome, telefone e CEP. É o que basta para a cliente entrar no ${CFG.clube}.</span></div>
    <div class="ev"><span class="quando">2</span><span class="oque">Convidar para a comunidade</span>
      <span class="obs">A loja envia o link da comunidade para a cliente cadastrada. Só entra quem tem cadastro.</span></div>
    <div class="ev"><span class="quando">3</span><span class="oque">Anunciar na comunidade o que chegou</span>
      <span class="obs">É a vendedora responsável pelas redes sociais no dia quem anuncia. Se ela não estiver, a responsabilidade é da gerente. Toda mercadoria nova é anunciada — e a cliente do Clube pode comprar antes de o produto ir para a prateleira.</span></div>
    <div class="ev"><span class="quando">4</span><span class="oque">Quem está no celular da loja no dia responde</span>
      <span class="obs">A vendedora responsável pelo atendimento online do dia atende. Se ela estiver ocupada com cliente presencial, a caixa começa e passa para ela.</span></div>
  </div>
  <div class="caixa">
    <h3>Quem atende se apresenta pelo nome.</h3>
    <p>Sempre, na primeira mensagem. A cliente precisa saber com quem está falando —
    e é assim que a venda fica registrada com quem atendeu.</p>
  </div>
  <p>Isso não muda nada no atendimento que cada uma já faz pelo WhatsApp dela. A comunidade
  é um canal a mais, que alcança também as clientes que ainda não têm vendedora.</p>
  <div class="caixa">
    <h3>Por que a comunidade e não o status</h3>
    <p>O status só aparece para quem já salvou o número da loja e ainda por cima abre os status
    naquele dia. A comunidade chega na conversa, direto — todo mundo que está nela vê.</p>
    <p>É a diferença entre esperar a cliente passar na frente da loja e falar com ela.</p>
  </div>
</section>

<section class="sec">
  <h2>Como oferecer o cadastro</h2>
  <p>O cadastro não é um papel a preencher. É uma vantagem que se oferece.</p>
  <h3>Quando oferecer</h3>
  <ul>
    <li><strong>Quando a cliente pergunta sobre desconto.</strong> É o melhor momento — a
    resposta já é o convite.</li>
    <li><strong>Antes de fechar a venda</strong>, enquanto a cliente ainda está no balcão.</li>
    <li><strong>Quando ela procura algo que não há em estoque.</strong> O aviso de chegada
    é o motivo.</li>
  </ul>
  <h3>O que falar</h3>
  <div class="fala">
    <span class="quem">A cliente pergunta se tem desconto</span>
    <p>"Tem sim, para quem é do ${CFG.clube}. A senhora já tem cadastro com a gente?
    Posso fazer agora, é rápido."</p>
  </div>
  <div class="fala">
    <span class="quem">Oferecendo o cadastro</span>
    <p>"Preciso do seu nome, CPF, telefone e a data do seu aniversário. Assim a senhora entra
    no ${CFG.clube}: fica sabendo de tudo que chega na loja antes de ir para a prateleira,
    participa das promoções que são só do clube, e no mês do seu aniversário tem 10% em
    qualquer produto."</p>
  </div>
  <div class="fala">
    <span class="quem">Explicando o aviso de chegada</span>
    <p>"A gente tem um grupo no WhatsApp só de quem é do clube. Tudo que chega eu mando lá
    primeiro — a senhora vê e já reserva, antes de ir para a prateleira."</p>
  </div>
  <div class="fala">
    <span class="quem">A cliente procura algo que não há</span>
    <p>"Esse produto vai chegar. Deixa eu fazer seu cadastro — assim que ele entrar eu te
    aviso no seu WhatsApp, antes de ir para a prateleira."</p>
  </div>
  <div class="fala">
    <span class="quem">A cliente trabalha na área</span>
    <p>"A senhora trabalha com beleza? Então tem o ${CFG.clubePro}, que tem condição diferente.
    Preciso do CNPJ ou CPF, o nome do salão e o Instagram do seu trabalho."</p>
  </div>
  <div class="caixa">
    <p><strong>A vantagem que mais convence não é o desconto.</strong> É saber primeiro.
    Marca boa acaba rápido, e a cliente do clube não corre atrás — ela é avisada.</p>
    <p>Desconto qualquer loja copia amanhã. Avisar a cliente certa, no privado, quando chega
    a marca que ela usa, ninguém copia.</p>
  </div>
</section>

<section class="sec">
  <h2>Tabela de desconto</h2>
  <div class="tw"><table>
    <thead><tr><th>Produto</th><th class="num">Cliente do Clube</th><th class="num">Profissional</th></tr></thead>
    <tbody>
      <tr><td>Regra geral</td><td class="num">até 7%</td><td class="num">até 15%</td></tr>
      <tr><td>Marco Boni e Santa Clara</td><td class="num nao">sem desconto</td><td class="num">até 5%</td></tr>
      <tr><td>Wella</td><td class="num">5%</td><td class="num">até 10%</td></tr>
      <tr><td>Coloração</td><td class="num nao">sem desconto</td><td class="num">preço profissional</td></tr>
      <tr><td>Esmalteria</td><td class="num nao">sem desconto</td><td class="num nao">sem desconto</td></tr>
    </tbody>
  </table></div>
  <div class="regra"><span class="t">Cliente sem cadastro não tem desconto</span>
    <span class="d">O desconto é vantagem de quem é do Clube.</span></div>
  <div class="regra"><span class="t">Ter cadastro não significa desconto em toda compra</span>
    <span class="d">O desconto é uma ferramenta para fechar a venda, não uma obrigação.
    O máximo da tabela é o teto, não o padrão.</span></div>
  <div class="regra"><span class="t">Marco Boni e Santa Clara: o que é produto grande</span>
    <span class="d">Os 5% para profissional valem na embalagem grande — potão, pacotão, caixa,
    rolo. Item avulso não entra.</span></div>
  <div class="regra"><span class="t">Como funciona o desconto de aniversário</span>
    <span class="d">São 10% em uma única compra, em qualquer produto. Vale em qualquer dia do
    mês do aniversário — não precisa ser na data. A cliente apresenta a mensagem de parabéns
    que recebeu, e o desconto entra <strong>no lugar</strong> dos 7% do Clube, não somado.</span></div>
  <div class="regra"><span class="t">Desconto acima da tabela, apenas quando a gestão comunicar</span>
    <span class="d">Promoções específicas serão informadas por escrito antes de começarem.
    Em caso de dúvida, consulte a gerente antes de fechar a venda.</span></div>
</section>

<section class="sec">
  <h2>Premiação</h2>
  <h3>Prêmio semanal</h3>
  <p>A meta do mês é dividida em metas semanais. <strong>Toda semana em que a loja bate a meta,
  o prêmio daquela semana é pago</strong> e dividido entre a equipe, proporcional ao que cada
  uma vendeu.</p>
  <div class="tw"><table>
    <thead><tr><th>A loja fez</th><th class="num">Prêmio da semana</th><th class="num">Com 30%+ em Marcas A</th></tr></thead>
    <tbody>
      <tr><td>120% ou mais</td><td class="num">R$ 420</td><td class="num">R$ 470</td></tr>
      <tr><td>110%</td><td class="num">R$ 350</td><td class="num">R$ 400</td></tr>
      <tr><td>100%</td><td class="num">R$ 280</td><td class="num">R$ 330</td></tr>
      <tr><td>90%</td><td class="num">R$ 180</td><td class="num">R$ 230</td></tr>
      <tr><td>80%</td><td class="num">R$ 100</td><td class="num">R$ 120</td></tr>
      <tr><td>70%</td><td class="num">R$ 80</td><td class="num">R$ 100</td></tr>
    </tbody>
  </table></div>
  <p>Por isso é possível fechar o mês abaixo da meta e ainda assim ter recebido durante o mês:
  <strong>o pagamento é por semana batida.</strong></p>
  <h3>Prêmio mensal</h3>
  <p>Individual. Primeiro é preciso se qualificar por uma das duas condições:</p>
  <div class="calend">
    <div class="ev"><span class="quando">Condição A</span><span class="oque">A loja fez 90% ou mais da meta e a vendedora vendeu R$ 31 mil ou mais</span></div>
    <div class="ev"><span class="quando">Condição B</span><span class="oque">A loja ficou abaixo de 90% e a vendedora vendeu R$ 40 mil sozinha</span></div>
  </div>
  <div class="tw"><table>
    <thead><tr><th>Venda no mês</th><th class="num">Prêmio</th><th class="num">Com 30%+ em Marcas A</th></tr></thead>
    <tbody>
      <tr><td>R$ 55 mil ou mais</td><td class="num">R$ 600</td><td class="num">R$ 650</td></tr>
      <tr><td>R$ 50 mil</td><td class="num">R$ 500</td><td class="num">R$ 550</td></tr>
      <tr><td>R$ 45 mil</td><td class="num">R$ 400</td><td class="num">R$ 450</td></tr>
      <tr><td>R$ 40 mil</td><td class="num">R$ 300</td><td class="num">R$ 350</td></tr>
      <tr><td>R$ 35 mil</td><td class="num">R$ 200</td><td class="num">R$ 250</td></tr>
      <tr><td>R$ 31 mil</td><td class="num">R$ 100</td><td class="num">R$ 150</td></tr>
    </tbody>
  </table></div>
  <div class="regra"><span class="t">Marcas A</span>
    <span class="d">No prêmio semanal, o bônus considera as Marcas A da loja inteira.
    No prêmio mensal, considera as vendas de cada vendedora. As marcas que entram nessa
    contagem serão trabalhadas no treinamento de segunda-feira.</span></div>
  <div class="regra"><span class="t">Semana fechada não é recalculada</span>
    <span class="d">O valor apurado fica registrado, mesmo havendo mudança de equipe depois.</span></div>
</section>

<section class="sec">
  <h2>Calendário até dezembro</h2>
  <div class="calend">
    <div class="ev"><span class="quando">14 a 19/09</span><span class="oque">Semana do Cliente</span>
      <span class="obs">Maior oportunidade do ano para cadastrar clientes no ${CFG.clube}.</span></div>
    <div class="ev"><span class="quando">${CFG.aniv}</span><span class="oque">${CFG.anivTxt}</span></div>
    <div class="ev"><span class="quando">Novembro</span><span class="oque">Black Friday</span></div>
    <div class="ev"><span class="quando">Dezembro</span><span class="oque">Natal</span>
      <span class="obs">Mês de maior faturamento do ano.</span></div>
  </div>
  <p>As condições de cada data serão comunicadas por escrito antes de cada período.</p>
</section>

<div class="rodape">
  Este documento foi apresentado na reunião de 1º de setembro de 2026 e enviado à equipe.
  Serve como referência para consulta sobre Clube, desconto, premiação e calendário.
  Alterações nas regras serão comunicadas por escrito e este documento será atualizado.
</div>

</div>`;
fs.writeFileSync(`${W}/${CFG.arq}.html`,html);
process.stderr.write(`gravado ${CFG.arq}.html (${html.length} bytes) favicon ${CFG.fav}\n`);
