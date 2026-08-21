# RUNBOOK — Dashboard de ESTOQUE (dashboard_estoque)

> Criado em 19/08/2026. **Carregue este arquivo SEMPRE que for mexer no painel de estoque.**
> O desenho e a justificativa de cada número estão em `SPEC_ESTOQUE.md` (escrito antes do código).

## Um comando

```bash
bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_estoque.sh
```

Exit: `0` ok · `10` coleta falhou ou sanity reprovou (**preserva a versão anterior**) ·
`20` build falhou (restaura o HTML) · `30` lock (execução concorrente ou perfil do Microvix ocupado).

⚠️ **REGRA Nº 1:** toda coleta é Playwright headless. Chrome MCP no Microvix é proibido.
⚠️ **`build_estoque.mjs` é o ÚNICO escritor de `dashboard_estoque.html`.** O agente nunca edita o HTML.
⚠️ O painel vai **cifrado** (o repo é público e a página mostra custo, preço e valor de estoque).
Senha: Keychain `estoque-web/amgomes-estoque`, com fallback para `caixa-web/amgomes-caixa` e
`financeiro-web/amgomes-financeiro` — hoje vale a **mesma senha do painel de Conferência de Caixa**.

## Peças

| Arquivo | Papel |
|---|---|
| `atualizar_estoque.sh` | o pipeline inteiro (lock, coleta, build, sanity, push) |
| `scripts/coleta_estoque_balancos.mjs` | balanços via API do `lb-erpwebapp` (cache imutável) |
| `scripts/coleta_estoque_saldo.mjs` | saldo/entradas/vendas/trânsito/custo/preço (o passo pesado) |
| `scripts/coleta_estoque_notas.mjs` | notas de entrada, **canceladas** e cópia da NF (fator de conversão) |
| `scripts/coleta_estoque_custos.mjs` | custo real dos suspeitos, via Histórico de Movimento (cache 30d) |
| `scripts/estoque_janelas.mjs` | decomposição mensal da janela — **compartilhada** por coletor e build |
| `scripts/build_estoque.mjs` | único escritor do HTML |
| `scripts/estoque_app.{js,css,html}` | painel (JS injetado como VALOR, nunca dentro de template literal) |
| `dados_estoque/` | cru + caches, **fora do git** (custo/preço não vão pro repo público) |

## Locks e concorrência (leia antes de rodar à mão)

O perfil `~/.claude/microvix-profile` é compartilhado por ~20 scripts. Este pipeline segura
**dois** locks: o seu (`/tmp/amgomes_estoque.lock`) e o **da precificação**
(`/tmp/precificacao_update.lock.d`), mantendo o segundo "fresco" com `touch` a cada 2 min —
sem isso o `detecta_entrada.mjs` (2/2 min) considera o lock órfão depois de 30 min e rouba o perfil
no meio da coleta. O lock do ERP é liberado assim que a coleta acaba, antes do build.

Enquanto o pipeline roda, a **precificação não coleta** (sai limpa por lock). Como a coleta completa
leva ~1h, o horário é 22:10 — fora da janela da precificação (seg–sáb 08:00–19:45), depois do
financeiro (19:55) e da conferência de caixa (20:40 / 21:35).

## As duas armadilhas que já custaram caro aqui

1. **Relatório truncado.** O relatório de saldo é uma navegação cujo HTML chega em *streaming*.
   Esperar "as linhas pararem de crescer" entregou 56.502 linhas com a página ainda carregando.
   Agora a espera é o evento **`load` da navegação**, e não terminar = **erro**, nunca dado.
   Catálogo completo por loja: ~8 a 15 min (56.502 produtos).
2. **Dado parcial publicado.** O sanity reprova se alguma loja ficar sem SKU, se cair mais de 50%
   em relação à execução anterior, ou se **faltar qualquer janela** no cache — janela faltando
   significa entradas subestimadas, ou seja, sumiço falso.

## De onde vem cada número (resumo — detalhe em SPEC_ESTOQUE.md)

