# Custos errados no estoque — Casa da Beleza (L1)

Levantado em 27/08/2026 pelo método que o Athila descobriu no ERP
(Suprimentos → Relatórios → Registro de Inventário → agrupar por marca → sintético →
marca anômala → analítico só nela), agora automatizado em `scripts/inventario_marca.mjs`.

## O tamanho do problema

| | |
|---|---:|
| Estoque da L1 como o ERP declara | R$ 1.042.244,82 |
| Valor inflado por custo errado | **R$ 316.344,29** |
| Fatia do estoque que é dado errado | **30,4%** |
| Produtos afetados na L1 | 454 |
| Quanto o estoque valeria com o custo certo | R$ 725.900,53 |

Critério: custo médio maior que 3x o preço de venda. Margem apertada acontece; vender a
menos de um terço do custo, não — isso é dado errado, não negócio ruim.

## As 15 maiores — cada uma conferida na nota de entrada

Estas não são suposição: para cada uma eu abri o Histórico de Movimento e li a última nota.

| # | Cód | Produto | Custo no ERP | Preço | Peças L1 | Valor inflado | O que está errado | Prova (nota de entrada) |
|---:|---|---|---:|---:|---:|---:|---|---|
| 1 | 12408 | MASCARA MATIZADOR COBRE AMEND 300G | 50.515,63 | 67,90 | 2 | 101.031,26 | **custo corrompido** | NF 60160/1 de 28/02/25: **12,00 UN a R$ 48,73**. Comprou 58, vendeu 81 — quantidades normais. A nota diz 48,73 e o cadastro diz 50.515,63. |
| 2 | 49391 | 490CX ALGODAO CARD HID NATHY 25G | 184,80 | 0,02 | 134 | 24.763,20 | **fator de conversão** | NF 47266/1: 2,00 UN a R$ 210,00. **Comprou 3, vendeu 339.** |
| 3 | 11043 | ALGODAO CARD HID NATHY 25G BOLA | 204,16 | 2,32 | 71 | 14.495,36 | **fator de conversão** | NF 47266/1: 3,00 UN a R$ 232,00. **Comprou 3, vendeu 346.** |
| 4 | 17704 | BABY FD ALGODAO CARD HID NATHYBABY 40G | 172,48 | 4,00 | 80 | 13.798,40 | **fator de conversão** | NF 47266/1: 2,00 UN a R$ 196,00. **Comprou 2, vendeu 113.** |
| 5 | 204099 | KISS NY NAVALHA SOBRANC CURTO (72 UN) | 243,72 | 6,90 | 49 | 11.942,28 | **fator de conversão** | NF 553874/1: 1,00 UN a R$ 253,87. O nome diz **(72 UN)** → R$ 3,53/un contra preço de 7,90. |
| 6 | 60951 | CX ALGODAO CARD HID NATHY 50G | 184,80 | 0,03 | 60 | 11.088,00 | **fator de conversão** | NF 47266/1: 2,00 UN a R$ 210,00. **Comprou 3, vendeu 176.** |
| 7 | 49396 | ALGODAO CARD HID NATHY 50G BOLA 5PACKS | 165,44 | 4,00 | 59 | 9.760,96 | **fator de conversão** | NF 47266/1: 3,00 UN a R$ 188,00. **Comprou 4, vendeu 214.** |
| 8 | 20358 | AMP ARGAN PROBELLE 17 ML | 81,40 | 10,90 | 108 | 8.791,20 | **saldo sem origem** | **Nenhuma compra desde 2023** e 620 peças em estoque (108 L1 + 457 L3 + 55 L5). Vendeu 48. |
| 9 | 17665 | TOALHA COMP MULT DESC 250 | 37,40 | 1,00 | 207 | 7.741,80 | **fator de conversão** | NF 647502/1: **1,00 CX a R$ 71,75** — a nota diz CAIXA e o ERP gravou 1 peça. Comprou 1, vendeu 189. |
| 10 | 49392 | 1090ALGODAO CARD HID NATHY 100G BOLA | 144,32 | 0,08 | 46 | 6.638,72 | **fator de conversão** | NF 47266/1: 3,00 UN a R$ 164,00. **Comprou 4, vendeu 119.** |
| 11 | 49393 | FD ALGODAO CARD HID NATHY 250G ROLO 40 | 242,11 | 0,42 | 17 | 4.115,87 | **fator de conversão** | NF 32238/1: 5,00 UN a R$ 254,80. O nome diz **40UN/FD** → R$ 6,37/un contra preço de 16,90. |
| 12 | 42861 | SOMBRA INFANTIL FROZEN | 134,41 | 10,90 | 25 | 3.360,25 | **saldo sem origem** | **Sem nenhum movimento desde 2023** e 25 peças em estoque. |
| 13 | 204098 | KISS NY NAVALHA SOBRANC LONGO (72 UN) | 243,72 | 6,90 | 12 | 2.924,64 | **fator de conversão** | NF 553874/1: 1,00 UN a R$ 253,87. O nome diz **(72 UN)** → R$ 3,53/un contra preço de 8,00. |
| 14 | 125 | LIXA POL 3 FACES 6031 | 122,70 | 5,90 | 18 | 2.208,60 | **saldo sem origem** | **Nenhuma compra desde 2023** e 18 peças em estoque. Vendeu 36. |
| 15 | 18613 | AMP EXTRATO ARGAN PROBELLE 17 ML | 90,63 | 16,90 | 24 | 2.175,12 | **saldo sem origem** | **Sem nenhum movimento desde 2023** e 24 peças em estoque. |

