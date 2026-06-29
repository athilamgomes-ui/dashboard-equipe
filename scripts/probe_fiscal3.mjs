#!/usr/bin/env node
// read-only: dump completo das 8 ConfigTributarias (nome, sigla, ST?, NCMs, sample detalhamento)
import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { garantirSessao } from "./microvix_auth.mjs";
const PROFILE_DIR = join(homedir(), ".claude", "microvix-profile");
const URL_NFE = "https://linx.microvix.com.br/gestor_web/produtos/entrada_nfe/index.html";
const log = m => process.stderr.write(`[p3] ${m}\n`);
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: true, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
try {
  await garantirSessao(page, { log });
  await page.goto(URL_NFE, { waitUntil: "domcontentloaded", timeout: 45000 });
  let token = null;
  for (let i = 0; i < 30; i++) { token = await page.evaluate(() => localStorage.getItem("token_api")).catch(() => null); if (token) break; await page.waitForTimeout(500); }
  if (!token) throw new Error("sem token");
  const data = await page.evaluate(async () => {
    const token = localStorage.getItem("token_api");
    const FIS = "https://fiscalwebapi-prod.microvix.com.br";
    const H = { Authorization: token, "Content-Type": "application/json" };
    const r = await fetch(FIS + "/api/ConfigTributaria/ListarConfigsTributarias", { method: "POST", headers: H, body: "{}" });
    const cfgs = await r.json();
    return cfgs.map(c => ({
      id: c.IdConfigTributaria,
      desc: c.DescricaoConfigTributaria,
      sigla: c.SiglaConfigTributaria,
      uf: c.UfEmpresa,
      sistema: c.SistemaTributacao,
      origem: c.OrigemMercadoria,
      empresas: (c.Empresas || []).map(e => e && (e.IdEmpresa ?? e.Id ?? e.Codigo ?? e)),
      qtdNcms: (c.Ncms || []).length,
      ncms: (c.Ncms || []).map(n => n && (n.Ncm ?? n.Codigo ?? n.Numero ?? n)),
      qtdCests: (c.Cests || []).length,
      qtdDetalhamentos: (c.Detalhamentos || []).length,
      detSample: (c.Detalhamentos || []).slice(0, 2),
    }));
  });
  writeFileSync("/tmp/config_tributaria.json", JSON.stringify(data, null, 1));
  // resumo enxuto no stdout
  for (const c of data) {
    log(`#${c.id} [${c.sigla}] ${c.desc} | uf=${JSON.stringify(c.uf)} sist=${JSON.stringify(c.sistema)} | empresas=${JSON.stringify(c.empresas)} | NCMs=${c.qtdNcms} Cests=${c.qtdCests} Det=${c.qtdDetalhamentos}`);
  }
  // sample de detalhamento da 1a config p/ ver campos CST/aliquota
  process.stdout.write(JSON.stringify({ resumo: data.map(c => ({ id: c.id, sigla: c.sigla, desc: c.desc, qtdNcms: c.qtdNcms, ncms: c.ncms.slice(0, 40) })), detSample: data[0].detSample }, null, 1));
} catch (e) { log("FALHA " + e.message); process.stdout.write(JSON.stringify({ erro: String(e.message) })); }
finally { await ctx.close().catch(() => {}); }
