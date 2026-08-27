# Consertos de estoque — L1 · Casa da Beleza Altamira

**454 produtos · R$ 316.344,29 de valor que o sistema mostra e não existe.**

Critério: custo médio maior que 3x o preço de venda, com saldo nesta loja. Margem apertada
acontece; vender a menos de um terço do custo, não — isso é dado errado, não negócio ruim.

Fonte: snapshot do pipeline de estoque (26/08) + histórico de compra/venda desde 2023.
Onde aparece ✅, o custo foi conferido lendo a nota de entrada no ERP.

## Resumo do que fazer

| Tipo de conserto | Produtos | Valor envolvido | Quem resolve |
|---|---:|---:|---|
| custo corrompido | 30 | R$ 102.593,90 | ajuste de custo no ERP |
| saldo sem origem | 222 | R$ 58.690,23 | contagem física na loja |
| fator de conversão (qtd estimada) | 35 | R$ 52.882,00 | — |
| fator a confirmar | 19 | R$ 49.597,15 | abrir a nota primeiro |
| conferir a nota | 110 | R$ 34.052,84 | abrir a nota primeiro |
| fator de conversão | 17 | R$ 17.057,83 | quem dá entrada de NF (cadastro do produto) |
| preço a conferir | 21 | R$ 1.470,34 | quem define preço |

> **A ordem importa:** corrigir o fator de conversão ANTES do custo. Se corrigir só o
> custo, a próxima nota daquele produto reintroduz o erro, porque a entrada continua
> lançando pacote como peça.

---

## AMEND

_1 produto(s) · R$ 101.031,26_

### 12408 — MASCARA MATIZADOR COBRE AMEND 300G

- Custo no ERP: **R$ 50.515,63** · preço de venda: R$ 67,90 · saldo: 2 un · valor inflado: **R$ 101.031,26**
- Evidência: ✅ conferido: NF 60160/1 de 28/02/25 — 12,00 UN a R$ 48,73 (SAFIRA)
- **Conserto:** Corrigir o **custo médio** de R$ 50.515,63 para **R$ 48,73**. Não mexer no preço (R$ 67,90 está certo) nem no saldo.
- Efeito: o estoque desta loja reduz R$ 100.933,80 (correção, não perda)


## NATHY

_9 produto(s) · R$ 87.473,81_

### 49391 — 490CX ALGODAO CARD HID NATHY 25G

- Custo no ERP: **R$ 184,80** · preço de venda: R$ 0,02 · saldo: 134 un · valor inflado: **R$ 24.763,20**
- Evidência: comprou 3, vendeu 339 (razão 113x) · ✅ NF 47266/1 — 2,00 UN a R$ 210,00 (ERS)
- **Conserto:** Parece embalagem de 113, mas R$ 184,80 ÷ 113 = R$ 1,64, que ainda passa do preço de R$ 0,02. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,02 também não se sustenta — conferir os dois, custo e preço.

### 11043 — ALGODAO CARD HID NATHY 25G BOLA

- Custo no ERP: **R$ 204,16** · preço de venda: R$ 2,32 · saldo: 71 un · valor inflado: **R$ 14.495,36**
- Evidência: comprou 3, vendeu 344 (razão 115x) · ✅ NF 47266/1 — 3,00 UN a R$ 232,00 (ERS)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~115 peças** (estimativa: comprou 3, vendeu 344) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 115, o custo unitário cai de R$ 204,16 para R$ 1,78, margem de 31% sobre R$ 2,32.
- Efeito: o estoque desta loja reduz R$ 14.369,31 (correção, não perda)

### 17704 — BABY FD ALGODAO CARD HID NATHYBABY 40G BOLA

- Custo no ERP: **R$ 172,48** · preço de venda: R$ 4,00 · saldo: 80 un · valor inflado: **R$ 13.798,40**
- Evidência: comprou 2, vendeu 113 (razão 56x) · ✅ NF 47266/1 — 2,00 UN a R$ 196,00 (ERS)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~56 peças** (estimativa: comprou 2, vendeu 113) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 56, o custo unitário cai de R$ 172,48 para R$ 3,08, margem de 30% sobre R$ 4,00.
- Efeito: o estoque desta loja reduz R$ 13.552,00 (correção, não perda)

### 60951 — CX ALGODAO CARD HID NATHY 50G

- Custo no ERP: **R$ 184,80** · preço de venda: R$ 0,03 · saldo: 60 un · valor inflado: **R$ 11.088,00**
- Evidência: comprou 3, vendeu 175 (razão 58x) · ✅ NF 47266/1 — 2,00 UN a R$ 210,00 (ERS)
- **Conserto:** Parece embalagem de 58, mas R$ 184,80 ÷ 58 = R$ 3,19, que ainda passa do preço de R$ 0,03. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,03 também não se sustenta — conferir os dois, custo e preço.

### 49396 — ALGODAO CARD HID NATHY 50G BOLA 5PACKS

- Custo no ERP: **R$ 165,44** · preço de venda: R$ 4,00 · saldo: 59 un · valor inflado: **R$ 9.760,96**
- Evidência: comprou 4, vendeu 214 (razão 54x) · ✅ NF 47266/1 — 3,00 UN a R$ 188,00 (ERS)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~54 peças** (estimativa: comprou 4, vendeu 214) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 54, o custo unitário cai de R$ 165,44 para R$ 3,06, margem de 31% sobre R$ 4,00.
- Efeito: o estoque desta loja reduz R$ 9.580,20 (correção, não perda)

### 49392 — 1090ALGODAO CARD HID NATHY 100G BOLA

- Custo no ERP: **R$ 144,32** · preço de venda: R$ 0,08 · saldo: 46 un · valor inflado: **R$ 6.638,72**
- Evidência: comprou 4, vendeu 118 (razão 30x) · ✅ NF 47266/1 — 3,00 UN a R$ 164,00 (ERS)
- **Conserto:** Parece embalagem de 30, mas R$ 144,32 ÷ 30 = R$ 4,81, que ainda passa do preço de R$ 0,08. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,08 também não se sustenta — conferir os dois, custo e preço.

### 49393 — FD ALGODAO CARD HID NATHY 250G ROLO 40UN/FD

- Custo no ERP: **R$ 242,11** · preço de venda: R$ 0,42 · saldo: 17 un · valor inflado: **R$ 4.115,87**
- Evidência: no nome: 40UN por fardo · comprou 5, vendeu 60 (razão 12x) · ✅ NF 32238/1 — 5,00 UN a R$ 254,80 (ERS)
- **Conserto:** Parece embalagem de 40, mas R$ 242,11 ÷ 40 = R$ 6,05, que ainda passa do preço de R$ 0,42. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,42 também não se sustenta — conferir os dois, custo e preço.

### 58969 — ALGODAO QUADRADINHO 40G CARD HID NATHY

