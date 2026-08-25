# Como cuidamos do estoque — Grupo A.M. Gomes

*Documento de trabalho para todo mundo que mexe em estoque: caixa, balconista, quem lança nota,
quem faz contagem, gerência. Versão de 25/08/2026.*

Guarde este documento. Quando bater dúvida sobre **o que fazer** ou **como registrar**, a resposta
está aqui. Se não estiver, **fale com o Athila ou com a Ana Lídia** — não invente um jeito novo.

---

## A regra de ouro

> **Toda vez que uma mercadoria se move, alguém tem que conseguir descobrir depois por que ela se moveu.**

O sistema não sabe o que aconteceu na loja. Ele só sabe o que a gente escreveu. Quando o produto
some do saldo e ninguém escreveu o motivo, o sistema mostra "sumiu" — e aí alguém vai ter que parar
o que está fazendo para caçar o que houve, às vezes semanas depois, às vezes sem conseguir.

**Escrever o motivo direito leva 5 segundos. Descobrir depois leva meia hora — quando dá.**

---

## Por que o saldo certo importa

Saldo errado não é um problema "do sistema". Ele vira dinheiro de verdade:

- **Compra errada.** Se o sistema diz que tem 40 e na loja tem 4, ninguém compra — e o produto falta
  na prateleira num dia de movimento.
- **Preço errado.** O preço de venda é calculado em cima do custo. Custo torto = margem torta.
- **Cliente sem resposta.** "No sistema tem" e na loja não tem.
- **Perda invisível.** Se tudo está bagunçado, um sumiço de verdade se esconde no meio da bagunça.

---

## 1 · Entrada de mercadoria (nota fiscal)

**O padrão:** toda mercadoria que entra na loja entra **pela nota**, no dia em que chega.

1. Confira a mercadoria **contra a nota**, caixa por caixa, antes de lançar.
2. Lance a entrada pela **Entrada XML (NF-e)**.
3. Se algum item veio **a menos, a mais ou trocado**, **não conserte no ajuste de saldo** —
   avise a gerência. Divergência de nota é assunto com o fornecedor, não com o saldo.
4. Se a mercadoria chegou mas a nota ainda não, **não lance nada** e avise. Mercadoria na
   prateleira sem nota é problema fiscal, não só de estoque.

> ⚠️ **Nunca** dê entrada "por ajuste de saldo" para resolver nota. Ajuste de saldo não é entrada.

---

## 2 · Divisão de nota entre Casa da Beleza e Miss Beleza (Altamira)

Em Altamira a nota costuma vir no nome de **uma** das empresas e a mercadoria é dividida entre as
duas lojas. Como são CNPJs diferentes, hoje isso é feito por **ajuste de saldo**.

**O problema:** a metade que entra na outra loja **não tem documento nenhum**. Para o sistema, ela
apareceu do nada.

**Por isso, quem faz a divisão escreve SEMPRE, no motivo do ajuste:**

```
DIVISAO NF <número da nota> <loja de origem>-><loja de destino>
```

**Exemplos reais:**

```
DIVISAO NF 12345 L4->L1
DIVISAO NF 771796 L1->L4
```

Onde: **L1 = Casa da Beleza Altamira · L4 = Miss Beleza Altamira · L3 = Casa da Beleza Itaituba ·
L5 = Miss Beleza Santarém.**

Escreva nas **duas pontas** — na loja que perde e na loja que ganha, com o mesmo texto.

> Com esse texto, o painel de estoque reconhece sozinho que aquilo foi divisão de nota e mostra o
> número. Sem ele, aparece como mercadoria sumida e alguém vai ter que investigar.

---

## 3 · Mercadoria que vai de uma loja para outra **na mesma cidade**

É o caso do dia a dia em Altamira: alguém pega um produto numa loja e leva para a outra.

**Quem opera o caixa registra nas duas lojas, dizendo QUEM levou:**

| Na loja que **entrega** | Na loja que **recebe** |
|---|---|
| `Tatiane retirou` | `Tatiane trouxe` |

**Exemplo:** a Tatiane pegou 4 colorações 7.0 na Miss Beleza para vender na Casa da Beleza.
A caixa da Miss Beleza escreve **"Tatiane retirou"**; a caixa da Casa da Beleza escreve
**"Tatiane trouxe"**.

Regras:
- **Sempre o nome da pessoa.** "Ajuste", "transferência" ou "acerto" não servem — não dizem quem.
- **As duas pontas no mesmo dia.** Se só uma loja registrar, o saldo fica errado nas duas.
- Se você **não conseguir** registrar na outra loja na hora, **avise a outra loja** para registrar.

---

## 4 · Mercadoria que vai para outra **cidade**

**Regra nova, a partir de agora:**

> Mercadoria enviada de uma cidade para outra **tem que sair com nota fiscal** e **conta como venda**.

Vale para qualquer envio entre Altamira, Itaituba e Santarém. Não existe "mandar sem nota e acertar
depois". Se surgir a necessidade, **fale com o Athila ou com a Ana Lídia antes de enviar** — é
decisão deles, envolve nota fiscal e imposto.

---

## 5 · Ajuste de saldo

Ajuste de saldo é a última ferramenta, não a primeira.

**Pode usar quando:**
- a contagem física mostrou um número diferente do sistema e você **contou de verdade**;
- é uma divisão de nota entre L1 e L4 (item 2);
- é uma movimentação entre lojas da mesma cidade (item 3).

**Não pode usar para:**
- consertar erro de nota (item 1);
- "sumir" com saldo negativo sem entender de onde veio (item 6);
- acertar diferença que você não sabe explicar.

