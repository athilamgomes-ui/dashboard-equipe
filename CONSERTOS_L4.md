# Consertos de estoque — L4 · MissBeleza Altamira

**268 produtos · R$ 162.262,78 de valor que o sistema mostra e não existe.**

Critério: custo médio maior que 3x o preço de venda, com saldo nesta loja. Margem apertada
acontece; vender a menos de um terço do custo, não — isso é dado errado, não negócio ruim.

Fonte: snapshot do pipeline de estoque (26/08) + histórico de compra/venda desde 2023.
Onde aparece ✅, o custo foi conferido lendo a nota de entrada no ERP.

## Resumo do que fazer

| Tipo de conserto | Produtos | Valor envolvido | Quem resolve |
|---|---:|---:|---|
| saldo sem origem | 194 | R$ 97.181,09 | contagem física na loja |
| fator de conversão | 9 | R$ 22.305,74 | quem dá entrada de NF (cadastro do produto) |
| custo corrompido | 19 | R$ 21.403,90 | ajuste de custo no ERP |
| conferir a nota | 21 | R$ 10.572,61 | abrir a nota primeiro |
| fator a confirmar | 7 | R$ 7.490,82 | abrir a nota primeiro |
| fator de conversão (qtd estimada) | 11 | R$ 2.762,25 | — |
| preço a conferir | 7 | R$ 546,37 | quem define preço |

> **A ordem importa:** corrigir o fator de conversão ANTES do custo. Se corrigir só o
> custo, a próxima nota daquele produto reintroduz o erro, porque a entrada continua
> lançando pacote como peça.

---

## NATHY

_9 produto(s) · R$ 31.953,31_

### 49392 — 1090ALGODAO CARD HID NATHY 100G BOLA

- Custo no ERP: **R$ 144,32** · preço de venda: R$ 0,08 · saldo: 98 un · valor inflado: **R$ 14.143,36**
- Evidência: custo é 1.804x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,08) provavelmente está certo.

### 49391 — 490CX ALGODAO CARD HID NATHY 25G

- Custo no ERP: **R$ 184,80** · preço de venda: R$ 0,02 · saldo: 22 un · valor inflado: **R$ 4.065,60**
- Evidência: custo é 9.240x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 17704 — BABY FD ALGODAO CARD HID NATHYBABY 40G BOLA

- Custo no ERP: **R$ 172,48** · preço de venda: R$ 4,00 · saldo: 20 un · valor inflado: **R$ 3.449,60**
- Evidência: o nome diz 'FD' mas não diz quantas peças
- **Conserto:** **Abrir a nota** e descobrir quantas peças vêm no FD. Provável fator de conversão.

### 49393 — FD ALGODAO CARD HID NATHY 250G ROLO 40UN/FD

- Custo no ERP: **R$ 242,11** · preço de venda: R$ 0,42 · saldo: 11 un · valor inflado: **R$ 2.663,21**
- Evidência: no nome: 40UN por fardo · ✅ NF 32238/1 — 5,00 UN a R$ 254,80 (ERS)
- **Conserto:** Parece embalagem de 40, mas R$ 242,11 ÷ 40 = R$ 6,05, que ainda passa do preço de R$ 0,42. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,42 também não se sustenta — conferir os dois, custo e preço.

### 60951 — CX ALGODAO CARD HID NATHY 50G

- Custo no ERP: **R$ 184,80** · preço de venda: R$ 0,03 · saldo: 11 un · valor inflado: **R$ 2.032,80**
- Evidência: custo é 6.160x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,03) provavelmente está certo.

### 11043 — ALGODAO CARD HID NATHY 25G BOLA

- Custo no ERP: **R$ 204,16** · preço de venda: R$ 2,32 · saldo: 9 un · valor inflado: **R$ 1.837,44**
- Evidência: custo 88,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 49396 — ALGODAO CARD HID NATHY 50G BOLA 5PACKS

- Custo no ERP: **R$ 165,44** · preço de venda: R$ 4,00 · saldo: 11 un · valor inflado: **R$ 1.819,84**
- Evidência: custo 41,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 49395 — FD ALGODAO CARD HID NATHY 500G ROLO 20UN/FD

- Custo no ERP: **R$ 229,80** · preço de venda: R$ 31,90 · saldo: 7 un · valor inflado: **R$ 1.608,60**
- Evidência: no nome: 20UN por fardo
- **Conserto:** Cadastrar **fator de conversão = 20** (está no nome do produto). O custo unitário cai de R$ 229,80 para **R$ 11,49** — margem de 178% sobre o preço de R$ 31,90.
- Efeito: o estoque desta loja reduz R$ 1.528,17 (correção, não perda)

### 58969 — ALGODAO QUADRADINHO 40G CARD HID NATHY

- Custo no ERP: **R$ 166,43** · preço de venda: R$ 3,94 · saldo: 2 un · valor inflado: **R$ 332,86**
- Evidência: custo 42,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## KISS NEW YORK

_5 produto(s) · R$ 22.885,28_

### 204099 — KISS NY NAVALHA SOBRANC CURTO (72 UN)

- Custo no ERP: **R$ 243,72** · preço de venda: R$ 6,90 · saldo: 59 un · valor inflado: **R$ 14.379,48**
- Evidência: no nome: (72 UN) · comprou 1, vendeu 12 (razão 12x) · ✅ NF 553874/1 — 1,00 UN a R$ 253,87 (IMBECOR)
- **Conserto:** Cadastrar **fator de conversão = 72** (está no nome do produto). O custo unitário cai de R$ 243,72 para **R$ 3,38** — margem de 104% sobre o preço de R$ 6,90.
- Efeito: o estoque desta loja reduz R$ 14.179,77 (correção, não perda)

### 204098 — KISS NY NAVALHA SOBRANC LONGO (72 UN)

- Custo no ERP: **R$ 243,72** · preço de venda: R$ 6,90 · saldo: 25 un · valor inflado: **R$ 6.093,00**
- Evidência: no nome: (72 UN) · comprou 1, vendeu 38 (razão 38x) · ✅ NF 553874/1 — 1,00 UN a R$ 253,87 (IMBECOR)
- **Conserto:** Cadastrar **fator de conversão = 72** (está no nome do produto). O custo unitário cai de R$ 243,72 para **R$ 3,38** — margem de 104% sobre o preço de R$ 6,90.
- Efeito: o estoque desta loja reduz R$ 6.008,38 (correção, não perda)

### 11100 — KISS NY NAVALHA SOBRANC LONGO

- Custo no ERP: **R$ 234,51** · preço de venda: R$ 6,90 · saldo: 10 un · valor inflado: **R$ 2.345,10**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 28365 — LIXA BLOCO 4 FACES KISS

- Custo no ERP: **R$ 3,45** · preço de venda: R$ 0,33 · saldo: 10 un · valor inflado: **R$ 34,50**
- Evidência: preço de R$ 0,33 com custo de R$ 3,45
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 28367 — KISS NY PINCA PONTA FINA

