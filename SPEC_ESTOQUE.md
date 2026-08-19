# SPEC — Dashboard ESTOQUE (A.M. Gomes)

> Escrito em 19/08/2026, ANTES do código, a pedido do usuário ("me mostre o plano do pipeline e
> de onde vem cada número"). Este arquivo é a fonte da verdade do desenho; vira `RUNBOOK_ESTOQUE.md`
> quando o pipeline estiver rodando.

## 0. Invariantes herdados (não negociáveis)

- **Coleta = Playwright headless** reusando `scripts/microvix_auth.mjs` (Keychain `microvix-cron`,
  perfil `~/.claude/microvix-profile`). **Chrome MCP é proibido** (REGRA Nº 1 do CLAUDE.md).
- Lojas: **L1=emp 1 · L3=emp 3 · L4=emp 4 · L5=emp 10**. Nunca 9 nem 11.
- **Um comando:** `bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_estoque.sh`.
- **Um escritor:** `scripts/build_estoque.mjs` é o ÚNICO que escreve `dashboard_estoque.html`.
  O agente nunca edita o HTML na mão.
- Exit codes: `0` ok · `10` coleta falhou (preserva HTML anterior + PushNotification) ·
  `20` build falhou (restaura HTML) · `30` lock.
- Lock: `/tmp/amgomes_estoque.lock` (mkdir atômico + trap, igual aos outros pipelines).
- **Timestamp real e estático** no HTML (`#lastUpdate`), escrito pelo build. JS nunca sobrescreve
  com `new Date()` de page-load.
- Perfil do Microvix é compartilhado por ~20 scripts → **serializar** coletores (nunca paralelo no
  mesmo perfil) + retry, e escolher horário fora da janela da precificação (seg–sáb 08:00–19:45).
- **Nada de dado cru no scratchpad.** Todos os JSONs de coleta e cache moram em
  `dashboard-equipe/` (com `.gitignore` para o que for sensível/pesado).

## 1. Arquitetura de arquivos

```
dashboard-equipe/
  atualizar_estoque.sh              ← o único comando
  dashboard_estoque.html            ← único artefato publicado (escrito só pelo build)
  estoque_dados.json                ← saída derivada do build (o painel lê daqui)
  scripts/
    coleta_estoque_balancos.mjs     ← API lb-erpwebapp (balanços)
    coleta_estoque_saldo.mjs        ← relatorio_compra_venda_saldo_empresa.asp
    coleta_estoque_notas.mjs        ← relatorio_notas.asp + cópia da NF
    coleta_estoque_custos.mjs       ← relatorio_movimento_produto.asp (só suspeitos)
    build_estoque.mjs               ← ÚNICO escritor do HTML
  dados_estoque/                    ← cru + caches (gitignored)
    balancos.json                   cache imutável (balanço finalizado nunca muda)
    saldos.json                     última coleta de saldo por loja
    janelas.json                    cache entradas/vendas por (loja, data-balanço)
    notas.json                      notas de entrada + canceladas + fator de conversão
    custos.json                     custo médio real por produto (TTL 30 dias)
    hist_negativos.json             1ª data em que cada produto ficou negativo
    hist_deposito2.json             1ª data em que cada produto entrou no depósito 2
```

## 2. Pipeline (`atualizar_estoque.sh`)

| Passo | Script | O que faz | Se falhar |
|---|---|---|---|
| 0 | — | lock, datas, guarda de horário | exit 30 |
| 1 | `coleta_estoque_balancos.mjs` | lista balanços 2026 das 4 lojas e baixa o conteúdo dos que ainda não estão no cache | exit 10 (bloco 1 e 2 dependem) |
| 2 | `coleta_estoque_saldo.mjs` | saldo/entradas/vendas/trânsito por loja (janelas + depósito 2) | exit 10 |
| 3 | `coleta_estoque_notas.mjs` | notas de entrada da janela, **incluindo canceladas**, + coluna "Fat. Conv. Utilizado" das cópias de NF | AVISO (não fatal — blocos 1 e 6 degradam, painel avisa) |
| 4 | `coleta_estoque_custos.mjs` | custo médio real dos suspeitos do bloco 5 | AVISO (não fatal) |
| 5 | `build_estoque.mjs` | calcula os 6 blocos e escreve o HTML + `estoque_dados.json` | exit 20 (restaura HTML) |
| 6 | — | sanity (JS compila · 4 lojas presentes · nenhuma loja caiu de N→0) → commit/push | exit 20 |

**Sanity anti-"coleta parcial"** (lição de 07/08, L4 zerada): se qualquer loja tinha produtos na
execução anterior e agora tem 0, o pipeline **reverte e sai 10** — exit 0 não é prova de dado bom.

## 3. De onde vem cada número

### Fontes brutas

**A. API de balanço** (`lb-erpwebapp`, via `ctx.request` do Playwright — `fetch` na página falha por CORS).
Autenticação: `garantirSessao()` → trocar empresa no `#topbar_sel_empresa_portal_usuario` do v4/home →
abrir `gestor_web/produtos/balanco_validar_permissao.asp` → **capturar o header `authorization`** da
primeira chamada a `suprimentoswebapi-prod`.

| Chamada | Método | Entrega |
|---|---|---|
| `Balanco/FiltrarBalancos` | POST `{dataInicial,dataFinal,idEmpresa}` | lista de balanços (`IdBalanco`, `Nome`, data, `IdStatusBalanco`, `IdEmpresa`) |
| `Balanco/ObterDadosConferenciaBalanco?idBalanco=N` | GET | `CodigoProduto`, `Nome`, `Referencia`, `SaldoAnteriorERP`, **`QuantidadeTotalConferencia`** (o contado), `QuantidadeAjuste`, `TipoAjuste`, **`ValorProduto`** |

Filtros: `IdStatusBalanco === 3` (finalizado) · `IdEmpresa` conferido registro a registro (o painel
às vezes devolve balanço de outra loja) · **`Nome` que casa `/AJUSTE/i` é EXCLUÍDO** (é injeção de
saldo, não contagem).

**B. Relatório de saldo** (`gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp`),
forma **Analítica**, agrupado por **Marca**, **UMA empresa por vez**, `controle_dif_periodo` e
`exibe_estoque_transito` ligados, `somenteDisp` desligado. Tabela de 11 colunas:

| col | conteúdo | uso |
|---|---|---|
| 0 | código | chave do produto |
| 1 | descrição | blocos 3, 5, 6 (parser de C/12, DZ, PCT) |
| 2 | referência | exibição |
| 3 | saldo anterior | — |
| 4 | recebimento (entradas na janela `data1_compra`→`data2_compra`) | bloco 1 |
| 5 | vendas global | conferência |
| 6 | saldo global | — |
| 7 | trânsito global | — |
| 8 | **vendas da loja** (janela `data1`→`data2`) | bloco 1 |
| 9 | **trânsito da loja** | bloco 1 |
| 10 | **saldo da loja hoje** | blocos 1, 2, 3 |

O cabeçalho `Marca: NOME (n)` que precede as linhas dá a marca (blocos 2 e 4).

**C. Notas de entrada** (`relatorio_notas.asp?modulo=estoque`) — janela = da data do balanço mais
antigo até hoje, CFOP `[E] … COMPRA`, analítica. Traz cabeçalho da nota (data, documento,
fornecedor, empresa) + itens (código, qtde). **Inclui as canceladas** (a coleta não filtra
status; cada nota carrega seu status). Clicando no número abre a cópia da NF, cujas colunas
incluem **`Fat. Conv. Utilizado`** (bloco 6; `-` = não há fator cadastrado). A cópia é cacheada por
`(loja, documento)` — nota lançada não muda.

**D. Histórico de movimento** (`relatorio_movimento_produto.asp`, um produto por vez ~2–4 s):
campos `produto`, `f_data1`, `f_data2`, checkboxes `entrada`/`saida`/`saldo`, botão "Gerar relatório >".
Entrega a coluna **"Médio (Histórico) Unit." = custo médio verdadeiro** e o **preço real praticado**
(coluna "Valor Unit." das saídas com CFOP de venda — a coluna de cadastro é notoriamente corrompida).
Caro → só para os suspeitos do bloco 5, com cache de 30 dias.

### Bloco 1 — RECONCILIAÇÃO (o coração)

Para cada (loja, produto) com **balanço de CONTAGEM finalizado** (o mais recente por produto):

```
contado          = QuantidadeTotalConferencia         (fonte A)
entradas         = coluna 4 do relatório de saldo     (fonte B, janela data_balanço→hoje)
entradas_cancel  = Σ qtde dos itens em notas de entrada CANCELADAS na janela   (fonte C)
vendas           = coluna 8                            (fonte B, mesma janela)
saldo_hoje       = coluna 10                           (fonte B)
transito_hoje    = coluna 9                            (fonte B)

esperado   = contado + (entradas − entradas_cancel) − vendas
diferenca  = (saldo_hoje + transito_hoje) − esperado
```

Duas correções face à versão de 12/08 — sem elas, **nota cancelada e relançada vira "sumiu sem
documento"** (foi exatamente o caso Nathydras / Alho Therapy de agosto/2026, que serve de teste de
aceite do bloco):
1. **canceladas** entram na conta (o relatório conta a entrada da nota morta e a da relançada; o
   estoque físico só recebeu uma vez);
