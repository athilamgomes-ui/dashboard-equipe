# Microvix — API REST para Etapa 1 (vendas por vendedora)

Documentado em 2026-05-22. Substitui dependência do Chrome MCP para a Etapa 1 do cron `dashboard-premiacao-update`.

## Endpoint

- **URL absoluta:** `https://linx.microvix.com.br/gestor_web/faturamento/relatorios/performance_por_vendedor/performance_por_vendedor_service.asp`
- **Método:** `POST`
- **Origem obrigatória:** página em `https://linx.microvix.com.br/gestor_web/...` (CORS bloqueia chamada externa). Para o cron, navegar pra `gestor_web/faturamento/relatorios/performance_por_vendedor/index.html` antes de chamar.

## Headers

```
Accept: application/json
Content-Type: multipart/form-data
Authorization: <token JWT>
```

⚠️ Apesar do `Content-Type` declarar `multipart/form-data`, o corpo enviado é **JSON puro** (sem boundary multipart). É um quirk do ASP — copiar o header literalmente.

`credentials: "include"` para passar cookies de sessão ASP (`ASPSESSIONID...`). Sem cookies a request 500.

## Body (JSON string)

```json
{
  "EmpresasSelecionadasParam": "4",
  "DataInicial": "18/05/2026",
  "DataFinal": "22/05/2026",
  "ConsiderarEntradaGarantiaNacional": true,
  "op": "Listar"
}
```

- `EmpresasSelecionadasParam`: string com IDs separados por vírgula (ex: `"1,3,4,10"` ou `"4"`). **Recomendação:** chamar 1 empresa por vez pra evitar contaminação cruzada (mesmo padrão usado na Etapa 2 do SKILL).
- Datas: formato `DD/MM/YYYY`.
- `ConsiderarEntradaGarantiaNacional`: `true` (padrão da UI quando o usuário clica "Filtrar" sem mudar nada).

## Resposta (200 OK)

Array de objetos, um por vendedor:

```json
[
  {
    "cod_vendedor": "120",
    "nome_vendedor": "JOSILENE DE SOUSA ALVES",
    "qtde_vendas": "42",
    "qtde_vendas_sem_devolucao": "42",
    "qtde_pecas": "149",
    "vlr_custo_medio_epoca": "1489,17654144764",
    "vlr_preco_liquido_item": "3871,86000537872",
    "vlr_cmv": "38,4615285516238",
    "vlr_vendas": "3871,86000537872",
    "vlr_ipo": "137",
    "Empresa": "4",
    "NomeEmpresa": "MISSBELEZA ALTAMIRA"
  }
]
```

**Campo de interesse:** `vlr_vendas` = Venda Líquida (R$). Vírgula como decimal — fazer `parseFloat(v.replace(",", "."))`.

## Autenticação

- Token JWT em `localStorage.getItem("api_token_lma")` (NÃO `token_api`).
- Mesmo token JWT usado por toda a stack `ApiRoutes` (Suprimentos etc.).
- Validade: ~24h (claim `exp` no payload).
- Para renovar: navegar pra `https://linx.microvix.com.br/v4/home/index.asp` e voltar pra `gestor_web/...`; o framework gera novo `api_token_lma` automaticamente desde que a sessão ASP esteja ativa.

## Comportamento de concorrência

- Promise.all paralelo (4-12 chamadas simultâneas) **trava o servidor** (sessão ASP é single-threaded). Não usar paralelismo agressivo.
- Serializado (4 empresas × 3 semanas = 12 chamadas): ~60s no total (~5-6s por chamada; L5 caiu pra ~500ms quando cache aquecido).
- Paralelismo seguro: até 2 simultâneas. Não testado >2.
- **Recomendado para o cron:** rodar sequencialmente. 60s é aceitável.

## Validação contra UI (22/05/2026)

