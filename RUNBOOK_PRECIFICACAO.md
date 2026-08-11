# RUNBOOK — Precificação por NF-e (Grupo A.M. Gomes)

Criado 28/07/2026 (consolidação das memórias `precificacao_*` + auditoria do defeito "NFe órfã").
**Leia este arquivo ANTES de mexer em qualquer coisa da precificação.**

Tela no ar: https://athilamgomes-ui.github.io/dashboard-equipe/precificacao.html
(GitHub Pages, repo `dashboard-equipe`; cache 10 min — após deploy, entregar URL com `?v=<n>`).

---

## ⛔ REGRA INEGOCIÁVEL — O AGENTE NUNCA ESCREVE PREÇO NO ERP

O dashboard **SUGERE**; **só o usuário aplica**, importando o `.txt` no Microvix
(Estoque > Relatórios > Lista de Preços > Ajuste de Preços > "Arquivo para atualização de valores",
marcar "Código de Barras", Validar, Upload). O agente NUNCA importa a lista, NUNCA edita preço pela
UI ou API — nem quando há dezenas de divergências, nem quando o usuário reclama que "foi pra venda
com preço errado". Não oferecer. (Regra do usuário 15/07/2026; memória
`precificacao_nunca_escrever_preco_erp`.) Escrever em `precificacao_precos_manuais.json` /
`precificacao_custos_manuais.json` é permitido — só afeta a sugestão na tela.

---

## Arquitetura e jobs (3 launchd + 1 dependência)

| Job | Agenda | O que faz |
|---|---|---|
| `com.amgomes.precificacao` | 15/15 min, 8h–19h45, seg–sáb, env `PUSH=1` | `scripts/coleta_precificacao.mjs` — coleta completa: NFes (API fiscal SEFAZ via sessão headless) + XML por item + preço atual do ERP (Lista de Preços por marca) → grava `precificacao_dados.json` e, se mudou, commit+push (GitHub Pages). Log `/tmp/precificacao_update.log` |
| `com.amgomes.precificacaofast` | a cada 2 min (StartInterval 120), 24h | `scripts/detecta_entrada.mjs` — detector leve (~15-25s): compara status "lançada" com os rastreadores `T\|` do state; ao ver transição pendente→lançada dispara coleta expressa (`PUSH=1 SKIP_PRECO=1`, NF na tela em ~60-90s só com preço sugerido) e depois a completa. Log `/tmp/precificacao_fast.log` |
| `com.amgomes.precificacaotrigger` | sempre ativo (KeepAlive) | `scripts/watch_precificacao_trigger.mjs` — atende o botão "⚡ Atualizar NFes agora" (tabela Supabase `precificacao_trigger`, linha id=1, poll 20s): roda expressa → `coleta_nfes_erp.mjs` → completa. Log `/tmp/precificacao_trigger.log` |
| dependência: `com.amgomes.nfes` (9h05→19h05, 2/2h) | | `coleta_nfes_erp.mjs` → Supabase `nfes_erp` fornece o `data_lcto` (fallback de "entrada recente" p/ NF nunca vista pendente). Blindado 08/07: se a coleta de lançadas falhar (0), PRESERVA as anteriores. |

Todos usam o MESMO lock `/tmp/precificacao_update.lock.d` (mkdir; órfão >30min é limpo).
Playwright headless + `microvix_auth.mjs` + Keychain `microvix-cron` + perfil `~/.claude/microvix-profile`
(NUNCA Chrome MCP — Regra nº 1 do CLAUDE.md). Falha em cascata → checar zumbi `chrome-headless-shell`.

## Fluxo ponta a ponta

1. Colaborador lança a NF de entrada no Microvix.
2. Detector (2 min) ou coletor (15 min) vê a transição pendente→lançada → NF entra em
   `precificacao_dados.json` → push → tela (latência real ~2-4 min; botão ⚡ ~1-2 min).
3. A NF **fica na tela até ser precificada** (detecção automática OU botão "✅ Concluída");
   depois de detectada, some em `DIAS_ENTRADA` (3) dias.
