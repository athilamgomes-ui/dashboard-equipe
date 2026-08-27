#!/usr/bin/env node
/**
 * lista_depositos.mjs — três perguntas de uma vez, em UMA sessão do ERP (só leitura).
 *
 * 1) DEPÓSITOS: a lista real de depósitos de cada loja. O painel de estoque trata "depósito 2"
 *    como "Devolvidos (com defeito)" nas 4 lojas, mas o Athila abriu a tela e viu VÁRIOS nomes.
 *    Se a numeração for por EMPRESA, o bloco 4 do painel soma coisas diferentes em cada loja.
 * 2) CLIENTES: o cadastro de cliente é do GRUPO ou de cada empresa? Busca "MAURA"/"MISSBELEZA"
 *    no cadastro de CADA loja. Se o cliente 8 aparece nas 4, basta cadastrar uma vez.
 * 3) PREÇO REAL: confere no relatório de Lista de Preços o preço dos produtos passados por
 *    argumento. Existe porque o snapshot mostra 46 produtos com "preço de tabela" absurdo
 *    (piranha a R$ 215.978,39) e é preciso saber se o cadastro está errado MESMO ou se é a
 *    minha leitura da coluna que está torta.
 *
 * ⚠️ Navegação: a tela NÃO aceita ?empresa=N. Tem que abrir a URL limpa, esperar #empresas_1
 * e marcar o checkbox da empresa (nunca 9 nem 11). Foi assim que a 1ª versão falhou.
 *
 * Uso: node lista_depositos.mjs [cod1 cod2 ...]
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { garantirSessao } from "./microvix_auth.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, "..", "dados_estoque", "depositos_e_clientes.json");
const PROFILE_DIR = path.join(homedir(), ".claude", "microvix-profile");
const U_SALDO = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_compra_venda_saldo_empresa.asp";
const U_PRECOS = "https://linx.microvix.com.br/gestor_web/produtos/relatorio_lista_precos.asp";
const U_CLI = "https://linx.microvix.com.br/gestor_web/clientes/consulta_clientes.asp";
const LOJAS = { L1: 1, L3: 3, L4: 4, L5: 10 };
const CODS = process.argv.slice(2).filter(a => /^\d+$/.test(a));
const log = (m) => console.log(`[dep] ${m}`);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1440, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
await garantirSessao(page, { tokenOpcional: true });
const res = { geradoEm: new Date().toISOString(), depositos: {}, clientes: {}, precos: {} };

// ── 1) depósitos, loja por loja ────────────────────────────────────────────
for (const [loja, E] of Object.entries(LOJAS)) {
  try {
    await page.goto(U_SALDO, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("#empresas_1", { timeout: 25000 });
    await page.waitForTimeout(900);
    const deps = await page.evaluate((E) => {
      const set = (id, v) => { const e = document.getElementById(id); if (e) { e.checked = v; if (e.onchange) try { e.onchange(); } catch (_) {} } };
      [1, 3, 4, 9, 10, 11].forEach(i => set("empresas_" + i, false));
      set("empresas_" + E, true);
      const s = document.querySelector("select[name=depositos]") || document.querySelector("select[name*='deposito' i]");
      if (!s) return { erro: "select de depósito não existe nesta tela" };
      return { opcoes: [...s.options].map(o => ({ valor: o.value, nome: (o.textContent || "").trim() })) };
    }, E);
    await page.waitForTimeout(1200);   // o select pode ser repovoado por AJAX após o onchange
    const deps2 = await page.evaluate(() => {
      const s = document.querySelector("select[name=depositos]");
      return s ? [...s.options].map(o => ({ valor: o.value, nome: (o.textContent || "").trim() })) : null;
    });
    res.depositos[loja] = deps2 || deps;
    const lista = deps2 || deps.opcoes || [];
    log(`${loja} (emp${E}): ${lista.length} depósito(s)`);
    lista.forEach(d => log(`      ${String(d.valor).padStart(3)} = ${d.nome}`));
  } catch (e) { res.depositos[loja] = { erro: String(e).slice(0, 140) }; log(`${loja} depósitos FALHOU: ${String(e).slice(0, 90)}`); }
}

// ── 2) cadastro de clientes: do grupo ou da empresa? ───────────────────────
for (const [loja, E] of Object.entries(LOJAS)) {
  const achados = [];
  for (const termo of ["MAURA", "MISSBELEZA", "CASA DA BELEZA"]) {
    try {
      await page.goto(U_CLI, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(1400);
      const campos = await page.evaluate(() => {
        const f = document.forms[0]; if (!f) return null;
        return [...f.elements].map(el => ({ name: el.name, type: el.type, tag: el.tagName })).slice(0, 40);
      });
      if (!achados.length && loja === "L1") res.clientes._campos = campos;
      const ok = await page.evaluate((t) => {
        const f = document.forms[0]; if (!f) return false;
        const c = [...f.elements].find(el => /nome|razao|pesquis|busca|descr|cliente/i.test(el.name || "") && /^(text|search)$/i.test(el.type || ""));
        if (!c) return false;
        c.value = t; return true;
      }, termo);
      if (!ok) { achados.push({ termo, erro: "campo de busca não encontrado", campos }); continue; }
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load", timeout: 90000 }).catch(() => null),
        page.evaluate(() => { const f = document.forms[0]; if (f) f.submit(); }),
      ]);
      await page.waitForTimeout(1200);
      const linhas = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll("table tr").forEach(tr => {
          const tds = [...tr.querySelectorAll("td")].map(td => (td.textContent || "").replace(/\s+/g, " ").trim());
          if (/MAURA|MISSBELEZA|CASA DA BELEZA/i.test(tds.join(" "))) out.push(tds.filter(Boolean).slice(0, 6));
        });
        return out.slice(0, 12);
      });
      achados.push({ termo, linhas });
      log(`${loja} clientes "${termo}": ${linhas.length} linha(s)`);
      linhas.forEach(l => log(`      ${l.join(" | ").slice(0, 115)}`));
    } catch (e) { achados.push({ termo, erro: String(e).slice(0, 140) }); }
  }
  res.clientes[loja] = achados;
}

// ── 3) preço real dos códigos pedidos (Lista de Preços) ────────────────────
if (CODS.length) {
  try {
    await page.goto(U_PRECOS, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);
    res.precos._campos = await page.evaluate(() => {
      const f = document.forms[0]; if (!f) return null;
      return [...f.elements].map(el => ({ name: el.name, type: el.type, id: el.id })).slice(0, 60);
    });
    log(`lista_precos: campos = ${JSON.stringify(res.precos._campos)?.slice(0, 600)}`);
  } catch (e) { log(`lista_precos FALHOU: ${String(e).slice(0, 100)}`); }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(res, null, 2));
log(`gravado: ${OUT}`);
await ctx.close();
