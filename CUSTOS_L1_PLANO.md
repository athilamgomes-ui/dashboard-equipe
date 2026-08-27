# Plano de correção de custo — L1 Casa da Beleza Altamira

**78 produtos · R$ 43.404,60 de estoque inflado.**

Cada linha foi confirmada na **nota de entrada**: a coluna "Fat. Conv. Utilizado" da cópia da NF
diz a unidade e o fator com que o produto entrou. O custo gravado no cadastro é o da EMBALAGEM;
o correto é esse valor dividido pelo fator.

O preço praticado vem da **Tabela Altamira** — a tabela padrão está contaminada pelo custo errado
(ela é calculada como custo × markup) e por isso não serve de referência.

## Como aplicar

Custo e markup vão **no mesmo submit** — mexer no custo sozinho faz o ERP recalcular o preço e
destruí-lo (aconteceu no 12408: R$ 67,90 virou R$ 0,0655). Duas opções de markup:

- **preserva padrão** — mantém o preço da tabela padrão exatamente como está hoje. Mudança mínima.
- **alinha Altamira** — coloca a tabela padrão no mesmo preço que a loja pratica. Limpa a bagunça,
  mas mexe num número a mais por produto.

Recomendo **preservar o padrão**: L1 e L4 não vendem por ela, então alinhar não traz ganho e
aumenta a superfície de erro. Alinhar pode virar uma limpeza separada depois.

