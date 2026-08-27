#!/usr/bin/env node
/**
 * fator_conversao.mjs — LÊ e (com --gravar) AJUSTA o fator de conversão de compra em lote.
 *
 * ONDE O FATOR MORA (descoberto em 27/08/2026):
 *   gestor_web/produtos/produtos_fornec/relac_prod_fornec.asp?cod_produto=<cod>
 *   Campos: produto · fornecedor(select) · unidade_compra(select CX/UN/...) ·
 *           fator_conversao_compra(text) · qtde_embalagem · custo · descontos...
 *   O fator é por PRODUTO × FORNECEDOR — faz sentido: quem define quantas peças vêm na caixa
 *   é o fornecedor. Existe também um `utiliza_multiplos_fatores` (hidden).
 *
 * COMO O FATOR AFETA O ESTOQUE (medido, não suposto):
 *   O "Custo c/ICMS" do cadastro é o custo da UNIDADE DE COMPRA (a caixa/fardo).
 *   O Registro de Inventário valoriza cada peça por  custo ÷ fator.
 *   Prova: produto 49392 (ALGODAO NATHY 100G) → cadastro R$ 3,28 · inventário R$ 0,03
 *          (3,28 ÷ 100 = 0,0328). Já o 11043, que NÃO tem fator, aparece igual nos dois: R$ 1,16.
 *   Consequência prática: **fator errado = estoque valorizado errado**, e sem tocar em preço.
 *
 * QUEM TEM E QUEM NÃO TEM FATOR — atalho que economiza muito tempo:
 *   gestor_web/produtos/relatorio_manut.asp tem o filtro `listar_prod_fator_conversao`
 *   com S (só com fator) / N (só sem fator) / Todos. Dá a população inteira de uma vez,
 *   por loja e por marca. É a forma rápida de achar quem falta cadastrar.
 *
 * ⚠️ GRAVAR É OPERAÇÃO REAL EM PRODUÇÃO. Sem --gravar o script só LÊ e mostra o que faria.
 * ⚠️ Perfil separado (microvix-cadastro) para não brigar com o cron da precificação.
 *
 * Uso:
 *   node fator_conversao.mjs --ler 49392 11043 17704       → mostra fornecedor, unidade e fator
 *   node fator_conversao.mjs --plano plano.json            → simula o lote (não grava)
 *   node fator_conversao.mjs --plano plano.json --gravar   → GRAVA
 *
 * plano.json: [{ "cod": "49392", "fornecedor": "494", "fator": 100, "unidade": "CX" }, ...]
 */
import { chromium } from "playwright";
import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";

const URL = "https://linx.microvix.com.br/gestor_web/produtos/produtos_fornec/relac_prod_fornec.asp";
const PROFILE = process.env.MICROVIX_PROFILE || path.join(homedir(), ".claude", "microvix-cadastro");
const GRAVAR = process.argv.includes("--gravar");
const log = (m) => console.log(`[fator] ${m}`);

const iLer = process.argv.indexOf("--ler");
const iPlano = process.argv.indexOf("--plano");
const cods = iLer >= 0 ? process.argv.slice(iLer + 1).filter(a => /^\d+$/.test(a)) : [];
const plano = iPlano >= 0 ? JSON.parse(fs.readFileSync(process.argv[iPlano + 1], "utf8")) : [];
if (!cods.length && !plano.length) { console.error("nada a fazer — use --ler <cods> ou --plano <arquivo>"); process.exit(1); }

const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1440, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
await garantirSessao(page, { tokenOpcional: true });