4. Equipe revisa margens/preços na tela → botão "📤 Arquivo p/ ERP (.txt)" gera `EAN;preço`
   (vírgula decimal, deduplicado por EAN — lotes repetidos ficam com o preço MAIOR).
5. **O USUÁRIO** importa o `.txt` no ERP (ver regra inegociável).

### Janelas e estado (`precificacao_lancadas.json`, gitignored)
- `DIAS_INICIO=3`: NF só COMEÇA a aparecer com evidência de entrada recente = transição detectada
  agora (primário) OU `data_lcto` do `nfes_erp` ≤ 3d (fallback). Sem evidência não inicia
  (não reviver NF antiga). Usuário confirmou 08/07: "só as dos últimos 3 dias, não mude".
- `DIAS_ENTRADA=3`: dias visível DEPOIS de detectada como precificada.
- state = `{ "<chave44>": {desde, aplicadoDesde, baseline{ean:preço}}, "T|<chave>": {l:bool, ts} }`.
  Poda: aplicadas >30d; rastreadores T| >60d. Nunca poda NF ainda não precificada.
- Detecção "já precificou": ≥60% dos itens COM DADO (e ≥2) batendo (a) preço ERP == sugerido padrão
  ±0,01 OU (b) preço ERP mudou vs baseline. Botão "✅ Concluída" grava na tabela Supabase
  `precificacao_concluidas` e remove na hora (o coletor trava no state).
- Carga manual: `NF=684024,684025 node coleta_precificacao.mjs` (ignora gatilho; não salva state).
  `SKIP_PRECO=1` pula o relatório de preços (rápido). Sem `PUSH=1` grava local e NÃO publica.

## ⚠️ Marca não mapeada — fluxo novo (28/07/2026)

**Antes:** NFe de fornecedor sem marca em `fornecedor_marcas.json` era DESCARTADA em silêncio
(`if(!marcaForn) continue`) — nem entrava no rastreio. Foi o defeito mais caro do pipeline:
em 15/07 produtos "foram para venda com o preço errado" e o usuário ditou 6+ códigos no chat em
julho (La Bening=1015, Depimiel=313, Felps=1000, Talge=243, Depilflax=957, Catharine Hill=346).

**Agora:** a NFe **entra mesmo assim**, com `marca_pendente: true` e `marca` = razão social do
fornecedor. A tela mostra badge vermelho "⚠️ marca não mapeada" no card e um aviso na tabela:
precifique manualmente (o preço SUGERIDO sai normal) e registre a marca com o Claude. Sem o código
da marca a coluna "Preço atual ERP" fica vazia (o filtro do relatório exige o código). Fornecedor
multi-marca (valor com `+`, ex. Franca Plus/Vertix+Ricca) também cai como pendente até o split.
O detector (`detecta_entrada.mjs`) também dispara para NF sem marca. Continuam FORA:
`_ignorar_no_dashboard` (não-revenda: postos, bancos...) e `_uso_interno` (Solider/MultiBag).

**Ao registrar a marca:** skill `mapear-marca` (seção "Precificação") — os 2 arquivos do de-para
+ entrada no `CHANGELOG_MARCAS.md` de compras. Depois `NF=<n> node coleta_precificacao.mjs` para
validar que o preço atual passa a casar.

## De-para de marcas (persistido, versionado no repo `compras`)

- `/Users/elkgomes/Desktop/claude/compras/fornecedor_marcas.json` — fornecedor→marca
  (`por_cnpj` preferido; `por_nome_substring` fallback; `_ignorar_no_dashboard`, `_uso_interno`,
  `_transito_sem_marca_ok`). Desde 28/07 os coletores leem `_uso_interno.marcas` (fim do hardcode).
- `/Users/elkgomes/Desktop/claude/compras/marca_ids.json` — marca→código(s) do grupo de Marca no
  ERP (filtro do relatório de preços; ProBelle=[858,366] — hoje só o 1º código é usado).
  Código errado = sintoma "0/1 prod" no relatório (casos Catharine Hill 364→346, Depimiel 839→313).

