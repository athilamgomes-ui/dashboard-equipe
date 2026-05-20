# Templates de Mensagens — Premiação Vendedoras

Disparo automatizado via Evolution API (a configurar). Cada mensagem é gerada toda **segunda-feira 9h** pelo agente `dashboard-premiacao-update` e enviada pra:
- **Grupo da loja:** versão objetiva, com prêmios individuais já calculados
- **Gerente (direct message):** roteiro pra reunião de segunda com a equipe

Linguagem: simples, sem termos técnicos, sem inglês, sem cálculos complicados.

---

## TEMPLATE 1 — GRUPO DA LOJA

Variáveis em `{{...}}`. Listar vendedoras em ordem do maior pro menor faturamento da semana.

```
👋 {{nome_loja}}
📅 Semana {{dt_ini_sem}} a {{dt_fim_sem}}

🏆 RANKING DA SEMANA
{{#each vendedoras_ranked}}
{{posicao}}º {{nome}} - R${{venda_semana}} (mês: R${{venda_mes}})
{{/each}}

📊 LOJA
Semana: R${{vendido_sem}} de R${{meta_sem}} ({{pct_sem}}% {{emoji_pct}})
Mês: R${{vendido_mes}} de R${{meta_mes}} ({{pct_mes}}%)
{{emoji_rank_loja}} Ficamos em {{rank_loja}}º lugar entre as lojas

🎯 MARCAS A
Semana: {{ma_pct_sem}}% | Mês: {{ma_pct_mes}}%
{{texto_bonus_ma}}

💰 PRÊMIO DESSA SEMANA: R${{premio_total}}
{{#each vendedoras_ranked}}
{{nome}}: R${{premio_individual}}
{{/each}}

🔥 ESSA SEMANA ({{dt_ini_prox_sem}} a {{dt_fim_prox_sem}})
Meta: R${{meta_prox_sem}}
Foco: {{foco_semana}}
{{marcas_destacadas}}

Vamos! 💪
```

Variáveis dinâmicas:
- `emoji_pct`: `✅` se ≥100%, `⚠️` se <70%, vazio entre
- `emoji_rank_loja`: `🥇`/`🥈`/`🥉`/`📍` conforme posição
- `texto_bonus_ma`: se <30% → "Faltam X pontos pra ganhar o bônus (prêmio sobe de R$Y pra R$Z)" · se ≥30% → "✨ Bateu 30%! Prêmio com bônus."
- `foco_semana`: extrair da sugestão `escopo:'loja'` mais alta prioridade da semana
- `marcas_destacadas`: 2-3 marcas da curva A relevantes pra essa loja

Notas:
- NUNCA mencionar outras lojas pelo nome ou número
- NUNCA usar "L1", "L3", "L4", "L5" — usar nome da loja
- Lucas (caixa) NÃO entra no ranking nem no rateio do prêmio (vendas dele contam só pro total da loja)

---

## TEMPLATE 2 — GERENTE (mensagem direta — base pra reunião de segunda)

```
🎯 {{nome_gerente}}, sua reunião de segunda
{{nome_loja}} - Semana {{dt_ini_sem}} a {{dt_fim_sem}}

📊 ONDE ESTAMOS
Mês: {{pct_mes}}% (R${{vendido_mes}} de R${{meta_mes}})
Faltam R${{falta_mes}} em {{dias_uteis_restantes}} dias = R${{venda_dia_necessaria}} por dia
Meta dessa semana: R${{meta_sem}}

🗣️ ROTEIRO PRA REUNIÃO COM A EQUIPE

1. CELEBRAR
{{#each destaques_positivos}}
- {{texto}}
{{/each}}

2. FOCO DA SEMANA
{{foco_principal}}
Por quê: {{justificativa_foco}}

3. COMO FAZER
{{#each acoes_concretas}}
- {{acao}}
{{/each}}

4. METAS DA EQUIPE PRA SEMANA
{{#each vendedoras}}
- {{nome}}: R${{meta_individual_sugerida}} ({{observacao}})
{{/each}}

📋 SUA AGENDA SEPARADA (fora da reunião)
{{#each agenda_gerente}}
{{dia}}: {{atividade}}
{{/each}}

💡 IMPORTANTE
{{observacoes_finais}}

{{secao_ajuste_meta_se_houver}}

Bom dia e boa reunião! Qualquer dúvida me chama.
```

Variáveis dinâmicas:
- `destaques_positivos`: top 3 conquistas da semana anterior (maior crescimento, melhor %marcas A, etc.)
- `foco_principal`: extrair da sugestão prioritária da loja (tipo `marca` ou `meta` ou `atendimento`)
- `acoes_concretas`: 3-5 bullets de como executar o foco (vir do campo `descricao` da sugestão)
- `meta_individual_sugerida`: meta semanal / n_vendedoras ativas, ajustada por histórico (maior pra top, menor pra novatas)
- `observacao` por vendedora: "manter o nível" / "subir um pouco, está aprendendo" / "precisa subir o volume" / "delegar, focar em liderar (gestante)" etc. Baseado em `VENDEDORAS_META`
- `agenda_gerente`: 5-6 itens com dias da semana (TER manhã, QUA tarde, QUI...) — ações específicas conforme diagnóstico
- `secao_ajuste_meta_se_houver`: se sábado anterior fechou com gap (calculado por `calcularAjusteMeta`), incluir bloco com sugestão de redistribuição pra aprovação do athila

Notas:
- Tom: caloroso mas direto
- Acomodar contextos especiais: gestante, nova, gerente — refletir no roteiro
- Se vendedora tem badge `caixa` (Lucas), não incluir nas metas individuais nem destacar volume de vendas

---

## QUANDO DISPARAR

| Mensagem | Quando | Pra quem |
|----------|--------|----------|
| Template 1 (grupo loja) | Segunda 9h, após gerar relatório | Grupo WhatsApp de cada loja |
| Template 2 (gerente) | Segunda 9h | DM da gerente (Tatiane/Ana Mira/Tanaia/Rosiene) |
| Disparo diário (a definir) | Ter-Sex 18h | A definir com athila |
| Fechamento sábado | Sáb 19h | A definir |
| Alertas críticos | Ad-hoc | Só pro athila (não pras gerentes) |

---

## STATUS DA INFRA

- Evolution API: NÃO INSTALADO ainda. Próximo passo após templates aprovados.
- Telefones das gerentes: NÃO CADASTRADOS. Pedir pro athila.
- IDs dos grupos WhatsApp das lojas: NÃO CADASTRADOS. Pedir pro athila.

---

## REGRAS CRÍTICAS

1. NUNCA enviar dados de outras lojas pra uma gerente/equipe (só a posição relativa)
2. NUNCA usar códigos L1/L3/L4/L5 — sempre nome da loja
3. NUNCA usar inglês ou termos técnicos (pool, ramp-up, shadow, etc.) — usar PT-BR claro
4. Mostrar valores em R$ com separador de milhar (R$8.513)
5. Arredondar prêmios individuais pra inteiro mais próximo
6. Soma dos prêmios individuais = prêmio total (não deixar centavos pra trás)
7. Se Microvix está deslogado ou skill falhou, NÃO enviar mensagens com dados incompletos — pedir intervenção do athila
