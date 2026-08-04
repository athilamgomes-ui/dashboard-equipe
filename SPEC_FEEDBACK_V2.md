# Spec — Redesenho do ciclo de Feedback/Avaliação da Premiação (04/08/2026)

Decisões do Athila nesta sessão. Executar em 3 fases. Fonte da verdade = Supabase
(tabelas `feedbacks`, `feedback_retornos`, `sugestoes_avaliacoes`, `sugestoes_overrides`).
Regra de ouro: `build_premiacao.mjs` é o único escritor do HTML em produção; sugestões/
avaliações vivem nos dois HTMLs e são sincronizadas pelo pipeline. Testar cada fase.

## Contexto do que JÁ existe (não rebuildar)
- Vendedora já dá feedback de FIM de período: `marcarFeedback(id, 'apliquei'|'tentei'|'nao_consegui')`
  + comentário → tabela `feedbacks` (loja.html ~3610-3623). Bloco "⏰ Aguardando sua
  avaliação" via `getMinhasPendentesDeFeedback()` (loja.html ~3650) cobra até responder.
- Retorno da gestão (avaliação) → `feedback_retornos`, exibido em "Meu Progresso"
  (loja.html renderResultadoSemanaPassadaApp ~3530 e retornoBanner ~3590). Aspas já removidas.
- Motor automático: `calcAutoMetrics` + `gerarMensagemFeedback` (painel ~3062). Fila
  "Aguardando avaliação" + overrides (aprovar/editar mensagem) já existem no painel.
- `prazo`: curto=1 semana · medio=1 mês · longo=3 meses (loja.html prazoTextos ~3602).

## FASE 1 — item 1b (vendedora: aceite no início + resultado no fim + remover não-respondidas)
Combinação: opção 2 no INÍCIO, opção 1 no FIM.
1. **Aceite no início** (NOVO): quando a recomendação está ativa (período corrente, status
   aprovada), a vendedora reconhece — botão "👍 Entendi, vou focar" + comentário opcional.
   Gravar `aceite` (timestamp) no registro de `feedbacks` (novo campo, não quebra o schema:
   coluna nova opcional). UI em `renderSugCard` ANTES dos botões de resultado.
2. **Resultado no fim** (JÁ EXISTE): manter apliquei/tentei/nao_consegui no fim do período.
3. **Remover não-respondidas**: recomendação de período JÁ ENCERRADO sem NENHUMA resposta
   (nem aceite no início, nem resultado no fim) → SOME do app da vendedora (parar de cobrar
   pra sempre). Hoje `getMinhasPendentesDeFeedback` cobra eternamente — mudar: cobra só
   dentro de uma janela (ex.: até o fim do período + 7 dias); depois remove e marca
   `nao_respondeu` pro registro de análise.
4. **Dados só pro Athila**: no painel, uma visão de ENGAJAMENTO — quem aceitou / quem
   reportou resultado / quem ignorou, por vendedora/loja/semana. Alimenta a aba Análise.

Regra de tempo (definir "início/fim" do período a partir do id da semana da sugestão +
prazo): curto = a própria semana; medio = 4 semanas; longo = 12 semanas.

## FASE 2 — item 2 (longa duração: análises parciais semanais, tudo aprovado pelo Athila)
- Motor gera, para sugestões de prazo medio/longo, uma **análise parcial a cada semana**
  do período (acompanhamento, NÃO fecha) + a **análise final** no fim do período.
- TODAS as mensagens (parciais + final) entram na **fila de aprovação do painel** — Athila
  aprova/edita ANTES de ir pra vendedora (mesmo mecanismo de override que já existe:
  `_alvoEditavelFrag`/`aprovarSugestao`/`sugestoes_overrides` + `feedback_retornos`).
- Só depois de aprovada a mensagem aparece pra vendedora (parcial durante o período; final
  no encerramento). A avaliação só FECHA no fim do período determinado.
- Motor pode gerar todas; nada vai pra vendedora sem o aval do Athila.

## FASE 3 — item 3 (aba Análise: resultado real + quem evolui, layout limpo)
Trocar o "score funcionou/indiferente" (subjetivo) por:
- **Resultado real (ERP)**: por recomendação com meta mensurável (vendas_individuais,
  venda_marca, marcas_a, atingir_meta, ticket_medio), mostrar KPI ANTES → DEPOIS + variação
  %, usando o dado real já coletado (DADOS/VENDAS_HIST/nfes). Reaproveitar `calcAutoMetrics`.
- **Quem evolui**: por vendedora/loja, tendência mês a mês (venda, %MA, ticket) — linguagem
  simples, menos gráfico técnico.
- Layout mais limpo e direto; termos de negócio, não jargão. Incluir a visão de engajamento
  da Fase 1 (quem responde/ignora).

## Ordem de execução
Fase 1 → Fase 2 → Fase 3. Cada fase: build + testar (node --check no pipeline; abrir app)
+ commit/push imediato. Metas/regras vigentes não mudam. Supabase upsert quando tocar dado.
