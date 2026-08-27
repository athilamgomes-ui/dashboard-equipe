# Consertos de estoque — L3 · Casa da Beleza Itaituba

**103 produtos · R$ 77.615,85 de valor que o sistema mostra e não existe.**

Critério: custo médio maior que 3x o preço de venda, com saldo nesta loja. Margem apertada
acontece; vender a menos de um terço do custo, não — isso é dado errado, não negócio ruim.

Fonte: snapshot do pipeline de estoque (26/08) + histórico de compra/venda desde 2023.
Onde aparece ✅, o custo foi conferido lendo a nota de entrada no ERP.

## Resumo do que fazer

| Tipo de conserto | Produtos | Valor envolvido | Quem resolve |
|---|---:|---:|---|
| conferir a nota | 11 | R$ 39.609,39 | abrir a nota primeiro |
| fator a confirmar | 6 | R$ 14.725,96 | abrir a nota primeiro |
| fator de conversão | 3 | R$ 11.995,10 | quem dá entrada de NF (cadastro do produto) |
| saldo sem origem | 55 | R$ 7.512,01 | contagem física na loja |
| fator de conversão (qtd estimada) | 9 | R$ 2.593,14 | — |
| custo corrompido | 9 | R$ 881,50 | ajuste de custo no ERP |
| preço a conferir | 10 | R$ 298,75 | quem define preço |

> **A ordem importa:** corrigir o fator de conversão ANTES do custo. Se corrigir só o
> custo, a próxima nota daquele produto reintroduz o erro, porque a entrada continua
> lançando pacote como peça.

---

## PROBELLE PROFISSIONAL

_2 produto(s) · R$ 37.351,36_

### 20358 — AMP ARGAN PROBELLE 17 ML

- Custo no ERP: **R$ 81,40** · preço de venda: R$ 10,90 · saldo: 457 un · valor inflado: **R$ 37.199,80**
- Evidência: custo 7,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 75872 — PO DESCOLORANTE AMETISTA SACHE

- Custo no ERP: **R$ 75,78** · preço de venda: R$ 12,63 · saldo: 2 un · valor inflado: **R$ 151,56**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## SANTA CLARA

_8 produto(s) · R$ 19.801,68_

### 17665 — TOALHA COMP MULT DESC 250

- Custo no ERP: **R$ 37,40** · preço de venda: R$ 1,00 · saldo: 231 un · valor inflado: **R$ 8.639,40**
- Evidência: comprou 1, vendeu 17 (razão 17x) · ✅ NF 647502/1 — **1,00 CX** a R$ 71,75 (SANTA CLARA)
- **Conserto:** Parece embalagem de 17, mas R$ 37,40 ÷ 17 = R$ 2,20, que ainda passa do preço de R$ 1,00. **Abrir a nota** e ver a unidade.

### 156 — LIXA PRETA ESP ST CLARA UN

- Custo no ERP: **R$ 6,96** · preço de venda: R$ 0,25 · saldo: 864 un · valor inflado: **R$ 6.013,44**
- Evidência: comprou 7, vendeu 152 (razão 22x)
- **Conserto:** Parece embalagem de 22, mas R$ 6,96 ÷ 22 = R$ 0,32, que ainda passa do preço de R$ 0,25. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,25 também não se sustenta — conferir os dois, custo e preço.

### 13637 — CLIPS PLAST.CABELO POTE C/250

- Custo no ERP: **R$ 20,09** · preço de venda: R$ 0,50 · saldo: 196 un · valor inflado: **R$ 3.937,64**
- Evidência: no nome: C/250 · comprou 2, vendeu 304 (razão 152x)
- **Conserto:** Cadastrar **fator de conversão = 250** (está no nome do produto). O custo unitário cai de R$ 20,09 para **R$ 0,08** — margem de 522% sobre o preço de R$ 0,50.
- Efeito: o estoque desta loja reduz R$ 3.921,89 (correção, não perda)

### 12573 — LIXA POP CAN ST CLARA UN