2. **trânsito** entra na conta (mercadoria já recebida que ainda não caiu no saldo da loja).

**Janela por data de balanço.** Produtos contados em datas diferentes precisam de janelas
diferentes. A coleta agrupa os produtos pelas **datas distintas de balanço** de cada loja e roda o
relatório uma vez por data (`data1`/`data1_compra` = data do balanço, `data2`/`data2_compra` = hoje).
Cache incremental em `janelas.json`: o resultado de `[data_balanço → ontem]` é congelado e a
execução do dia só coleta o delta `[hoje → hoje]`, somado a todas as janelas. Se o número de datas
distintas por loja for pequeno (≤ ~8), o pipeline recalcula tudo do zero e dispensa o incremental —
**medição do nº de datas distintas é o passo 0 da implementação**.

**Lista.** Só entra quem **não fecha** (`diferenca ≠ 0`). O painel mostra o **% que fecha por loja**
(`produtos com diferença 0 ÷ produtos com balanço de contagem`) — referência de 12/08: **68% em L1/L4**.

**Classificação da diferença** (nesta ordem, primeira que casar):

| classe | teste |
|---|---|
| transferência espelhada L1↔L4 | mesmo produto com diferenças de sinal oposto e módulo equivalente em L1 e L4 |
| divisão ÷2 de nota | o que saiu = `floor(entrada/2)`; em quantidade ímpar a maior parte fica na loja do CNPJ da nota |
| pacote × unidade | diferença ≈ ±k × N, com N vindo do descritivo (C/12, C/144, DZ, PCT — mesmo parser do bloco 6) |
| ruído de contagem | `|diferença| ≤ 3` |
| **sem documento** | o resto — é o buraco que interessa |

