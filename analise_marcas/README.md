# Análise de margem real por marca (ago/2026)

Pasta de trabalho DURÁVEL — o scratchpad da sessão é apagado sem aviso e já levou
duas coletas embora. Tudo que custa tempo de ERP fica aqui.

## Regras fiscais (definidas pelo Athila, 25/08/2026)
1. NCM na tabela `st_pa_ncm.json` (Convênio 142/2018) -> É ST: custo +21%, imposto de saída 0%
2. NCM fora da tabela -> tributado integralmente: custo cheio, imposto de saída 19%
3. Fornecedor do Pará -> NUNCA tem ST, mesmo com NCM da tabela (custo cheio + 19%)

## Fórmula
margem_liquida = 1 - (custo_efetivo / preco_realizado) - cartao 2,7% - comissao 1%
                 - outros 2% - custo_fixo_loja - imposto_saida
custo_fixo: L1 0,209 | L4 0,25 | L3 0,30 | L5 0,30

## Fontes e seus defeitos
- `Custo Últ. Compra` (relatorio_prod_vendidos): preço real da nota, MAS vem por EMBALAGEM
  (pote c/250) e é zero onde não houve compra na janela.
- `Custo Médio Época` (mesmo relatório): por unidade, MAS envenenado pelos balanços de junho.
- Reconciliação: razão entre as duas ~1 -> confia; razão = fator redondo (24,100,250) -> embalagem,
  usa o médio; razão < 0,7 -> médio inflado, usa o da nota; resto -> descarta.

## Armadilhas do ERP (custaram horas)
- O relatório tem DUAS telas: botão **"Prosseguir >"** (onclick `diasFaturamento()`) leva para
  `listagem_relat_prod_vend3.asp`, que processa assíncrono. "Gerar Relatório"/`submit_form` NÃO funcionam.
- Aplicar visão salva (`Form1_SubmitVisao`) CONTAMINA a sessão do servidor: o filtro de marca
  daquela visão continua valendo nas execuções seguintes e limpar o DOM não desfaz.
- Checkbox "Classificação ICMS" adiciona a coluna mas ela vem VAZIA em 100% dos produtos.
- O cron `com.amgomes.precificacao` roda 15/15min (seg-sáb 8h-19h45) no MESMO perfil Playwright.
  Coleta longa em horário comercial é atropelada -> usar perfil `~/.claude/microvix-analise`.