**Balanços** — `Balanco/FiltrarBalancos` (POST `{dataInicial,dataFinal,idEmpresa}`) e
`Balanco/ObterDadosConferenciaBalanco?idBalanco=N` (GET). Autenticação: `garantirSessao()` → trocar
empresa no `#topbar_sel_empresa_portal_usuario` → abrir `balanco_validar_permissao.asp` → **capturar
o header `authorization`** da primeira chamada a `suprimentoswebapi-prod` → disparar por
`ctx.request` (fetch na página falha por CORS). Campos reais: **`Descricao`** (não `Nome`),
**`DataLancamento`** (não `Data`), `IdStatusBalanco` (3 = finalizado), `IdEmpresa` (conferir registro
a registro), `IdDeposito` (todos = 1).

**Balanço que NÃO é contagem** — o marcador é o **nome do balanço** (`AJUSTE`, `ZERAR … SEM BALANÇO`),
nunca o nome da seção: 206 dos 271 balanços da L4 têm uma seção chamada "AJUSTE" e são contagens
normais. Excluídos hoje: L1 #621/#622/#623/#627/#640, L3 #447, L4 #624/#637/#638 — bate com a
memória `balanco-ajuste-custo-medio-corrompido`.

**Saldo** — `relatorio_compra_venda_saldo_empresa.asp`, Analítica, agrupado por Marca, uma empresa
por vez, `controle_dif_periodo` + `exibe_estoque_transito` ligados, `somenteDisp` desligado,
`depositos` = só o depósito 1. Com `custo_medio_unitario` e `preco_venda_unitario` ligados a tabela
tem **13 colunas** (as 11 conhecidas + Custo Médio Unit. e Preço de Tabela Unit. nas posições 5 e 6),
por isso o parser lê pelo **cabeçalho**, e as três últimas colunas são sempre o bloco da loja
(vendas · trânsito · saldo). `sem_movimentacao` ligado = catálogo inteiro (necessário: produto sem
movimento no mês também precisa de saldo); desligado = só quem se moveu (usado nas janelas —
ausente da janela significa 0 entradas e 0 vendas). `saldo_positivo` é usado só no depósito 2.

⚠️ **O "Custo Médio Unit." é do GRUPO, não da loja** — o mesmo produto traz custo idêntico em L1 e
L4, enquanto o saldo difere. O custo por loja de verdade só sai do Histórico de Movimento.

**Janelas** — `estoque_janelas.mjs` quebra `[data do balanço → hoje]` em
`[data → fim do mês]` + meses cheios + `[1º do mês corrente → hoje]`. Só o último pedaço é
recoletado; o resto é imutável e fica em `dados_estoque/janelas.json` para sempre. Custo: ~45
execuções na primeira vez, ~6 por dia depois. Corte de idade do balanço: `DIAS_BALANCO` (padrão 120).

**Notas** — `relatorio_notas.asp?modulo=estoque`, CFOP `[E]` (todas as entradas), analítica, por
**data de lançamento**. O checkbox **`SomenteCanceladas`** entrega as canceladas. A cópia da NF
(link no número do documento) traz a coluna **`Fat. Conv. Utilizado`**; `-` = sem fator cadastrado.

**Custo real** — `relatorio_movimento_produto.asp`, coluna "Médio (Histórico) Unit." e o preço
realmente praticado (Valor Unit. da última saída de venda). É **por empresa da sessão**, então os
suspeitos são agrupados por loja e a empresa é trocada uma vez por loja.

## Correções de entendimento (19/08/2026)

- **`ValorProduto` do balanço é PREÇO DE VENDA, não custo.** Provado casando dezenas de itens com a
  coluna "Preço de Tabela Unit." de hoje: 413,16 · 316,20 · 1.947,90 · 33.660,00 batem exatamente.
  A leitura de 12/08 (que virou a memória `balanco-ajuste-custo-medio-corrompido`) tratou esse campo
  como custo — então os "103 produtos com custo médio corrompido" são, na verdade, **preços de venda
  errados**. O custo médio desses itens é sano (ex.: BASE MEDIA COBERT 08 TRACTA, custo R$ 0,01 e
  preço R$ 33.660,00). Muda a conclusão de negócio: o dano é em **preço de venda**, não em CMV.
- **Os depósitos 2, 3 e 4 estão vazios.** Consulta do ano inteiro, sem filtro, nas duas lojas:
  zero linhas. Todo o estoque vive no depósito 1 — ou seja, o vencido/devolvido **não** está sendo
  separado; continua misturado na prateleira. O bloco 4 do painel existe e fica vazio de propósito,
  explicando isso; ele começa a valer no dia em que a Transferência entre Depósitos passar a ser usada.

## Agendamento

