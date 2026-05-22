# scripts/ — infra headless para o cron dashboard-premiacao-update

Atualizado 2026-05-22. Substitui dependência do Chrome MCP na Etapa 1 do cron por **Playwright headless** com perfil Chromium dedicado.

## Por que existe

O Chrome MCP exigia aprovação manual do domínio `linx.microvix.com.br` no painel da extensão **a cada sessão automatizada**. Aprovação não persistia entre cron runs → cron quebrava silenciosamente (confirmado 22/05/2026, runs das 12h e 15h abortados).

Playwright headless usa um perfil Chromium próprio, isolado do Chrome do Athila. Sessão Microvix logada fica salva em `~/.claude/microvix-profile/` e dura **semanas** (cookie ASP persistente). Token `api_token_lma` (~24h) é regenerado automaticamente pelo framework Microvix ao navegar.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `fetch_vendas_microvix.js` | Função browser-side `window.fetchVendasMicrovix(semanas)` que chama a API REST do Microvix e devolve `{L1,L3,L4,L5}{Sx}{nome:R$}`. Injetada via `page.addScriptTag()` nos dois scripts abaixo. |
| `microvix_auth.mjs` | Helpers compartilhados: lê credenciais do Keychain do macOS, função `garantirSessao(page)` que faz auto-login se a sessão expirou. |
| `setup_credenciais.mjs` | **Roda 1x (e quando a senha mudar).** Pede usuário/senha no terminal, salva no Keychain do macOS (`security add-generic-password`), valida fazendo login. NUNCA escreve senha em arquivo. |
| `setup_validar_sessao.mjs` | **Opcional.** Roda login headless usando as creds do Keychain e confirma que o token foi gerado. Substitui o antigo `setup_microvix_login.mjs` (que abria janela visível). |
| `cron_etapa1_vendas.mjs` | **Script que o cron chama.** Launch Chromium headless com o perfil, chama `garantirSessao` (auto-login se necessário), executa fetchVendasMicrovix, escreve JSON no stdout. |
| `package.json` / `node_modules/` | Dependência Playwright (instalada localmente, ~92 MB chromium-headless-shell). |

## Setup inicial (Athila, 2 comandos uma vez)

```bash
cd /Users/elkgomes/Desktop/claude/dashboard-equipe/scripts

# 1) Salvar credenciais no Keychain do macOS
node setup_credenciais.mjs
# Prompts:
#   Usuário Microvix: <digite>
#   Senha Microvix:   <digite — fica mascarada>
# Faz login de teste em modo headless. Se ok, salva. Se a senha estiver errada,
# remove as entradas do Keychain e aborta.

# 2) (opcional) Validar que o perfil persistente também funciona com auto-login
node setup_validar_sessao.mjs
```

Credenciais ficam em entradas Keychain:
- `account=microvix-cron service=amgomes-microvix` → senha
- `account=microvix-cron service=amgomes-microvix-user` → usuário

Para inspecionar/remover manualmente:
```bash
security find-generic-password -a microvix-cron -s amgomes-microvix      # metadados (sem senha)
security find-generic-password -a microvix-cron -s amgomes-microvix -w   # imprime a senha
security delete-generic-password -a microvix-cron -s amgomes-microvix
security delete-generic-password -a microvix-cron -s amgomes-microvix-user
```

A partir daí o cron roda 100% headless. Se a sessão ASP expirar, ele faz login automaticamente usando as creds do Keychain. A única razão pra rodar `setup_credenciais.mjs` de novo é se a senha do Microvix mudar.

## Como o cron chama

```bash
node /Users/elkgomes/Desktop/claude/dashboard-equipe/scripts/cron_etapa1_vendas.mjs \
  '[{"id":"S1","di":"01/05/2026","df":"09/05/2026"},
    {"id":"S2","di":"10/05/2026","df":"16/05/2026"},
    {"id":"S3","di":"17/05/2026","df":"23/05/2026"}]'
```

