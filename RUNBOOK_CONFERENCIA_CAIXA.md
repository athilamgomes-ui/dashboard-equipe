# RUNBOOK — Conferência de Caixa

Criado em 29/07/2026. **Leia antes de mexer neste dashboard.**

## O que é

Compara, dia a dia e por loja, **o que o ERP registrou** nas vendas contra **o que a loja
declarou ao fechar o caixa**. Responde quatro perguntas:

1. **Conferência** — faltou ou sobrou dinheiro no caixa? (o coração do painel)
2. **Formas de pagamento** — quanto entrou em dinheiro, PIX, cartão, crediário; detalhe por bandeira.
3. **Sangria e saldo** — retiradas, suprimentos e saldo em dinheiro do caixa.
4. **Cartão → banco** — quanto de cartão foi vendido × quanto ainda está para cair, por administradora.

## Um comando

```bash
bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_conferencia_caixa.sh
```

Exit: `0` ok · `10` coleta falhou (preserva o dashboard anterior) · `20` build falhou (restaura)
· `30` lock. `build_conferencia_caixa.mjs` é o **ÚNICO escritor** de `conferencia_caixa.html` —
o agente nunca edita esse HTML na mão.

Variantes da coleta:
```bash
DIAS=90 node scripts/coleta_conferencia_caixa.mjs        # janela maior
FORCE_FULL=1 node scripts/coleta_conferencia_caixa.mjs   # ignora o cache e recoleta tudo
ONLY_EMP=1 node scripts/coleta_conferencia_caixa.mjs     # uma loja só (debug)
```

## 🔒 O painel é CIFRADO — e tem que continuar sendo

O repo `dashboard-equipe` é **público**, e este painel mostra falta de dinheiro com o nome do
operador do caixa. Por isso o JSON de dados vai **cifrado** (AES-256-GCM + PBKDF2 200k) dentro do
HTML e só é decifrado no navegador depois da senha — mesmo esquema do Painel Financeiro.

- Senha no Keychain: conta `caixa-web`, serviço `amgomes-caixa` (criada com a mesma senha do
  painel Financeiro, mas em entrada própria — dá pra rotacionar uma sem mexer na outra).
  Fallback: se `amgomes-caixa` não existir, o build usa `amgomes-financeiro`.
- Sem senha o build **aborta** (exit 20). Nunca "resolver" isso publicando em texto puro.
- `conferencia_caixa_raw.json` (dado cru, em claro) está no `.gitignore` — fica **só local**.
- O `.sh` tem duas travas de sanidade antes do push: exige `"iters"` no HTML (prova de cifragem)
  e rejeita nome de operador em texto puro.

Rotacionar a senha:
```bash
security add-generic-password -a caixa-web -s amgomes-caixa -w 'NOVA_SENHA' -U
```

## Fonte no ERP (Microvix)

| O quê | Tela | Endereço |
|---|---|---|
| Conferência (calculado × informado) | Faturamento › Loja › Relatórios › **Conferência de Caixas** | `faturamento/relatorio_conferencia_caixa.asp` |
| Detalhe por bandeira/plano | Faturamento › Relatórios › **Faturamento por Planos** | `faturamento/relat_fat_planos.asp` |
| Recebível de cartão | Adm./Financeiro › Contas a Receber › **Faturas a Receber** | `financeiro/relatorio_faturas_periodo.asp?tipolanc=receber&filtro_adm_cartao=S` |

Toda coleta é **Playwright headless** (`microvix_auth.mjs`, Keychain `microvix-cron`).
Chrome MCP no Microvix continua PROIBIDO — ver REGRA Nº 1 do CLAUDE.md.

⚠️ A tela de Conferência de Caixas aceita **1 empresa + 1 dia por requisição** — não tem filtro de
período nem multi-empresa. Por isso a coleta é dia×loja e usa cache incremental
(`conferencia_caixa_raw.json`): dias com mais de 3 dias de idade não são recoletados.

### Por que a coleta usa POST direto (e não navegação)

Recarregar `relatorio_conferencia_caixa.asp` e submeter o form a cada consulta custava **~108s por
item** — 45 dias × 4 lojas daria mais de 2 horas. O form posta em
`faturamento/listagem_conferencia_caixa.asp`; o coletor serializa o form **uma vez**
(`prepararFormBase`) e depois manda um `fetch` POST por item (`coletarDiaRapido`): **~11s por item**,
10x mais rápido. Primeira execução (180 itens) ≈ 30 min; as diárias fazem ~16 itens ≈ 3 min.
Validado em 29/07 contra o método antigo: resultados idênticos nas 4 lojas.

⚠️ O HTML da resposta é injetado num container **fora da tela** (`position:absolute;left:-99999px`),
**nunca `display:none`** — com `display:none` o `innerText` degrada para `textContent` e some com os
`\t` que separam as colunas da tabela, quebrando o parser inteiro.

Se `prepararFormBase` falhar, o coletor cai sozinho no caminho lento por navegação (`coletarDia`).

