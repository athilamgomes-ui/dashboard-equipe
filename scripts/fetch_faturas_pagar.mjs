/**
 * fetch_faturas_pagar.mjs
 *
 * Extrai "Contas a Pagar" (faturas por vencimento Abr-Ago/2026)
 * do Microvix para as 4 lojas: L1=emp1, L3=emp3, L4=emp4, L5=emp10.
 *
 * Saída JSON no stdout: { L1, L3, L4, L5 } — arrays de 5 valores [Abr,Mai,Jun,Jul,Ago]
 *
 * Uso: node fetch_faturas_pagar.mjs
 */

import { chromium } from "playwright";
import { getCredenciais } from "./microvix_auth.mjs";

// Para debug rápido, pode rodar só uma empresa com: ONLY_EMP=1 node ...
const ALL_EMPRESAS = [
  { key: "L1", id: 1,  label: "1 -" },
  { key: "L3", id: 3,  label: "3 -" },
  { key: "L4", id: 4,  label: "4 -" },
  { key: "L5", id: 10, label: "10 -" },
];
const EMPRESAS = process.env.ONLY_EMP
  ? ALL_EMPRESAS.filter(e => String(e.id) === process.env.ONLY_EMP)
  : ALL_EMPRESAS;

const MESES = ["Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26"];
const DATA_INI = "01/04/2026";
const DATA_FIM = "31/08/2026";
const URL_FATURAS = "https://linx.microvix.com.br/gestor_web/financeiro/relatorio_faturas_periodo.asp?ParametroParaFavoritos=pagar";
const URL_ERP     = "https://erp.microvix.com.br/";
const URL_HOME    = "https://linx.microvix.com.br/v4/home/index.asp";

const log = (...a) => console.error("[faturas]", ...a);

/** Login na empresa com o número informado */
async function loginEmpresa(page, empresaId) {
  const { usuario, senha } = getCredenciais();
  log(`iniciando login para empresa ${empresaId}...`);

  // Navega para tela de login
  await page.goto(URL_ERP, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Preenche login se necessário
  const isLogin = () => /erp\.microvix\.com\.br/.test(page.url()) &&
    !page.url().includes("/v4/");
  if (isLogin()) {
    await page.waitForSelector("#f_login", { timeout: 15000 });
    await page.fill("#f_login", usuario);
    await page.fill("#f_senha", senha);
    await Promise.all([
      page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {}),
      page.click("#lmxta-login-btn-autenticar"),
    ]);
  }

  // Aguarda tela de seleção de empresa
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const url = page.url();

    // Tela de seleção de empresa
    const companyLink = await page.$(".company-link").catch(() => null);
    if (companyLink) {
      log(`tela de seleção — clicando empresa ${empresaId}...`);
      const clicou = await page.evaluate((empId) => {
        const links = [...document.querySelectorAll(".company-link")];
        const target = links.find(a => {
          const t = (a.textContent || "").trim();
          return t.startsWith(empId + " ") || t.startsWith(empId + "-") || t.startsWith(empId + "–");
        });
        if (target) { target.click(); return true; }
        // fallback: clicar pelo índice (emp 1=idx0, 3=idx1, 4=idx2, 10=idx3)
        const order = [1,3,4,10];
        const idx = order.indexOf(empId);
        if (idx >= 0 && links[idx]) { links[idx].click(); return true; }
        return false;
      }, empresaId);
      if (clicou) {
        log(`empresa ${empresaId} selecionada`);
        continue;
      }
    }

    if (url.includes("linx.microvix.com.br") && url.includes("/v4/") && !url.includes("login")) {
      log(`login OK para empresa ${empresaId} → ${url}`);
      return;
    }
  }
  throw new Error(`login não completou para empresa ${empresaId} (url=${page.url()})`);
}