`com.amgomes.estoque` (launchd, 22:05, só `open -a Claude`) + Task MCP `dashboard-estoque-update`
(cron `10 22 * * *`) chamando o `.sh`. ⚠️ launchd **nunca** chama o script direto: `~/Desktop` é
pasta protegida por TCC e o job falharia em silêncio.

## Ajustes de saldo (escrita em produção)

`scripts/ajusta_saldo_estoque.mjs` executa zeramentos **autorizados**, a partir de
`dados_estoque/plano_ajuste.json`, uma loja por vez (`--loja L1`), com `--dry-run` disponível.
Grava log **append-only** em `dados_estoque/ajustes_saldo.json` (loja, código, descrição, saldo
anterior, saldo confirmado, data, motivo, grupo) — é a prova do que foi feito, e o build lê esse
arquivo para marcar no painel quem **voltou a ficar negativo depois do zeramento**.

Três armadilhas resolvidas em 19/08/2026, todas do mesmo endpoint:
1. **Os campos do form não existem no `page.evaluate`.** `ajuste_qtde.asp` monta o form ~2 s depois
   do domcontentloaded e só aparece varrendo `page.frames()`. `waitForSelector` no page também
   falha. Sem a varredura + espera, toda leitura volta `null`.
2. **Trocar de empresa não é instantâneo.** `trigger('change')` recarrega a home; 4,5 s fixos não
   bastavam e a L4 abortou. Agora insiste até 4 vezes e **confirma pela própria tela de ajuste**
   (`hdn_bloqueio_loja_logada`) antes da primeira escrita da loja.
3. **A trava de empresa é obrigatória.** Sem ela, o lote da L4 teria sido gravado na L1.

## Contagem conferida na tela (item 1 do feedback de 19/08)

O painel deixou de só diagnosticar. No bloco de saldo negativo cada produto tem um campo
**"contagem real"**; o valor é salvo no Supabase (`estoque_contagem`) e sobrevive ao recarregamento.
**Gerar lote** marca as contagens como prontas (nada é escrito no ERP nesse momento) e pergunta se o
lote é urgente. Dois ritmos, como o Athila escolheu:

| Ritmo | Como dispara | Quem executa |
|---|---|---|
| Urgente | botão **⚡ Aplicar agora** → grava em `estoque_trigger` | `watch_estoque_trigger.mjs` (launchd `com.amgomes.estoquetrigger`, KeepAlive) → `aplica_contagem_estoque.mjs --urgentes` |
| Semanal | nada na tela | `node scripts/aplica_contagem_estoque.mjs` (lote inteiro que está `na_fila`) |

A escrita mora em **`estoque_ajuste_core.mjs`**, compartilhada com `ajusta_saldo_estoque.mjs`: as
travas de empresa e a leitura do form por `frames()` não podem divergir entre os dois caminhos, e
o log append-only é o mesmo `dados_estoque/ajustes_saldo.json`.

⚠️ **Pré-requisito:** rodar `scripts/estoque_supabase.sql` uma vez no SQL Editor do Supabase
(projeto `valhewbvjwdkkvuejrxa`). Sem isso a tela mostra o aviso vermelho e não salva nada.
⚠️ As tabelas usam a chave `anon` com RLS liberado — mesmo padrão da precificação, e mesma
ressalva de [[supabase-projetos-e-limite]]: quem tiver a chave lê e escreve nelas.

## Seletor de loja (item 2)

O padrão de abertura é **uma loja** (L1), persistido em `localStorage`; "Todas" continua existindo
mas não é o padrão. Todos os blocos respeitam o filtro. L3 e L5 mostram aviso de que aguardam
conferência física da gerente e **não devem ser zeradas** antes da contagem.

## Validade / vencimento (item 3) — levantamento de 20/08/2026

**O dado não existe em lugar nenhum do ERP hoje.** Confirmado por varredura:
- `relatorio_compra_venda_saldo_empresa.asp` (a fonte do painel): **nenhuma** coluna ou filtro de
  lote/validade;
- `produtos/relatorio_produtos.asp` ("Produtos Cadastrados", Suprimentos > Estoque > Relatórios):
  24 filtros, **nenhum** de validade ou lote — não dá nem para contar quantos produtos têm
  "Meses de Validade" preenchido;
- `produtos/relatorio_lotes.asp` ("Relatório de Consulta de Lotes"): a tela existe e aceita
  empresa/depósito/período, mas não devolveu nenhuma linha.