## As três causas, separadas

### 1. Fator de conversão — pacote lançado como peça

É a causa da maioria e a mais cara depois do caso isolado da Amend. A nota traz CAIXA/FARDO/
PACOTE e quem deu entrada lançou 1 peça. O custo fica o do pacote inteiro; o preço fica o da peça.

A prova é aritmética e não tem como contestar: **o 49391 comprou 3 e vendeu 339.** Não se vende
339 peças tendo comprado 3, a menos que cada 'peça' comprada seja um pacote de ~113. O 17665 é
ainda mais direto: a nota está escrita `1,00 CX`.

Efeito no negócio: o estoque parece valer muito mais do que vale, o CMV de cada venda sai
errado (vende a R$ 4,90 registrando custo de R$ 184,80 → a loja aparece dando prejuízo em
produto que dá lucro), e a margem da categoria fica sem sentido.

### 2. Custo médio corrompido — um caso, e é o maior de todos

`12408 MASCARA MATIZADOR COBRE AMEND 300G`: custo de **R$ 50.515,63** com 2 peças em estoque
= R$ 101.031,26, quase 10% do estoque inteiro da L1.

Aqui não é fator de conversão: a nota diz **12,00 UN a R$ 48,73** — quantidade e valor normais.
E as três irmãs dela confirmam: Matizador RED custa R$ 26,94, PRETO R$ 37,46, BLOND R$ 28,66.
O preço de venda (R$ 67,90) também está certo, alinhado com as irmãs (69,90 / 71,90 / 48,90).
**Só o custo está errado.**

Mecanismo provável (hipótese, não verificado): o custo médio é recalculado como valor÷quantidade.
Quando o saldo está negativo e quase anula a entrada, o denominador vai a quase zero e o custo
estoura. Esse produto comprou 58 e vendeu 81 desde 2023 — passou negativo. É a mesma família de
efeito colateral do balanço de junho.

### 3. Saldo sem origem — peças que o sistema tem e ninguém comprou

`20358 AMP ARGAN PROBELLE 17ML`: **620 peças** no grupo (108 L1 + 457 L3 + 55 L5) e **nenhuma
compra desde 2023**. Idem 125, 42861 e 18613. Isso é o assunto da segunda etapa (marcas que não
existem mais na loja) e não se resolve mexendo em custo — se resolve contando.

## Onde o problema mora, por marca (L1)

| Marca | Produtos | Valor inflado |
|---|---:|---:|
| AMEND | 1 | R$ 101.031,26 |
| NATHY | 9 | R$ 87.473,81 |
| MACRILAN | 33 | R$ 16.749,72 |
| KISS NEW YORK | 7 | R$ 16.256,82 |
| PROBELLE PROFISSIONAL | 3 | R$ 11.079,60 |
| LUDURANA NAO USAR | 26 | R$ 10.043,84 |
| SANTA CLARA | 21 | R$ 9.291,82 |
| JONALISSA BIJOUX LTDA | 14 | R$ 8.322,00 |
| NOVEX | 18 | R$ 6.114,72 |
| TALGE | 21 | R$ 4.186,99 |
| VIEW | 6 | R$ 4.119,50 |
| REALSKY COMERCIO | 7 | R$ 3.524,00 |

