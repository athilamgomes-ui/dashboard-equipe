#!/usr/bin/env node
/**
 * aplica_precos_erp.mjs — aplica preços no ERP Microvix via importação por arquivo .txt
 * (Estoque > Lista de Preços > Ajuste de Preços por lote → upload_produto.asp).
 *
 * Formato do .txt (descoberto na validação): "codigo;valor" por linha, valor com VÍRGULA (ex.: 12,40).
 * Tipo de código (radio): S=Código de Produto (default), K=Código de Barras, R=Referência.
 *
 * SEGURANÇA: por padrão roda em modo VALIDAÇÃO (validar_arquivo=S) — NÃO altera preço nenhum,
 * só verifica o arquivo e diz, linha a linha, se o produto existe e se o formato está ok.
 * Para gravar de verdade é preciso passar --apply (e a empresa alvo).
 *
 * Uso:
 *   node aplica_precos_erp.mjs <arquivo.txt> [--tipo S|K|R] [--empresa N] [--apply]
 *   (sem --apply = dry-run/validação; com --apply = grava no ERP)
 * Exit: 0=ok, 2=creds/login, 1=falha.
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_LOTE = "https://linx.microvix.com.br/gestor_web/produtos/ajuste_preco_por_lote.asp";
const log = m => process.stderr.write(`[aplica] ${m}\n`);

const args = process.argv.slice(2);
const arquivo = args.find(a => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const TIPO = (args.find(a => a.startsWith("--tipo="))?.split("=")[1] || "S").toUpperCase(); // S/K/R
const EMPRESA = args.find(a => a.startsWith("--empresa="))?.split("=")[1] || "";

if (!arquivo) { log("uso: node aplica_precos_erp.mjs <arquivo.txt> [--tipo S|K|R] [--empresa N] [--apply]"); process.exit(1); }

(async () => {
  const conteudo = readFileSync(arquivo, "utf8");
  const linhas = conteudo.split(/\r?\n/).filter(l => l.trim());
  log(`${linhas.length} linhas no arquivo · tipo=${TIPO} · empresa=${EMPRESA || "(logada)"} · modo=${APPLY ? "APLICAR ⚠️" : "VALIDAÇÃO (dry-run)"}`);
  if (APPLY && !EMPRESA) { log("ERRO: --apply exige --empresa=N (empresa alvo)."); process.exit(1); }

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
  const page = ctx.pages()[0] || (await ctx.newPage());
  try {
    await garantirSessao(page, { log });
    await page.goto(URL_LOTE, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("#file1", { timeout: 20000 });
    await page.setInputFiles("#file1", arquivo);
    await page.evaluate(({ TIPO, APPLY, EMPRESA }) => {
      const r = [...document.querySelectorAll('input[name=radio]')].find(x => x.value === TIPO);
      if (r) r.checked = true;
      const v = document.querySelector('input[name=validar_arquivo]');
      if (v) v.checked = !APPLY;                 // dry-run = validar; apply = desmarca
      const es = document.querySelector('input[name=empresas_selec]');
      if (es && EMPRESA) es.value = String(EMPRESA);
    }, { TIPO, APPLY, EMPRESA });
    await Promise.all([
      page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => {}),
      page.click('input[value="Upload >"]'),
    ]);
    await page.waitForTimeout(2000);
    const resultado = await page.evaluate(() => (document.body.innerText || "").replace(/ /g, " ").trim());
    // parse das mensagens por linha
    const msgs = resultado.split("\n").map(s => s.trim()).filter(s => /Linha:|sucesso|atualizad|inv[aá]lid|n[aã]o foi encontrado|erro/i.test(s));
    const naoEncontrado = msgs.filter(m => /n[aã]o foi encontrado/i.test(m)).length;
    const formatoInvalido = msgs.filter(m => /formato inv|inv[aá]lid/i.test(m)).length;
    const ok = msgs.filter(m => /sucesso|atualizad/i.test(m)).length;
    console.log(JSON.stringify({
      modo: APPLY ? "APLICADO" : "validacao",
      linhas: linhas.length,
      resumo: { ok, nao_encontrado: naoEncontrado, formato_invalido: formatoInvalido },
      mensagens: msgs.slice(0, 40),
      resposta_bruta: resultado.slice(0, 600),
    }, null, 2));
  } catch (e) {
    log(`FALHA: ${String(e.message || e).split("\n")[0]}`);
    process.exitCode = e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1;
  } finally {
    await ctx.close();
  }
})();