## Modelo de cálculo (markup por dentro — espelha a planilha MB ATM)

`preço = custo_efetivo / (1 − imposto − cartão − comissão − outros − custo_fixo − margem)` — todos
% sobre o preço de venda; margem líquida = alvo por construção. `arredonda90()` sobe até o próximo
`,90` (nunca abaixo do calculado). Parâmetros em `precificacao_params.json` (a tela pode sobrepor
via localStorage `precificacao_cfg_v1` — faixa vermelha avisa; ver memória
`precificacao_config_localstorage`).

- **Custo cheio por item** = ValorTotalLiquido + frete + seguro + outras + IPI + ICMS-ST + FCP-ST.
- **ST por produto** = NCM × lista SEFA-PA (`st_pa_ncm.json`, PRIMÁRIO) ou sinais da NF
  (CST 10/30/60/70, vICMSST>0, CEST — marca `st_motivo:"nf"` = revisar).
  **CST/ST/NCM: SEMPRE do XML por produto (`BaixarNFe`), nunca do header/BuscarDetalhes.**
- Item **ST**: custo × (1 + `st_entrada_por_uf` da UF de origem: SP/RJ/ES/MG 21%, GO 18%) e
  **imposto de venda 0%**. Item **não-ST**: abate crédito de ICMS real da NF (só Lucro Real;
  L3 Simples = 0) e imposto de venda 19%.
- **UF=PA (intra-estadual): imposto de entrada 0%** — sem ST de entrada e sem crédito.
- Regime: L1/L4/L5 Lucro Real, L3 Simples (imposto 19% em todas).
- **Tabelas de preço por ID** (dropdown só mostra as da emp logada): padrão=1, Itaituba=3,
  Altamira=4. L1/L4→4, L3→3, L5→1.
- Margem: padrão 15%; por marca (campo "Margem <marca>") e POR PRODUTO (por EAN) memorizadas na
  tabela Supabase `precificacao_margens` (produto = chave `ean:<EAN>`). Precedência do preço final:
  preço digitado > margem própria do produto > preço fixo do EAN (`precificacao_precos_manuais.json`)
  > margem da marca. (memória `precificacao_margem_item_vs_marca`)

### Regras por marca/fornecedor (consolidado julho/2026)
- **Talge (243)**: entra em CAIXA, precifica por UNIDADE — fator `qTrib/qCom` do XML
  (`marcas_por_caixa` nos params). Outra marca em caixa → só adicionar à lista.
- **Santa Clara (9)**: XML sem fator (qCom==qTrib); embalagem só na descrição. "Dividir ou não" é
  POR PRODUTO: padrão = pacote (não divide); `santa_clara_por_unidade` (cProd→'auto'|número) divide;
  LIXAS de papel = "ambos" (mostra pacote + unidade derivada; refil = só pacote). Classificação em
  massa via `scripts/classifica_santaclara.mjs` (preço real de venda no Histórico de Movimento —
  coluna "Valor Unit." das saídas, NUNCA "Preço Venda Unit." do cadastro).
- **NF subfaturada** (Itallian/Network Beauty ~50%, Let me be ÷2): custo real por EAN em
  `precificacao_custos_manuais.json` (fonte = PDF do pedido; cruzar cprod pedido↔NF p/ achar o EAN,
  nunca digitar EAN na mão).
- **Item SEM GTIN**: EAN de cadastro em `precificacao_eans_manuais.json` (chave `CNPJ:CPROD` ou
  `CPROD`); nunca sobrescreve EAN vindo na nota.
- **`.txt` deduplica por EAN** (mesma NF traz o mesmo EAN em linhas/lotes diferentes; o ERP rejeita
  arquivo com repetido). XLSX/CSV continuam 1 linha por item (espelho da NF).
- **Match do preço atual**: EAN exato (1º) + Referência exata cprod↔ref (2º; só refs únicas).
  NUNCA por descrição (aproximado, já deu falso). Falha transitória do relatório ("0 prod") →
  5 tentativas + preserva preço da coleta anterior (`match_tipo` com `*`); tent. ≥4 inclui inativos
  (marca nova com produtos desativados, caso Depimiel). Se 0 prod persistir: 1ª suspeita = opção
  "Ajuste de Preços" do relatório desligada (sticky por usuário; o coletor dá clique real).