Amend e Nathy sozinhas somam R$ 188.505,07 — 60% de todo o problema da L1.

## Lista completa

| # | Cód | Produto | Marca | Custo | Preço | Peças | Valor inflado | Causa provável |
|---:|---|---|---|---:|---:|---:|---:|---|
| 1 | 12408 | MASCARA MATIZADOR COBRE AMEND 300G | AMEND | 50.515,63 | 67,90 | 2 | 101.031,26 | custo corrompido |
| 2 | 49391 | 490CX ALGODAO CARD HID NATHY 25G | NATHY | 184,80 | 0,02 | 134 | 24.763,20 | fator de conversão? |
| 3 | 11043 | ALGODAO CARD HID NATHY 25G BOLA | NATHY | 204,16 | 2,32 | 71 | 14.495,36 | embalagem sem quantidade |
| 4 | 17704 | BABY FD ALGODAO CARD HID NATHYBABY 4 | NATHY | 172,48 | 4,00 | 80 | 13.798,40 | embalagem sem quantidade |
| 5 | 204099 | KISS NY NAVALHA SOBRANC CURTO (72 UN | KISS NEW YORK | 243,72 | 6,90 | 49 | 11.942,28 | fator de conversão |
| 6 | 60951 | CX ALGODAO CARD HID NATHY 50G | NATHY | 184,80 | 0,03 | 60 | 11.088,00 | custo corrompido |
| 7 | 49396 | ALGODAO CARD HID NATHY 50G BOLA 5PAC | NATHY | 165,44 | 4,00 | 59 | 9.760,96 | fator de conversão? |
| 8 | 20358 | AMP ARGAN PROBELLE 17 ML | PROBELLE PROFISS | 81,40 | 10,90 | 108 | 8.791,20 | a investigar |
| 9 | 17665 | TOALHA COMP MULT DESC 250 | SANTA CLARA | 37,40 | 1,00 | 207 | 7.741,80 | fator de conversão |
| 10 | 49392 | 1090ALGODAO CARD HID NATHY 100G BOLA | NATHY | 144,32 | 0,08 | 46 | 6.638,72 | custo corrompido |
| 11 | 49393 | FD ALGODAO CARD HID NATHY 250G ROLO  | NATHY | 242,11 | 0,42 | 17 | 4.115,87 | fator de conversão? |
| 12 | 42861 | SOMBRA INFANTIL FROZEN | VIEW | 134,41 | 10,90 | 25 | 3.360,25 | a investigar |
| 13 | 204098 | KISS NY NAVALHA SOBRANC LONGO (72 UN | KISS NEW YORK | 243,72 | 6,90 | 12 | 2.924,64 | fator de conversão |
| 14 | 125 | LIXA POL 3 FACES 6031 | MARCO BONI | 122,70 | 5,90 | 18 | 2.208,60 | a investigar |
| 15 | 18613 | AMP EXTRATO ARGAN PROBELLE 17 ML | PROBELLE PROFISS | 90,63 | 16,90 | 24 | 2.175,12 | a investigar |
| 16 | 62786 | LAÇO COLORIDO | JONALISSA BIJOUX | 84,00 | 21,90 | 24 | 2.016,00 | a investigar |
| 17 | 62787 | LAÇO CHARME | JONALISSA BIJOUX | 90,00 | 22,90 | 22 | 1.980,00 | a investigar |
| 18 | 78330 | PINCEL CONICO ILUMINAR P-03 MACRILAN | MACRILAN | 138,70 | 30,88 | 12 | 1.664,40 | a investigar |
| 19 | 58969 | ALGODAO QUADRADINHO 40G CARD HID NAT | NATHY | 166,43 | 3,94 | 10 | 1.664,30 | a investigar |
| 20 | 61983 | PALETA DE SOMBRAS 9 CORES OPULENCE | LUDURANA NAO USA | 149,08 | 28,90 | 11 | 1.639,88 | a investigar |
| 21 | 62788 | LAÇO DE PALHA XADREZ | JONALISSA BIJOUX | 108,00 | 27,90 | 15 | 1.620,00 | a investigar |
| 22 | 64092 | STARGLOW PO BANANA PHALLEBEAUTY 10G | PHALLEBEUTY | 143,00 | 13,00 | 11 | 1.573,00 | a investigar |
| 23 | 64763 | DF-PR228003 ORNAMENTO PARA CABELO | REALSKY COMERCIO | 28,00 | 4,90 | 51 | 1.428,00 | a investigar |
| 24 | 18325 | KIT (1 FRASCO 50ML, 2 FRASCOS 30ML,  | REAL LOVE | 285,50 | 29,90 | 5 | 1.427,50 | embalagem sem quantidade |
| 25 | 61981 | PALETA DE SOMBRAS ROMANCE | LUDURANA NAO USA | 149,08 | 28,90 | 9 | 1.341,72 | a investigar |
| 26 | 49395 | FD ALGODAO CARD HID NATHY 500G ROLO  | NATHY | 229,80 | 31,90 | 5 | 1.149,00 | fator de conversão |
| 27 | 78356 | APONTADOR PARA LAPIS MAQUIAGEM MACRI | MACRILAN | 140,80 | 9,90 | 8 | 1.126,40 | a investigar |
| 28 | 78341 | KIT COM 5 PINCEIS E 3 PULSEIRA MACRI | MACRILAN | 372,27 | 6,49 | 3 | 1.116,81 | embalagem sem quantidade |
| 29 | 202444 | PALETA DE SOMBRAS TURMA DA LU | TURMA DA LU | 182,71 | 32,00 | 6 | 1.096,26 | a investigar |
| 30 | 78328 | PINCEL P/ CONTORNO MAQ MAX A-19 MACR | MACRILAN | 146,63 | 32,65 | 7 | 1.026,41 | a investigar |
| 31 | 55935 | ORNAMENTO PARA CABELO (ANEL PARA DRE | MEY BRASIL COMER | 10,00 | 1,00 | 100 | 1.000,00 | a investigar |
| 32 | 57648 | PINCEL PROF GDE PO LINHA MAX A-01 MA | MACRILAN BEUTY | 245,07 | 59,56 | 4 | 980,28 | a investigar |
| 33 | 53774 | Vitay Novex Superfood Maracuja&Mirti | NOVEX | 153,77 | 24,90 | 6 | 922,62 | a investigar |
| 34 | 53777 | Vitay Novex Superfood Cacau&Amendoas | NOVEX | 153,77 | 24,90 | 6 | 922,62 | a investigar |
| 35 | 78332 | PINCEL CONICO PARA ILUMINAR P-08 MAC | MACRILAN | 74,30 | 16,54 | 11 | 817,30 | a investigar |
| 36 | 78336 | PINCEL CONICO ESFUMAR P-12 MACRILAN | MACRILAN | 74,30 | 16,54 | 11 | 817,30 | a investigar |
| 37 | 65607 | TIARA COM MASCARA COLORIDA | REALSKY COMERCIO | 80,00 | 12,90 | 10 | 800,00 | a investigar |
| 38 | 8543 | PINCA PNT RETA MARCO BONI | MARCO BONI | 77,37 | 6,90 | 10 | 773,70 | a investigar |
| 39 | 61975 | QUARTETO DE CONTORNO LUDURANA 12G | LUDURANA NAO USA | 149,08 | 28,90 | 5 | 745,40 | a investigar |
| 40 | 78337 | PINCEL PRECISAO CONICO ESFUMAR P-13  | MACRILAN | 72,33 | 16,10 | 10 | 723,30 | a investigar |
| 41 | 58938 | QUARTETO DE SOMBRAS SIGNOS ESCORPIAO | LUDURANA NAO USA | 118,80 | 20,90 | 6 | 712,80 | a investigar |
| 42 | 78334 | PINCEL ARREDONDADO SOMBRA P-10 MACRI | MACRILAN | 64,40 | 14,34 | 11 | 708,40 | a investigar |
| 43 | 78338 | PINCEL PRECISAO ESFUMAR P-14 MACRILA | MACRILAN | 64,40 | 14,34 | 11 | 708,40 | a investigar |
| 44 | 11100 | KISS NY NAVALHA SOBRANC LONGO | KISS NEW YORK | 234,51 | 6,90 | 3 | 703,53 | a investigar |
| 45 | 202307 | KIT MADEMOISELLE MACRILAN | MACRILAN | 703,40 | 122,10 | 1 | 703,40 | embalagem sem quantidade |
| 46 | 53786 | Meus Cachos O Especialista Cresp Sol | NOVEX | 117,08 | 37,90 | 6 | 702,48 | a investigar |
| 47 | 58847 | COLA P/ CILIOS SALON PRO | SALON PRO | 699,50 | 39,90 | 1 | 699,50 | a investigar |
| 48 | 49245 | LUVA NITRILICA AZUL TALGE | TALGE | 699,00 | 79,90 | 1 | 699,00 | a investigar |
| 49 | 6517 | PINCEL P/ CONTORNO MAQ MAX - A16 MAC | MACRILAN | 134,17 | 16,00 | 5 | 670,85 | a investigar |
| 50 | 78339 | PINCEL LAPIS ESFUMAR P-15 MACRILAN | MACRILAN | 68,36 | 15,22 | 9 | 615,24 | a investigar |
| 51 | 203975 | CORTADOR UNHA MAO CARTELA 10PC 120CD | MUNDIAL | 33,93 | 7,06 | 18 | 610,74 | a investigar |
| 52 | 65609 | BICO DE PATO COM PENA COLORIDO | REALSKY COMERCIO | 120,00 | 11,90 | 5 | 600,00 | a investigar |
| 53 | 61979 | PALETA DE SOMBRAS CHERRY POP | LUDURANA NAO USA | 149,08 | 28,90 | 4 | 596,32 | a investigar |
| 54 | 58937 | QUARTETO DE SOMBRAS SIGNOS CAPRICORN | LUDURANA NAO USA | 118,80 | 20,90 | 5 | 594,00 | a investigar |
| 55 | 7067 | PINTANDO O HEXA 4 | — | 24,64 | 3,90 | 24 | 591,36 | a investigar |
| 56 | 53785 | Meus Cachos O Especialista CacLevCom | NOVEX | 117,08 | 37,90 | 5 | 585,40 | a investigar |
| 57 | 58932 | BATOM LUDURANA LIQ. MATTE  CEREJA 4M | LUDURANA NAO USA | 82,68 | 13,90 | 7 | 578,76 | a investigar |
| 58 | 62783 | BICO DE PATO CHAPEU XADREZ | JONALISSA BIJOUX | 96,00 | 24,90 | 6 | 576,00 | a investigar |
| 59 | 63861 | NECESSARIE MEY BRASIL | COLORAMA | 114,00 | 28,90 | 5 | 570,00 | a investigar |
| 60 | 202310 | ESPELHO DE AUMENTO C/ VENTOSA - MACR | MACRILAN | 79,96 | 15,24 | 7 | 559,72 | a investigar |
| 61 | 6113 | SACOLA DE PRESENTE PEQUENA 202 | OTIMO BIJUTERIAS | 92,12 | 8,90 | 6 | 552,72 | fator de conversão |
| 62 | 23846 | LUVA NITRILICA ROSA S/PO M TALGE | TALGE | 110,12 | 4,20 | 5 | 550,60 | a investigar |
| 63 | 49244 | LUVA DE VINIL SEM PO | TALGE | 550,00 | 27,00 | 1 | 550,00 | a investigar |
| 64 | 11161 | HOTCREAM COCO TRAT CAPICILIN | CAPICILIN | 182,20 | 23,90 | 3 | 546,60 | a investigar |
| 65 | 58953 | PALETA DE SOMBRAS NUANCES 9 CORES  N | LUDURANA NAO USA | 181,20 | 30,90 | 3 | 543,60 | a investigar |
| 66 | 58392 | AMPOLA ARGAN INOAR 45ML | INOAR | 104,47 | 15,90 | 5 | 522,35 | a investigar |
| 67 | 62510 | Maxton Louro Muito Claro 9.0 Tint Cr | MAXTON NAO USAR | 50,75 | 16,90 | 10 | 507,50 | a investigar |
| 68 | 58930 | BATOM LUDURANA LIQ. MATTE  CARMINE 4 | LUDURANA NAO USA | 82,68 | 13,90 | 6 | 496,08 | a investigar |
| 69 | 60353 | MAX LOVE - AGUA MICELAR COLAGENO | MAX LOVE | 48,87 | 15,90 | 10 | 488,70 | a investigar |
| 70 | 58939 | QUARTETO DE SOMBRAS SIGNOS LEAO | LUDURANA NAO USA | 118,80 | 20,90 | 4 | 475,20 | a investigar |
| 71 | 75855 | CONDICIONADOR PARA BARBA CARMESIM 17 | MIRRAS | 78,47 | 13,08 | 6 | 470,82 | a investigar |
| 72 | 10769 | CHICL BIG BIG | — | 4,75 | 0,10 | 97 | 460,75 | preço suspeito |
| 73 | 53763 | Novex Recarga Potassio Superfood Bio | NOVEX | 76,56 | 12,90 | 6 | 459,36 | a investigar |
| 74 | 62511 | Maxton LouroMedio Acobreado  Intenso | MAXTON NAO USAR | 50,75 | 16,90 | 9 | 456,75 | fator de conversão |
| 75 | 62671 | CREME ESFOLIANTE 3 EM 1 PERNAS E PES | MIRRAS | 91,31 | 28,90 | 5 | 456,55 | a investigar |
| 76 | 78331 | PINCEL PARA ILUMINAR P-07 MACRILAN | MACRILAN | 89,16 | 19,85 | 5 | 445,80 | a investigar |
| 77 | 78333 | PINCEL PRECISAO CONTORNO P-09 MACRIL | MACRILAN | 74,30 | 16,54 | 6 | 445,80 | a investigar |
| 78 | 3292 | PINÇA  FLEX MUNDIAL 110 | MUNDIAL | 11,14 | 1,90 | 40 | 445,60 | fator de conversão |
| 79 | 202302 | PINCEL CONICO M P/ ESFUMAR MAX A35 M | MACRILAN | 88,09 | 15,28 | 5 | 440,45 | a investigar |
| 80 | 60538 | LIXA MANICURE BANANA | DOMPEL | 43,65 | 0,37 | 10 | 436,50 | preço suspeito |
| 81 | 62784 | BICO DE PATO GIRASOL | JONALISSA BIJOUX | 72,00 | 18,90 | 6 | 432,00 | a investigar |
| 82 | 78755 | LIXA UNHA ESTAMP.C/50 | SANTA CLARA | 41,86 | 3,90 | 10 | 418,60 | fator de conversão |
| 83 | 58468 | BASE ROSA TRAT PROFISSIONAL 60ML | NOVO TOQUE | 83,64 | 13,90 | 5 | 418,20 | a investigar |
| 84 | 61568 | NECESSAIRE WASHBAG | JONALISSA BIJOUX | 204,00 | 42,90 | 2 | 408,00 | a investigar |
| 85 | 62714 | PUMP SPRAY 150ML | MEY BRASIL COMER | 102,00 | 25,90 | 4 | 408,00 | a investigar |
| 86 | 78355 | ESPONJA GOTA PARA MAQUIAGEM - MACRIL | MACRILAN | 50,20 | 0,72 | 8 | 401,60 | preço suspeito |
| 87 | 64584 | ESPONJA GOTA PARA MAQUIAGEM MACRILAN | MACRILAN | 36,29 | 8,71 | 11 | 399,19 | a investigar |
| 88 | 53756 | Novex Recarga de Queratina Cond 80g | NOVEX | 11,08 | 1,07 | 36 | 398,88 | a investigar |
| 89 | 61567 | BOLSA  LUA WASHBAG | JONALISSA BIJOUX | 390,00 | 81,90 | 1 | 390,00 | a investigar |
| 90 | 7035 | BLUSH 17 MAX LOVE | MAX LOVE | 97,18 | 15,50 | 4 | 388,72 | a investigar |
| 91 | 62794 | ANEL COLORIDO DE PLASTICO | JONALISSA BIJOUX | 48,00 | 3,90 | 8 | 384,00 | a investigar |
| 92 | 54379 | CR TRAT PENTEAR GENETIQS FORCA E BRI | SKALA | 63,84 | 11,90 | 6 | 383,04 | a investigar |
| 93 | 53728 | Maxton Marsala 8.26 Tint Cr Eco | MAXTON NAO USAR | 47,26 | 14,24 | 8 | 378,08 | a investigar |
| 94 | 28367 | KISS NY PINCA PONTA FINA | KISS NEW YORK | 3,32 | 0,08 | 111 | 368,52 | preço suspeito |
| 95 | 4241 | LAMINA SUPER MAX ST CLARA 354 | SANTA CLARA | 13,00 | 3,90 | 28 | 364,00 | fator de conversão |
| 96 | 58941 | QUARTETO DE SOMBRAS SIGNOS SAGITARIO | LUDURANA NAO USA | 118,80 | 20,90 | 3 | 356,40 | a investigar |
| 97 | 62512 | Maxton Louro Medio Mate 7.2 | MAXTON NAO USAR | 50,75 | 16,90 | 7 | 355,25 | a investigar |
| 98 | 556 | PINCEL PROF OVAL PRECISAO MAX - A05  | MACRILAN | 176,19 | 23,00 | 2 | 352,38 | a investigar |
| 99 | 202305 | COLA CILIOS POSTICOS PRETA - MACRILA | MACRILAN | 88,09 | 15,28 | 4 | 352,36 | a investigar |
| 100 | 14180 | AMOSTRA DEMAQUILANTE 30 ML | — | 4,00 | 0,01 | 85 | 340,00 | custo corrompido |
| 101 | 58469 | CASCO DE CAVALO PROFISSIONAL 60ML | NOVO TOQUE | 83,64 | 13,90 | 4 | 334,56 | a investigar |
| 102 | 58478 | OLEO SECANTE TRAT PROFISSIONAL 60ML | NOVO TOQUE | 83,64 | 13,90 | 4 | 334,56 | a investigar |
| 103 | 58933 | BATOM LUDURANA LIQ. MATTE  ESCARLATE | LUDURANA NAO USA | 82,68 | 13,90 | 4 | 330,72 | a investigar |
| 104 | 46109 | PALETA DE SOMRAS MATTE AMAZONIA LUDU | LUDURANA | 328,32 | 54,90 | 1 | 328,32 | a investigar |
| 105 | 78335 | PINCEL  PRECISAO SOMBRA P-11 | MACRILAN | 54,49 | 12,13 | 6 | 326,94 | fator de conversão |
| 106 | 78340 | PINCEL PARA DELINEAR P-16 MACRILAN | MACRILAN | 54,49 | 12,13 | 6 | 326,94 | a investigar |
| 107 | 203778 | CREME DE PARAFINA ATIVADORA BETERRAB | LABOTRAT | 24,75 | 7,90 | 13 | 321,75 | a investigar |
| 108 | 65608 | MASCARA DE CARNAVAL | REALSKY COMERCIO | 80,00 | 16,90 | 4 | 320,00 | a investigar |
| 109 | 64159 | MOUSSE MICELAR ANTI OLEOSIDADE 150ML | PHALLEBEUTY | 158,28 | 27,00 | 2 | 316,56 | a investigar |
| 110 | 53757 | Meus Cachos Recarga de Oleos Santo B | NOVEX | 76,94 | 12,90 | 4 | 307,76 | a investigar |
| 111 | 53778 | Novex Superfood Cacau&Amendoas Cr Tr | NOVEX | 101,15 | 32,90 | 3 | 303,45 | a investigar |
| 112 | 16988 | KIT SHAMPOO DETOX / ATIVO REDUTOR DE | JAPINHA | 50,31 | 0,01 | 6 | 301,86 | custo corrompido |
| 113 | 62670 | CREME AMACIANTE DE CUTICULAS REMOVE  | MIRRAS | 59,25 | 18,90 | 5 | 296,25 | a investigar |
| 114 | 78359 | KIT 5 ESPONJAS | MACRILAN | 73,75 | 14,56 | 4 | 295,00 | embalagem sem quantidade |
| 115 | 18506 | LUVA TALGE VINIL C/PO G | TALGE | 294,74 | 22,00 | 1 | 294,74 | a investigar |
| 116 | 57433 | REPARADOR DE PONTAS OLEO DE COCO CAR | MIRRAS | 96,68 | 8,90 | 3 | 290,04 | a investigar |
| 117 | 57441 | REPARADOR DE PONTAS QUERATINA CARMES | MIRRAS | 96,68 | 15,90 | 3 | 290,04 | a investigar |
| 118 | 202301 | PINCEL KABUKI GOTA PRECIS MAX MACRIL | MACRILAN | 142,31 | 24,70 | 2 | 284,62 | a investigar |
| 119 | 63638 | PALETA CONTORNO PHALLEBEAUTY 12G | PHALLEBEUTY | 140,62 | 18,00 | 2 | 281,24 | a investigar |
| 120 | 74756 | ESM COL GEL CEU LILAS C/6 | — | 28,12 | 7,50 | 10 | 281,20 | a investigar |

_(120 maiores de 454; a lista inteira está em `CUSTOS_ERRADOS_L1.json`)_