| Loja | Semana | Vendedora    | API valor | Valor que o painel mostra |
|------|--------|--------------|-----------|---------------------------|
| L4   | S2     | Josilene     | 5628.13   | 5628 ✓                    |
| L4   | S2     | Bruna F.     | 11770.31  | 11770 ✓                   |
| L4   | S2     | Tanaia       | 4768.81   | 4769 ✓                    |
| L4   | S3     | Bruna F.     | 5824.72   | bate com Etapa 1 anterior ✓ |

## Quirks descobertos

- `Content-Type` deve ser `multipart/form-data` (sem boundary); ASP usa `Request.BinaryRead` e parser custom de JSON. `application/json` retorna `ASP 0206 "Cannot call BinaryRead after using Request.Form"`. `application/json; charset=utf-8` idem.
- Sem o header `Authorization`, retorna 500 com `Exception in JSON.asp line 358`.
- Token errado/expirado: retorna HTTP 401 ou 500 conforme stage que falhar.
- Resposta inclui vendedores fantasma ("VENDEDOR EXTERNO", "VENDEDOR PADRAO", "Lucas") — filtrar pelos nomes em `LOJAS_BASE[].vendedoras` antes de gravar em `DADOS`.
- Acentos em respostas vêm com encoding Latin-1; ler com `await r.json()` e o browser converte. Em Node puro, usar `TextDecoder('latin1')`.

## Vantagens vs Chrome MCP

- Não precisa de aprovação de domínio interativa.
- ~60s vs ~3-5 min de UI scraping.
- Resposta JSON estável vs HTML parsing frágil.
- Mesma origem do erpadmin — single source of truth.

## Limitações

- Ainda depende de uma aba aberta em `linx.microvix.com.br/gestor_web/*` (CORS). O cron tem que navegar uma vez antes de chamar.
- Token expira em 24h. Cron rodando 4x/dia → renovação raramente necessária, mas script deve detectar HTTP 401 e re-navegar.

## Login programático (cron headless)

Investigado em 2026-05-22. Microvix migrou a tela de login pra SPA Vue em `https://erp.microvix.com.br/`. Quando `linx.microvix.com.br/v4/home/index.asp` é acessado sem cookie de sessão, faz redirect 30x para `https://erp.microvix.com.br/` (login SPA).

### Form de login

- **URL final:** `https://erp.microvix.com.br/` (Vue SPA, sem `<form>` HTML real — submit via JS)
- **Campo usuário:** `<input id="f_login" name="f_login" type="text" maxlength="100">`
- **Campo senha:** `<input id="f_senha" name="f_senha" type="password">`
- **Botão submit:** `<button id="lmxta-login-btn-autenticar" type="submit">Entrar</button>`
- **Sem campo de empresa/filial** na tela inicial — empresa é selecionada DEPOIS, dentro do v4/home.
- **Sem CSRF token visível**, sem hidden inputs (validado: só `f_login` e `f_senha` no DOM).
- **Pós-submit:** redireciona para `https://linx.microvix.com.br/v4/home/index.asp` (sessão ASP estabelecida via cookies de resposta).

### Estratégia adotada

Login via Playwright (não REST/`fetch`) — preenche `#f_login` + `#f_senha`, clica `#lmxta-login-btn-autenticar`, espera o redirect para `v4/home/index.asp`. Credenciais lidas do Keychain do macOS no momento do uso, nunca em arquivo.

### Comandos Keychain

```bash
# Salvar/atualizar (uma vez):
security add-generic-password -a microvix-cron -s amgomes-microvix      -w '<senha>'   -U
security add-generic-password -a microvix-cron -s amgomes-microvix-user -w '<usuario>' -U

# Ler (em runtime do cron, via execSync):
security find-generic-password -a microvix-cron -s amgomes-microvix      -w
security find-generic-password -a microvix-cron -s amgomes-microvix-user -w

# Remover:
security delete-generic-password -a microvix-cron -s amgomes-microvix
security delete-generic-password -a microvix-cron -s amgomes-microvix-user
```

- `-a` = account (sempre `microvix-cron`)
- `-s` = service (separa senha e usuário em entradas distintas)
- `-w` na escrita = password value; `-w` na leitura = só imprime a senha (sem metadados)
- `-U` = update se já existe (idempotente)