⚠️ **Encoding:** o Microvix serve ASP em **windows-1252** e não manda charset no header. `r.text()`
assume UTF-8 e "Cartão" vira "Cart�o" — aí os regexes de Cartão, Crediário, Convênio, Depósito e
Devoluções param de casar e essas formas **somem sem erro nenhum** (Dinheiro e PIX, sem acento,
continuam funcionando, então o bug fica invisível). Por isso `coletarDiaRapido` lê
`arrayBuffer()` + `TextDecoder`, e `interpretarResposta` aborta se achar `�` no texto.
Aconteceu em 29/07: o painel publicou Cartão R$ 0 enquanto o relatório de planos mostrava
R$ 201 mil no mesmo período. Navegação normal não sofre disso (o browser lê o `<meta charset>`).

## 🔑 A regra mais importante: "informado" em dinheiro é SALDO, não movimento

O ERP mostra três colunas por forma de pagamento, mas elas **não significam a mesma coisa** para
dinheiro e para as outras formas:

- **Valor Calculado** = o que o ERP registrou nas vendas do dia (fluxo).
- **Valor Informado** — para cartão/PIX é o mesmo fluxo (o próprio ERP preenche, por isso bate
  sempre exato). Para **dinheiro** é o **saldo físico da gaveta no fim do dia**.

Comparar os dois direto no dinheiro não quer dizer nada. O teste correto (dado pelo Athila em
29/07/2026 e validado nos dados):

```
caixa_esperado = caixa_de_ontem + dinheiro_do_dia + suprimentos − sangria
diferença      = caixa_informado − caixa_esperado
```

Exemplo que fecha (L4, 28/07): 891,30 (caixa de 27/07) + 906,05 (dinheiro) − 750 (sangria)
= 1.047,35 contra 1.047,40 informado → diferença de R$ 0,05.

Tolerância: **R$ 1,00/dia** (troco arredondado). No acumulado, o limite escala junto
(nº de dias × R$ 1,00) — R$ 17 de deriva em 43 dias não é rombo.

A corrente **quebra** em dia `não fechado` (não há saldo confiável para o dia seguinte partir) e
**atravessa** dias `sem movimento` (domingo: a gaveta não é tocada, o saldo continua o mesmo).

⚠️ **O saldo de partida só vale se o dia anterior foi realmente contado.** Depois de um dia
`sem contagem` o "informado" é o dinheiro do dia, não a gaveta — usar isso como base acusa
sobra/falta inexistente. Em 29/07 a L3 contou o caixa pela primeira vez e a base era o valor
espelhado de 28/07: daria **+R$ 647,45 de sobra fantasma**. O dia vira `sem base` até existir
uma contagem real anterior. Um dia contado, mesmo divergente, é base válida.

⚠️ Antes de 29/07 o painel fazia `informado − calculado` e acusava divergência em quase todo dia.
Era erro de premissa, não do dado.

⚠️ **Nunca exibir o "Saldo Inicial/Final (em Dinheiro)" do ERP.** Esse campo contradiz a
conferência real: em 28/07 dava −R$ 38,85 para a L4 enquanto o caixa físico era R$ 1.047,40 e
fechava com R$ 0,05 de diferença. Exibi-lo pintava de vermelho ("9 dias com saldo negativo")
justamente a loja que mais acerta — duas abas do mesmo painel dizendo coisas opostas. Por isso
`saldo_inicial`/`saldo_final` são coletados mas **não vão para o payload**. O saldo que vale é
`caixa.inf` (o informado no fechamento), usado igual nas abas Conferência e Sangria.

## 🚩 "Sem contagem": L3 e L5 fecham o caixa, mas não confrontam nada

Medido sobre 45 dias (15/06 a 29/07/2026), o resultado é **binário por loja**:

| Loja | Dias fechados | Informado = sistema | Informado ≠ sistema |
|---|---|---|---|
| L1 | 33 | 0 | **33** |
| L4 | 35 | 0 | **35** |
| L3 | 35 | **35** | 0 |
| L5 | 33 | **33** | 0 |

O fechamento **existe** em L3 e L5 — o filtro "Listar apenas usuários com fechamentos" retorna
`caixaitb.casadabeleza` e `marialuiza.casadabeleza`. O que muda é a estrutura: nessas lojas as
vendas ficam num login (`admitb`) e o fechamento é lançado em outro (`caixaitb`), então o bloco
do caixa vem com **Valor Calculado zerado** e os valores declarados (dinheiro, cartão, PIX)
coincidem exatamente com os do outro login. Em 68 fechamentos, nenhuma diferença.

Em L1 e L4 é o mesmo operador que vende e fecha, e o dinheiro declarado diverge do sistema em
100% dos dias — contagem real. Deriva de julho: R$ 15,37 (L1) e R$ 1,95 (L4).

O painel marca L3/L5 como **`sem contagem`** (roxo) e as tira do cálculo de deriva. Tratá-las como
divergência gerava falta fantasma de −R$ 5.818 (L3) e −R$ 2.418 (L5), puro artefato.
Regra: `informado == calculado` e (houve sangria **ou** existia saldo anterior).

⚠️ Não afirmar que "não conferem" — o fechamento é lançado. O que o dado sustenta é que a
declaração não apura diferença. Se o processo mudar (fechamento no login que tem as vendas),
essas lojas passam a cair na conferência normal sozinhas.

