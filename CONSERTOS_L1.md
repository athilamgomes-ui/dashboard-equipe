# Estoque L1 · Casa da Beleza Altamira

Fonte: **Registro de Inventário** do ERP (Suprimentos → Relatórios → Registro de Inventário),
puxado em 27/08/2026 — é o relatório que valoriza o estoque, o mesmo que você usa.

Estoque declarado: **72.222 peças · R$ 1.029.133,76** em 360 marcas.

---

# Parte A — produtos com custo errado

**173 produtos · R$ 122.603,23** de valor que o sistema mostra e não existe.

Critério: custo maior que 3x o preço de venda. Margem apertada acontece; vender a menos
de um terço do custo, não.

| Tipo de conserto | Produtos | Valor | Quem resolve |
|---|---:|---:|---|
| custo corrompido | 28 | R$ 102.044,48 | ajuste de custo no ERP |
| sem movimento | 48 | R$ 9.717,86 | contagem física (ver parte B) |
| conferir a nota | 34 | R$ 6.165,40 | abrir a nota primeiro |
| fator de conversão (qtd estimada) | 20 | R$ 2.857,17 | confirmar a quantidade, depois cadastrar |
| preço a conferir | 26 | R$ 1.116,12 | quem define preço |
| fator de conversão | 9 | R$ 585,14 | quem dá entrada de NF (cadastro) |
| fator a confirmar | 8 | R$ 117,06 | abrir a nota primeiro |

> **A ordem importa:** fator de conversão antes do custo. Corrigindo só o custo, a
> próxima nota reintroduz o erro — a entrada continua lançando pacote como peça.

## AMEND  ·  _ATIVA_

### 12408 — MASCARA MATIZADOR COBRE AMEND 300G

- Custo no inventário: **R$ 50.515,63** · preço: R$ 67,90 · saldo: 2 un · inflado: **R$ 101.031,26**
- Evidência: ✅ conferido: NF 60160/1 de 28/02/25 — 12,00 UN a R$ 48,73 (SAFIRA). As irmãs custam R$ 26,94 / 37,46 / 28,66 e o preço R$ 67,90 está certo.
- **Conserto:** Corrigir o **custo médio** de R$ 50.515,63 para **R$ 48,73**. Não mexer no preço nem no saldo.
- Efeito: o estoque reduz R$ 100.933,80 (correção, não perda)

## MEY BRASIL COMERCIAL  ·  _ATIVA_

### 55935 — ORNAMENTO PARA CABELO (ANEL PARA DREADS DE METAL)

- Custo no inventário: **R$ 40,00** · preço: R$ 1,00 · saldo: 100 un · inflado: **R$ 4.000,00**
- Evidência: custo 40,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## SEM MARCA  ·  _ENCALHADA_

### 7067 — PINTANDO O HEXA 4

- Custo no inventário: **R$ 24,64** · preço: R$ 3,90 · saldo: 24 un · inflado: **R$ 591,36**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 10769 — CHICL BIG BIG

- Custo no inventário: **R$ 4,75** · preço: R$ 0,10 · saldo: 97 un · inflado: **R$ 460,75**
- Evidência: preço de R$ 0,10 com custo de R$ 4,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 14180 — AMOSTRA DEMAQUILANTE 30 ML

- Custo no inventário: **R$ 4,00** · preço: R$ 0,01 · saldo: 85 un · inflado: **R$ 340,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 74756 — ESM COL GEL CEU LILAS C/6

- Custo no inventário: **R$ 28,12** · preço: R$ 7,50 · saldo: 10 un · inflado: **R$ 281,20**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 7775 — ESM NATI P?PURA 01340002

- Custo no inventário: **R$ 18,00** · preço: R$ 3,99 · saldo: 12 un · inflado: **R$ 216,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 111 — BACIA PED PEDESTAL 188 AK

- Custo no inventário: **R$ 75,73** · preço: R$ 16,00 · saldo: 2 un · inflado: **R$ 151,46**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 40030 — HAIR SPRAY SILICON TREAT

- Custo no inventário: **R$ 30,50** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 122,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 9121 — ESM LUD CR-226 8 ML

- Custo no inventário: **R$ 117,48** · preço: R$ 3,90 · saldo: 1 un · inflado: **R$ 117,48**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 7116 — CJ 03-PO DESC.QUERATINA.20G+OX.60ML

- Custo no inventário: **R$ 18,00** · preço: R$ 5,90 · saldo: 6 un · inflado: **R$ 108,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 10722 — NEW ART STRASS PRATA

- Custo no inventário: **R$ 8,50** · preço: R$ 1,90 · saldo: 10 un · inflado: **R$ 85,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 7061 — ESMALTE PN QM SER CHIC

- Custo no inventário: **R$ 18,00** · preço: R$ 3,50 · saldo: 4 un · inflado: **R$ 72,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 4292 — CX PRESENTE 10132

- Custo no inventário: **R$ 67,79** · preço: R$ 3,50 · saldo: 1 un · inflado: **R$ 67,79**
- Evidência: o nome diz 'CX' mas não diz quantas peças
- **Conserto:** **Abrir a nota** e ver quantas peças vêm no CX.

### 6170 — SAC PLASTICA 400147

- Custo no inventário: **R$ 0,42** · preço: R$ 0,01 · saldo: 150 un · inflado: **R$ 63,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,42
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 5394 — ELASTICO MEU MEU 21220017

- Custo no inventário: **R$ 11,87** · preço: R$ 2,90 · saldo: 5 un · inflado: **R$ 59,35**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 1341 — PENTE AM-530

- Custo no inventário: **R$ 2,00** · preço: R$ 0,02 · saldo: 24 un · inflado: **R$ 48,00**
- Evidência: preço de R$ 0,02 com custo de R$ 2,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 10790 — FOLDER VARCARE TONALIZANTES

- Custo no inventário: **R$ 0,50** · preço: R$ 0,01 · saldo: 30 un · inflado: **R$ 15,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 17539 — PROV BATOM LIQ CAROL BT

- Custo no inventário: **R$ 5,67** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 11,34**
- Evidência: custo é 567x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 11640 — STRASS COLORIDO 22986

- Custo no inventário: **R$ 8,00** · preço: R$ 1,90 · saldo: 1 un · inflado: **R$ 8,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## PHALLEBEUTY  ·  _SAINDO_

### 64092 — STARGLOW PO BANANA PHALLEBEAUTY 10G

- Custo no inventário: **R$ 143,00** · preço: R$ 13,00 · saldo: 11 un · inflado: **R$ 1.573,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 64159 — MOUSSE MICELAR ANTI OLEOSIDADE 150ML PHALLEBEAUTY

- Custo no inventário: **R$ 158,28** · preço: R$ 27,00 · saldo: 2 un · inflado: **R$ 316,56**
- Evidência: custo 5,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 63638 — PALETA CONTORNO PHALLEBEAUTY 12G

- Custo no inventário: **R$ 140,62** · preço: R$ 18,00 · saldo: 2 un · inflado: **R$ 281,24**
- Evidência: custo 7,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## SANTA CLARA  ·  _ATIVA_

### 12491 — LIXA CUBO BRANCA ST CLARA 3694