/** Lê a relação produto×fornecedor de um produto. Só leitura. */
async function ler(cod) {
  await page.goto(`${URL}?cod_produto=${cod}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1800);
  return page.evaluate(() => {
    const v = (n) => { const e = document.querySelector(`[name="${n}"]`); return e ? e.value : null; };
    const sel = document.querySelector('select[name="fornecedor"]');
    const linhas = [...document.querySelectorAll("table tr")]
      .map(tr => [...tr.cells].map(c => (c.textContent || "").replace(/\s+/g, " ").trim()))
      .filter(c => c.length > 3 && c.some(x => /^\d+[,.]\d+$/.test(x)));
    return {
      produto: v("produto"), custo: v("custo"),
      unidade_compra: v("unidade_compra"),
      fator: v("fator_conversao_compra"),
      qtde_embalagem: v("qtde_embalagem"),
      multiplos: v("utiliza_multiplos_fatores"),
      fornecedorSelecionado: sel ? sel.value : null,
      fornecedores: sel ? [...sel.options].filter(o => o.value && o.value !== "nenhum").length : 0,
      relacoes: linhas.slice(0, 8),
    };
  });
}

if (cods.length) {
  for (const c of cods) {
    try {
      const r = await ler(c);
      log(`${c}: unidade=${r.unidade_compra} · fator=${r.fator} · qtd_embalagem=${r.qtde_embalagem || "—"} · custo=${r.custo || "—"} · múltiplos=${r.multiplos}`);
      if (r.relacoes.length) r.relacoes.forEach(l => log(`      ${l.join(" | ").slice(0, 130)}`));
    } catch (e) { log(`${c}: FALHOU ${String(e).slice(0, 90)}`); }
  }
}

if (plano.length) {
  log(`plano com ${plano.length} produto(s) · modo ${GRAVAR ? "GRAVAR (produção!)" : "SIMULAÇÃO"}`);
  const registro = [];
  for (const p of plano) {
    try {
      const antes = await ler(p.cod);
      const linha = { cod: p.cod, antes: { fator: antes.fator, unidade: antes.unidade_compra, custo: antes.custo }, pedido: p };
      if (!GRAVAR) {
        log(`  ${p.cod}: fator ${antes.fator} → ${p.fator} · unidade ${antes.unidade_compra} → ${p.unidade || antes.unidade_compra}  [simulação]`);
        registro.push({ ...linha, status: "simulado" });
        continue;
      }
      const ok = await page.evaluate(({ p }) => {
        const set = (n, val) => { const e = document.querySelector(`[name="${n}"]`); if (!e || val == null) return false; e.value = val; if (e.onchange) try { e.onchange(); } catch (_) {} return true; };
        const a = set("fornecedor", String(p.fornecedor));
        const b = set("fator_conversao_compra", String(p.fator).replace(".", ","));
        const c = p.unidade ? set("unidade_compra", p.unidade) : true;
        return a && b && c;
      }, { p });
      if (!ok) { log(`  ${p.cod}: não consegui preencher os campos — PULANDO`); registro.push({ ...linha, status: "erro_preencher" }); continue; }
      const nav = page.waitForNavigation({ waitUntil: "load", timeout: 60000 }).catch(() => null);
      await page.evaluate(() => { const b = document.querySelector('input[type=submit],button[type=submit]'); if (b) b.click(); });
      await nav;
      await page.waitForTimeout(900);
      const depois = await ler(p.cod);
      const bateu = String(depois.fator).replace(",", ".") === String(p.fator);
      log(`  ${p.cod}: fator ${antes.fator} → ${depois.fator} ${bateu ? "✅" : "⚠️ NÃO confirmou"}`);
      registro.push({ ...linha, depois: { fator: depois.fator, unidade: depois.unidade_compra }, status: bateu ? "ok" : "nao_confirmou" });
    } catch (e) { log(`  ${p.cod}: FALHOU ${String(e).slice(0, 90)}`); registro.push({ cod: p.cod, status: "excecao", erro: String(e).slice(0, 140) }); }
  }
  const dest = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "dados_estoque",
    `fator_${GRAVAR ? "aplicado" : "simulado"}.json`);
  fs.writeFileSync(dest, JSON.stringify(registro, null, 1));
  log(`registro antes/depois gravado em ${dest}`);
}

await ctx.close();