## 🔎 Aba "Conciliação da maquininha" (upload da equipe financeira)

A equipe escolhe a loja, arrasta o CSV exportado da adquirente e o painel cruza tudo na hora.

**O arquivo NÃO sai do navegador.** Nada de upload para servidor, Supabase ou Worker: o CSV é lido
com `File.text()`, conciliado em JavaScript e descartado ao fechar a aba. Foi decisão de projeto —
é dado financeiro bruto com nome de cliente. Se algum dia precisar persistir, cifrar antes.

Insumo do lado do ERP: `movimento` no raw JSON — Movimento Diário **analítico** (documento a
documento) por loja, janela do 1º dia do mês anterior até hoje, coletado por
`coletarMovimentoDiario`. Sem isso a aba avisa que falta rodar a atualização.

**Dois arquivos por loja, formatos diferentes** (`detectarTipo`):
- **relatório da maquininha** — uma linha por cobrança; tem coluna de forma ("Meio") e Status.
  Concilia contra o campo `car` do movimento diário.
- **extrato da conta** — uma linha por lançamento; tem "Tipo de transação" e "Detalhe"
  (Pix Recebido/Enviado, Depósito de vendas, Cancelamento). Concilia o **PIX recebido** contra o
  campo `pix`, e resume o movimento da conta (depósitos = liquidação de cartão, já líquida de taxa).

⚠️ Até 30/07 o painel só conhecia o primeiro e devolvia "não reconheci as colunas" para o extrato.

⚠️ Depósito de venda, PIX enviado e estorno **não são pagamento de cliente** e não podem entrar
como candidatos a "forma trocada" — geravam falso positivo do tipo "venda paga com Depósito de
vendas". Só `pix_recebido` (e, no arquivo da maquininha, as próprias transações) valem.

### Histórico (Supabase, cifrado no navegador)

Cada conciliação é **guardada sozinha** ao terminar, na tabela `conferencia_caixa_conciliacoes`
(SQL versionado em `scripts/conferencia_caixa_conciliacoes.sql` — rodar uma vez no editor SQL
do Supabase). Guarda o resultado **e os CSVs originais**, para dar pra reprocessar se o
algoritmo melhorar.

⚠️ O conteúdo é cifrado **no navegador**, com a senha do painel, antes de subir (AES-256-GCM +
PBKDF2, mesmo envelope do painel). O Supabase e a chave anon só veem um blob. Em claro sobem
apenas loja, período, data e nome dos arquivos — o mínimo para listar. **Nunca subir o payload
em texto puro**: são valores e nomes de clientes.

Uma conciliação por (loja, período): recarregar o mesmo período substitui em vez de duplicar
(índice único + `Prefer: resolution=merge-duplicates`).

O × no chip tira da tela, **não apaga do histórico**. Cada linha do histórico tem um × próprio,
esse sim apaga no Supabase (com confirmação nomeando loja e período).

⚠️ **Teste sempre com `?teste=1` na URL.** O upload grava sozinho no Supabase, e verificações
automatizadas contra a página publicada regravavam a conferência a cada rodada — o Athila apagava
o registro e ele reaparecia. Com a flag, o painel funciona igual mas não grava. Melhor ainda:
testar numa cópia local, não na URL publicada. Sem a tabela criada, o painel avisa e
segue funcionando na sessão.

⚠️ **Uma loja por vez na tela — inclusive no histórico.** Trocar o seletor de loja limpa o
resultado E refiltra a lista de conferências guardadas (`loja=eq.X` no próprio Supabase). O painel já
acumulou várias lojas ao mesmo tempo e isso confundia: ao selecionar outra empresa, a
conferência da anterior continuava visível e parecia ser da loja recém escolhida. Limpa só a
tela — o histórico continua guardado, e abrir do histórico alinha o seletor com a loja aberta.

### Cruzamento das 4 pontas

Tabela por documento/cobrança, com a linha destacada quando algo não fecha:

| # | Coluna | De onde vem |
|---|---|---|
| 1 | Venda no ERP | total do documento (`v`) |
| 2 | Pagamentos no ERP | soma de **todas** as formas do documento (`pag`) |
| 3 | Venda na maquininha | valor bruto cobrado |
| 4 | Recebimento | líquido (bruto − taxa da adquirente) |

Mais duas colunas: **Plano** (PIX, Débito, Crédito 1x/2x/3x… vindo das parcelas da maquininha;
quando a venda só existe no ERP, cai para a forma registrada) e **Taxa efetiva**, calculada de
`(bruto − líquido) ÷ bruto`. Abaixo da tabela vai o resumo **Taxa efetiva por plano**, que é o
que se compara com a tabela de taxas da adquirente.

⚠️ A taxa efetiva sai do **dinheiro que entrou**, não da coluna "Taxa Aplicada (%)" do relatório.
Quando as duas divergem em mais de 0,05 p.p., a linha acende — é justamente esse confronto que
interessa. A **faixa** (menor e maior taxa do plano) revela bandeiras com preço diferente dentro
do mesmo parcelamento.

