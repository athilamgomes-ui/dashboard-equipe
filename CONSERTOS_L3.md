# Estoque L3 · Casa da Beleza Itaituba

Fonte: **Registro de Inventário** do ERP (Suprimentos → Relatórios → Registro de Inventário),
puxado em 27/08/2026 — é o relatório que valoriza o estoque, o mesmo que você usa.

Estoque declarado: **26.790 peças · R$ 256.951,65** em 159 marcas.

---

# Parte A — produtos com custo errado

**94 produtos · R$ 9.874,24** de valor que o sistema mostra e não existe.

Critério: custo maior que 3x o preço de venda. Margem apertada acontece; vender a menos
de um terço do custo, não.

| Tipo de conserto | Produtos | Valor | Quem resolve |
|---|---:|---:|---|
| conferir a nota | 11 | R$ 3.705,87 | abrir a nota primeiro |
| fator de conversão (qtd estimada) | 1 | R$ 2.325,57 | confirmar a quantidade, depois cadastrar |
| custo corrompido | 29 | R$ 1.632,14 | ajuste de custo no ERP |
| sem movimento | 14 | R$ 1.631,09 | contagem física (ver parte B) |
| preço a conferir | 33 | R$ 469,11 | quem define preço |
| fator a confirmar | 6 | R$ 110,46 | abrir a nota primeiro |

> **A ordem importa:** fator de conversão antes do custo. Corrigindo só o custo, a
> próxima nota reintroduz o erro — a entrada continua lançando pacote como peça.

## SANTA CLARA  ·  _ATIVA_

### 12573 — LIXA POP CAN ST CLARA UN

