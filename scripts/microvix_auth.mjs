/**
 * microvix_auth.mjs
 *
 * Helpers compartilhados de autenticação Microvix:
 * - Lê credenciais do Keychain do macOS (NUNCA de arquivo / env)
 * - garantirSessao(page): verifica se a sessão atual está válida; se não,
 *   faz login programático via form Vue em erp.microvix.com.br.
 *
 * Lança erros com .code:
 *   'NO_CREDS'    → credenciais não encontradas no Keychain
 *   'LOGIN_FAIL'  → login com creds salvas falhou (senha mudou, conta bloqueada)
 *   'NAV_FAIL'    → navegação não completou (rede / Microvix instável)
 */
import { spawnSync } from "node:child_process";

const KC_ACCOUNT = "microvix-cron";
const KC_SVC_PWD = "amgomes-microvix";
const KC_SVC_USER = "amgomes-microvix-user";

export const URL_HOME = "https://linx.microvix.com.br/v4/home/index.asp";
export const URL_GESTOR = "https://linx.microvix.com.br/gestor_web/faturamento/relatorios/performance_por_vendedor/index.html";
const LOGIN_HOST_RE = /^https?:\/\/(erp\.microvix\.com\.br|.*\/login|.*\/v4\/login)/i;

function kcRead(service) {
  const res = spawnSync("security", ["find-generic-password", "-a", KC_ACCOUNT, "-s", service, "-w"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (res.status !== 0) {
    const e = new Error(`Keychain entry ${service} não encontrada`);
    e.code = "NO_CREDS";
    throw e;
  }
  return res.stdout.toString().replace(/\n$/, "");
}

export function getCredenciais() {
  // CI / servidor (GitHub Actions): credenciais vêm de env vars (secrets).
  // Local (Mac): vêm do Keychain. Env tem prioridade quando presente.
  if (process.env.MICROVIX_USER && process.env.MICROVIX_PASS) {
    return { usuario: process.env.MICROVIX_USER, senha: process.env.MICROVIX_PASS };
  }
  const usuario = kcRead(KC_SVC_USER);
  const senha = kcRead(KC_SVC_PWD);
  if (!usuario || !senha) {
    const e = new Error("usuário ou senha vazios no Keychain");
    e.code = "NO_CREDS";
    throw e;
  }
  return { usuario, senha };
}

function isLoginPage(url) {
  return LOGIN_HOST_RE.test(url) || url.toLowerCase().includes("loginsistema");
}

/**
 * Faz login programático. Assume que `page` já está na tela de login
 * (erp.microvix.com.br). Retorna true se ao final do submit estamos
 * dentro do v4 logado.
 */
async function doLogin(page, log) {
  const { usuario, senha } = getCredenciais();
  log(`tela de login detectada (${page.url()}) — preenchendo creds...`);
  await page.waitForSelector("#f_login", { timeout: 15000 });
  await page.fill("#f_login", usuario);
  await page.fill("#f_senha", senha);
  await Promise.all([
    page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {}),
    page.click("#lmxta-login-btn-autenticar"),
  ]);
  // Aguarda chegar em /v4/ OU tela de seleção de empresa (.company-link)
  let empresaSelecionada = false;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const url = page.url();
    if (url.includes("linx.microvix.com.br") && url.includes("/v4/") && !url.includes("login")) {
      log(`login OK → ${url}`);
      return true;
    }
    // Detecta tela de seleção de empresa (em erp.microvix.com.br após login)
    if (!empresaSelecionada && url.includes("erp.microvix.com.br")) {
      const companyLink = await page.$(".company-link").catch(() => null);
      if (companyLink) {
        log("tela de seleção de empresa — clicando na empresa 1 (Casa da Beleza Altamira)...");
        const clicou = await page.evaluate(() => {
          const links = [...document.querySelectorAll(".company-link")];
          const empresa1 = links.find(a => /^\s*1\s*[-–—]/.test(a.textContent || ""));
          (empresa1 || links[0])?.click();
          return !!(empresa1 || links[0]);
        }).catch(() => false);
        if (clicou) {
          empresaSelecionada = true;
          continue;
        }
      }
    }
    const erro = await page.evaluate(() => {
      const t = (document.body && document.body.innerText) || "";
      return /senha.*incorreta|usu[áa]rio.*inv[áa]lid|credenciais.*inv[áa]lid|autentica.*falh/i.test(t);
    }).catch(() => false);
    if (erro) {
      const e = new Error("Microvix rejeitou credenciais — possível mudança de senha ou conta bloqueada");
      e.code = "LOGIN_FAIL";
      throw e;
    }
  }
  // 30s sem chegar em /v4/ — considera falha
  const e = new Error(`login não completou em 30s (url atual=${page.url()})`);
  e.code = "NAV_FAIL";
  throw e;
}