**Consequência para o card automático:** ligar o controle de lote (Empresa > Parâmetros Globais >
Acesso Restrito > Estoque) não traz validade retroativa. O lote é preenchido ao **finalizar a entrada
da NF-e**, então só a mercadoria que entrar DEPOIS de ligar passa a ter validade. Para o estoque que
já está na prateleira — que é justamente o que vence primeiro — **o Excel da loja é a única fonte**,
provavelmente por um ano. Ou seja, o upload (3.2b) não é paliativo: é o caminho principal no começo.

## O que "Preço de Tabela Unit." é de verdade (verificado 20/08/2026)

O Athila levantou que "preço de tabela seria o preço que veio na nota / o custo do cadastro".
**Não é: é o preço de VENDA.** Conferido em produtos normais da Marco Boni, onde o número se
explica sozinho:

| Produto | Custo Médio Unit. | Preço de Tabela Unit. | Venda real (Histórico de Movimento) |
|---|---|---|---|
| 22 PENTE PROF 1276 | 5,13 | 9,90 | **12,90** |
| 31 TOUCA METAL CABELO | 5,72 | 8,90 | — |
| 33 BOB VELCRO EXTRA GRANDE | 18,16 | 44,90 | — |

Um pente não custa R$ 9,90 para ser vendido a R$ 5,13. E o "Custo Médio Unit." do relatório de
saldo **é o mesmo número** do "Médio (Histórico) Unit." do Histórico de Movimento (5,13 nos dois),
ou seja, o custo do painel já é o custo real — a coluna de confirmação serve para ver a evolução e
o preço realmente praticado, não para corrigir o custo.

**Mas o Athila está certo em dizer que o bloco está errado — pelo motivo seguinte que ele mesmo deu:
pacote × unidade.** Custo e preço vêm em unidades de medida DIFERENTES quando o fator de conversão
falta:

| Produto | Custo | Preço | O que está acontecendo |
|---|---|---|---|
| 156 LIXA PRETA ESP **UN** | 6,96 | 0,25 | custo do PACOTE contra preço da UNIDADE → aparece como "vende abaixo do custo" |
| 6498 LIXA MEDIA PRETA **C/144 PCT** | 0,03 | 36,01 | custo da UNIDADE contra preço do PACOTE → aparece como "razão 1.200×" |
| 23080 PAPEL D.TNT C/100 | 8,65 | 17,90 | coerente: compra e vende o pacote — **não precisa de fator**, e o bloco 6 acusava errado |

Ou seja: **a maior parte do bloco "preço × custo" não é preço errado, é unidade de medida
diferente** — e é o mesmo problema do bloco 6. Enquanto o painel não ler o **fator de conversão por
produto e por empresa**, os dois blocos continuam misturando pacote com unidade. Ler esse fator é o
próximo passo que conserta os dois de uma vez.

## Investigação do que não fecha (item 2 do feedback de 20/08)

`scripts/coleta_estoque_movimento.mjs` puxa o **Histórico de Movimento do Produto** só para quem a
reconciliação marcou como "sumiu sem explicação", na janela do balanço até hoje. Esse relatório
mostra TODA movimentação — inclusive as que não têm nota. O build lê `dados_estoque/movimentos.json`
e reclassifica:

| Situação | Classe |
|---|---|
| ajuste sem nota ≈ a diferença inteira | `ajuste_mao` → "alguém mexeu no saldo sem nota" (explicado) |
| ajuste sem nota explica parte | `ajuste_mao_parcial` → sub-aba "explicado em parte" |
| nada fora das notas | `semdoc` → sobrou mesmo |

**Efeito medido (20/08):** o "sem explicação" do grupo caiu de **262 produtos** para **19 (R$ 1.280)**;
242 eram ajuste manual de saldo. Em L1: de 142 para **6 produtos, R$ 44**. Ou seja, quase todo o
"sumiço" era gente mexendo no saldo à mão — e agora aparece com data e quantidade.

⚠️ O passo roda **entre dois builds** no pipeline (o investigador precisa da lista que só existe
depois do primeiro build) e é o último a usar o ERP — por isso o lock do Microvix só é liberado
depois dele. Custo: ~4 s por produto, teto `MAX_MOV` (250), cache de 7 dias.