## Diagnóstico — "a NF não aparece para precificar"

1. **Marca não mapeada?** Desde 28/07 ela deve aparecer COM badge. Se não aparecer nem assim:
2. Está no state? (`grep <nº> precificacao_lancadas.json`; nº da NF = dígitos 26–34 da chave de 44).
   Ausente = coletor nunca viu (fornecedor em `_ignorar_no_dashboard`? natureza excluída —
   devolução/bonificação/transferência? CFOP excluído?).
3. Fora da janela? Entrada há >3d sem transição detectada não inicia. Carga manual: `NF=<n> ...` + push.
4. Já detectada como precificada (aplicadoDesde no state) ou marcada "✅ Concluída"
   (tabela `precificacao_concluidas`) → não volta.
5. Fila zerada de repente: `coleta_nfes_erp` gravou 0 lançadas? (blindado, mas conferir) — rodar
   `node coleta_nfes_erp.mjs` e depois o coletor.

## Arquivos (repo `dashboard-equipe`)

`precificacao.html` (tela — editar via Claude+git, NUNCA TextEdit) · `precificacao_dados.json`
(gerado — NUNCA editar na mão) · `precificacao_params.json` · `precificacao_precos_manuais.json` ·
`precificacao_custos_manuais.json` · `precificacao_eans_manuais.json` · `precificacao_icms_estados.json`
· `st_pa_ncm.json` · `precificacao_lancadas.json` (estado local, gitignored) ·
`scripts/{coleta_precificacao,detecta_entrada,watch_precificacao_trigger,classifica_santaclara,aplica_precos_erp}.mjs`
· SQL Supabase: `scripts/{precificacao_trigger,precificacao_concluidas,precificacao_margens}.sql`.

## Lacunas — CONFIRMAR COM O USUÁRIO (não inventar)

- **Custo fixo % por loja** (11/08/2026): `custo_fixo` = custo fixo real ÷ faturamento **média móvel 3
  meses**, com **TETO de 0,30**. No arquivo: L1 **0,209** · L3 **0,30** (teto; real 31,0%) · L4 **0,25** ·
  L5 **0,30** (teto; real 46,9%). Fonte numerador: ERP > Financeiro > Contas a Pagar, Centro de Custo =
  Custo Fixo (3), mês ref = 1º mês futuro completo (set/2026). Denominador: `fat_2026.json` (mai–jul/2026).
  Medido após o usuário excluir contas marcadas errado como custo fixo. **L3 e L5 batem no teto de 30%** —
  acima disso o preço sai do mercado; a diferença (L3 ~R$0,7k/mês, L5 ~R$13,6k/mês) é **buraco estrutural**
  (resolve com faturamento/custo, não com preço). **Revisar TODO MÊS** com o painel financeiro. Detalhe no
  `_custo_fixo_doc` do próprio `precificacao_params.json`.
- **Seed de ST** (`st_pa_ncm.json`) cobre só o segmento 20 (perfumaria/cosméticos) do Conv. 142 —
  validar/completar com o contador; itens `st_motivo:"nf"` são fila de revisão de NCM.
- **Franca Plus (multimarca Varcare 249 + Nathydras 885)**: split por linha de produto pendente —
  o usuário precisa dizer qual linha é de qual marca; até lá as NFs entram como marca_pendente.
- **ProBelle código 366**: o filtro do relatório usa só o 1º código (858) — cobertura parcial.
- **Santa Clara cprod 4281** (PIRANHA GRD REFIL C/48): venda recente R$1,90 vs custo do pacote
  R$24,26 — vende por unidade ou é erro de preço com prejuízo? Investigar.
- **Anomalias sem verificação possível**: NF em que NENHUM item tem EAN nunca é detectável por
  preço (só o botão "✅ Concluída" resolve).
