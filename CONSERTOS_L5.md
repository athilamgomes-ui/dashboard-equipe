# Estoque L5 · MissBeleza Santarém

Fonte: **Registro de Inventário** do ERP (Suprimentos → Relatórios → Registro de Inventário),
puxado em 27/08/2026 — é o relatório que valoriza o estoque, o mesmo que você usa.

Estoque declarado: **29.725 peças · R$ 367.501,84** em 174 marcas.

---

# Parte A — produtos com custo errado

**113 produtos · R$ 10.453,33** de valor que o sistema mostra e não existe.

Critério: custo maior que 3x o preço de venda. Margem apertada acontece; vender a menos
de um terço do custo, não.

| Tipo de conserto | Produtos | Valor | Quem resolve |
|---|---:|---:|---|
| fator de conversão (qtd estimada) | 12 | R$ 3.608,53 | confirmar a quantidade, depois cadastrar |
| conferir a nota | 19 | R$ 2.398,55 | abrir a nota primeiro |
| custo corrompido | 50 | R$ 2.047,76 | ajuste de custo no ERP |
| preço a conferir | 19 | R$ 1.547,71 | quem define preço |
| fator de conversão | 1 | R$ 513,00 | quem dá entrada de NF (cadastro) |
| fator a confirmar | 9 | R$ 238,13 | abrir a nota primeiro |
| sem movimento | 3 | R$ 99,65 | contagem física (ver parte B) |

> **A ordem importa:** fator de conversão antes do custo. Corrigindo só o custo, a
> próxima nota reintroduz o erro — a entrada continua lançando pacote como peça.

## KISS NEW YORK  ·  _ATIVA_

### 11100 — KISS NY NAVALHA SOBRANC LONGO