/**
 * Garante que a sessão da `page` está válida e que existe `api_token_lma`
 * em localStorage de gestor_web. Se a sessão expirou, faz login automático.
 *
 * Estratégia:
 *  1. Navega para URL_HOME (v4 ASP) — endpoint dinâmico que redireciona pra
 *     login se a sessão server-side expirou. Diferente de URL_GESTOR (HTML
 *     estático) que aceita sessão morta sem reclamar.
 *  2. Se na tela de login → doLogin → volta pra URL_HOME → re-valida.
 *  3. Navega para URL_GESTOR para extrair o token api_token_lma do localStorage.
 *  4. Faz uma chamada-teste à API; se voltar "Sessão expirada", limpa cookies
 *     e força re-login.
 *
 * Retorna o token api_token_lma. Lança em caso de falha (.code definido).
 */
export async function garantirSessao(page, { log = () => {} } = {}) {
  log("garantindo sessão (v4/home — valida sessão ASP real)...");
  await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });

  if (isLoginPage(page.url())) {
    await doLogin(page, log);
    await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (isLoginPage(page.url())) {
      const e = new Error("ainda na tela de login após submit — fluxo de login mudou?");
      e.code = "LOGIN_FAIL";
      throw e;
    }
  }

  log("v4/home OK — navegando para gestor_web pra pegar token...");
  await page.goto(URL_GESTOR, { waitUntil: "domcontentloaded", timeout: 30000 });

  let token = null;
  for (let i = 0; i < 30; i++) {
    token = await page.evaluate(() => localStorage.getItem("api_token_lma")).catch(() => null);
    if (token) break;
    await page.waitForTimeout(500);
  }
  if (!token) {
    const e = new Error("api_token_lma indisponível após login");
    e.code = "NAV_FAIL";
    throw e;
  }

  // Validação real: chamada-teste à API. Microvix às vezes mantém token em
  // localStorage mas o session cookie server-side já expirou — neste caso o
  // endpoint retorna 200 + HTML "Sessão expirada" em vez de JSON.
  const sessaoOk = await page.evaluate(async () => {
    try {
      const t = localStorage.getItem("api_token_lma");
      const r = await fetch(
        "/gestor_web/faturamento/relatorios/performance_por_vendedor/performance_por_vendedor_service.asp",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
            Authorization: t,
          },
          body: JSON.stringify({
            EmpresasSelecionadasParam: "1",
            DataInicial: "01/05/2026",
            DataFinal: "01/05/2026",
            ConsiderarEntradaGarantiaNacional: true,
            op: "Listar",
          }),
        }
      );
      const txt = await r.text();
      if (/Sess.o expirada|sessao_expirada\.asp/i.test(txt)) return false;
      try { JSON.parse(txt); return true; } catch { return false; }
    } catch { return false; }
  });

  if (!sessaoOk) {
    log("session cookie expirado — limpando cookies e forçando re-login...");
    const ctx = page.context();
    await ctx.clearCookies();
    await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!isLoginPage(page.url())) {
      // Forçar ida pra erp.microvix
      await page.goto("https://erp.microvix.com.br/", { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    await doLogin(page, log);
    await page.goto(URL_GESTOR, { waitUntil: "domcontentloaded", timeout: 30000 });
    token = null;
    for (let i = 0; i < 30; i++) {
      token = await page.evaluate(() => localStorage.getItem("api_token_lma")).catch(() => null);
      if (token) break;
      await page.waitForTimeout(500);
    }
    if (!token) {
      const e = new Error("api_token_lma indisponível após re-login forçado");
      e.code = "NAV_FAIL";
      throw e;
    }
  }
  log(`token OK (${token.length} chars)`);
  return token;
}
