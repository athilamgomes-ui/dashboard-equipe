# Estoque L4 · MissBeleza Altamira

Fonte: **Registro de Inventário** do ERP (Suprimentos → Relatórios → Registro de Inventário),
puxado em 27/08/2026 — é o relatório que valoriza o estoque, o mesmo que você usa.

Estoque declarado: **74.865 peças · R$ 780.785,07** em 274 marcas.

---

# Parte A — produtos com custo errado

**95 produtos · R$ 37.104,95** de valor que o sistema mostra e não existe.

Critério: custo maior que 3x o preço de venda. Margem apertada acontece; vender a menos
de um terço do custo, não.

| Tipo de conserto | Produtos | Valor | Quem resolve |
|---|---:|---:|---|
| fator de conversão | 6 | R$ 21.199,85 | quem dá entrada de NF (cadastro) |
| conferir a nota | 39 | R$ 12.043,40 | abrir a nota primeiro |
| sem movimento | 4 | R$ 973,08 | contagem física (ver parte B) |
| fator de conversão (qtd estimada) | 4 | R$ 958,10 | confirmar a quantidade, depois cadastrar |
| preço a conferir | 19 | R$ 950,30 | quem define preço |
| custo corrompido | 20 | R$ 929,79 | ajuste de custo no ERP |
| fator a confirmar | 3 | R$ 50,43 | abrir a nota primeiro |

> **A ordem importa:** fator de conversão antes do custo. Corrigindo só o custo, a
> próxima nota reintroduz o erro — a entrada continua lançando pacote como peça.

## KISS NEW YORK  ·  _ATIVA_

### 204099 — KISS NY NAVALHA SOBRANC CURTO (72 UN)

- Custo no inventário: **R$ 253,87** · preço: R$ 6,90 · saldo: 58 un · inflado: **R$ 14.724,46**
- Evidência: no nome: (72 UN) · comprou 1, vendeu 12 (razão 12x)
- **Conserto:** Cadastrar **fator de conversão = 72** (a quantidade está no nome). O custo unitário cai de R$ 253,87 para **R$ 3,53** — margem de 96% sobre o preço de R$ 6,90.
- Efeito: o estoque reduz R$ 14.519,95 (correção, não perda)

### 204098 — KISS NY NAVALHA SOBRANC LONGO (72 UN)

- Custo no inventário: **R$ 253,87** · preço: R$ 6,90 · saldo: 25 un · inflado: **R$ 6.346,75**
- Evidência: no nome: (72 UN) · comprou 1, vendeu 38 (razão 38x)
- **Conserto:** Cadastrar **fator de conversão = 72** (a quantidade está no nome). O custo unitário cai de R$ 253,87 para **R$ 3,53** — margem de 96% sobre o preço de R$ 6,90.
- Efeito: o estoque reduz R$ 6.258,60 (correção, não perda)

### 28367 — KISS NY PINCA PONTA FINA