| # | Cód | Produto | Marca | Fator | Custo hoje | Custo novo | Saldo | Estoque a menos | Preço Altamira | Markup (preserva) | Markup (alinha) | Nota |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 19206 | ESM GLIT SONHO LUD 8ML LUDURANA | LUDURANA | 12 | 15,08 | **1,26** | 109 | 1.506,74 | 4,90 | 4.581,4324 | 289,9204 | 26380 de 08/11/23 (CX | 12,00) |
| 2 | 62464 | PULSEIRA DE METAL PHD | PHD BIJOUTERIA | 12 | 144,50 | **12,04** | 11 | 1.457,04 | 36,90 | 3.577,2318 | 206,4360 | 32166 de 16/05/23 (CX | 12,00) |
| 3 | 62463 | PULSEIRA DE METAL PHD | PHD BIJOUTERIA | 12 | 221,00 | **18,42** | 7 | 1.418,08 | 55,90 | 3.542,3529 | 203,5294 | 32166 de 16/05/23 (CX | 12,00) |
| 4 | 29636 | ESM MEGA BRILHO TRAT ESM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 58 | 1.244,10 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 5 | 19204 | ESM GLIT PRATA 8ML LUDURANA | LUDURANA | 12 | 16,95 | **1,41** | 77 | 1.196,39 | 4,90 | 4.062,8319 | 246,9027 | 26380 de 08/11/23 (CX | 12,00) |
| 6 | 19171 | ESM RED CEREJA LUDURANA | LUDURANA | 12 | 15,95 | **1,33** | 76 | 1.111,18 | 4,90 | 4.323,8245 | 268,6520 | 26380 de 08/11/23 (CX | 12,00) |
| 7 | 58476 | INCOLOR TRANSP PROFISSIONAL 60ML | NOVO TOQUE | 12 | 79,44 | **6,62** | 15 | 1.092,30 | 13,90 | 2.419,6375 | 109,9698 | 26485 de 28/04/23 (CX | 12,00) |
| 8 | 62012 | ESM TOQUE BALI 8 ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 50 | 1.072,50 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 9 | 62063 | ESM TOQUE PLANO TATICO 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 50 | 1.072,50 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 10 | 62049 | ESM TOQUE INCOLOR TRANSP 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 49 | 1.051,05 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 11 | 62008 | ESM TOQUE AREIA 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 48 | 1.029,60 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 12 | 62044 | ESM TOQUE FULGOR 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 48 | 1.029,60 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 13 | 62427 | ESM TOQUE MOCA BONITA CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 46 | 986,70 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 14 | 29633 | ESM PRATA GLITER ESM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 43 | 922,35 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 15 | 40044 | ESM COLORAMA JABUTICABA 8ML | COLORAMA | 6 | 28,30 | **4,72** | 39 | 919,75 | 8,90 | 1.032,1555 | 88,6926 | 542031 de 12/07/23 (CX | 6,00) |
| 16 | 62336 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 123,50 | **10,29** | 8 | 905,67 | 30,90 | 3.502,9150 | 200,2429 | 32166 de 16/05/23 (CX | 12,00) |
| 17 | 58394 | OLEO CICATRIFIOS INOAR 7 ML | INOAR | 12 | 87,38 | **7,28** | 10 | 800,98 | 12,90 | 2.025,8869 | 77,1572 | 57944 de 22/08/24 (CX | 12,00) |
| 18 | 62383 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 144,50 | **12,04** | 6 | 794,75 | 36,90 | 3.577,2318 | 206,4360 | 32166 de 16/05/23 (CX | 12,00) |
| 19 | 58358 | EMPODERADA CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 37 | 793,65 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 20 | 30807 | ESM TO DE FERIAS CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 37 | 793,65 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 21 | 30791 | BASE FOSCA TRAT ESM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 36 | 772,20 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 22 | 62038 | ESM TOQUE EXTRA BRILHO TRAT 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 36 | 772,20 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 23 | 62015 | ESM TOQUE BRANCO CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 35 | 750,75 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 24 | 62039 | ESM TOQUE FACANHA LIQ 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 35 | 750,75 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 25 | 62064 | ESM TOQUE PRETO 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 35 | 750,75 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 26 | 62041 | ESM TOQUE FLOCO NEVE GLIT 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 34 | 729,30 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 27 | 62069 | ESM TOQUE SELFIE LIQ 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 33 | 707,85 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 28 | 62073 | ESM TOQUE VERDE 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 32 | 686,40 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 29 | 62023 | ESM TOQUE COLOMBINA GLIT 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 31 | 664,95 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 30 | 62034 | ESM TOQUE ENERGIA GLIT | NOVO TOQUE | 12 | 23,40 | **1,95** | 30 | 643,50 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 31 | 62066 | ESM TOQUE ROSA ANTIGO 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 30 | 643,50 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 32 | 8937 | LAMINA CALO ST CLARA 2565 UN | SANTA CLARA | 10 | 53,02 | **5,30** | 13 | 620,33 | 12,90 | 1.020,3320 | 143,3044 | 718333 de 10/07/26 (-) |
| 33 | 49310 | BASE ROSA TRAT ESM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 27 | 579,15 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 34 | 49305 | LIVE TOP GLITTER 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 26 | 557,70 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 35 | 58369 | SENSUAL CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 26 | 557,70 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 36 | 62341 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 97,75 | **8,15** | 6 | 537,62 | 24,90 | 3.568,1330 | 205,6777 | 32166 de 16/05/23 (CX | 12,00) |
| 37 | 46448 | LIXA MAD.LUXO P/OS PES SANTA CLARA | SANTA CLARA | 12 | 37,98 | **3,16** | 15 | 522,22 | 6,90 | 2.179,9368 | 118,0095 | 647502 de 16/10/24 (UN | 12,00) |
| 38 | 30801 | ESM BOAS ENERGIAS CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 24 | 514,80 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 39 | 62011 | ESM TOQUE AZUL 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 24 | 514,80 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 40 | 1850 | LIXA PE POPULAR S CLARA 1220 | SANTA CLARA | 12 | 44,39 | **3,70** | 12 | 488,29 | 7,90 | 2.179,9730 | 113,5616 | 647502 de 16/10/24 (UN | 12,00) |
| 41 | 62026 | ESM TOQUE COPACABANA 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 22 | 471,90 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 42 | 62045 | ESM TOQUE GANBRIELA 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 22 | 471,90 | 4,90 | 36.084,6154 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 43 | 15853 | LIXA MAD PES C/12 | SANTA CLARA | 12 | 42,82 | **3,57** | 12 | 471,02 | 8,90 | 2.180,0560 | 149,4162 | 647502 de 16/10/24 (UN | 12,00) |
| 44 | 62030 | ESM TOQUE DOMADORA 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 21 | 450,45 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 45 | 62445 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 61,20 | **5,10** | 8 | 448,80 | 15,90 | 3.641,1765 | 211,7647 | 32166 de 16/05/23 (CX | 12,00) |
| 46 | 58356 | DONA DE MIM CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 19 | 407,55 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 47 | 62027 | ESM TOQUE DAMA RELUZENTE GLIT 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 19 | 407,55 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 48 | 62409 | ESM TOQUE PRATA CINT ESM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 19 | 407,55 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 49 | 30789 | BASE COLAGENO TRAT ESM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 17 | 364,65 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 50 | 30802 | ESM CAIPIRINHA CREM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 17 | 364,65 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 51 | 49308 | OLEO SECANTE TRAT ESM 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 17 | 364,65 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (UN | 12,00) |
| 52 | 53756 | Novex Recarga de Queratina Cond 80 | NOVEX | 12 | 10,60 | **0,88** | 36 | 349,80 | 1,07 | 21,1321 | 21,1321 | 5323 de 26/05/23 (CX | 12,00) |
| 53 | 62360 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 61,20 | **5,10** | 6 | 336,60 | 15,90 | 3.641,1765 | 211,7647 | 32166 de 16/05/23 (CX | 12,00) |
| 54 | 62414 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 59,50 | **4,96** | 6 | 327,25 | 14,90 | 3.506,0504 | 200,5042 | 32166 de 16/05/23 (CX | 12,00) |
| 55 | 62265 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 38,25 | **3,19** | 8 | 280,50 | 9,90 | 3.627,0588 | 210,5882 | 32166 de 16/05/23 (CX | 12,00) |
| 56 | 62203 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 51,00 | **4,25** | 6 | 280,50 | 12,90 | 3.542,3529 | 203,5294 | 32166 de 16/05/23 (CX | 12,00) |
| 57 | 62473 | ESMALTE COLORAMA FINI ULTIMA | COLORAMA | 6 | 36,22 | **6,04** | 9 | 271,65 | 9,90 | 883,9867 | 63,9978 | 542031 de 12/07/23 (CX | 6,00) |
| 58 | 58359 | FASHIONISTA GLITTER 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 12 | 257,40 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 59 | 58370 | TA NA MODA GLITTER 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 12 | 257,40 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 60 | 62460 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 38,25 | **3,19** | 7 | 245,44 | 9,90 | 3.627,0588 | 210,5882 | 32166 de 16/05/23 (CX | 12,00) |
| 61 | 62074 | ESM TOQUE 40 GRAUS 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 11 | 235,95 | 3,90 | 14.300,0000 | 100,0000 | 26485 de 28/04/23 (CX | 12,00) |
| 62 | 62020 | ESM TOQUE CEREJA 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 11 | 235,95 | 4,90 | 2.915,3846 | 151,2821 | 26486 de 28/04/23 (UN | 12,00) |
| 63 | 62392 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 42,50 | **3,54** | 6 | 233,75 | 10,90 | 3.593,1765 | 207,7647 | 32166 de 16/05/23 (CX | 12,00) |
| 64 | 62018 | ESM TOQUE CASCO CAVAL TRAT 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 10 | 214,50 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 65 | 62438 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 38,25 | **3,19** | 6 | 210,38 | 9,56 | 3.499,0588 | 199,9216 | 32166 de 16/05/23 (CX | 12,00) |
| 66 | 65127 | LIXA MINI RS.P/UNHA PCT.C/72 | SANTA CLARA | 72 | 2,86 | **0,04** | 72 | 203,06 | 0,15 | 27.088,8112 | 277,6224 | 647502 de 16/10/24 (UN | 72,00) |
| 67 | 62140 | BRINCO DE METAL PHD | PHD BIJOUTERIA | 12 | 42,00 | **3,50** | 5 | 192,50 | 10,90 | 3.637,1429 | 211,4286 | 32166 de 16/05/23 (CX | 12,00) |
| 68 | 59192 | ORNAMENTO PARA CABELO PALITO | ZGY | 24 | 3,36 | **0,14** | 48 | 154,56 | 0,28 | 4.700,0000 | 100,0000 | 7396 de 17/04/23 (CX | 24,00) |
| 69 | 62415 | ESM TOQUE BASE BOMBA TRAT ESM 8ML | NOVO TOQUE | 6 | 23,40 | **3,90** | 6 | 117,00 | 4,90 | 653,8462 | 25,6410 | 26485 de 28/04/23 (CX | 6,00) |
| 70 | 41686 | LIXA MINI COLOR ST CLARA 144UN 106 | SANTA CLARA | 144 | 10,26 | **0,07** | 10 | 101,89 | 0,15 | 28.671,9298 | 110,5263 | 647502 de 16/10/24 (UN | 144,00) |
| 71 | 7896013545040 | ESMALTE RISQUE PRETO SEPIA | RISQUE | 6 | 24,94 | **4,16** | 4 | 83,13 | 6,90 | 895,9904 | 65,9984 | 542031 de 12/07/23 (CX | 6,00) |
| 72 | 65130 | LIXA MEDIA RS.P/UNHA PCT.C/144 | SANTA CLARA | 144 | 7,03 | **0,05** | 7 | 48,87 | 0,25 | 73.641,1095 | 412,0910 | 647502 de 16/10/24 (UN | 144,00) |
| 73 | 1140 | LIXA MINI CANARIO ST CLARA UN | SANTA CLARA | 144 | 4,32 | **0,03** | 10 | 42,90 | 0,15 | 71.900,0000 | 400,0000 | 681014 de 06/08/25 (-) |
| 74 | 6499 | LIXA MEDIA CANARIO C/144 ST CLARA | SANTA CLARA | 144 | 6,99 | **0,05** | 5 | 34,71 | 0,25 | 73.980,6867 | 415,0215 | 647502 de 16/10/24 (UN | 144,00) |
| 75 | 15945 | LIXA POP.PRETA C/100 | SANTA CLARA | 100 | 10,53 | **0,11** | 3 | 31,27 | 0,25 | 18.893,3523 | 137,4169 | 647502 de 16/10/24 (CX | 100,00) |
| 76 | 62425 | ESM TOQUE NUVEM CLASSIC TRANSP 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 1 | 21,45 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 77 | 62060 | ESM TOQUE NUVEM TRANSP 8ML | NOVO TOQUE | 12 | 23,40 | **1,95** | 1 | 21,45 | 4,90 | 2.915,3846 | 151,2821 | 26485 de 28/04/23 (CX | 12,00) |
| 78 | 41042 | ESPATULA PLASTICA LUXO PRETA SANTA | SANTA CLARA | 25 | 10,79 | **0,43** | 2 | 20,72 | 2,90 | 4.742,4467 | 571,9184 | 647502 de 16/10/24 (PC | 25,00) |

## O que NÃO está aqui

- **162 dos 290 produtos anômalos não têm nota desde 2023** — sem nota não dá para saber o fator.
  Esses caem na contagem física, não no ajuste de custo.
- **50 têm nota mas sem a coluna de fator** preenchida — precisam de olho humano.
- **O custo médio não é tocado.** Ele não valoriza o estoque, mas alimenta o CMV da venda.
  Se quiser o número certo em todo lugar, é uma segunda passada.