- Custo no inventário: **R$ 217,54** · preço: R$ 6,90 · saldo: 15 un · inflado: **R$ 3.263,10**
- Evidência: comprou 1, vendeu 84 (razão 84x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~84 peças** — **confirmar na nota antes de gravar**. Com 84, o custo cai de R$ 217,54 para R$ 2,59, margem de 166% sobre R$ 6,90.
- Efeito: o estoque reduz R$ 3.224,25 (correção, não perda)

### 40314 — RK LIP FIX GLOSSY TINT - CHERRY KISS

- Custo no inventário: **R$ 22,92** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 137,52**
- Evidência: custo é 2.292x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 41737 — RK LIP FIX GLOSSY TINT - BERRY CHARM

- Custo no inventário: **R$ 22,92** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 114,60**
- Evidência: custo é 2.292x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 28367 — KISS NY PINCA PONTA FINA

- Custo no inventário: **R$ 2,45** · preço: R$ 0,08 · saldo: 19 un · inflado: **R$ 46,55**
- Evidência: comprou 1, vendeu 35 (razão 35x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~35 peças** — **confirmar na nota antes de gravar**. Com 35, o custo cai de R$ 2,45 para R$ 0,07, margem de 14% sobre R$ 0,08.
- Efeito: o estoque reduz R$ 45,22 (correção, não perda)

### 40477 — RK LIP FIX GLOSSY TINT - ROSY BROWN

- Custo no inventário: **R$ 22,92** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 45,84**
- Evidência: custo é 2.292x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 40136 — RK LIP FIX GLOSSY TINT - SWEET BROWN

- Custo no inventário: **R$ 22,92** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 22,92**
- Evidência: custo é 2.292x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## SANTA CLARA  ·  _ATIVA_

### 1141 — LIXA EXTRA GROSA ST CLARA UN

- Custo no inventário: **R$ 7,88** · preço: R$ 0,25 · saldo: 144 un · inflado: **R$ 1.134,72**
- Evidência: preço de R$ 0,25 com custo de R$ 7,88
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 15947 — LIXA M POP PARDA C/100 SANTA CLARA

- Custo no inventário: **R$ 5,13** · preço: R$ 0,25 · saldo: 100 un · inflado: **R$ 513,00**
- Evidência: no nome: C/100
- **Conserto:** Cadastrar **fator de conversão = 100** (a quantidade está no nome). O custo unitário cai de R$ 5,13 para **R$ 0,05** — margem de 387% sobre o preço de R$ 0,25.
- Efeito: o estoque reduz R$ 507,87 (correção, não perda)

### 122 — LIXA MOD.ANAT.4 FACES P/UNHAS

- Custo no inventário: **R$ 4,36** · preço: R$ 0,02 · saldo: 5 un · inflado: **R$ 21,80**
- Evidência: preço de R$ 0,02 com custo de R$ 4,36
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 27519 — TOUCA CETIM PRETO DIFUSORA HOT

- Custo no inventário: **R$ 20,10** · preço: R$ 3,40 · saldo: 1 un · inflado: **R$ 20,10**
- Evidência: custo 5,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 17694 — TIGELA GRD.P/TINTURA REF.540

- Custo no inventário: **R$ 1,61** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 8,05**
- Evidência: preço de R$ 0,01 com custo de R$ 1,61
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## OTIMO BIJUTERIAS  ·  _ATIVA_

### 17051 — COLAR

- Custo no inventário: **R$ 6,66** · preço: R$ 0,01 · saldo: 13 un · inflado: **R$ 86,58**
- Evidência: custo é 666x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 17053 — COLAR

- Custo no inventário: **R$ 10,00** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 60,00**
- Evidência: custo é 1.000x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 4875 — SAIA CARNAVAL 2

- Custo no inventário: **R$ 10,60** · preço: R$ 2,60 · saldo: 5 un · inflado: **R$ 53,00**
- Evidência: custo 4,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 42923 — BRINCO QUADRADO E REDONDO - F01-625762

- Custo no inventário: **R$ 13,00** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 52,00**
- Evidência: custo é 1.300x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1378 — COLAR

- Custo no inventário: **R$ 11,25** · preço: R$ 0,02 · saldo: 4 un · inflado: **R$ 45,00**
- Evidência: custo é 562x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 77073 — ANEL

- Custo no inventário: **R$ 1,20** · preço: R$ 0,24 · saldo: 34 un · inflado: **R$ 40,80**
- Evidência: comprou 1, vendeu 18 (razão 18x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~18 peças** — **confirmar na nota antes de gravar**. Com 18, o custo cai de R$ 1,20 para R$ 0,07, margem de 260% sobre R$ 0,24.
- Efeito: o estoque reduz R$ 38,53 (correção, não perda)

### 41613 — PULSEIRA D2

- Custo no inventário: **R$ 9,33** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 37,32**
- Evidência: custo é 933x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 40651 — TIARA K

- Custo no inventário: **R$ 4,66** · preço: R$ 0,01 · saldo: 8 un · inflado: **R$ 37,28**
- Evidência: custo é 466x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 27735 — BRACELETE AÇO INOX - G02-9321161-P

- Custo no inventário: **R$ 16,00** · preço: R$ 3,82 · saldo: 2 un · inflado: **R$ 32,00**
- Evidência: custo 4,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 2688 — BRINCO 7

- Custo no inventário: **R$ 7,00** · preço: R$ 0,02 · saldo: 4 un · inflado: **R$ 28,00**
- Evidência: custo é 350x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 4602 — ESPELHO DE BOLSA OTIMO

- Custo no inventário: **R$ 5,25** · preço: R$ 0,03 · saldo: 5 un · inflado: **R$ 26,25**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 51096 — PULSEIRA 5

- Custo no inventário: **R$ 3,92** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 23,52**
- Evidência: custo é 392x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 2571 — CILIOS OTIMOS

- Custo no inventário: **R$ 1,08** · preço: R$ 0,02 · saldo: 20 un · inflado: **R$ 21,60**
- Evidência: preço de R$ 0,02 com custo de R$ 1,08
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 44217 — ARGOLA COLORIDA GRANDE - F11-222464

- Custo no inventário: **R$ 7,00** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 21,00**
- Evidência: custo é 700x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 57159 — PINCEL KT6

- Custo no inventário: **R$ 7,00** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 21,00**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 7,00 ÷ 5 = R$ 1,40, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 1808 — BRINCO

- Custo no inventário: **R$ 5,00** · preço: R$ 1,50 · saldo: 4 un · inflado: **R$ 20,00**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** — **confirmar na nota antes de gravar**. Com 5, o custo cai de R$ 5,00 para R$ 1,00, margem de 50% sobre R$ 1,50.
- Efeito: o estoque reduz R$ 16,00 (correção, não perda)

### 15321 — COLAR CORRENTE GRANDE COM DETALHE EM BRILHO - G01-866982-C

- Custo no inventário: **R$ 17,50** · preço: R$ 2,75 · saldo: 1 un · inflado: **R$ 17,50**
- Evidência: custo 6,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27857 — COLAR PEROLA COM PIGENTE -

- Custo no inventário: **R$ 17,00** · preço: R$ 3,19 · saldo: 1 un · inflado: **R$ 17,00**
- Evidência: custo 5,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 17052 — COLAR

- Custo no inventário: **R$ 5,66** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 16,98**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 5,66 ÷ 5 = R$ 1,13, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 44544 — CONJUNTO COLAR E BRINCO PEROLA COM PEDRAS - F01-782855

- Custo no inventário: **R$ 16,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 16,00**
- Evidência: custo é 1.600x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 49678 — LACO B

- Custo no inventário: **R$ 3,33** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 13,32**
- Evidência: custo é 333x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 42924 — KIT BRINCO E COLAR GOTA E CORAÇÃO -F22-293683

- Custo no inventário: **R$ 12,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 12,00**
- Evidência: custo é 1.200x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 44542 — BRINCO CORAÇÃO GRANDE - F34-572225X

- Custo no inventário: **R$ 4,00** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 8,00**
- Evidência: custo é 400x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 10604 — BORRIFADOR

- Custo no inventário: **R$ 7,85** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 7,85**
- Evidência: custo é 785x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 5015 — BRINCO

- Custo no inventário: **R$ 5,75** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 5,75**
- Evidência: preço de R$ 0,02 com custo de R$ 5,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 2685 — BRINCO

- Custo no inventário: **R$ 5,66** · preço: R$ 1,15 · saldo: 1 un · inflado: **R$ 5,66**
- Evidência: custo 4,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 44232 — BRINCO 69

- Custo no inventário: **R$ 5,66** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 5,66**
- Evidência: custo é 566x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 41093 — BRINCO 6

- Custo no inventário: **R$ 4,66** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 4,66**
- Evidência: custo é 466x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1386 — PRESILHA

- Custo no inventário: **R$ 2,33** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 4,66**
- Evidência: preço de R$ 0,01 com custo de R$ 2,33
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 40686 — ELASTICO

- Custo no inventário: **R$ 4,16** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 4,16**
- Evidência: comprou 3, vendeu 17 (razão 6x)
- **Conserto:** Parece embalagem de 6, mas R$ 4,16 ÷ 6 = R$ 0,69, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 5705 — CAIXINHA DE PRESENTE 12

- Custo no inventário: **R$ 3,90** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 3,90**
- Evidência: custo é 390x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 41276 — BRINCO S6

- Custo no inventário: **R$ 3,08** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 3,08**
- Evidência: comprou 2, vendeu 10 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 3,08 ÷ 5 = R$ 0,62, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 49037 — CAIXINHA DE PRESENTE 15

- Custo no inventário: **R$ 2,33** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 2,33**
- Evidência: preço de R$ 0,01 com custo de R$ 2,33
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 52465 — GRAMPO 6

- Custo no inventário: **R$ 1,66** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 1,66**
- Evidência: comprou 2, vendeu 10 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 1,66 ÷ 5 = R$ 0,33, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

## REAL LOVE  ·  _ENCALHADA_

### 14789 — CILIOS POSTICOS DE FIBRA DE TEREFTALATO DE POLIETILENO

- Custo no inventário: **R$ 9,66** · preço: R$ 0,01 · saldo: 16 un · inflado: **R$ 154,56**
- Evidência: custo é 966x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14785 — OLEO DUO DE CUTICULAS DE ROSAS - PESSEGO

- Custo no inventário: **R$ 6,93** · preço: R$ 0,01 · saldo: 10 un · inflado: **R$ 69,30**
- Evidência: custo é 693x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14780 — ESPELHO COM MOLDURA DE PLASTICO

- Custo no inventário: **R$ 12,76** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 63,80**
- Evidência: custo é 1.276x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14792 — DISCO DE LIXA PARA LIXADEIRA

- Custo no inventário: **R$ 5,63** · preço: R$ 0,01 · saldo: 9 un · inflado: **R$ 50,67**
- Evidência: custo é 563x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 13535 — CONJ DECORACAO (4 GLITTER E 2 APLICADORES)

- Custo no inventário: **R$ 4,40** · preço: R$ 0,01 · saldo: 11 un · inflado: **R$ 48,40**
- Evidência: custo é 440x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 13506 — VARA MAGNETICA DE METAL

- Custo no inventário: **R$ 8,29** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 33,16**
- Evidência: custo é 829x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14783 — ALMOFADA DE APOIO DE BRACO P/ MANICURE DE PILIURETANO

- Custo no inventário: **R$ 30,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 30,00**
- Evidência: custo é 3.000x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14794 — PREP BACTERICIDA

- Custo no inventário: **R$ 5,25** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 26,25**
- Evidência: custo é 525x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14797 — CONJUNTO (1 DESBASTADOR DE CALOSIDADE E 1 APARADOR DE CUTICULA)

- Custo no inventário: **R$ 3,60** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 21,60**
- Evidência: custo é 360x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14796 — PINCEL PARA UNHA

- Custo no inventário: **R$ 6,83** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 20,49**
- Evidência: custo é 683x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14799 — TESOURA DE METAL PARA SOBRANCELHA

- Custo no inventário: **R$ 3,25** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 16,25**
- Evidência: custo é 325x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14790 — PINCEL APLICADOR DE GLOSS - KIT COM 12 PCT, CADA PCT CONTEM 50 PECAS

- Custo no inventário: **R$ 3,03** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 15,15**
- Evidência: custo é 303x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14791 — CONJUNTO

- Custo no inventário: **R$ 2,32** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 13,92**
- Evidência: preço de R$ 0,01 com custo de R$ 2,32
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14787 — KIT(1 TESOURA COM PENTE PARA SOBRANCELHA E 1 REFIL)

- Custo no inventário: **R$ 2,78** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 11,12**
- Evidência: comprou 1, vendeu 8 (razão 8x)
- **Conserto:** Parece embalagem de 8, mas R$ 2,78 ÷ 8 = R$ 0,35, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 14798 — PINCEL P/ UNHA COM PONTA BOLEADOR 2 EM 1

- Custo no inventário: **R$ 9,33** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 9,33**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 9,33 ÷ 5 = R$ 1,87, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 14781 — CANETA HIDRATANTE DE CUTICULAS PESSEGO - PACOTE

- Custo no inventário: **R$ 2,04** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 6,12**
- Evidência: o nome diz 'PACOTE' mas não diz quantas peças
- **Conserto:** **Abrir a nota** e ver quantas peças vêm no PACOTE.

### 14779 — CILIOS POSTICOS FIO A FIO DE FIBRA DE TEREFTALATO

- Custo no inventário: **R$ 3,19** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 3,19**
- Evidência: custo é 319x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## LIZZE  ·  _ATIVA_

### 16329 — SECADOR SUPREME C 2600 127V

- Custo no inventário: **R$ 549,17** · preço: R$ 102,50 · saldo: 1 un · inflado: **R$ 549,17**
- Evidência: custo 5,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## VERTIX  ·  _ATIVA_

### 5207 — CHAPA DE CABELO PROFISSIONAL MAX HEAT VERTIX

- Custo no inventário: **R$ 176,40** · preço: R$ 11,90 · saldo: 2 un · inflado: **R$ 352,80**
- Evidência: custo 14,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 5013 — SECADOR DE CABELO PROFISSIONAL ALLURE VERTIX 2200W/127V

- Custo no inventário: **R$ 135,61** · preço: R$ 44,90 · saldo: 1 un · inflado: **R$ 135,61**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 2817 — HAIRGLOSS SPRAY DE BRILHO VERTIX 150ML

- Custo no inventário: **R$ 14,95** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 44,85**
- Evidência: custo é 748x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

## ZGY  ·  _ENCALHADA_

### 1359 — COLAR 06 - ZGY

- Custo no inventário: **R$ 13,33** · preço: R$ 0,02 · saldo: 8 un · inflado: **R$ 106,64**
- Evidência: custo é 666x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 2689 — CONJUNTO BRINCO DE METAL

- Custo no inventário: **R$ 10,00** · preço: R$ 0,02 · saldo: 7 un · inflado: **R$ 70,00**
- Evidência: custo é 500x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 41040 — COLAR COLOR

- Custo no inventário: **R$ 11,00** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 66,00**
- Evidência: custo é 1.100x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 17057 — CONJUNTO COLAR

- Custo no inventário: **R$ 8,30** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 49,80**
- Evidência: custo é 830x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 2837 — BRINCO PONTO DE FLOR

- Custo no inventário: **R$ 9,00** · preço: R$ 1,90 · saldo: 5 un · inflado: **R$ 45,00**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 8813 — COLAR DE METAL

- Custo no inventário: **R$ 7,20** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 43,20**
- Evidência: custo é 720x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 15009 — PIRANHA GRANDE LAÇO

- Custo no inventário: **R$ 7,20** · preço: R$ 0,90 · saldo: 4 un · inflado: **R$ 28,80**
- Evidência: preço de R$ 0,90 com custo de R$ 7,20
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 2802 — BRINCO ESPIRAL

- Custo no inventário: **R$ 7,60** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 22,80**
- Evidência: custo é 380x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 2697 — BRINCO FLOR DE LINHA

- Custo no inventário: **R$ 7,20** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 14,40**
- Evidência: custo é 360x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 51097 — PULSEIRA PEROLA

- Custo no inventário: **R$ 5,00** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 10,00**
- Evidência: custo é 500x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1652 — BRINCO DETALHES COM PEROLA 16 - ZGY

- Custo no inventário: **R$ 8,37** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 8,37**
- Evidência: custo é 418x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 2083 — BRINCO DETALHES PEQUENO

- Custo no inventário: **R$ 8,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 8,00**
- Evidência: custo é 400x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 1840 — BRINCO GOTA DOURADA PEQUENO - otimos

- Custo no inventário: **R$ 6,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 6,00**
- Evidência: preço de R$ 0,02 com custo de R$ 6,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 5025 — BRINCO ZGY

- Custo no inventário: **R$ 6,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 6,00**
- Evidência: preço de R$ 0,02 com custo de R$ 6,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 44574 — ELASTICO BOLSINHA

- Custo no inventário: **R$ 5,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 5,00**
- Evidência: custo é 500x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## HUNKY MODAS  ·  _ATIVA_

### 78496 — KIT 5 ELASTICO ELA-185

- Custo no inventário: **R$ 17,40** · preço: R$ 3,90 · saldo: 19 un · inflado: **R$ 330,60**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## MIAMAKE  ·  _ATIVA_

### 74761 — CORRETIVO LIQUIDO ANTIOXIDANTE CHOCOLATE

- Custo no inventário: **R$ 11,75** · preço: R$ 0,20 · saldo: 11 un · inflado: **R$ 129,25**
- Evidência: preço de R$ 0,20 com custo de R$ 11,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 74758 — BATOM LIQUIDO MATTE LOVE

- Custo no inventário: **R$ 7,42** · preço: R$ 0,08 · saldo: 13 un · inflado: **R$ 96,46**
- Evidência: preço de R$ 0,08 com custo de R$ 7,42
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 74760 — CORRETIVO LIQUIDO ANTIOXIDANTE BEGE

- Custo no inventário: **R$ 11,75** · preço: R$ 0,20 · saldo: 1 un · inflado: **R$ 11,75**
- Evidência: preço de R$ 0,20 com custo de R$ 11,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## FACE BEAUTIFUL  ·  _ATIVA_

### 80138 — SABONETE LIQUIDO BEAUTYLOO MORANGO 200ML

- Custo no inventário: **R$ 7,95** · preço: R$ 2,38 · saldo: 17 un · inflado: **R$ 135,15**
- Evidência: custo 3,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 553 — CLEASING BALM LUXURY FACE BEAUTIFUL

- Custo no inventário: **R$ 14,95** · preço: R$ 4,90 · saldo: 6 un · inflado: **R$ 89,70**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## RICCA  ·  _ATIVA_

### 5709 — MULTI DRY ESCOVA SECADORA TROCA CABECAS RICCA

- Custo no inventário: **R$ 135,61** · preço: R$ 7,90 · saldo: 1 un · inflado: **R$ 135,61**
- Evidência: custo 17,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 2706 — APARADOR DE PELOS FACIAIS RICCA GLOW

- Custo no inventário: **R$ 41,40** · preço: R$ 11,50 · saldo: 2 un · inflado: **R$ 82,80**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## CHEN YUMEI  ·  _ATIVA_

### 76525 — WZS532 CINTO

- Custo no inventário: **R$ 12,00** · preço: R$ 1,40 · saldo: 5 un · inflado: **R$ 60,00**
- Evidência: comprou 1, vendeu 16 (razão 16x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~16 peças** — **confirmar na nota antes de gravar**. Com 16, o custo cai de R$ 12,00 para R$ 0,75, margem de 87% sobre R$ 1,40.
- Efeito: o estoque reduz R$ 56,25 (correção, não perda)

### 76524 — WZS1117 CINTO

- Custo no inventário: **R$ 12,00** · preço: R$ 2,80 · saldo: 3 un · inflado: **R$ 36,00**
- Evidência: comprou 1, vendeu 12 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** — **confirmar na nota antes de gravar**. Com 12, o custo cai de R$ 12,00 para R$ 1,00, margem de 180% sobre R$ 2,80.
- Efeito: o estoque reduz R$ 33,00 (correção, não perda)

### 76538 — MZS304 CINTO

- Custo no inventário: **R$ 12,00** · preço: R$ 2,40 · saldo: 2 un · inflado: **R$ 24,00**
- Evidência: custo 5,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 76516 — MZS380 CINTO

- Custo no inventário: **R$ 10,00** · preço: R$ 2,00 · saldo: 2 un · inflado: **R$ 20,00**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** — **confirmar na nota antes de gravar**. Com 5, o custo cai de R$ 10,00 para R$ 2,00, margem de 0% sobre R$ 2,00.
- Efeito: o estoque reduz R$ 16,00 (correção, não perda)

### 76530 — WZS451 CINTO

- Custo no inventário: **R$ 9,00** · preço: R$ 2,80 · saldo: 2 un · inflado: **R$ 18,00**
- Evidência: custo 3,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 76517 — MZS308 CINTO

- Custo no inventário: **R$ 12,00** · preço: R$ 2,40 · saldo: 1 un · inflado: **R$ 12,00**
- Evidência: comprou 1, vendeu 11 (razão 11x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~11 peças** — **confirmar na nota antes de gravar**. Com 11, o custo cai de R$ 12,00 para R$ 1,09, margem de 120% sobre R$ 2,40.
- Efeito: o estoque reduz R$ 10,91 (correção, não perda)

### 76508 — WZS484 CINTO

- Custo no inventário: **R$ 10,00** · preço: R$ 2,00 · saldo: 1 un · inflado: **R$ 10,00**
- Evidência: comprou 1, vendeu 9 (razão 9x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~9 peças** — **confirmar na nota antes de gravar**. Com 9, o custo cai de R$ 10,00 para R$ 1,11, margem de 80% sobre R$ 2,00.
- Efeito: o estoque reduz R$ 8,89 (correção, não perda)

### 76532 — WZS506 CINTO

- Custo no inventário: **R$ 8,00** · preço: R$ 1,40 · saldo: 1 un · inflado: **R$ 8,00**
- Evidência: comprou 1, vendeu 9 (razão 9x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~9 peças** — **confirmar na nota antes de gravar**. Com 9, o custo cai de R$ 8,00 para R$ 0,89, margem de 57% sobre R$ 1,40.
- Efeito: o estoque reduz R$ 7,11 (correção, não perda)

### 76522 — WZS486 CINTO

- Custo no inventário: **R$ 4,58** · preço: R$ 0,92 · saldo: 1 un · inflado: **R$ 4,58**
- Evidência: preço de R$ 0,92 com custo de R$ 4,58
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## VIVI  ·  _ATIVA_

### 2230 — COLA PARA CILIOS 7G - VIVI

- Custo no inventário: **R$ 10,90** · preço: R$ 1,95 · saldo: 17 un · inflado: **R$ 185,30**
- Evidência: custo 5,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## MARIA MARGARIDA  ·  _ATIVA_

### 78225 — PO HIDRATANTE DE TAPIOCA ATE EMBAIXO DAGUA 15G - MM COR 05 - BRINDE PROVADOR

- Custo no inventário: **R$ 33,91** · preço: R$ 2,00 · saldo: 5 un · inflado: **R$ 169,55**
- Evidência: custo 17,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## NATHYDRAS  ·  _ENCALHADA_

### 45512 — REPARADOR DE PONTAS ALHO 30ML

- Custo no inventário: **R$ 13,75** · preço: R$ 0,01 · saldo: 12 un · inflado: **R$ 165,00**
- Evidência: custo é 1.375x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## MACRILAN  ·  _ENCALHADA_

### 78341 — KIT COM 5 PINCEIS E 3 PULSEIRA MACRILAN

- Custo no inventário: **R$ 41,17** · preço: R$ 6,49 · saldo: 4 un · inflado: **R$ 164,68**
- Evidência: comprou 2, vendeu 10 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 41,17 ÷ 5 = R$ 8,23, que ainda passa do preço de R$ 6,49. **Abrir a nota** e ver a unidade.

## DAFU  ·  _ATIVA_

### 12082 — SUGADOR DE PO - DAFU

- Custo no inventário: **R$ 55,00** · preço: R$ 3,90 · saldo: 1 un · inflado: **R$ 55,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 44500 — REFIL DE BROCA DAFU

- Custo no inventário: **R$ 6,66** · preço: R$ 0,02 · saldo: 6 un · inflado: **R$ 39,96**
- Evidência: custo é 333x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 52751 — ORNAMENTO PARA CABELO (PRESILHA) DE METAL

- Custo no inventário: **R$ 2,50** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 2,50**
- Evidência: preço de R$ 0,02 com custo de R$ 2,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## INOAR  ·  _ATIVA_

### 75322 — RESISTANCE FIBRA DE BAMBU DISPLAY AMP 45 ML

- Custo no inventário: **R$ 45,04** · preço: R$ 13,86 · saldo: 2 un · inflado: **R$ 90,08**
- Evidência: comprou 4, vendeu 37 (razão 9x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~9 peças** — **confirmar na nota antes de gravar**. Com 9, o custo cai de R$ 45,04 para R$ 5,00, margem de 177% sobre R$ 13,86.
- Efeito: o estoque reduz R$ 80,07 (correção, não perda)

## ITALLIAN HAIR  ·  _ATIVA_

### 40339 — CB CORRETOR AZUL ITALLIAN COLOR 60G

- Custo no inventário: **R$ 13,04** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 52,16**
- Evidência: custo é 1.304x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## TUCA  ·  _ATIVA_

### 7396 — PIRANHA TUCA CABELO XX57

- Custo no inventário: **R$ 18,80** · preço: R$ 0,75 · saldo: 2 un · inflado: **R$ 37,60**
- Evidência: preço de R$ 0,75 com custo de R$ 18,80
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## JONALISSA BIJOUX LTDA  ·  _SAINDO_

### 202237 — CHAPEU DE PRAIA COM LAÇO - CP24083

- Custo no inventário: **R$ 18,40** · preço: R$ 3,68 · saldo: 1 un · inflado: **R$ 18,40**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## VIVAI  ·  _ATIVA_

### 75109 — LIP TINT 06 CORES - JELLY FRUIT

- Custo no inventário: **R$ 4,40** · preço: R$ 0,05 · saldo: 2 un · inflado: **R$ 8,80**
- Evidência: preço de R$ 0,05 com custo de R$ 4,40
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## APSE  ·  _ATIVA_

### 17320 — CREME APICE 80G

- Custo no inventário: **R$ 5,79** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 5,79**
- Evidência: custo é 579x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## RISQUE  ·  _ATIVA_

### 59141 — ESM RISQUE CREM VERMELHO FELICIDE

- Custo no inventário: **R$ 3,14** · preço: R$ 0,82 · saldo: 1 un · inflado: **R$ 3,14**
- Evidência: preço de R$ 0,82 com custo de R$ 3,14
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## HELLO MINI  ·  _ATIVA_

### 75598 — PIRANHA PARA CABELO - HP1632-4

- Custo no inventário: **R$ 2,00** · preço: R$ 0,28 · saldo: 1 un · inflado: **R$ 2,00**
- Evidência: comprou 1, vendeu 22 (razão 22x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~22 peças** — **confirmar na nota antes de gravar**. Com 22, o custo cai de R$ 2,00 para R$ 0,09, margem de 208% sobre R$ 0,28.
- Efeito: o estoque reduz R$ 1,91 (correção, não perda)


---

# Parte B — que marcas ainda existem na loja

Medido por entrada e venda desde 01/01/2023. Marca com saldo e nenhum movimento em três
anos e meio quase certamente não está na prateleira — é saldo que ficou no sistema.

| Situação | Marcas | Peças | Valor | O que significa |
|---|---:|---:|---:|---|
| **FANTASMA** | 7 | 16 | R$ 675,53 | saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja |
| **MORTA** | 9 | 244 | R$ 4.093,78 | não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual |
| **SAINDO** | 6 | 182 | R$ 845,84 | não se compra mais, mas ainda gira |
| **ENCALHADA** | 46 | 5.545 | R$ 82.563,53 | ainda se compra, mas o saldo dá mais de 3 anos |
| **ATIVA** | 106 | 23.738 | R$ 279.323,16 | compra e gira |

## FANTASMA — saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| MODALLI | 1 | 6 | R$ 420,00 | 0 | 0 |
| RED FLAMINGO | 1 | 1 | R$ 100,00 | 0 | 0 |
| NITZY | 3 | 3 | R$ 96,00 | 0 | 0 |
| GLAMOUR | 1 | 1 | R$ 31,50 | 0 | 0 |
| PASSENATI | 1 | 2 | R$ 19,96 | 0 | 0 |
| MARU | 1 | 2 | R$ 8,06 | 0 | 0 |
| SLT COM DE BIJUT | 1 | 1 | R$ 0,01 | 0 | 0 |

## MORTA — não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| REDENTORA | 18 | 19 | R$ 1.276,19 | 0 | 1 |
| IMPORTADOS | 10 | 142 | R$ 991,29 | 0 | 165 |
| ZULLU | 8 | 31 | R$ 815,30 | 0 | 16 |
| BELT-ME | 5 | 9 | R$ 801,60 | 0 | 3 |
| FAMOSA | 2 | 3 | R$ 104,70 | 0 | 1 |
| MISS FRANDY | 4 | 11 | R$ 81,76 | 0 | 6 |
| CHARME BIJUTERIAS | 1 | 27 | R$ 14,85 | 0 | 3 |
| SAFIRA | 1 | 1 | R$ 7,77 | 0 | 1 |
| TATTY BIJOUR | 1 | 1 | R$ 0,32 | 0 | 1 |

