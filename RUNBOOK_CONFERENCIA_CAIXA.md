# RUNBOOK — Conferência de Caixa

Criado em 29/07/2026. **Leia antes de mexer neste dashboard.**

## O que é

Compara, dia a dia e por loja, **o que o ERP registrou** nas vendas contra **o que a loja
declarou ao fechar o caixa**. Responde quatro perguntas:

1. **Conferência** — faltou ou sobrou dinheiro no caixa? (o coração do painel)
2. **Formas de pagamento** — quanto entrou em dinheiro, PIX, cartão, crediário; detalhe por bandeira.
3. **Sangria e saldo** — retiradas, suprimentos e saldo em dinheiro do caixa.
4. **Cartão → banco** — quanto de cartão foi vendido × quanto ainda está para cair, por administradora.

## Um comando

```bash
bash /Users/elkgomes/Desktop/claude/dashboard-equipe/atualizar_conferencia_caixa.sh
```

Exit: `0` ok · `10` coleta falhou (preserva o dashboard anterior) · `20` build falhou (restaura)
· `30` lock. `build_conferencia_caixa.mjs` é o **ÚNICO escritor** de `conferencia_caixa.html` —
o agente nunca edita esse HTML na mão.

Variantes da coleta:
```bash
DIAS=90 node scripts/coleta_conferencia_caixa.mjs        # janela maior
FORCE_FULL=1 node scripts/coleta_conferencia_caixa.mjs   # ignora o cache e recoleta tudo
ONLY_EMP=1 node scripts/coleta_conferencia_caixa.mjs     # uma loja só (debug)
```

## 🔒 O painel é CIFRADO — e tem que continuar sendo

O repo `dashboard-equipe` é **público**, e este painel mostra falta de dinheiro com o nome do
operador do caixa. Por isso o JSON de dados vai **cifrado** (AES-256-GCM + PBKDF2 200k) dentro do
HTML e só é decifrado no navegador depois da senha — mesmo esquema do Painel Financeiro.

- Senha no Keychain: conta `caixa-web`, serviço `amgomes-caixa` (criada com a mesma senha do
  painel Financeiro, mas em entrada própria — dá pra rotacionar uma sem mexer na outra).
  Fallback: se `amgomes-caixa` não existir, o build usa `amgomes-financeiro`.
- Sem senha o build **aborta** (exit 20). Nunca "resolver" isso publicando em texto puro.
- `conferencia_caixa_raw.json` (dado cru, em claro) está no `.gitignore` — fica **só local**.
- O `.sh` tem duas travas de sanidade antes do push: exige `"iters"` no HTML (prova de cifragem)
  e rejeita nome de operador em texto puro.

Rotacionar a senha:
```bash
security add-generic-password -a caixa-web -s amgomes-caixa -w 'NOVA_SENHA' -U
```

## Fonte no ERP (Microvix)

| O quê | Tela | Endereço |
|---|---|---|
| Conferência (calculado × informado) | Faturamento › Loja › Relatórios › **Conferência de Caixas** | `faturamento/relatorio_conferencia_caixa.asp` |
| Detalhe por bandeira/plano | Faturamento › Relatórios › **Faturamento por Planos** | `faturamento/relat_fat_planos.asp` |
| Recebível de cartão | Adm./Financeiro › Contas a Receber › **Faturas a Receber** | `financeiro/relatorio_faturas_periodo.asp?tipolanc=receber&filtro_adm_cartao=S` |

Toda coleta é **Playwright headless** (`microvix_auth.mjs`, Keychain `microvix-cron`).
Chrome MCP no Microvix continua PROIBIDO — ver REGRA Nº 1 do CLAUDE.md.

⚠️ A tela de Conferência de Caixas aceita **1 empresa + 1 dia por requisição** — não tem filtro de
período nem multi-empresa. Por isso a coleta é dia×loja e usa cache incremental
(`conferencia_caixa_raw.json`): dias com mais de 3 dias de idade não são recoletados.

### Por que a coleta usa POST direto (e não navegação)

Recarregar `relatorio_conferencia_caixa.asp` e submeter o form a cada consulta custava **~108s por
item** — 45 dias × 4 lojas daria mais de 2 horas. O form posta em
`faturamento/listagem_conferencia_caixa.asp`; o coletor serializa o form **uma vez**
(`prepararFormBase`) e depois manda um `fetch` POST por item (`coletarDiaRapido`): **~11s por item**,
10x mais rápido. Primeira execução (180 itens) ≈ 30 min; as diárias fazem ~16 itens ≈ 3 min.
Validado em 29/07 contra o método antigo: resultados idênticos nas 4 lojas.