Acende quando: 1≠2 · cartão no ERP sem cobrança · cobrança sem venda · cartão no ERP ≠ bruto ·
bruto − taxa ≠ líquido. Tolerância R$ 0,05.

⚠️ O campo `pag` soma **todas** as colunas de forma de pagamento. Guardar só dinheiro/cartão/
PIX/link fazia documento pago em crediário ou convênio aparecer como "pagamentos < venda".
Medido em 9.586 documentos (jun+jul): 1 e 2 batem em 100% — o cruzamento existe como rede de
segurança, não porque haja erro hoje.

⚠️ Cobrança que pagou vários documentos vem marcada com `⋯` e **fica fora** da checagem de
valor: o bruto é do conjunto, comparar linha a linha acenderia falso.

⚠️ O par ERP↔transação é guardado por **id**, nunca por referência mútua. `e.par = t` +
`t.par = e` cria estrutura circular e quebra o `JSON.stringify` do salvamento no histórico —
e como a chamada estava fora do `try`, a conciliação parava de ser guardada em silêncio.

**Algoritmo de casamento** (nesta ordem, guloso):
1. valor exato (± R$ 0,005), mesmo dia → ±1 dia → ±3 dias (venda no fim do expediente cai no dia seguinte);
2. valor aproximado (± R$ 0,15) → classifica como **diferença de centavos**;
3. uma cobrança = soma de 2 ou 3 documentos → **cobrança agrupada** (normal);
4. o que sobrou de cada lado tenta explicar como **forma de pagamento trocada**: procura no outro
   lado um lançamento do mesmo valor (±0,10) pago de outro jeito (PIX, dinheiro, link);
5. o resto vira **cobrado na maquininha sem venda no ERP** (mais grave) ou **cartão no ERP sem
   cobrança na maquininha**.

O parser de colunas é tolerante (`acharCol`) para aceitar outras adquirentes além da InfinitePay;
se não achar data, valor e meio, avisa em vez de inventar. Só transações aprovadas entram
(ignora negada/cancelada/falhou).

⚠️ Combinações de documentos têm trava de 4.000 iterações — sem isso um dia com muitos documentos
soltos travava o navegador.

Validado em 29/07 contra a análise manual da L5 (julho): mesmas 4 formas trocadas, 4 cobranças sem
venda (R$ 363,00), 4 vendas sem cobrança (R$ 415,03), 5 casos de centavos e 1 cobrança agrupada.

## 🚫 Vendas canceladas no POS

Fonte: Faturamento › Relatórios › **Vendas Cancelados no POS**
(`faturamento/relatorios/vendas_canceladas_pos/vendas_canceladas_pos.html`, webapp Vue).

⚠️ O relatório **não tem coluna de empresa** — só Estação e Usuário. Por isso o coletor consulta
**uma loja por vez** (multiselect Vue: clicar em `.multiselect__placeholder` e depois no nome).
Juntar as quatro numa consulta só deixaria sem saber de quem é cada linha.

O casamento cancelada → venda refeita é feito no build (`casarCanceladas`): mesmo valor (±0,02),
mesmo dia ou o seguinte, e classifica a confiança pela distância do número do documento:
`forte` (mesmo dia, documento de 1 a 40 depois) · `media` · `fraca`.

⚠️ Comparar número de documento só é exato **dentro da mesma série**, e o movimento diário não
traz a série. Além disso o ERP às vezes repete o mesmo número para cancelamentos recentes
(vimos 12937 em três linhas da L5). Por isso o painel **classifica a confiança em vez de afirmar**.

Medido em 01/06–30/07/2026: **634 cancelamentos, R$ 91.697,14**. Nenhum com motivo preenchido
nas quatro lojas — o campo existe no POS e ninguém usa. L4 concentra 382 (R$ 62 mil).

Validação (L5, julho): das 18 refeitas com indício forte, **todas as 18** têm a cobrança
correspondente no relatório da maquininha, e nenhuma cobrança em duplicidade. O horário mostra a
sequência real: cobra no cartão/PIX → cancela no POS → refaz e finaliza, tudo em 1 a 2 minutos.

### Verificação fina: data, hora, vendedora e produtos

Pedido do Athila em 30/07. Só valor + dia não prova que a venda voltou. A verificação abre o
**detalhe do documento** (`imprime_doc.asp`, a mesma tela que abre ao clicar no Doc/Emp do
movimento diário) — é o **único** lugar com hora e vendedor por documento.

Para chegar lá é preciso o `identificador` (GUID) que vem no `onclick` do link do documento no
movimento diário; por isso o coletor guarda `gid` e `ser` de cada linha.
Custa uma requisição por candidato, então roda **numa loja por vez** (`VERIFICAR_CANC`, hoje L5).

Critérios: mesmo dia · hora dentro de 30 min · mesma vendedora · produtos.

⚠️ **Produtos por contenção, não por igualdade.** O relatório de cancelamentos traz a lista de
produtos **incompleta** (visto na L5: documento de R$ 67,83 listando um único item de R$ 34,90).
Exigir conjunto idêntico marcava "produtos divergentes" em 18 de 18 — falha do relatório, não
divergência real. O teste é: todo item da cancelada aparece na refeita, com quantidade
compatível. Quando um dos lados não tem itens, o critério fica **nulo** em vez de falso.