- Custo no inventário: **R$ 11,57** · preço: R$ 0,25 · saldo: 201 un · inflado: **R$ 2.325,57**
- Evidência: comprou 6, vendeu 5.153 (razão 859x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~859 peças** — **confirmar na nota antes de gravar**. Com 859, o custo cai de R$ 11,57 para R$ 0,01, margem de 1.756% sobre R$ 0,25.
- Efeito: o estoque reduz R$ 2.322,86 (correção, não perda)

### 41022 — FRASCO SKINCARE C/ESC.S.190ML

- Custo no inventário: **R$ 8,06** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 48,36**
- Evidência: custo é 806x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1126 — LENCOL DESC C/ ELASTICO SANTA CLARA

- Custo no inventário: **R$ 10,71** · preço: R$ 2,06 · saldo: 4 un · inflado: **R$ 42,84**
- Evidência: custo 5,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 8637 — LENCOL DESC ST CLARA 15UN

- Custo no inventário: **R$ 31,60** · preço: R$ 2,10 · saldo: 1 un · inflado: **R$ 31,60**
- Evidência: no nome: 15 UN
- **Conserto:** Parece embalagem de 15, mas R$ 31,60 ÷ 15 = R$ 2,11, que ainda passa do preço de R$ 2,10. **Abrir a nota** e ver a unidade.

### 7098 — PAPEL DEP.10X16CM PERLON C/100

- Custo no inventário: **R$ 7,69** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 23,07**
- Evidência: no nome: C/100
- **Conserto:** Parece embalagem de 100, mas R$ 7,69 ÷ 100 = R$ 0,08, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 5034 — PAPEL DEP.10X16CM PERLON C/25

- Custo no inventário: **R$ 2,95** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 14,75**
- Evidência: no nome: C/25
- **Conserto:** Parece embalagem de 25, mas R$ 2,95 ÷ 25 = R$ 0,12, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

## IMPORTADOS  ·  _ATIVA_

### 242 — ADESIVO PARA UNHAS BETH

- Custo no inventário: **R$ 27,02** · preço: R$ 5,00 · saldo: 75 un · inflado: **R$ 2.026,50**
- Evidência: custo 5,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 64987 — ESPONJA COXINHA PARA MAQUIAGEM 2010000002193

- Custo no inventário: **R$ 2,75** · preço: R$ 0,05 · saldo: 5 un · inflado: **R$ 13,75**
- Evidência: preço de R$ 0,05 com custo de R$ 2,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## ITALLIAN HAIR  ·  _ENCALHADA_

### 204358 — KIT HOME CARE TRIVITT COM HIDRATACAO

- Custo no inventário: **R$ 11,60** · preço: R$ 2,00 · saldo: 108 un · inflado: **R$ 1.252,80**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 40339 — CB CORRETOR AZUL ITALLIAN COLOR 60G

- Custo no inventário: **R$ 5,84** · preço: R$ 0,01 · saldo: 12 un · inflado: **R$ 70,08**
- Evidência: custo é 584x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## MEY BRASIL  ·  _ATIVA_

### 63669 — CILIOS POSTICOS 6D MEY BEAUTY

- Custo no inventário: **R$ 30,00** · preço: R$ 6,00 · saldo: 36 un · inflado: **R$ 1.080,00**
- Evidência: custo 5,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 63668 — CILIOS POSTICOS 5 PARES MEY BEAUTY

- Custo no inventário: **R$ 7,00** · preço: R$ 1,33 · saldo: 1 un · inflado: **R$ 7,00**
- Evidência: custo 5,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## OTIMO BIJUTERIAS  ·  _ENCALHADA_

### 40795 — ESTOJO PARA MAQUIAGEM

- Custo no inventário: **R$ 12,90** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 64,50**
- Evidência: custo é 1.290x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 4875 — SAIA CARNAVAL 2

- Custo no inventário: **R$ 10,60** · preço: R$ 2,60 · saldo: 6 un · inflado: **R$ 63,60**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 41613 — PULSEIRA D2

- Custo no inventário: **R$ 9,33** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 46,65**
- Evidência: custo é 933x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 2688 — BRINCO 7

- Custo no inventário: **R$ 7,00** · preço: R$ 0,02 · saldo: 6 un · inflado: **R$ 42,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 17051 — COLAR

- Custo no inventário: **R$ 6,66** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 39,96**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 1378 — COLAR

- Custo no inventário: **R$ 11,25** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 33,75**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 40686 — ELASTICO

- Custo no inventário: **R$ 4,16** · preço: R$ 0,01 · saldo: 8 un · inflado: **R$ 33,28**
- Evidência: custo é 416x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1363 — COLAR

- Custo no inventário: **R$ 10,85** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 32,55**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 17053 — COLAR

- Custo no inventário: **R$ 10,00** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 30,00**
- Evidência: custo é 1.000x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 40651 — TIARA K

- Custo no inventário: **R$ 4,66** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 27,96**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 2571 — CILIOS OTIMOS

- Custo no inventário: **R$ 1,08** · preço: R$ 0,02 · saldo: 24 un · inflado: **R$ 25,92**
- Evidência: comprou 4, vendeu 46 (razão 12x)
- **Conserto:** Parece embalagem de 12, mas R$ 1,08 ÷ 12 = R$ 0,09, que ainda passa do preço de R$ 0,02. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,02 também não se sustenta — conferir os dois.

### 5015 — BRINCO

- Custo no inventário: **R$ 5,75** · preço: R$ 0,02 · saldo: 4 un · inflado: **R$ 23,00**
- Evidência: preço de R$ 0,02 com custo de R$ 5,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 17052 — COLAR

- Custo no inventário: **R$ 5,66** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 22,64**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 5705 — CAIXINHA DE PRESENTE 12

- Custo no inventário: **R$ 3,90** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 19,50**
- Evidência: custo é 390x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 49029 — PULSEIRA V16

- Custo no inventário: **R$ 4,83** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 19,32**
- Evidência: custo é 483x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 44232 — BRINCO 69

- Custo no inventário: **R$ 5,66** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 16,98**
- Evidência: custo é 566x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 13964 — CILIOS 8308

- Custo no inventário: **R$ 3,25** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 16,25**
- Evidência: custo é 325x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 4602 — ESPELHO DE BOLSA OTIMO

- Custo no inventário: **R$ 5,25** · preço: R$ 0,03 · saldo: 3 un · inflado: **R$ 15,75**
- Evidência: preço de R$ 0,03 com custo de R$ 5,25
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1312 — LAÇO PDD OTIMOS

- Custo no inventário: **R$ 3,00** · preço: R$ 0,02 · saldo: 5 un · inflado: **R$ 15,00**
- Evidência: preço de R$ 0,02 com custo de R$ 3,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 49037 — CAIXINHA DE PRESENTE 15

- Custo no inventário: **R$ 2,33** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 13,98**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 51096 — PULSEIRA 5

- Custo no inventário: **R$ 3,92** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 11,76**
- Evidência: custo é 392x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 2685 — BRINCO

- Custo no inventário: **R$ 5,66** · preço: R$ 1,15 · saldo: 2 un · inflado: **R$ 11,32**
- Evidência: custo 4,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 4553 — UNHA

- Custo no inventário: **R$ 2,50** · preço: R$ 0,02 · saldo: 4 un · inflado: **R$ 10,00**
- Evidência: preço de R$ 0,02 com custo de R$ 2,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1386 — PRESILHA

- Custo no inventário: **R$ 1,91** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 9,55**
- Evidência: preço de R$ 0,01 com custo de R$ 1,91
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 13815 — PINCEL SKIN CARE

- Custo no inventário: **R$ 1,33** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 7,98**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 52485 — PIRANHA 715

- Custo no inventário: **R$ 3,75** · preço: R$ 0,90 · saldo: 2 un · inflado: **R$ 7,50**
- Evidência: preço de R$ 0,90 com custo de R$ 3,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 7742 — GRAMPO 6

- Custo no inventário: **R$ 1,42** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 5,68**
- Evidência: preço de R$ 0,01 com custo de R$ 1,42
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 41414 — ELASTICO

- Custo no inventário: **R$ 0,75** · preço: R$ 0,01 · saldo: 7 un · inflado: **R$ 5,25**
- Evidência: preço de R$ 0,01 com custo de R$ 0,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 41093 — BRINCO 6

- Custo no inventário: **R$ 4,66** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 4,66**
- Evidência: custo é 466x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 49678 — LACO B

- Custo no inventário: **R$ 3,33** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 3,33**
- Evidência: custo é 333x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 41276 — BRINCO S6

- Custo no inventário: **R$ 3,08** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 3,08**
- Evidência: custo é 308x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 45944 — RABICO

- Custo no inventário: **R$ 0,62** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 1,86**
- Evidência: preço de R$ 0,01 com custo de R$ 0,62
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## JAPINHA  ·  _ENCALHADA_

### 16988 — KIT SHAMPOO DETOX / ATIVO REDUTOR DE QUIABO JAPINHA 1LT

- Custo no inventário: **R$ 59,51** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 357,06**
- Evidência: custo é 5.951x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 9116 — BOTOX OJOIN JAPINHA 1KG

- Custo no inventário: **R$ 32,36** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 97,08**
- Evidência: custo é 3.236x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 9115 — BOTOX OJON JAPINHA 300G

- Custo no inventário: **R$ 14,34** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 57,36**
- Evidência: custo é 1.434x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 16945 — Kit Shampoo Detox / Ativo Redutor Organico Japinha 120ml

- Custo no inventário: **R$ 18,04** · preço: R$ 0,20 · saldo: 3 un · inflado: **R$ 54,12**
- Evidência: preço de R$ 0,20 com custo de R$ 18,04
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## ZGY  ·  _ENCALHADA_

### 15816 — CILIOS DE CANTO

- Custo no inventário: **R$ 7,20** · preço: R$ 0,01 · saldo: 22 un · inflado: **R$ 158,40**
- Evidência: custo é 720x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 2083 — BRINCO DETALHES PEQUENO

- Custo no inventário: **R$ 8,00** · preço: R$ 0,02 · saldo: 8 un · inflado: **R$ 64,00**
- Evidência: custo é 400x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 52211 — BRINCO COM 3 PARES ARGOLA

- Custo no inventário: **R$ 20,00** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 60,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 8813 — COLAR DE METAL

- Custo no inventário: **R$ 17,70** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 35,40**
- Evidência: custo é 1.770x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 11440 — COLAR COM PIGENTE

- Custo no inventário: **R$ 8,33** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 24,99**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 2712 — BRINCO LISO

- Custo no inventário: **R$ 10,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 10,00**
- Evidência: custo é 500x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 3455 — ARGOLA AÇO INOXIDAVEL

- Custo no inventário: **R$ 4,00** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 8,00**
- Evidência: preço de R$ 0,02 com custo de R$ 4,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1840 — BRINCO GOTA DOURADA PEQUENO - otimos

- Custo no inventário: **R$ 5,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 5,00**
- Evidência: preço de R$ 0,02 com custo de R$ 5,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1344 — PRESILHA COM 3

- Custo no inventário: **R$ 4,50** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 4,50**
- Evidência: preço de R$ 0,02 com custo de R$ 4,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## MISS FRANDY  ·  _SAINDO_

### 45155 — PINCEL MAQUIAGEM PARA BLUSH MISS FRANDY

- Custo no inventário: **R$ 9,42** · preço: R$ 2,08 · saldo: 18 un · inflado: **R$ 169,56**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 15727 — PINCEL MISS FRANDY PM16

- Custo no inventário: **R$ 57,54** · preço: R$ 12,90 · saldo: 2 un · inflado: **R$ 115,08**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 45144 — PINCEL MAQUIAGEM LINHA M.A

- Custo no inventário: **R$ 3,46** · preço: R$ 0,67 · saldo: 11 un · inflado: **R$ 38,06**
- Evidência: preço de R$ 0,67 com custo de R$ 3,46
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 30875 — PLACA PARA COLA FIO A FIO MISS FRANDY

- Custo no inventário: **R$ 3,75** · preço: R$ 0,74 · saldo: 7 un · inflado: **R$ 26,25**
- Evidência: preço de R$ 0,74 com custo de R$ 3,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 42770 — PINCEL PARA MAQUIAGEM MISS FRANDY PM15-1212

- Custo no inventário: **R$ 7,46** · preço: R$ 0,67 · saldo: 2 un · inflado: **R$ 14,92**
- Evidência: preço de R$ 0,67 com custo de R$ 7,46
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## REAL LOVE  ·  _ENCALHADA_

### 57839 — ESPONJA DE MAQUIAGEM

- Custo no inventário: **R$ 8,00** · preço: R$ 0,01 · saldo: 8 un · inflado: **R$ 64,00**
- Evidência: custo é 800x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14789 — CILIOS POSTICOS DE FIBRA DE TEREFTALATO DE POLIETILENO

- Custo no inventário: **R$ 5,31** · preço: R$ 0,01 · saldo: 10 un · inflado: **R$ 53,10**
- Evidência: custo é 531x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14796 — PINCEL PARA UNHA

- Custo no inventário: **R$ 6,83** · preço: R$ 0,01 · saldo: 7 un · inflado: **R$ 47,81**
- Evidência: custo é 683x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14795 — CILIOS POSTICOS DE FIBRA DETEREFTALA DE POLIETILENO

- Custo no inventário: **R$ 5,38** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 26,90**
- Evidência: custo é 538x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14785 — OLEO DUO DE CUTICULAS DE ROSAS - PESSEGO

- Custo no inventário: **R$ 2,13** · preço: R$ 0,01 · saldo: 11 un · inflado: **R$ 23,43**
- Evidência: preço de R$ 0,01 com custo de R$ 2,13
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14784 — COLA CILIOS/ UNHA POSTIÇO

- Custo no inventário: **R$ 2,13** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 12,78**
- Evidência: preço de R$ 0,01 com custo de R$ 2,13
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14793 — LAPIS P/ SOBRANCELHA

- Custo no inventário: **R$ 2,63** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 10,52**
- Evidência: preço de R$ 0,01 com custo de R$ 2,63
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 13535 — CONJ DECORACAO (4 GLITTER E 2 APLICADORES)

- Custo no inventário: **R$ 2,09** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 10,45**
- Evidência: preço de R$ 0,01 com custo de R$ 2,09
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14782 — KIT (1 NAVALHA P/ SOBRANCELHA E 1 REFIL DE LAMINA)

- Custo no inventário: **R$ 2,28** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 9,12**
- Evidência: preço de R$ 0,01 com custo de R$ 2,28
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 13617 — COLA P/ CILIOS BRANCA

- Custo no inventário: **R$ 2,95** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 8,85**
- Evidência: preço de R$ 0,01 com custo de R$ 2,95
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14781 — CANETA HIDRATANTE DE CUTICULAS PESSEGO - PACOTE

- Custo no inventário: **R$ 2,04** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 8,16**
- Evidência: o nome diz 'PACOTE' mas não diz quantas peças
- **Conserto:** **Abrir a nota** e ver quantas peças vêm no PACOTE.

### 14791 — CONJUNTO

- Custo no inventário: **R$ 1,16** · preço: R$ 0,01 · saldo: 7 un · inflado: **R$ 8,12**
- Evidência: preço de R$ 0,01 com custo de R$ 1,16
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14790 — PINCEL APLICADOR DE GLOSS - KIT COM 12 PCT, CADA PCT CONTEM 50 PECAS

- Custo no inventário: **R$ 1,16** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 6,96**
- Evidência: o nome diz 'PCT' mas não diz quantas peças
- **Conserto:** **Abrir a nota** e ver quantas peças vêm no PCT.

### 14780 — ESPELHO COM MOLDURA DE PLASTICO

- Custo no inventário: **R$ 2,20** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 6,60**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 14786 — NAVALHA DE PLASTICO PARA SOBRANCELHA

- Custo no inventário: **R$ 3,16** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 6,32**
- Evidência: custo é 316x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14792 — DISCO DE LIXA PARA LIXADEIRA

- Custo no inventário: **R$ 1,16** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 4,64**
- Evidência: preço de R$ 0,01 com custo de R$ 1,16
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14800 — TESOURA DE METAL PARA SOBRANCELHA

- Custo no inventário: **R$ 1,04** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 3,12**
- Evidência: preço de R$ 0,01 com custo de R$ 1,04
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14783 — ALMOFADA DE APOIO DE BRACO P/ MANICURE DE PILIURETANO

- Custo no inventário: **R$ 2,28** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 2,28**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 14794 — PREP BACTERICIDA

- Custo no inventário: **R$ 1,14** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 1,14**
- Evidência: preço de R$ 0,01 com custo de R$ 1,14
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## NATHYDRAS  ·  _ENCALHADA_

### 45512 — REPARADOR DE PONTAS ALHO 30ML

- Custo no inventário: **R$ 13,75** · preço: R$ 0,01 · saldo: 11 un · inflado: **R$ 151,25**
- Evidência: custo é 1.375x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## IMPALA  ·  _ENCALHADA_

### 18015 — OLEO PARA CUTICULAS IMPALA TRATAMENTO

- Custo no inventário: **R$ 2,91** · preço: R$ 0,01 · saldo: 24 un · inflado: **R$ 69,84**
- Evidência: preço de R$ 0,01 com custo de R$ 2,91
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 53127 — REMOVEDOR DE ESMALTE COM ACETONA TIRESMALT ORIGINAL 100ml

- Custo no inventário: **R$ 3,18** · preço: R$ 0,01 · saldo: 20 un · inflado: **R$ 63,60**
- Evidência: custo é 318x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 18014 — ESMALTE IMPALA A COR DA MODA CREMOSO INTUICAO

- Custo no inventário: **R$ 2,91** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 17,46**
- Evidência: preço de R$ 0,01 com custo de R$ 2,91
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## VIVI  ·  _ENCALHADA_

### 2230 — COLA PARA CILIOS 7G - VIVI

- Custo no inventário: **R$ 10,91** · preço: R$ 1,95 · saldo: 12 un · inflado: **R$ 130,92**
- Evidência: custo 5,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## INOAR  ·  _ENCALHADA_

### 52262 — INOAR BLENDS CREME PARA PENTEAR 500GR

- Custo no inventário: **R$ 29,61** · preço: R$ 6,90 · saldo: 3 un · inflado: **R$ 88,83**
- Evidência: custo 4,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## APSE  ·  _ATIVA_

### 17320 — CREME APICE 80G

- Custo no inventário: **R$ 5,79** · preço: R$ 0,01 · saldo: 9 un · inflado: **R$ 52,11**
- Evidência: custo é 579x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## RUBY ROSE  ·  _ATIVA_

### 65573 — 2024.8.1 - ILUME COLORS 2024.8.1

- Custo no inventário: **R$ 6,90** · preço: R$ 1,38 · saldo: 3 un · inflado: **R$ 20,70**
- Evidência: custo 5,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 64989 — UNHA POSTICA BAILARINA DECORADA 2010000002810

- Custo no inventário: **R$ 5,45** · preço: R$ 0,09 · saldo: 1 un · inflado: **R$ 5,45**
- Evidência: preço de R$ 0,09 com custo de R$ 5,45
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## VARCARE  ·  _ENCALHADA_

### 65042 — AMOSTRA SACHE INVERSOR VIP LINE VARCARE 15 ML

- Custo no inventário: **R$ 32,80** · preço: R$ 1,20 · saldo: 0 un · inflado: **R$ 13,12**
- Evidência: custo 27,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## SEM MARCA  ·  _ENCALHADA_

### 5341 — CARTAZ FASHION COLOR ARGAN

- Custo no inventário: **R$ 0,10** · preço: R$ 0,01 · saldo: 100 un · inflado: **R$ 10,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,10
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## SENSCIENCE  ·  _ENCALHADA_

### 8984 — FLYER PROD SENSCIENCE

- Custo no inventário: **R$ 0,10** · preço: R$ 0,01 · saldo: 100 un · inflado: **R$ 10,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,10
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## LUDURANA  ·  _ENCALHADA_

### 18093 — ESMALTE LUDURANA GLITTER FIO DE OURO SOLTO 8ML

- Custo no inventário: **R$ 1,50** · preço: R$ 0,12 · saldo: 4 un · inflado: **R$ 6,00**
- Evidência: preço de R$ 0,12 com custo de R$ 1,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


---

# Parte B — que marcas ainda existem na loja

Medido por entrada e venda desde 01/01/2023. Marca com saldo e nenhum movimento em três
anos e meio quase certamente não está na prateleira — é saldo que ficou no sistema.

| Situação | Marcas | Peças | Valor | O que significa |
|---|---:|---:|---:|---|
| **FANTASMA** | 7 | 25 | R$ 413,74 | saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja |
| **MORTA** | 13 | 384 | R$ 1.727,53 | não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual |
| **SAINDO** | 7 | 260 | R$ 2.593,97 | não se compra mais, mas ainda gira |
| **ENCALHADA** | 64 | 8.759 | R$ 109.027,76 | ainda se compra, mas o saldo dá mais de 3 anos |
| **ATIVA** | 68 | 17.362 | R$ 143.188,65 | compra e gira |

## FANTASMA — saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| GAMA | 1 | 1 | R$ 148,24 | 0 | 0 |
| LE VANGEE | 1 | 17 | R$ 124,10 | 0 | 0 |
| MINU COMERCIO | 1 | 1 | R$ 65,00 | 0 | 0 |
| LATIKA | 1 | 3 | R$ 53,70 | 0 | 0 |
| MAKE ON E | 1 | 1 | R$ 18,98 | 0 | 0 |
| JC IMPORT | 1 | 1 | R$ 3,71 | 0 | 0 |
| JACK DESIGN | 1 | 1 | R$ 0,01 | 0 | 0 |

## MORTA — não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| MACRILAN | 4 | 11 | R$ 545,53 | 0 | 4 |
| IMPORTADORA JF | 1 | 188 | R$ 376,00 | 0 | 94 |
| AMIGOLD | 1 | 7 | R$ 153,93 | 0 | 8 |
| MANDALA | 1 | 7 | R$ 142,52 | 0 | 2 |
| MELU RUBY ROSE | 4 | 11 | R$ 128,49 | 0 | 11 |
| VOLIA | 3 | 6 | R$ 110,70 | 0 | 3 |
| X & D | 1 | 7 | R$ 91,00 | 0 | 4 |
| MAX BRASIL | 1 | 74 | R$ 74,00 | 0 | 88 |
| MERHEJE | 1 | 7 | R$ 42,42 | 0 | 2 |
| CHEN YUMEI | 5 | 16 | R$ 29,80 | 0 | 8 |
| MAX LOVE | 1 | 1 | R$ 15,50 | 0 | 1 |
| MEU MEU BIJOUTERIAS | 4 | 12 | R$ 15,07 | 0 | 2 |
| SOLIDER | 8 | 37 | R$ 2,57 | 0 | 14 |