⚠️ O HTML da resposta é injetado num container **fora da tela** (`position:absolute;left:-99999px`),
**nunca `display:none`** — com `display:none` o `innerText` degrada para `textContent` e some com os
`\t` que separam as colunas da tabela, quebrando o parser inteiro.

Se `prepararFormBase` falhar, o coletor cai sozinho no caminho lento por navegação (`coletarDia`).

⚠️ **Encoding:** o Microvix serve ASP em **windows-1252** e não manda charset no header. `r.text()`
assume UTF-8 e "Cartão" vira "Cart�o" — aí os regexes de Cartão, Crediário, Convênio, Depósito e
Devoluções param de casar e essas formas **somem sem erro nenhum** (Dinheiro e PIX, sem acento,
continuam funcionando, então o bug fica invisível). Por isso `coletarDiaRapido` lê
`arrayBuffer()` + `TextDecoder`, e `interpretarResposta` aborta se achar `�` no texto.
Aconteceu em 29/07: o painel publicou Cartão R$ 0 enquanto o relatório de planos mostrava
R$ 201 mil no mesmo período. Navegação normal não sofre disso (o browser lê o `<meta charset>`).

## ⚠️ Regras de negócio que já custaram caro

- **Consolidar por LOJA, nunca por operador.** Em Itaituba (L3) as vendas saem no usuário
  `admitb` e o fechamento é lançado no `caixaitb`. Olhando por operador, aparece falta de 100%
  num e sobra de 100% no outro — falso alarme puro. A consolidação é feita no nosso parser
  (`parseConferencia`), somando todos os operadores da loja no dia. O checkbox
  "Listar conferência consolidada" do ERP **não faz isso** (testado em 29/07: continua um bloco
  por usuário).
- **"Não fechado" ≠ falta de dinheiro.** Se ninguém lançou o fechamento, o Valor Informado vem
  zerado e a diferença fica igual ao total do dia. O painel marca esses dias como
  `não fechado` (âmbar) e os exclui do cálculo de falta/sobra. Nunca tratar como desvio.
- **Status possíveis:** `sem_movimento` (domingo/feriado) · `nao_fechado` · `ok` · `divergente`.
- Diferença = **informado − calculado**. Negativo = faltou dinheiro no caixa.
- **Recebível de cartão:** o `RUNBOOK_FINANCEIRO` diz que "não existe contas a receber" porque o
  grupo vende tudo à vista — isso vale para o *cliente*, não para a *adquirente*. Cada parcela de
  cartão vira um recebível da administradora (STONE etc.) com data de vencimento; em 29/07 havia
  R$ 360.862,57 em aberto para os 3 meses seguintes. É daí que sai a aba "Cartão → banco".
  O parse pega as linhas `Subtotal do grupo X em reais` (soma confere com o "Total Geral a
  Receber" do próprio relatório).

## Achados da primeira coleta (27/07/2026)

- L1 −R$ 61,60 e L4 −R$ 128,65 em dinheiro no mesmo dia; cartão e PIX bateram exatos.
  Padrão típico de erro de troco/sangria, não de cartão.
- L1 não fechou o caixa em 28/07 (e 26/07 é domingo).
- Saldo final em dinheiro negativo aparece com frequência (L1 −39,60; L3 −218,40; L4 −38,85):
  sangria lançada a maior ou troco não registrado.

## Agendamento

Task MCP `dashboard-conferencia-caixa-update`, 1x/dia às 20:10 (depois do fechamento das lojas e
fora da janela do financeiro das 19:55). O launchd `com.amgomes.dashboard` já acorda o Claude
às 18:30; a task roda quando o app está aberto.
**Nunca** criar launchd chamando `/bin/bash` num script do `~/Desktop` — TCC bloqueia
(ver memória `launchd_tcc_desktop_bash`).

## Cache do GitHub Pages

`max-age=600`. Depois de todo deploy, entregar a URL com `?v=<número novo>` e citar o selo
"Coleta do ERP" visível no topo do painel. Reinstalar PWA nunca deve ser necessário.