- Custo no ERP: **R$ 5,38** · preço de venda: R$ 0,25 · saldo: 201 un · valor inflado: **R$ 1.081,38**
- Evidência: comprou 6, vendeu 5.153 (razão 859x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~859 peças** (estimativa: comprou 6, vendeu 5.153) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 859, o custo unitário cai de R$ 5,38 para R$ 0,01, margem de 3.892% sobre R$ 0,25.
- Efeito: o estoque desta loja reduz R$ 1.080,12 (correção, não perda)

### 5519 — PO ADGISTRENTE SANTA CLARA 20G

- Custo no ERP: **R$ 42,88** · preço de venda: R$ 0,92 · saldo: 2 un · valor inflado: **R$ 85,76**
- Evidência: preço de R$ 0,92 com custo de R$ 42,88
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 7098 — PAPEL DEP.10X16CM PERLON C/100

- Custo no ERP: **R$ 8,00** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 24,00**
- Evidência: no nome: C/100
- **Conserto:** Parece embalagem de 100, mas R$ 8,00 ÷ 100 = R$ 0,08, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois, custo e preço.

### 8637 — LENCOL DESC ST CLARA 15UN

- Custo no ERP: **R$ 14,46** · preço de venda: R$ 2,10 · saldo: 1 un · valor inflado: **R$ 14,46**
- Evidência: no nome: 15 UN
- **Conserto:** Cadastrar **fator de conversão = 15** (está no nome do produto). O custo unitário cai de R$ 14,46 para **R$ 0,96** — margem de 118% sobre o preço de R$ 2,10.
- Efeito: o estoque desta loja reduz R$ 13,50 (correção, não perda)

### 5034 — PAPEL DEP.10X16CM PERLON C/25

- Custo no ERP: **R$ 1,12** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 5,60**
- Evidência: no nome: C/25
- **Conserto:** Parece embalagem de 25, mas R$ 1,12 ÷ 25 = R$ 0,04, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois, custo e preço.


## NATHY

_1 produto(s) · R$ 8.043,00_

### 49395 — FD ALGODAO CARD HID NATHY 500G ROLO 20UN/FD

- Custo no ERP: **R$ 229,80** · preço de venda: R$ 31,90 · saldo: 35 un · valor inflado: **R$ 8.043,00**
- Evidência: no nome: 20UN por fardo · comprou 6, vendeu 105 (razão 18x)
- **Conserto:** Cadastrar **fator de conversão = 20** (está no nome do produto). O custo unitário cai de R$ 229,80 para **R$ 11,49** — margem de 178% sobre o preço de R$ 31,90.
- Efeito: o estoque desta loja reduz R$ 7.640,85 (correção, não perda)


## MACRILAN

_1 produto(s) · R$ 2.813,60_

### 202307 — KIT MADEMOISELLE MACRILAN

- Custo no ERP: **R$ 703,40** · preço de venda: R$ 122,10 · saldo: 4 un · valor inflado: **R$ 2.813,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## PHALLEBEUTY

_3 produto(s) · R$ 2.426,12_

### 64092 — STARGLOW PO BANANA PHALLEBEAUTY 10G

- Custo no ERP: **R$ 143,00** · preço de venda: R$ 13,00 · saldo: 7 un · valor inflado: **R$ 1.001,00**
- Evidência: comprou 1, vendeu 15 (razão 15x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~15 peças** (estimativa: comprou 1, vendeu 15) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 15, o custo unitário cai de R$ 143,00 para R$ 9,53, margem de 36% sobre R$ 13,00.
- Efeito: o estoque desta loja reduz R$ 934,27 (correção, não perda)

### 64091 — SERUM FACIAL ROSA MOSQUETA 30ML

- Custo no ERP: **R$ 66,00** · preço de venda: R$ 11,04 · saldo: 12 un · valor inflado: **R$ 792,00**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 64159 — MOUSSE MICELAR ANTI OLEOSIDADE 150ML PHALLEBEAUTY

- Custo no ERP: **R$ 158,28** · preço de venda: R$ 27,00 · saldo: 4 un · valor inflado: **R$ 633,12**
- Evidência: custo 5,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## ITALLIAN HAIR

_2 produto(s) · R$ 1.202,40_

### 204358 — KIT HOME CARE TRIVITT COM HIDRATACAO

- Custo no ERP: **R$ 10,53** · preço de venda: R$ 2,00 · saldo: 108 un · valor inflado: **R$ 1.137,24**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 40339 — CB CORRETOR AZUL ITALLIAN COLOR 60G

- Custo no ERP: **R$ 5,43** · preço de venda: R$ 0,01 · saldo: 12 un · valor inflado: **R$ 65,16**
- Evidência: custo é 543x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## MEY BRASIL

_2 produto(s) · R$ 1.164,00_

### 63669 — CILIOS POSTICOS 6D MEY BEAUTY

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 6,00 · saldo: 36 un · valor inflado: **R$ 1.080,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 63668 — CILIOS POSTICOS 5 PARES MEY BEAUTY

- Custo no ERP: **R$ 84,00** · preço de venda: R$ 1,33 · saldo: 1 un · valor inflado: **R$ 84,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## HELLO MINI

_5 produto(s) · R$ 599,60_

### 75651 — OY650-1 UNHA BAILARINA ALONGADA AUTOCOLANTE COM 24 UNHAS

- Custo no ERP: **R$ 28,80** · preço de venda: R$ 5,27 · saldo: 6 un · valor inflado: **R$ 172,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 75654 — OY650-15 UNHA BAILARINA ALONGADA AUTOCOLANTE COM 24 UNHAS

- Custo no ERP: **R$ 28,80** · preço de venda: R$ 5,27 · saldo: 5 un · valor inflado: **R$ 144,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 75655 — OY650-17 UNHA BAILARINA ALONGADA AUTOCOLANTE COM 24 UNHAS

- Custo no ERP: **R$ 28,80** · preço de venda: R$ 5,27 · saldo: 4 un · valor inflado: **R$ 115,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 75672 — PC401 8# PINCEL P/ ACRILICO CERDA NAILON

- Custo no ERP: **R$ 11,00** · preço de venda: R$ 1,83 · saldo: 10 un · valor inflado: **R$ 110,00**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 75652 — OY650-13 UNHA BAILARINA ALONGADA AUTOCOLANTE COM 24 UNHAS

- Custo no ERP: **R$ 28,80** · preço de venda: R$ 5,27 · saldo: 2 un · valor inflado: **R$ 57,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MISS FRANDY

_5 produto(s) · R$ 546,95_

### 55398 — CAIXA DE 12 GRADES COM DECORACAO PARA UNHAS ARTIST

- Custo no ERP: **R$ 56,25** · preço de venda: R$ 7,08 · saldo: 5 un · valor inflado: **R$ 281,25**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 45155 — PINCEL MAQUIAGEM PARA BLUSH MISS FRANDY

- Custo no ERP: **R$ 9,00** · preço de venda: R$ 2,08 · saldo: 18 un · valor inflado: **R$ 162,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 30875 — PLACA PARA COLA FIO A FIO MISS FRANDY

- Custo no ERP: **R$ 8,40** · preço de venda: R$ 0,74 · saldo: 7 un · valor inflado: **R$ 58,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 45144 — PINCEL MAQUIAGEM LINHA M.A

- Custo no ERP: **R$ 3,50** · preço de venda: R$ 0,67 · saldo: 11 un · valor inflado: **R$ 38,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42770 — PINCEL PARA MAQUIAGEM MISS FRANDY PM15-1212

- Custo no ERP: **R$ 3,20** · preço de venda: R$ 0,67 · saldo: 2 un · valor inflado: **R$ 6,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## JAPINHA

_4 produto(s) · R$ 490,34_

### 16988 — KIT SHAMPOO DETOX / ATIVO REDUTOR DE QUIABO JAPINHA 1LT

- Custo no ERP: **R$ 50,31** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 301,86**
- Evidência: custo é 5.031x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 9116 — BOTOX OJOIN JAPINHA 1KG

- Custo no ERP: **R$ 27,36** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 82,08**
- Evidência: custo é 2.736x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 9115 — BOTOX OJON JAPINHA 300G

- Custo no ERP: **R$ 12,13** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 60,65**
- Evidência: custo é 1.213x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 16945 — Kit Shampoo Detox / Ativo Redutor Organico  Japinha 120ml

- Custo no ERP: **R$ 15,25** · preço de venda: R$ 0,20 · saldo: 3 un · valor inflado: **R$ 45,75**
- Evidência: preço de R$ 0,20 com custo de R$ 15,25
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## OTIMO BIJUTERIAS

_14 produto(s) · R$ 483,32_

### 13964 — CILIOS 8308

- Custo no ERP: **R$ 20,00** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 100,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 4875 — SAIA CARNAVAL 2

- Custo no ERP: **R$ 12,29** · preço de venda: R$ 2,60 · saldo: 6 un · valor inflado: **R$ 73,74**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 16489 — SAIA CARNAVAL

- Custo no ERP: **R$ 13,06** · preço de venda: R$ 3,90 · saldo: 4 un · valor inflado: **R$ 52,24**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1378 — COLAR

- Custo no ERP: **R$ 12,96** · preço de venda: R$ 0,02 · saldo: 3 un · valor inflado: **R$ 38,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1363 — COLAR

- Custo no ERP: **R$ 12,48** · preço de venda: R$ 0,02 · saldo: 3 un · valor inflado: **R$ 37,44**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2571 — CILIOS OTIMOS

- Custo no ERP: **R$ 1,25** · preço de venda: R$ 0,02 · saldo: 28 un · valor inflado: **R$ 35,00**
- Evidência: comprou 4, vendeu 46 (razão 12x)
- **Conserto:** Parece embalagem de 12, mas R$ 1,25 ÷ 12 = R$ 0,10, que ainda passa do preço de R$ 0,02. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,02 também não se sustenta — conferir os dois, custo e preço.

### 13815 — PINCEL SKIN CARE

- Custo no ERP: **R$ 5,00** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 30,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 5015 — BRINCO

- Custo no ERP: **R$ 6,63** · preço de venda: R$ 0,02 · saldo: 4 un · valor inflado: **R$ 26,52**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1386 — PRESILHA

- Custo no ERP: **R$ 4,72** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 23,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 4602 — ESPELHO DE BOLSA OTIMO

- Custo no ERP: **R$ 6,53** · preço de venda: R$ 0,03 · saldo: 3 un · valor inflado: **R$ 19,59**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1312 — LAÇO PDD OTIMOS

- Custo no ERP: **R$ 3,46** · preço de venda: R$ 0,02 · saldo: 5 un · valor inflado: **R$ 17,30**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 5705 — CAIXINHA DE PRESENTE 12

- Custo no ERP: **R$ 2,75** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 13,75**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2685 — BRINCO

- Custo no ERP: **R$ 6,53** · preço de venda: R$ 1,15 · saldo: 2 un · valor inflado: **R$ 13,06**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 7742 — GRAMPO 6

- Custo no ERP: **R$ 0,55** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 2,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## DOMPEL

_1 produto(s) · R$ 380,00_

### 75339 — ESCOVA PIRULITO SUMMER 4023 DISP C/9 UN

- Custo no ERP: **R$ 95,00** · preço de venda: R$ 21,11 · saldo: 4 un · valor inflado: **R$ 380,00**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** (estimativa: comprou 1, vendeu 5) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 5, o custo unitário cai de R$ 95,00 para R$ 19,00, margem de 11% sobre R$ 21,11.
- Efeito: o estoque desta loja reduz R$ 304,00 (correção, não perda)


## YAMÁ

_1 produto(s) · R$ 373,05_

### 5267 — MINI KIT FASHION COLOR 9.1 YAMA

- Custo no ERP: **R$ 41,45** · preço de venda: R$ 10,90 · saldo: 9 un · valor inflado: **R$ 373,05**
- Evidência: custo 3,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## DAFU

_11 produto(s) · R$ 340,60_

### 76422 — UNHA

- Custo no ERP: **R$ 12,60** · preço de venda: R$ 2,24 · saldo: 6 un · valor inflado: **R$ 75,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76420 — UNHA

- Custo no ERP: **R$ 12,60** · preço de venda: R$ 2,24 · saldo: 5 un · valor inflado: **R$ 63,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64437 — DF-GT0725 ADESIVO DE UNHA

- Custo no ERP: **R$ 3,59** · preço de venda: R$ 0,68 · saldo: 12 un · valor inflado: **R$ 43,08**
- Evidência: preço de R$ 0,68 com custo de R$ 3,59
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 64431 — DF-CR033025 CILIOS

- Custo no ERP: **R$ 7,00** · preço de venda: R$ 1,17 · saldo: 6 un · valor inflado: **R$ 42,00**
- Evidência: comprou 4, vendeu 39 (razão 10x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~10 peças** (estimativa: comprou 4, vendeu 39) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 10, o custo unitário cai de R$ 7,00 para R$ 0,70, margem de 67% sobre R$ 1,17.
- Efeito: o estoque desta loja reduz R$ 37,80 (correção, não perda)

### 76443 — ADESIVO FACIAL

- Custo no ERP: **R$ 3,64** · preço de venda: R$ 0,69 · saldo: 9 un · valor inflado: **R$ 32,76**
- Evidência: comprou 2, vendeu 16 (razão 8x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~8 peças** (estimativa: comprou 2, vendeu 16) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 8, o custo unitário cai de R$ 3,64 para R$ 0,46, margem de 52% sobre R$ 0,69.
- Efeito: o estoque desta loja reduz R$ 28,66 (correção, não perda)

### 64448 — ORNAMENTO P/CABELO (FAIXA) - POLIESTER

- Custo no ERP: **R$ 9,80** · preço de venda: R$ 1,79 · saldo: 3 un · valor inflado: **R$ 29,40**
- Evidência: comprou 1, vendeu 9 (razão 9x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~9 peças** (estimativa: comprou 1, vendeu 9) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 9, o custo unitário cai de R$ 9,80 para R$ 1,09, margem de 64% sobre R$ 1,79.
- Efeito: o estoque desta loja reduz R$ 26,13 (correção, não perda)

### 76455 — KIT PINCEL

- Custo no ERP: **R$ 11,20** · preço de venda: R$ 1,87 · saldo: 2 un · valor inflado: **R$ 22,40**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 64456 — ESPONJA PARA MAQUIAGEM DF-EP100001

- Custo no ERP: **R$ 5,60** · preço de venda: R$ 0,93 · saldo: 2 un · valor inflado: **R$ 11,20**
- Evidência: comprou 1, vendeu 11 (razão 11x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~11 peças** (estimativa: comprou 1, vendeu 11) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 11, o custo unitário cai de R$ 5,60 para R$ 0,51, margem de 83% sobre R$ 0,93.
- Efeito: o estoque desta loja reduz R$ 10,18 (correção, não perda)

### 64458 — DF-UP35014 KIT PINCEL

- Custo no ERP: **R$ 9,80** · preço de venda: R$ 1,63 · saldo: 1 un · valor inflado: **R$ 9,80**
- Evidência: comprou 1, vendeu 12 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 1, vendeu 12) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 9,80 para R$ 0,82, margem de 100% sobre R$ 1,63.
- Efeito: o estoque desta loja reduz R$ 8,98 (correção, não perda)

### 27593 — OLEO HIDRATANTE DE CUTICULA - DAFU

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,58 · saldo: 1 un · valor inflado: **R$ 5,76**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64432 — DF-CR033026 CILIOS

- Custo no ERP: **R$ 5,60** · preço de venda: R$ 0,93 · saldo: 1 un · valor inflado: **R$ 5,60**
- Evidência: comprou 2, vendeu 23 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 2, vendeu 23) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 5,60 para R$ 0,47, margem de 99% sobre R$ 0,93.
- Efeito: o estoque desta loja reduz R$ 5,13 (correção, não perda)


## REAL LOVE

_20 produto(s) · R$ 314,53_

### 57839 — ESPONJA DE MAQUIAGEM

- Custo no ERP: **R$ 8,00** · preço de venda: R$ 0,01 · saldo: 8 un · valor inflado: **R$ 64,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14789 — CILIOS POSTICOS DE FIBRA DE TEREFTALATO DE POLIETILENO

- Custo no ERP: **R$ 5,31** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 53,10**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14796 — PINCEL PARA UNHA

- Custo no ERP: **R$ 5,38** · preço de venda: R$ 0,01 · saldo: 7 un · valor inflado: **R$ 37,66**
- Evidência: custo é 538x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 14795 — CILIOS POSTICOS DE FIBRA DETEREFTALA DE POLIETILENO

- Custo no ERP: **R$ 5,38** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 32,28**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14785 — OLEO DUO DE CUTICULAS DE ROSAS - PESSEGO

- Custo no ERP: **R$ 2,13** · preço de venda: R$ 0,01 · saldo: 11 un · valor inflado: **R$ 23,43**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14784 — COLA CILIOS/ UNHA POSTIÇO

- Custo no ERP: **R$ 2,13** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 12,78**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14793 — LAPIS P/ SOBRANCELHA

- Custo no ERP: **R$ 2,63** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 10,52**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 13535 — CONJ DECORACAO (4 GLITTER E 2 APLICADORES)

- Custo no ERP: **R$ 2,09** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 10,45**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14782 — KIT (1 NAVALHA P/ SOBRANCELHA E 1 REFIL DE LAMINA)

- Custo no ERP: **R$ 2,28** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 9,12**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 13617 — COLA P/ CILIOS BRANCA

- Custo no ERP: **R$ 2,95** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 8,85**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14781 — CANETA HIDRATANTE DE CUTICULAS PESSEGO - PACOTE

- Custo no ERP: **R$ 2,13** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 8,52**
- Evidência: o nome diz 'PACOTE' mas não diz quantas peças
- **Conserto:** **Abrir a nota** e descobrir quantas peças vêm no PACOTE. Provável fator de conversão.

### 14791 — CONJUNTO

- Custo no ERP: **R$ 1,16** · preço de venda: R$ 0,01 · saldo: 7 un · valor inflado: **R$ 8,12**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14790 — PINCEL APLICADOR DE GLOSS - KIT COM 12 PCT, CADA PCT CONTEM 50 PECAS

- Custo no ERP: **R$ 1,16** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 6,96**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14780 — ESPELHO COM MOLDURA DE PLASTICO

- Custo no ERP: **R$ 2,20** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 6,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14786 — NAVALHA DE PLASTICO PARA SOBRANCELHA

- Custo no ERP: **R$ 3,16** · preço de venda: R$ 0,01 · saldo: 2 un · valor inflado: **R$ 6,32**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14792 — DISCO DE LIXA PARA LIXADEIRA

- Custo no ERP: **R$ 1,16** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 4,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14798 — PINCEL P/ UNHA COM PONTA BOLEADOR 2 EM 1

- Custo no ERP: **R$ 4,64** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 4,64**
- Evidência: custo é 464x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 14800 — TESOURA DE METAL PARA SOBRANCELHA

- Custo no ERP: **R$ 1,04** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 3,12**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14783 — ALMOFADA DE APOIO DE BRACO P/ MANICURE DE PILIURETANO

- Custo no ERP: **R$ 2,28** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 2,28**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14794 — PREP BACTERICIDA

- Custo no ERP: **R$ 1,14** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 1,14**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## ZGY

_5 produto(s) · R$ 261,83_

### 15816 — CILIOS DE CANTO

- Custo no ERP: **R$ 7,20** · preço de venda: R$ 0,01 · saldo: 22 un · valor inflado: **R$ 158,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 11440 — COLAR COM PIGENTE

- Custo no ERP: **R$ 15,68** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 47,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 8813 — COLAR DE METAL

- Custo no ERP: **R$ 17,70** · preço de venda: R$ 0,01 · saldo: 2 un · valor inflado: **R$ 35,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1344 — PRESILHA COM 3

- Custo no ERP: **R$ 10,53** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 10,53**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 3455 — ARGOLA AÇO INOXIDAVEL

- Custo no ERP: **R$ 5,23** · preço de venda: R$ 0,02 · saldo: 2 un · valor inflado: **R$ 10,46**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## RISQUE

_2 produto(s) · R$ 259,50_

### 5202 — ESMALTE RISQUE GRAO DE CAFE

- Custo no ERP: **R$ 16,53** · preço de venda: R$ 4,90 · saldo: 10 un · valor inflado: **R$ 165,30**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 6135 — ESMALTE RISQUE MALICIA

- Custo no ERP: **R$ 18,84** · preço de venda: R$ 4,90 · saldo: 5 un · valor inflado: **R$ 94,20**
- Evidência: custo 3,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## CHEN YUMEI

_4 produto(s) · R$ 242,40_

### 76530 — WZS451 CINTO

- Custo no ERP: **R$ 16,80** · preço de venda: R$ 2,80 · saldo: 7 un · valor inflado: **R$ 117,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76524 — WZS1117 CINTO

- Custo no ERP: **R$ 16,80** · preço de venda: R$ 2,80 · saldo: 5 un · valor inflado: **R$ 84,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76509 — WZS376 CINTO

- Custo no ERP: **R$ 14,40** · preço de venda: R$ 2,40 · saldo: 2 un · valor inflado: **R$ 28,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76508 — WZS484 CINTO

- Custo no ERP: **R$ 12,00** · preço de venda: R$ 2,00 · saldo: 1 un · valor inflado: **R$ 12,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## IMPALA

_2 produto(s) · R$ 178,20_

### 18015 — OLEO PARA CUTICULAS IMPALA TRATAMENTO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 24 un · valor inflado: **R$ 142,56**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18014 — ESMALTE IMPALA A COR DA MODA CREMOSO INTUICAO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## NATHYDRAS

_1 produto(s) · R$ 151,25_

### 45512 — REPARADOR DE PONTAS ALHO 30ML

- Custo no ERP: **R$ 13,75** · preço de venda: R$ 0,01 · saldo: 11 un · valor inflado: **R$ 151,25**
- Evidência: custo é 1.375x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## LUDURANA

_1 produto(s) · R$ 72,00_

### 18093 — ESMALTE LUDURANA GLITTER FIO DE OURO SOLTO 8ML

- Custo no ERP: **R$ 18,00** · preço de venda: R$ 0,12 · saldo: 4 un · valor inflado: **R$ 72,00**
- Evidência: preço de R$ 0,12 com custo de R$ 18,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## NOVO TOQUE

_1 produto(s) · R$ 54,84_

### 76009 — PRIMER TRANSP GEL 9ML

- Custo no ERP: **R$ 54,84** · preço de venda: R$ 9,14 · saldo: 1 un · valor inflado: **R$ 54,84**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## SENSCIENCE

_1 produto(s) · R$ 34,00_

### 8984 — FLYER PROD SENSCIENCE

- Custo no ERP: **R$ 0,34** · preço de venda: R$ 0,01 · saldo: 100 un · valor inflado: **R$ 34,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,34
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## VARCARE

_1 produto(s) · R$ 13,12_

### 65042 — AMOSTRA SACHE INVERSOR VIP LINE VARCARE 15 ML

- Custo no ERP: **R$ 32,80** · preço de venda: R$ 1,20 · saldo: 0 un · valor inflado: **R$ 13,12**
- Evidência: custo 27,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## RUBY ROSE

_2 produto(s) · R$ 9,67_

### 65567 — RR-1800-1 CORRETIVO LIQUIDO MELU RUBY ROSE RR-1800-1

- Custo no ERP: **R$ 1,14** · preço de venda: R$ 0,06 · saldo: 8 un · valor inflado: **R$ 9,12**
- Evidência: preço de R$ 0,06 com custo de R$ 1,14
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 64989 — UNHA POSTICA BAILARINA DECORADA 2010000002810

- Custo no ERP: **R$ 0,55** · preço de venda: R$ 0,09 · saldo: 1 un · valor inflado: **R$ 0,55**
- Evidência: preço de R$ 0,09 com custo de R$ 0,55
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## SEM MARCA

_1 produto(s) · R$ 6,00_

### 5341 — CARTAZ FASHION COLOR ARGAN

- Custo no ERP: **R$ 0,06** · preço de venda: R$ 0,01 · saldo: 100 un · valor inflado: **R$ 6,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,06
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## IMPORTADOS

_1 produto(s) · R$ 1,40_

### 64987 — ESPONJA COXINHA PARA MAQUIAGEM 2010000002193

- Custo no ERP: **R$ 0,28** · preço de venda: R$ 0,05 · saldo: 5 un · valor inflado: **R$ 1,40**
- Evidência: preço de R$ 0,05 com custo de R$ 0,28
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## VIVAI

_1 produto(s) · R$ 1,09_

### 62989 — BATOM LIQUIDO MATTE 06 CORES - VIVAI

- Custo no ERP: **R$ 1,09** · preço de venda: R$ 0,06 · saldo: 1 un · valor inflado: **R$ 1,09**
- Evidência: preço de R$ 0,06 com custo de R$ 1,09
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


