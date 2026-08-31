#!/usr/bin/env node
// Roster de vendedores com CÓDIGO (proxy de ordem de cadastro = tempo de casa)
// pras 4 lojas, via o service REST de performance (mesma sessão, sem trocar empresa).
// Janela larga p/ pegar todos os ativos no ano. Read-only.
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = process.env.MICROVIX_PROFILE || join(homedir(), ".claude", "microvix-profile");
const log = (m) => process.stderr.write(`[roster] ${m}\n`);
const LOJA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log, tokenOpcional: true });
  const out = await page.evaluate(async ({ lojaMap }) => {
    const result = {};
    for (const empStr of Object.keys(lojaMap)) {
      const emp = parseInt(empStr, 10);
      const r = await fetch("/gestor_web/faturamento/relatorios/performance_por_vendedor/performance_por_vendedor_service.asp", {
        method: "POST", credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "multipart/form-data" },
        body: JSON.stringify({ EmpresasSelecionadasParam: String(emp), DataInicial: "01/01/2026", DataFinal: "28/08/2026", ConsiderarEntradaGarantiaNacional: true, op: "Listar" }),
      });
      const txt = await r.text();
      let rows; try { rows = JSON.parse(txt); } catch { result[lojaMap[empStr]] = { error: "parse", status: r.status }; continue; }
      result[lojaMap[empStr]] = rows.map(x => ({ raw: (x.nome_vendedor || "").trim(), vendas: x.vlr_vendas, qt: x.qtde_vendas_sem_devolucao || x.qtde_vendas }))
        .filter(x => x.raw && !/^Total/i.test(x.raw));
    }
    return result;
  }, { lojaMap: LOJA });
  console.log(JSON.stringify(out, null, 1));
} catch (e) {
  log(`ERRO: ${e.code || ""} ${e.message}`); process.exitCode = 1;
} finally { await ctx.close().catch(() => {}); }
