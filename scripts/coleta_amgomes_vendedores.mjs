#!/usr/bin/env node
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { garantirSessao } from "./microvix_auth.mjs";

const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const LOJA_POR_EMPRESA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };

function logErr(msg) { process.stderr.write(`[vend] ${msg}\n`); }

const di = process.argv[2] || "01/05/2026";
const df = process.argv[3] || "26/05/2026";

const t0 = Date.now();
logErr(`launch headless...`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());

try {
  await garantirSessao(page, { log: logErr });
} catch (e) {
  logErr(`garantirSessao falhou: ${e.code || ""} ${e.message}`);
  await ctx.close().catch(() => {});
  process.exit(e.code === "NO_CREDS" || e.code === "LOGIN_FAIL" ? 2 : 1);
}

logErr(`buscando vendedores via API REST para ${di}–${df}`);
const out = await page.evaluate(async ({di, df, lojaMap}) => {
  const token = localStorage.getItem("api_token_lma");
  if (!token) throw new Error("token ausente");
  const result = {};
  for (const empStr of Object.keys(lojaMap)) {
    const emp = parseInt(empStr, 10);
    const loja = lojaMap[empStr];
    const r = await fetch(
      "/gestor_web/faturamento/relatorios/performance_por_vendedor/performance_por_vendedor_service.asp",
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
        body: JSON.stringify({
          EmpresasSelecionadasParam: String(emp),
          DataInicial: di,
          DataFinal: df,
          ConsiderarEntradaGarantiaNacional: true,
          op: "Listar",
        }),
      }
    );
    if (r.status !== 200) { result[loja] = {error: `HTTP ${r.status}`}; continue; }
    const txt = await r.text();
    if (/Sess.o expirada/i.test(txt)) { result[loja] = {error: "TOKEN_EXPIRED"}; continue; }
    let rows;
    try { rows = JSON.parse(txt); } catch (e) { result[loja] = {error: "parse"}; continue; }
    const dados = [];
    for (const row of rows) {
      const nomeFull = (row.nome_vendedor || "").trim();
      if (!nomeFull) continue;
      if (/VENDEDOR\s*PADR(AO|ÃO)/i.test(nomeFull)) continue;
      if (/^Total/i.test(nomeFull)) continue;
      const v = Math.round(parseFloat(String(row.vlr_vendas).replace(",", ".")) || 0);
      const t = parseInt(row.qtde_vendas_sem_devolucao || row.qtde_vendas || 0, 10);
      const pecas = parseInt(row.qtde_pecas || 0, 10);
      const tm = t > 0 ? Math.round(v / t) : 0;
      const n = nomeFull.replace(/\s*\(\d+\)\s*$/, "").split(" ").slice(0, 2).join(" ");
      dados.push({ n, v, t, tm, pecas });
    }
    dados.sort((a, b) => b.v - a.v);
    result[loja] = dados;
  }
  return result;
}, { di, df, lojaMap: LOJA_POR_EMPRESA });

logErr(`OK em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const [loja, arr] of Object.entries(out)) {
  if (Array.isArray(arr)) logErr(`  ${loja}: ${arr.length} vendedores`);
  else logErr(`  ${loja}: ${JSON.stringify(arr)}`);
}
process.stdout.write(JSON.stringify(out));
await ctx.close().catch(() => {});
process.exit(0);