- Custo no ERP: **R$ 3,32** · preço de venda: R$ 0,08 · saldo: 10 un · valor inflado: **R$ 33,20**
- Evidência: comprou 1, vendeu 292 (razão 292x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~292 peças** (estimativa: comprou 1, vendeu 292) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 292, o custo unitário cai de R$ 3,32 para R$ 0,01, margem de 604% sobre R$ 0,08.
- Efeito: o estoque desta loja reduz R$ 33,09 (correção, não perda)


## MACRILAN

_32 produto(s) · R$ 22.546,35_

### 202307 — KIT MADEMOISELLE MACRILAN

- Custo no ERP: **R$ 703,40** · preço de venda: R$ 122,10 · saldo: 3 un · valor inflado: **R$ 2.110,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78330 — PINCEL CONICO ILUMINAR P-03 MACRILAN

- Custo no ERP: **R$ 138,70** · preço de venda: R$ 30,88 · saldo: 12 un · valor inflado: **R$ 1.664,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78360 — PINCEL KABUKI PRETO B115 MACRILAN

- Custo no ERP: **R$ 150,85** · preço de venda: R$ 29,78 · saldo: 8 un · valor inflado: **R$ 1.206,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78328 — PINCEL P/ CONTORNO MAQ MAX A-19 MACRILAN

- Custo no ERP: **R$ 146,63** · preço de venda: R$ 32,65 · saldo: 8 un · valor inflado: **R$ 1.173,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78356 — APONTADOR PARA LAPIS MAQUIAGEM MACRILAN

- Custo no ERP: **R$ 140,80** · preço de venda: R$ 9,90 · saldo: 8 un · valor inflado: **R$ 1.126,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202302 — PINCEL CONICO M P/ ESFUMAR MAX A35 MACRILAN

- Custo no ERP: **R$ 88,09** · preço de venda: R$ 15,28 · saldo: 11 un · valor inflado: **R$ 968,99**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78331 — PINCEL PARA ILUMINAR P-07 MACRILAN

- Custo no ERP: **R$ 89,16** · preço de venda: R$ 19,85 · saldo: 10 un · valor inflado: **R$ 891,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78332 — PINCEL CONICO PARA ILUMINAR P-08 MACRILAN

- Custo no ERP: **R$ 74,30** · preço de venda: R$ 16,54 · saldo: 12 un · valor inflado: **R$ 891,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202305 — COLA CILIOS POSTICOS PRETA - MACRILAN

- Custo no ERP: **R$ 88,09** · preço de venda: R$ 15,28 · saldo: 10 un · valor inflado: **R$ 880,90**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202301 — PINCEL KABUKI GOTA PRECIS MAX MACRILAN

- Custo no ERP: **R$ 142,31** · preço de venda: R$ 24,70 · saldo: 6 un · valor inflado: **R$ 853,86**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78359 — KIT 5 ESPONJAS

- Custo no ERP: **R$ 73,75** · preço de venda: R$ 14,56 · saldo: 11 un · valor inflado: **R$ 811,25**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202303 — PINCEL PROF DUO FIBER TOPO RETO A39 MACRILAN

- Custo no ERP: **R$ 134,85** · preço de venda: R$ 23,40 · saldo: 6 un · valor inflado: **R$ 809,10**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 6517 — PINCEL P/ CONTORNO MAQ MAX - A16 MACRILAN

- Custo no ERP: **R$ 134,17** · preço de venda: R$ 16,00 · saldo: 6 un · valor inflado: **R$ 805,02**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78339 — PINCEL LAPIS ESFUMAR P-15 MACRILAN

- Custo no ERP: **R$ 68,36** · preço de venda: R$ 15,22 · saldo: 11 un · valor inflado: **R$ 751,96**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78341 — KIT COM 5 PINCEIS E 3 PULSEIRA MACRILAN

- Custo no ERP: **R$ 372,27** · preço de venda: R$ 6,49 · saldo: 2 un · valor inflado: **R$ 744,54**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78336 — PINCEL CONICO ESFUMAR P-12 MACRILAN

- Custo no ERP: **R$ 74,30** · preço de venda: R$ 16,54 · saldo: 10 un · valor inflado: **R$ 743,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78334 — PINCEL ARREDONDADO SOMBRA P-10 MACRILAN

- Custo no ERP: **R$ 64,40** · preço de venda: R$ 14,34 · saldo: 11 un · valor inflado: **R$ 708,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78338 — PINCEL PRECISAO ESFUMAR P-14 MACRILAN

- Custo no ERP: **R$ 64,40** · preço de venda: R$ 14,34 · saldo: 11 un · valor inflado: **R$ 708,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202306 — PINCEL PROFISSIONAL PARA FACE MACRILAN

- Custo no ERP: **R$ 100,97** · preço de venda: R$ 17,52 · saldo: 6 un · valor inflado: **R$ 605,82**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78337 — PINCEL PRECISAO CONICO ESFUMAR P-13 MACRILAN

- Custo no ERP: **R$ 72,33** · preço de venda: R$ 16,10 · saldo: 8 un · valor inflado: **R$ 578,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78340 — PINCEL PARA DELINEAR P-16 MACRILAN

- Custo no ERP: **R$ 54,49** · preço de venda: R$ 12,13 · saldo: 10 un · valor inflado: **R$ 544,90**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202310 — ESPELHO DE AUMENTO C/ VENTOSA - MACRILAN

- Custo no ERP: **R$ 79,96** · preço de venda: R$ 15,24 · saldo: 6 un · valor inflado: **R$ 479,76**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78329 — PINCEL CONICO PARA P-02 MACRILAN

- Custo no ERP: **R$ 133,75** · preço de venda: R$ 29,78 · saldo: 3 un · valor inflado: **R$ 401,25**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64584 — ESPONJA GOTA PARA MAQUIAGEM MACRILAN

- Custo no ERP: **R$ 36,29** · preço de venda: R$ 8,71 · saldo: 10 un · valor inflado: **R$ 362,90**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 556 — PINCEL PROF OVAL PRECISAO MAX - A05 MACRILAN

- Custo no ERP: **R$ 176,19** · preço de venda: R$ 23,00 · saldo: 2 un · valor inflado: **R$ 352,38**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78335 — PINCEL  PRECISAO SOMBRA P-11

- Custo no ERP: **R$ 54,49** · preço de venda: R$ 12,13 · saldo: 6 un · valor inflado: **R$ 326,94**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202304 — COLA TRANSPARENTE PARA CILIOS - MACRILAN

- Custo no ERP: **R$ 88,09** · preço de venda: R$ 15,28 · saldo: 3 un · valor inflado: **R$ 264,27**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78355 — ESPONJA GOTA PARA MAQUIAGEM - MACRILAN

- Custo no ERP: **R$ 50,20** · preço de venda: R$ 0,72 · saldo: 4 un · valor inflado: **R$ 200,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202309 — TRIO DE ESPONJAS MACRILAN

- Custo no ERP: **R$ 94,20** · preço de venda: R$ 16,34 · saldo: 2 un · valor inflado: **R$ 188,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78362 — ESPONJA GOTA CHANFRADA P/ MAQUIAGEM - MACRILAN

- Custo no ERP: **R$ 53,73** · preço de venda: R$ 0,73 · saldo: 3 un · valor inflado: **R$ 161,19**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78333 — PINCEL PRECISAO CONTORNO P-09 MACRILAN

- Custo no ERP: **R$ 74,30** · preço de venda: R$ 16,54 · saldo: 2 un · valor inflado: **R$ 148,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 202308 — ESPONJA PARA MAQUIAGEM REDONDA - MACRILAN

- Custo no ERP: **R$ 40,52** · preço de venda: R$ 7,02 · saldo: 2 un · valor inflado: **R$ 81,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## LUDURANA NAO USAR

_18 produto(s) · R$ 10.441,34_

### 58955 — DELINEADOR LIQUIDO PARA OLHOS 3ML PRETO

- Custo no ERP: **R$ 220,56** · preço de venda: R$ 18,90 · saldo: 10 un · valor inflado: **R$ 2.205,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58945 — QUARTETO DE BLUSH LUDURANA 12G

- Custo no ERP: **R$ 170,40** · preço de venda: R$ 28,90 · saldo: 10 un · valor inflado: **R$ 1.704,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58930 — BATOM LUDURANA LIQ. MATTE  CARMINE 4ML

- Custo no ERP: **R$ 82,68** · preço de venda: R$ 13,90 · saldo: 10 un · valor inflado: **R$ 826,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58932 — BATOM LUDURANA LIQ. MATTE  CEREJA 4ML

- Custo no ERP: **R$ 82,68** · preço de venda: R$ 13,90 · saldo: 10 un · valor inflado: **R$ 826,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58939 — QUARTETO DE SOMBRAS SIGNOS LEAO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 6 un · valor inflado: **R$ 712,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61983 — PALETA DE SOMBRAS 9 CORES OPULENCE

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 4 un · valor inflado: **R$ 596,32**
- Evidência: custo 5,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58938 — QUARTETO DE SOMBRAS SIGNOS ESCORPIAO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 4 un · valor inflado: **R$ 475,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58940 — QUARTETO DE SOMBRAS SIGNOS LIBRA

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 4 un · valor inflado: **R$ 475,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58941 — QUARTETO DE SOMBRAS SIGNOS SAGITARIO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 4 un · valor inflado: **R$ 475,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58942 — QUARTETO DE SOMBRAS SIGNOS TOURO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 4 un · valor inflado: **R$ 475,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58953 — PALETA DE SOMBRAS NUANCES 9 CORES  NUDE

- Custo no ERP: **R$ 181,20** · preço de venda: R$ 30,90 · saldo: 2 un · valor inflado: **R$ 362,40**
- Evidência: custo 5,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58937 — QUARTETO DE SOMBRAS SIGNOS CAPRICORNIO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 3 un · valor inflado: **R$ 356,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61979 — PALETA DE SOMBRAS CHERRY POP

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 2 un · valor inflado: **R$ 298,16**
- Evidência: custo 5,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 61982 — PALETA DE SOMBRAS 9 CORES  FANCY

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 2 un · valor inflado: **R$ 298,16**
- Evidência: custo 5,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58943 — QUARTETO DE SOMBRAS SIGNOS VIRGEM

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 2 un · valor inflado: **R$ 237,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61968 — ESMALTE LUDURANA CREMOSO NEON AMARELO SOLTO 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 3 un · valor inflado: **R$ 69,30**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 61969 — ESMALTE LUDURANA CREMOSO NEON  LARANJA SOLTO 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,10**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** (estimativa: comprou 1, vendeu 5) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 5, o custo unitário cai de R$ 23,10 para R$ 4,62, margem de 6% sobre R$ 4,90.
- Efeito: o estoque desta loja reduz R$ 18,48 (correção, não perda)

### 61970 — ESMALTE LUDURANA CREMOSO NEON ROSA  SOLTO 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,10**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** (estimativa: comprou 1, vendeu 5) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 5, o custo unitário cai de R$ 23,10 para R$ 4,62, margem de 6% sobre R$ 4,90.
- Efeito: o estoque desta loja reduz R$ 18,48 (correção, não perda)


## SANTA CLARA

_10 produto(s) · R$ 10.383,92_

### 17665 — TOALHA COMP MULT DESC 250

- Custo no ERP: **R$ 37,40** · preço de venda: R$ 1,00 · saldo: 230 un · valor inflado: **R$ 8.602,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1731 — PALITO UNHA CHANF UN SANTA CLARA

- Custo no ERP: **R$ 16,83** · preço de venda: R$ 2,90 · saldo: 37 un · valor inflado: **R$ 622,71**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 4241 — LAMINA SUPER MAX ST CLARA 354

- Custo no ERP: **R$ 13,00** · preço de venda: R$ 3,90 · saldo: 42 un · valor inflado: **R$ 546,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 5519 — PO ADGISTRENTE SANTA CLARA 20G

- Custo no ERP: **R$ 42,88** · preço de venda: R$ 0,92 · saldo: 10 un · valor inflado: **R$ 428,80**
- Evidência: comprou 4, vendeu 48 (razão 12x)
- **Conserto:** Parece embalagem de 12, mas R$ 42,88 ÷ 12 = R$ 3,57, que ainda passa do preço de R$ 0,92. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,92 também não se sustenta — conferir os dois, custo e preço.

### 78766 — ESPATULA DUPLA PRATA 180G C/25

- Custo no ERP: **R$ 6,54** · preço de venda: R$ 1,90 · saldo: 8 un · valor inflado: **R$ 52,32**
- Evidência: no nome: C/25
- **Conserto:** Cadastrar **fator de conversão = 25** (está no nome do produto). O custo unitário cai de R$ 6,54 para **R$ 0,26** — margem de 626% sobre o preço de R$ 1,90.
- Efeito: o estoque desta loja reduz R$ 50,23 (correção, não perda)

### 204359 — ESCOVA LRJ/VR.N.FLEX COLOR

- Custo no ERP: **R$ 11,49** · preço de venda: R$ 1,06 · saldo: 3 un · valor inflado: **R$ 34,47**
- Evidência: custo 10,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 204360 — NAVALHETE PLASTICA CABO MARROM - SANTA CLARA

- Custo no ERP: **R$ 8,20** · preço de venda: R$ 1,06 · saldo: 4 un · valor inflado: **R$ 32,80**
- Evidência: custo 7,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 8637 — LENCOL DESC ST CLARA 15UN

- Custo no ERP: **R$ 14,46** · preço de venda: R$ 2,10 · saldo: 2 un · valor inflado: **R$ 28,92**
- Evidência: no nome: 15 UN
- **Conserto:** Cadastrar **fator de conversão = 15** (está no nome do produto). O custo unitário cai de R$ 14,46 para **R$ 0,96** — margem de 118% sobre o preço de R$ 2,10.
- Efeito: o estoque desta loja reduz R$ 26,99 (correção, não perda)

### 8036 — REFIL LIXA 12UN 753/754 S CLARA 2118

- Custo no ERP: **R$ 2,66** · preço de venda: R$ 0,50 · saldo: 10 un · valor inflado: **R$ 26,60**
- Evidência: no nome: 12 UN
- **Conserto:** Cadastrar **fator de conversão = 12** (está no nome do produto). O custo unitário cai de R$ 2,66 para **R$ 0,22** — margem de 126% sobre o preço de R$ 0,50.
- Efeito: o estoque desta loja reduz R$ 24,38 (correção, não perda)

### 48793 — LIXA MINI PRETA P/UNHAS C/20

- Custo no ERP: **R$ 0,93** · preço de venda: R$ 0,10 · saldo: 10 un · valor inflado: **R$ 9,30**
- Evidência: no nome: C/20
- **Conserto:** Cadastrar **fator de conversão = 20** (está no nome do produto). O custo unitário cai de R$ 0,93 para **R$ 0,05** — margem de 115% sobre o preço de R$ 0,10.
- Efeito: o estoque desta loja reduz R$ 8,84 (correção, não perda)


## JONALISSA BIJOUX LTDA

_14 produto(s) · R$ 7.400,40_

### 61567 — BOLSA  LUA WASHBAG

- Custo no ERP: **R$ 390,00** · preço de venda: R$ 81,90 · saldo: 10 un · valor inflado: **R$ 3.900,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62787 — LAÇO CHARME

- Custo no ERP: **R$ 90,00** · preço de venda: R$ 22,90 · saldo: 10 un · valor inflado: **R$ 900,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62789 — XUXINHA DE FITA

- Custo no ERP: **R$ 60,00** · preço de venda: R$ 15,90 · saldo: 10 un · valor inflado: **R$ 600,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62796 — PRESILHA

- Custo no ERP: **R$ 54,00** · preço de venda: R$ 14,90 · saldo: 9 un · valor inflado: **R$ 486,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62794 — ANEL COLORIDO DE PLASTICO

- Custo no ERP: **R$ 48,00** · preço de venda: R$ 3,90 · saldo: 7 un · valor inflado: **R$ 336,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62790 — TRIO DE GRAMPO

- Custo no ERP: **R$ 54,00** · preço de venda: R$ 13,90 · saldo: 5 un · valor inflado: **R$ 270,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62786 — LAÇO COLORIDO

- Custo no ERP: **R$ 84,00** · preço de venda: R$ 21,90 · saldo: 3 un · valor inflado: **R$ 252,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62784 — BICO DE PATO GIRASOL

- Custo no ERP: **R$ 72,00** · preço de venda: R$ 18,90 · saldo: 3 un · valor inflado: **R$ 216,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62788 — LAÇO DE PALHA XADREZ

- Custo no ERP: **R$ 108,00** · preço de venda: R$ 27,90 · saldo: 1 un · valor inflado: **R$ 108,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62783 — BICO DE PATO CHAPEU XADREZ

- Custo no ERP: **R$ 96,00** · preço de venda: R$ 24,90 · saldo: 1 un · valor inflado: **R$ 96,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62785 — GRAVATA XADREZ

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 8,90 · saldo: 3 un · valor inflado: **R$ 90,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62792 — BRINCO ARGOLA COLORIDA

- Custo no ERP: **R$ 36,00** · preço de venda: R$ 9,90 · saldo: 2 un · valor inflado: **R$ 72,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62791 — BRINCO COLORIDO BR329-7

- Custo no ERP: **R$ 42,00** · preço de venda: R$ 10,90 · saldo: 1 un · valor inflado: **R$ 42,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 7891 — PENTE PLASTICO LARGO

- Custo no ERP: **R$ 16,20** · preço de venda: R$ 3,00 · saldo: 2 un · valor inflado: **R$ 32,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## SALON PRO

_1 produto(s) · R$ 6.995,00_

### 58847 — COLA P/ CILIOS SALON PRO

- Custo no ERP: **R$ 699,50** · preço de venda: R$ 39,90 · saldo: 10 un · valor inflado: **R$ 6.995,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## NOVEX

_8 produto(s) · R$ 6.196,59_

### 53774 — Vitay Novex Superfood Maracuja&Mirtilo Sh+Trat Con

- Custo no ERP: **R$ 153,77** · preço de venda: R$ 24,90 · saldo: 10 un · valor inflado: **R$ 1.537,70**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53778 — Novex Superfood Cacau&Amendoas Cr Trat Cond 1kg

- Custo no ERP: **R$ 101,15** · preço de venda: R$ 32,90 · saldo: 10 un · valor inflado: **R$ 1.011,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53757 — Meus Cachos Recarga de Oleos Santo Black Cond 80g

- Custo no ERP: **R$ 76,94** · preço de venda: R$ 12,90 · saldo: 10 un · valor inflado: **R$ 769,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53761 — Novex Recarg aHidratacao Profunda SuperBabosao Con

- Custo no ERP: **R$ 76,94** · preço de venda: R$ 12,90 · saldo: 10 un · valor inflado: **R$ 769,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53763 — Novex Recarga Potassio Superfood Biomassa Banana 8

- Custo no ERP: **R$ 76,56** · preço de venda: R$ 12,90 · saldo: 10 un · valor inflado: **R$ 765,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53759 — Novex Recarga Vitam Superfood Marac&Mirtilo 80g

- Custo no ERP: **R$ 76,40** · preço de venda: R$ 12,90 · saldo: 10 un · valor inflado: **R$ 764,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53792 — Pelucia Mascara de Tratamento Jabuticaba Cond 500g

- Custo no ERP: **R$ 51,78** · preço de venda: R$ 16,90 · saldo: 10 un · valor inflado: **R$ 517,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53770 — Novex Superfood Biomassa de Banana Trat Cond 300mL

- Custo no ERP: **R$ 61,19** · preço de venda: R$ 19,90 · saldo: 1 un · valor inflado: **R$ 61,19**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MEY BRASIL COMERCIAL

_11 produto(s) · R$ 5.209,44_

### 62714 — PUMP SPRAY 150ML

- Custo no ERP: **R$ 102,00** · preço de venda: R$ 25,90 · saldo: 10 un · valor inflado: **R$ 1.020,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62715 — PUMP SPRAY 120ML

- Custo no ERP: **R$ 96,00** · preço de venda: R$ 24,90 · saldo: 10 un · valor inflado: **R$ 960,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62713 — PUMP SPRAY 100ML

- Custo no ERP: **R$ 78,00** · preço de venda: R$ 19,90 · saldo: 10 un · valor inflado: **R$ 780,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61527 — ELASTICO  SORTIDOS

- Custo no ERP: **R$ 66,00** · preço de venda: R$ 17,90 · saldo: 10 un · valor inflado: **R$ 660,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62716 — PUMP SPRAY 60ML

- Custo no ERP: **R$ 66,00** · preço de venda: R$ 16,90 · saldo: 10 un · valor inflado: **R$ 660,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61518 — ESCOVINHA DE CILIOS

- Custo no ERP: **R$ 54,00** · preço de venda: R$ 13,90 · saldo: 10 un · valor inflado: **R$ 540,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61517 — PAD GEL DE FRUTAS

- Custo no ERP: **R$ 32,00** · preço de venda: R$ 6,90 · saldo: 10 un · valor inflado: **R$ 320,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61519 — BATOQUE DE CORACAO

- Custo no ERP: **R$ 90,00** · preço de venda: R$ 18,90 · saldo: 2 un · valor inflado: **R$ 180,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62706 — TOUCA PARA CABELO, EM CORES SORTIDAS, CONSTRUIDA E

- Custo no ERP: **R$ 15,00** · preço de venda: R$ 2,50 · saldo: 3 un · valor inflado: **R$ 45,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 55935 — ORNAMENTO PARA CABELO (ANEL PARA DREADS DE METAL)

- Custo no ERP: **R$ 10,00** · preço de venda: R$ 1,00 · saldo: 3 un · valor inflado: **R$ 30,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 55940 — Esponja para maquiagem

- Custo no ERP: **R$ 3,61** · preço de venda: R$ 1,00 · saldo: 4 un · valor inflado: **R$ 14,44**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## NOVO TOQUE

_8 produto(s) · R$ 3.725,52_

### 58468 — BASE ROSA TRAT PROFISSIONAL 60ML

- Custo no ERP: **R$ 83,64** · preço de venda: R$ 13,90 · saldo: 10 un · valor inflado: **R$ 836,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58470 — CASCO DE TARTARUGA TRAT PROFISSIONAL 6

- Custo no ERP: **R$ 83,64** · preço de venda: R$ 13,90 · saldo: 10 un · valor inflado: **R$ 836,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58478 — OLEO SECANTE TRAT PROFISSIONAL 60ML

- Custo no ERP: **R$ 83,64** · preço de venda: R$ 13,90 · saldo: 10 un · valor inflado: **R$ 836,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76005 — BRILHO INTENSO PROFISSIONAL 60MLB

- Custo no ERP: **R$ 79,44** · preço de venda: R$ 13,24 · saldo: 10 un · valor inflado: **R$ 794,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61693 — O CHORO E LIVRE CREM 8ML

- Custo no ERP: **R$ 23,40** · preço de venda: R$ 4,90 · saldo: 10 un · valor inflado: **R$ 234,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58354 — CHEIA DE ESTILO CREM 8ML

- Custo no ERP: **R$ 23,52** · preço de venda: R$ 4,90 · saldo: 3 un · valor inflado: **R$ 70,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58367 — MIX DE ACESSORIOS CREM 8ML

- Custo no ERP: **R$ 23,52** · preço de venda: R$ 4,90 · saldo: 3 un · valor inflado: **R$ 70,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61696 — PROTAGONISTA GLITTER 8ML

- Custo no ERP: **R$ 23,40** · preço de venda: R$ 4,90 · saldo: 2 un · valor inflado: **R$ 46,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## SKALA

_4 produto(s) · R$ 2.553,60_

### 54376 — CR TRAT PENTEAR AMIDO DE MILHO 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 10 un · valor inflado: **R$ 638,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 54379 — CR TRAT PENTEAR GENETIQS FORCA E BRILHO SKALA 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 10 un · valor inflado: **R$ 638,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 54402 — CR TRAT PENTEAR DONA SKALA 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 10 un · valor inflado: **R$ 638,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 54707 — CR. TRAT PENTEAR DIVINO POTINHO 2-EM-1 (CPP) 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 10 un · valor inflado: **R$ 638,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## DOMPEL

_2 produto(s) · R$ 2.488,00_

### 54148 — ESCOVA CARACOL DOMPEL

- Custo no ERP: **R$ 205,15** · preço de venda: R$ 32,90 · saldo: 10 un · valor inflado: **R$ 2.051,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60538 — LIXA MANICURE BANANA

- Custo no ERP: **R$ 43,65** · preço de venda: R$ 0,37 · saldo: 10 un · valor inflado: **R$ 436,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MAXTON NAO USAR

_5 produto(s) · R$ 2.421,10_

### 62510 — Maxton Louro Muito Claro 9.0 Tint Cr Eco

- Custo no ERP: **R$ 50,75** · preço de venda: R$ 16,90 · saldo: 17 un · valor inflado: **R$ 862,75**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53693 — Maxton Verm Cereja 6.66 TintCr Eco

- Custo no ERP: **R$ 53,27** · preço de venda: R$ 15,67 · saldo: 10 un · valor inflado: **R$ 532,70**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53700 — Maxton Louro Escuro 6.0 Tint Cr Eco

- Custo no ERP: **R$ 46,74** · preço de venda: R$ 14,24 · saldo: 10 un · valor inflado: **R$ 467,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62511 — Maxton LouroMedio Acobreado  Intenso 7.44

- Custo no ERP: **R$ 50,75** · preço de venda: R$ 16,90 · saldo: 7 un · valor inflado: **R$ 355,25**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62512 — Maxton Louro Medio Mate 7.2

- Custo no ERP: **R$ 50,75** · preço de venda: R$ 16,90 · saldo: 4 un · valor inflado: **R$ 203,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## OTIMO BIJUTERIAS

_36 produto(s) · R$ 2.250,23_

### 6113 — SACOLA DE PRESENTE PEQUENA 202

- Custo no ERP: **R$ 92,12** · preço de venda: R$ 8,90 · saldo: 6 un · valor inflado: **R$ 552,72**
- Evidência: custo 10,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 6126 — SACOLA DE PRESENTE PEQUENA 201

- Custo no ERP: **R$ 91,33** · preço de venda: R$ 6,90 · saldo: 2 un · valor inflado: **R$ 182,66**
- Evidência: custo 13,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 56199 — ELASTICO 5

- Custo no ERP: **R$ 22,00** · preço de venda: R$ 0,50 · saldo: 6 un · valor inflado: **R$ 132,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 4875 — SAIA CARNAVAL 2

- Custo no ERP: **R$ 12,29** · preço de venda: R$ 2,60 · saldo: 10 un · valor inflado: **R$ 122,90**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44544 — CONJUNTO COLAR E BRINCO PEROLA COM PEDRAS - F01-782855

- Custo no ERP: **R$ 12,38** · preço de venda: R$ 0,01 · saldo: 9 un · valor inflado: **R$ 111,42**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 41271 — COLAR DUPLO EM PEROLA - F32-682732A

- Custo no ERP: **R$ 9,60** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 96,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42924 — KIT BRINCO E COLAR GOTA E CORAÇÃO -F22-293683

- Custo no ERP: **R$ 8,83** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 88,30**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42923 — BRINCO QUADRADO E REDONDO - F01-625762

- Custo no ERP: **R$ 9,60** · preço de venda: R$ 0,01 · saldo: 9 un · valor inflado: **R$ 86,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 41275 — COLAR PEDRA BRILHANTE - F13-624512M

- Custo no ERP: **R$ 7,20** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 72,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 43004 — PULSERIA COM VARIOS PIGENTES - G01-542561-P

- Custo no ERP: **R$ 7,10** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 71,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 77077 — BRINCO

- Custo no ERP: **R$ 6,00** · preço de venda: R$ 1,00 · saldo: 10 un · valor inflado: **R$ 60,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 27857 — COLAR PEROLA COM PIGENTE -

- Custo no ERP: **R$ 11,81** · preço de venda: R$ 3,19 · saldo: 5 un · valor inflado: **R$ 59,05**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44217 — ARGOLA COLORIDA GRANDE - F11-222464

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 57,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2571 — CILIOS OTIMOS

- Custo no ERP: **R$ 1,25** · preço de venda: R$ 0,02 · saldo: 36 un · valor inflado: **R$ 45,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44546 — BRACELETE ABERTO - F29-579232B

- Custo no ERP: **R$ 4,32** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 43,20**
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

### 15260 — PIRANHA

- Custo no ERP: **R$ 4,61** · preço de venda: R$ 1,50 · saldo: 8 un · valor inflado: **R$ 36,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 75680 — KIT ESPONJA

- Custo no ERP: **R$ 4,99** · preço de venda: R$ 1,33 · saldo: 7 un · valor inflado: **R$ 34,93**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47393 — PULSEIRA COM PEDRA RETANGULAR BRILHOSA - F21-7223105G

- Custo no ERP: **R$ 17,09** · preço de venda: R$ 2,00 · saldo: 2 un · valor inflado: **R$ 34,18**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44542 — BRINCO CORAÇÃO GRANDE - F34-572225X

- Custo no ERP: **R$ 3,26** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 32,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 77087 — BRINCO

- Custo no ERP: **R$ 3,20** · preço de venda: R$ 0,53 · saldo: 10 un · valor inflado: **R$ 32,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 77081 — PIRANHA PARA CABELO

- Custo no ERP: **R$ 2,88** · preço de venda: R$ 0,05 · saldo: 10 un · valor inflado: **R$ 28,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 5015 — BRINCO

- Custo no ERP: **R$ 6,63** · preço de venda: R$ 0,02 · saldo: 4 un · valor inflado: **R$ 26,52**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1382 — PULSEIRA

- Custo no ERP: **R$ 2,69** · preço de venda: R$ 0,02 · saldo: 9 un · valor inflado: **R$ 24,21**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2687 — BRINCO OTIMOS

- Custo no ERP: **R$ 5,57** · preço de venda: R$ 0,02 · saldo: 4 un · valor inflado: **R$ 22,28**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2685 — BRINCO

- Custo no ERP: **R$ 6,53** · preço de venda: R$ 1,15 · saldo: 3 un · valor inflado: **R$ 19,59**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 4602 — ESPELHO DE BOLSA OTIMO

- Custo no ERP: **R$ 6,53** · preço de venda: R$ 0,03 · saldo: 3 un · valor inflado: **R$ 19,59**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 27422 — CONJUNTO BRINCO E COLAR CIRCULO DOURADO - F34-573632X

- Custo no ERP: **R$ 9,22** · preço de venda: R$ 2,90 · saldo: 2 un · valor inflado: **R$ 18,44**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 27735 — BRACELETE AÇO INOX - G02-9321161-P

- Custo no ERP: **R$ 14,40** · preço de venda: R$ 3,82 · saldo: 1 un · valor inflado: **R$ 14,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 15321 — COLAR CORRENTE GRANDE COM DETALHE EM BRILHO - G01-866982-C

- Custo no ERP: **R$ 12,86** · preço de venda: R$ 2,75 · saldo: 1 un · valor inflado: **R$ 12,86**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2758 — CHAVEIRO

- Custo no ERP: **R$ 1,63** · preço de venda: R$ 0,03 · saldo: 6 un · valor inflado: **R$ 9,78**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62659 — PEDRA DE JADE ROLO

- Custo no ERP: **R$ 7,49** · preço de venda: R$ 0,58 · saldo: 1 un · valor inflado: **R$ 7,49**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1381 — COLAR

- Custo no ERP: **R$ 7,30** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 7,30**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1312 — LAÇO PDD OTIMOS

- Custo no ERP: **R$ 3,46** · preço de venda: R$ 0,02 · saldo: 2 un · valor inflado: **R$ 6,92**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 45940 — RABICO

- Custo no ERP: **R$ 1,63** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 4,89**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 1,63 ÷ 5 = R$ 0,33, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois, custo e preço.


## BRAÉ

_1 produto(s) · R$ 2.197,00_

### 58169 — AMPOLA DIVINE BRAÉ - 13ML

- Custo no ERP: **R$ 219,70** · preço de venda: R$ 49,90 · saldo: 10 un · valor inflado: **R$ 2.197,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MACRILAN BEUTY

_3 produto(s) · R$ 2.020,74_

### 57648 — PINCEL PROF GDE PO LINHA MAX A-01 MACRILAN

- Custo no ERP: **R$ 245,07** · preço de venda: R$ 59,56 · saldo: 8 un · valor inflado: **R$ 1.960,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57632 — ESPONJA GOTA CHANFRADA PARA MA EP10 MACRILAN

- Custo no ERP: **R$ 44,12** · preço de venda: R$ 8,72 · saldo: 1 un · valor inflado: **R$ 44,12**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18379 — KIT ESPONJAS PARA MAQUIAGEM MACRILAN

- Custo no ERP: **R$ 16,06** · preço de venda: R$ 5,18 · saldo: 1 un · valor inflado: **R$ 16,06**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## REAL LOVE

_3 produto(s) · R$ 1.676,43_

### 18325 — KIT (1 FRASCO 50ML, 2 FRASCOS 30ML, 2 POTES 10 GRAMAS, 1 PENTE)

- Custo no ERP: **R$ 285,50** · preço de venda: R$ 29,90 · saldo: 5 un · valor inflado: **R$ 1.427,50**
- Evidência: custo 9,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 346 — PIN-Q-08 CONJUNTO (1 PORTA PINCEL DE MAQUIAGEM ,ESPELHO E PINCEL DE MAQUIAGEM)

- Custo no ERP: **R$ 99,00** · preço de venda: R$ 0,01 · saldo: 2 un · valor inflado: **R$ 198,00**
- Evidência: custo é 9.900x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 14919 — TOP COAT BLINDADO REAL LOVE

- Custo no ERP: **R$ 50,93** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 50,93**
- Evidência: custo é 5.093x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## HUNKY MODAS

_6 produto(s) · R$ 1.588,40_

### 78497 — KIT 5 ELASTICO ELA-188

- Custo no ERP: **R$ 32,00** · preço de venda: R$ 10,20 · saldo: 22 un · valor inflado: **R$ 704,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78504 — KIT 5 ELASTICO ELA-189

- Custo no ERP: **R$ 21,60** · preço de venda: R$ 6,90 · saldo: 10 un · valor inflado: **R$ 216,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78499 — KIT 2 ELASTICO ELA-186

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 7,60 · saldo: 7 un · valor inflado: **R$ 210,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78503 — KIT 5 ELASTICO ELA-190

- Custo no ERP: **R$ 21,60** · preço de venda: R$ 4,50 · saldo: 9 un · valor inflado: **R$ 194,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78496 — KIT 5 ELASTICO ELA-185

- Custo no ERP: **R$ 17,40** · preço de venda: R$ 3,90 · saldo: 10 un · valor inflado: **R$ 174,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78498 — KIT 2 ELASTICO ELA-187

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 7,80 · saldo: 3 un · valor inflado: **R$ 90,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## INOAR

_2 produto(s) · R$ 1.564,73_

### 58392 — AMPOLA ARGAN INOAR 45ML

- Custo no ERP: **R$ 104,47** · preço de venda: R$ 15,90 · saldo: 10 un · valor inflado: **R$ 1.044,70**
- Evidência: comprou 2, vendeu 42 (razão 21x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~21 peças** (estimativa: comprou 2, vendeu 42) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 21, o custo unitário cai de R$ 104,47 para R$ 4,97, margem de 220% sobre R$ 15,90.
- Efeito: o estoque desta loja reduz R$ 994,95 (correção, não perda)

### 44257 — OLEO ARGAN 7 ML INOAR

- Custo no ERP: **R$ 74,29** · preço de venda: R$ 10,90 · saldo: 7 un · valor inflado: **R$ 520,03**
- Evidência: comprou 55, vendeu 395 (razão 7x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~7 peças** (estimativa: comprou 55, vendeu 395) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 7, o custo unitário cai de R$ 74,29 para R$ 10,61, margem de 3% sobre R$ 10,90.
- Efeito: o estoque desta loja reduz R$ 445,74 (correção, não perda)


## DAFU

_13 produto(s) · R$ 1.433,56_

### 42286 — ANEL DE METAL COMUM COM PEDRINHA

- Custo no ERP: **R$ 18,43** · preço de venda: R$ 5,68 · saldo: 31 un · valor inflado: **R$ 571,33**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47896 — MASSAGEADOR FACIAL DE RESINA - DAFU

- Custo no ERP: **R$ 20,74** · preço de venda: R$ 0,02 · saldo: 10 un · valor inflado: **R$ 207,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 28466 — CONJUNTO ESPONJAS SUPORTE E 1 ESCOVA DE MASSAGEM FACIAL

- Custo no ERP: **R$ 18,43** · preço de venda: R$ 5,24 · saldo: 10 un · valor inflado: **R$ 184,30**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44500 — REFIL DE BROCA DAFU

- Custo no ERP: **R$ 15,36** · preço de venda: R$ 0,02 · saldo: 9 un · valor inflado: **R$ 138,24**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 27746 — KIT PRESILHA PARA CABELO DAFU

- Custo no ERP: **R$ 10,37** · preço de venda: R$ 2,20 · saldo: 6 un · valor inflado: **R$ 62,22**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 52852 — PINCEL COTONETE PEQUENO - DAFU

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,02 · saldo: 10 un · valor inflado: **R$ 57,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 27570 — LAÇO GRANDE COLORIDO - DF422 - PR130

- Custo no ERP: **R$ 9,22** · preço de venda: R$ 3,06 · saldo: 6 un · valor inflado: **R$ 55,32**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76449 — KIT PINCEL

- Custo no ERP: **R$ 11,20** · preço de venda: R$ 1,87 · saldo: 4 un · valor inflado: **R$ 44,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76457 — KIT PINCEL

- Custo no ERP: **R$ 11,20** · preço de venda: R$ 1,87 · saldo: 4 un · valor inflado: **R$ 44,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 52751 — ORNAMENTO PARA CABELO (PRESILHA) DE METAL

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,02 · saldo: 4 un · valor inflado: **R$ 23,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76450 — KIT PINCEL

- Custo no ERP: **R$ 8,40** · preço de venda: R$ 1,40 · saldo: 2 un · valor inflado: **R$ 16,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 28429 — ESPONJA PARA MAQUIAGEM KIT DAFU

- Custo no ERP: **R$ 16,51** · preço de venda: R$ 4,50 · saldo: 1 un · valor inflado: **R$ 16,51**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76455 — KIT PINCEL

- Custo no ERP: **R$ 11,20** · preço de venda: R$ 1,87 · saldo: 1 un · valor inflado: **R$ 11,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## TURMA DA LU

_1 produto(s) · R$ 1.278,97_

### 202444 — PALETA DE SOMBRAS TURMA DA LU

- Custo no ERP: **R$ 182,71** · preço de venda: R$ 32,00 · saldo: 7 un · valor inflado: **R$ 1.278,97**
- Evidência: custo 5,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## COLORAMA

_2 produto(s) · R$ 1.185,44_

### 63861 — NECESSARIE MEY BRASIL

- Custo no ERP: **R$ 114,00** · preço de venda: R$ 28,90 · saldo: 10 un · valor inflado: **R$ 1.140,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 203688 — ESMALTE RISQUE NU NATURAL CONDESSA 6X8ML

- Custo no ERP: **R$ 22,72** · preço de venda: R$ 6,25 · saldo: 2 un · valor inflado: **R$ 45,44**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## TALGE

_9 produto(s) · R$ 1.032,41_

### 23846 — LUVA NITRILICA ROSA S/PO M TALGE

- Custo no ERP: **R$ 110,12** · preço de venda: R$ 4,20 · saldo: 3 un · valor inflado: **R$ 330,36**
- Evidência: comprou 3, vendeu 38 (razão 13x)
- **Conserto:** Parece embalagem de 13, mas R$ 110,12 ÷ 13 = R$ 8,47, que ainda passa do preço de R$ 4,20. **Abrir a nota** e ver a unidade.

### 4742 — LUVA TALGE DESC LATEX C/ PO TAM G

- Custo no ERP: **R$ 31,11** · preço de venda: R$ 3,80 · saldo: 5 un · valor inflado: **R$ 155,55**
- Evidência: custo 8,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 51207 — LUVA VINIL P COM PO TALGE

- Custo no ERP: **R$ 16,14** · preço de venda: R$ 2,20 · saldo: 9 un · valor inflado: **R$ 145,26**
- Evidência: comprou 2, vendeu 29 (razão 14x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~14 peças** (estimativa: comprou 2, vendeu 29) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 14, o custo unitário cai de R$ 16,14 para R$ 1,15, margem de 91% sobre R$ 2,20.
- Efeito: o estoque desta loja reduz R$ 134,88 (correção, não perda)

### 51209 — LUVA VINIL SEM PO G CX C-100

- Custo no ERP: **R$ 22,09** · preço de venda: R$ 2,20 · saldo: 4 un · valor inflado: **R$ 88,36**
- Evidência: comprou 2, vendeu 18 (razão 9x)
- **Conserto:** Parece embalagem de 9, mas R$ 22,09 ÷ 9 = R$ 2,45, que ainda passa do preço de R$ 2,20. **Abrir a nota** e ver a unidade.

### 16844 — LUVA TALGE DESC NITRILICAS G

- Custo no ERP: **R$ 18,33** · preço de venda: R$ 4,80 · saldo: 4 un · valor inflado: **R$ 73,32**
- Evidência: comprou 2, vendeu 20 (razão 10x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~10 peças** (estimativa: comprou 2, vendeu 20) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 10, o custo unitário cai de R$ 18,33 para R$ 1,83, margem de 162% sobre R$ 4,80.
- Efeito: o estoque desta loja reduz R$ 65,99 (correção, não perda)

### 18505 — LUVA TALGE VINIL COM PO M

- Custo no ERP: **R$ 9,64** · preço de venda: R$ 2,21 · saldo: 7 un · valor inflado: **R$ 67,48**
- Evidência: comprou 3, vendeu 36 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 3, vendeu 36) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 9,64 para R$ 0,80, margem de 175% sobre R$ 2,21.
- Efeito: o estoque desta loja reduz R$ 61,86 (correção, não perda)

### 51402 — LUVA TALGE VINIL SEM PO P TALGE

- Custo no ERP: **R$ 16,14** · preço de venda: R$ 2,20 · saldo: 4 un · valor inflado: **R$ 64,56**
- Evidência: comprou 2, vendeu 16 (razão 8x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~8 peças** (estimativa: comprou 2, vendeu 16) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 8, o custo unitário cai de R$ 16,14 para R$ 2,02, margem de 9% sobre R$ 2,20.
- Efeito: o estoque desta loja reduz R$ 56,49 (correção, não perda)

### 53848 — LUVA LATEX C/PO P CX-100 UN

- Custo no ERP: **R$ 15,36** · preço de venda: R$ 4,20 · saldo: 4 un · valor inflado: **R$ 61,44**
- Evidência: no nome: 100 UN · comprou 2, vendeu 16 (razão 8x)
- **Conserto:** Cadastrar **fator de conversão = 100** (está no nome do produto). O custo unitário cai de R$ 15,36 para **R$ 0,15** — margem de 2.634% sobre o preço de R$ 4,20.
- Efeito: o estoque desta loja reduz R$ 60,83 (correção, não perda)

### 53849 — LUVA LATEX C/PO M CX-100 UN

- Custo no ERP: **R$ 15,36** · preço de venda: R$ 3,80 · saldo: 3 un · valor inflado: **R$ 46,08**
- Evidência: no nome: 100 UN · comprou 3, vendeu 49 (razão 16x)
- **Conserto:** Cadastrar **fator de conversão = 100** (está no nome do produto). O custo unitário cai de R$ 15,36 para **R$ 0,15** — margem de 2.374% sobre o preço de R$ 3,80.
- Efeito: o estoque desta loja reduz R$ 45,62 (correção, não perda)


## BARBER SHOP

_2 produto(s) · R$ 944,00_

### 30591 — TINTA DA ALEGRIA VERMELHA 150ML

- Custo no ERP: **R$ 47,20** · preço de venda: R$ 13,00 · saldo: 10 un · valor inflado: **R$ 472,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 30592 — TINTA DA ALEGRIA VERDE 150ML

- Custo no ERP: **R$ 47,20** · preço de venda: R$ 13,00 · saldo: 10 un · valor inflado: **R$ 472,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## PHALLEBEUTY

_2 produto(s) · R$ 896,70_

### 64159 — MOUSSE MICELAR ANTI OLEOSIDADE 150ML PHALLEBEAUTY

- Custo no ERP: **R$ 158,28** · preço de venda: R$ 27,00 · saldo: 3 un · valor inflado: **R$ 474,84**
- Evidência: custo 5,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 63638 — PALETA CONTORNO PHALLEBEAUTY 12G

- Custo no ERP: **R$ 140,62** · preço de venda: R$ 18,00 · saldo: 3 un · valor inflado: **R$ 421,86**
- Evidência: custo 7,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## REALSKY COMERCIO

_2 produto(s) · R$ 891,00_

### 65608 — MASCARA DE CARNAVAL

- Custo no ERP: **R$ 80,00** · preço de venda: R$ 16,90 · saldo: 10 un · valor inflado: **R$ 800,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64764 — DF-BR222004-01-04 AMARRADOR DE NAILON P/ CABELO ELASTICO

- Custo no ERP: **R$ 18,20** · preço de venda: R$ 4,90 · saldo: 5 un · valor inflado: **R$ 91,00**
- Evidência: comprou 1, vendeu 32 (razão 32x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~32 peças** (estimativa: comprou 1, vendeu 32) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 32, o custo unitário cai de R$ 18,20 para R$ 0,57, margem de 762% sobre R$ 4,90.
- Efeito: o estoque desta loja reduz R$ 88,16 (correção, não perda)


## MIRRAS

_1 produto(s) · R$ 676,50_

### 78095 — CREME AMACIANTE DE CUTICULAS REMOVE MAIS 80GR

- Custo no ERP: **R$ 61,50** · preço de venda: R$ 10,90 · saldo: 11 un · valor inflado: **R$ 676,50**
- Evidência: comprou 2, vendeu 14 (razão 7x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~7 peças** (estimativa: comprou 2, vendeu 14) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 7, o custo unitário cai de R$ 61,50 para R$ 8,79, margem de 24% sobre R$ 10,90.
- Efeito: o estoque desta loja reduz R$ 579,86 (correção, não perda)


## LABOTRAT

_2 produto(s) · R$ 650,00_

### 203778 — CREME DE PARAFINA ATIVADORA BETERRABA E BURITI VAI&BRILHA 20G LABOTRAT

- Custo no ERP: **R$ 24,75** · preço de venda: R$ 7,90 · saldo: 14 un · valor inflado: **R$ 346,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 65094 — CR HIDRATANTE DE PARAFINA VAI E BRILHA 20G LABOTRAT

- Custo no ERP: **R$ 30,35** · preço de venda: R$ 5,90 · saldo: 10 un · valor inflado: **R$ 303,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## CBB

_1 produto(s) · R$ 620,88_

### 204057 — SABONETE INTIMO ERVA DOCE 200ML Lt FSC300126

- Custo no ERP: **R$ 47,76** · preço de venda: R$ 9,90 · saldo: 13 un · valor inflado: **R$ 620,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MAX LOVE

_1 produto(s) · R$ 537,57_

### 60353 — MAX LOVE - AGUA MICELAR COLAGENO

- Custo no ERP: **R$ 48,87** · preço de venda: R$ 15,90 · saldo: 11 un · valor inflado: **R$ 537,57**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## FACE BEAUTIFUL

_1 produto(s) · R$ 525,60_

### 64709 — MOUSSE FACIAL VITAMINA C LOVELY

- Custo no ERP: **R$ 52,56** · preço de venda: R$ 1,04 · saldo: 10 un · valor inflado: **R$ 525,60**
- Evidência: comprou 1, vendeu 9 (razão 9x)
- **Conserto:** Parece embalagem de 9, mas R$ 52,56 ÷ 9 = R$ 5,84, que ainda passa do preço de R$ 1,04. **Abrir a nota** e ver a unidade.


## MISS FRANDY

_2 produto(s) · R$ 525,00_

### 55415 — PAQUIMETRO 8CM DZ (12PC)  Ean :6917121710425

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 7,90 · saldo: 10 un · valor inflado: **R$ 300,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 55401 — COPO DE VIDRO DAPPEN MEY BRASIL

- Custo no ERP: **R$ 22,50** · preço de venda: R$ 5,90 · saldo: 10 un · valor inflado: **R$ 225,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## JAPINHA

_4 produto(s) · R$ 484,49_

### 16988 — KIT SHAMPOO DETOX / ATIVO REDUTOR DE QUIABO JAPINHA 1LT

- Custo no ERP: **R$ 50,31** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 301,86**
- Evidência: custo é 5.031x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 16945 — Kit Shampoo Detox / Ativo Redutor Organico  Japinha 120ml

- Custo no ERP: **R$ 15,25** · preço de venda: R$ 0,20 · saldo: 7 un · valor inflado: **R$ 106,75**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 9115 — BOTOX OJON JAPINHA 300G

- Custo no ERP: **R$ 12,13** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 48,52**
- Evidência: custo é 1.213x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 9116 — BOTOX OJOIN JAPINHA 1KG

- Custo no ERP: **R$ 27,36** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 27,36**
- Evidência: custo é 2.736x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## CHEN YUMEI

_6 produto(s) · R$ 428,40_

### 60453 — CINTO

- Custo no ERP: **R$ 18,60** · preço de venda: R$ 3,91 · saldo: 10 un · valor inflado: **R$ 186,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60455 — CINTO 2167

- Custo no ERP: **R$ 14,40** · preço de venda: R$ 3,08 · saldo: 10 un · valor inflado: **R$ 144,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76516 — MZS380 CINTO

- Custo no ERP: **R$ 12,00** · preço de venda: R$ 2,00 · saldo: 3 un · valor inflado: **R$ 36,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76519 — MZS406 CINTO

- Custo no ERP: **R$ 14,40** · preço de venda: R$ 2,40 · saldo: 2 un · valor inflado: **R$ 28,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76524 — WZS1117 CINTO

- Custo no ERP: **R$ 16,80** · preço de venda: R$ 2,80 · saldo: 1 un · valor inflado: **R$ 16,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76530 — WZS451 CINTO

- Custo no ERP: **R$ 16,80** · preço de venda: R$ 2,80 · saldo: 1 un · valor inflado: **R$ 16,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## VIVAI

_3 produto(s) · R$ 421,46_

### 65618 — SABONETE MOUSSE ROSA MOSQUETA

- Custo no ERP: **R$ 2,83** · preço de venda: R$ 0,47 · saldo: 142 un · valor inflado: **R$ 401,86**
- Evidência: preço de R$ 0,47 com custo de R$ 2,83
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 60691 — GLOSS LABIAL VIVA LA VIDA - VIVAI

- Custo no ERP: **R$ 1,32** · preço de venda: R$ 0,13 · saldo: 14 un · valor inflado: **R$ 18,48**
- Evidência: preço de R$ 0,13 com custo de R$ 1,32
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 64290 — GLOSS ALL DAY LATEX - VIVAI

- Custo no ERP: **R$ 1,12** · preço de venda: R$ 0,36 · saldo: 1 un · valor inflado: **R$ 1,12**
- Evidência: preço de R$ 0,36 com custo de R$ 1,12
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## ANDRADE IMPORTADOS

_1 produto(s) · R$ 420,00_

### 40679 — TIC TAC PRETO

- Custo no ERP: **R$ 42,00** · preço de venda: R$ 2,90 · saldo: 10 un · valor inflado: **R$ 420,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## BIC

_1 produto(s) · R$ 398,70_

### 60549 — AP BARB BIC COMFORT NORMAL

- Custo no ERP: **R$ 39,87** · preço de venda: R$ 6,00 · saldo: 10 un · valor inflado: **R$ 398,70**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## ESCOBEL

_2 produto(s) · R$ 345,90_

### 49564 — ESC PROF BASE CERAMICA REF 847 ROSA 20 MM C/01 DZ

- Custo no ERP: **R$ 20,84** · preço de venda: R$ 3,58 · saldo: 10 un · valor inflado: **R$ 208,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 49566 — ESC PROF BASE CERAMICA REF 861 ROSA 34 MM C/01 DZ

- Custo no ERP: **R$ 13,75** · preço de venda: R$ 4,58 · saldo: 10 un · valor inflado: **R$ 137,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## IMPALA

_9 produto(s) · R$ 314,82_

### 18015 — OLEO PARA CUTICULAS IMPALA TRATAMENTO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 12 un · valor inflado: **R$ 71,28**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18010 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO XEQUE - MATE

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18012 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO CARTAS NA MANGA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18014 — ESMALTE IMPALA A COR DA MODA CREMOSO INTUICAO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18004 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO PLOT TWIST  IMPALA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 29,70**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18007 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO ESCOLHA SEU LADO  IMPALA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 29,70**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18008 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO APOSTA ALTA  IMPALA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 29,70**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18011 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO SORTE LANCADA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 23,76**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 18013 — ESMALTE IMPALA JU PAES VIRANDO O JOGO SUAVE COBERTURA REGRAS DO JOGO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 23,76**
- Evidência: custo é 594x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## SEM MARCA

_4 produto(s) · R$ 282,33_

### 9395 — PIR METAL PP0109

- Custo no ERP: **R$ 12,67** · preço de venda: R$ 3,90 · saldo: 10 un · valor inflado: **R$ 126,70**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 10769 — CHICL BIG BIG

- Custo no ERP: **R$ 4,75** · preço de venda: R$ 0,10 · saldo: 25 un · valor inflado: **R$ 118,75**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 3021 — SACO PARA PRESENTE PEQUENO

- Custo no ERP: **R$ 9,96** · preço de venda: R$ 0,27 · saldo: 3 un · valor inflado: **R$ 29,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64028 — REF DF-TC139003 TOUCA DE PLASTICO, P/ BANHO

- Custo no ERP: **R$ 7,00** · preço de venda: R$ 1,17 · saldo: 1 un · valor inflado: **R$ 7,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## RISQUE

_2 produto(s) · R$ 242,85_

### 52594 — ESM RISQUE DEUSAS INSPIRACAO DIVINA C/6

- Custo no ERP: **R$ 37,72** · preço de venda: R$ 1,83 · saldo: 6 un · valor inflado: **R$ 226,32**
- Evidência: custo 20,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 5202 — ESMALTE RISQUE GRAO DE CAFE

- Custo no ERP: **R$ 16,53** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 16,53**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## ITALLIAN HAIR

_3 produto(s) · R$ 219,95_

### 204358 — KIT HOME CARE TRIVITT COM HIDRATACAO

- Custo no ERP: **R$ 10,53** · preço de venda: R$ 2,00 · saldo: 18 un · valor inflado: **R$ 189,54**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 49877 — MEDI ITALLIAN 100ML COM BICO 400130

- Custo no ERP: **R$ 1,50** · preço de venda: R$ 0,01 · saldo: 20 un · valor inflado: **R$ 30,00**
- Evidência: preço de R$ 0,01 com custo de R$ 1,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 8511 — COLORACAO IC SEM AMONIA 0.20 INTENSIFICADOR PURPLE 60G

- Custo no ERP: **R$ 0,41** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 0,41**
- Evidência: preço de R$ 0,01 com custo de R$ 0,41
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## LUXOS

_1 produto(s) · R$ 194,00_

### 10890 — EMBALAGEMS

- Custo no ERP: **R$ 19,40** · preço de venda: R$ 3,90 · saldo: 10 un · valor inflado: **R$ 194,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## ZGY

_6 produto(s) · R$ 164,79_

### 847 — BRINCO CONCHA DOURADA E PRATA 6 - ZGY

- Custo no ERP: **R$ 21,47** · preço de venda: R$ 4,96 · saldo: 4 un · valor inflado: **R$ 85,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1344 — PRESILHA COM 3

- Custo no ERP: **R$ 10,53** · preço de venda: R$ 0,02 · saldo: 3 un · valor inflado: **R$ 31,59**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 11440 — COLAR COM PIGENTE

- Custo no ERP: **R$ 15,68** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 15,68**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 15743 — PIRANHA FOLHA COM PEDRARIA

- Custo no ERP: **R$ 13,75** · preço de venda: R$ 0,90 · saldo: 1 un · valor inflado: **R$ 13,75**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 3455 — ARGOLA AÇO INOXIDAVEL

- Custo no ERP: **R$ 5,23** · preço de venda: R$ 0,02 · saldo: 2 un · valor inflado: **R$ 10,46**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1356 — PIRANHA GRANDE PLASTICO

- Custo no ERP: **R$ 7,43** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 7,43**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## NATHYDRAS

_2 produto(s) · R$ 144,27_

### 45512 — REPARADOR DE PONTAS ALHO 30ML

- Custo no ERP: **R$ 13,75** · preço de venda: R$ 0,01 · saldo: 9 un · valor inflado: **R$ 123,75**
- Evidência: custo é 1.375x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 12191 — MODELADOR DE CACHOS

- Custo no ERP: **R$ 20,52** · preço de venda: R$ 0,04 · saldo: 1 un · valor inflado: **R$ 20,52**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## YAMÁ

_1 produto(s) · R$ 124,35_

### 5267 — MINI KIT FASHION COLOR 9.1 YAMA

- Custo no ERP: **R$ 41,45** · preço de venda: R$ 10,90 · saldo: 3 un · valor inflado: **R$ 124,35**
- Evidência: custo 3,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## BANA BANA

_1 produto(s) · R$ 100,00_

### 30784 — BOMBOM

- Custo no ERP: **R$ 25,00** · preço de venda: R$ 1,00 · saldo: 4 un · valor inflado: **R$ 100,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## ANTONIO BANDERAS

_1 produto(s) · R$ 96,90_

### 54877 — AVENTAL 30 ANOS - Lote: 4057090825

- Custo no ERP: **R$ 32,30** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 96,90**
- Evidência: custo é 3.230x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## BRILHARE

_1 produto(s) · R$ 66,20_

### 44616 — COLAR PIGENTE PEDRA - F27-421551

- Custo no ERP: **R$ 6,62** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 66,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## IMPORTADOS

_1 produto(s) · R$ 60,00_

### 43842 — SACOLA CASA DA BELEZA 60X70

- Custo no ERP: **R$ 0,60** · preço de venda: R$ 0,01 · saldo: 100 un · valor inflado: **R$ 60,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,60
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## RUBY ROSE

_2 produto(s) · R$ 58,36_

### 65568 — RR-853/1 PO FACIAL COMPACTO MELU RUBY ROSE RR-853-1

- Custo no ERP: **R$ 7,39** · preço de venda: R$ 1,78 · saldo: 4 un · valor inflado: **R$ 29,56**
- Evidência: custo 4,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58466 — DELINEADOR LIQUIDO PRETO RUBY ROSE

- Custo no ERP: **R$ 9,60** · preço de venda: R$ 1,70 · saldo: 3 un · valor inflado: **R$ 28,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