⚠️ A coluna de data do Histórico de Movimento se chama **"Emissão"**, não "Data". Procurar por
/data/ devolve -1 e o parser lê ZERO linhas em silêncio — foi o que manteve a coluna de custo real
vazia por um dia inteiro.

## Curva S/A/B/C

Vem do arquivo do dashboard de COMPRAS (`compras/curva_marcas.json`), fonte única para as duas
telas. Marca fora das listas S/A/B = curva C. Filtro por curva vale para todos os blocos.

## Validade (item 3)

Aba **📅 Validade** com faixas mensais (já vencido · 1 a 6 meses · 7 a 12) e importador de planilha.
**Só lê CSV** (mesmo padrão da Conferência de Caixa; no Excel, Salvar como > CSV). O importador
adivinha as colunas pelo cabeçalho (sinônimos para código, produto, marca, quantidade, validade,
lote), mostra uma prévia com o que reconheceu e só grava depois da confirmação. Aceita data em
`31/12/2026`, `31-12-26` e `12/2026` (nesse caso, último dia do mês). Grava em `estoque_vencidos`.

**Regra do relatório para o fornecedor:** Altamira sai junta (L1+L4 num relatório, por marca, sem
separar loja); Itaituba e Santarém saem separadas. Decisão do Athila em 20/08: vale para **todo**
fornecedor de Altamira, não só a Alta Mídia.

## Fator de conversão: o recurso está DESLIGADO no portal (20/08/2026)

Lido direto da API do ERP — `GET Suprimentos/ObterParametrosEPermissoes` na base
`suprimentoswebapi-prod` (mesmo `authorization` capturado para o balanço):

| Parâmetro | Valor | O que significa |
|---|---|---|
| **`UtilizaFatorConversaoFornecedor`** | **false** | **não existe fator cadastrado para nenhum produto** |
| `ComprasUnidadeEspecial` | true | o recurso de unidade especial está habilitado |
| `ControleLoteProduto` | true | o controle de lote está habilitado no portal (falta o cadastro por produto e o preenchimento na entrada) |

Isso fecha três pontas soltas de uma vez:
1. a coluna **"Fat. Conv. Utilizado" nunca aparece** na cópia da NF porque é condicional a esse parâmetro;
2. `EntradaNfe/ListarProdutosParaAjusteFatorConversao` e `AjustarFatorConversaoProdutoFornecedor`
   existem no código da tela mas dão **404** — a rota só é servida com o recurso ligado;
3. o bloco 6 antigo, que acusava "fator ausente" olhando a NF, estava **construído sobre um sinal que
   não pode existir** — e por isso acusava até produto que é comprado e vendido como pacote.

**Bloco 6 reescrito.** Sem fator para ler, o sinal passa a ser **preço ÷ custo**: na mesma unidade a
razão é markup de varejo (1 a 6); quando explode, o custo é da unidade e o preço é do pacote; quando
inverte, é o contrário. Quem compra e vende como pacote fica de fora. Mostra também o **código irmão**
(mesmo descritivo sem o marcador de pacote) — a solução que a loja já usa: um código para o pacote,
outro para a unidade. Resultado: 231 produtos, contra 73 falsos-positivos do critério antigo.

**Bloco 5 ajustado.** Preço ≥ R$ 1.000 com razão alta continua sendo **erro de digitação de verdade**
(confirmado: PIRANHA PLASTICA com preço de R$ 215.978 e última venda real de R$ 1,00). O resto, quando
o descritivo promete pacote, é classificado como **"pacote × unidade, não é preço"** — 183 casos que
antes apareciam como preço errado.

⚠️ **O endereço da tela nova de produtos é `gestor_web/suprimentos/index.html#/listagem-produtos`**
e ela usa a MESMA API do balanço. `CatalogoProdutos/ObterDetalhesProduto` (POST `{codigoProduto}`)
devolve o produto; a listagem só expõe 7 colunas e nenhuma é unidade ou fator.

## Parâmetros do ERP — o que está ligado e o que falta (levantado 20/08/2026)

Lidos da API (`Suprimentos/ObterParametrosEPermissoes` + `ObterDadosIniciaisParaListagem`):
**212 parâmetros booleanos, 82 ligados e 130 desligados.** Lista completa em `/tmp/params_erp.json`
(recuperável a qualquer momento pela mesma chamada). O que importa para estoque:

