# RUNBOOK — Dashboard de ESTOQUE (dashboard_estoque)

> Criado em 19/08/2026. **Carregue este arquivo SEMPRE que for mexer no painel de estoque.**
> O desenho e a justificativa de cada número estão em `SPEC_ESTOQUE.md` (escrito antes do código).

## Um comando

```bash
bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_estoque.sh
```

Exit: `0` ok · `10` coleta falhou ou sanity reprovou (**preserva a versão anterior**) ·
`20` build falhou (restaura o HTML) · `30` lock (execução concorrente ou perfil do Microvix ocupado).

⚠️ **REGRA Nº 1:** toda coleta é Playwright headless. Chrome MCP no Microvix é proibido.
⚠️ **`build_estoque.mjs` é o ÚNICO escritor de `dashboard_estoque.html`.** O agente nunca edita o HTML.
⚠️ O painel vai **cifrado** (o repo é público e a página mostra custo, preço e valor de estoque).
Senha: Keychain `estoque-web/amgomes-estoque`, com fallback para `caixa-web/amgomes-caixa` e
`financeiro-web/amgomes-financeiro` — hoje vale a **mesma senha do painel de Conferência de Caixa**.

## Peças

| Arquivo | Papel |
|---|---|
| `atualizar_estoque.sh` | o pipeline inteiro (lock, coleta, build, sanity, push) |
| `scripts/coleta_estoque_balancos.mjs` | balanços via API do `lb-erpwebapp` (cache imutável) |
| `scripts/coleta_estoque_saldo.mjs` | saldo/entradas/vendas/trânsito/custo/preço (o passo pesado) |
| `scripts/coleta_estoque_notas.mjs` | notas de entrada, **canceladas** e cópia da NF (fator de conversão) |
| `scripts/coleta_estoque_custos.mjs` | custo real dos suspeitos, via Histórico de Movimento (cache 30d) |
| `scripts/estoque_janelas.mjs` | decomposição mensal da janela — **compartilhada** por coletor e build |
| `scripts/build_estoque.mjs` | único escritor do HTML |
| `scripts/estoque_app.{js,css,html}` | painel (JS injetado como VALOR, nunca dentro de template literal) |
| `dados_estoque/` | cru + caches, **fora do git** (custo/preço não vão pro repo público) |

## Locks e concorrência (leia antes de rodar à mão)

O perfil `~/.claude/microvix-profile` é compartilhado por ~20 scripts. Este pipeline segura
**dois** locks: o seu (`/tmp/amgomes_estoque.lock`) e o **da precificação**
(`/tmp/precificacao_update.lock.d`), mantendo o segundo "fresco" com `touch` a cada 2 min —
sem isso o `detecta_entrada.mjs` (2/2 min) considera o lock órfão depois de 30 min e rouba o perfil
no meio da coleta. O lock do ERP é liberado assim que a coleta acaba, antes do build.

Enquanto o pipeline roda, a **precificação não coleta** (sai limpa por lock). Como a coleta completa
leva ~1h, o horário é 22:10 — fora da janela da precificação (seg–sáb 08:00–19:45), depois do
financeiro (19:55) e da conferência de caixa (20:40 / 21:35).

## As duas armadilhas que já custaram caro aqui

1. **Relatório truncado.** O relatório de saldo é uma navegação cujo HTML chega em *streaming*.
   Esperar "as linhas pararem de crescer" entregou 56.502 linhas com a página ainda carregando.
   Agora a espera é o evento **`load` da navegação**, e não terminar = **erro**, nunca dado.
   Catálogo completo por loja: ~8 a 15 min (56.502 produtos).
2. **Dado parcial publicado.** O sanity reprova se alguma loja ficar sem SKU, se cair mais de 50%
   em relação à execução anterior, ou se **faltar qualquer janela** no cache — janela faltando
   significa entradas subestimadas, ou seja, sumiço falso.

## De onde vem cada número (resumo — detalhe em SPEC_ESTOQUE.md)

**Balanços** — `Balanco/FiltrarBalancos` (POST `{dataInicial,dataFinal,idEmpresa}`) e
`Balanco/ObterDadosConferenciaBalanco?idBalanco=N` (GET). Autenticação: `garantirSessao()` → trocar
empresa no `#topbar_sel_empresa_portal_usuario` → abrir `balanco_validar_permissao.asp` → **capturar
o header `authorization`** da primeira chamada a `suprimentoswebapi-prod` → disparar por
`ctx.request` (fetch na página falha por CORS). Campos reais: **`Descricao`** (não `Nome`),
**`DataLancamento`** (não `Data`), `IdStatusBalanco` (3 = finalizado), `IdEmpresa` (conferir registro
a registro), `IdDeposito` (todos = 1).

