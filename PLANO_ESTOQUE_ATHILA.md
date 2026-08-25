# Estoque — onde estamos, onde queremos chegar, e como ir

*Documento reservado ao Athila e à Ana Lídia. Não enviar para a equipe — contém parâmetros do ERP e
decisões de dono. O documento da equipe é o `PROCEDIMENTOS_ESTOQUE.md`.*
*Números medidos em 25/08/2026, coleta de 24/08 às 22:11.*

---

## Resumo em uma tela

| Frente | Onde estamos | Onde queremos chegar |
|---|---|---|
| Reconciliação | L1 75% · L3 94% · **L4 77%** · **L5 95%** fecham | 95% nas quatro |
| Rastro do movimento | 41 produtos sumidos sem explicação nenhuma | zero sem explicação |
| Pacote × unidade | fator de conversão **desligado** no ERP | ligado, ~200 produtos cadastrados |
| Validade | não existe no ERP; controle em Excel, atrasado | aviso automático com 6 meses |
| Negativos | L1 e L4 limpas · **L3 com 296** · L5 resolvida | zero fora do dia a dia |
| Vigilância | painel diário + watchdog por idade | mantido |

**A L5 é a prova de que o método funciona.** Ela saiu de 805 produtos com contagem para **4.635**
depois dos balanços de 20 a 24/08 — 48 balanços por marca — e foi de 95,5% para **95,3% com sete
vezes mais produtos medidos**. A gerente diz que os saldos estão corretos, e o número concorda com
ela. É o padrão a replicar em Altamira.

---

## 1 · O que já está resolvido

**O painel existe e roda sozinho.** Coleta às 22:10 todo dia, publica cifrado, e o watchdog avisa
se algum painel passar de 30h (diários) ou 60h (seg–sáb) sem publicar. O buraco do fim de semana com
o Mac desligado foi fechado em 25/08 com o despertar automático às 18h.

**O "sumiço" era, na maior parte, ajuste manual sem rastro.** Puxando o Histórico de Movimento de
cada produto que não fechava, os produtos sem explicação caíram de **262 para 41 no grupo**. O resto
tem nome: ajuste de saldo, divisão de nota, transferência entre lojas.

**O motivo do ajuste é legível.** Descobrimos que o texto digitado aparece no Histórico de Movimento.
Hoje o painel mostra o que a pessoa escreveu — *"AJUSTE DE NOTA"*, *"RETIRADA"*, *"Balanço do item"*
— em vez de "movimento sem documento".

**A skill de divisão de NF foi corrigida.** Ela gravava `motivo = "ajuste"`; agora grava
`DIVISAO NF <número> <origem>-><destino>`, e o painel reconhece sozinho.

**Zeramentos de 19/08 executados** em L1 e L4: 29 lixas antigas (22.121 un) e 56 negativos, com log
de antes e depois por produto.

**Duas leituras erradas foram corrigidas:** o campo `ValorProduto` do balanço é preço de venda, não
custo (os "103 produtos com custo corrompido" eram preço errado); e o custo médio do relatório de
saldo **é** o custo real histórico — não havia custo escondido.

---

## 2 · O que falta — em ordem de dinheiro

### 2.1 Pacote × unidade · **o maior de todos**

**Situação:** o parâmetro `UtilizaFatorConversaoFornecedor` está **desligado** no ERP. Não existe
fator cadastrado para nenhum produto. Chega uma caixa com 144 lixas, a nota diz "1 CX", o sistema dá
entrada de 1. **231 produtos** estão nessa situação, com R$ 45.905 de estoque envolvido.

**Onde queremos chegar:** o fator cadastrado nos produtos comprados em pacote e vendidos na unidade,
para o saldo nascer certo sem ninguém ajustar nada.

**O caminho, nesta ordem:**

1. **Limpar os pares de código duplicado primeiro.** São 33 pares; 21 são tamanhos de pacote
   diferentes (legítimos, não mexer) e 12 são duplicata. Destes, 10 têm o irmão zerado e podem ser
   desativados direto; **2 precisam de decisão** (`L1 18389 × 18388` KIT C/5 PINCEIS e
   `L3 55398 × 62627` CAIXA DE 12 GRADES — zerar o de menor saldo e desativar).
   *Por que antes:* se ligar o fator com os pares no ar, o remendo antigo e o mecanismo novo se
   somam e o saldo dobra.