⚠️ O parse dos itens do documento depende do layout: o código fica sozinho numa linha e a
descrição vem 1 a 3 linhas depois, começando com TAB, com os campos
`['', desc, CST, CFOP, Und, Qtd, ValorUnit, DescProduto, ValorTotal]`.

Resultado na L5 (jun+jul): 23 cancelamentos com candidato, **16 batendo os 4 critérios**.

## 💰 Nunca arredondar

Conferência de caixa se faz no centavo. O caixa da L1 em 03/07 tinha **786,85**, não 787 —
arredondar esconde exatamente a diferença que o painel existe para achar. As tabelas de
Conferência e Sangria usam `nf2` (2 casas) em todas as colunas de dinheiro.

## ⚠️ Regras de negócio que já custaram caro

- **Consolidar por LOJA, nunca por operador.** Em Itaituba (L3) as vendas saem no usuário
  `admitb` e o fechamento é lançado no `caixaitb`. Olhando por operador, aparece falta de 100%
  num e sobra de 100% no outro — falso alarme puro. A consolidação é feita no nosso parser
  (`parseConferencia`), somando todos os operadores da loja no dia. O checkbox
  "Listar conferência consolidada" do ERP **não faz isso** (testado em 29/07: continua um bloco
  por usuário).
- **"Não fechado" ≠ falta de dinheiro.** Se ninguém lançou o fechamento, o Valor Informado vem
  zerado. O painel marca esses dias como `não fechado` (âmbar), exclui do cálculo e reinicia a
  corrente de saldo. Nunca tratar como desvio.
- **Status possíveis:** `sem_movimento` (domingo/feriado) · `nao_fechado` · `nao_conferido` ·
  `sem_base` (dia seguinte a um não fechado) · `ok` · `divergente`.
- **Janela publicada:** a constante `DATA_MINIMA` no build corta em 01/07/2026. Junho está no
  cache mas foi coletado antes da correção de encoding (cartão/crediário faltando). Para liberar
  o histórico: recoletar com `DIAS=` maior + `FORCE_FULL=1` e apagar a constante.
