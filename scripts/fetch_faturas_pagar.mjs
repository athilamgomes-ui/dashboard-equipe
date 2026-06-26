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

// ── Janela dinâmica: mês corrente + 4 meses à frente (5 colunas). Rola sozinha. ──
const MES_ABBR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const pad = n => String(n).padStart(2, "0");
function construirJanela(n = 5) {
  const hoje = new Date();
  let y = hoje.getFullYear(), m = hoje.getMonth(); // 0-based
  const meses = [], monthMap = {}; let primeiro = null, ultimo = null;
  for (let i = 0; i < n; i++) {
    const label = `${MES_ABBR[m]}/${String(y).slice(2)}`;
    meses.push(label);
    monthMap[`${pad(y)}-${pad(m + 1)}`] = label;   // chave AAAA-MM (única por ano/mês)
    monthMap[pad(m + 1) + "|" + y] = label;
    if (i === 0) primeiro = { y, m };
    ultimo = { y, m };
    m++; if (m > 11) { m = 0; y++; }
  }
  const diasUlt = new Date(ultimo.y, ultimo.m + 1, 0).getDate();
  return {
    meses, monthMap,
    DATA_INI: `01/${pad(primeiro.m + 1)}/${primeiro.y}`,
    DATA_FIM: `${diasUlt}/${pad(ultimo.m + 1)}/${ultimo.y}`,
  };
}
const JANELA = construirJanela(5);
const MESES = JANELA.meses;
const DATA_INI = JANELA.DATA_INI;
const DATA_FIM = JANELA.DATA_FIM;
const URL_FATURAS = "https://linx.microvix.com.br/gestor_web/financeiro/relatorio_faturas_periodo.asp?ParametroParaFavoritos=pagar";
const URL_ERP     = "https://erp.microvix.com.br/";
const URL_HOME    = "https://linx.microvix.com.br/v4/home/index.asp";

// Grava no Supabase por padrão (tabela contas_pagar_erp, 1 linha id=1). --file = só stdout (debug).
const FILE_MODE = process.argv.includes("--file");
const SUPABASE_URL = "https://valhewbvjwdkkvuejrxa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGhld2J2andka2t2dWVqcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzEwMTgsImV4cCI6MjA5NzMwNzAxOH0.DhQaFpQ1Ca-W8Od6jl3KatGai_shXOoc14Fqk7P3lK4";

const log = (...a) => console.error("[faturas]", ...a);

async function gravarSupabase(out) {
  const body = JSON.stringify({ id: 1, dados: out, atualizado_em: new Date().toISOString() });
  const r = await fetch(`${SUPABASE_URL}/rest/v1/contas_pagar_erp`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body,
  });
  if (!r.ok) throw new Error("supabase " + r.status + " " + (await r.text()).slice(0, 300));
}

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
  const result = await page.evaluate(({ monthMap, meses }) => {
    const allText = (document.body.innerText || "").replace(/\r/g, "");
    const monthly = {};
    for (const lbl of meses) monthly[lbl] = 0;

    // Padrão: "Subtotal do grupo DD/MM/AAAA em reais\tR$ X.XXX,XX"
    // Casa por ANO+MÊS (chave MM|AAAA) → robusto a NFes de anos diferentes.
    const subtotalRe = /Subtotal do grupo\s+\d{2}\/(\d{2})\/(\d{4})\s+em\s+[Rr]e[a-z]+\s+R\$\s+([\d.]+,\d{2})/gi;
    let m;
    while ((m = subtotalRe.exec(allText)) !== null) {
      const label = monthMap[m[1] + "|" + m[2]]; // "MM|AAAA"
      if (label) {
        const val = parseFloat(m[3].replace(/\./g, "").replace(",", "."));
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
  }, { monthMap: JANELA.monthMap, meses: MESES });

  log("totais mensais:", JSON.stringify(result.monthly));
  log("total geral:", result.totalGeral);

  log("texto:", result.rawText.substring(0, 300));

  return result.monthly;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  log(`janela: ${MESES.join(", ")} (venc. ${DATA_INI}–${DATA_FIM})`);
  const monthly = {};   // por loja → {label: val}
  let okLojas = 0;

  for (const emp of EMPRESAS) {
    log(`\n=== Processando ${emp.key} (empresa ${emp.id}) ===`);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await loginEmpresa(page, emp.id);
      monthly[emp.key] = await extrairFaturas(page, emp.id);
      okLojas++;
    } catch (err) {
      log(`ERRO ${emp.key}:`, err.message);
      monthly[emp.key] = null;
    }
    await ctx.close();
  }
  await browser.close();

  // Falha dura se NENHUMA loja coletou → o pipeline preserva a versão anterior.
  if (okLojas === 0) {
    console.error("FATAL: nenhuma loja coletada — abortando (sem saída).");
    process.exit(1);
  }
  if (okLojas < EMPRESAS.length) log(`AVISO: só ${okLojas}/${EMPRESAS.length} lojas coletadas.`);

  // Saída alinhada à janela: arrays de 5 por loja (null/ausente → 0).
  const arr = key => MESES.map(lbl => Math.round((monthly[key] && monthly[key][lbl]) || 0));
  const out = {
    geradoEm: `${pad(new Date().getDate())}/${pad(new Date().getMonth() + 1)}/${new Date().getFullYear()}`,
    meses: MESES,
    lojasOk: okLojas,
    L1: arr("L1"), L3: arr("L3"), L4: arr("L4"), L5: arr("L5"),
  };
  console.log(JSON.stringify(out, null, 2));
  if (!FILE_MODE) {
    try { await gravarSupabase(out); log("gravado no Supabase (contas_pagar_erp)"); }
    catch (e) { log("ERRO ao gravar no Supabase:", e.message); }
  }
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