### Bloco 2 — COBERTURA DE BALANÇO
Por (loja, marca): **SKUs com saldo positivo** (fonte B, coluna 10 > 0) × **SKUs que aparecem em
algum balanço de contagem** (fonte A, qualquer data, AJUSTE excluído). Cobertura = contados ÷ com
saldo. Ordenado da **pior para a melhor**. (Referência 12/08: Felps L4 7% · Santa Clara L4 44% ·
Widi Care L4 100%.)

### Bloco 3 — SALDO NEGATIVO
Fonte B, coluna 10 < 0, por loja e produto. **"Há quanto tempo"**: o relatório não tem essa data —
o pipeline mantém `hist_negativos.json` e grava a **primeira execução em que o produto apareceu
negativo**. Na estreia todos aparecem como "desde 19/08/2026 (1º registro)"; o painel rotula isso
honestamente em vez de inventar antiguidade. Quando o produto já estava negativo no último balanço,
a data do balanço é usada como piso (é uma prova documental de que já era negativo naquele dia).

### Bloco 4 — VENCIDOS (depósito 2 "Devolvidos (com defeito)")
Fonte B com o `select[name=depositos]` restrito ao **depósito 2**, por loja, agrupado por marca.
Depósitos: `Estoque [1]`, `Devolvidos (com defeito) [2]`, `CD [3]`, `Cultura Cacheada [4]`.
**Dias parados esperando nota de baixa** = hoje − primeira data em que o item apareceu no depósito 2,
de `hist_deposito2.json` (mesma política honesta do bloco 3).