- **Recebível de cartão:** o `RUNBOOK_FINANCEIRO` diz que "não existe contas a receber" porque o
  grupo vende tudo à vista — isso vale para o *cliente*, não para a *adquirente*. Cada parcela de
  cartão vira um recebível da administradora (STONE etc.) com data de vencimento; em 29/07 havia
  R$ 360.862,57 em aberto para os 3 meses seguintes. É daí que sai a aba "Cartão → banco".
  O parse pega as linhas `Subtotal do grupo X em reais` (soma confere com o "Total Geral a
  Receber" do próprio relatório).

## Achados da primeira coleta (27/07/2026)

- L1 −R$ 61,60 e L4 −R$ 128,65 em dinheiro no mesmo dia; cartão e PIX bateram exatos.
  Padrão típico de erro de troco/sangria, não de cartão.
- L1 não fechou o caixa em 28/07 (e 26/07 é domingo).
- Saldo final em dinheiro negativo aparece com frequência (L1 −39,60; L3 −218,40; L4 −38,85):
  sangria lançada a maior ou troco não registrado.

## Agendamento

Task MCP `dashboard-conferencia-caixa-update`, 1x/dia às 20:10 (depois do fechamento das lojas e
fora da janela do financeiro das 19:55). O launchd `com.amgomes.dashboard` já acorda o Claude
às 18:30; a task roda quando o app está aberto.
**Nunca** criar launchd chamando `/bin/bash` num script do `~/Desktop` — TCC bloqueia
(ver memória `launchd_tcc_desktop_bash`).

## Cache do GitHub Pages

`max-age=600`. Depois de todo deploy, entregar a URL com `?v=<número novo>` e citar o selo
"Coleta do ERP" visível no topo do painel. Reinstalar PWA nunca deve ser necessário.

## Histórico: reabrir REPROCESSA os arquivos (30/07/2026)

`abrirHistorico()` não usa mais o resultado congelado — ele roda `processarConteudo()` de novo
sobre os CSVs originais guardados no registro. Motivo: os primeiros registros foram salvos antes
de o parser ler `Meio - Parcelas` e `Taxa Aplicada - Aplicada(%)`, então reabrir mostrava o resumo
por plano com só "Crédito 1x" e "Débito" e a coluna Informada vazia. Com o reprocessamento, todo
registro antigo se beneficia de qualquer melhoria futura do parser. Se algum registro não tiver o
conteúdo bruto de TODOS os arquivos, cai para o resultado salvo e o chip mostra "salva (resumo antigo)".

## O relatório da maquininha NÃO diz de que loja é

Subir o arquivo da L5 com a L1 selecionada gera uma conferência silenciosamente errada: o lado da
maquininha é da L5 e o lado do ERP é da L1. Aconteceu de verdade — os registros de L1 e L5 de
02/05 a 30/07 guardavam os MESMOS dois arquivos (byte a byte). Não há coluna no CSV que identifique
a loja (`Origem - Nome` é o portador do cartão), então a defesa é `impressao()`: FNV-1a + tamanho,
gravado no metadado EM CLARO de cada arquivo, comparado contra o histórico a cada upload. Se o mesmo
arquivo aparecer em outra loja, o painel avisa na tela.

## A chave do resultado ≠ o campo do ERP (30/07/2026)

`conciliarForma(loja, externos, campo, ...)` recebe o campo do movimento diário: **`car`** para
cartão, `pix` para PIX. O resultado, porém, é guardado em `conciliacoes[loja].cartao`. `blocosForma`
usava a chave do resultado (`"cartao"`) para ler o documento do ERP (`e[campo]`) — devolve `undefined`,
e quatro tabelas do bloco de cartão saíam com a coluna do ERP em **R$ 0,00** e a diferença zerada
(totais por dia, "no ERP sem lançamento na maquininha", diferença de centavos, um lançamento pagando
vários documentos). O PIX escapou por coincidência: lá as duas chaves são a mesma palavra.
O resultado carrega `campo` — use `r.campo` para ler o ERP, nunca a chave do bloco.

## Colunas "na maquininha" × "no ERP" saíam invertidas

Em `trocadas`, o campo `formas` é sempre a descrição do lado do **ERP** (a tabela mostra sob "No ERP").
Nas sobras do lado do ERP ele recebia `cand[0].meio`, que é o lado externo — a linha saía dizendo
"na maquininha: Pix / no ERP: Pix" para uma venda que no ERP era cartão, escondendo exatamente a
troca que a tabela existe para mostrar. Agora as duas pontas usam `formasDoDoc(e)`.

## Identificar a loja do arquivo: pelo NOME

O relatório da adquirente não tem coluna de empresa (`Origem - Nome` é o portador do cartão), então
a convenção é a equipe começar o nome do arquivo pela loja: `L5 maquininha julho.csv`. `lojaDoNome()`
reconhece `L1`/`L3`/`L4`/`L5` isolado e as cidades sem ambiguidade (Itaituba→L3, Santarém→L5;
**Altamira não serve**, tem duas lojas). Nome divergente da loja selecionada **recusa** o arquivo.
Arquivo recusado não cria a loja no estado — a análise roda num objeto à parte e só funde se passar.

## Como o casamento funciona hoje (31/07/2026) — e o que ele já errou

O Athila viu cobranças de R$ 53,80 e R$ 200,82 marcadas como "cobrança na maquininha sem venda no
ERP" com a venda presente no movimento diário. **Não era dado faltando** — o movimento do painel
bate com o fechamento de caixa dia a dia (confira com a soma de `car` por dia × `dias[].formas.cartao.calc`).
Era o motor de casamento.

Ordem dos passos em `conciliarForma`, e por que cada um existe:

| # | Passo | Motivo |
|---|---|---|
| 1 | valor exato, ±3 dias, **melhor ajuste** | antes era primeiro-que-serve: uma cobrança de 19/06 ficava com o documento de 18/06 que era de outra, e a legítima sobrava como "sem venda" |
| 2 | 1 cobrança pagando N documentos | cliente paga duas compras numa passada só |
| 3 | **N cobranças pagando 1 documento** | cliente divide a compra em dois cartões — era a maior fonte de alarme falso |
| 4 | mesma venda, valor diferente (1%, teto R$ 5) | R$ 0,30 em R$ 703 virava DOIS erros: "sem venda" de um lado e "sem lançamento" do outro |
| 5 | forma de pagamento trocada | entrou como cartão, no ERP foi finalizada de outro jeito |
| 6 | sobra de verdade, com o vizinho mais próximo | dizer só "sem venda" manda o Athila procurar no ERP às cegas |

**Passo 3 é o que consertou a queixa.** O ERP tem UM documento de R$ 131,94; a adquirente tem DUAS
cobranças (R$ 31,94 + R$ 100,00, às 14:27 as duas). Sem esse passo, uma venda certa gerava três
alarmes: as duas cobranças como "sem venda no ERP" e o documento como "sem lançamento" — e ainda
sobrava uma delas para ser adotada como "forma trocada" por coincidir com o total de outra venda.
A trava é **hora**: as cobranças precisam estar a até 30 min uma da outra, senão somas coincidentes
do dia inteiro casariam por acaso.

⚠️ **Passos 3 e 4 são os que mais podem criar par falso.** Se um dia for preciso afrouxar, afrouxe
o passo 4 (tolerância) e não o 3 (janela de hora). E rode o teste de invariante antes de publicar:
toda cobrança tem que cair em **exatamente uma** categoria e a soma das categorias tem que bater
com o total do arquivo.

L5, maio–junho: "sem venda no ERP" caiu de 13 (R$ 2.144,30) para 5 (R$ 312,50); "sem lançamento",
de 20 para 12.

## Sobreposição PARCIAL do período é pior que nenhuma (31/07/2026)

`conciliarForma` recusava o arquivo quando ele estava TODO fora da janela de movimento coletada,
mas deixava passar a sobreposição parcial: arquivo até 31/07 com movimento até 30/07 fazia o dia 31
inteiro virar "cobrança sem venda no ERP", sem nenhum aviso. Agora esses dias saem da análise e
aparecem no quadro **"fora do período que o painel tem do ERP"**. Se ele aparecer, a resposta é
rodar `atualizar_conferencia_caixa.sh` e recarregar o arquivo — não é falta de venda.

## Rodar o motor fora do navegador (para depurar)

Não dá para depurar isso clicando na página. O jeito rápido é carregar `conferencia_caixa_app.js`
num contexto `vm` do Node com stubs de `document`/`PUBLICO`, injetar `D = {movimento, movimentoPeriodo}`
do `conferencia_caixa_raw.json` e chamar `processarConteudo()` direto com o CSV. Aí dá para listar
o que sobrou de cada lado e testar hipótese em segundos, sem senha, sem Pages e sem gravar nada.

## O último dia da janela é MEIO DIA (31/07/2026)

Caso real: o Athila viu a venda de R$ 53,80 da L5 em **30/07** como "sem venda no ERP". A venda
existia (doc 12966|10, cartão R$ 53,80) — o painel é que não tinha a **tarde** daquele dia.

Por quê: a coleta roda em hora fixa. A última boa tinha sido 30/07 às **14:50**, porque a das 20:40
morreu em `NAV_FAIL / api_token_lma indisponível` (migração de auth do Microvix — ver memória
`microvix_migracao_auth_jwt_2026_07`; o `tokenOpcional: true` no coletor da conferência só entrou
em 31/07 09:41). O movimento do dia 30 parava no doc 12951|10, mas a data entrava na janela como
se o dia estivesse fechado. Tudo o que a loja vendeu depois das 14:50 virava cobrança sem venda —
inclusive o R$ 53,80 e o R$ 200,82, documentos 12965 e 12966, feitos no fim da tarde.

`conciliarForma` agora compara a hora da cobrança com `D.geradoEm` **quando a coleta caiu no último
dia da janela**, e manda as posteriores para o quadro "o painel ainda não tem essa parte do ERP",
com o motivo escrito na linha. Some sozinho quando a coleta da noite roda depois do fechamento.

**Regra geral que vale para todo painel:** dia coletado ≠ dia fechado. Se o pipeline não roda depois
do fechamento da loja, o último dia é parcial e qualquer cruzamento contra ele acusa falta que não
existe. Antes de investigar divergência do dia mais recente, confira `geradoEm`.

## Várias conferências na tela + recorte por data (31/07/2026)

O Athila vai carregar arquivo **todo dia, das quatro lojas**, e quer poder ver o relatório de um dia
escolhido ou de um mês / vários meses. O modelo antigo não servia: era **uma conferência por loja**
(`conciliacoes[loja]`), trocar a loja limpava a tela e abrir outro período substituía o anterior.

Hoje:

- `conciliacoes` é chaveado por **`loja|ini|fim`** e `ordemCarga` guarda a ordem de entrada.
  Cabem quantas conferências forem carregadas, de qualquer loja e período.
- A barra **Período do relatório** (`c-de` / `c-ate` + atalhos hoje / ontem / este mês / mês passado /
  tudo) recorta TUDO que aparece abaixo. `recorte()` refaz os totais a partir das listas — usar os
  totais originais mostraria o mês inteiro num relatório de um dia só.
- **Abrir do histórico ACRESCENTA**, não substitui. `abrir todas do período` abre de uma vez todas as
  guardadas que tocam a faixa escolhida — é o caminho normal para "quero ver o mês", já que o dia a
  dia fica salvo em N registros.
- O histórico lista as **quatro lojas** (filtro próprio, "todas" por padrão). Antes seguia o seletor
  de upload, o que impedia montar um relatório do grupo.

⚠️ **Dia coberto por duas conferências**: carregar o arquivo do mês e depois o do dia 30 contaria o
dia 30 duas vezes — dobraria o faturamento e inventaria divergência dos dois lados. `rConcil` resolve
por dono: cada `loja|dia` pertence à conferência **carregada por último**, e um aviso amarelo lista os
dias repetidos. Ao mexer no render, não perca esse desempate.

⚠️ Arquivos do mesmo dia e loja (maquininha + extrato) têm que cair na **mesma** conferência: o
histórico grava por `(loja, periodo_ini, periodo_fim)` e dois registros com a mesma chave se
sobrescrevem no upsert. `carregarArquivos` funde quando a loja é a mesma e os períodos se cruzam.

Corrigido de passagem: `#c-resultado` estava **fora** de `#p-concil` (um `</div>` sobrando fechava a
aba antes da hora), então o resultado ficava visível em qualquer aba.

## Memória automática: não existe botão "abrir" (31/07/2026)

O Athila perguntou por que havia um botão **abrir** se ele só quer carregar os arquivos e depois
escolher períodos. Estava certo — o botão era trabalho manual para uma decisão que o painel já tem
como tomar sozinho. Hoje:

- ao entrar na aba, o painel lê o índice do histórico e **busca sozinho** todas as conferências que
  tocam o período escolhido (`sincronizarPeriodo`);
- mudar loja ou período dispara a busca de novo, e `jaBuscados` impede decifrar duas vezes o mesmo
  registro na sessão (decifrar + reprocessar o CSV é a parte cara);
- a caixa "Conferências na memória" perdeu a coluna *Guardada em* e o botão *abrir*. A hora em que
  alguém subiu o arquivo não muda nada na conferência — o que importa é o período do movimento.
  Sobrou o × para tirar da memória um arquivo carregado errado, e a linha some do relatório junto.

**Consequência prática: ver "o mês" não exige carregar um arquivo do mês.** O mês é a soma dos dias
já carregados, cada um no seu registro. É esse o pedido do Athila e é o que o `dono` por `loja|dia`
torna seguro — dias repetidos entre registros contam uma vez só.

O padrão abre em **mês corrente**, não em "tudo": quem entra para conferir o movimento de hoje não
precisa esperar o histórico inteiro ser decifrado.

⚠️ Subir o extrato de um dia cujo relatório da maquininha já está na memória tem que **completar**
aquela conferência, não criar outra. `carregarArquivos` funde por loja + período que se cruzam,
inclusive quando a conferência veio do histórico (`doHistorico`) — sem isso a segunda carga
sobrescreveria a primeira, que tem a mesma chave, e o cartão sumiria.

## Quebra por loja quando o relatório é do grupo (31/07/2026)

`Loja do relatório` = todas → o quadro de totais sai **por loja**, com linha de Total. Uma loja
escolhida → volta a sair **por dia**. Pedido do Athila: numa visão de várias lojas e vários meses, a
lista por data é uma parede de linhas que não responde nada; a pergunta é *qual loja não fecha*.
A regra no código é `lojasVisiveis.size > 1`, não o valor do seletor — assim escolher "todas" com só
uma loja carregada ainda mostra o dia a dia, que é o útil.

Há dois seletores de loja e eles são coisas diferentes: **Loja do arquivo** (de quem é o CSV que vou
subir) e **Loja do relatório** (o que quero ver). Estão rotulados assim de propósito.

## Botão 🔄 Atualizar e vazio que explica (31/07/2026)

O Athila relatou "não há botão para rodar a atualização, então mesmo selecionando loja e período não
consigo ver os dados". Duas coisas por trás:

1. **A tela ficava muda quando não havia dado.** Só existiam conferências da L5; escolher L1/L3/L4
   dava a mensagem genérica "nenhum lançamento no período", que soa como painel travado. Agora o
   vazio diz o que **existe** na memória — loja por loja, com o intervalo de datas — ou avisa que
   nunca foi carregado arquivo daquela loja. Vazio tem que explicar por que está vazio.
2. **Pedido de sincronização durante outro era descartado** (`if (sincronizando) return`). Trocar a
   loja enquanto a busca inicial rodava deixava a escolha sem efeito. Agora fica `pedidoPendente` e
   roda em seguida.

O botão **🔄 Atualizar** existe mesmo com a busca automática, por um motivo que a automação não
cobre: outra pessoa pode carregar arquivo de outro computador. Ele relê o índice do Supabase e busca
o que faltar. O andamento aparece em `#c-sinc`, na própria barra — antes o aviso morava dentro da
caixa do histórico, que é reescrita durante a sincronização e apagava o texto.

## Motor fora do navegador: `conciliar_headless.mjs` (05/08/2026)

A seção "Rodar o motor fora do navegador (para depurar)" acima virou script de verdade:
`scripts/conciliar_headless.mjs`. Carrega o MESMO `conferencia_caixa_app.js` num contexto `vm`
com stubs de `document`/`PUBLICO`/`sessionStorage`, injeta `D` do `conferencia_caixa_raw.json` e
chama `processarConteudo()`.

```bash
node scripts/conciliar_headless.mjs --loja L1 "L1 maquininha 04-08.csv"
node scripts/conciliar_headless.mjs --dir ~/.claude/caixa-arquivos   # loja pelo NOME do arquivo
```

⚠️ **Nunca copiar função do app para cá.** Duas cópias divergem e o painel passa a mostrar
resultado diferente do que o robô mandou no resumo. Se precisar de algo novo, mexa no app.

Detalhes que custaram tempo:
- `D` é `let` no topo do app → vive no escopo léxico do contexto, **não** como propriedade do
  global. `ctx.D = ...` não tem efeito; a injeção é `vm.runInContext("D = __D;", ctx)`.
- `location.search` do stub é `?teste=1` de propósito: `MODO_TESTE` fica ligado e o motor **nunca**
  grava no Supabase sozinho. Gravar é responsabilidade de quem chama.
- Só o topo do app toca no DOM (selo, senha da sessão, seletor). Todo o resto está em `iniciar()`,
  que o headless não chama — por isso os stubs são mínimos.

**Validação (05/08/2026):** `infinite_pay_report.csv` (28–29/07) rodado contra as 4 lojas — bate
exato só na L1 (R$ 4.136,82 nos dois lados, zero sobra dos dois lados); L3/L4/L5 acusam dezenas de
divergências. Serve como rede extra contra arquivo carregado na loja errada.