2. **Teste em branco.** Ligar `UtilizaFatorConversaoFornecedor` **sem cadastrar fator nenhum**,
   lançar uma nota qualquer e conferir que o saldo entrou igual ao de sempre. Isso prova que o
   parâmetro sozinho não muda nada — é a única coisa que ainda é suposição minha.
3. **Teste em um produto.** Cadastrar o fator no **FRASCO SPRAY 75ML C/48 (L1, código 46938)** —
   escolhido porque o irmão está zerado, risco nenhum — e lançar a próxima nota dele.
4. **Cadastrar os demais**, começando pelas lixas Santa Clara, que são a maior bagunça.

⚠️ **Não seguir pelo `UtilizaUnidadeTributavel`.** Medi 40 notas de 19 fornecedores: **0 de 395
itens** trazem a conversão no XML. Além de não resolver, ele é uma chave geral que converteria
também o pacote que a loja compra e vende inteiro — transformaria 12 pacotes em 1.200 unidades.

### 2.2 Balanço em Altamira

**Situação:** L1 com 2.617 produtos contados e L4 com 2.390, contra **4.635 da L5**. Há marca com
15% de cobertura — 6 de cada 10 produtos nunca foram para uma contagem.

**Onde queremos chegar:** cobertura acima de 90% nas marcas de curva S e A.

**O caminho:** repetir em L1 e L4 o que a L5 fez entre 20 e 24/08 — balanço por marca, um por vez,
com o nome da marca no título. A aba **Cobertura de balanço** do painel já lista da pior para a
melhor, com data do último balanço e filtro de "nunca contada". É a lista de trabalho pronta.

### 2.3 Negativos da L3

**Situação:** 296 produtos negativos, −1.813 unidades. Intocados de propósito, à espera da
conferência física da gerente de Itaituba. Mais da metade é lixa da Santa Clara.

**Onde queremos chegar:** L3 no mesmo estado da L5.

**O caminho:** conferência física → digitar a contagem no painel → gerar o lote → aplicar. O painel
já tem o campo de contagem por produto; falta só rodar o SQL do Supabase (item 2.6).

### 2.4 Validade

**Situação:** o dado **não existe em lugar nenhum do ERP**. O controle de lote está habilitado no
portal, mas nenhum produto tem lote preenchido, porque o lote só é registrado ao finalizar a entrada
da NF-e — e ninguém preenche.

**Onde queremos chegar:** aviso automático de tudo que vence nos próximos 6 meses, por marca, com
relatório pronto para mandar ao fornecedor (Altamira junta; Itaituba e Santarém separadas).

**O caminho:**
1. **Começar pelo Excel** — a aba Validade do painel já importa a planilha da loja em CSV, adivinha
   as colunas e mostra as faixas de 1 a 6 meses. É o caminho principal no primeiro ano.
2. **Passar a preencher o lote na entrada da NF-e** e marcar "Meses de Validade" no cadastro dos
   produtos novos. ⚠️ Isso **não é retroativo**: só vale para o que entrar depois. A mercadoria que
   já está na prateleira — justamente a que vence primeiro — continua dependendo do Excel.

### 2.5 Os 41 sem explicação

**Situação:** 41 produtos em que o Histórico de Movimento não mostrou nada além das notas. É o
resíduo real.

**Onde queremos chegar:** zero. E, mais importante, que **não nasçam novos** — o que depende do
padrão de escrita do motivo que entrou em vigor agora.

**O caminho:** conferência física desses 41 (é uma lista curta), e o padrão novo daqui pra frente.

### 2.6 Pendência sua, de 5 minutos

**Rodar o SQL do Supabase.** Sem ele, o campo de contagem do painel e a importação de validade não
salvam nada.

**https://supabase.com/dashboard/project/valhewbvjwdkkvuejrxa/sql/new** → colar
`scripts/estoque_supabase.sql` → Run.

---

## 3 · Parâmetros do ERP — o que ligar e o que não ligar

Levantei os 212 parâmetros booleanos do portal: 82 ligados, 130 desligados.

### Ligar sem medo