### Bloco 5 — PREÇO ABSURDO
`razão = preço_de_venda ÷ custo_médio`, por produto.
- **preço de venda**: `ValorProduto` do balanço (fonte A) — ⚠️ **este campo é PREÇO DE VENDA, não
  custo** (correção de 19/08 à memória `microvix-api-balanco-inventario`); e, para os suspeitos,
  confirmado pelo preço realmente praticado na última venda (fonte D).
- **custo médio verdadeiro**: coluna **"Médio (Histórico) Unit."** do histórico de movimento (fonte D).
- Fluxo em duas camadas para caber no tempo: o build ranqueia os candidatos pelo preço do balanço
  (absurdos saltam sozinhos: R$ 288.230/un no SHAMPOO ALYNE, R$ 3.009/un na LIXA MINI) e a coleta D
  busca custo real só dos **top N candidatos** (cache 30 dias, custo é estável).
- **Onde a razão for absurda, o preço está errado — não o custo.** O painel só SINALIZA.
  ⚠️ O agente **nunca** escreve preço no ERP (regra de 15/07/2026) — quem aplica é o usuário, pelo
  fluxo do dashboard de precificação.
- Consequência a registrar: a leitura de 12/08 ("103 produtos com custo médio corrompido") foi feita
  supondo que `ValorProduto` era custo. Com custo real na mão, este bloco diz quanto daquele
  diagnóstico é **preço errado** e quanto é **custo médio realmente explodido** por saldo negativo +
  entrada. As memórias `balanco-ajuste-custo-medio-corrompido` e `microvix-api-balanco-inventario`
  serão corrigidas com o resultado medido.

### Bloco 6 — FATOR DE CONVERSÃO AUSENTE
Produto cuja **descrição** diz `C/12`, `C/144`, `DZ`, `PCT`, `CX` (etc.) mas cujo **cadastro** está
`UN/UN/1`. O fator mora no cadastro do produto e é **POR EMPRESA** — o mesmo código pode estar certo
em L1 e errado em L4. Evidência barata e direta: a coluna **`Fat. Conv. Utilizado`** da cópia da NF
(fonte C) — `-` significa que não há fator cadastrado naquela empresa. O bloco cruza
"descritivo promete fator" × "NF entrou sem fator" e lista por loja, com a nota e a data que provam.
Cobre os produtos que **entraram** na janela — que é exatamente onde o erro custa dinheiro
(entra 1 caixa, o ERP dá baixa de 1 unidade). Janela padrão: últimos 90 dias, cache por documento.

## 4. Decisões pendentes (perguntadas ao usuário)

1. **Publicação:** o repo `dashboard-equipe` é **público**. O painel mostra custo, preço e valor de
   estoque. Cifrar com senha no Keychain (padrão da Conferência de Caixa) ou publicar aberto?
2. **Cadência:** proposta = **diário às 22:10** (fora da janela da precificação e depois da
   conferência de caixa das 20:40/21:35, que disputam o mesmo perfil do Microvix) +
   **domingo full** (ERP livre, loja fechada) para os recálculos pesados.

## 5. Registro de execuções

(a preencher a partir da primeira execução real)
