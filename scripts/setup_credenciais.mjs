#!/usr/bin/env node
/**
 * setup_credenciais.mjs
 *
 * Roda UMA VEZ (ou quando a senha do Microvix mudar) para salvar as credenciais
 * no Keychain do macOS. NÃO grava senha em arquivo, NÃO usa variáveis de
 * ambiente. As entradas ficam em:
 *
 *   account=microvix-cron service=amgomes-microvix      → senha
 *   account=microvix-cron service=amgomes-microvix-user → usuário
 *
 * Após salvar, valida fazendo login real via Playwright. Se o login falhar,
 * remove as entradas e aborta.
 *
 * Uso:
 *   node scripts/setup_credenciais.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import readline from "node:readline";
import { Writable } from "node:stream";
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";

const KC_ACCOUNT = "microvix-cron";
const KC_SVC_PWD = "amgomes-microvix";
const KC_SVC_USER = "amgomes-microvix-user";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_HOME = "https://linx.microvix.com.br/v4/home/index.asp";
const URL_LOGIN = "https://erp.microvix.com.br/";

function ask(question, { mask = false } = {}) {
  return new Promise((resolve) => {
    const muted = new Writable({
      write(chunk, enc, cb) {
        if (!mask || muted.muteAfter <= 0) {
          // Node passa 'buffer' como enc — converte pra default (utf8)
          if (enc === "buffer" || Buffer.isBuffer(chunk)) {
            process.stdout.write(chunk);
          } else {
            process.stdout.write(chunk, enc);
          }
        } else {
          // Echo asterisks for typed characters
          const s = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
          for (const ch of s) {
            if (ch === "\n" || ch === "\r") process.stdout.write(ch);
            else process.stdout.write("*");
          }
        }
        cb();
      },
    });
    muted.muteAfter = 0;
    const rl = readline.createInterface({
      input: process.stdin,
      output: muted,
      terminal: true,
    });
    process.stdout.write(question);
    muted.muteAfter = mask ? 1 : 0;
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function saveKeychain(service, value) {
  const res = spawnSync(
    "security",
    ["add-generic-password", "-a", KC_ACCOUNT, "-s", service, "-w", value, "-U"],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  if (res.status !== 0) {
    throw new Error(`security add-generic-password (${service}) falhou: ${res.stderr.toString()}`);
  }
}

function deleteKeychain(service) {
  spawnSync("security", ["delete-generic-password", "-a", KC_ACCOUNT, "-s", service], {
    stdio: "ignore",
  });
}

function readKeychain(service) {
  const res = spawnSync("security", ["find-generic-password", "-a", KC_ACCOUNT, "-s", service, "-w"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (res.status !== 0) throw new Error(`Keychain leitura ${service} falhou`);
  return res.stdout.toString().replace(/\n$/, "");
}

async function validarLogin(usuario, senha) {
  const HEADED = process.env.HEADED === "1";
  console.log(`\nValidando credenciais via Playwright (${HEADED ? "VISÍVEL" : "headless"})...`);
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !HEADED,
    slowMo: HEADED ? 300 : 0,
    viewport: { width: 1280, height: 800 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
  try {
    const page = ctx.pages()[0] || (await ctx.newPage());
    await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500); // dá tempo do redirect/SSO acontecer

    // Caso 1: já está em /v4/ logado → sessão restaurada, não precisa fazer login
    if (page.url().includes("/v4/") && !page.url().toLowerCase().includes("login")) {
      console.log(`  → sessão já válida no profile (${page.url()}). Credenciais salvas serão usadas só quando expirar.`);
      return true;
    }

    // Caso 2: caiu na tela de login → preencher e submeter
    console.log("  → tela de login detectada, preenchendo creds...");
    try {
      await page.waitForSelector("#f_login", { timeout: 10000, state: "visible" });
    } catch {
      console.log(`  ⚠ #f_login não apareceu em 10s (url=${page.url()}). Inspeção:`);
      const inspect = await page.evaluate(() => ({
        url: location.href,
        inputs: [...document.querySelectorAll("input")].map(i => ({id: i.id, name: i.name, type: i.type})),
        buttons: [...document.querySelectorAll("button")].map(b => ({id: b.id, text: (b.textContent||"").trim().slice(0,40)})),
      })).catch(() => ({}));
      console.log("  ", JSON.stringify(inspect, null, 2));
      return false;
    }

    await page.fill("#f_login", usuario);
    await page.fill("#f_senha", senha);
    await page.click("#lmxta-login-btn-autenticar");

    // Espera redirect pra v4 OU erro de credenciais — loga URL e snippet a cada 1s
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      const snapshot = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        body: (document.body?.innerText || "").slice(0, 200).replace(/\s+/g, " "),
      })).catch(() => ({}));
      console.log(`  [+${i+1}s] url=${snapshot.url}`);
      if (snapshot.body) console.log(`         body="${snapshot.body}"`);
      const url = snapshot.url || "";
      if (url.includes("/v4/") && !url.toLowerCase().includes("login")) return true;
      // qualquer URL em linx.microvix.com.br pós-login que NÃO seja erp.microvix.com.br também serve
      if (url.includes("linx.microvix.com.br") && !url.includes("erp.microvix.com.br") && !url.toLowerCase().includes("login")) return true;
      const erro = /senha.*incorreta|usu[áa]rio.*inv[áa]lid|credenciais.*inv[áa]lid|n[ãa]o.*encontrad|autentica.*falh/i.test(snapshot.body || "");
      if (erro) {
        console.log("  ❌ erro detectado no body");
        return false;
      }
    }
    console.log("  ⚠ timeout 30s sem chegar em URL logada");
    return false;
  } finally {
    await ctx.close().catch(() => {});
  }
}

(async () => {
  console.log("=== Setup de credenciais Microvix (Keychain do macOS) ===\n");
  console.log(`Entrada de senha: account=${KC_ACCOUNT} service=${KC_SVC_PWD}`);
  console.log(`Entrada de user : account=${KC_ACCOUNT} service=${KC_SVC_USER}\n`);

  const usuario = (await ask("Usuário Microvix: ")).trim();
  if (!usuario) { console.error("Usuário vazio. Abortando."); process.exit(1); }
  const senha = (await ask("Senha Microvix:   ", { mask: true })).replace(/\n$/, "");
  if (!senha) { console.error("Senha vazia. Abortando."); process.exit(1); }
  console.log("");

  // Salva PRIMEIRO no Keychain (validação usa via Playwright direto, mas seguindo
  // o padrão pedido: salvar + validar; se falhar, reverter)
  console.log("Salvando no Keychain...");
  saveKeychain(KC_SVC_USER, usuario);
  saveKeychain(KC_SVC_PWD, senha);
  console.log("OK — entradas salvas.");

  let ok = false;
  try {
    ok = await validarLogin(usuario, senha);
  } catch (e) {
    console.error("Falha durante validação:", e.message);
  }

  if (!ok) {
    console.error("\nValidação FALHOU — login não completou. Removendo credenciais do Keychain.");
    deleteKeychain(KC_SVC_USER);
    deleteKeychain(KC_SVC_PWD);
    process.exit(2);
  }

  console.log("\nLogin validado com sucesso. Credenciais armazenadas.");
  console.log("Próximo passo: node scripts/setup_validar_sessao.mjs (warm-up do perfil do cron)\n");
})().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