| Parâmetro | Onde | O que muda |
|---|---|---|
| `LogMovimentacoes` | Parâmetros Globais > **Acesso Restrito** > Estoque | passa a registrar **quem** mexeu no saldo. Hoje sabemos o quê e quando, não quem |
| `validarGtin` · `validarNcm` · `validarCest` | Parâmetros Globais > **Obrigações Fiscais** > Classificação dos produtos | são **alerta**, não bloqueio, e agem no **cadastro** e na **emissão** de nota — **não** travam a entrada de mercadoria. Evitam a rejeição 778 da SEFAZ na hora de vender |

*O `ncm_obrigatorio` já está ligado.*

### Ligar com plano

| Parâmetro | O que muda | Cuidado |
|---|---|---|
| `UtilizaFatorConversaoFornecedor` | cria o fator por produto × fornecedor | muda a quantidade que entra nas próximas notas — seguir os 4 passos do item 2.1 |

### Não ligar

| Parâmetro | Por quê |
|---|---|
| `BloqueiaProdutoSemSaldoEstoque` · `BloquearVendasComEstoqueNegativoDeposito` | **já testado, não funciona.** Trava a venda de produto que existe na loja. O negativo é a prova de que o saldo está errado; bloquear não conserta saldo nenhum |
| `UtilizaUnidadeTributavel` | nenhum fornecedor preenche (0 de 395 itens) e converteria também o pacote vendido inteiro |
| `UtilizaControleFIFO` | troca custo médio por FIFO — muda CMV e balanço, decisão de contador |
| `UtilizaRotinaPrecificacao` | já temos o dashboard de precificação; ligar cria duas fontes de preço |

### Avaliar depois
`UtilizaConferenciaEtapasBalancos` (contagem em duas etapas, ajudaria a cobertura) ·
`UtilizaWsAjusteSaldo` (webservice oficial de ajuste, hoje o painel escreve por raspagem) ·
`UtilizaCurvaPorEmpresa` (curva calculada pelo ERP em vez do arquivo à mão).

⚠️ O **Acesso Restrito** pede uma segunda senha ("Área de Usuário") — não entrei lá. O rótulo exato
do `LogMovimentacoes` na tela eu não vi; se você abrir e me disser o que aparece, eu confirmo qual
marcar.

---

## 4 · As mudanças de processo que você definiu em 25/08

Estão no documento da equipe, prontas para enviar:

1. **Retirada entre lojas da mesma cidade** — a caixa escreve o nome de quem levou:
   `Tatiane retirou` na origem, `Tatiane trouxe` no destino.
2. **Divisão de nota em Altamira** — motivo padrão `DIVISAO NF 12345 L4->L1`, escrito nas duas
   pontas, inclusive quando a divisão é feita à mão.
3. **Envio entre cidades diferentes** — passa a exigir nota fiscal e **conta como venda**.

**O que isso resolve:** hoje 226 diferenças do painel são divisão de nota reconhecida por
adivinhação — cruzando o ajuste de uma loja com a metade de uma nota da outra. Com o texto
padronizado, o painel para de adivinhar e passa a ler. E os 91 casos que ainda ficam como
"explicado em parte" na L1 — que você identificou corretamente como divisões recentes — deixam de
existir, porque o motivo vai dizer o que é.

**O que o item 3 muda no negócio:** envio entre cidades vira venda, então entra no faturamento da
loja que envia e no CMV dela. Isso muda o número de vendas por loja e a margem de cada uma. É
decisão sua e do contador — vale avisar quem acompanha meta de loja, porque o efeito aparece no
resultado do mês.

---

## 5 · Ordem sugerida

| # | Ação | Quem | Esforço |
|---|---|---|---|
| 1 | Rodar o SQL do Supabase | você | 5 min |
| 2 | Enviar o documento de procedimentos para a equipe | você / Ana Lídia | 1 dia |
| 3 | Ligar `LogMovimentacoes` e os três `Validar*` | você | 15 min |
| 4 | Balanço por marca em L1 e L4, no modelo da L5 | equipe | 2 a 3 semanas |
| 5 | Conferência física da L3 e aplicação pelo painel | gerente L3 | 1 semana |
| 6 | Limpar os pares de código duplicado | eu + sua decisão nos 2 | 1 dia |
| 7 | Teste em branco e teste em um produto do fator de conversão | você + eu | 1 dia |
| 8 | Cadastrar o fator nos ~200 produtos | equipe | 2 semanas |
| 9 | Importar a planilha de validade e criar o hábito mensal | equipe | contínuo |

Os itens 1 a 3 destravam tudo o que vem depois e somam menos de meia hora.