**Balanço que NÃO é contagem** — o marcador é o **nome do balanço** (`AJUSTE`, `ZERAR … SEM BALANÇO`),
nunca o nome da seção: 206 dos 271 balanços da L4 têm uma seção chamada "AJUSTE" e são contagens
normais. Excluídos hoje: L1 #621/#622/#623/#627/#640, L3 #447, L4 #624/#637/#638 — bate com a
memória `balanco-ajuste-custo-medio-corrompido`.

**Saldo** — `relatorio_compra_venda_saldo_empresa.asp`, Analítica, agrupado por Marca, uma empresa
por vez, `controle_dif_periodo` + `exibe_estoque_transito` ligados, `somenteDisp` desligado,
`depositos` = só o depósito 1. Com `custo_medio_unitario` e `preco_venda_unitario` ligados a tabela
tem **13 colunas** (as 11 conhecidas + Custo Médio Unit. e Preço de Tabela Unit. nas posições 5 e 6),
por isso o parser lê pelo **cabeçalho**, e as três últimas colunas são sempre o bloco da loja
(vendas · trânsito · saldo). `sem_movimentacao` ligado = catálogo inteiro (necessário: produto sem
movimento no mês também precisa de saldo); desligado = só quem se moveu (usado nas janelas —
ausente da janela significa 0 entradas e 0 vendas). `saldo_positivo` é usado só no depósito 2.

⚠️ **O "Custo Médio Unit." é do GRUPO, não da loja** — o mesmo produto traz custo idêntico em L1 e
L4, enquanto o saldo difere. O custo por loja de verdade só sai do Histórico de Movimento.

**Janelas** — `estoque_janelas.mjs` quebra `[data do balanço → hoje]` em
`[data → fim do mês]` + meses cheios + `[1º do mês corrente → hoje]`. Só o último pedaço é
recoletado; o resto é imutável e fica em `dados_estoque/janelas.json` para sempre. Custo: ~45
execuções na primeira vez, ~6 por dia depois. Corte de idade do balanço: `DIAS_BALANCO` (padrão 120).

**Notas** — `relatorio_notas.asp?modulo=estoque`, CFOP `[E]` (todas as entradas), analítica, por
**data de lançamento**. O checkbox **`SomenteCanceladas`** entrega as canceladas. A cópia da NF
(link no número do documento) traz a coluna **`Fat. Conv. Utilizado`**; `-` = sem fator cadastrado.

**Custo real** — `relatorio_movimento_produto.asp`, coluna "Médio (Histórico) Unit." e o preço
realmente praticado (Valor Unit. da última saída de venda). É **por empresa da sessão**, então os
suspeitos são agrupados por loja e a empresa é trocada uma vez por loja.

## Correções de entendimento (19/08/2026)

- **`ValorProduto` do balanço é PREÇO DE VENDA, não custo.** Provado casando dezenas de itens com a
  coluna "Preço de Tabela Unit." de hoje: 413,16 · 316,20 · 1.947,90 · 33.660,00 batem exatamente.
  A leitura de 12/08 (que virou a memória `balanco-ajuste-custo-medio-corrompido`) tratou esse campo
  como custo — então os "103 produtos com custo médio corrompido" são, na verdade, **preços de venda
  errados**. O custo médio desses itens é sano (ex.: BASE MEDIA COBERT 08 TRACTA, custo R$ 0,01 e
  preço R$ 33.660,00). Muda a conclusão de negócio: o dano é em **preço de venda**, não em CMV.
- **Os depósitos 2, 3 e 4 estão vazios.** Consulta do ano inteiro, sem filtro, nas duas lojas:
  zero linhas. Todo o estoque vive no depósito 1 — ou seja, o vencido/devolvido **não** está sendo
  separado; continua misturado na prateleira. O bloco 4 do painel existe e fica vazio de propósito,
  explicando isso; ele começa a valer no dia em que a Transferência entre Depósitos passar a ser usada.

## Agendamento

`com.amgomes.estoque` (launchd, 22:05, só `open -a Claude`) + Task MCP `dashboard-estoque-update`
(cron `10 22 * * *`) chamando o `.sh`. ⚠️ launchd **nunca** chama o script direto: `~/Desktop` é
pasta protegida por TCC e o job falharia em silêncio.

## Registro de execuções

| Data | Resultado |
|---|---|
| 19/08/2026 | primeira execução completa — ver seção abaixo |