**Controle de lote: já está TODO ligado no portal.**
`ControleLoteProduto` ✅ · `ControleLoteDatas` ✅ · `ProdutosControlaLote` ✅ ·
`ExigeLoteOrcamentoVenda` ✅ · `BloqueiaControleLoteProduto` ❌ (nada bloqueando).
Falta só o cadastro por produto e o preenchimento na entrada da NF-e.

**Ligar primeiro (risco baixo, ganho direto):**
| Parâmetro | Hoje | O que muda |
|---|---|---|
| `LogMovimentacoes` | desligado | passa a registrar **quem** mexeu no saldo. Hoje a reconciliação descobre "mexeram sem nota" mas não sabe quem — 242 produtos nessa situação |
| `ValidarNcm` · `ValidarGtin` · `ValidarCest` | desligados | trava entrada com NCM/GTIN/CEST errado. Já mordeu duas vezes ([[precificacao-nfe]] e compras) |

**Ligar com plano (mudam o dia a dia):**
| Parâmetro | Hoje | O que muda | Cuidado |
|---|---|---|---|
| `UtilizaFatorConversaoFornecedor` | desligado | cria o fator por produto×fornecedor; a coluna "Fat. Conv. Utilizado" passa a existir na NF | **muda a quantidade que entra** nas próximas notas. Cadastrar o fator antes, e conferir os códigos-irmãos de pacote/unidade que a loja criou como remendo |
| `UtilizaUnidadeTributavel` | desligado | usa a unidade tributável do XML (`uTrib`/`qTrib`) — é onde a NF-e **já traz** a conversão (1 CX = 144 UN) | é o caminho mais automático dos dois; confirmar com a Linx se dispensa cadastrar fator produto a produto |
| `BloqueiaProdutoSemSaldoEstoque` · `BloquearVendasComEstoqueNegativoDeposito` | desligados | impede vender o que não tem saldo — é o que deixa o negativo nascer | **só depois de acertar os saldos**, senão trava caixa. Vale piloto numa loja |
| `UtilizaMarkupMinimo` / `MarkupMinimoPorLinha` | desligados | impede preço abaixo de um markup mínimo | ajuda no bloco "vende abaixo do custo", mas hoje boa parte desses casos é pacote×unidade, não preço |

**Avaliar depois:** `UtilizaConferenciaEtapasBalancos` (contagem em duas etapas, ajudaria a cobertura
de balanço) · `UtilizaWsAjusteSaldo` (webservice oficial de ajuste — hoje o painel escreve via POST
no ASP) · `UtilizaCurvaPorEmpresa` (curva calculada pelo ERP; hoje é um JSON à mão) ·
`UtilizaDepositoPreferencial` · `Inventario`.

**Não ligar sem o contador:** `UtilizaControleFIFO` (troca o custo médio por FIFO — muda CMV e balanço).
**Não precisa:** `UtilizaRotinaPrecificacao` (a casa já tem o dashboard de precificação próprio).

⚠️ Estas leituras vêm do **nome** do parâmetro somado ao comportamento observado, não de documentação
da Linx. Os quatro do grupo "com plano" mudam operação — confirmar com o suporte antes de virar a chave.

## Unidade tributável: medido, e NÃO resolve (20/08/2026)

`scripts/analisa_unidade_tributavel.mjs` baixa o XML de NF-e recentes e compara `qCom`/`uCom`
(quantidade comercial) com `qTrib`/`uTrib` (tributável). Quando `qTrib > qCom`, o XML já traz o
fator de conversão pronto.

**Resultado: 0 de 395 itens, em 40 notas de 19 fornecedores. `qCom == qTrib` em todos.**
Ligar `UtilizaUnidadeTributavel` não converteria nada aqui — nenhum fornecedor preenche.
(Ressalva: a amostra é de notas pendentes dos últimos 180 dias; a **Talge** não caiu nela, e a
precificação registra a Talge como fornecedor que traz o fator — ver `marcas_por_caixa` em
`precificacao_params.json`. Fora ela, o XML não ajuda.)

⚠️ Além de não resolver, `UtilizaUnidadeTributavel` seria **perigoso** para esta operação: é uma
chave geral, aplicada a toda nota, sem exceção por produto. No produto que a loja compra E vende
como pacote (12 pacotes de 100), ele transformaria o saldo em 1.200. O caminho correto é o
`UtilizaFatorConversaoFornecedor`, que é cadastrado **produto a produto por fornecedor** e por isso
deixa de fora quem vende o pacote inteiro.

