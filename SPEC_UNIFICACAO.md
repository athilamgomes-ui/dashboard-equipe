# SPEC — Unificação Precificação × Estoque (A.M. Gomes)

> Escrito em 20/08/2026, ANTES do código, no mesmo espírito do `SPEC_ESTOQUE.md`: é a fonte da verdade
> do desenho; vira runbook quando estiver rodando. Leia junto com `RUNBOOK_PRECIFICACAO.md`,
> `SPEC_ESTOQUE.md` e `RUNBOOK_ESTOQUE.md`.

## 0. Invariantes herdados (não negociáveis)

- **O agente NUNCA escreve preço no ERP.** A unificação gera **arquivo** (`codigo;preço` ou `EAN;preço`);
  quem importa é o usuário (Lista de Preços > Ajuste de Preços). Vale para a nota-fantasma igual vale
  para a precificação normal. (A contagem de saldo do estoque PODE escrever — saldo é objetivo; preço é
  decisão. Essa assimetria é proposital e permanece.)
- Coleta = Playwright headless, perfil `~/.claude/microvix-profile` compartilhado. **Serializar** com o
  estoque (mesmo lock lógico) — nunca os dois no perfil ao mesmo tempo.
- Lojas: L1=emp1 · L3=emp3 · L4=emp4 · L5=emp10.

## 1. O problema e a ideia central

Precificação e estoque são **o mesmo problema por dois lados**:

| | Precificação | Estoque (bloco 5/6) |
|---|---|---|
| Olha para | **NF nova** que acabou de entrar | **catálogo inteiro** parado |
| Direção | pra frente (precificar o que chega) | pra trás (achar o que já está errado) |
| Cobre | ~3 dias de entradas | ~56 mil produtos × 4 lojas |

O buraco: o bloco 5 do estoque acha os preços errados dos produtos **antigos**, mas a precificação
**não consegue corrigi-los** porque só mostra NF recente — e esses produtos não têm NF. Hoje o conserto
sai **na mão** (arquivo `.txt` gerado em sessão).

**Ideia central (do Athila):** em vez de duplicar o motor de preço dentro do estoque, **injetar uma
"NF sintética" (nota-fantasma)** de produtos-a-consertar no pipeline da precificação. Ela aparece na tela
da precificação como uma entrada, com o custo REAL, e reusa **toda** a máquina que já existe: modelo de
markup (custo → ST +21% → margem por marca/curva → `arredonda90`), match do "preço atual no ERP" por
código, geração do `.txt` (EAN ou código interno, dedup) e a regra inegociável. **Zero UX nova; zero
lógica duplicada.**

## 2. As três pontes estoque ↔ precificação

1. **Custo real compartilhado.** A precificação usa "custo cheio da NF"; o estoque tem "custo médio"
   (corrompido em massa — 10.886 produtos com custo < R$1) e o **"custo real (histórico)"** do
   `relatorio_movimento_produto.asp` (a verdade). A nota-fantasma carrega o **custo real**; a
   precificação passa a poder usar essa fonte quando o custo da NF/médio é suspeito.
2. **Bloco 5 (Preço × custo) → nota-fantasma.** A lista `precos` do estoque (tipos `abaixo_custo`,
   `preco_absurdo`) já é a fila de trabalho; ela vira a nota-fantasma.
3. **Pacote × unidade (bloco 6) → custo.** ⚠️ `UtilizaFatorConversaoFornecedor = FALSE` no ERP — o fator
   está **desligado globalmente**, não há fator em produto nenhum. Então pacote comprado / unidade vendida
   entra errado em massa. O custo correto por unidade = custo do pacote ÷ N (N do descritivo `C/12`, `DZ`,
   `PCT`, ou de `qTrib/qCom` do XML). A nota-fantasma **já entrega o custo dividido pela unidade certa**.

## 3. Mecanismo da nota-fantasma

### 3.1 Arquivo `precificacao_nfs_sinteticas.json` (novo, no repo)

Escrito pelo lado do estoque; lido pelo coletor da precificação a cada coleta. Formato:

```json
[
  {
    "loja": "L4",
    "numero": "FIX-L4-0001",
    "origem": "estoque/bloco5",
    "motivo": "abaixo_custo",
    "gerado_em": "2026-08-20",
    "itens": [
      { "cprod": "5519", "ean": "", "descricao": "PO ADSTRINGENTE SANTA CLARA 20G",
        "custo_unit_cheio": 42.88, "marca": "Santa Clara",
        "st": false, "credito_icms_pct": 0, "ncm": "33049910",
        "codigo_erp": "5519", "motivo_item": "abaixo_custo", "preco_errado": 0.92 }
    ]
  }
]
```

- **`numero`** começa com `FIX-` → o coletor reconhece como sintética.
- **`custo_unit_cheio`** = custo REAL por unidade (histórico; já dividido pelo fator de pacote quando é o
  caso). É a única fonte de custo da fantasma — não há XML pra reprocessar.
- **`st`, `credito_icms_pct`, `ncm`** vêm prontos (o coletor NÃO baixa XML de nota sintética). Precedência
  do `st`: (a) `st_pa_ncm.json` pelo NCM se houver; (b) o que o estoque informar; (c) default `false`.
- **`codigo_erp`/`ean`** = identidade pro `.txt` e pro match do preço atual (o conserto por código de
  10/08 casa a fantasma com o relatório de preços).

### 3.2 Como o coletor mescla (`coleta_precificacao.mjs`)