- Custo no inventário: **R$ 2,33** · preço: R$ 0,08 · saldo: 10 un · inflado: **R$ 23,30**
- Evidência: comprou 1, vendeu 292 (razão 292x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~292 peças** — **confirmar na nota antes de gravar**. Com 292, o custo cai de R$ 2,33 para R$ 0,01, margem de 903% sobre R$ 0,08.
- Efeito: o estoque reduz R$ 23,22 (correção, não perda)

## HUNKY MODAS  ·  _MORTA_

### 78497 — KIT 5 ELASTICO ELA-188

- Custo no inventário: **R$ 32,00** · preço: R$ 10,20 · saldo: 22 un · inflado: **R$ 704,00**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78504 — KIT 5 ELASTICO ELA-189

- Custo no inventário: **R$ 21,60** · preço: R$ 6,90 · saldo: 10 un · inflado: **R$ 216,00**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78499 — KIT 2 ELASTICO ELA-186

- Custo no inventário: **R$ 30,00** · preço: R$ 7,60 · saldo: 7 un · inflado: **R$ 210,00**
- Evidência: custo 3,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78503 — KIT 5 ELASTICO ELA-190

- Custo no inventário: **R$ 21,60** · preço: R$ 4,50 · saldo: 9 un · inflado: **R$ 194,40**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78496 — KIT 5 ELASTICO ELA-185

- Custo no inventário: **R$ 17,40** · preço: R$ 3,90 · saldo: 10 un · inflado: **R$ 174,00**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 28816 — BICO DE PATO BI-071

- Custo no inventário: **R$ 54,86** · preço: R$ 14,19 · saldo: 2 un · inflado: **R$ 109,72**
- Evidência: custo 3,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78498 — KIT 2 ELASTICO ELA-187

- Custo no inventário: **R$ 30,00** · preço: R$ 7,80 · saldo: 3 un · inflado: **R$ 90,00**
- Evidência: custo 3,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## PHD BIJOUTERIAS  ·  _MORTA_

### 62458 — BRINCO DE METAL PHD

- Custo no inventário: **R$ 127,50** · preço: R$ 30,90 · saldo: 10 un · inflado: **R$ 1.275,00**
- Evidência: custo 4,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## JC BIJUTERIAS  ·  _MORTA_

### 42519 — FAIXA BANANA JC IMPORT

- Custo no inventário: **R$ 118,80** · preço: R$ 24,90 · saldo: 10 un · inflado: **R$ 1.188,00**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## OTIMO BIJUTERIAS  ·  _ENCALHADA_

### 78 — TIARA

- Custo no inventário: **R$ 74,44** · preço: R$ 3,90 · saldo: 12 un · inflado: **R$ 893,28**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 56199 — ELASTICO 5

- Custo no inventário: **R$ 11,00** · preço: R$ 0,50 · saldo: 6 un · inflado: **R$ 66,00**
- Evidência: preço de R$ 0,50 com custo de R$ 11,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 75680 — KIT ESPONJA

- Custo no inventário: **R$ 8,00** · preço: R$ 1,33 · saldo: 7 un · inflado: **R$ 56,00**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 1378 — COLAR

- Custo no inventário: **R$ 11,25** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 33,75**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 1363 — COLAR

- Custo no inventário: **R$ 10,85** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 32,55**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 5015 — BRINCO

- Custo no inventário: **R$ 5,75** · preço: R$ 0,02 · saldo: 4 un · inflado: **R$ 23,00**
- Evidência: preço de R$ 0,02 com custo de R$ 5,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1312 — LAÇO PDD OTIMOS

- Custo no inventário: **R$ 3,87** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 7,74**
- Evidência: preço de R$ 0,02 com custo de R$ 3,87
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 45940 — RABICO

- Custo no inventário: **R$ 1,70** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 5,10**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 1,70 ÷ 5 = R$ 0,34, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 62659 — PEDRA DE JADE ROLO

- Custo no inventário: **R$ 3,08** · preço: R$ 0,58 · saldo: 1 un · inflado: **R$ 3,08**
- Evidência: o nome diz 'ROLO' mas não diz quantas peças
- **Conserto:** **Abrir a nota** e ver quantas peças vêm no ROLO.

### 77081 — PIRANHA PARA CABELO

- Custo no inventário: **R$ 0,30** · preço: R$ 0,05 · saldo: 10 un · inflado: **R$ 3,00**
- Evidência: preço de R$ 0,05 com custo de R$ 0,30
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1381 — COLAR

- Custo no inventário: **R$ 1,87** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 1,87**
- Evidência: preço de R$ 0,01 com custo de R$ 1,87
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## RED FLAMINGO  ·  _MORTA_

### 61039 — BOLSA FEMININA TIPO TIRACOLO RED FLAMINGO

- Custo no inventário: **R$ 95,00** · preço: R$ 30,46 · saldo: 10 un · inflado: **R$ 950,00**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## DAFU  ·  _ENCALHADA_

### 27426 — ORNAMENTO PARA CABELO (PRESILHA) DE METAL

- Custo no inventário: **R$ 76,50** · preço: R$ 10,00 · saldo: 11 un · inflado: **R$ 841,50**
- Evidência: custo 7,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 52751 — ORNAMENTO PARA CABELO (PRESILHA) DE METAL

- Custo no inventário: **R$ 2,50** · preço: R$ 0,02 · saldo: 4 un · inflado: **R$ 10,00**
- Evidência: preço de R$ 0,02 com custo de R$ 2,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## IMPORTADOS  ·  _ENCALHADA_

### 57001 — LANTERNA DAFU

- Custo no inventário: **R$ 72,00** · preço: R$ 12,78 · saldo: 10 un · inflado: **R$ 720,00**
- Evidência: custo 5,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 43842 — SACOLA CASA DA BELEZA 60X70

- Custo no inventário: **R$ 0,60** · preço: R$ 0,01 · saldo: 100 un · inflado: **R$ 60,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,60
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## CHARME BIJUTERIAS  ·  _ENCALHADA_

### 59309 — TIARA FLOR CHARME BIJU

- Custo no inventário: **R$ 74,00** · preço: R$ 18,91 · saldo: 10 un · inflado: **R$ 740,00**
- Evidência: custo 3,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## MIRRAS  ·  _ATIVA_

### 78095 — CREME AMACIANTE DE CUTICULAS REMOVE MAIS 80GR

- Custo no inventário: **R$ 61,50** · preço: R$ 10,90 · saldo: 11 un · inflado: **R$ 676,50**
- Evidência: comprou 2, vendeu 14 (razão 7x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~7 peças** — **confirmar na nota antes de gravar**. Com 7, o custo cai de R$ 61,50 para R$ 8,79, margem de 24% sobre R$ 10,90.
- Efeito: o estoque reduz R$ 579,86 (correção, não perda)

## SEM MARCA  ·  _ENCALHADA_

### 17321 — BRINDES CADIVEU

- Custo no inventário: **R$ 1,96** · preço: R$ 0,01 · saldo: 204 un · inflado: **R$ 399,84**
- Evidência: preço de R$ 0,01 com custo de R$ 1,96
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 9395 — PIR METAL PP0109

- Custo no inventário: **R$ 12,67** · preço: R$ 3,90 · saldo: 10 un · inflado: **R$ 126,70**
- Evidência: custo 3,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 10769 — CHICL BIG BIG

- Custo no inventário: **R$ 4,75** · preço: R$ 0,10 · saldo: 25 un · inflado: **R$ 118,75**
- Evidência: preço de R$ 0,10 com custo de R$ 4,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 17698 — FOLDER UNIQ ONE

- Custo no inventário: **R$ 0,74** · preço: R$ 0,01 · saldo: 25 un · inflado: **R$ 18,50**
- Evidência: preço de R$ 0,01 com custo de R$ 0,74
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## GULOSEIMAS  ·  _MORTA_

### 57006 — CHICLETE TRIDENT

- Custo no inventário: **R$ 62,58** · preço: R$ 2,00 · saldo: 10 un · inflado: **R$ 625,80**
- Evidência: custo 31,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## CBB  ·  _ENCALHADA_

### 204057 — SABONETE INTIMO ERVA DOCE 200ML Lt FSC300126

- Custo no inventário: **R$ 47,76** · preço: R$ 9,90 · saldo: 13 un · inflado: **R$ 620,88**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## REAL LOVE  ·  _ENCALHADA_

### 29649 — CARIMBO PARA DECORACAO DE UNHAS

- Custo no inventário: **R$ 43,20** · preço: R$ 9,90 · saldo: 10 un · inflado: **R$ 432,00**
- Evidência: custo 4,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 42775 — PINCEL PARA UNHA - CARTELA COM 8 PECAS

- Custo no inventário: **R$ 42,25** · preço: R$ 2,00 · saldo: 1 un · inflado: **R$ 42,25**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 42,25 ÷ 5 = R$ 8,45, que ainda passa do preço de R$ 2,00. **Abrir a nota** e ver a unidade.

### 346 — PIN-Q-08 CONJUNTO (1 PORTA PINCEL DE MAQUIAGEM ,ESPELHO E PINCEL DE MAQUIAGEM)

- Custo no inventário: **R$ 18,00** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 36,00**
- Evidência: custo é 1.800x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 14919 — TOP COAT BLINDADO REAL LOVE

- Custo no inventário: **R$ 11,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 11,00**
- Evidência: custo é 1.100x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## SANTA CLARA  ·  _ATIVA_

### 7628 — LIXA PE RALIXA 284 SANTA CLARA

- Custo no inventário: **R$ 20,32** · preço: R$ 3,20 · saldo: 10 un · inflado: **R$ 203,20**
- Evidência: comprou 13, vendeu 85 (razão 7x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~7 peças** — **confirmar na nota antes de gravar**. Com 7, o custo cai de R$ 20,32 para R$ 2,90, margem de 10% sobre R$ 3,20.
- Efeito: o estoque reduz R$ 174,17 (correção, não perda)

### 78766 — ESPATULA DUPLA PRATA 180G C/25

- Custo no inventário: **R$ 7,03** · preço: R$ 1,90 · saldo: 8 un · inflado: **R$ 56,24**
- Evidência: no nome: C/25
- **Conserto:** Cadastrar **fator de conversão = 25** (a quantidade está no nome). O custo unitário cai de R$ 7,03 para **R$ 0,28** — margem de 576% sobre o preço de R$ 1,90.
- Efeito: o estoque reduz R$ 53,99 (correção, não perda)

### 5519 — PO ADGISTRENTE SANTA CLARA 20G

- Custo no inventário: **R$ 5,51** · preço: R$ 0,92 · saldo: 10 un · inflado: **R$ 55,10**
- Evidência: comprou 4, vendeu 48 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** — **confirmar na nota antes de gravar**. Com 12, o custo cai de R$ 5,51 para R$ 0,46, margem de 100% sobre R$ 0,92.
- Efeito: o estoque reduz R$ 50,51 (correção, não perda)

### 204359 — ESCOVA LRJ/VR.N.FLEX COLOR

- Custo no inventário: **R$ 12,36** · preço: R$ 1,06 · saldo: 3 un · inflado: **R$ 37,08**
- Evidência: custo 11,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 204360 — NAVALHETE PLASTICA CABO MARROM - SANTA CLARA

- Custo no inventário: **R$ 8,82** · preço: R$ 1,06 · saldo: 4 un · inflado: **R$ 35,28**
- Evidência: custo 8,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 8637 — LENCOL DESC ST CLARA 15UN

- Custo no inventário: **R$ 15,80** · preço: R$ 2,10 · saldo: 2 un · inflado: **R$ 31,60**
- Evidência: no nome: 15 UN
- **Conserto:** Cadastrar **fator de conversão = 15** (a quantidade está no nome). O custo unitário cai de R$ 15,80 para **R$ 1,05** — margem de 99% sobre o preço de R$ 2,10.
- Efeito: o estoque reduz R$ 29,49 (correção, não perda)

### 8036 — REFIL LIXA 12UN 753/754 S CLARA 2118

- Custo no inventário: **R$ 3,08** · preço: R$ 0,50 · saldo: 10 un · inflado: **R$ 30,80**
- Evidência: no nome: 12 UN
- **Conserto:** Cadastrar **fator de conversão = 12** (a quantidade está no nome). O custo unitário cai de R$ 3,08 para **R$ 0,26** — margem de 95% sobre o preço de R$ 0,50.
- Efeito: o estoque reduz R$ 28,23 (correção, não perda)

### 48793 — LIXA MINI PRETA P/UNHAS C/20

- Custo no inventário: **R$ 1,00** · preço: R$ 0,10 · saldo: 10 un · inflado: **R$ 10,00**
- Evidência: no nome: C/20
- **Conserto:** Cadastrar **fator de conversão = 20** (a quantidade está no nome). O custo unitário cai de R$ 1,00 para **R$ 0,05** — margem de 100% sobre o preço de R$ 0,10.
- Efeito: o estoque reduz R$ 9,50 (correção, não perda)

## JAPINHA  ·  _ATIVA_

### 16988 — KIT SHAMPOO DETOX / ATIVO REDUTOR DE QUIABO JAPINHA 1LT

- Custo no inventário: **R$ 59,51** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 357,06**
- Evidência: custo é 5.951x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 9115 — BOTOX OJON JAPINHA 300G

- Custo no inventário: **R$ 14,34** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 57,36**
- Evidência: custo é 1.434x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 9116 — BOTOX OJOIN JAPINHA 1KG

- Custo no inventário: **R$ 32,36** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 32,36**
- Evidência: custo é 3.236x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 40898 — AMPOLA DE HIDRATACAO OLEO ESSENCIAL JAPINHA 15ml

- Custo no inventário: **R$ 6,25** · preço: R$ 1,33 · saldo: 2 un · inflado: **R$ 12,50**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## BIC  ·  _MORTA_

### 60549 — AP BARB BIC COMFORT NORMAL

- Custo no inventário: **R$ 39,87** · preço: R$ 6,00 · saldo: 10 un · inflado: **R$ 398,70**
- Evidência: custo 6,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## LABOTRAT  ·  _ATIVA_

### 203778 — CREME DE PARAFINA ATIVADORA BETERRABA E BURITI VAI&BRILHA 20G LABOTRAT

- Custo no inventário: **R$ 28,12** · preço: R$ 7,90 · saldo: 14 un · inflado: **R$ 393,68**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## MACRILAN  ·  _MORTA_

### 202309 — TRIO DE ESPONJAS MACRILAN

- Custo no inventário: **R$ 98,12** · preço: R$ 16,34 · saldo: 2 un · inflado: **R$ 196,24**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78341 — KIT COM 5 PINCEIS E 3 PULSEIRA MACRILAN

- Custo no inventário: **R$ 41,17** · preço: R$ 6,49 · saldo: 2 un · inflado: **R$ 82,34**
- Evidência: custo 6,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78355 — ESPONJA GOTA PARA MAQUIAGEM - MACRILAN

- Custo no inventário: **R$ 4,36** · preço: R$ 0,72 · saldo: 4 un · inflado: **R$ 17,44**
- Evidência: preço de R$ 0,72 com custo de R$ 4,36
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 78362 — ESPONJA GOTA CHANFRADA P/ MAQUIAGEM - MACRILAN

- Custo no inventário: **R$ 4,36** · preço: R$ 0,73 · saldo: 3 un · inflado: **R$ 13,08**
- Evidência: preço de R$ 0,73 com custo de R$ 4,36
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## GAMA  ·  _ATIVA_

### 49539 — ESCOVA ROTATIVA GA.MA ELEGANZA PLUS - BIVOLT

- Custo no inventário: **R$ 141,81** · preço: R$ 44,00 · saldo: 2 un · inflado: **R$ 283,62**
- Evidência: custo 3,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## LUXOS  ·  _MORTA_

### 10890 — EMBALAGEMS

- Custo no inventário: **R$ 25,00** · preço: R$ 3,90 · saldo: 10 un · inflado: **R$ 250,00**
- Evidência: custo 6,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## BETTER LIFE  ·  _ENCALHADA_

### 30864 — PRE TREINO POWER CAPS 60 CAPSULAS

- Custo no inventário: **R$ 53,60** · preço: R$ 16,50 · saldo: 4 un · inflado: **R$ 214,40**
- Evidência: custo 3,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## ESCOBEL  ·  _MORTA_

### 49564 — ESC PROF BASE CERAMICA REF 847 ROSA 20 MM C/01 DZ

- Custo no inventário: **R$ 20,84** · preço: R$ 3,58 · saldo: 10 un · inflado: **R$ 208,40**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## IMPALA  ·  _ATIVA_

### 18015 — OLEO PARA CUTICULAS IMPALA TRATAMENTO

- Custo no inventário: **R$ 2,89** · preço: R$ 0,01 · saldo: 12 un · inflado: **R$ 34,68**
- Evidência: preço de R$ 0,01 com custo de R$ 2,89
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 18012 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO CARTAS NA MANGA

- Custo no inventário: **R$ 3,36** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 20,16**
- Evidência: custo é 336x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 18010 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO XEQUE - MATE

- Custo no inventário: **R$ 3,36** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 20,16**
- Evidência: custo é 336x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 18014 — ESMALTE IMPALA A COR DA MODA CREMOSO INTUICAO

- Custo no inventário: **R$ 2,89** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 17,34**
- Evidência: preço de R$ 0,01 com custo de R$ 2,89
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 18008 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO APOSTA ALTA IMPALA

- Custo no inventário: **R$ 3,36** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 16,80**
- Evidência: custo é 336x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 18007 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO ESCOLHA SEU LADO IMPALA

- Custo no inventário: **R$ 3,36** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 16,80**
- Evidência: custo é 336x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 18004 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO PLOT TWIST IMPALA

- Custo no inventário: **R$ 3,36** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 16,80**
- Evidência: custo é 336x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 53127 — REMOVEDOR DE ESMALTE COM ACETONA TIRESMALT ORIGINAL 100ml

- Custo no inventário: **R$ 3,16** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 15,80**
- Evidência: custo é 316x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 18011 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO SORTE LANCADA

- Custo no inventário: **R$ 3,36** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 13,44**
- Evidência: custo é 336x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 18013 — ESMALTE IMPALA JU PAES VIRANDO O JOGO SUAVE COBERTURA REGRAS DO JOGO

- Custo no inventário: **R$ 3,36** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 13,44**
- Evidência: custo é 336x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## ZGY  ·  _MORTA_

### 847 — BRINCO CONCHA DOURADA E PRATA 6 - ZGY

- Custo no inventário: **R$ 21,47** · preço: R$ 4,96 · saldo: 4 un · inflado: **R$ 85,88**
- Evidência: custo 4,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 2083 — BRINCO DETALHES PEQUENO

- Custo no inventário: **R$ 7,00** · preço: R$ 0,02 · saldo: 7 un · inflado: **R$ 49,00**
- Evidência: custo é 350x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 1344 — PRESILHA COM 3

- Custo no inventário: **R$ 4,50** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 13,50**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 11440 — COLAR COM PIGENTE

- Custo no inventário: **R$ 8,33** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 8,33**
- Evidência: custo é 833x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 3455 — ARGOLA AÇO INOXIDAVEL

- Custo no inventário: **R$ 4,00** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 8,00**
- Evidência: preço de R$ 0,02 com custo de R$ 4,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1356 — PIRANHA GRANDE PLASTICO

- Custo no inventário: **R$ 6,66** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 6,66**
- Evidência: custo é 333x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 15743 — PIRANHA FOLHA COM PEDRARIA

- Custo no inventário: **R$ 6,00** · preço: R$ 0,90 · saldo: 1 un · inflado: **R$ 6,00**
- Evidência: preço de R$ 0,90 com custo de R$ 6,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## JONALISSA BIJOUX LTDA  ·  _MORTA_

### 62792 — BRINCO ARGOLA COLORIDA

- Custo no inventário: **R$ 36,00** · preço: R$ 9,90 · saldo: 2 un · inflado: **R$ 72,00**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 62791 — BRINCO COLORIDO BR329-7

- Custo no inventário: **R$ 42,00** · preço: R$ 10,90 · saldo: 1 un · inflado: **R$ 42,00**
- Evidência: custo 3,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 7891 — PENTE PLASTICO LARGO

- Custo no inventário: **R$ 16,20** · preço: R$ 3,00 · saldo: 2 un · inflado: **R$ 32,40**
- Evidência: custo 5,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## MEY BRASIL COMERCIAL  ·  _SAINDO_

### 55935 — ORNAMENTO PARA CABELO (ANEL PARA DREADS DE METAL)

- Custo no inventário: **R$ 40,00** · preço: R$ 1,00 · saldo: 3 un · inflado: **R$ 120,00**
- Evidência: custo 40,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## TUCA  ·  _MORTA_

### 7396 — PIRANHA TUCA CABELO XX57

- Custo no inventário: **R$ 11,00** · preço: R$ 0,75 · saldo: 10 un · inflado: **R$ 110,00**
- Evidência: preço de R$ 0,75 com custo de R$ 11,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## DAGUA NATURAL  ·  _ATIVA_

### 78391 — ESFOLIANTE NEUTRO FORTE ABRASAO 300G - D'AGUA NATURAL

- Custo no inventário: **R$ 20,51** · preço: R$ 1,42 · saldo: 5 un · inflado: **R$ 102,55**
- Evidência: custo 14,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## NATHYDRAS  ·  _ATIVA_

### 45512 — REPARADOR DE PONTAS ALHO 30ML

- Custo no inventário: **R$ 12,49** · preço: R$ 0,01 · saldo: 8 un · inflado: **R$ 99,92**
- Evidência: custo é 1.249x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 12191 — MODELADOR DE CACHOS

- Custo no inventário: **R$ 0,66** · preço: R$ 0,04 · saldo: 1 un · inflado: **R$ 0,66**
- Evidência: preço de R$ 0,04 com custo de R$ 0,66
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## BANA BANA  ·  _ENCALHADA_

### 30784 — BOMBOM

- Custo no inventário: **R$ 25,00** · preço: R$ 1,00 · saldo: 4 un · inflado: **R$ 100,00**
- Evidência: custo 25,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## ANTONIO BANDERAS  ·  _ENCALHADA_

### 54877 — AVENTAL 30 ANOS - Lote: 4057090825

- Custo no inventário: **R$ 32,30** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 96,90**
- Evidência: custo é 3.230x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## NOVO TOQUE  ·  _SAINDO_

### 61696 — PROTAGONISTA GLITTER 8ML

- Custo no inventário: **R$ 23,40** · preço: R$ 4,90 · saldo: 2 un · inflado: **R$ 46,80**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## ITALLIAN HAIR  ·  _ATIVA_

### 49877 — MEDI ITALLIAN 100ML COM BICO 400130

- Custo no inventário: **R$ 1,72** · preço: R$ 0,01 · saldo: 20 un · inflado: **R$ 34,40**
- Evidência: preço de R$ 0,01 com custo de R$ 1,72
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 8511 — COLORACAO IC SEM AMONIA 0.20 INTENSIFICADOR PURPLE 60G

- Custo no inventário: **R$ 7,06** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 7,06**
- Evidência: custo é 706x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## APSE  ·  _ATIVA_

### 17320 — CREME APICE 80G

- Custo no inventário: **R$ 5,79** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 34,74**
- Evidência: custo é 579x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## RUBY ROSE  ·  _ENCALHADA_

### 65568 — RR-853/1 PO FACIAL COMPACTO MELU RUBY ROSE RR-853-1

- Custo no inventário: **R$ 8,36** · preço: R$ 1,78 · saldo: 4 un · inflado: **R$ 33,44**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## BEAUTY COLOR  ·  _ATIVA_

### 56034 — LEAVE IN ATV ACIDO HIAL HYALUR LIGHT CR SOULPOWER PRO 315ML

- Custo no inventário: **R$ 22,09** · preço: R$ 2,76 · saldo: 1 un · inflado: **R$ 22,09**
- Evidência: custo 8,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


---

# Parte B — que marcas ainda existem na loja

Medido por entrada e venda desde 01/01/2023. Marca com saldo e nenhum movimento em três
anos e meio quase certamente não está na prateleira — é saldo que ficou no sistema.

| Situação | Marcas | Peças | Valor | O que significa |
|---|---:|---:|---:|---|
| **FANTASMA** | 6 | 120 | R$ 4.124,08 | saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja |
| **MORTA** | 104 | 10.578 | R$ 226.063,71 | não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual |
| **SAINDO** | 21 | 2.346 | R$ 27.383,71 | não se compra mais, mas ainda gira |
| **ENCALHADA** | 63 | 34.980 | R$ 180.270,76 | ainda se compra, mas o saldo dá mais de 3 anos |
| **ATIVA** | 80 | 26.841 | R$ 342.942,81 | compra e gira |

## FANTASMA — saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| AN BOLSAS | 6 | 60 | R$ 2.270,00 | 0 | 0 |
| BABYLISS | 3 | 3 | R$ 1.509,36 | 0 | 0 |
| TUON COSMETICOS | 3 | 3 | R$ 166,28 | 0 | 0 |
| SLT COM DE BIJUT | 1 | 2 | R$ 135,24 | 0 | 0 |
| ACRI ARTE | 5 | 50 | R$ 40,10 | 0 | 0 |
| LUISANCE | 1 | 2 | R$ 3,10 | 0 | 0 |

## MORTA — não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| KEUNE | 31 | 301 | R$ 24.489,50 | 0 | 238 |
| TERRA SANTA | 2 | 20 | R$ 19.405,50 | 0 | 2 |
| PHD BIJOUTERIAS | 139 | 1.376 | R$ 17.343,01 | 0 | 546 |
| TECHNOS | 6 | 60 | R$ 16.320,00 | 0 | 2 |
| HUNKY MODAS | 169 | 1.291 | R$ 12.423,24 | 0 | 1.254 |
| RED FLAMINGO | 16 | 160 | R$ 11.650,00 | 0 | 22 |
| NIELY | 26 | 247 | R$ 7.535,60 | 0 | 41 |
| SOLING | 23 | 196 | R$ 6.937,26 | 0 | 185 |
| CRUZEIRO MALAS | 3 | 30 | R$ 5.653,90 | 0 | 3 |
| JONALISSA BIJOUX LTDA | 50 | 363 | R$ 5.348,13 | 0 | 376 |
| MACRILAN | 80 | 594 | R$ 4.902,14 | 0 | 568 |
| MAKE ON E | 56 | 405 | R$ 4.852,28 | 0 | 253 |
| ZGY | 103 | 912 | R$ 4.438,19 | 0 | 237 |
| REVLON | 6 | 60 | R$ 4.147,50 | 0 | 18 |
| VOLIA | 9 | 90 | R$ 4.056,00 | 0 | 58 |
| TRACTA | 36 | 360 | R$ 3.838,10 | 0 | 1 |
| DAYMAKEUP | 15 | 141 | R$ 3.797,85 | 0 | 24 |
| MALA CRUZEIRO | 1 | 10 | R$ 3.103,20 | 0 | 1 |
| CELINA MINI BIJUTERIAS | 12 | 95 | R$ 2.982,40 | 0 | 78 |
| BRAÉ | 19 | 44 | R$ 2.979,91 | 0 | 52 |
| OCEANE | 14 | 118 | R$ 2.834,31 | 0 | 36 |
| M/Q | 1 | 10 | R$ 2.631,00 | 0 | 2 |
| ZARTTE | 6 | 60 | R$ 2.548,00 | 0 | 6 |
| SAFIRA | 32 | 311 | R$ 2.477,60 | 0 | 57 |
| WAHL | 8 | 31 | R$ 2.419,08 | 0 | 7 |
| CHEN YUMEI | 29 | 230 | R$ 2.258,10 | 0 | 114 |
| SENSCIENCE | 5 | 17 | R$ 2.182,05 | 0 | 17 |
| NITZY | 12 | 120 | R$ 2.125,00 | 0 | 18 |
| ESTILO DA MULHER | 39 | 257 | R$ 2.070,08 | 0 | 173 |
| BAG BRANDS | 2 | 20 | R$ 1.970,00 | 0 | 2 |
| NOVEX | 12 | 102 | R$ 1.952,36 | 0 | 64 |
| CAMILA PEDRAZOLI | 7 | 70 | R$ 1.771,10 | 0 | 7 |
| TAIFF | 3 | 6 | R$ 1.673,73 | 0 | 1 |
| ANASOL | 7 | 45 | R$ 1.587,16 | 0 | 17 |
| JC BIJUTERIAS | 2 | 20 | R$ 1.587,00 | 0 | 2 |
| REDENTORA | 13 | 22 | R$ 1.514,48 | 0 | 2 |
| ONDULEZE | 8 | 80 | R$ 1.508,60 | 0 | 57 |
| KIZZEN | 13 | 28 | R$ 1.389,19 | 0 | 15 |
| MISS FRANDY | 11 | 110 | R$ 1.236,00 | 0 | 77 |
| ESCOBEL | 6 | 60 | R$ 1.231,40 | 0 | 8 |
| COR&TON | 13 | 130 | R$ 1.168,70 | 0 | 40 |
| VOGUE | 1 | 10 | R$ 1.102,00 | 0 | 1 |
| AMAZON BEAUTY | 7 | 39 | R$ 1.095,51 | 0 | 41 |
| ANA HICKMANN | 1 | 10 | R$ 1.090,00 | 0 | 1 |
| 7LOBOS IMPORTADORA | 6 | 60 | R$ 1.074,90 | 0 | 16 |
| AMIGOLD | 4 | 32 | R$ 1.002,44 | 0 | 25 |
| MAX LOVE | 18 | 127 | R$ 878,87 | 0 | 120 |
| KING BOLSAS | 4 | 12 | R$ 775,00 | 0 | 14 |
| NAIL QUEEN | 3 | 29 | R$ 735,10 | 0 | 4 |
| LUCKSTAR | 8 | 76 | R$ 633,80 | 0 | 59 |
| GULOSEIMAS | 1 | 10 | R$ 625,80 | 0 | 2 |
| NEW BEAUTY | 5 | 32 | R$ 613,64 | 0 | 10 |
| MISS BELEZA | 7 | 61 | R$ 607,45 | 0 | 30 |
| FREDERIKA MAKE | 13 | 53 | R$ 581,68 | 0 | 57 |
| TUCA | 8 | 44 | R$ 573,05 | 0 | 21 |
| DAILUS | 21 | 87 | R$ 522,53 | 0 | 80 |
| RIO OCEAN | 4 | 31 | R$ 512,90 | 0 | 4 |
| MARIMARIA | 14 | 36 | R$ 512,80 | 0 | 29 |
| KRIAT IMPORT E  EXPORT | 10 | 100 | R$ 456,00 | 0 | 48 |
| FOREVER LISS | 2 | 20 | R$ 402,60 | 0 | 15 |
| BIC | 1 | 10 | R$ 398,70 | 0 | 1 |
| SKALA | 7 | 70 | R$ 398,30 | 0 | 71 |
| BELT-ME | 2 | 12 | R$ 394,94 | 0 | 2 |
| ANITA | 8 | 80 | R$ 376,00 | 0 | 41 |
| GOTA DOURADA | 5 | 31 | R$ 361,15 | 0 | 36 |
| VISAGE | 4 | 40 | R$ 322,50 | 0 | 15 |
| MUY BIELA | 1 | 10 | R$ 297,00 | 0 | 3 |
| KERANZA | 1 | 10 | R$ 253,00 | 0 | 1 |
| LUXOS | 1 | 10 | R$ 250,00 | 0 | 5 |
| DILCINTIA BEAUTY | 5 | 36 | R$ 242,50 | 0 | 13 |
| LEO BIJUTERIAS E ACESSORIOS | 3 | 30 | R$ 240,00 | 0 | 4 |
| CISNE | 1 | 10 | R$ 235,60 | 0 | 1 |
| EMBELEZE | 1 | 10 | R$ 219,00 | 0 | 1 |
| GT & FR | 3 | 30 | R$ 203,00 | 0 | 6 |
| JC IMPORT | 5 | 50 | R$ 195,00 | 0 | 11 |
| ZURIQUE COMERCIAL E VRIEDADES | 11 | 91 | R$ 166,55 | 0 | 29 |
| TOP BEAUTY | 4 | 40 | R$ 150,00 | 0 | 21 |
| LP IMPORTADOS | 2 | 20 | R$ 147,60 | 0 | 20 |
| BITARRA BEAUTY | 1 | 10 | R$ 143,60 | 0 | 2 |
| ZANPHY | 1 | 9 | R$ 135,00 | 0 | 1 |
| BEM MENINNINHA | 1 | 10 | R$ 131,50 | 0 | 1 |
| KERT | 1 | 9 | R$ 105,75 | 0 | 3 |
| BIJOUX | 2 | 13 | R$ 98,98 | 0 | 1 |
| LE VANGEE | 1 | 10 | R$ 87,40 | 0 | 2 |
| CINCO | 4 | 27 | R$ 80,20 | 0 | 32 |
| D.KA COSMETICOS | 1 | 10 | R$ 75,00 | 0 | 1 |
| MINU COMERCIO | 1 | 10 | R$ 65,00 | 0 | 2 |
| BOCA ROSA BEAUTY | 1 | 2 | R$ 60,60 | 0 | 1 |
| MEU MEU BIJOUTERIAS | 6 | 60 | R$ 28,80 | 0 | 13 |
| MAHAV | 1 | 11 | R$ 27,06 | 0 | 3 |
| TATTY BIJOUR | 4 | 38 | R$ 17,60 | 0 | 23 |
| ELIANA SALLES | 1 | 10 | R$ 10,00 | 0 | 1 |
| CHAVEIRO | 1 | 10 | R$ 4,80 | 0 | 5 |
| AK ACESSORIOS | 1 | 2 | R$ 4,00 | 0 | 1 |
| ICEKISS | 5 | 182 | R$ 1,82 | 0 | 178 |
| BRILHARE | 2 | 20 | R$ 0,20 | 0 | 3 |
| FAMOSA | 1 | 10 | R$ 0,20 | 0 | 4 |
| ART METAL | 1 | 10 | R$ 0,10 | 0 | 2 |
| CHERIE | 1 | 10 | R$ 0,10 | 0 | 2 |
| CORPUS | 1 | 10 | R$ 0,10 | 0 | 6 |
| DIVERSOS | 1 | 10 | R$ 0,10 | 0 | 2 |
| EDEN COMERCIO | 1 | 10 | R$ 0,10 | 0 | 1 |
| SERGIO LUIS | 1 | 10 | R$ 0,10 | 0 | 1 |
| ROMA BRASIL | 1 | 4 | R$ 0,04 | 0 | 2 |