## Pares pacote/unidade a limpar antes de ligar o fator

Dos 231 produtos do bloco Pacote × unidade, **33 têm código irmão**. Separando:
- **21 são tamanhos de pacote diferentes** (C/50 × C/25, C/144 × C/20) — produtos legítimos, não mexer;
- **12 são candidatos a duplicata** (mesma descrição, sem tamanho distinto);
- desses 12, **10 têm o irmão com saldo zero** (código morto, inofensivo).

Sobram **2 pares com saldo nos dois códigos**, que precisam de decisão antes de ligar o fator:
`L1 18389 × 18388` (KIT C/ 5 PINCEIS, custos 100,85 e 67,76) e `L3 55398 × 62627`
(CAIXA DE 12 GRADES). O trabalho de limpeza é bem menor do que parecia.

## Os `Validar*` validam o CADASTRO, não a nota de entrada (20/08/2026)

Pesquisado na documentação da Linx e **confirmado na própria tela**. Ficam em
**Empresa > Parâmetros Globais > Obrigações Fiscais > Classificação dos produtos** (a tela
`param_obrigacoes_fiscais.asp`) — **não** ficam sob Acesso Restrito. Os três estão desligados:

| Campo | Rótulo na tela | Hoje |
|---|---|---|
| `validarGtin` | "Ativar validação de GTIN" | desligado |
| `validarNcm` | "Ativar validação de NCM" | desligado |
| `validarCest` | "Ativar validação de CEST" | desligado |
| `cest_obrigatorio` | "Habilitar obrigatoriedade do código CEST" | desligado |

O texto do próprio ERP: *"Ativar a apresentação de **alertas** em **cadastros** e rotinas de
**emissões** de nota fiscal"*. Ou seja:
- é **alerta, não bloqueio**;
- age quando alguém **cadastra/altera** o produto e quando o portal **emite** NF-e de saída;
- **não age na entrada de nota** — os NCM/CEST que vêm no XML e não existem no sistema são
  **cadastrados automaticamente**.

O ganho real é evitar a **rejeição 778 da SEFAZ** ("NCM inexistente") na hora de emitir a nota de
venda. O risco de travar a entrada de mercadoria, que eu havia levantado, **não existe**.
Em `param_estoque.asp`, `ncm_obrigatorio` ("NCM obrigatório para cadastro") **já está ligado**.

⚠️ `LogMovimentacoes` **não está** em nenhuma dessas duas telas — deve estar sob
**Acesso Restrito**, que pede uma segunda senha ("Área de Usuário") e não foi aberto.

## Ficha do produto (`scripts/ficha_produto.mjs`)

Responde, para qualquer código: última compra **com o número da NF e o fornecedor**, última venda,
quantos movimentos, desde quando, e saldo em cada loja. É a ferramenta para decidir sobre duplicata
sem chutar. ⚠️ O Histórico de Movimento devolve os **mesmos números nas 4 lojas** — ele é do
**grupo**, não da empresa da sessão (por isso o script consulta uma loja só). E a janela começa em
01/01/2023, então "mais antigo" significa *primeiro movimento visto desde 2023*, não data de cadastro.

## Registro de execuções

| Data | Resultado |
|---|---|
| 19/08/2026 | primeira execução completa do painel (L1 77,1% · L3 93,5% · L4 77,7% · L5 95,5% fecham) |
| 19/08/2026 | **85 zeramentos autorizados** em L1 e L4: 29 lixas Santa Clara antigas (22.121 un) + 56 saldos negativos (87 un). 0 erros. Grupo "produtos que não existem" NÃO executado — critério não reproduzível (ver abaixo) |

### Pendente: grupo "produtos que não existem"

Critério combinado: marca com balanço de contagem em 2026 · produto não contado · sem entrada desde
01/01/2023. Aplicado ao pé da letra dá **4.089 SKUs / 23.357 un**, contra os 418 / 1.878 medidos em
19/08 — porque uma marca com **um** SKU contado de raspão (balanço GERAL) qualifica a marca inteira.
Exigindo cobertura mínima da marca: 50% → 305 SKUs · 70% → 81 · 80% → 50 · 90% → 21. Nenhum corte
reproduz 418. Como o critério já tem falso positivo confirmado (2 de 4 conferidos na prateleira
existiam), o corte precisa ser escolhido pelo Athila antes de qualquer escrita.