/** Extrai totais mensais do relatório de faturas a pagar */
async function extrairFaturas(page, empresaId) {
  log(`navegando para relatório de faturas: ${URL_FATURAS}`);
  await page.goto(URL_FATURAS, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Salva HTML em modo debug
  if (process.env.DEBUG_FORM) {
    const fs = await import("node:fs");
    const fullHTML = await page.content();
    fs.writeFileSync(`/tmp/faturas_full_${empresaId}.html`, fullHTML);
    log(`HTML salvo em /tmp/faturas_full_${empresaId}.html`);
  }

  // Preenche formulário (form1) via evaluate
  // Preencher campos de data PRIMARY (data_inicial / data_final = período de vencimento exibido)
  const preenchido = await page.evaluate(({ini, fim, empId}) => {
    const setV = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return null;
      el.disabled = false;
      el.value = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return el.value;
    };
    // Os campos principais que o servidor usa para filtrar o período
    const iniResult = setV("data_inicial", ini);
    const fimResult = setV("data_final", fim);

    // Desabilitar filtros de vencimento adicionais (para não conflitar)
    const chkVenc = document.getElementById("filtrar_data_vencimento");
    if (chkVenc) {
      chkVenc.checked = false;
      chkVenc.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Garantir empresa correta selecionada
    const empChk = document.getElementById("empresas_" + empId);
    if (empChk && !empChk.checked) empChk.checked = true;

    return {
      iniVal: iniResult,
      fimVal: fimResult,
      empChecked: empChk?.checked,
      chkVencOff: !document.getElementById("filtrar_data_vencimento")?.checked,
    };
  }, {ini: DATA_INI, fim: DATA_FIM, empId: empresaId});

  log("preenchimento:", JSON.stringify(preenchido));
  await page.waitForTimeout(300);

  // Verificar o que o form vai enviar antes do submit
  const formParams = await page.evaluate(() => {
    const form = document.getElementById("form1");
    if (!form) return null;
    const data = new FormData(form);
    const obj = {};
    for (const [k, v] of data.entries()) {
      if (obj[k]) {
        if (!Array.isArray(obj[k])) obj[k] = [obj[k]];
        obj[k].push(v);
      } else obj[k] = v;
    }
    return obj;
  });
  log("params antes do submit:", JSON.stringify(formParams)?.substring(0, 500));

  // Submit: clica no botão "Gerar relatório"
  log("submetendo formulário (Gerar relatório)...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }),
    page.click('input[name="Prosseguir"][type="submit"]'),
  ]);
  await page.waitForTimeout(3000);
  log(`após submit: ${page.url()}`);

  // Extrair totais mensais do texto da página
  const result = await page.evaluate(() => {
    const allText = (document.body.innerText || "").replace(/\r/g, "");
    const monthly = { "Abr/26": 0, "Mai/26": 0, "Jun/26": 0, "Jul/26": 0, "Ago/26": 0 };
    const monthMap = {
      "04": "Abr/26", "05": "Mai/26", "06": "Jun/26", "07": "Jul/26", "08": "Ago/26"
    };

    // Padrão: "Subtotal do grupo DD/MM/AAAA em reais\tR$ X.XXX,XX"
    // ou "Subtotal do grupo DD/MM/AAAA em Reais\tR$ X.XXX,XX" (capitalização variável)
    const subtotalRe = /Subtotal do grupo\s+\d{2}\/(\d{2})\/\d{4}\s+em\s+[Rr]e[a-z]+\s+R\$\s+([\d.]+,\d{2})/gi;
    let m;
    while ((m = subtotalRe.exec(allText)) !== null) {
      const mm = m[1]; // month number (04, 05, etc.)
      const label = monthMap[mm];
      if (label) {
        const val = parseFloat(m[2].replace(/\./g, "").replace(",", "."));
        monthly[label] = (monthly[label] || 0) + val;
      }
    }

    // Tentar extrair Total Geral como fallback
    const totalMatch = allText.match(/Total Geral a Pagar:\s*R\$\s*([\d.]+,\d{2})/i);

    return {
      monthly,
      totalGeral: totalMatch ? parseFloat(totalMatch[1].replace(/\./g, "").replace(",", ".")) : null,
      rawText: allText.substring(0, 3000),
    };
  });

  log("totais mensais:", JSON.stringify(result.monthly));
  log("total geral:", result.totalGeral);

  log("texto:", result.rawText.substring(0, 300));

  return result.monthly;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const results = {};

  for (const emp of EMPRESAS) {
    log(`\n=== Processando ${emp.key} (empresa ${emp.id}) ===`);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    try {
      await loginEmpresa(page, emp.id);
      const data = await extrairFaturas(page, emp.id);
      results[emp.key] = data;
    } catch (err) {
      log(`ERRO ${emp.key}:`, err.message);
      results[emp.key] = { error: err.message };
    }

    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