- Custo no inventário: **R$ 87,27** · preço: R$ 5,80 · saldo: 7 un · inflado: **R$ 610,89**
- Evidência: comprou 2, vendeu 51 (razão 26x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~26 peças** — **confirmar na nota antes de gravar**. Com 26, o custo cai de R$ 87,27 para R$ 3,36, margem de 73% sobre R$ 5,80.
- Efeito: o estoque reduz R$ 587,39 (correção, não perda)

### 7628 — LIXA PE RALIXA 284 SANTA CLARA

- Custo no inventário: **R$ 20,32** · preço: R$ 3,20 · saldo: 21 un · inflado: **R$ 426,72**
- Evidência: comprou 1, vendeu 52 (razão 52x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~52 peças** — **confirmar na nota antes de gravar**. Com 52, o custo cai de R$ 20,32 para R$ 0,39, margem de 719% sobre R$ 3,20.
- Efeito: o estoque reduz R$ 418,51 (correção, não perda)

### 7239 — LIXA PE MISTA 12 UN ST CLARA

- Custo no inventário: **R$ 28,36** · preço: R$ 8,92 · saldo: 10 un · inflado: **R$ 283,60**
- Evidência: no nome: 12 UN · comprou 1, vendeu 19 (razão 19x)
- **Conserto:** Cadastrar **fator de conversão = 12** (a quantidade está no nome). O custo unitário cai de R$ 28,36 para **R$ 2,36** — margem de 277% sobre o preço de R$ 8,92.
- Efeito: o estoque reduz R$ 259,97 (correção, não perda)

### 1731 — PALITO UNHA CHANF UN SANTA CLARA

- Custo no inventário: **R$ 18,10** · preço: R$ 2,90 · saldo: 14 un · inflado: **R$ 253,40**
- Evidência: comprou 3, vendeu 31 (razão 10x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~10 peças** — **confirmar na nota antes de gravar**. Com 10, o custo cai de R$ 18,10 para R$ 1,81, margem de 60% sobre R$ 2,90.
- Efeito: o estoque reduz R$ 228,06 (correção, não perda)

### 8059 — ESC PLAST OVAL MASS S CLARA

- Custo no inventário: **R$ 12,71** · preço: R$ 1,90 · saldo: 5 un · inflado: **R$ 63,55**
- Evidência: comprou 1, vendeu 11 (razão 11x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~11 peças** — **confirmar na nota antes de gravar**. Com 11, o custo cai de R$ 12,71 para R$ 1,16, margem de 64% sobre R$ 1,90.
- Efeito: o estoque reduz R$ 57,77 (correção, não perda)

### 1853 — LIXA PES PQ ST CLARA 1228 UN

- Custo no inventário: **R$ 15,36** · preço: R$ 2,50 · saldo: 4 un · inflado: **R$ 61,44**
- Evidência: no nome: 1228 UN · comprou 2, vendeu 18 (razão 9x)
- **Conserto:** Cadastrar **fator de conversão = 1.228** (a quantidade está no nome). O custo unitário cai de R$ 15,36 para **R$ 0,01** — margem de 19.887% sobre o preço de R$ 2,50.
- Efeito: o estoque reduz R$ 61,39 (correção, não perda)

### 204360 — NAVALHETE PLASTICA CABO MARROM - SANTA CLARA

- Custo no inventário: **R$ 8,82** · preço: R$ 1,06 · saldo: 6 un · inflado: **R$ 52,92**
- Evidência: custo 8,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 15947 — LIXA M POP PARDA C/100 SANTA CLARA

- Custo no inventário: **R$ 5,13** · preço: R$ 0,25 · saldo: 10 un · inflado: **R$ 51,30**
- Evidência: no nome: C/100
- **Conserto:** Cadastrar **fator de conversão = 100** (a quantidade está no nome). O custo unitário cai de R$ 5,13 para **R$ 0,05** — margem de 387% sobre o preço de R$ 0,25.
- Efeito: o estoque reduz R$ 50,79 (correção, não perda)

### 15948 — LIXA M.POP.PRETA - UN

- Custo no inventário: **R$ 5,13** · preço: R$ 0,25 · saldo: 10 un · inflado: **R$ 51,30**
- Evidência: preço de R$ 0,25 com custo de R$ 5,13
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 15915 — UNHA POST LEIT PES 3320 ST CLARA

- Custo no inventário: **R$ 36,83** · preço: R$ 3,26 · saldo: 1 un · inflado: **R$ 36,83**
- Evidência: comprou 1, vendeu 12 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** — **confirmar na nota antes de gravar**. Com 12, o custo cai de R$ 36,83 para R$ 3,07, margem de 6% sobre R$ 3,26.
- Efeito: o estoque reduz R$ 33,76 (correção, não perda)

### 204359 — ESCOVA LRJ/VR.N.FLEX COLOR

- Custo no inventário: **R$ 12,36** · preço: R$ 1,06 · saldo: 2 un · inflado: **R$ 24,72**
- Evidência: custo 11,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 1141 — LIXA EXTRA GROSA ST CLARA UN

- Custo no inventário: **R$ 7,07** · preço: R$ 0,25 · saldo: 3 un · inflado: **R$ 21,21**
- Evidência: preço de R$ 0,25 com custo de R$ 7,07
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 4229 — LIXA P/UNHAS MINI EXTRA 128

- Custo no inventário: **R$ 2,09** · preço: R$ 0,15 · saldo: 10 un · inflado: **R$ 20,90**
- Evidência: preço de R$ 0,15 com custo de R$ 2,09
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 59053 — PIRANHA ST CLARA

- Custo no inventário: **R$ 16,65** · preço: R$ 0,72 · saldo: 1 un · inflado: **R$ 16,65**
- Evidência: comprou 1, vendeu 123 (razão 123x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~123 peças** — **confirmar na nota antes de gravar**. Com 123, o custo cai de R$ 16,65 para R$ 0,14, margem de 432% sobre R$ 0,72.
- Efeito: o estoque reduz R$ 16,51 (correção, não perda)

### 8637 — LENCOL DESC ST CLARA 15UN

- Custo no inventário: **R$ 15,80** · preço: R$ 2,10 · saldo: 1 un · inflado: **R$ 15,80**
- Evidência: no nome: 15 UN
- **Conserto:** Cadastrar **fator de conversão = 15** (a quantidade está no nome). O custo unitário cai de R$ 15,80 para **R$ 1,05** — margem de 99% sobre o preço de R$ 2,10.
- Efeito: o estoque reduz R$ 14,75 (correção, não perda)

### 8036 — REFIL LIXA 12UN 753/754 S CLARA 2118

- Custo no inventário: **R$ 3,08** · preço: R$ 0,50 · saldo: 5 un · inflado: **R$ 15,40**
- Evidência: no nome: 12 UN
- **Conserto:** Cadastrar **fator de conversão = 12** (a quantidade está no nome). O custo unitário cai de R$ 3,08 para **R$ 0,26** — margem de 95% sobre o preço de R$ 0,50.
- Efeito: o estoque reduz R$ 14,12 (correção, não perda)

### 5519 — PO ADGISTRENTE SANTA CLARA 20G

- Custo no inventário: **R$ 5,51** · preço: R$ 0,92 · saldo: 2 un · inflado: **R$ 11,02**
- Evidência: comprou 1, vendeu 24 (razão 24x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~24 peças** — **confirmar na nota antes de gravar**. Com 24, o custo cai de R$ 5,51 para R$ 0,23, margem de 301% sobre R$ 0,92.
- Efeito: o estoque reduz R$ 10,56 (correção, não perda)

### 42839 — LIXA MINI CANARIO P/UNHAS C/20

- Custo no inventário: **R$ 1,06** · preço: R$ 0,12 · saldo: 10 un · inflado: **R$ 10,60**
- Evidência: no nome: C/20
- **Conserto:** Cadastrar **fator de conversão = 20** (a quantidade está no nome). O custo unitário cai de R$ 1,06 para **R$ 0,05** — margem de 126% sobre o preço de R$ 0,12.
- Efeito: o estoque reduz R$ 10,07 (correção, não perda)

### 48793 — LIXA MINI PRETA P/UNHAS C/20

- Custo no inventário: **R$ 1,00** · preço: R$ 0,10 · saldo: 3 un · inflado: **R$ 3,00**
- Evidência: no nome: C/20
- **Conserto:** Cadastrar **fator de conversão = 20** (a quantidade está no nome). O custo unitário cai de R$ 1,00 para **R$ 0,05** — margem de 100% sobre o preço de R$ 0,10.
- Efeito: o estoque reduz R$ 2,85 (correção, não perda)

## COLORAMA  ·  _ENCALHADA_

### 20537 — ESM COL GEL TO BEGE C/6

- Custo no inventário: **R$ 30,30** · preço: R$ 7,90 · saldo: 11 un · inflado: **R$ 333,30**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 61892 — ESM COL NAT CLASSICO

- Custo no inventário: **R$ 18,65** · preço: R$ 4,90 · saldo: 12 un · inflado: **R$ 223,80**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 30128 — ESM COL CREM AMANHECER C/6

- Custo no inventário: **R$ 18,65** · preço: R$ 4,90 · saldo: 11 un · inflado: **R$ 205,15**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 46782 — ESM COL BRASILEIRAS FLOR CERRADO

- Custo no inventário: **R$ 23,54** · preço: R$ 6,90 · saldo: 7 un · inflado: **R$ 164,78**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 46785 — ESM COL BRASILEIRAS MENINA RIO

- Custo no inventário: **R$ 23,54** · preço: R$ 6,90 · saldo: 6 un · inflado: **R$ 141,24**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 46786 — ESM COL BRASILEIRAS MINEIRINHA UAI

- Custo no inventário: **R$ 23,54** · preço: R$ 6,90 · saldo: 6 un · inflado: **R$ 141,24**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 46781 — ESM COL BRASILEIRAS BAH GURIA

- Custo no inventário: **R$ 23,54** · preço: R$ 6,90 · saldo: 5 un · inflado: **R$ 117,70**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 46784 — ESM COL BRASILEIRAS MARIA BONITA

- Custo no inventário: **R$ 23,54** · preço: R$ 6,90 · saldo: 5 un · inflado: **R$ 117,70**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18863 — ESM COL GEL ROXO MISTICO

- Custo no inventário: **R$ 28,12** · preço: R$ 7,90 · saldo: 3 un · inflado: **R$ 84,36**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 60697 — ESM COL GURU AMOR O PRAZER MEU

- Custo no inventário: **R$ 33,26** · preço: R$ 8,90 · saldo: 2 un · inflado: **R$ 66,52**
- Evidência: custo 3,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 41652 — ESM COL CREM DEIXA BEIJAR C/6

- Custo no inventário: **R$ 17,55** · preço: R$ 4,90 · saldo: 2 un · inflado: **R$ 35,10**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 46783 — ESM COL BRASILEIRAS MANA DO CEU

- Custo no inventário: **R$ 23,54** · preço: R$ 6,90 · saldo: 1 un · inflado: **R$ 23,54**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 48552 — ESMALTE GEADA COLORAMA

- Custo no inventário: **R$ 23,00** · preço: R$ 4,90 · saldo: 1 un · inflado: **R$ 23,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## TALGE  ·  _ATIVA_

### 49245 — LUVA NITRILICA AZUL TALGE

- Custo no inventário: **R$ 699,00** · preço: R$ 79,90 · saldo: 1 un · inflado: **R$ 699,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 23846 — LUVA NITRILICA ROSA S/PO M TALGE

- Custo no inventário: **R$ 21,00** · preço: R$ 4,20 · saldo: 5 un · inflado: **R$ 105,00**
- Evidência: comprou 1, vendeu 15 (razão 15x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~15 peças** — **confirmar na nota antes de gravar**. Com 15, o custo cai de R$ 21,00 para R$ 1,40, margem de 200% sobre R$ 4,20.
- Efeito: o estoque reduz R$ 98,00 (correção, não perda)

### 51207 — LUVA VINIL P COM PO TALGE

- Custo no inventário: **R$ 10,00** · preço: R$ 2,20 · saldo: 10 un · inflado: **R$ 100,00**
- Evidência: comprou 2, vendeu 16 (razão 8x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~8 peças** — **confirmar na nota antes de gravar**. Com 8, o custo cai de R$ 10,00 para R$ 1,25, margem de 76% sobre R$ 2,20.
- Efeito: o estoque reduz R$ 87,50 (correção, não perda)

### 53846 — LUVA VINIL SEM PO M CX C-100

- Custo no inventário: **R$ 10,00** · preço: R$ 2,20 · saldo: 9 un · inflado: **R$ 90,00**
- Evidência: comprou 1, vendeu 26 (razão 26x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~26 peças** — **confirmar na nota antes de gravar**. Com 26, o custo cai de R$ 10,00 para R$ 0,38, margem de 472% sobre R$ 2,20.
- Efeito: o estoque reduz R$ 86,54 (correção, não perda)

### 16844 — LUVA TALGE DESC NITRILICAS G

- Custo no inventário: **R$ 21,00** · preço: R$ 4,80 · saldo: 4 un · inflado: **R$ 84,00**
- Evidência: comprou 1, vendeu 17 (razão 17x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~17 peças** — **confirmar na nota antes de gravar**. Com 17, o custo cai de R$ 21,00 para R$ 1,24, margem de 289% sobre R$ 4,80.
- Efeito: o estoque reduz R$ 79,06 (correção, não perda)

### 53849 — LUVA LATEX C/PO M CX-100 UN

- Custo no inventário: **R$ 16,00** · preço: R$ 3,80 · saldo: 5 un · inflado: **R$ 80,00**
- Evidência: no nome: 100 UN · comprou 1, vendeu 25 (razão 25x)
- **Conserto:** Cadastrar **fator de conversão = 100** (a quantidade está no nome). O custo unitário cai de R$ 16,00 para **R$ 0,16** — margem de 2.275% sobre o preço de R$ 3,80.
- Efeito: o estoque reduz R$ 79,20 (correção, não perda)

### 4742 — LUVA TALGE DESC LATEX C/ PO TAM G

- Custo no inventário: **R$ 16,00** · preço: R$ 3,80 · saldo: 5 un · inflado: **R$ 80,00**
- Evidência: comprou 1, vendeu 8 (razão 8x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~8 peças** — **confirmar na nota antes de gravar**. Com 8, o custo cai de R$ 16,00 para R$ 2,00, margem de 90% sobre R$ 3,80.
- Efeito: o estoque reduz R$ 70,00 (correção, não perda)

### 18505 — LUVA TALGE VINIL COM PO M

- Custo no inventário: **R$ 10,00** · preço: R$ 2,21 · saldo: 8 un · inflado: **R$ 80,00**
- Evidência: comprou 2, vendeu 22 (razão 11x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~11 peças** — **confirmar na nota antes de gravar**. Com 11, o custo cai de R$ 10,00 para R$ 0,91, margem de 143% sobre R$ 2,21.
- Efeito: o estoque reduz R$ 72,73 (correção, não perda)

### 53848 — LUVA LATEX C/PO P CX-100 UN

- Custo no inventário: **R$ 16,00** · preço: R$ 4,20 · saldo: 4 un · inflado: **R$ 64,00**
- Evidência: no nome: 100 UN · comprou 1, vendeu 9 (razão 9x)
- **Conserto:** Cadastrar **fator de conversão = 100** (a quantidade está no nome). O custo unitário cai de R$ 16,00 para **R$ 0,16** — margem de 2.525% sobre o preço de R$ 4,20.
- Efeito: o estoque reduz R$ 63,36 (correção, não perda)

### 51209 — LUVA VINIL SEM PO G CX C-100

- Custo no inventário: **R$ 10,00** · preço: R$ 2,20 · saldo: 5 un · inflado: **R$ 50,00**
- Evidência: comprou 1, vendeu 10 (razão 10x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~10 peças** — **confirmar na nota antes de gravar**. Com 10, o custo cai de R$ 10,00 para R$ 1,00, margem de 120% sobre R$ 2,20.
- Efeito: o estoque reduz R$ 45,00 (correção, não perda)

### 16845 — LUVA NITRILICAS PRETA TALGE M S/PO

- Custo no inventário: **R$ 21,00** · preço: R$ 6,39 · saldo: 2 un · inflado: **R$ 42,00**
- Evidência: comprou 1, vendeu 18 (razão 18x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~18 peças** — **confirmar na nota antes de gravar**. Com 18, o custo cai de R$ 21,00 para R$ 1,17, margem de 448% sobre R$ 6,39.
- Efeito: o estoque reduz R$ 39,67 (correção, não perda)

### 51402 — LUVA TALGE VINIL SEM PO P TALGE

- Custo no inventário: **R$ 10,00** · preço: R$ 2,20 · saldo: 2 un · inflado: **R$ 20,00**
- Evidência: comprou 1, vendeu 13 (razão 13x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~13 peças** — **confirmar na nota antes de gravar**. Com 13, o custo cai de R$ 10,00 para R$ 0,77, margem de 186% sobre R$ 2,20.
- Efeito: o estoque reduz R$ 18,46 (correção, não perda)

## CAPICILIN  ·  _MORTA_

### 11161 — HOTCREAM COCO TRAT CAPICILIN

- Custo no inventário: **R$ 182,20** · preço: R$ 23,90 · saldo: 3 un · inflado: **R$ 546,60**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 11162 — HOTCREAM TRAT CAPICILIN

- Custo no inventário: **R$ 182,20** · preço: R$ 23,90 · saldo: 1 un · inflado: **R$ 182,20**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 11150 — GELAT MOD CAPICILIN 350G

- Custo no inventário: **R$ 118,45** · preço: R$ 15,90 · saldo: 1 un · inflado: **R$ 118,45**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 61078 — CR PENTE INTEGRAL CAPICILIN 300 ML

- Custo no inventário: **R$ 67,50** · preço: R$ 8,99 · saldo: 1 un · inflado: **R$ 67,50**
- Evidência: custo 7,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## KISS NEW YORK  ·  _ENCALHADA_

### 11100 — KISS NY NAVALHA SOBRANC LONGO

- Custo no inventário: **R$ 234,51** · preço: R$ 6,90 · saldo: 3 un · inflado: **R$ 703,53**
- Evidência: comprou 6, vendeu 240 (razão 40x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~40 peças** — **confirmar na nota antes de gravar**. Com 40, o custo cai de R$ 234,51 para R$ 5,86, margem de 18% sobre R$ 6,90.
- Efeito: o estoque reduz R$ 685,94 (correção, não perda)

## NATI NAO USAR  ·  _MORTA_

### 4067 — ADESIVO NATI COPA

- Custo no inventário: **R$ 30,00** · preço: R$ 3,00 · saldo: 19 un · inflado: **R$ 570,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## JAPINHA  ·  _ATIVA_

### 16988 — KIT SHAMPOO DETOX / ATIVO REDUTOR DE QUIABO JAPINHA 1LT

- Custo no inventário: **R$ 54,10** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 324,60**
- Evidência: custo é 5.410x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 16945 — Kit Shampoo Detox / Ativo Redutor Organico Japinha 120ml

- Custo no inventário: **R$ 16,40** · preço: R$ 0,20 · saldo: 6 un · inflado: **R$ 98,40**
- Evidência: preço de R$ 0,20 com custo de R$ 16,40
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 9116 — BOTOX OJOIN JAPINHA 1KG

- Custo no inventário: **R$ 29,42** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 88,26**
- Evidência: custo é 2.942x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 9115 — BOTOX OJON JAPINHA 300G

- Custo no inventário: **R$ 13,04** · preço: R$ 0,01 · saldo: 2 un · inflado: **R$ 26,08**
- Evidência: custo é 1.304x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## REAL LOVE  ·  _MORTA_

### 29649 — CARIMBO PARA DECORACAO DE UNHAS

- Custo no inventário: **R$ 43,20** · preço: R$ 9,90 · saldo: 10 un · inflado: **R$ 432,00**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 346 — PIN-Q-08 CONJUNTO (1 PORTA PINCEL DE MAQUIAGEM ,ESPELHO E PINCEL DE MAQUIAGEM)

- Custo no inventário: **R$ 99,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 99,00**
- Evidência: custo é 9.900x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## MAX LOVE  ·  _ENCALHADA_

### 7035 — BLUSH 17 MAX LOVE

- Custo no inventário: **R$ 97,17** · preço: R$ 15,50 · saldo: 4 un · inflado: **R$ 388,68**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## NOVEX  ·  _ENCALHADA_

### 53756 — Novex Recarga de Queratina Cond 80g

- Custo no inventário: **R$ 10,60** · preço: R$ 1,07 · saldo: 36 un · inflado: **R$ 381,60**
- Evidência: custo 9,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## IMPALA  ·  _ATIVA_

### 18015 — OLEO PARA CUTICULAS IMPALA TRATAMENTO

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 12 un · inflado: **R$ 71,28**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18012 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO CARTAS NA MANGA

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 35,64**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18011 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO SORTE LANCADA

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 35,64**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18008 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO APOSTA ALTA IMPALA

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 35,64**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18007 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO ESCOLHA SEU LADO IMPALA

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 35,64**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18004 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO PLOT TWIST IMPALA

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 6 un · inflado: **R$ 35,64**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18014 — ESMALTE IMPALA A COR DA MODA CREMOSO INTUICAO

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 29,70**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18010 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO XEQUE - MATE

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 29,70**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18013 — ESMALTE IMPALA JU PAES VIRANDO O JOGO SUAVE COBERTURA REGRAS DO JOGO

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 5 un · inflado: **R$ 29,70**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 18016 — TOP COAT PRO FINISH IMPALA BLINDAGEM 4D

- Custo no inventário: **R$ 5,94** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 5,94**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## DAFU  ·  _ATIVA_

### 27580 — NECESSAIRE DAFU

- Custo no inventário: **R$ 36,00** · preço: R$ 1,08 · saldo: 1 un · inflado: **R$ 36,00**
- Evidência: custo 33,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 42257 — MODELADOR DE CACHO - DAFU

- Custo no inventário: **R$ 1,40** · preço: R$ 0,02 · saldo: 23 un · inflado: **R$ 32,20**
- Evidência: preço de R$ 0,02 com custo de R$ 1,40
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 27589 — CILIOS POSTICOS FIO A FIO DE FIBRA DAFU

- Custo no inventário: **R$ 26,40** · preço: R$ 3,74 · saldo: 1 un · inflado: **R$ 26,40**
- Evidência: custo 7,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27592 — MOTOR POLIDOR DE BRANCO/ROSA

- Custo no inventário: **R$ 23,20** · preço: R$ 6,12 · saldo: 1 un · inflado: **R$ 23,20**
- Evidência: custo 3,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27746 — KIT PRESILHA PARA CABELO DAFU

- Custo no inventário: **R$ 10,80** · preço: R$ 2,20 · saldo: 2 un · inflado: **R$ 21,60**
- Evidência: custo 4,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 47896 — MASSAGEADOR FACIAL DE RESINA - DAFU

- Custo no inventário: **R$ 21,60** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 21,60**
- Evidência: comprou 1, vendeu 6 (razão 6x)
- **Conserto:** Parece embalagem de 6, mas R$ 21,60 ÷ 6 = R$ 3,60, que ainda passa do preço de R$ 0,02. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,02 também não se sustenta — conferir os dois.

### 28467 — CONJUNTO (4 ESPONJAS E 1 PIRANHA DE PLASTICO)

- Custo no inventário: **R$ 18,00** · preço: R$ 5,24 · saldo: 1 un · inflado: **R$ 18,00**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 28429 — ESPONJA PARA MAQUIAGEM KIT DAFU

- Custo no inventário: **R$ 17,20** · preço: R$ 4,50 · saldo: 1 un · inflado: **R$ 17,20**
- Evidência: custo 3,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 5196 — KIT ESPONJA PARA MAQUIAGEM DAFU

- Custo no inventário: **R$ 8,40** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 16,80**
- Evidência: custo é 420x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 47350 — NECESSAIRE COLORIDA DAFU

- Custo no inventário: **R$ 5,60** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 16,80**
- Evidência: preço de R$ 0,02 com custo de R$ 5,60
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 44500 — REFIL DE BROCA DAFU

- Custo no inventário: **R$ 16,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 16,00**
- Evidência: custo é 800x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 27578 — FRASCO DE PLASTICO 50 ML - DAFU

- Custo no inventário: **R$ 10,80** · preço: R$ 1,70 · saldo: 1 un · inflado: **R$ 10,80**
- Evidência: custo 6,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27535 — LAÇO COM PRESILHA PARA CABELO

- Custo no inventário: **R$ 10,80** · preço: R$ 2,62 · saldo: 1 un · inflado: **R$ 10,80**
- Evidência: custo 4,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27850 — TOUCA DE BANHO DE PLASTICO

- Custo no inventário: **R$ 10,80** · preço: R$ 2,60 · saldo: 1 un · inflado: **R$ 10,80**
- Evidência: comprou 1, vendeu 12 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** — **confirmar na nota antes de gravar**. Com 12, o custo cai de R$ 10,80 para R$ 0,90, margem de 189% sobre R$ 2,60.
- Efeito: o estoque reduz R$ 9,90 (correção, não perda)

### 55309 — TOUCA DE BANHO DE PLASTICO - DF309 -TC9905

- Custo no inventário: **R$ 10,80** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 10,80**
- Evidência: custo é 540x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 57784 — CILIOS POSTICOS FIO A FIO

- Custo no inventário: **R$ 10,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 10,00**
- Evidência: custo é 500x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 27570 — LAÇO GRANDE COLORIDO - DF422 - PR130

- Custo no inventário: **R$ 9,60** · preço: R$ 3,06 · saldo: 1 un · inflado: **R$ 9,60**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 47827 — COLA DE CIANOACRILATO PARA UNHAS POSTICAS - DAFU

- Custo no inventário: **R$ 6,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 6,00**
- Evidência: preço de R$ 0,02 com custo de R$ 6,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 52751 — ORNAMENTO PARA CABELO (PRESILHA) DE METAL

- Custo no inventário: **R$ 6,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 6,00**
- Evidência: preço de R$ 0,02 com custo de R$ 6,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 52852 — PINCEL COTONETE PEQUENO - DAFU

- Custo no inventário: **R$ 6,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 6,00**
- Evidência: preço de R$ 0,02 com custo de R$ 6,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 27604 — PINCEL PARA APLICAÇÃO DE MAQUIAGEM - DAFU

- Custo no inventário: **R$ 4,40** · preço: R$ 1,00 · saldo: 1 un · inflado: **R$ 4,40**
- Evidência: custo 4,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## OTIMO BIJUTERIAS  ·  _ATIVA_

### 2571 — CILIOS OTIMOS

- Custo no inventário: **R$ 1,08** · preço: R$ 0,02 · saldo: 29 un · inflado: **R$ 31,32**
- Evidência: preço de R$ 0,02 com custo de R$ 1,08
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1378 — COLAR

- Custo no inventário: **R$ 13,50** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 27,00**
- Evidência: custo é 675x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 1363 — COLAR

- Custo no inventário: **R$ 13,00** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 26,00**
- Evidência: custo é 650x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 75680 — KIT ESPONJA

- Custo no inventário: **R$ 4,33** · preço: R$ 1,33 · saldo: 6 un · inflado: **R$ 25,98**
- Evidência: comprou 2, vendeu 10 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** — **confirmar na nota antes de gravar**. Com 5, o custo cai de R$ 4,33 para R$ 0,87, margem de 54% sobre R$ 1,33.
- Efeito: o estoque reduz R$ 20,78 (correção, não perda)

### 5015 — BRINCO

- Custo no inventário: **R$ 6,90** · preço: R$ 0,02 · saldo: 3 un · inflado: **R$ 20,70**
- Evidência: custo é 345x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 2687 — BRINCO OTIMOS

- Custo no inventário: **R$ 4,84** · preço: R$ 0,02 · saldo: 4 un · inflado: **R$ 19,36**
- Evidência: preço de R$ 0,02 com custo de R$ 4,84
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 47393 — PULSEIRA COM PEDRA RETANGULAR BRILHOSA - F21-7223105G

- Custo no inventário: **R$ 17,80** · preço: R$ 2,00 · saldo: 1 un · inflado: **R$ 17,80**
- Evidência: custo 8,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27735 — BRACELETE AÇO INOX - G02-9321161-P

- Custo no inventário: **R$ 15,00** · preço: R$ 3,82 · saldo: 1 un · inflado: **R$ 15,00**
- Evidência: custo 3,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 15321 — COLAR CORRENTE GRANDE COM DETALHE EM BRILHO - G01-866982-C

- Custo no inventário: **R$ 13,40** · preço: R$ 2,75 · saldo: 1 un · inflado: **R$ 13,40**
- Evidência: custo 4,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 62659 — PEDRA DE JADE ROLO

- Custo no inventário: **R$ 6,50** · preço: R$ 0,58 · saldo: 2 un · inflado: **R$ 13,00**
- Evidência: comprou 1, vendeu 6 (razão 6x)
- **Conserto:** Parece embalagem de 6, mas R$ 6,50 ÷ 6 = R$ 1,08, que ainda passa do preço de R$ 0,58. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,58 também não se sustenta — conferir os dois.

### 44544 — CONJUNTO COLAR E BRINCO PEROLA COM PEDRAS - F01-782855

- Custo no inventário: **R$ 12,90** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 12,90**
- Evidência: custo é 1.290x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1382 — PULSEIRA

- Custo no inventário: **R$ 2,33** · preço: R$ 0,02 · saldo: 5 un · inflado: **R$ 11,65**
- Evidência: preço de R$ 0,02 com custo de R$ 2,33
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 56199 — ELASTICO 5

- Custo no inventário: **R$ 11,00** · preço: R$ 0,50 · saldo: 1 un · inflado: **R$ 11,00**
- Evidência: preço de R$ 0,50 com custo de R$ 11,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 4875 — SAIA CARNAVAL 2

- Custo no inventário: **R$ 10,67** · preço: R$ 2,60 · saldo: 1 un · inflado: **R$ 10,67**
- Evidência: custo 4,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 41271 — COLAR DUPLO EM PEROLA - F32-682732A

- Custo no inventário: **R$ 10,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 10,00**
- Evidência: custo é 1.000x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 27422 — CONJUNTO BRINCO E COLAR CIRCULO DOURADO - F34-573632X

- Custo no inventário: **R$ 9,60** · preço: R$ 2,90 · saldo: 1 un · inflado: **R$ 9,60**
- Evidência: custo 3,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 41275 — COLAR PEDRA BRILHANTE - F13-624512M

- Custo no inventário: **R$ 7,50** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 7,50**
- Evidência: custo é 750x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 49028 — PULSEIRA

- Custo no inventário: **R$ 7,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 7,00**
- Evidência: custo é 700x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1381 — COLAR

- Custo no inventário: **R$ 6,33** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 6,33**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 6,33 ÷ 5 = R$ 1,27, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

### 44217 — ARGOLA COLORIDA GRANDE - F11-222464

- Custo no inventário: **R$ 6,00** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 6,00**
- Evidência: custo é 600x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 4602 — ESPELHO DE BOLSA OTIMO

- Custo no inventário: **R$ 5,67** · preço: R$ 0,03 · saldo: 1 un · inflado: **R$ 5,67**
- Evidência: preço de R$ 0,03 com custo de R$ 5,67
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 44546 — BRACELETE ABERTO - F29-579232B

- Custo no inventário: **R$ 4,50** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 4,50**
- Evidência: custo é 450x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 44542 — BRINCO CORAÇÃO GRANDE - F34-572225X

- Custo no inventário: **R$ 3,40** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 3,40**
- Evidência: custo é 340x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 1312 — LAÇO PDD OTIMOS

- Custo no inventário: **R$ 3,00** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 3,00**
- Evidência: comprou 1, vendeu 7 (razão 7x)
- **Conserto:** Parece embalagem de 7, mas R$ 3,00 ÷ 7 = R$ 0,43, que ainda passa do preço de R$ 0,02. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,02 também não se sustenta — conferir os dois.

### 77081 — PIRANHA PARA CABELO

- Custo no inventário: **R$ 2,50** · preço: R$ 0,05 · saldo: 1 un · inflado: **R$ 2,50**
- Evidência: comprou 3, vendeu 16 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 2,50 ÷ 5 = R$ 0,50, que ainda passa do preço de R$ 0,05. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,05 também não se sustenta — conferir os dois.

### 2758 — CHAVEIRO

- Custo no inventário: **R$ 1,42** · preço: R$ 0,03 · saldo: 1 un · inflado: **R$ 1,42**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 1,42 ÷ 5 = R$ 0,28, que ainda passa do preço de R$ 0,03. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,03 também não se sustenta — conferir os dois.

### 45940 — RABICO

- Custo no inventário: **R$ 1,42** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 1,42**
- Evidência: comprou 1, vendeu 11 (razão 11x)
- **Conserto:** Parece embalagem de 11, mas R$ 1,42 ÷ 11 = R$ 0,13, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois.

## CAPELLA  ·  _MORTA_

### 8951 — ANEL CAPELLA 8951

- Custo no inventário: **R$ 134,83** · preço: R$ 2,00 · saldo: 2 un · inflado: **R$ 269,66**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## VIVAI  ·  _ENCALHADA_

### 47180 — MANTEIGA DE CACAU - LIQUIDA DP 36

- Custo no inventário: **R$ 14,26** · preço: R$ 3,90 · saldo: 10 un · inflado: **R$ 142,60**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

### 51869 — DELINEADOR PARA OS OLHOS 06 CORES - INTENSE COLORS - VIVAI

- Custo no inventário: **R$ 46,08** · preço: R$ 13,90 · saldo: 1 un · inflado: **R$ 46,08**
- Evidência: custo 3,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 51873 — BATOM BASTAO MATTE - BEAUTIFUL LIPS VIVAI

- Custo no inventário: **R$ 36,29** · preço: R$ 11,90 · saldo: 1 un · inflado: **R$ 36,29**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## LUISANCE  ·  _SAINDO_

### 40310 — CONJ MAQUIA MA6910-1

- Custo no inventário: **R$ 52,64** · preço: R$ 0,01 · saldo: 4 un · inflado: **R$ 210,56**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## P&W  ·  _FANTASMA_

### 40311 — SOMBRA METALICA MK-35W

- Custo no inventário: **R$ 52,64** · preço: R$ 7,50 · saldo: 4 un · inflado: **R$ 210,56**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## MACRILAN  ·  _ENCALHADA_

### 78341 — KIT COM 5 PINCEIS E 3 PULSEIRA MACRILAN

- Custo no inventário: **R$ 41,17** · preço: R$ 6,49 · saldo: 3 un · inflado: **R$ 123,51**
- Evidência: custo 6,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78355 — ESPONJA GOTA PARA MAQUIAGEM - MACRILAN

- Custo no inventário: **R$ 5,05** · preço: R$ 0,72 · saldo: 8 un · inflado: **R$ 40,40**
- Evidência: preço de R$ 0,72 com custo de R$ 5,05
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 78362 — ESPONJA GOTA CHANFRADA P/ MAQUIAGEM - MACRILAN

- Custo no inventário: **R$ 4,94** · preço: R$ 0,73 · saldo: 4 un · inflado: **R$ 19,76**
- Evidência: preço de R$ 0,73 com custo de R$ 4,94
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 78361 — ESPONJA COM DUAS - MACRILAN

- Custo no inventário: **R$ 5,58** · preço: R$ 0,87 · saldo: 2 un · inflado: **R$ 11,16**
- Evidência: preço de R$ 0,87 com custo de R$ 5,58
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## ITALLIAN HAIR  ·  _ATIVA_

### 204358 — KIT HOME CARE TRIVITT COM HIDRATACAO

- Custo no inventário: **R$ 9,98** · preço: R$ 2,00 · saldo: 18 un · inflado: **R$ 179,64**
- Evidência: custo 5,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 40339 — CB CORRETOR AZUL ITALLIAN COLOR 60G

- Custo no inventário: **R$ 5,84** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 5,84**
- Evidência: custo é 584x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 8511 — COLORACAO IC SEM AMONIA 0.20 INTENSIFICADOR PURPLE 60G

- Custo no inventário: **R$ 0,41** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 0,41**
- Evidência: preço de R$ 0,01 com custo de R$ 0,41
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## GAMA  ·  _ENCALHADA_

### 49539 — ESCOVA ROTATIVA GA.MA ELEGANZA PLUS - BIVOLT

- Custo no inventário: **R$ 139,74** · preço: R$ 44,00 · saldo: 1 un · inflado: **R$ 139,74**
- Evidência: custo 3,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## GULOSEIMAS  ·  _FANTASMA_

### 57006 — CHICLETE TRIDENT

- Custo no inventário: **R$ 62,58** · preço: R$ 2,00 · saldo: 2 un · inflado: **R$ 125,16**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## NATHYDRAS  ·  _ENCALHADA_

### 45512 — REPARADOR DE PONTAS ALHO 30ML

- Custo no inventário: **R$ 13,75** · preço: R$ 0,01 · saldo: 9 un · inflado: **R$ 123,75**
- Evidência: custo é 1.375x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## JC BIJUTERIAS  ·  _MORTA_

### 42519 — FAIXA BANANA JC IMPORT

- Custo no inventário: **R$ 118,80** · preço: R$ 24,90 · saldo: 1 un · inflado: **R$ 118,80**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## RISQUE  ·  _ATIVA_

### 5202 — ESMALTE RISQUE GRAO DE CAFE

- Custo no inventário: **R$ 16,53** · preço: R$ 4,90 · saldo: 5 un · inflado: **R$ 82,65**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 52594 — ESM RISQUE DEUSAS INSPIRACAO DIVINA C/6

- Custo no inventário: **R$ 6,29** · preço: R$ 1,83 · saldo: 4 un · inflado: **R$ 25,16**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## ANTONIO BANDERAS  ·  _ENCALHADA_

### 54877 — AVENTAL 30 ANOS - Lote: 4057090825

- Custo no inventário: **R$ 32,30** · preço: R$ 0,01 · saldo: 3 un · inflado: **R$ 96,90**
- Evidência: custo é 3.230x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## IMPORTADOS  ·  _ENCALHADA_

### 43842 — SACOLA CASA DA BELEZA 60X70

- Custo no inventário: **R$ 0,60** · preço: R$ 0,01 · saldo: 150 un · inflado: **R$ 90,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,60
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## ZGY  ·  _ENCALHADA_

### 1344 — PRESILHA COM 3

- Custo no inventário: **R$ 10,97** · preço: R$ 0,02 · saldo: 2 un · inflado: **R$ 21,94**
- Evidência: custo é 548x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

### 11440 — COLAR COM PIGENTE

- Custo no inventário: **R$ 16,33** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 16,33**
- Evidência: custo é 1.633x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

### 15743 — PIRANHA FOLHA COM PEDRARIA

- Custo no inventário: **R$ 14,33** · preço: R$ 0,90 · saldo: 1 un · inflado: **R$ 14,33**
- Evidência: preço de R$ 0,90 com custo de R$ 14,33
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1356 — PIRANHA GRANDE PLASTICO

- Custo no inventário: **R$ 7,74** · preço: R$ 0,02 · saldo: 1 un · inflado: **R$ 7,74**
- Evidência: custo é 387x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,02) provavelmente está certo.

## RUBY ROSE  ·  _ENCALHADA_

### 65568 — RR-853/1 PO FACIAL COMPACTO MELU RUBY ROSE RR-853-1

- Custo no inventário: **R$ 8,36** · preço: R$ 1,78 · saldo: 5 un · inflado: **R$ 41,80**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58466 — DELINEADOR LIQUIDO PRETO RUBY ROSE

- Custo no inventário: **R$ 10,00** · preço: R$ 1,70 · saldo: 1 un · inflado: **R$ 10,00**
- Evidência: custo 5,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## NOVO TOQUE  ·  _ENCALHADA_

### 61696 — PROTAGONISTA GLITTER 8ML

- Custo no inventário: **R$ 23,40** · preço: R$ 4,90 · saldo: 2 un · inflado: **R$ 46,80**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** — **confirmar na nota antes de gravar**. Com 5, o custo cai de R$ 23,40 para R$ 4,68, margem de 5% sobre R$ 4,90.
- Efeito: o estoque reduz R$ 37,44 (correção, não perda)

## DALLA MAKEUP  ·  _FANTASMA_

### 16108 — PO COMP DALLA 07

- Custo no inventário: **R$ 29,25** · preço: R$ 8,90 · saldo: 1 un · inflado: **R$ 29,25**
- Evidência: 0 entrada e 0 venda desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo e nenhum movimento em 3 anos e meio — provavelmente não existe na loja. Ver a parte B.

## BANA BANA  ·  _SAINDO_

### 30784 — BOMBOM

- Custo no inventário: **R$ 25,00** · preço: R$ 1,00 · saldo: 1 un · inflado: **R$ 25,00**
- Evidência: custo 25,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## CELINA MINI BIJUTERIAS  ·  _ENCALHADA_

### 57265 — MASCARA PROTETORA FACIAL MATERIAL TECI

- Custo no inventário: **R$ 20,00** · preço: R$ 3,90 · saldo: 1 un · inflado: **R$ 20,00**
- Evidência: custo 5,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

## YAMÁ  ·  _ATIVA_

### 48376 — CARTAZ FASHION COLOR ARGAN

- Custo no inventário: **R$ 0,30** · preço: R$ 0,01 · saldo: 40 un · inflado: **R$ 12,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,30
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

## BRILHARE  ·  _ENCALHADA_

### 44616 — COLAR PIGENTE PEDRA - F27-421551

- Custo no inventário: **R$ 6,90** · preço: R$ 0,01 · saldo: 1 un · inflado: **R$ 6,90**
- Evidência: custo é 690x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota. O preço (R$ 0,01) provavelmente está certo.

## HUNKY MODAS  ·  _ENCALHADA_

### 52150 — ELASTICO (1PT C/100PCS) ELA-033

- Custo no inventário: **R$ 3,50** · preço: R$ 0,50 · saldo: 1 un · inflado: **R$ 3,50**
- Evidência: preço de R$ 0,50 com custo de R$ 3,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


---

# Parte B — que marcas ainda existem na loja

Medido por entrada e venda desde 01/01/2023. Marca com saldo e nenhum movimento em três
anos e meio quase certamente não está na prateleira — é saldo que ficou no sistema.

| Situação | Marcas | Peças | Valor | O que significa |
|---|---:|---:|---:|---|
| **FANTASMA** | 85 | 1.116 | R$ 14.291,78 | saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja |
| **MORTA** | 83 | 9.774 | R$ 133.065,33 | não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual |
| **SAINDO** | 43 | 2.200 | R$ 35.348,39 | não se compra mais, mas ainda gira |
| **ENCALHADA** | 62 | 30.848 | R$ 366.580,95 | ainda se compra, mas o saldo dá mais de 3 anos |
| **ATIVA** | 87 | 28.284 | R$ 479.847,31 | compra e gira |

## FANTASMA — saldo com **0 entrada e 0 venda** desde 2023 — quase certamente não existe na loja

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| EL CAPITAN 1963 | 8 | 38 | R$ 1.458,00 | 0 | 0 |
| CRUZEIRO MALAS | 7 | 7 | R$ 1.432,01 | 0 | 0 |
| TECHNOS | 9 | 9 | R$ 1.375,77 | 0 | 0 |
| KERANZA | 29 | 29 | R$ 876,90 | 0 | 0 |
| BEYOUNG | 7 | 17 | R$ 705,75 | 0 | 0 |
| MISS LARY | 17 | 85 | R$ 699,12 | 0 | 0 |
| ZARTTE | 32 | 41 | R$ 683,20 | 0 | 0 |
| BITARRA | 36 | 68 | R$ 674,24 | 0 | 0 |
| MODALLI | 7 | 7 | R$ 623,00 | 0 | 0 |
| LINDO FOR NAIL | 3 | 64 | R$ 534,60 | 0 | 0 |
| D.KA COSMETICOS | 23 | 23 | R$ 464,47 | 0 | 0 |
| MAKE MORE | 29 | 31 | R$ 432,69 | 0 | 0 |
| FAND MAKEUP | 21 | 43 | R$ 431,13 | 0 | 0 |
| TRACTA | 29 | 38 | R$ 383,40 | 0 | 0 |
| DALLA MAKEUP | 49 | 70 | R$ 361,98 | 0 | 0 |
| DARUS | 1 | 1 | R$ 308,85 | 0 | 0 |
| O BARBUDO | 3 | 14 | R$ 238,38 | 0 | 0 |
| VIEW | 10 | 34 | R$ 231,37 | 0 | 0 |
| ANA PAULA MARCAL | 3 | 7 | R$ 216,00 | 0 | 0 |
| P&W | 1 | 4 | R$ 210,56 | 0 | 0 |
| TOP BEAUTY | 42 | 51 | R$ 198,73 | 0 | 0 |
| BLANT | 8 | 15 | R$ 168,66 | 0 | 0 |
| MURIEL | 4 | 4 | R$ 160,29 | 0 | 0 |
| CORPO DOURADO | 6 | 14 | R$ 159,56 | 0 | 0 |
| SLT COM DE BIJUT | 1 | 2 | R$ 135,24 | 0 | 0 |
| GULOSEIMAS | 2 | 22 | R$ 125,36 | 0 | 0 |
| MOD´ACC | 2 | 2 | R$ 96,00 | 0 | 0 |
| CRISTAL AÇO | 1 | 1 | R$ 89,90 | 0 | 0 |
| MARI´S | 2 | 10 | R$ 71,92 | 0 | 0 |
| TUON COSMETICOS | 2 | 2 | R$ 66,06 | 0 | 0 |
| KIRKLAND | 1 | 1 | R$ 55,00 | 0 | 0 |
| CAPIM LIMÃO | 14 | 14 | R$ 49,18 | 0 | 0 |
| VISION ART | 1 | 8 | R$ 47,92 | 0 | 0 |
| LIT | 7 | 7 | R$ 46,68 | 0 | 0 |
| CAT MAKE | 3 | 11 | R$ 35,37 | 0 | 0 |
| MAGIC | 1 | 1 | R$ 29,50 | 0 | 0 |
| BRUNO FABRICA | 1 | 28 | R$ 28,00 | 0 | 0 |
| EDELLE | 1 | 1 | R$ 28,00 | 0 | 0 |
| MARU | 1 | 1 | R$ 27,64 | 0 | 0 |
| EXPRESSAO FACIAL | 1 | 1 | R$ 27,46 | 0 | 0 |
| HINODE | 6 | 6 | R$ 25,05 | 0 | 0 |
| BEM MENINNINHA | 1 | 1 | R$ 21,88 | 0 | 0 |
| NATUHAIR | 2 | 2 | R$ 21,78 | 0 | 0 |
| SUPER BOND | 1 | 6 | R$ 20,58 | 0 | 0 |
| QUEM BEAUTY | 9 | 69 | R$ 18,98 | 0 | 0 |
| ADESIVO ARTESENAL | 2 | 12 | R$ 18,59 | 0 | 0 |
| CERA ORG | 1 | 1 | R$ 18,33 | 0 | 0 |
| MEILYS | 9 | 13 | R$ 17,55 | 0 | 0 |
| MAX BRASIL | 3 | 3 | R$ 17,40 | 0 | 0 |
| DELION | 2 | 17 | R$ 15,49 | 0 | 0 |
| ZANPHY | 1 | 1 | R$ 15,00 | 0 | 0 |
| BY ART BIJOUX | 1 | 1 | R$ 13,86 | 0 | 0 |
| CONDOR | 1 | 1 | R$ 12,00 | 0 | 0 |
| MAIS VAIDOSA | 1 | 1 | R$ 10,75 | 0 | 0 |
| HONEYGRIL | 1 | 7 | R$ 10,50 | 0 | 0 |
| MYLE | 2 | 2 | R$ 10,33 | 0 | 0 |
| DERMA CHEM | 2 | 2 | R$ 8,38 | 0 | 0 |
| GOLD | 1 | 1 | R$ 5,94 | 0 | 0 |
| BIJOUX | 1 | 1 | R$ 5,24 | 0 | 0 |
| MONANGE | 1 | 1 | R$ 5,14 | 0 | 0 |
| IMPORTADORA JF | 3 | 3 | R$ 2,92 | 0 | 0 |
| KESS | 2 | 2 | R$ 2,75 | 0 | 0 |
| ANGELICA | 1 | 1 | R$ 1,00 | 0 | 0 |
| P E BIJU | 1 | 1 | R$ 1,00 | 0 | 0 |
| VILMA SIMON BIJOUTERIA | 1 | 1 | R$ 1,00 | 0 | 0 |
| DOCILE | 3 | 94 | R$ 0,94 | 0 | 0 |
| CLIA | 1 | 1 | R$ 0,80 | 0 | 0 |
| MEY BRASIL | 1 | 1 | R$ 0,33 | 0 | 0 |
| JACK DESIGN | 9 | 9 | R$ 0,09 | 0 | 0 |
| SERGIO LUIS | 7 | 7 | R$ 0,07 | 0 | 0 |
| CHERIE | 4 | 4 | R$ 0,04 | 0 | 0 |
| VICENZO BIJOUTERIAS | 2 | 3 | R$ 0,03 | 0 | 0 |
| ELSEVE | 1 | 2 | R$ 0,02 | 0 | 0 |
| JESSICA DI NETTI | 1 | 2 | R$ 0,02 | 0 | 0 |
| BELLACOTTON | 1 | 1 | R$ 0,01 | 0 | 0 |
| BIOTROPICS | 1 | 1 | R$ 0,01 | 0 | 0 |
| CASA BELEZA | 1 | 1 | R$ 0,01 | 0 | 0 |
| CN CLARA PRESENTE | 1 | 1 | R$ 0,01 | 0 | 0 |
| DAYANE BOLSAS | 1 | 1 | R$ 0,01 | 0 | 0 |
| EDEN COMERCIO | 1 | 1 | R$ 0,01 | 0 | 0 |
| EFE COMERCIO | 1 | 1 | R$ 0,01 | 0 | 0 |
| ELIANE | 1 | 1 | R$ 0,01 | 0 | 0 |
| EMILI STAR | 1 | 1 | R$ 0,01 | 0 | 0 |
| EZFLOW | 1 | 1 | R$ 0,01 | 0 | 0 |
| VERY RYO | 1 | 1 | R$ 0,01 | 0 | 0 |

## MORTA — não se compra e o saldo dá **mais de 3 anos** de venda no ritmo atual

| Marca | Produtos | Peças | Valor | Entrou | Vendeu |
|---|---:|---:|---:|---:|---:|
| FUSECO | 41 | 256 | R$ 13.963,26 | 0 | 31 |
| ESTILO DA MULHER | 124 | 1.811 | R$ 13.918,64 | 0 | 232 |
| PLAYBOY | 8 | 294 | R$ 8.733,64 | 0 | 266 |
| VOLIA | 23 | 768 | R$ 6.658,66 | 0 | 44 |
| TERRA SANTA | 13 | 15 | R$ 6.605,33 | 0 | 1 |
| OCEANE | 69 | 335 | R$ 6.482,94 | 0 | 75 |
| FOREVER LISS | 42 | 248 | R$ 5.308,05 | 0 | 40 |
| ANASOL | 7 | 121 | R$ 4.297,14 | 0 | 21 |
| WAHL | 22 | 64 | R$ 4.239,10 | 0 | 53 |
| RIO OCEAN | 42 | 250 | R$ 4.106,38 | 0 | 6 |
| LOREAL | 28 | 36 | R$ 3.981,42 | 0 | 6 |
| BABYLISS | 6 | 14 | R$ 3.028,02 | 0 | 2 |
| REAL LOVE | 85 | 323 | R$ 2.910,00 | 0 | 225 |
| ESCOBEL | 17 | 126 | R$ 2.782,23 | 0 | 10 |
| LATIKA | 83 | 148 | R$ 2.768,28 | 0 | 53 |
| FREDERIKA MAKE | 98 | 245 | R$ 2.672,29 | 0 | 180 |
| LUCKSTAR | 39 | 248 | R$ 2.421,81 | 0 | 58 |
| BELT-ME | 14 | 22 | R$ 2.209,25 | 0 | 10 |
| VOGUE | 23 | 27 | R$ 2.196,40 | 0 | 2 |
| TANY | 16 | 138 | R$ 1.943,00 | 0 | 92 |
| NIELY | 92 | 98 | R$ 1.843,23 | 0 | 13 |
| NITZY | 24 | 57 | R$ 1.809,00 | 0 | 10 |
| AMIGOLD | 11 | 531 | R$ 1.745,31 | 0 | 22 |
| NATI NAO USAR | 65 | 176 | R$ 1.394,17 | 0 | 188 |
| DAYMAKEUP | 49 | 51 | R$ 1.302,03 | 0 | 19 |
| LUCKY GIRL | 36 | 39 | R$ 1.269,42 | 0 | 41 |
| VERMONTH IMPORTAÇÃO | 23 | 41 | R$ 1.215,85 | 0 | 30 |
| VISAGE | 35 | 76 | R$ 1.214,36 | 0 | 10 |
| VIVATTI | 8 | 9 | R$ 1.080,18 | 0 | 3 |
| LUDURANA NAO USAR | 41 | 156 | R$ 1.062,52 | 0 | 186 |
| MISS ROSE | 11 | 75 | R$ 1.057,65 | 0 | 7 |
| MADAMELIS | 13 | 49 | R$ 1.040,81 | 0 | 43 |
| BIG UNIVERSO | 64 | 379 | R$ 959,54 | 0 | 2 |
| CAPICILIN | 9 | 11 | R$ 939,62 | 0 | 1 |
| MISS FRANDY | 62 | 334 | R$ 912,16 | 0 | 45 |
| M/Q | 4 | 4 | R$ 785,86 | 0 | 1 |
| AN BOLSAS | 17 | 17 | R$ 782,68 | 0 | 1 |
| YENZAH | 16 | 38 | R$ 755,23 | 0 | 41 |
| MISS BELEZA | 38 | 57 | R$ 751,50 | 0 | 22 |
| NAIL QUEEN | 15 | 34 | R$ 705,68 | 0 | 11 |
| BAG BRANDS | 8 | 8 | R$ 692,00 | 0 | 7 |
| KERT | 16 | 33 | R$ 653,83 | 0 | 2 |
| DEPILAR | 12 | 63 | R$ 650,00 | 0 | 74 |
| NATHALYA | 5 | 529 | R$ 595,82 | 0 | 57 |
| G-HAIR | 8 | 25 | R$ 549,31 | 0 | 26 |
| ANITA | 74 | 86 | R$ 549,01 | 0 | 15 |
| MUY BIELA | 13 | 13 | R$ 519,65 | 0 | 7 |
| BITARRA BEAUTY | 40 | 46 | R$ 501,93 | 0 | 4 |
| DILCINTIA BEAUTY | 25 | 64 | R$ 387,57 | 0 | 44 |
| 7LOBOS IMPORTADORA | 7 | 31 | R$ 382,58 | 0 | 11 |
| HANOVA | 22 | 22 | R$ 373,87 | 0 | 2 |
| TUCA | 7 | 39 | R$ 352,52 | 0 | 12 |
| BF BRASIL | 11 | 27 | R$ 348,11 | 0 | 4 |
| CAPELLA | 5 | 16 | R$ 323,70 | 0 | 2 |
| LP IMPORTADOS | 13 | 39 | R$ 316,84 | 0 | 5 |
| VIVI | 5 | 34 | R$ 250,18 | 0 | 17 |
| MEU MEU BIJOUTERIAS | 49 | 93 | R$ 240,94 | 0 | 3 |
| JC BIJUTERIAS | 12 | 12 | R$ 239,15 | 0 | 2 |
| ANAIRANA | 48 | 106 | R$ 193,00 | 0 | 1 |
| MANDALA | 2 | 8 | R$ 162,88 | 0 | 2 |
| JC IMPORT | 32 | 54 | R$ 152,82 | 0 | 19 |
| NEW BEAUTY | 6 | 6 | R$ 129,65 | 0 | 7 |
| LEO BIJUTERIAS E ACESSORIOS | 7 | 15 | R$ 119,00 | 0 | 7 |
| MINU COMERCIO | 7 | 7 | R$ 108,00 | 0 | 3 |
| NAVINA | 2 | 11 | R$ 98,41 | 0 | 12 |
| DILCINTA | 4 | 13 | R$ 57,91 | 0 | 4 |
| FAMOSA | 5 | 10 | R$ 56,14 | 0 | 1 |
| TRICOFACIL | 1 | 1 | R$ 50,92 | 0 | 1 |
| ZURIQUE COMERCIAL E VRIEDADES | 10 | 31 | R$ 39,73 | 0 | 25 |
| FASHION HAIR | 1 | 3 | R$ 32,76 | 0 | 3 |
| LE VANGEE | 2 | 2 | R$ 18,90 | 0 | 1 |
| ROMA BRASIL | 7 | 7 | R$ 15,27 | 0 | 5 |
| AK ACESSORIOS | 1 | 5 | R$ 14,80 | 0 | 2 |
| ANNY BIJOUTERIAS | 3 | 3 | R$ 13,29 | 0 | 1 |
| POPDRAT | 1 | 1 | R$ 11,12 | 0 | 1 |
| ICEKISS | 9 | 480 | R$ 4,80 | 0 | 73 |
| ACRI ARTE | 3 | 3 | R$ 3,00 | 0 | 1 |
| MERHEJE | 1 | 1 | R$ 1,23 | 0 | 1 |
| PAR PERFEITO | 1 | 1 | R$ 1,00 | 0 | 1 |
| BOZZANO | 1 | 99 | R$ 0,99 | 0 | 1 |
| YOU CARE | 3 | 4 | R$ 0,04 | 0 | 1 |
| ART METAL | 1 | 1 | R$ 0,01 | 0 | 1 |
| INOX | 1 | 1 | R$ 0,01 | 0 | 1 |

