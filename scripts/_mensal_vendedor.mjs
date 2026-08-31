#!/usr/bin/env node
// Faturamento MÊS A MÊS por vendedora (Jan-Ago/2026) pras 4 lojas.
// Dá ritmo real (R$/mês ativo) + mês de 1ª e última venda (proxy de tempo de casa/saída).
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = process.env.MICROVIX_PROFILE || join(homedir(), ".claude", "microvix-profile");
const log = (m) => process.stderr.write(`[mensal] ${m}\n`);
const LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const MESES = [
  ["01/01/2026","31/01/2026","01"],["01/02/2026","28/02/2026","02"],
  ["01/03/2026","31/03/2026","03"],["01/04/2026","30/04/2026","04"],
  ["01/05/2026","31/05/2026","05"],["01/06/2026","30/06/2026","06"],
  ["01/07/2026","31/07/2026","07"],["01/08/2026","28/08/2026","08"],
];
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log, tokenOpcional: true });
  const out = await page.evaluate(async ({ lojaMap, meses }) => {
    const PSEUDO = /VENDEDOR PADRAO|VENDEDOR EXTERNO|^LOJA /i;
    const norm = s => (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().trim();
    const res = {}; // res[loja][NOME] = {mes: vendas}
    for (const empStr of Object.keys(lojaMap)) {
      const emp = parseInt(empStr,10); const loja = lojaMap[empStr]; res[loja] = {};
      for (const [di,df,mk] of meses) {
        let rows;
        try {
          const r = await fetch("/gestor_web/faturamento/relatorios/performance_por_vendedor/performance_por_vendedor_service.asp", {
            method:"POST", credentials:"include", signal: AbortSignal.timeout(20000),
            headers:{Accept:"application/json","Content-Type":"multipart/form-data"},
            body: JSON.stringify({ EmpresasSelecionadasParam:String(emp), DataInicial:di, DataFinal:df, ConsiderarEntradaGarantiaNacional:true, op:"Listar" }),
          });
          rows = JSON.parse(await r.text());
        } catch { continue; }
        for (const x of rows) {
          const raw = (x.nome_vendedor||"").trim();
          if (!raw || PSEUDO.test(raw) || /^Total/i.test(raw)) continue;
          const nome = norm(raw).split(" ").slice(0,2).join(" ");
          const v = Math.round(parseFloat(String(x.vlr_vendas).replace(",","."))||0);
          if (v<=0) continue;
          (res[loja][nome] = res[loja][nome] || {})[mk] = v;
        }
      }
    }
    return res;
  }, { lojaMap: LOJA, meses: MESES });
  console.log(JSON.stringify(out));
} catch (e) { log(`ERRO: ${e.code||""} ${e.message}`); process.exitCode = 1; }
finally { await ctx.close().catch(()=>{}); }