Depois de montar `lojas[]` das NFes reais e ANTES da fase de preço:
1. lê `precificacao_nfs_sinteticas.json`;
2. para cada NF sintética, monta os itens no MESMO shape das reais (`custo_cheio_total`, `custo_unit_cheio`,
   `st`, `credito_icms_pct`, `preco_manual`, etc.), marca `sintetica:true` e `motivo`;
3. **pula** a fase de XML por item (custo/ST já vêm prontos) e entra direto na fase de preço (match do
   preço atual por EAN/código + cálculo do sugerido);
4. **bypassa a janela** (`DIAS_INICIO`/elegibilidade) — nota-fantasma sempre aparece;
5. **não entra no state** `precificacao_lancadas.json` (não tem chave44). Fica na tela até ser removida do
   JSON (ou marcada "✅ concluída" pelo mesmo botão, que passa a apagar a linha do JSON).

### 3.3 Na tela (`precificacao.html`)

- Selo **"⚙️ correção de estoque"** no card (como o badge de marca não mapeada), com o `motivo`
  (sangria / preço absurdo / pacote×unidade).
- Colunas já existentes servem: **Preço atual ERP** (o errado) ao lado do **Sugerido** (o certo).
- Botão **"📤 Arquivo p/ ERP"** já gera o `.txt` — para Santa Clara / bijuteria sem GTIN confiável, sai
  por **código interno** (marcar "Código" na importação), como combinado.

## 4. De onde vem cada número (nota-fantasma)

| número | fonte |
|---|---|
| custo real por unidade | `custos.json` do estoque (`coleta_estoque_custos.mjs` → "Médio (Histórico) Unit.") ÷ N do pacote quando `fatorConversaoFornecedor=false` |
| preço errado atual | `pre` do snapshot de estoque / match por código no relatório de preços |
| ST / crédito ICMS | `st_pa_ncm.json` (NCM) — mesma regra da precificação |
| margem | `precificacao_params.json` (padrão 15%) + margem por marca/curva |
| preço sugerido | modelo da precificação (`arredonda90`) — sem alteração |

## 5. Modelo de dados compartilhado

Meta de médio prazo: um `produtos_master` por `(loja, código)` — JSON derivado ou tabela Supabase — com
`desc, marca, curva, ncm, st, fator_pacote, saldo, vendas, custo_medio, custo_real, custo_nf, preco_atual,
preco_sugerido, flags[]`. Os dois painéis leem/escrevem dele. A nota-fantasma é o **primeiro consumidor**
desse modelo (não precisa do master completo pra existir — só de `custo_real` + identidade + ST).

## 6. Fluxo ponta a ponta

1. Estoque roda (22:10). Bloco 5 classifica `abaixo_custo` / `preco_absurdo`; `coleta_estoque_custos` já
   trouxe o custo real dos suspeitos.
2. Bridge (`estoque_para_precificacao.mjs`, ou passo do build) escreve `precificacao_nfs_sinteticas.json`
   com uma NF `FIX-<loja>-<n>` por loja, itens = os tipos acionáveis, custo real ÷ fator.
3. Próxima coleta da precificação mescla as fantasmas → tela mostra com selo.
4. Equipe revisa margem, baixa o `.txt`, importa. Preço corrigido.
5. Marcar "concluída" remove do JSON; no próximo estoque, se o preço já bater, sai da lista sozinho.

**Prioridade da fila:** `abaixo_custo` (sangria — vende e sangra) → `preco_absurdo` (encalha) →
`pacote_unidade`.

## 7. Melhorias no estoque que este SPEC assume

- **Rankear suspeito por preço absoluto, não só razão** — a razão em cima do custo médio corrompido gera
  ~45 mil falsos; o preço absoluto (< R$1 que vende; > R$1.000) é o sinal limpo (varredura de 19/08).
- **Custo real além do "top N"** — cobrir pelo menos toda a fila da sangria, senão a nota-fantasma sai com
  custo médio corrompido e sugere preço errado.
- **Marcar o `fator_pacote` por produto** (do descritivo/`qTrib`) — enquanto `fatorConversaoFornecedor`
  estiver `false` no ERP, é a única forma de o custo por unidade sair certo.

## 8. Casos de borda

- **Produto sem GTIN** (bijuteria, Santa Clara) → `.txt` por código interno; marcar "Código".
- **Custo real ausente** (histórico não coletado) → item entra com selo "custo a confirmar" e NÃO gera
  linha no `.txt` (não sugerir preço em cima de custo corrompido).
- **Mesmo produto em L1 e L4** → uma linha por loja (preços diferentes por custo fixo/loja) — uma
  fantasma por loja, um `.txt` por loja.
- **`pacote_unidade`** → precisa do N certo; se ambíguo, entra como "custo a confirmar", não some nem
  precifica errado.

## 9. Cadência e lock

- Estoque 22:10 (full domingo). Bridge roda **depois** do estoque, no mesmo job. A precificação (seg–sáb
  08:00–19:45) mescla a fantasma na coleta seguinte. Nunca os dois no perfil ao mesmo tempo.

## 10. Fica de fora / decisões pendentes

- **Não** auto-escrever preço (regra inegociável). A fantasma só chega até o `.txt`.
- **Ligar o fator de conversão no ERP** (`UtilizaFatorConversaoFornecedor`) é decisão do usuário/Linx —
  resolveria o pacote×unidade na raiz; até lá, o `fator_pacote` do estoque é o paliativo.
- `produtos_master` completo (seção 5) é meta de médio prazo; a nota-fantasma não depende dele pra v1.
- Registro de execuções: a preencher a partir da 1ª nota-fantasma real.