- Custo no ERP: **R$ 166,43** · preço de venda: R$ 3,94 · saldo: 10 un · valor inflado: **R$ 1.664,30**
- Evidência: comprou 3, vendeu 204 (razão 68x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~68 peças** (estimativa: comprou 3, vendeu 204) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 68, o custo unitário cai de R$ 166,43 para R$ 2,45, margem de 61% sobre R$ 3,94.
- Efeito: o estoque desta loja reduz R$ 1.639,83 (correção, não perda)

### 49395 — FD ALGODAO CARD HID NATHY 500G ROLO 20UN/FD

- Custo no ERP: **R$ 229,80** · preço de venda: R$ 31,90 · saldo: 5 un · valor inflado: **R$ 1.149,00**
- Evidência: no nome: 20UN por fardo · comprou 5, vendeu 33 (razão 7x)
- **Conserto:** Cadastrar **fator de conversão = 20** (está no nome do produto). O custo unitário cai de R$ 229,80 para **R$ 11,49** — margem de 178% sobre o preço de R$ 31,90.
- Efeito: o estoque desta loja reduz R$ 1.091,55 (correção, não perda)


## MACRILAN

_33 produto(s) · R$ 16.749,72_

### 78330 — PINCEL CONICO ILUMINAR P-03 MACRILAN

- Custo no ERP: **R$ 138,70** · preço de venda: R$ 30,88 · saldo: 12 un · valor inflado: **R$ 1.664,40**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78356 — APONTADOR PARA LAPIS MAQUIAGEM MACRILAN

- Custo no ERP: **R$ 140,80** · preço de venda: R$ 9,90 · saldo: 8 un · valor inflado: **R$ 1.126,40**
- Evidência: comprou 2, vendeu 28 (razão 14x)
- **Conserto:** Parece embalagem de 14, mas R$ 140,80 ÷ 14 = R$ 10,06, que ainda passa do preço de R$ 9,90. **Abrir a nota** e ver a unidade.

### 78341 — KIT COM 5 PINCEIS E 3 PULSEIRA MACRILAN

- Custo no ERP: **R$ 372,27** · preço de venda: R$ 6,49 · saldo: 3 un · valor inflado: **R$ 1.116,81**
- Evidência: custo 57,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78328 — PINCEL P/ CONTORNO MAQ MAX A-19 MACRILAN

- Custo no ERP: **R$ 146,63** · preço de venda: R$ 32,65 · saldo: 7 un · valor inflado: **R$ 1.026,41**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78332 — PINCEL CONICO PARA ILUMINAR P-08 MACRILAN

- Custo no ERP: **R$ 74,30** · preço de venda: R$ 16,54 · saldo: 11 un · valor inflado: **R$ 817,30**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78336 — PINCEL CONICO ESFUMAR P-12 MACRILAN

- Custo no ERP: **R$ 74,30** · preço de venda: R$ 16,54 · saldo: 11 un · valor inflado: **R$ 817,30**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78337 — PINCEL PRECISAO CONICO ESFUMAR P-13 MACRILAN

- Custo no ERP: **R$ 72,33** · preço de venda: R$ 16,10 · saldo: 10 un · valor inflado: **R$ 723,30**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78334 — PINCEL ARREDONDADO SOMBRA P-10 MACRILAN

- Custo no ERP: **R$ 64,40** · preço de venda: R$ 14,34 · saldo: 11 un · valor inflado: **R$ 708,40**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78338 — PINCEL PRECISAO ESFUMAR P-14 MACRILAN

- Custo no ERP: **R$ 64,40** · preço de venda: R$ 14,34 · saldo: 11 un · valor inflado: **R$ 708,40**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 202307 — KIT MADEMOISELLE MACRILAN

- Custo no ERP: **R$ 703,40** · preço de venda: R$ 122,10 · saldo: 1 un · valor inflado: **R$ 703,40**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 6517 — PINCEL P/ CONTORNO MAQ MAX - A16 MACRILAN

- Custo no ERP: **R$ 134,17** · preço de venda: R$ 16,00 · saldo: 5 un · valor inflado: **R$ 670,85**
- Evidência: custo 8,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78339 — PINCEL LAPIS ESFUMAR P-15 MACRILAN

- Custo no ERP: **R$ 68,36** · preço de venda: R$ 15,22 · saldo: 9 un · valor inflado: **R$ 615,24**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 202310 — ESPELHO DE AUMENTO C/ VENTOSA - MACRILAN

- Custo no ERP: **R$ 79,96** · preço de venda: R$ 15,24 · saldo: 7 un · valor inflado: **R$ 559,72**
- Evidência: custo 5,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78331 — PINCEL PARA ILUMINAR P-07 MACRILAN

- Custo no ERP: **R$ 89,16** · preço de venda: R$ 19,85 · saldo: 5 un · valor inflado: **R$ 445,80**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78333 — PINCEL PRECISAO CONTORNO P-09 MACRILAN

- Custo no ERP: **R$ 74,30** · preço de venda: R$ 16,54 · saldo: 6 un · valor inflado: **R$ 445,80**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 202302 — PINCEL CONICO M P/ ESFUMAR MAX A35 MACRILAN

- Custo no ERP: **R$ 88,09** · preço de venda: R$ 15,28 · saldo: 5 un · valor inflado: **R$ 440,45**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78355 — ESPONJA GOTA PARA MAQUIAGEM - MACRILAN

- Custo no ERP: **R$ 50,20** · preço de venda: R$ 0,72 · saldo: 8 un · valor inflado: **R$ 401,60**
- Evidência: preço de R$ 0,72 com custo de R$ 50,20
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 64584 — ESPONJA GOTA PARA MAQUIAGEM MACRILAN

- Custo no ERP: **R$ 36,29** · preço de venda: R$ 8,71 · saldo: 11 un · valor inflado: **R$ 399,19**
- Evidência: custo 4,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 556 — PINCEL PROF OVAL PRECISAO MAX - A05 MACRILAN

- Custo no ERP: **R$ 176,19** · preço de venda: R$ 23,00 · saldo: 2 un · valor inflado: **R$ 352,38**
- Evidência: custo 7,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 202305 — COLA CILIOS POSTICOS PRETA - MACRILAN

- Custo no ERP: **R$ 88,09** · preço de venda: R$ 15,28 · saldo: 4 un · valor inflado: **R$ 352,36**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78335 — PINCEL  PRECISAO SOMBRA P-11

- Custo no ERP: **R$ 54,49** · preço de venda: R$ 12,13 · saldo: 6 un · valor inflado: **R$ 326,94**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78340 — PINCEL PARA DELINEAR P-16 MACRILAN

- Custo no ERP: **R$ 54,49** · preço de venda: R$ 12,13 · saldo: 6 un · valor inflado: **R$ 326,94**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78359 — KIT 5 ESPONJAS

- Custo no ERP: **R$ 73,75** · preço de venda: R$ 14,56 · saldo: 4 un · valor inflado: **R$ 295,00**
- Evidência: custo 5,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 202301 — PINCEL KABUKI GOTA PRECIS MAX MACRILAN

- Custo no ERP: **R$ 142,31** · preço de venda: R$ 24,70 · saldo: 2 un · valor inflado: **R$ 284,62**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 202303 — PINCEL PROF DUO FIBER TOPO RETO A39 MACRILAN

- Custo no ERP: **R$ 134,85** · preço de venda: R$ 23,40 · saldo: 2 un · valor inflado: **R$ 269,70**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78363 — CURVADOR DE CILIOS MACRILAN

- Custo no ERP: **R$ 44,14** · preço de venda: R$ 8,38 · saldo: 6 un · valor inflado: **R$ 264,84**
- Evidência: custo 5,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78362 — ESPONJA GOTA CHANFRADA P/ MAQUIAGEM - MACRILAN

- Custo no ERP: **R$ 53,73** · preço de venda: R$ 0,73 · saldo: 4 un · valor inflado: **R$ 214,92**
- Evidência: preço de R$ 0,73 com custo de R$ 53,73
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 78360 — PINCEL KABUKI PRETO B115 MACRILAN

- Custo no ERP: **R$ 150,85** · preço de venda: R$ 29,78 · saldo: 1 un · valor inflado: **R$ 150,85**
- Evidência: custo 5,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78329 — PINCEL CONICO PARA P-02 MACRILAN

- Custo no ERP: **R$ 133,75** · preço de venda: R$ 29,78 · saldo: 1 un · valor inflado: **R$ 133,75**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78361 — ESPONJA COM DUAS - MACRILAN

- Custo no ERP: **R$ 59,86** · preço de venda: R$ 0,87 · saldo: 2 un · valor inflado: **R$ 119,72**
- Evidência: preço de R$ 0,87 com custo de R$ 59,86
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 202306 — PINCEL PROFISSIONAL PARA FACE MACRILAN

- Custo no ERP: **R$ 100,97** · preço de venda: R$ 17,52 · saldo: 1 un · valor inflado: **R$ 100,97**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78357 — PINCEL PROF P/ DELINEAR B-104

- Custo no ERP: **R$ 42,46** · preço de venda: R$ 8,38 · saldo: 2 un · valor inflado: **R$ 84,92**
- Evidência: custo 5,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 202308 — ESPONJA PARA MAQUIAGEM REDONDA - MACRILAN

- Custo no ERP: **R$ 40,52** · preço de venda: R$ 7,02 · saldo: 2 un · valor inflado: **R$ 81,04**
- Evidência: custo 5,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## KISS NEW YORK

_7 produto(s) · R$ 16.256,82_

### 204099 — KISS NY NAVALHA SOBRANC CURTO (72 UN)

- Custo no ERP: **R$ 243,72** · preço de venda: R$ 6,90 · saldo: 49 un · valor inflado: **R$ 11.942,28**
- Evidência: no nome: (72 UN) · comprou 1, vendeu 7 (razão 7x) · ✅ NF 553874/1 — 1,00 UN a R$ 253,87 (IMBECOR)
- **Conserto:** Cadastrar **fator de conversão = 72** (está no nome do produto). O custo unitário cai de R$ 243,72 para **R$ 3,38** — margem de 104% sobre o preço de R$ 6,90.
- Efeito: o estoque desta loja reduz R$ 11.776,42 (correção, não perda)

### 204098 — KISS NY NAVALHA SOBRANC LONGO (72 UN)

- Custo no ERP: **R$ 243,72** · preço de venda: R$ 6,90 · saldo: 12 un · valor inflado: **R$ 2.924,64**
- Evidência: no nome: (72 UN) · comprou 1, vendeu 45 (razão 45x) · ✅ NF 553874/1 — 1,00 UN a R$ 253,87 (IMBECOR)
- **Conserto:** Cadastrar **fator de conversão = 72** (está no nome do produto). O custo unitário cai de R$ 243,72 para **R$ 3,38** — margem de 104% sobre o preço de R$ 6,90.
- Efeito: o estoque desta loja reduz R$ 2.884,02 (correção, não perda)

### 11100 — KISS NY NAVALHA SOBRANC LONGO

- Custo no ERP: **R$ 234,51** · preço de venda: R$ 6,90 · saldo: 3 un · valor inflado: **R$ 703,53**
- Evidência: comprou 6, vendeu 240 (razão 40x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~40 peças** (estimativa: comprou 6, vendeu 240) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 40, o custo unitário cai de R$ 234,51 para R$ 5,86, margem de 18% sobre R$ 6,90.
- Efeito: o estoque desta loja reduz R$ 685,94 (correção, não perda)

### 28367 — KISS NY PINCA PONTA FINA

- Custo no ERP: **R$ 3,32** · preço de venda: R$ 0,08 · saldo: 111 un · valor inflado: **R$ 368,52**
- Evidência: comprou 2, vendeu 35 (razão 18x)
- **Conserto:** Parece embalagem de 18, mas R$ 3,32 ÷ 18 = R$ 0,18, que ainda passa do preço de R$ 0,08. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,08 também não se sustenta — conferir os dois, custo e preço.

### 28362 — MS OURO RK

- Custo no ERP: **R$ 140,44** · preço de venda: R$ 13,92 · saldo: 1 un · valor inflado: **R$ 140,44**
- Evidência: comprou 2, vendeu 25 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 2, vendeu 25) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 140,44 para R$ 11,70, margem de 19% sobre R$ 13,92.
- Efeito: o estoque desta loja reduz R$ 128,74 (correção, não perda)

### 47506 — RK STIX OMIRAC PROT LABIAL LIP ELIX BOX

- Custo no ERP: **R$ 104,96** · preço de venda: R$ 9,99 · saldo: 1 un · valor inflado: **R$ 104,96**
- Evidência: comprou 1, vendeu 9 (razão 9x)
- **Conserto:** Parece embalagem de 9, mas R$ 104,96 ÷ 9 = R$ 11,66, que ainda passa do preço de R$ 9,99. **Abrir a nota** e ver a unidade.

### 28365 — LIXA BLOCO 4 FACES KISS

- Custo no ERP: **R$ 3,45** · preço de venda: R$ 0,33 · saldo: 21 un · valor inflado: **R$ 72,45**
- Evidência: comprou 3, vendeu 74 (razão 25x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~25 peças** (estimativa: comprou 3, vendeu 74) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 25, o custo unitário cai de R$ 3,45 para R$ 0,14, margem de 139% sobre R$ 0,33.
- Efeito: o estoque desta loja reduz R$ 69,55 (correção, não perda)


## PROBELLE PROFISSIONAL

_3 produto(s) · R$ 11.079,60_

### 20358 — AMP ARGAN PROBELLE 17 ML

- Custo no ERP: **R$ 81,40** · preço de venda: R$ 10,90 · saldo: 108 un · valor inflado: **R$ 8.791,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18613 — AMP EXTRATO ARGAN PROBELLE 17 ML

- Custo no ERP: **R$ 90,63** · preço de venda: R$ 16,90 · saldo: 24 un · valor inflado: **R$ 2.175,12**
- Evidência: custo 5,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 23814 — PO DESC ULTRA BLONDE COCO SACHE PROBELLE 50G

- Custo no ERP: **R$ 56,64** · preço de venda: R$ 17,90 · saldo: 2 un · valor inflado: **R$ 113,28**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## LUDURANA NAO USAR

_26 produto(s) · R$ 10.043,84_

### 61983 — PALETA DE SOMBRAS 9 CORES OPULENCE

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 11 un · valor inflado: **R$ 1.639,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61981 — PALETA DE SOMBRAS ROMANCE

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 9 un · valor inflado: **R$ 1.341,72**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61975 — QUARTETO DE CONTORNO LUDURANA 12G

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 5 un · valor inflado: **R$ 745,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58938 — QUARTETO DE SOMBRAS SIGNOS ESCORPIAO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 6 un · valor inflado: **R$ 712,80**
- Evidência: custo 5,7x o preço _(histórico da L4 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 61979 — PALETA DE SOMBRAS CHERRY POP

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 4 un · valor inflado: **R$ 596,32**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58937 — QUARTETO DE SOMBRAS SIGNOS CAPRICORNIO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 5 un · valor inflado: **R$ 594,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58932 — BATOM LUDURANA LIQ. MATTE  CEREJA 4ML

- Custo no ERP: **R$ 82,68** · preço de venda: R$ 13,90 · saldo: 7 un · valor inflado: **R$ 578,76**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58953 — PALETA DE SOMBRAS NUANCES 9 CORES  NUDE

- Custo no ERP: **R$ 181,20** · preço de venda: R$ 30,90 · saldo: 3 un · valor inflado: **R$ 543,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58930 — BATOM LUDURANA LIQ. MATTE  CARMINE 4ML

- Custo no ERP: **R$ 82,68** · preço de venda: R$ 13,90 · saldo: 6 un · valor inflado: **R$ 496,08**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58939 — QUARTETO DE SOMBRAS SIGNOS LEAO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 4 un · valor inflado: **R$ 475,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58941 — QUARTETO DE SOMBRAS SIGNOS SAGITARIO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 3 un · valor inflado: **R$ 356,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58933 — BATOM LUDURANA LIQ. MATTE  ESCARLATE 4ML

- Custo no ERP: **R$ 82,68** · preço de venda: R$ 13,90 · saldo: 4 un · valor inflado: **R$ 330,72**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58934 — BLUSH COMPACTO ULTRAFINO N01

- Custo no ERP: **R$ 193,92** · preço de venda: R$ 16,90 · saldo: 1 un · valor inflado: **R$ 193,92**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58936 — PO COMPACTO ULTRAFINO 8G 05

- Custo no ERP: **R$ 193,92** · preço de venda: R$ 16,90 · saldo: 1 un · valor inflado: **R$ 193,92**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58945 — QUARTETO DE BLUSH LUDURANA 12G

- Custo no ERP: **R$ 170,40** · preço de venda: R$ 28,90 · saldo: 1 un · valor inflado: **R$ 170,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58935 — PO COMPACTO LUDURANA 05

- Custo no ERP: **R$ 165,36** · preço de venda: R$ 13,90 · saldo: 1 un · valor inflado: **R$ 165,36**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58944 — QUARTETO DE BLUSH ULTRA FINO COM SILICONE 10G

- Custo no ERP: **R$ 153,24** · preço de venda: R$ 25,90 · saldo: 1 un · valor inflado: **R$ 153,24**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61982 — PALETA DE SOMBRAS 9 CORES  FANCY

- Custo no ERP: **R$ 149,08** · preço de venda: R$ 28,90 · saldo: 1 un · valor inflado: **R$ 149,08**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58956 — MASCARA DE CILIOS LONGO EXTRA

- Custo no ERP: **R$ 140,17** · preço de venda: R$ 23,90 · saldo: 1 un · valor inflado: **R$ 140,17**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58957 — MASCARA PARA CILIOS VOLUME EXTRA

- Custo no ERP: **R$ 140,17** · preço de venda: R$ 23,90 · saldo: 1 un · valor inflado: **R$ 140,17**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58942 — QUARTETO DE SOMBRAS SIGNOS TOURO

- Custo no ERP: **R$ 118,80** · preço de venda: R$ 20,90 · saldo: 1 un · valor inflado: **R$ 118,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61970 — ESMALTE LUDURANA CREMOSO NEON ROSA  SOLTO 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 4 un · valor inflado: **R$ 92,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61971 — ESMALTE LUDURANA CREMOSO NEON VERDE  SOLTO 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 2 un · valor inflado: **R$ 46,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61967 — ESMALTE LUDURANA CREMOSO MARSALA SOLTO ELITE 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,10**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61969 — ESMALTE LUDURANA CREMOSO NEON  LARANJA SOLTO 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,10**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61972 — ESMALTE LUDURANA CREMOSO NEON VIOLETA  SOLTO 8ML

- Custo no ERP: **R$ 23,10** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,10**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## SANTA CLARA

_21 produto(s) · R$ 9.291,82_

### 17665 — TOALHA COMP MULT DESC 250

- Custo no ERP: **R$ 37,40** · preço de venda: R$ 1,00 · saldo: 207 un · valor inflado: **R$ 7.741,80**
- Evidência: comprou 1, vendeu 184 (razão 184x) · ✅ NF 647502/1 — **1,00 CX** a R$ 71,75 (SANTA CLARA)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~184 peças** (estimativa: comprou 1, vendeu 184) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 184, o custo unitário cai de R$ 37,40 para R$ 0,20, margem de 392% sobre R$ 1,00.
- Efeito: o estoque desta loja reduz R$ 7.699,72 (correção, não perda)

### 78755 — LIXA UNHA ESTAMP.C/50

- Custo no ERP: **R$ 41,86** · preço de venda: R$ 3,90 · saldo: 10 un · valor inflado: **R$ 418,60**
- Evidência: no nome: C/50 · comprou 2, vendeu 14 (razão 7x)
- **Conserto:** Cadastrar **fator de conversão = 50** (está no nome do produto). O custo unitário cai de R$ 41,86 para **R$ 0,84** — margem de 366% sobre o preço de R$ 3,90.
- Efeito: o estoque desta loja reduz R$ 410,23 (correção, não perda)

### 4241 — LAMINA SUPER MAX ST CLARA 354

- Custo no ERP: **R$ 13,00** · preço de venda: R$ 3,90 · saldo: 28 un · valor inflado: **R$ 364,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1731 — PALITO UNHA CHANF UN SANTA CLARA

- Custo no ERP: **R$ 16,83** · preço de venda: R$ 2,90 · saldo: 14 un · valor inflado: **R$ 235,62**
- Evidência: comprou 3, vendeu 31 (razão 10x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~10 peças** (estimativa: comprou 3, vendeu 31) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 10, o custo unitário cai de R$ 16,83 para R$ 1,68, margem de 72% sobre R$ 2,90.
- Efeito: o estoque desta loja reduz R$ 212,06 (correção, não perda)

### 5519 — PO ADGISTRENTE SANTA CLARA 20G

- Custo no ERP: **R$ 42,88** · preço de venda: R$ 0,92 · saldo: 2 un · valor inflado: **R$ 85,76**
- Evidência: comprou 1, vendeu 24 (razão 24x)
- **Conserto:** Parece embalagem de 24, mas R$ 42,88 ÷ 24 = R$ 1,79, que ainda passa do preço de R$ 0,92. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,92 também não se sustenta — conferir os dois, custo e preço.

### 1853 — LIXA PES PQ ST CLARA 1228 UN

- Custo no ERP: **R$ 14,28** · preço de venda: R$ 2,50 · saldo: 4 un · valor inflado: **R$ 57,12**
- Evidência: no nome: 1228 UN · comprou 2, vendeu 18 (razão 9x)
- **Conserto:** Cadastrar **fator de conversão = 1.228** (está no nome do produto). O custo unitário cai de R$ 14,28 para **R$ 0,01** — margem de 21.399% sobre o preço de R$ 2,50.
- Efeito: o estoque desta loja reduz R$ 57,07 (correção, não perda)

### 15947 — LIXA M POP PARDA C/100 SANTA CLARA

- Custo no ERP: **R$ 5,13** · preço de venda: R$ 0,25 · saldo: 10 un · valor inflado: **R$ 51,30**
- Evidência: no nome: C/100
- **Conserto:** Cadastrar **fator de conversão = 100** (está no nome do produto). O custo unitário cai de R$ 5,13 para **R$ 0,05** — margem de 387% sobre o preço de R$ 0,25.
- Efeito: o estoque desta loja reduz R$ 50,79 (correção, não perda)

### 15948 — LIXA M.POP.PRETA - UN

- Custo no ERP: **R$ 5,13** · preço de venda: R$ 0,25 · saldo: 10 un · valor inflado: **R$ 51,30**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 204360 — NAVALHETE PLASTICA CABO MARROM - SANTA CLARA

- Custo no ERP: **R$ 8,20** · preço de venda: R$ 1,06 · saldo: 6 un · valor inflado: **R$ 49,20**
- Evidência: custo 7,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 65129 — LIXA MEDIA RS.P/UNHA PCT.C/100

- Custo no ERP: **R$ 4,14** · preço de venda: R$ 0,25 · saldo: 10 un · valor inflado: **R$ 41,40**
- Evidência: no nome: C/100
- **Conserto:** Cadastrar **fator de conversão = 100** (está no nome do produto). O custo unitário cai de R$ 4,14 para **R$ 0,04** — margem de 504% sobre o preço de R$ 0,25.
- Efeito: o estoque desta loja reduz R$ 40,99 (correção, não perda)

### 15915 — UNHA POST LEIT PES 3320 ST CLARA

- Custo no ERP: **R$ 35,36** · preço de venda: R$ 3,26 · saldo: 1 un · valor inflado: **R$ 35,36**
- Evidência: comprou 1, vendeu 12 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 1, vendeu 12) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 35,36 para R$ 2,95, margem de 11% sobre R$ 3,26.
- Efeito: o estoque desta loja reduz R$ 32,41 (correção, não perda)

### 8059 — ESC PLAST OVAL MASS S CLARA

- Custo no ERP: **R$ 6,58** · preço de venda: R$ 1,90 · saldo: 5 un · valor inflado: **R$ 32,90**
- Evidência: comprou 1, vendeu 11 (razão 11x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~11 peças** (estimativa: comprou 1, vendeu 11) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 11, o custo unitário cai de R$ 6,58 para R$ 0,60, margem de 218% sobre R$ 1,90.
- Efeito: o estoque desta loja reduz R$ 29,91 (correção, não perda)

### 204359 — ESCOVA LRJ/VR.N.FLEX COLOR

- Custo no ERP: **R$ 11,49** · preço de venda: R$ 1,06 · saldo: 2 un · valor inflado: **R$ 22,98**
- Evidência: custo 10,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 1141 — LIXA EXTRA GROSA ST CLARA UN

- Custo no ERP: **R$ 7,07** · preço de venda: R$ 0,25 · saldo: 3 un · valor inflado: **R$ 21,21**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 4229 — LIXA P/UNHAS MINI EXTRA 128

- Custo no ERP: **R$ 2,09** · preço de venda: R$ 0,15 · saldo: 10 un · valor inflado: **R$ 20,90**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 59053 — PIRANHA ST  CLARA

- Custo no ERP: **R$ 15,48** · preço de venda: R$ 0,72 · saldo: 1 un · valor inflado: **R$ 15,48**
- Evidência: comprou 1, vendeu 123 (razão 123x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~123 peças** (estimativa: comprou 1, vendeu 123) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 123, o custo unitário cai de R$ 15,48 para R$ 0,13, margem de 472% sobre R$ 0,72.
- Efeito: o estoque desta loja reduz R$ 15,35 (correção, não perda)

### 8637 — LENCOL DESC ST CLARA 15UN

- Custo no ERP: **R$ 14,46** · preço de venda: R$ 2,10 · saldo: 1 un · valor inflado: **R$ 14,46**
- Evidência: no nome: 15 UN
- **Conserto:** Cadastrar **fator de conversão = 15** (está no nome do produto). O custo unitário cai de R$ 14,46 para **R$ 0,96** — margem de 118% sobre o preço de R$ 2,10.
- Efeito: o estoque desta loja reduz R$ 13,50 (correção, não perda)

### 8036 — REFIL LIXA 12UN 753/754 S CLARA 2118

- Custo no ERP: **R$ 2,66** · preço de venda: R$ 0,50 · saldo: 5 un · valor inflado: **R$ 13,30**
- Evidência: no nome: 12 UN
- **Conserto:** Cadastrar **fator de conversão = 12** (está no nome do produto). O custo unitário cai de R$ 2,66 para **R$ 0,22** — margem de 126% sobre o preço de R$ 0,50.
- Efeito: o estoque desta loja reduz R$ 12,19 (correção, não perda)

### 42839 — LIXA MINI CANARIO P/UNHAS C/20

- Custo no ERP: **R$ 0,98** · preço de venda: R$ 0,12 · saldo: 10 un · valor inflado: **R$ 9,80**
- Evidência: no nome: C/20
- **Conserto:** Cadastrar **fator de conversão = 20** (está no nome do produto). O custo unitário cai de R$ 0,98 para **R$ 0,05** — margem de 145% sobre o preço de R$ 0,12.
- Efeito: o estoque desta loja reduz R$ 9,31 (correção, não perda)

### 78766 — ESPATULA DUPLA PRATA 180G C/25

- Custo no ERP: **R$ 6,54** · preço de venda: R$ 1,90 · saldo: 1 un · valor inflado: **R$ 6,54**
- Evidência: no nome: C/25
- **Conserto:** Cadastrar **fator de conversão = 25** (está no nome do produto). O custo unitário cai de R$ 6,54 para **R$ 0,26** — margem de 626% sobre o preço de R$ 1,90.
- Efeito: o estoque desta loja reduz R$ 6,28 (correção, não perda)

### 48793 — LIXA MINI PRETA P/UNHAS C/20

- Custo no ERP: **R$ 0,93** · preço de venda: R$ 0,10 · saldo: 3 un · valor inflado: **R$ 2,79**
- Evidência: no nome: C/20
- **Conserto:** Cadastrar **fator de conversão = 20** (está no nome do produto). O custo unitário cai de R$ 0,93 para **R$ 0,05** — margem de 115% sobre o preço de R$ 0,10.
- Efeito: o estoque desta loja reduz R$ 2,65 (correção, não perda)


## JONALISSA BIJOUX LTDA

_14 produto(s) · R$ 8.322,00_

### 62786 — LAÇO COLORIDO

- Custo no ERP: **R$ 84,00** · preço de venda: R$ 21,90 · saldo: 24 un · valor inflado: **R$ 2.016,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62787 — LAÇO CHARME

- Custo no ERP: **R$ 90,00** · preço de venda: R$ 22,90 · saldo: 22 un · valor inflado: **R$ 1.980,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62788 — LAÇO DE PALHA XADREZ

- Custo no ERP: **R$ 108,00** · preço de venda: R$ 27,90 · saldo: 15 un · valor inflado: **R$ 1.620,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62783 — BICO DE PATO CHAPEU XADREZ

- Custo no ERP: **R$ 96,00** · preço de venda: R$ 24,90 · saldo: 6 un · valor inflado: **R$ 576,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62784 — BICO DE PATO GIRASOL

- Custo no ERP: **R$ 72,00** · preço de venda: R$ 18,90 · saldo: 6 un · valor inflado: **R$ 432,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61568 — NECESSAIRE WASHBAG

- Custo no ERP: **R$ 204,00** · preço de venda: R$ 42,90 · saldo: 2 un · valor inflado: **R$ 408,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61567 — BOLSA  LUA WASHBAG

- Custo no ERP: **R$ 390,00** · preço de venda: R$ 81,90 · saldo: 1 un · valor inflado: **R$ 390,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62794 — ANEL COLORIDO DE PLASTICO

- Custo no ERP: **R$ 48,00** · preço de venda: R$ 3,90 · saldo: 8 un · valor inflado: **R$ 384,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62789 — XUXINHA DE FITA

- Custo no ERP: **R$ 60,00** · preço de venda: R$ 15,90 · saldo: 4 un · valor inflado: **R$ 240,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62785 — GRAVATA XADREZ

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 8,90 · saldo: 3 un · valor inflado: **R$ 90,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62790 — TRIO DE GRAMPO

- Custo no ERP: **R$ 54,00** · preço de venda: R$ 13,90 · saldo: 1 un · valor inflado: **R$ 54,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62796 — PRESILHA

- Custo no ERP: **R$ 54,00** · preço de venda: R$ 14,90 · saldo: 1 un · valor inflado: **R$ 54,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62791 — BRINCO COLORIDO BR329-7

- Custo no ERP: **R$ 42,00** · preço de venda: R$ 10,90 · saldo: 1 un · valor inflado: **R$ 42,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62792 — BRINCO ARGOLA COLORIDA

- Custo no ERP: **R$ 36,00** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 36,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## NOVEX

_18 produto(s) · R$ 6.114,72_

### 53774 — Vitay Novex Superfood Maracuja&Mirtilo Sh+Trat Con

- Custo no ERP: **R$ 153,77** · preço de venda: R$ 24,90 · saldo: 6 un · valor inflado: **R$ 922,62**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53777 — Vitay Novex Superfood Cacau&Amendoas Sh+Trat Cond

- Custo no ERP: **R$ 153,77** · preço de venda: R$ 24,90 · saldo: 6 un · valor inflado: **R$ 922,62**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53786 — Meus Cachos O Especialista Cresp Solto De 3em1 CPP

- Custo no ERP: **R$ 117,08** · preço de venda: R$ 37,90 · saldo: 6 un · valor inflado: **R$ 702,48**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53785 — Meus Cachos O Especialista CacLevComVol3em1CPPCond

- Custo no ERP: **R$ 117,08** · preço de venda: R$ 37,90 · saldo: 5 un · valor inflado: **R$ 585,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53763 — Novex Recarga Potassio Superfood Biomassa Banana 8

- Custo no ERP: **R$ 76,56** · preço de venda: R$ 12,90 · saldo: 6 un · valor inflado: **R$ 459,36**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53756 — Novex Recarga de Queratina Cond 80g

- Custo no ERP: **R$ 11,08** · preço de venda: R$ 1,07 · saldo: 36 un · valor inflado: **R$ 398,88**
- Evidência: custo 10,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 53757 — Meus Cachos Recarga de Oleos Santo Black Cond 80g

- Custo no ERP: **R$ 76,94** · preço de venda: R$ 12,90 · saldo: 4 un · valor inflado: **R$ 307,76**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53778 — Novex Superfood Cacau&Amendoas Cr Trat Cond 1kg

- Custo no ERP: **R$ 101,15** · preço de venda: R$ 32,90 · saldo: 3 un · valor inflado: **R$ 303,45**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53792 — Pelucia Mascara de Tratamento Jabuticaba Cond 500g

- Custo no ERP: **R$ 51,78** · preço de venda: R$ 16,90 · saldo: 5 un · valor inflado: **R$ 258,90**
- Evidência: custo 3,1x o preço _(histórico da L4 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 53771 — Novex Superfood Biomassa de Banana CrTratCond 1kg

- Custo no ERP: **R$ 101,15** · preço de venda: R$ 32,90 · saldo: 2 un · valor inflado: **R$ 202,30**
- Evidência: custo 3,1x o preço _(histórico da L4 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 53770 — Novex Superfood Biomassa de Banana Trat Cond 300mL

- Custo no ERP: **R$ 61,19** · preço de venda: R$ 19,90 · saldo: 3 un · valor inflado: **R$ 183,57**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53769 — Vitay Superfood Biomassa de Banana Shampoo 300mL

- Custo no ERP: **R$ 52,08** · preço de venda: R$ 16,90 · saldo: 3 un · valor inflado: **R$ 156,24**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53761 — Novex Recarg aHidratacao Profunda SuperBabosao Con

- Custo no ERP: **R$ 76,94** · preço de venda: R$ 12,90 · saldo: 2 un · valor inflado: **R$ 153,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53759 — Novex Recarga Vitam Superfood Marac&Mirtilo 80g

- Custo no ERP: **R$ 76,40** · preço de venda: R$ 12,90 · saldo: 2 un · valor inflado: **R$ 152,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53741 — Novex Cicatrizacao dos Fios Cr Trat Cond 400g

- Custo no ERP: **R$ 62,88** · preço de venda: R$ 19,90 · saldo: 2 un · valor inflado: **R$ 125,76**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53740 — Novex Cicatrizacao dos Fios Cr Trat Cond 1kg

- Custo no ERP: **R$ 101,15** · preço de venda: R$ 32,90 · saldo: 1 un · valor inflado: **R$ 101,15**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53775 — Novex Superfood Maracuja&Mirtilo Cr Trat Cond 1kg

- Custo no ERP: **R$ 101,15** · preço de venda: R$ 32,90 · saldo: 1 un · valor inflado: **R$ 101,15**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53764 — Novex Recarga Vitaminas Superf Cacau&Amendoas Cond

- Custo no ERP: **R$ 76,40** · preço de venda: R$ 12,90 · saldo: 1 un · valor inflado: **R$ 76,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## TALGE

_21 produto(s) · R$ 4.186,99_

### 49245 — LUVA NITRILICA AZUL TALGE

- Custo no ERP: **R$ 699,00** · preço de venda: R$ 79,90 · saldo: 1 un · valor inflado: **R$ 699,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 23846 — LUVA NITRILICA ROSA S/PO M TALGE

- Custo no ERP: **R$ 110,12** · preço de venda: R$ 4,20 · saldo: 5 un · valor inflado: **R$ 550,60**
- Evidência: comprou 1, vendeu 15 (razão 15x)
- **Conserto:** Parece embalagem de 15, mas R$ 110,12 ÷ 15 = R$ 7,34, que ainda passa do preço de R$ 4,20. **Abrir a nota** e ver a unidade.

### 49244 — LUVA DE VINIL SEM PO

- Custo no ERP: **R$ 550,00** · preço de venda: R$ 27,00 · saldo: 1 un · valor inflado: **R$ 550,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18506 — LUVA TALGE VINIL C/PO G

- Custo no ERP: **R$ 294,74** · preço de venda: R$ 22,00 · saldo: 1 un · valor inflado: **R$ 294,74**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57973 — LUVA NITRILICA ROSA S/PO M     -LOTE:TLNT056 VAL.0

- Custo no ERP: **R$ 131,00** · preço de venda: R$ 25,80 · saldo: 2 un · valor inflado: **R$ 262,00**
- Evidência: custo 5,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 59440 — LUVA NITRILICA PRETA SEM PO P

- Custo no ERP: **R$ 165,00** · preço de venda: R$ 40,90 · saldo: 1 un · valor inflado: **R$ 165,00**
- Evidência: custo 4,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 51207 — LUVA VINIL P COM PO TALGE

- Custo no ERP: **R$ 16,14** · preço de venda: R$ 2,20 · saldo: 10 un · valor inflado: **R$ 161,40**
- Evidência: comprou 2, vendeu 16 (razão 8x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~8 peças** (estimativa: comprou 2, vendeu 16) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 8, o custo unitário cai de R$ 16,14 para R$ 2,02, margem de 9% sobre R$ 2,20.
- Efeito: o estoque desta loja reduz R$ 141,22 (correção, não perda)

### 4742 — LUVA TALGE DESC LATEX C/ PO TAM G

- Custo no ERP: **R$ 31,11** · preço de venda: R$ 3,80 · saldo: 5 un · valor inflado: **R$ 155,55**
- Evidência: comprou 1, vendeu 8 (razão 8x)
- **Conserto:** Parece embalagem de 8, mas R$ 31,11 ÷ 8 = R$ 3,89, que ainda passa do preço de R$ 3,80. **Abrir a nota** e ver a unidade.

### 13495 — LUVA NITRILICA AZUL M SEM PO TALGE

- Custo no ERP: **R$ 145,00** · preço de venda: R$ 48,00 · saldo: 1 un · valor inflado: **R$ 145,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 79925 — LUVA PROC. VINIL S/PO P

- Custo no ERP: **R$ 135,00** · preço de venda: R$ 3,00 · saldo: 1 un · valor inflado: **R$ 135,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 79926 — LUVA PROC. VINIL C/PO P

- Custo no ERP: **R$ 135,00** · preço de venda: R$ 28,00 · saldo: 1 un · valor inflado: **R$ 135,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 79927 — LUVA PROC. VINIL C/PO G

- Custo no ERP: **R$ 135,00** · preço de venda: R$ 28,00 · saldo: 1 un · valor inflado: **R$ 135,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 4741 — LUVA TALGE DESC LATEX C/ PO TAM M

- Custo no ERP: **R$ 133,56** · preço de venda: R$ 40,90 · saldo: 1 un · valor inflado: **R$ 133,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 16845 — LUVA  NITRILICAS PRETA TALGE M S/PO

- Custo no ERP: **R$ 33,33** · preço de venda: R$ 6,39 · saldo: 4 un · valor inflado: **R$ 133,32**
- Evidência: comprou 1, vendeu 18 (razão 18x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~18 peças** (estimativa: comprou 1, vendeu 18) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 18, o custo unitário cai de R$ 33,33 para R$ 1,85, margem de 245% sobre R$ 6,39.
- Efeito: o estoque desta loja reduz R$ 125,91 (correção, não perda)

### 51209 — LUVA VINIL SEM PO G CX C-100

- Custo no ERP: **R$ 22,09** · preço de venda: R$ 2,20 · saldo: 5 un · valor inflado: **R$ 110,45**
- Evidência: comprou 1, vendeu 10 (razão 10x)
- **Conserto:** Parece embalagem de 10, mas R$ 22,09 ÷ 10 = R$ 2,21, que ainda passa do preço de R$ 2,20. **Abrir a nota** e ver a unidade.

### 53846 — LUVA VINIL SEM PO M CX C-100

- Custo no ERP: **R$ 9,45** · preço de venda: R$ 2,20 · saldo: 9 un · valor inflado: **R$ 85,05**
- Evidência: comprou 1, vendeu 26 (razão 26x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~26 peças** (estimativa: comprou 1, vendeu 26) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 26, o custo unitário cai de R$ 9,45 para R$ 0,36, margem de 505% sobre R$ 2,20.
- Efeito: o estoque desta loja reduz R$ 81,78 (correção, não perda)

### 18505 — LUVA TALGE VINIL COM PO M

- Custo no ERP: **R$ 9,64** · preço de venda: R$ 2,21 · saldo: 8 un · valor inflado: **R$ 77,12**
- Evidência: comprou 2, vendeu 22 (razão 11x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~11 peças** (estimativa: comprou 2, vendeu 22) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 11, o custo unitário cai de R$ 9,64 para R$ 0,88, margem de 152% sobre R$ 2,21.
- Efeito: o estoque desta loja reduz R$ 70,11 (correção, não perda)

### 53848 — LUVA LATEX C/PO P CX-100 UN

- Custo no ERP: **R$ 15,36** · preço de venda: R$ 4,20 · saldo: 5 un · valor inflado: **R$ 76,80**
- Evidência: no nome: 100 UN · comprou 1, vendeu 9 (razão 9x)
- **Conserto:** Cadastrar **fator de conversão = 100** (está no nome do produto). O custo unitário cai de R$ 15,36 para **R$ 0,15** — margem de 2.634% sobre o preço de R$ 4,20.
- Efeito: o estoque desta loja reduz R$ 76,03 (correção, não perda)

### 53849 — LUVA LATEX C/PO M CX-100 UN

- Custo no ERP: **R$ 15,36** · preço de venda: R$ 3,80 · saldo: 5 un · valor inflado: **R$ 76,80**
- Evidência: no nome: 100 UN · comprou 1, vendeu 25 (razão 25x)
- **Conserto:** Cadastrar **fator de conversão = 100** (está no nome do produto). O custo unitário cai de R$ 15,36 para **R$ 0,15** — margem de 2.374% sobre o preço de R$ 3,80.
- Efeito: o estoque desta loja reduz R$ 76,03 (correção, não perda)

### 16844 — LUVA TALGE DESC NITRILICAS G

- Custo no ERP: **R$ 18,33** · preço de venda: R$ 4,80 · saldo: 4 un · valor inflado: **R$ 73,32**
- Evidência: comprou 1, vendeu 17 (razão 17x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~17 peças** (estimativa: comprou 1, vendeu 17) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 17, o custo unitário cai de R$ 18,33 para R$ 1,08, margem de 345% sobre R$ 4,80.
- Efeito: o estoque desta loja reduz R$ 69,01 (correção, não perda)

### 51402 — LUVA TALGE VINIL SEM PO P TALGE

- Custo no ERP: **R$ 16,14** · preço de venda: R$ 2,20 · saldo: 2 un · valor inflado: **R$ 32,28**
- Evidência: comprou 1, vendeu 13 (razão 13x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~13 peças** (estimativa: comprou 1, vendeu 13) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 13, o custo unitário cai de R$ 16,14 para R$ 1,24, margem de 77% sobre R$ 2,20.
- Efeito: o estoque desta loja reduz R$ 29,80 (correção, não perda)


## VIEW

_6 produto(s) · R$ 4.119,50_

### 42861 — SOMBRA INFANTIL FROZEN

- Custo no ERP: **R$ 134,41** · preço de venda: R$ 10,90 · saldo: 25 un · valor inflado: **R$ 3.360,25**
- Evidência: custo 12,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 42858 — BATOM INFANTIL FROZEN

- Custo no ERP: **R$ 151,85** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 151,85**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42865 — BRILHO LABIAL INFANTIL MOANA

- Custo no ERP: **R$ 151,85** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 151,85**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42867 — - BRILHO LABIAL INFANTIL LOL

- Custo no ERP: **R$ 151,85** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 151,85**
- Evidência: custo 15,3x o preço _(histórico da L3 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 42868 — BATOM INFANTIL MIRACULOUS

- Custo no ERP: **R$ 151,85** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 151,85**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42869 — BRILHO LABIAL INFANTIL MIRACULOUS

- Custo no ERP: **R$ 151,85** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 151,85**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## REALSKY COMERCIO

_7 produto(s) · R$ 3.524,00_

### 64763 — DF-PR228003 ORNAMENTO PARA CABELO

- Custo no ERP: **R$ 28,00** · preço de venda: R$ 4,90 · saldo: 51 un · valor inflado: **R$ 1.428,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 65607 — TIARA COM MASCARA COLORIDA

- Custo no ERP: **R$ 80,00** · preço de venda: R$ 12,90 · saldo: 10 un · valor inflado: **R$ 800,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 65609 — BICO DE PATO COM PENA COLORIDO

- Custo no ERP: **R$ 120,00** · preço de venda: R$ 11,90 · saldo: 5 un · valor inflado: **R$ 600,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 65608 — MASCARA DE CARNAVAL

- Custo no ERP: **R$ 80,00** · preço de venda: R$ 16,90 · saldo: 4 un · valor inflado: **R$ 320,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 65610 — TIARA GIRASOL

- Custo no ERP: **R$ 80,00** · preço de venda: R$ 12,90 · saldo: 3 un · valor inflado: **R$ 240,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64764 — DF-BR222004-01-04 AMARRADOR DE NAILON P/ CABELO ELASTICO

- Custo no ERP: **R$ 18,20** · preço de venda: R$ 4,90 · saldo: 5 un · valor inflado: **R$ 91,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 65611 — TIARA DE GATINHO

- Custo no ERP: **R$ 45,00** · preço de venda: R$ 12,90 · saldo: 1 un · valor inflado: **R$ 45,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MARCO BONI

_2 produto(s) · R$ 2.982,30_

### 125 — LIXA POL 3 FACES 6031

- Custo no ERP: **R$ 122,70** · preço de venda: R$ 5,90 · saldo: 18 un · valor inflado: **R$ 2.208,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 8543 — PINCA PNT RETA MARCO BONI

- Custo no ERP: **R$ 77,37** · preço de venda: R$ 6,90 · saldo: 10 un · valor inflado: **R$ 773,70**
- Evidência: comprou 1, vendeu 168 (razão 168x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~168 peças** (estimativa: comprou 1, vendeu 168) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 168, o custo unitário cai de R$ 77,37 para R$ 0,46, margem de 1.398% sobre R$ 6,90.
- Efeito: o estoque desta loja reduz R$ 769,09 (correção, não perda)


## SEM MARCA

_19 produto(s) · R$ 2.884,33_

### 7067 — PINTANDO O HEXA 4

- Custo no ERP: **R$ 24,64** · preço de venda: R$ 3,90 · saldo: 24 un · valor inflado: **R$ 591,36**
- Evidência: custo 6,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 10769 — CHICL BIG BIG

- Custo no ERP: **R$ 4,75** · preço de venda: R$ 0,10 · saldo: 97 un · valor inflado: **R$ 460,75**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 14180 — AMOSTRA DEMAQUILANTE 30 ML

- Custo no ERP: **R$ 4,00** · preço de venda: R$ 0,01 · saldo: 85 un · valor inflado: **R$ 340,00**
- Evidência: custo é 400x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 74756 — ESM COL GEL CEU LILAS C/6

- Custo no ERP: **R$ 28,12** · preço de venda: R$ 7,50 · saldo: 10 un · valor inflado: **R$ 281,20**
- Evidência: custo 3,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 7775 — ESM NATI P?PURA 01340002

- Custo no ERP: **R$ 18,00** · preço de venda: R$ 3,99 · saldo: 12 un · valor inflado: **R$ 216,00**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 111 — BACIA PED PEDESTAL  188  AK

- Custo no ERP: **R$ 75,73** · preço de venda: R$ 16,00 · saldo: 2 un · valor inflado: **R$ 151,46**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 9121 — ESM LUD CR-226 8 ML

- Custo no ERP: **R$ 134,28** · preço de venda: R$ 3,90 · saldo: 1 un · valor inflado: **R$ 134,28**
- Evidência: custo 34,4x o preço _(histórico da L4 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 40030 — HAIR SPRAY SILICON TREAT

- Custo no ERP: **R$ 30,50** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 122,00**
- Evidência: custo é 3.050x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 7116 — CJ 03-PO DESC.QUERATINA.20G+OX.60ML

- Custo no ERP: **R$ 18,00** · preço de venda: R$ 5,90 · saldo: 6 un · valor inflado: **R$ 108,00**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 10722 — NEW ART  STRASS PRATA

- Custo no ERP: **R$ 8,50** · preço de venda: R$ 1,90 · saldo: 10 un · valor inflado: **R$ 85,00**
- Evidência: custo 4,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 7061 — ESMALTE PN QM SER CHIC

- Custo no ERP: **R$ 18,00** · preço de venda: R$ 3,50 · saldo: 4 un · valor inflado: **R$ 72,00**
- Evidência: custo 5,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 4292 — CX PRESENTE 10132

- Custo no ERP: **R$ 67,79** · preço de venda: R$ 3,50 · saldo: 1 un · valor inflado: **R$ 67,79**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 6170 — SAC PLASTICA 400147

- Custo no ERP: **R$ 0,42** · preço de venda: R$ 0,01 · saldo: 150 un · valor inflado: **R$ 63,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,42
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 5394 — ELASTICO MEU MEU 21220017

- Custo no ERP: **R$ 11,87** · preço de venda: R$ 2,90 · saldo: 5 un · valor inflado: **R$ 59,35**
- Evidência: custo 4,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 3021 — SACO PARA PRESENTE PEQUENO

- Custo no ERP: **R$ 9,96** · preço de venda: R$ 0,27 · saldo: 5 un · valor inflado: **R$ 49,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1341 — PENTE AM-530

- Custo no ERP: **R$ 2,00** · preço de venda: R$ 0,02 · saldo: 24 un · valor inflado: **R$ 48,00**
- Evidência: preço de R$ 0,02 com custo de R$ 2,00
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 10790 — FOLDER VARCARE TONALIZANTES

- Custo no ERP: **R$ 0,50** · preço de venda: R$ 0,01 · saldo: 30 un · valor inflado: **R$ 15,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,50
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 17539 — PROV BATOM LIQ CAROL BT

- Custo no ERP: **R$ 5,67** · preço de venda: R$ 0,01 · saldo: 2 un · valor inflado: **R$ 11,34**
- Evidência: custo é 567x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 11640 — STRASS COLORIDO 22986

- Custo no ERP: **R$ 8,00** · preço de venda: R$ 1,90 · saldo: 1 un · valor inflado: **R$ 8,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MIRRAS

_16 produto(s) · R$ 2.883,91_

### 75855 — CONDICIONADOR PARA BARBA CARMESIM 170ML

- Custo no ERP: **R$ 78,47** · preço de venda: R$ 13,08 · saldo: 6 un · valor inflado: **R$ 470,82**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62671 — CREME ESFOLIANTE 3 EM 1 PERNAS E PES REMOVE MAIS 250GR

- Custo no ERP: **R$ 91,31** · preço de venda: R$ 28,90 · saldo: 5 un · valor inflado: **R$ 456,55**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62670 — CREME AMACIANTE DE CUTICULAS REMOVE MAIS 250GR

- Custo no ERP: **R$ 59,25** · preço de venda: R$ 18,90 · saldo: 5 un · valor inflado: **R$ 296,25**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57433 — REPARADOR DE PONTAS OLEO DE COCO CARMESIM 35ML

- Custo no ERP: **R$ 96,68** · preço de venda: R$ 8,90 · saldo: 3 un · valor inflado: **R$ 290,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57441 — REPARADOR DE PONTAS QUERATINA CARMESIM 35ML

- Custo no ERP: **R$ 96,68** · preço de venda: R$ 15,90 · saldo: 3 un · valor inflado: **R$ 290,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 78095 — CREME AMACIANTE DE CUTICULAS REMOVE MAIS 80GR

- Custo no ERP: **R$ 61,50** · preço de venda: R$ 10,90 · saldo: 4 un · valor inflado: **R$ 246,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 12775 — POM PO MOD FIXADORA MIRRAS 10GR

- Custo no ERP: **R$ 219,66** · preço de venda: R$ 45,00 · saldo: 1 un · valor inflado: **R$ 219,66**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64426 — OLEO MINERAL CAPILAR CARMESIM ARGAN 60ML

- Custo no ERP: **R$ 23,66** · preço de venda: R$ 3,94 · saldo: 5 un · valor inflado: **R$ 118,30**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57411 — POMADA EM PO FIXADORA CARMESIM 10GR

- Custo no ERP: **R$ 88,27** · preço de venda: R$ 23,90 · saldo: 1 un · valor inflado: **R$ 88,27**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62678 — GEL PROTETOR DE PELE PARA TINTURA CARMESIM 100GR

- Custo no ERP: **R$ 85,72** · preço de venda: R$ 13,90 · saldo: 1 un · valor inflado: **R$ 85,72**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57442 — SHAMPOO PARA BARBA CARMESIM 170ML

- Custo no ERP: **R$ 79,16** · preço de venda: R$ 25,90 · saldo: 1 un · valor inflado: **R$ 79,16**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62669 — AMACIANTE DE CUT.E CALOSIDADE REMOVE+ 500ML

- Custo no ERP: **R$ 75,69** · preço de venda: R$ 23,90 · saldo: 1 un · valor inflado: **R$ 75,69**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 6587 — CREME ESFOLIANTE MAOS E PES MIRRAS 120GR

- Custo no ERP: **R$ 62,63** · preço de venda: R$ 16,90 · saldo: 1 un · valor inflado: **R$ 62,63**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2442 — AMOLECEDOR DE CUTICULAS COM OLEO DE CRAVO MIRRAS 100ML

- Custo no ERP: **R$ 52,73** · preço de venda: R$ 10,90 · saldo: 1 un · valor inflado: **R$ 52,73**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1148 — AMOLECEDOR DE CUTICULAS COM OLEO DE CRAVO MIRRAS 30ML

- Custo no ERP: **R$ 28,39** · preço de venda: R$ 6,90 · saldo: 1 un · valor inflado: **R$ 28,39**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64423 — OLEO MINERAL CAPILAR CARMESIM BABOSA 60ML

- Custo no ERP: **R$ 23,66** · preço de venda: R$ 3,94 · saldo: 1 un · valor inflado: **R$ 23,66**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## PHALLEBEUTY

_6 produto(s) · R$ 2.569,13_

### 64092 — STARGLOW PO BANANA PHALLEBEAUTY 10G

- Custo no ERP: **R$ 143,00** · preço de venda: R$ 13,00 · saldo: 11 un · valor inflado: **R$ 1.573,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 64159 — MOUSSE MICELAR ANTI OLEOSIDADE 150ML PHALLEBEAUTY

- Custo no ERP: **R$ 158,28** · preço de venda: R$ 27,00 · saldo: 2 un · valor inflado: **R$ 316,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 63638 — PALETA CONTORNO PHALLEBEAUTY 12G

- Custo no ERP: **R$ 140,62** · preço de venda: R$ 18,00 · saldo: 2 un · valor inflado: **R$ 281,24**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60683 — BOX 20 TINT UVA 12ML PH010 PHALLEBEAUTY

- Custo no ERP: **R$ 17,40** · preço de venda: R$ 2,90 · saldo: 10 un · valor inflado: **R$ 174,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60684 — BOX 20 TINT TUTTI FRUTTI PH012 PHALLE BEAUTY

- Custo no ERP: **R$ 17,40** · preço de venda: R$ 2,90 · saldo: 10 un · valor inflado: **R$ 174,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60680 — CX ESFOLIANTE CORPORAL ROSA MOSQUETA E ARGILA BRAN

- Custo no ERP: **R$ 50,33** · preço de venda: R$ 15,90 · saldo: 1 un · valor inflado: **R$ 50,33**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MAXTON NAO USAR

_7 produto(s) · R$ 2.444,85_

### 62510 — Maxton Louro Muito Claro 9.0 Tint Cr Eco

- Custo no ERP: **R$ 50,75** · preço de venda: R$ 16,90 · saldo: 10 un · valor inflado: **R$ 507,50**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 62511 — Maxton LouroMedio Acobreado  Intenso 7.44

- Custo no ERP: **R$ 50,75** · preço de venda: R$ 16,90 · saldo: 9 un · valor inflado: **R$ 456,75**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 53728 — Maxton Marsala 8.26 Tint Cr Eco

- Custo no ERP: **R$ 47,26** · preço de venda: R$ 14,24 · saldo: 8 un · valor inflado: **R$ 378,08**
- Evidência: custo 3,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 62512 — Maxton Louro Medio Mate 7.2

- Custo no ERP: **R$ 50,75** · preço de venda: R$ 16,90 · saldo: 7 un · valor inflado: **R$ 355,25**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 53700 — Maxton Louro Escuro 6.0 Tint Cr Eco

- Custo no ERP: **R$ 46,74** · preço de venda: R$ 14,24 · saldo: 6 un · valor inflado: **R$ 280,44**
- Evidência: custo 3,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 62514 — MaxtonPreto1.0TintCrEco+NovexSalonBlindSachet10g

- Custo no ERP: **R$ 50,75** · preço de venda: R$ 16,90 · saldo: 5 un · valor inflado: **R$ 253,75**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 53693 — Maxton Verm Cereja 6.66 TintCr Eco

- Custo no ERP: **R$ 53,27** · preço de venda: R$ 15,67 · saldo: 4 un · valor inflado: **R$ 213,08**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## COLORAMA

_21 produto(s) · R$ 2.430,77_

### 63861 — NECESSARIE MEY BRASIL

- Custo no ERP: **R$ 114,00** · preço de venda: R$ 28,90 · saldo: 5 un · valor inflado: **R$ 570,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61892 — ESM COL NAT CLASSICO

- Custo no ERP: **R$ 17,63** · preço de venda: R$ 4,90 · saldo: 12 un · valor inflado: **R$ 211,56**
- Evidência: custo 3,6x o preço _(histórico da L3 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 30128 — ESM COL CREM AMANHECER C/6

- Custo no ERP: **R$ 17,52** · preço de venda: R$ 4,90 · saldo: 11 un · valor inflado: **R$ 192,72**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 63865 — KIT BRONCA  MEY BRASIL

- Custo no ERP: **R$ 96,00** · preço de venda: R$ 24,90 · saldo: 2 un · valor inflado: **R$ 192,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 46782 — ESM COL BRASILEIRAS FLOR CERRADO

- Custo no ERP: **R$ 23,54** · preço de venda: R$ 6,90 · saldo: 7 un · valor inflado: **R$ 164,78**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 46785 — ESM COL BRASILEIRAS MENINA RIO

- Custo no ERP: **R$ 23,54** · preço de venda: R$ 6,90 · saldo: 6 un · valor inflado: **R$ 141,24**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 46786 — ESM COL BRASILEIRAS MINEIRINHA UAI

- Custo no ERP: **R$ 23,54** · preço de venda: R$ 6,90 · saldo: 6 un · valor inflado: **R$ 141,24**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 63863 — SUPORTE PARA BROCA MEY BRASIL

- Custo no ERP: **R$ 66,00** · preço de venda: R$ 16,90 · saldo: 2 un · valor inflado: **R$ 132,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 46781 — ESM COL BRASILEIRAS BAH GURIA

- Custo no ERP: **R$ 23,54** · preço de venda: R$ 6,90 · saldo: 5 un · valor inflado: **R$ 117,70**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 46784 — ESM COL BRASILEIRAS MARIA BONITA

- Custo no ERP: **R$ 23,54** · preço de venda: R$ 6,90 · saldo: 5 un · valor inflado: **R$ 117,70**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 18863 — ESM COL GEL ROXO MISTICO

- Custo no ERP: **R$ 28,12** · preço de venda: R$ 7,90 · saldo: 3 un · valor inflado: **R$ 84,36**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 60697 — ESM COL GURU AMOR O PRAZER MEU

- Custo no ERP: **R$ 33,26** · preço de venda: R$ 8,90 · saldo: 2 un · valor inflado: **R$ 66,52**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 63866 — ESCOVA ESFOLIANTE  FACIAL MEY BRASIL

- Custo no ERP: **R$ 66,00** · preço de venda: R$ 18,90 · saldo: 1 un · valor inflado: **R$ 66,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 41652 — ESM COL CREM DEIXA BEIJAR C/6

- Custo no ERP: **R$ 17,55** · preço de venda: R$ 4,90 · saldo: 2 un · valor inflado: **R$ 35,10**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 60687 — ESM COL GURU AMOR SOLTEIRA SIM

- Custo no ERP: **R$ 32,40** · preço de venda: R$ 8,90 · saldo: 1 un · valor inflado: **R$ 32,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60689 — ESM COL GURU AMOR GRANDE GOSTOSA C/6

- Custo no ERP: **R$ 32,40** · preço de venda: R$ 8,90 · saldo: 1 un · valor inflado: **R$ 32,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60690 — ESM COL GURU AMOR DATE COMIGO MESMA C/6

- Custo no ERP: **R$ 32,40** · preço de venda: R$ 8,90 · saldo: 1 un · valor inflado: **R$ 32,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 59068 — ESM COL SOM CAIXA 150 BPM COLORAMA

- Custo no ERP: **R$ 31,39** · preço de venda: R$ 10,46 · saldo: 1 un · valor inflado: **R$ 31,39**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 46783 — ESM COL BRASILEIRAS MANA DO  CEU

- Custo no ERP: **R$ 23,54** · preço de venda: R$ 6,90 · saldo: 1 un · valor inflado: **R$ 23,54**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 48552 — ESMALTE GEADA COLORAMA

- Custo no ERP: **R$ 23,00** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 203694 — ESMALTE RISQUE NU CREMOSOS NUDE 6X8ML

- Custo no ERP: **R$ 22,72** · preço de venda: R$ 6,90 · saldo: 1 un · valor inflado: **R$ 22,72**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MEY BRASIL COMERCIAL

_10 produto(s) · R$ 2.367,00_

### 55935 — ORNAMENTO PARA CABELO (ANEL PARA DREADS DE METAL)

- Custo no ERP: **R$ 10,00** · preço de venda: R$ 1,00 · saldo: 100 un · valor inflado: **R$ 1.000,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62714 — PUMP SPRAY 150ML

- Custo no ERP: **R$ 102,00** · preço de venda: R$ 25,90 · saldo: 4 un · valor inflado: **R$ 408,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61518 — ESCOVINHA DE CILIOS

- Custo no ERP: **R$ 54,00** · preço de venda: R$ 13,90 · saldo: 5 un · valor inflado: **R$ 270,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61519 — BATOQUE DE CORACAO

- Custo no ERP: **R$ 90,00** · preço de venda: R$ 18,90 · saldo: 3 un · valor inflado: **R$ 270,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62716 — PUMP SPRAY 60ML

- Custo no ERP: **R$ 66,00** · preço de venda: R$ 16,90 · saldo: 2 un · valor inflado: **R$ 132,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62715 — PUMP SPRAY 120ML

- Custo no ERP: **R$ 96,00** · preço de venda: R$ 24,90 · saldo: 1 un · valor inflado: **R$ 96,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62713 — PUMP SPRAY 100ML

- Custo no ERP: **R$ 78,00** · preço de venda: R$ 19,90 · saldo: 1 un · valor inflado: **R$ 78,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61527 — ELASTICO  SORTIDOS

- Custo no ERP: **R$ 66,00** · preço de venda: R$ 17,90 · saldo: 1 un · valor inflado: **R$ 66,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61524 — BOLSINHA ELASTICO URSO

- Custo no ERP: **R$ 32,00** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 32,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62706 — TOUCA PARA CABELO, EM CORES SORTIDAS, CONSTRUIDA E

- Custo no ERP: **R$ 15,00** · preço de venda: R$ 2,50 · saldo: 1 un · valor inflado: **R$ 15,00**
- Evidência: custo 6,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## NOVO TOQUE

_10 produto(s) · R$ 1.641,00_

### 58468 — BASE ROSA TRAT PROFISSIONAL 60ML

- Custo no ERP: **R$ 83,64** · preço de venda: R$ 13,90 · saldo: 5 un · valor inflado: **R$ 418,20**
- Evidência: custo 6,0x o preço _(histórico da L4 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58469 — CASCO DE CAVALO PROFISSIONAL 60ML

- Custo no ERP: **R$ 83,64** · preço de venda: R$ 13,90 · saldo: 4 un · valor inflado: **R$ 334,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58478 — OLEO SECANTE TRAT PROFISSIONAL 60ML

- Custo no ERP: **R$ 83,64** · preço de venda: R$ 13,90 · saldo: 4 un · valor inflado: **R$ 334,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58470 — CASCO DE TARTARUGA TRAT PROFISSIONAL 6

- Custo no ERP: **R$ 83,64** · preço de venda: R$ 13,90 · saldo: 2 un · valor inflado: **R$ 167,28**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 58354 — CHEIA DE ESTILO CREM 8ML

- Custo no ERP: **R$ 23,52** · preço de venda: R$ 4,90 · saldo: 6 un · valor inflado: **R$ 141,12**
- Evidência: custo 4,8x o preço _(histórico da L4 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58367 — MIX DE ACESSORIOS CREM 8ML

- Custo no ERP: **R$ 23,52** · preço de venda: R$ 4,90 · saldo: 4 un · valor inflado: **R$ 94,08**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 62418 — ESM TOQUE YELLOW FLUOR 8ML

- Custo no ERP: **R$ 19,20** · preço de venda: R$ 4,90 · saldo: 3 un · valor inflado: **R$ 57,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61696 — PROTAGONISTA GLITTER 8ML

- Custo no ERP: **R$ 23,40** · preço de venda: R$ 4,90 · saldo: 2 un · valor inflado: **R$ 46,80**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** (estimativa: comprou 1, vendeu 5) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 5, o custo unitário cai de R$ 23,40 para R$ 4,68, margem de 5% sobre R$ 4,90.
- Efeito: o estoque desta loja reduz R$ 37,44 (correção, não perda)

### 61685 — FAZ UM PIX CREM 8ML

- Custo no ERP: **R$ 23,40** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,40**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 61693 — O CHORO E LIVRE CREM 8ML

- Custo no ERP: **R$ 23,40** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 23,40**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## REAL LOVE

_4 produto(s) · R$ 1.554,46_

### 18325 — KIT (1 FRASCO 50ML, 2 FRASCOS 30ML, 2 POTES 10 GRAMAS, 1 PENTE)

- Custo no ERP: **R$ 285,50** · preço de venda: R$ 29,90 · saldo: 5 un · valor inflado: **R$ 1.427,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 346 — PIN-Q-08 CONJUNTO (1 PORTA PINCEL DE MAQUIAGEM ,ESPELHO E PINCEL DE MAQUIAGEM)

- Custo no ERP: **R$ 99,00** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 99,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57600 — PINCEL DE MAQUIEAGEM KIT-18

- Custo no ERP: **R$ 3,16** · preço de venda: R$ 1,05 · saldo: 6 un · valor inflado: **R$ 18,96**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 57606 — CILIOS POSTICOS  - AD969

- Custo no ERP: **R$ 9,00** · preço de venda: R$ 1,08 · saldo: 1 un · valor inflado: **R$ 9,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MACRILAN BEUTY

_5 produto(s) · R$ 1.361,51_

### 57648 — PINCEL PROF GDE PO LINHA MAX A-01 MACRILAN

- Custo no ERP: **R$ 245,07** · preço de venda: R$ 59,56 · saldo: 4 un · valor inflado: **R$ 980,28**
- Evidência: comprou 6, vendeu 38 (razão 6x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~6 peças** (estimativa: comprou 6, vendeu 38) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 6, o custo unitário cai de R$ 245,07 para R$ 40,84, margem de 46% sobre R$ 59,56.
- Efeito: o estoque desta loja reduz R$ 816,90 (correção, não perda)

### 57632 — ESPONJA GOTA CHANFRADA PARA MA EP10 MACRILAN

- Custo no ERP: **R$ 44,12** · preço de venda: R$ 8,72 · saldo: 4 un · valor inflado: **R$ 176,48**
- Evidência: comprou 6, vendeu 42 (razão 7x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~7 peças** (estimativa: comprou 6, vendeu 42) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 7, o custo unitário cai de R$ 44,12 para R$ 6,30, margem de 38% sobre R$ 8,72.
- Efeito: o estoque desta loja reduz R$ 151,27 (correção, não perda)

### 16096 — PINCEL ANGULAR BLUSH MAX A-07 MACRILAN

- Custo no ERP: **R$ 146,37** · preço de venda: R$ 23,82 · saldo: 1 un · valor inflado: **R$ 146,37**
- Evidência: comprou 6, vendeu 42 (razão 7x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~7 peças** (estimativa: comprou 6, vendeu 42) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 7, o custo unitário cai de R$ 146,37 para R$ 20,91, margem de 14% sobre R$ 23,82.
- Efeito: o estoque desta loja reduz R$ 125,46 (correção, não perda)

### 18378 — ESPONJA GOTA CHANFRADA HD MAQU

- Custo no ERP: **R$ 42,32** · preço de venda: R$ 11,90 · saldo: 1 un · valor inflado: **R$ 42,32**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18379 — KIT ESPONJAS PARA MAQUIAGEM MACRILAN

- Custo no ERP: **R$ 16,06** · preço de venda: R$ 5,18 · saldo: 1 un · valor inflado: **R$ 16,06**
- Evidência: comprou 6, vendeu 35 (razão 6x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~6 peças** (estimativa: comprou 6, vendeu 35) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 6, o custo unitário cai de R$ 16,06 para R$ 2,68, margem de 94% sobre R$ 5,18.
- Efeito: o estoque desta loja reduz R$ 13,38 (correção, não perda)


## LUDURANA

_26 produto(s) · R$ 1.187,01_

### 46109 — PALETA DE SOMRAS MATTE AMAZONIA LUDURANA

- Custo no ERP: **R$ 328,32** · preço de venda: R$ 54,90 · saldo: 1 un · valor inflado: **R$ 328,32**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44893 — ESM CREMOSO CETIM  MORENA SOLTO 8ML LUD

- Custo no ERP: **R$ 9,84** · preço de venda: R$ 2,00 · saldo: 14 un · valor inflado: **R$ 137,76**
- Evidência: custo 4,9x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 53631 — ESMALTE LUDURANA CREMOSO GEL ABOBORA  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53632 — ESMALTE LUDURANA CREMOSO GEL BERIGELA  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53633 — ESMALTE LUDURANA CREMOSO GEL BOA NOITE  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53634 — ESMALTE LUDURANA CREMOSO GEL CHAMA DO AMOR  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53635 — ESMALTE LUDURANA CREMOSO GEL COLORADO  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53636 — ESMALTE LUDURANA CREMOSO GEL DESEJO  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53637 — ESMALTE LUDURANA CREMOSO LOVE  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53638 — ESMALTE LUDURANA CREMOSO NOIVA  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53639 — ESMALTE LUDURANA CREMOSO NEVOA  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53640 — ESMALTE LUDURANA CREMOSO PALAVRAS DOCES  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53641 — ESMALTE LUDURANA CREMOSO SALMAO  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53642 — ESMALTE LUDURANA CREMOSO SOPHIA  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53643 — ESMALTE LUDURANA CREMOSO TOMATE  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53644 — ESMALTE LUDURANA CREMOSO URUCUM  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53645 — ESMALTE LUDURANA TRATAMENTO BASE INCOLOR  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 6,90 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53646 — ESMALTE LUDURANA TRATAMENTO BASE VERNIZ VIDRO  7,5

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 6,90 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53647 — ESMALTE LUDURANA TRATAMENTO OLEO SECANTE  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 6,90 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53648 — ESMALTE LUDURANA TRANSPARENTE FRANCESINHA  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 6,90 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53650 — ESMALTE LUDURANA PEROLADO TOPAZIO  7,5ml

- Custo no ERP: **R$ 33,60** · preço de venda: R$ 5,50 · saldo: 1 un · valor inflado: **R$ 33,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 19454 — ESM  NEON 8ML LUDURANA

- Custo no ERP: **R$ 6,83** · preço de venda: R$ 2,00 · saldo: 3 un · valor inflado: **R$ 20,49**
- Evidência: custo 3,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 19166 — ESM LUDURANA IDEAL

- Custo no ERP: **R$ 17,40** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 17,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53653 — ESMALTE LUDURANA CREMOSO FAMA SOLTO 8ML

- Custo no ERP: **R$ 17,40** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 17,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 53654 — ESMALTE LUDURANA CREMESO RARO SOLTO ELITE 8ML

- Custo no ERP: **R$ 17,40** · preço de venda: R$ 4,90 · saldo: 1 un · valor inflado: **R$ 17,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44881 — ESM NUANCES MARRON COURO SOLTO 8ML LUDURANA

- Custo no ERP: **R$ 9,84** · preço de venda: R$ 2,00 · saldo: 1 un · valor inflado: **R$ 9,84**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## OTIMO BIJUTERIAS

_32 produto(s) · R$ 1.101,62_

### 6113 — SACOLA DE PRESENTE PEQUENA 202

- Custo no ERP: **R$ 92,12** · preço de venda: R$ 8,90 · saldo: 6 un · valor inflado: **R$ 552,72**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 6126 — SACOLA DE PRESENTE PEQUENA 201

- Custo no ERP: **R$ 91,33** · preço de venda: R$ 6,90 · saldo: 2 un · valor inflado: **R$ 182,66**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 2571 — CILIOS OTIMOS

- Custo no ERP: **R$ 1,25** · preço de venda: R$ 0,02 · saldo: 29 un · valor inflado: **R$ 36,25**
- Evidência: preço de R$ 0,02 com custo de R$ 1,25
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 75680 — KIT ESPONJA

- Custo no ERP: **R$ 4,99** · preço de venda: R$ 1,33 · saldo: 6 un · valor inflado: **R$ 29,94**
- Evidência: comprou 2, vendeu 10 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** (estimativa: comprou 2, vendeu 10) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 5, o custo unitário cai de R$ 4,99 para R$ 1,00, margem de 33% sobre R$ 1,33.
- Efeito: o estoque desta loja reduz R$ 23,95 (correção, não perda)

### 1378 — COLAR

- Custo no ERP: **R$ 12,96** · preço de venda: R$ 0,02 · saldo: 2 un · valor inflado: **R$ 25,92**
- Evidência: custo é 648x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 1363 — COLAR

- Custo no ERP: **R$ 12,48** · preço de venda: R$ 0,02 · saldo: 2 un · valor inflado: **R$ 24,96**
- Evidência: custo é 624x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 2687 — BRINCO OTIMOS

- Custo no ERP: **R$ 5,57** · preço de venda: R$ 0,02 · saldo: 4 un · valor inflado: **R$ 22,28**
- Evidência: preço de R$ 0,02 com custo de R$ 5,57
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 56199 — ELASTICO 5

- Custo no ERP: **R$ 22,00** · preço de venda: R$ 0,50 · saldo: 1 un · valor inflado: **R$ 22,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 5015 — BRINCO

- Custo no ERP: **R$ 6,63** · preço de venda: R$ 0,02 · saldo: 3 un · valor inflado: **R$ 19,89**
- Evidência: custo é 332x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 47393 — PULSEIRA COM PEDRA RETANGULAR BRILHOSA - F21-7223105G

- Custo no ERP: **R$ 17,09** · preço de venda: R$ 2,00 · saldo: 1 un · valor inflado: **R$ 17,09**
- Evidência: custo 8,5x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 62659 — PEDRA DE JADE ROLO

- Custo no ERP: **R$ 7,49** · preço de venda: R$ 0,58 · saldo: 2 un · valor inflado: **R$ 14,98**
- Evidência: comprou 1, vendeu 6 (razão 6x)
- **Conserto:** Parece embalagem de 6, mas R$ 7,49 ÷ 6 = R$ 1,25, que ainda passa do preço de R$ 0,58. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,58 também não se sustenta — conferir os dois, custo e preço.

### 27735 — BRACELETE AÇO INOX - G02-9321161-P

- Custo no ERP: **R$ 14,40** · preço de venda: R$ 3,82 · saldo: 1 un · valor inflado: **R$ 14,40**
- Evidência: custo 3,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 1382 — PULSEIRA

- Custo no ERP: **R$ 2,69** · preço de venda: R$ 0,02 · saldo: 5 un · valor inflado: **R$ 13,45**
- Evidência: preço de R$ 0,02 com custo de R$ 2,69
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 15321 — COLAR CORRENTE GRANDE COM DETALHE EM BRILHO - G01-866982-C

- Custo no ERP: **R$ 12,86** · preço de venda: R$ 2,75 · saldo: 1 un · valor inflado: **R$ 12,86**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 44544 — CONJUNTO COLAR E BRINCO PEROLA COM PEDRAS - F01-782855

- Custo no ERP: **R$ 12,38** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 12,38**
- Evidência: custo é 1.238x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 4875 — SAIA CARNAVAL 2

- Custo no ERP: **R$ 12,29** · preço de venda: R$ 2,60 · saldo: 1 un · valor inflado: **R$ 12,29**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 41271 — COLAR DUPLO EM PEROLA - F32-682732A

- Custo no ERP: **R$ 9,60** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 9,60**
- Evidência: custo é 960x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 27422 — CONJUNTO BRINCO E COLAR CIRCULO DOURADO - F34-573632X

- Custo no ERP: **R$ 9,22** · preço de venda: R$ 2,90 · saldo: 1 un · valor inflado: **R$ 9,22**
- Evidência: custo 3,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 49028 — PULSEIRA

- Custo no ERP: **R$ 8,06** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 8,06**
- Evidência: custo é 806x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 1381 — COLAR

- Custo no ERP: **R$ 7,30** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 7,30**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 7,30 ÷ 5 = R$ 1,46, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois, custo e preço.

### 41275 — COLAR PEDRA BRILHANTE - F13-624512M

- Custo no ERP: **R$ 7,20** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 7,20**
- Evidência: custo é 720x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 43004 — PULSERIA COM VARIOS PIGENTES - G01-542561-P

- Custo no ERP: **R$ 7,10** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 7,10**
- Evidência: custo é 710x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 4602 — ESPELHO DE BOLSA OTIMO

- Custo no ERP: **R$ 6,53** · preço de venda: R$ 0,03 · saldo: 1 un · valor inflado: **R$ 6,53**
- Evidência: preço de R$ 0,03 com custo de R$ 6,53
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 77077 — BRINCO

- Custo no ERP: **R$ 6,00** · preço de venda: R$ 1,00 · saldo: 1 un · valor inflado: **R$ 6,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 44217 — ARGOLA COLORIDA GRANDE - F11-222464

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 5,76**
- Evidência: custo é 576x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 44546 — BRACELETE ABERTO - F29-579232B

- Custo no ERP: **R$ 4,32** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 4,32**
- Evidência: custo é 432x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 77091 — BRINCO

- Custo no ERP: **R$ 3,60** · preço de venda: R$ 0,60 · saldo: 1 un · valor inflado: **R$ 3,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1312 — LAÇO PDD OTIMOS

- Custo no ERP: **R$ 3,46** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 3,46**
- Evidência: comprou 1, vendeu 7 (razão 7x)
- **Conserto:** Parece embalagem de 7, mas R$ 3,46 ÷ 7 = R$ 0,49, que ainda passa do preço de R$ 0,02. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,02 também não se sustenta — conferir os dois, custo e preço.

### 44542 — BRINCO CORAÇÃO GRANDE - F34-572225X

- Custo no ERP: **R$ 3,26** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 3,26**
- Evidência: custo é 326x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 77081 — PIRANHA PARA CABELO

- Custo no ERP: **R$ 2,88** · preço de venda: R$ 0,05 · saldo: 1 un · valor inflado: **R$ 2,88**
- Evidência: comprou 3, vendeu 16 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 2,88 ÷ 5 = R$ 0,58, que ainda passa do preço de R$ 0,05. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,05 também não se sustenta — conferir os dois, custo e preço.

### 2758 — CHAVEIRO

- Custo no ERP: **R$ 1,63** · preço de venda: R$ 0,03 · saldo: 1 un · valor inflado: **R$ 1,63**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Parece embalagem de 5, mas R$ 1,63 ÷ 5 = R$ 0,33, que ainda passa do preço de R$ 0,03. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,03 também não se sustenta — conferir os dois, custo e preço.

### 45940 — RABICO

- Custo no ERP: **R$ 1,63** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 1,63**
- Evidência: comprou 1, vendeu 11 (razão 11x)
- **Conserto:** Parece embalagem de 11, mas R$ 1,63 ÷ 11 = R$ 0,15, que ainda passa do preço de R$ 0,01. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,01 também não se sustenta — conferir os dois, custo e preço.


## TURMA DA LU

_1 produto(s) · R$ 1.096,26_

### 202444 — PALETA DE SOMBRAS TURMA DA LU

- Custo no ERP: **R$ 182,71** · preço de venda: R$ 32,00 · saldo: 6 un · valor inflado: **R$ 1.096,26**
- Evidência: custo 5,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## MUNDIAL

_2 produto(s) · R$ 1.056,34_

### 203975 — CORTADOR UNHA MAO CARTELA 10PC 120CD CLASSIC MUNDIAL

- Custo no ERP: **R$ 33,93** · preço de venda: R$ 7,06 · saldo: 18 un · valor inflado: **R$ 610,74**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 3292 — PINÇA  FLEX MUNDIAL 110

- Custo no ERP: **R$ 11,14** · preço de venda: R$ 1,90 · saldo: 40 un · valor inflado: **R$ 445,60**
- Evidência: comprou 1, vendeu 110 (razão 110x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~110 peças** (estimativa: comprou 1, vendeu 110) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 110, o custo unitário cai de R$ 11,14 para R$ 0,10, margem de 1.776% sobre R$ 1,90.
- Efeito: o estoque desta loja reduz R$ 441,55 (correção, não perda)


## MAX LOVE

_5 produto(s) · R$ 998,62_

### 60353 — MAX LOVE - AGUA MICELAR COLAGENO

- Custo no ERP: **R$ 48,87** · preço de venda: R$ 15,90 · saldo: 10 un · valor inflado: **R$ 488,70**
- Evidência: comprou 1, vendeu 14 (razão 14x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~14 peças** (estimativa: comprou 1, vendeu 14) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 14, o custo unitário cai de R$ 48,87 para R$ 3,49, margem de 355% sobre R$ 15,90.
- Efeito: o estoque desta loja reduz R$ 453,79 (correção, não perda)

### 7035 — BLUSH 17 MAX LOVE

- Custo no ERP: **R$ 97,18** · preço de venda: R$ 15,50 · saldo: 4 un · valor inflado: **R$ 388,72**
- Evidência: custo 6,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 42718 — CANETA DELINEADORA BLACK MAX LOVE 01

- Custo no ERP: **R$ 53,95** · preço de venda: R$ 11,90 · saldo: 1 un · valor inflado: **R$ 53,95**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42737 — GLOSS LIP VOLUMOSO COR 05

- Custo no ERP: **R$ 35,14** · preço de venda: R$ 10,90 · saldo: 1 un · valor inflado: **R$ 35,14**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 42698 — BATOM GLOSS LATEX MAX LOVE MORANGO 4ML

- Custo no ERP: **R$ 32,11** · preço de venda: R$ 9,00 · saldo: 1 un · valor inflado: **R$ 32,11**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## CAPICILIN

_4 produto(s) · R$ 914,75_

### 11161 — HOTCREAM COCO TRAT CAPICILIN

- Custo no ERP: **R$ 182,20** · preço de venda: R$ 23,90 · saldo: 3 un · valor inflado: **R$ 546,60**
- Evidência: custo 7,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 11162 — HOTCREAM TRAT CAPICILIN

- Custo no ERP: **R$ 182,20** · preço de venda: R$ 23,90 · saldo: 1 un · valor inflado: **R$ 182,20**
- Evidência: custo 7,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 11150 — GELAT MOD CAPICILIN 350G

- Custo no ERP: **R$ 118,45** · preço de venda: R$ 15,90 · saldo: 1 un · valor inflado: **R$ 118,45**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 61078 — CR PENTE INTEGRAL CAPICILIN 300 ML

- Custo no ERP: **R$ 67,50** · preço de venda: R$ 8,99 · saldo: 1 un · valor inflado: **R$ 67,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## SKALA

_4 produto(s) · R$ 702,24_

### 54379 — CR TRAT PENTEAR GENETIQS FORCA E BRILHO SKALA 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 6 un · valor inflado: **R$ 383,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 54376 — CR TRAT PENTEAR AMIDO DE MILHO 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 3 un · valor inflado: **R$ 191,52**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 54402 — CR TRAT PENTEAR DONA SKALA 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 1 un · valor inflado: **R$ 63,84**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 54707 — CR. TRAT PENTEAR DIVINO POTINHO 2-EM-1 (CPP) 250G

- Custo no ERP: **R$ 63,84** · preço de venda: R$ 11,90 · saldo: 1 un · valor inflado: **R$ 63,84**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## SALON PRO

_1 produto(s) · R$ 699,50_

### 58847 — COLA P/ CILIOS SALON PRO

- Custo no ERP: **R$ 699,50** · preço de venda: R$ 39,90 · saldo: 1 un · valor inflado: **R$ 699,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## LABOTRAT

_2 produto(s) · R$ 564,55_

### 203778 — CREME DE PARAFINA ATIVADORA BETERRABA E BURITI VAI&BRILHA 20G LABOTRAT

- Custo no ERP: **R$ 24,75** · preço de venda: R$ 7,90 · saldo: 13 un · valor inflado: **R$ 321,75**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 65094 — CR HIDRATANTE DE PARAFINA VAI E BRILHA 20G LABOTRAT

- Custo no ERP: **R$ 30,35** · preço de venda: R$ 5,90 · saldo: 8 un · valor inflado: **R$ 242,80**
- Evidência: comprou 3, vendeu 54 (razão 18x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~18 peças** (estimativa: comprou 3, vendeu 54) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 18, o custo unitário cai de R$ 30,35 para R$ 1,69, margem de 250% sobre R$ 5,90.
- Efeito: o estoque desta loja reduz R$ 229,31 (correção, não perda)


## INOAR

_1 produto(s) · R$ 522,35_

### 58392 — AMPOLA ARGAN INOAR 45ML

- Custo no ERP: **R$ 104,47** · preço de venda: R$ 15,90 · saldo: 5 un · valor inflado: **R$ 522,35**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## JAPINHA

_4 produto(s) · R$ 499,70_

### 16988 — KIT SHAMPOO DETOX / ATIVO REDUTOR DE QUIABO JAPINHA 1LT

- Custo no ERP: **R$ 50,31** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 301,86**
- Evidência: custo é 5.031x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 16945 — Kit Shampoo Detox / Ativo Redutor Organico  Japinha 120ml

- Custo no ERP: **R$ 15,25** · preço de venda: R$ 0,20 · saldo: 6 un · valor inflado: **R$ 91,50**
- Evidência: preço de R$ 0,20 com custo de R$ 15,25
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 9116 — BOTOX OJOIN JAPINHA 1KG

- Custo no ERP: **R$ 27,36** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 82,08**
- Evidência: custo é 2.736x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 9115 — BOTOX OJON JAPINHA 300G

- Custo no ERP: **R$ 12,13** · preço de venda: R$ 0,01 · saldo: 2 un · valor inflado: **R$ 24,26**
- Evidência: custo é 1.213x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## DAFU

_27 produto(s) · R$ 486,38_

### 42286 — ANEL DE METAL COMUM COM PEDRINHA

- Custo no ERP: **R$ 18,43** · preço de venda: R$ 5,68 · saldo: 7 un · valor inflado: **R$ 129,01**
- Evidência: comprou 1, vendeu 8 (razão 8x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~8 peças** (estimativa: comprou 1, vendeu 8) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 8, o custo unitário cai de R$ 18,43 para R$ 2,30, margem de 147% sobre R$ 5,68.
- Efeito: o estoque desta loja reduz R$ 112,88 (correção, não perda)

### 27580 — NECESSAIRE DAFU

- Custo no ERP: **R$ 34,56** · preço de venda: R$ 1,08 · saldo: 1 un · valor inflado: **R$ 34,56**
- Evidência: custo 32,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 42257 — MODELADOR DE CACHO - DAFU

- Custo no ERP: **R$ 1,30** · preço de venda: R$ 0,02 · saldo: 23 un · valor inflado: **R$ 29,90**
- Evidência: preço de R$ 0,02 com custo de R$ 1,30
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 27589 — CILIOS POSTICOS FIO A FIO DE FIBRA DAFU

- Custo no ERP: **R$ 25,34** · preço de venda: R$ 3,74 · saldo: 1 un · valor inflado: **R$ 25,34**
- Evidência: custo 6,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27592 — MOTOR POLIDOR DE BRANCO/ROSA

- Custo no ERP: **R$ 22,27** · preço de venda: R$ 6,12 · saldo: 1 un · valor inflado: **R$ 22,27**
- Evidência: custo 3,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27746 — KIT PRESILHA PARA CABELO DAFU

- Custo no ERP: **R$ 10,37** · preço de venda: R$ 2,20 · saldo: 2 un · valor inflado: **R$ 20,74**
- Evidência: custo 4,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 47896 — MASSAGEADOR FACIAL DE RESINA - DAFU

- Custo no ERP: **R$ 20,74** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 20,74**
- Evidência: comprou 1, vendeu 6 (razão 6x)
- **Conserto:** Parece embalagem de 6, mas R$ 20,74 ÷ 6 = R$ 3,46, que ainda passa do preço de R$ 0,02. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,02 também não se sustenta — conferir os dois, custo e preço.

### 28467 — CONJUNTO (4 ESPONJAS E 1 PIRANHA DE PLASTICO)

- Custo no ERP: **R$ 17,28** · preço de venda: R$ 5,24 · saldo: 1 un · valor inflado: **R$ 17,28**
- Evidência: custo 3,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 28429 — ESPONJA PARA MAQUIAGEM KIT DAFU

- Custo no ERP: **R$ 16,51** · preço de venda: R$ 4,50 · saldo: 1 un · valor inflado: **R$ 16,51**
- Evidência: custo 3,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 5196 — KIT ESPONJA PARA MAQUIAGEM DAFU

- Custo no ERP: **R$ 8,07** · preço de venda: R$ 0,02 · saldo: 2 un · valor inflado: **R$ 16,14**
- Evidência: custo é 404x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 47350 — NECESSAIRE COLORIDA DAFU

- Custo no ERP: **R$ 5,38** · preço de venda: R$ 0,02 · saldo: 3 un · valor inflado: **R$ 16,14**
- Evidência: preço de R$ 0,02 com custo de R$ 5,38
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 44500 — REFIL DE BROCA DAFU

- Custo no ERP: **R$ 15,36** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 15,36**
- Evidência: custo é 768x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 76457 — KIT PINCEL

- Custo no ERP: **R$ 11,20** · preço de venda: R$ 1,87 · saldo: 1 un · valor inflado: **R$ 11,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 27535 — LAÇO COM PRESILHA PARA CABELO

- Custo no ERP: **R$ 10,37** · preço de venda: R$ 2,62 · saldo: 1 un · valor inflado: **R$ 10,37**
- Evidência: custo 4,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27578 — FRASCO DE PLASTICO 50 ML - DAFU

- Custo no ERP: **R$ 10,37** · preço de venda: R$ 1,70 · saldo: 1 un · valor inflado: **R$ 10,37**
- Evidência: custo 6,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 27850 — TOUCA DE BANHO DE PLASTICO

- Custo no ERP: **R$ 10,37** · preço de venda: R$ 2,60 · saldo: 1 un · valor inflado: **R$ 10,37**
- Evidência: comprou 1, vendeu 12 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 1, vendeu 12) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 10,37 para R$ 0,86, margem de 201% sobre R$ 2,60.
- Efeito: o estoque desta loja reduz R$ 9,51 (correção, não perda)

### 55309 — TOUCA DE BANHO DE PLASTICO - DF309 -TC9905

- Custo no ERP: **R$ 10,37** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 10,37**
- Evidência: custo é 518x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 64454 — PINCA DE METAL PARA UNHA DF-PF045014-04-01

- Custo no ERP: **R$ 9,80** · preço de venda: R$ 1,72 · saldo: 1 un · valor inflado: **R$ 9,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 57784 — CILIOS POSTICOS FIO A FIO

- Custo no ERP: **R$ 9,60** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 9,60**
- Evidência: custo é 480x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 27570 — LAÇO GRANDE COLORIDO - DF422 - PR130

- Custo no ERP: **R$ 9,22** · preço de venda: R$ 3,06 · saldo: 1 un · valor inflado: **R$ 9,22**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 76450 — KIT PINCEL

- Custo no ERP: **R$ 8,40** · preço de venda: R$ 1,40 · saldo: 1 un · valor inflado: **R$ 8,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 27593 — OLEO HIDRATANTE DE CUTICULA - DAFU

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,58 · saldo: 1 un · valor inflado: **R$ 5,76**
- Evidência: preço de R$ 0,58 com custo de R$ 5,76
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 52751 — ORNAMENTO PARA CABELO (PRESILHA) DE METAL

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 5,76**
- Evidência: preço de R$ 0,02 com custo de R$ 5,76
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 52852 — PINCEL COTONETE PEQUENO - DAFU

- Custo no ERP: **R$ 5,76** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 5,76**
- Evidência: preço de R$ 0,02 com custo de R$ 5,76
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 76465 — KIT PULSEIRA INFANTIL

- Custo no ERP: **R$ 5,60** · preço de venda: R$ 0,93 · saldo: 1 un · valor inflado: **R$ 5,60**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47827 — COLA DE CIANOACRILATO PARA UNHAS POSTICAS - DAFU

- Custo no ERP: **R$ 5,58** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 5,58**
- Evidência: preço de R$ 0,02 com custo de R$ 5,58
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 27604 — PINCEL PARA APLICAÇÃO DE MAQUIAGEM - DAFU

- Custo no ERP: **R$ 4,23** · preço de venda: R$ 1,00 · saldo: 1 un · valor inflado: **R$ 4,23**
- Evidência: custo 4,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## DOMPEL

_1 produto(s) · R$ 436,50_

### 60538 — LIXA MANICURE BANANA

- Custo no ERP: **R$ 43,65** · preço de venda: R$ 0,37 · saldo: 10 un · valor inflado: **R$ 436,50**
- Evidência: comprou 2, vendeu 15 (razão 8x)
- **Conserto:** Parece embalagem de 8, mas R$ 43,65 ÷ 8 = R$ 5,46, que ainda passa do preço de R$ 0,37. **Abrir a nota** e ver a unidade. ⚠️ E o preço de R$ 0,37 também não se sustenta — conferir os dois, custo e preço.


## VIVAI

_12 produto(s) · R$ 404,15_

### 47180 — MANTEIGA DE CACAU - LIQUIDA DP 36

- Custo no ERP: **R$ 14,26** · preço de venda: R$ 3,90 · saldo: 10 un · valor inflado: **R$ 142,60**
- Evidência: custo 3,7x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 47175 — BATOM OVO MATTE VIVAI

- Custo no ERP: **R$ 64,80** · preço de venda: R$ 11,90 · saldo: 1 un · valor inflado: **R$ 64,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47173 — BATOM MATTE TRUE HEART VIVAI

- Custo no ERP: **R$ 54,43** · preço de venda: R$ 8,90 · saldo: 1 un · valor inflado: **R$ 54,43**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 51869 — DELINEADOR PARA OS OLHOS 06 CORES - INTENSE COLORS - VIVAI

- Custo no ERP: **R$ 46,08** · preço de venda: R$ 13,90 · saldo: 1 un · valor inflado: **R$ 46,08**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 51873 — BATOM BASTAO MATTE - BEAUTIFUL LIPS VIVAI

- Custo no ERP: **R$ 36,29** · preço de venda: R$ 11,90 · saldo: 1 un · valor inflado: **R$ 36,29**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47193 — MASCARA ARGILA VERDE VIVAI

- Custo no ERP: **R$ 12,67** · preço de venda: R$ 3,90 · saldo: 1 un · valor inflado: **R$ 12,67**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47194 — MASCARA ARGILA ROSA VIVAI

- Custo no ERP: **R$ 12,67** · preço de venda: R$ 3,90 · saldo: 1 un · valor inflado: **R$ 12,67**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47195 — MASCARA ARGILA BRANCA VIVAI

- Custo no ERP: **R$ 12,67** · preço de venda: R$ 3,90 · saldo: 1 un · valor inflado: **R$ 12,67**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 47196 — MASCARA ARGILA PRETA VIVAI

- Custo no ERP: **R$ 12,67** · preço de venda: R$ 3,90 · saldo: 1 un · valor inflado: **R$ 12,67**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 40052 — PO FACIAL BANANA LOTE PB03

- Custo no ERP: **R$ 5,12** · preço de venda: R$ 0,94 · saldo: 1 un · valor inflado: **R$ 5,12**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 65618 — SABONETE MOUSSE ROSA MOSQUETA

- Custo no ERP: **R$ 2,83** · preço de venda: R$ 0,47 · saldo: 1 un · valor inflado: **R$ 2,83**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60691 — GLOSS LABIAL VIVA LA VIDA - VIVAI

- Custo no ERP: **R$ 1,32** · preço de venda: R$ 0,13 · saldo: 1 un · valor inflado: **R$ 1,32**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## IMPALA

_10 produto(s) · R$ 350,46_

### 18015 — OLEO PARA CUTICULAS IMPALA TRATAMENTO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 12 un · valor inflado: **R$ 71,28**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18004 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO PLOT TWIST  IMPALA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18007 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO ESCOLHA SEU LADO  IMPALA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18008 — ESMALTE JU PAES VIRANDO O JOGO CREMOSO APOSTA ALTA  IMPALA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18011 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO SORTE LANCADA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18012 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO CARTAS NA MANGA

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18013 — ESMALTE IMPALA JU PAES VIRANDO O JOGO SUAVE COBERTURA REGRAS DO JOGO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 6 un · valor inflado: **R$ 35,64**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18010 — ESMALTE IMPALA JU PAES VIRANDO O JOGO CREMOSO XEQUE - MATE

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 29,70**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18014 — ESMALTE IMPALA A COR DA MODA CREMOSO INTUICAO

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 5 un · valor inflado: **R$ 29,70**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 18016 — TOP COAT PRO FINISH IMPALA BLINDAGEM 4D

- Custo no ERP: **R$ 5,94** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 5,94**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## ESCOBEL

_2 produto(s) · R$ 283,38_

### 49564 — ESC PROF BASE CERAMICA REF 847 ROSA 20 MM C/01 DZ

- Custo no ERP: **R$ 20,84** · preço de venda: R$ 3,58 · saldo: 7 un · valor inflado: **R$ 145,88**
- Evidência: custo 5,8x o preço _(histórico da L3 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 49566 — ESC PROF BASE CERAMICA REF 861 ROSA 34 MM C/01 DZ

- Custo no ERP: **R$ 13,75** · preço de venda: R$ 4,58 · saldo: 10 un · valor inflado: **R$ 137,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## GT & FR

_3 produto(s) · R$ 273,00_

### 30596 — GLITTER FACIAL GLITTERS DISPLAY C/42

- Custo no ERP: **R$ 91,00** · preço de venda: R$ 14,00 · saldo: 1 un · valor inflado: **R$ 91,00**
- Evidência: no nome: C/42
- **Conserto:** Cadastrar **fator de conversão = 42** (está no nome do produto). O custo unitário cai de R$ 91,00 para **R$ 2,17** — margem de 546% sobre o preço de R$ 14,00.
- Efeito: o estoque desta loja reduz R$ 88,83 (correção, não perda)

### 30597 — GLITTER FACIAL ASAS DE BORBOLETA DISPLAY C/42

- Custo no ERP: **R$ 91,00** · preço de venda: R$ 14,00 · saldo: 1 un · valor inflado: **R$ 91,00**
- Evidência: no nome: C/42
- **Conserto:** Cadastrar **fator de conversão = 42** (está no nome do produto). O custo unitário cai de R$ 91,00 para **R$ 2,17** — margem de 546% sobre o preço de R$ 14,00.
- Efeito: o estoque desta loja reduz R$ 88,83 (correção, não perda)

### 30598 — GLITTER FACIAL PIGMENTO DISPLAY C/42

- Custo no ERP: **R$ 91,00** · preço de venda: R$ 14,00 · saldo: 1 un · valor inflado: **R$ 91,00**
- Evidência: no nome: C/42
- **Conserto:** Cadastrar **fator de conversão = 42** (está no nome do produto). O custo unitário cai de R$ 91,00 para **R$ 2,17** — margem de 546% sobre o preço de R$ 14,00.
- Efeito: o estoque desta loja reduz R$ 88,83 (correção, não perda)


## CAPELLA

_1 produto(s) · R$ 269,66_

### 8951 — ANEL CAPELLA 8951

- Custo no ERP: **R$ 134,83** · preço de venda: R$ 2,00 · saldo: 2 un · valor inflado: **R$ 269,66**
- Evidência: custo 67,4x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## PASSENATI

_1 produto(s) · R$ 253,44_

### 18485 — LAMINA BARBEAR SUPERPLATINUM

- Custo no ERP: **R$ 10,56** · preço de venda: R$ 0,39 · saldo: 24 un · valor inflado: **R$ 253,44**
- Evidência: preço de R$ 0,39 com custo de R$ 10,56 _(histórico da L3 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## FELPS

_1 produto(s) · R$ 244,24_

### 79046 — AMPOLA POTENCIALIZADOR DE NUTRICAO AZEITE ABACATE 15ML - FELPS

- Custo no ERP: **R$ 122,12** · preço de venda: R$ 22,00 · saldo: 2 un · valor inflado: **R$ 244,24**
- Evidência: custo 5,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## RISQUE

_2 produto(s) · R$ 233,53_

### 52594 — ESM RISQUE DEUSAS INSPIRACAO DIVINA C/6

- Custo no ERP: **R$ 37,72** · preço de venda: R$ 1,83 · saldo: 4 un · valor inflado: **R$ 150,88**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 5202 — ESMALTE RISQUE GRAO DE CAFE

- Custo no ERP: **R$ 16,53** · preço de venda: R$ 4,90 · saldo: 5 un · valor inflado: **R$ 82,65**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## LUISANCE

_1 produto(s) · R$ 210,56_

### 40310 — CONJ MAQUIA MA6910-1

- Custo no ERP: **R$ 52,64** · preço de venda: R$ 0,01 · saldo: 4 un · valor inflado: **R$ 210,56**
- Evidência: custo é 5.264x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## P&W

_1 produto(s) · R$ 210,56_

### 40311 — SOMBRA METALICA MK-35W

- Custo no ERP: **R$ 52,64** · preço de venda: R$ 7,50 · saldo: 4 un · valor inflado: **R$ 210,56**
- Evidência: custo 7,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## ITALLIAN HAIR

_3 produto(s) · R$ 195,38_

### 204358 — KIT HOME CARE TRIVITT COM HIDRATACAO

- Custo no ERP: **R$ 10,53** · preço de venda: R$ 2,00 · saldo: 18 un · valor inflado: **R$ 189,54**
- Evidência: custo 5,3x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 40339 — CB CORRETOR AZUL ITALLIAN COLOR 60G

- Custo no ERP: **R$ 5,43** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 5,43**
- Evidência: custo é 543x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 8511 — COLORACAO IC SEM AMONIA 0.20 INTENSIFICADOR PURPLE 60G

- Custo no ERP: **R$ 0,41** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 0,41**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## HUNKY MODAS

_5 produto(s) · R$ 193,10_

### 78504 — KIT 5 ELASTICO ELA-189

- Custo no ERP: **R$ 21,60** · preço de venda: R$ 6,90 · saldo: 4 un · valor inflado: **R$ 86,40**
- Evidência: custo 3,1x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 78503 — KIT 5 ELASTICO ELA-190

- Custo no ERP: **R$ 21,60** · preço de venda: R$ 4,50 · saldo: 2 un · valor inflado: **R$ 43,20**
- Evidência: comprou 4, vendeu 24 (razão 6x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~6 peças** (estimativa: comprou 4, vendeu 24) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 6, o custo unitário cai de R$ 21,60 para R$ 3,60, margem de 25% sobre R$ 4,50.
- Efeito: o estoque desta loja reduz R$ 36,00 (correção, não perda)

### 78498 — KIT 2 ELASTICO ELA-187

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 7,80 · saldo: 1 un · valor inflado: **R$ 30,00**
- Evidência: comprou 2, vendeu 25 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 2, vendeu 25) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 30,00 para R$ 2,50, margem de 212% sobre R$ 7,80.
- Efeito: o estoque desta loja reduz R$ 27,50 (correção, não perda)

### 78499 — KIT 2 ELASTICO ELA-186

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 7,60 · saldo: 1 un · valor inflado: **R$ 30,00**
- Evidência: comprou 2, vendeu 24 (razão 12x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~12 peças** (estimativa: comprou 2, vendeu 24) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 12, o custo unitário cai de R$ 30,00 para R$ 2,50, margem de 204% sobre R$ 7,60.
- Efeito: o estoque desta loja reduz R$ 27,50 (correção, não perda)

### 52150 — ELASTICO  (1PT C/100PCS) ELA-033

- Custo no ERP: **R$ 3,50** · preço de venda: R$ 0,50 · saldo: 1 un · valor inflado: **R$ 3,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## CBB

_2 produto(s) · R$ 191,04_

### 204056 — SABONETE INTIMO MENTA 200ML Lt FSM280225

- Custo no ERP: **R$ 47,76** · preço de venda: R$ 9,90 · saldo: 2 un · valor inflado: **R$ 95,52**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 204057 — SABONETE INTIMO ERVA DOCE 200ML Lt FSC300126

- Custo no ERP: **R$ 47,76** · preço de venda: R$ 9,90 · saldo: 2 un · valor inflado: **R$ 95,52**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## CHEN YUMEI

_8 produto(s) · R$ 168,00_

### 60453 — CINTO

- Custo no ERP: **R$ 18,60** · preço de venda: R$ 3,91 · saldo: 4 un · valor inflado: **R$ 74,40**
- Evidência: custo 4,8x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 76524 — WZS1117 CINTO

- Custo no ERP: **R$ 16,80** · preço de venda: R$ 2,80 · saldo: 1 un · valor inflado: **R$ 16,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76530 — WZS451 CINTO

- Custo no ERP: **R$ 16,80** · preço de venda: R$ 2,80 · saldo: 1 un · valor inflado: **R$ 16,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 60455 — CINTO 2167

- Custo no ERP: **R$ 14,40** · preço de venda: R$ 3,08 · saldo: 1 un · valor inflado: **R$ 14,40**
- Evidência: comprou 1, vendeu 5 (razão 5x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~5 peças** (estimativa: comprou 1, vendeu 5) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 5, o custo unitário cai de R$ 14,40 para R$ 2,88, margem de 7% sobre R$ 3,08.
- Efeito: o estoque desta loja reduz R$ 11,52 (correção, não perda)

### 76519 — MZS406 CINTO

- Custo no ERP: **R$ 14,40** · preço de venda: R$ 2,40 · saldo: 1 un · valor inflado: **R$ 14,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76516 — MZS380 CINTO

- Custo no ERP: **R$ 12,00** · preço de venda: R$ 2,00 · saldo: 1 un · valor inflado: **R$ 12,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76537 — MZS402 CINTO

- Custo no ERP: **R$ 10,80** · preço de venda: R$ 1,80 · saldo: 1 un · valor inflado: **R$ 10,80**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 76526 — WZS431 CINTO

- Custo no ERP: **R$ 8,40** · preço de venda: R$ 1,40 · saldo: 1 un · valor inflado: **R$ 8,40**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MISS FRANDY

_2 produto(s) · R$ 157,50_

### 55415 — PAQUIMETRO 8CM DZ (12PC)  Ean :6917121710425

- Custo no ERP: **R$ 30,00** · preço de venda: R$ 7,90 · saldo: 3 un · valor inflado: **R$ 90,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 55401 — COPO DE VIDRO DAPPEN MEY BRASIL

- Custo no ERP: **R$ 22,50** · preço de venda: R$ 5,90 · saldo: 3 un · valor inflado: **R$ 67,50**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## MIAMAKE

_1 produto(s) · R$ 149,76_

### 49218 — LAPIS DE SOBRANCELHA UNIVERSAL COM ESCOVA MIAMAKE

- Custo no ERP: **R$ 149,76** · preço de venda: R$ 3,00 · saldo: 1 un · valor inflado: **R$ 149,76**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## NATHYDRAS

_1 produto(s) · R$ 137,50_

### 45512 — REPARADOR DE PONTAS ALHO 30ML

- Custo no ERP: **R$ 13,75** · preço de venda: R$ 0,01 · saldo: 10 un · valor inflado: **R$ 137,50**
- Evidência: custo é 1.375x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## HONEYGRIL

_1 produto(s) · R$ 127,54_

### 62129 — PRESILHA UNHAS POSTICA

- Custo no ERP: **R$ 18,22** · preço de venda: R$ 5,90 · saldo: 7 un · valor inflado: **R$ 127,54**
- Evidência: custo 3,1x o preço _(histórico da L3 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## ANTONIO BANDERAS

_1 produto(s) · R$ 96,90_

### 54877 — AVENTAL 30 ANOS - Lote: 4057090825

- Custo no ERP: **R$ 32,30** · preço de venda: R$ 0,01 · saldo: 3 un · valor inflado: **R$ 96,90**
- Evidência: custo é 3.230x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## IMPORTADOS

_1 produto(s) · R$ 90,00_

### 43842 — SACOLA CASA DA BELEZA 60X70

- Custo no ERP: **R$ 0,60** · preço de venda: R$ 0,01 · saldo: 150 un · valor inflado: **R$ 90,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,60
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## EMBELEZE

_1 produto(s) · R$ 85,46_

### 53717 — Maxton CobreDouClar 8.43 TintCrEco

- Custo no ERP: **R$ 42,73** · preço de venda: R$ 14,24 · saldo: 2 un · valor inflado: **R$ 85,46**
- Evidência: custo 3,0x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## ZGY

_5 produto(s) · R$ 79,39_

### 847 — BRINCO CONCHA DOURADA E PRATA 6 - ZGY

- Custo no ERP: **R$ 21,47** · preço de venda: R$ 4,96 · saldo: 1 un · valor inflado: **R$ 21,47**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 1344 — PRESILHA COM 3

- Custo no ERP: **R$ 10,53** · preço de venda: R$ 0,02 · saldo: 2 un · valor inflado: **R$ 21,06**
- Evidência: custo é 526x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.

### 11440 — COLAR COM PIGENTE

- Custo no ERP: **R$ 15,68** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 15,68**
- Evidência: custo é 1.568x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.

### 15743 — PIRANHA FOLHA COM PEDRARIA

- Custo no ERP: **R$ 13,75** · preço de venda: R$ 0,90 · saldo: 1 un · valor inflado: **R$ 13,75**
- Evidência: preço de R$ 0,90 com custo de R$ 13,75
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.

### 1356 — PIRANHA GRANDE PLASTICO

- Custo no ERP: **R$ 7,43** · preço de venda: R$ 0,02 · saldo: 1 un · valor inflado: **R$ 7,43**
- Evidência: custo é 372x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,02) provavelmente está certo.


## FACE BEAUTIFUL

_1 produto(s) · R$ 52,56_

### 64709 — MOUSSE FACIAL VITAMINA C LOVELY

- Custo no ERP: **R$ 52,56** · preço de venda: R$ 1,04 · saldo: 1 un · valor inflado: **R$ 52,56**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## G-HAIR

_1 produto(s) · R$ 49,00_

### 56682 — OLEO DE ARGAN G HAIR 7 ML

- Custo no ERP: **R$ 49,00** · preço de venda: R$ 9,90 · saldo: 1 un · valor inflado: **R$ 49,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## HELLO MINI

_2 produto(s) · R$ 48,36_

### 75516 — FH06 PINCEL P/ BLUSH (LINHA ANGEL)

- Custo no ERP: **R$ 29,16** · preço de venda: R$ 5,49 · saldo: 1 un · valor inflado: **R$ 29,16**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.

### 28488 — LAPIS DE OLHO PRETO C/ APONTADOR - LO1428-1

- Custo no ERP: **R$ 19,20** · preço de venda: R$ 3,90 · saldo: 1 un · valor inflado: **R$ 19,20**
- Evidência: comprou 1, vendeu 7 (razão 7x)
- **Conserto:** Cadastrar fator de conversão. Pelo histórico o pacote tem **~7 peças** (estimativa: comprou 1, vendeu 7) — **confirmar o número exato na nota ou na embalagem antes de gravar**. Com 7, o custo unitário cai de R$ 19,20 para R$ 2,74, margem de 42% sobre R$ 3,90.
- Efeito: o estoque desta loja reduz R$ 16,46 (correção, não perda)


## BARBER SHOP

_1 produto(s) · R$ 47,20_

### 30591 — TINTA DA ALEGRIA VERMELHA 150ML

- Custo no ERP: **R$ 47,20** · preço de venda: R$ 13,00 · saldo: 1 un · valor inflado: **R$ 47,20**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## RUBY ROSE

_2 produto(s) · R$ 46,55_

### 65568 — RR-853/1 PO FACIAL COMPACTO MELU RUBY ROSE RR-853-1

- Custo no ERP: **R$ 7,39** · preço de venda: R$ 1,78 · saldo: 5 un · valor inflado: **R$ 36,95**
- Evidência: custo 4,2x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.

### 58466 — DELINEADOR LIQUIDO PRETO RUBY ROSE

- Custo no ERP: **R$ 9,60** · preço de venda: R$ 1,70 · saldo: 1 un · valor inflado: **R$ 9,60**
- Evidência: custo 5,6x o preço
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## ANDRADE IMPORTADOS

_1 produto(s) · R$ 42,00_

### 40679 — TIC TAC PRETO

- Custo no ERP: **R$ 42,00** · preço de venda: R$ 2,90 · saldo: 1 un · valor inflado: **R$ 42,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## DALLA MAKEUP

_1 produto(s) · R$ 29,25_

### 16108 — PO COMP DALLA 07

- Custo no ERP: **R$ 29,25** · preço de venda: R$ 8,90 · saldo: 1 un · valor inflado: **R$ 29,25**
- Evidência: custo 3,3x o preço _(histórico da L3 — mesmo código, cadastro é do grupo)_
- **Conserto:** **Abrir a última nota de entrada** e comparar unidade, quantidade e valor.


## BANA BANA

_1 produto(s) · R$ 25,00_

### 30784 — BOMBOM

- Custo no ERP: **R$ 25,00** · preço de venda: R$ 1,00 · saldo: 1 un · valor inflado: **R$ 25,00**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


## YAMÁ

_1 produto(s) · R$ 12,00_

### 48376 — CARTAZ FASHION COLOR ARGAN

- Custo no ERP: **R$ 0,30** · preço de venda: R$ 0,01 · saldo: 40 un · valor inflado: **R$ 12,00**
- Evidência: preço de R$ 0,01 com custo de R$ 0,30
- **Conserto:** **Conferir o preço** — pode ser o preço que está errado, não o custo.


## BRILHARE

_1 produto(s) · R$ 6,62_

### 44616 — COLAR PIGENTE PEDRA - F27-421551

- Custo no ERP: **R$ 6,62** · preço de venda: R$ 0,01 · saldo: 1 un · valor inflado: **R$ 6,62**
- Evidência: custo é 662x o preço
- **Conserto:** **Corrigir o custo médio** pelo valor da última nota de entrada. O preço (R$ 0,01) provavelmente está certo.


## MEU MEU BIJOUTERIAS

_1 produto(s) · R$ 2,04_

### 3879 — XUXINHA  MEU MEU

- Custo no ERP: **R$ 2,04** · preço de venda: R$ 0,24 · saldo: 1 un · valor inflado: **R$ 2,04**
- Evidência: nenhuma entrada desde 01/01/2023
- **Conserto:** **Contar fisicamente.** Tem saldo sem nenhuma compra desde 2023 — não se conserta mexendo em custo.