- **STDOUT:** `{"L1":{"S1":{"Tatiane":14328,...},"S2":{...},...},"L3":{...},"L4":{...},"L5":{...}}` (JSON puro, formato pronto pra gravar em `DADOS[<mes>][Lx].vendas[Sx]`).
- **STDERR:** linhas `[cron_etapa1] ...` com progresso. Ignorar no parse.
- **Exit codes:**
  - `0` → sucesso.
  - `1` → falha genérica (rede, exception inesperada). Ver stderr.
  - `2` → **credenciais inválidas/ausentes no Keychain** (senha mudou, conta bloqueada). Rodar `setup_credenciais.mjs`.
  - `3` → argumento inválido (JSON malformado, semanas vazias).

## Debug: o que pode dar errado

| Sintoma | Causa provável | Como recuperar |
|---|---|---|
| Exit 2, stderr "Keychain entry ... não encontrada" / "NO_CREDS" | Credenciais nunca foram salvas (ou foram removidas) | Rodar `setup_credenciais.mjs` |
| Exit 2, stderr "Microvix rejeitou credenciais" / "LOGIN_FAIL" | Senha mudou no ERP, ou conta bloqueada | Rodar `setup_credenciais.mjs` com a nova senha |
| Exit 2, stderr "api_token_lma indisponível após login" | gestor_web mudou de URL ou Microvix instável | Rodar `setup_validar_sessao.mjs` pra inspecionar. Se persistir, abrir DevTools no Chromium e ver o que está em `localStorage`. |
| Exit 1, stderr "fetchVendasMicrovix falhou: HTTP 500..." | API do Microvix devolveu erro (ASP exception, payload mal formado, downtime) | Re-rodar. Se persistir, abrir UI manualmente e validar que o relatório roda. |
| Exit 1, stderr "Timeout" | ERP lento ou offline | Re-rodar mais tarde. |
| Stdout vazio + exit 0 | Bug no script (semanas array vazio que passou validação) | Validar argv. |
| Profile corrompido (Chromium reclama de "Profile in use") | Algum cron rodando em paralelo OU crash anterior deixou lock | `rm -f ~/.claude/microvix-profile/SingletonLock` e re-rodar. |

**Tip:** rodar em modo não-headless pra debugar:
```bash
# Editar cron_etapa1_vendas.mjs e trocar `headless: true` por `headless: false`
node cron_etapa1_vendas.mjs '[{"id":"S3","di":"17/05/2026","df":"22/05/2026"}]'
```

## Comparação de tempo

| Approach | Tempo total | Janela visível | Requer Chrome do Athila aberto | Requer aprovação MCP |
|---|---|---|---|---|
| **Playwright headless (atual)** | ~30-60s | não | não | não |
| Chrome MCP API REST (anterior) | ~60-90s | sim (Chrome principal) | sim | sim — a cada sessão |
| Chrome MCP UI scraping (legado) | ~3-5 min | sim | sim | sim |

## Dependências

- Node.js (instalado via `brew install node`, versão 26+).
- Playwright `^1.x` + `chromium-headless-shell` (~92 MB em `~/Library/Caches/ms-playwright/`).
- Total disk: ~150 MB (node_modules + cache).

## Limitações conhecidas

1. **Credenciais precisam ser digitadas uma vez** (via `setup_credenciais.mjs`). Depois ficam no Keychain do macOS — protegido pelo login do usuário. Atual login do Microvix Athila NÃO tem MFA/captcha (validado 22/05/2026 — form Vue simples em `erp.microvix.com.br`). Se Microvix passar a exigir MFA, será preciso re-arquitetar.
2. **Não tente compartilhar profile com Chrome do Athila.** Cookies do Chrome regular ficam em SQLite criptografado com chave do macOS Keychain, intransferível pra outro profile.
3. **Lock de profile:** se 2 cron runs disparam simultâneos, o segundo falha com "Profile in use". O scheduled-tasks atual roda 4x/dia em horários fixos (9/12/15/18h), sem overlap esperado. Se virar problema, adicionar `flock` no shell.