**O motivo é obrigatório e tem que responder a pergunta "por quê?".**

| ❌ Não escreva | ✅ Escreva |
|---|---|
| `ajuste` | `DIVISAO NF 12345 L4->L1` |
| `acerto` | `Tatiane retirou` |
| `entrada` | `contagem física 25/08 — tinha 12, sistema 40` |
| `correção` | `quebrado no transporte, 2 un` |

> Se você escrever "ajuste", daqui a dois meses ninguém — nem você — vai lembrar o que foi.

---

## 6 · Saldo negativo

Saldo negativo quer dizer: **o sistema registrou mais saída do que entrada**. É quase sempre sinal
de que a **entrada** está errada, não a venda.

**O que fazer:**
1. **Não zere por conta própria.** O negativo é a pista de onde está o erro — apagá-lo apaga a pista.
2. **Conte o produto na prateleira** e anote quanto tem de verdade.
3. Registre a contagem no painel de estoque (campo "contagem real") ou passe para a gerência.
4. Se o negativo apareceu logo depois de uma entrada, **confira se a nota foi lançada certa** —
   principalmente se o produto vem em caixa ou pacote (item 8).

**O que nunca fazer:** colocar um número redondo qualquer (10, 100, 1000) só para o saldo parar de
ficar negativo. Isso conserta a tela e estraga o custo do produto — já aconteceu aqui e deu trabalho
de meses para desfazer.

---

## 7 · Contagem e balanço

**O padrão:** cada marca passa por contagem pelo menos **uma vez a cada 3 meses**, e as marcas de
maior giro (curva S e A) **uma vez por mês**.

Como fazer:
1. Abra um balanço **com o nome da marca** (ex.: `ITALLIAN`, `SANTA CLARA`). Nome claro, porque
   depois a gente usa esse nome para saber o que foi contado.
2. Conte **tudo** daquela marca — inclusive o que está no depósito, na gaveta e no mostruário.
3. Se um produto tem código de caixa e código de unidade, **conte os dois separados**.
4. Finalize o balanço no mesmo dia. Balanço aberto por dias não vale como contagem.

> ⚠️ **Nunca** crie balanço chamado "AJUSTE", "ZERAR" ou parecido para forçar número. Balanço é
> contagem. Se precisar de outra coisa, fale com a gerência.

---

## 8 · Produto que vem em caixa ou pacote

É a maior fonte de erro de saldo hoje.

**O problema:** chega uma caixa com 48 frascos, a nota diz "1 CX", e o sistema dá entrada de **1**.
Aí a loja vende 48 unidades e o saldo vira −47.

**O que fazer quando você perceber isso:**
1. **Não corrija sozinho no ajuste.** Anote o código e o número da nota.
2. **Avise o Athila ou a Ana Lídia** — o acerto é no cadastro do produto, não no saldo.
3. Enquanto não estiver acertado, **conte esse produto com atenção redobrada** nas contagens.

**Se o produto for vendido em caixa fechada** (a loja compra a caixa e vende a caixa), está certo
como está — avise também, para não ser "corrigido" por engano.

---

## 9 · Produto vencido, quebrado ou devolvido

**O padrão:** produto que sai da prateleira por defeito, quebra ou validade **não some do sistema
em silêncio**.

1. Separe fisicamente do estoque de venda.
2. Registre a saída com motivo claro: `vencido 25/08`, `quebrado no transporte`,
   `devolução de cliente — sem uso`.
3. Avise a gerência para providenciar a nota de baixa ou a devolução ao fornecedor.

**Validade:** todo mês, confira as datas de validade das marcas sob sua responsabilidade e passe
para a gerência a lista do que vence nos **próximos 6 meses**. Seis meses é o prazo que a gente
precisa para negociar troca com a marca — com 2 ou 3 meses já é tarde.

---

## 10 · Cadastro de produto novo

Produto novo **não se cadastra na correria**. Se chegou mercadoria de um item que não existe no
sistema:

1. Confira se ele **não existe com outro código** (pesquise pelo nome e pelo código de barras).
2. Se não existir mesmo, **avise o Athila ou a Ana Lídia** antes de criar.
3. Nunca crie um segundo código para um produto que já existe só porque a unidade está diferente —
   isso gera os pares de código duplicado que a gente está limpando hoje.

---

## Quando parar e consultar o Athila ou a Ana Lídia

Não decida sozinho nestes casos:

- Mercadoria chegou **sem nota**, ou a nota veio diferente do que chegou.
- Produto entrando **em caixa/pacote** com quantidade errada no sistema.
- Precisa **enviar mercadoria para outra cidade**.
- **Cadastrar produto novo** ou desativar um código existente.
- Diferença de saldo **grande** ou que se repete no mesmo produto.
- Suspeita de **furto ou desvio**.
- Qualquer situação em que a saída seria "dar um jeito" no saldo.

---

## Cola rápida — textos prontos

| Situação | O que escrever no motivo |
|---|---|
| Divisão de nota Altamira | `DIVISAO NF 12345 L4->L1` |
| Mandou produto para a outra loja (mesma cidade) | `Tatiane retirou` |
| Recebeu produto da outra loja (mesma cidade) | `Tatiane trouxe` |
| Contagem física | `contagem física 25/08 — tinha 12, sistema 40` |
| Produto quebrado | `quebrado no transporte, 2 un` |
| Produto vencido | `vencido 25/08 — separado para baixa` |
| Devolução de cliente | `devolução cliente — produto sem uso` |

---

*Dúvida que não está aqui? Athila ou Ana Lídia. Nunca "dar um jeito".*
