# Consertos de estoque — as 4 lojas

Uma lista por loja, organizada **marca → produto → o que fazer**. Cada lista é autônoma:
dá para mandar a da loja para quem trabalha nela sem precisar do resto.

| Loja | | Produtos | Valor que não existe | Lista |
|---|---|---:|---:|---|
| **L1** | Casa da Beleza Altamira | 454 | R$ 316.344,29 | [CONSERTOS_L1.md](CONSERTOS_L1.md) |
| **L3** | Casa da Beleza Itaituba | 103 | R$ 77.615,85 | [CONSERTOS_L3.md](CONSERTOS_L3.md) |
| **L4** | MissBeleza Altamira | 268 | R$ 162.262,78 | [CONSERTOS_L4.md](CONSERTOS_L4.md) |
| **L5** | MissBeleza Santarém | 149 | R$ 64.416,45 | [CONSERTOS_L5.md](CONSERTOS_L5.md) |
| | **Total** | **974** | **R$ 620.639,37** | |

## Por tipo de conserto (as 4 lojas)

| Tipo | Produtos | Valor | O que significa |
|---|---:|---:|---|
| saldo sem origem | 517 | R$ 195.853,91 | tem peça e nenhuma compra desde 2023 — não é custo, é contagem |
| custo corrompido | 67 | R$ 125.327,30 | custo sem relação com nada; quantidades de compra normais |
| conferir a nota | 175 | R$ 89.111,94 | sem evidência suficiente aqui — precisa abrir a nota |
| fator a confirmar | 47 | R$ 82.207,43 | cheira a embalagem e a conta não fecha — abrir a nota |
| fator de conversão (qtd estimada) | 79 | R$ 70.296,78 | é embalagem, mas o número exato precisa sair da nota antes de gravar |
| fator de conversão | 33 | R$ 54.330,95 | a quantidade da embalagem está no nome do produto — é só cadastrar |
| preço a conferir | 56 | R$ 3.511,06 | pode ser o preço que está errado, não o custo |

## A ordem de fazer

1. **Fator de conversão primeiro.** Se corrigir só o custo, a próxima nota daquele produto
   reintroduz o erro — a entrada continua lançando pacote como peça.
2. **Depois o custo médio** dos que ficaram (custo corrompido).
3. **Contagem por último**, para os de saldo sem origem — e aí já com o custo certo,
   senão conta-se duas vezes.

> O valor do estoque cai conforme os consertos entram. Isso aparece no balanço e **é
> correção de um número que nunca existiu, não perda** — mas o contador precisa saber antes.

