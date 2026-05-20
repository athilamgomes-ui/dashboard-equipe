# Setup do Cloudflare Worker (5-10 min)

Vai centralizar feedback das vendedoras, aprovações do athila, avaliações e quizzes. Tudo grátis (free tier do Cloudflare: 100k requests/dia).

## Passo 1 — Criar conta Cloudflare

1. Acessa https://dash.cloudflare.com/sign-up
2. Cria com seu email + senha. Não precisa cartão.
3. Confirma o email.

## Passo 2 — Criar o KV namespace (banco de dados)

1. No dashboard Cloudflare, lateral esquerda: **Storage & Databases** → **KV**
2. Clica em **Create instance** (ou "Create a namespace")
3. Nome: `FEEDBACKS_KV`
4. Clica **Add**

## Passo 3 — Criar o Worker

1. Lateral esquerda: **Compute (Workers)** → **Workers & Pages**
2. Clica em **Create application** → **Create Worker**
3. Nome: `premiacao-amgomes` (ou outro de sua escolha)
4. Clica **Deploy**
5. Quando deployar, clica **Edit code** (botão azul)
6. **Apaga TODO o código padrão** e cola o conteúdo de `worker.js` (do arquivo nessa pasta)
7. Clica **Save and Deploy** (canto superior direito)

## Passo 4 — Conectar o KV ao Worker

1. Volta pro Worker (Workers & Pages → premiacao-amgomes)
2. Aba **Settings** → **Variables and Secrets**
3. Role até **KV Namespace Bindings**
4. Clica **Add binding**
5. Variable name: `FEEDBACKS_KV` (exatamente esse nome)
6. KV namespace: seleciona `FEEDBACKS_KV` que você criou
7. Clica **Save and deploy**

## Passo 5 — (Opcional) Adicionar chave secreta

Pra que ninguém aleatório possa escrever no seu Worker:

1. Settings → Variables and Secrets → **Add variable**
2. Type: **Secret** (não Plain text!)
3. Variable name: `SHARED_KEY`
4. Value: gera uma senha aleatória (ex: `xKp9-mNqL2-aBcD-eFgH` — qualquer string)
5. Save and deploy
6. **Anota essa chave em lugar seguro**

(Pode pular esse passo no MVP, mas é boa prática)

## Passo 6 — Pegar a URL do Worker

1. Na página do Worker, no topo aparece a URL: `https://premiacao-amgomes.<sua-conta>.workers.dev`
2. Copia essa URL inteira
3. **Manda pro Claude no chat**: "URL do Worker é https://..."

## Passo 7 — Testar (opcional)

No navegador, abre essa URL:

```
https://<sua-url-do-worker>/health
```

Deve responder algo como:
```json
{"ok": true, "msg": "Premiacao Worker AMGomes"}
```

Se aparecer isso, deu certo.

---

## Limites do free tier (mais que suficiente)

- 100.000 requisições por dia (você vai usar talvez 200/dia)
- 1.000 escritas por dia no KV (vai usar 50/dia)
- 100k chaves armazenadas no total

Custo se passar do free: começa em USD$5/mês. Você não vai chegar perto disso.

---

## Resumo do que o Worker faz

- Recebe feedback das vendedoras → guarda no KV
- Recebe aprovação/edição do athila → guarda no KV
- Skill consulta tudo na próxima execução e sincroniza nos HTMLs

Sem ele, os feedbacks ficariam só no celular de cada vendedora, sem você ver.
