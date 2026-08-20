/**
 * estoque_ajuste_core.mjs — núcleo de ESCRITA de saldo no Microvix.
 *
 * Compartilhado por `ajusta_saldo_estoque.mjs` (lote autorizado a partir de arquivo) e
 * `aplica_contagem_estoque.mjs` (contagem conferida na tela, via Supabase). As três armadilhas
 * abaixo são sutis e caras — por isso moram num lugar só:
 *
 *  1. Os campos do form de `ajuste_qtde.asp` NÃO existem em `page.evaluate` nem em
 *     `waitForSelector`: só aparecem varrendo `page.frames()`, e ~2 s depois do domcontentloaded.
 *  2. Trocar de empresa não é instantâneo: `trigger('change')` recarrega a home, e 4,5 s fixos não
 *     bastam. Tem que confirmar pela própria tela (`hdn_bloqueio_loja_logada`) e insistir.
 *  3. Sem a trava de empresa, um lote da L4 é gravado na L1.
 *
 * O log é append-only e mora em `dados_estoque/ajustes_saldo.json` — é a prova do que foi feito e
 * a fonte que o painel usa para marcar quem voltou a ficar negativo depois do zeramento.
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
export const D_DIR = path.join(DIR, "..", "dados_estoque");
export const P_LOG = path.join(D_DIR, "ajustes_saldo.json");
export const LOJA_TO_EMP = { L1: 1, L3: 3, L4: 4, L5: 10 };

const URL_HOME = "https://linx.microvix.com.br/v4/home/index.asp";
const URL_AJUSTE = "https://linx.microvix.com.br/gestor_web/produtos/ajuste_qtde.asp";
const URL_CONFIRMA = "https://linx.microvix.com.br/gestor_web/produtos/confirma_ajuste_qtde.asp";
const CLIENTE_LOGADO = "11129";

const numBR = s => { const v = parseFloat(String(s ?? "").replace(/\./g, "").replace(",", ".")); return isNaN(v) ? null : v; };

export function abrirLog() {
  fs.mkdirSync(D_DIR, { recursive: true });
  const r = fs.existsSync(P_LOG) ? JSON.parse(fs.readFileSync(P_LOG, "utf8")) : { ajustes: [] };
  r.ajustes = r.ajustes || [];
  return r;
}
export const gravarLog = r => fs.writeFileSync(P_LOG, JSON.stringify(r, null, 1));

/** Lê a tela de ajuste do produto. Varre frames e insiste até o form montar. */
export async function lerAjuste(page, cod) {
  await page.goto(`${URL_AJUSTE}?produto=${encodeURIComponent(cod)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  for (let tent = 0; tent < 12; tent++) {
    await page.waitForTimeout(700);
    for (const f of page.frames()) {
      const r = await f.evaluate(() => {
        const g = n => { const e = document.querySelector(`[name=${n}]`); return e ? e.value : null; };
        if (!document.querySelector("[name=novo_saldo]")) return null;
        return {
          novo_saldo: g("novo_saldo"), velho_saldo: g("velho_saldo"),
          empresa: g("hdn_bloqueio_loja_logada"), cliente: g("hdn_bloqueio_empresa_cliente_logado"),
          deposito: g("deposito"), nome: g("nome_produto"),
        };
      }).catch(() => null);
      if (r) return r;
    }
  }
  return { novo_saldo: null, empresa: null };
}

/** Troca a empresa e CONFIRMA pela tela de ajuste. Devolve a leitura de confirmação. */
export async function trocarEmpresa(page, E, codTeste, log = () => {}) {
  for (let tent = 1; tent <= 4; tent++) {
    await page.goto(URL_HOME, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1200);
    const ok = await page.evaluate(E => {
      const s = document.getElementById("topbar_sel_empresa_portal_usuario");
      if (!s || !window.jQuery) return false;
      window.jQuery(s).val(String(E)); window.jQuery(s).trigger("change");
      return true;
    }, E).catch(() => false);
    if (!ok) throw new Error("select de empresa não encontrado");
    await page.waitForTimeout(5000);
    const t = await lerAjuste(page, codTeste);
    if (String(t.empresa) === String(E)) return t;
    log(`  troca p/ empresa ${E} não pegou (ERP diz ${t.empresa}) — tentativa ${tent}/4`);
    await page.waitForTimeout(3000);
  }
  return { empresa: null };
}

async function escrever(ctx, item, atual, emp) {
  const body = new URLSearchParams({
    produto: String(item.cod),
    nome_produto: String(item.desc || "ajuste"),
    controla_localizacao_wms: "N",
    deposito: "1",
    velho_saldo: String(Math.trunc(atual)),
    novo_saldo: String(item.novo_saldo),
    motivo_ajuste: item.motivo,
    hdn_bloqueio_empresa_cliente_logado: CLIENTE_LOGADO,
    hdn_bloqueio_loja_logada: String(emp),
  });
  const r = await ctx.request.post(URL_CONFIRMA, {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: body.toString(), timeout: 45000,
  });
  return r.status();
}

/**
 * Aplica um plano [{loja, cod, desc, novo_saldo, motivo, grupo, ref}] de UMA loja.
 * Chama onItem(resultado) a cada produto (para o chamador atualizar Supabase, etc).
 */
export async function aplicarLoja(ctx, page, loja, itens, { dry = false, log = () => {}, onItem = null } = {}) {
  const emp = LOJA_TO_EMP[loja];
  const registro = abrirLog();
  let ok = 0, erro = 0, pulado = 0;

  log(`── ${loja} (empresa ${emp}) · ${itens.length} produtos${dry ? " · DRY-RUN" : ""}`);
  const teste = await trocarEmpresa(page, emp, itens[0].cod, log);
  if (String(teste.empresa) !== String(emp)) {
    log(`ABORTADO: a tela de ajuste diz empresa=${teste.empresa}, esperado ${emp}. Nenhuma escrita feita.`);
    return { ok: 0, erro: itens.length, pulado: 0, abortado: true };
  }
  log(`empresa confirmada pelo ERP (hdn_bloqueio_loja_logada=${teste.empresa})`);

  for (const item of itens) {
    const t0 = Date.now();
    let atual = null;
    try {
      const tela = await lerAjuste(page, item.cod);
      atual = numBR(tela.novo_saldo);
      if (atual == null) { log(`  ${item.cod}: saldo não lido — PULADO`); pulado++; continue; }
      if (tela.empresa != null && String(tela.empresa) !== String(emp)) { log(`  ${item.cod}: ERP mudou de empresa — PULADO`); pulado++; continue; }
      if (atual === Number(item.novo_saldo)) {
        log(`  ${item.cod}: já está em ${atual} — PULADO`);
        pulado++;
        if (onItem) await onItem({ ...item, saldo_anterior: atual, saldo_confirmado: atual, ok: true, jaEstava: true });
        continue;
      }
      if (dry) { log(`  [dry] ${loja} ${item.cod} ${String(item.desc).slice(0, 28)}: ${atual} → ${item.novo_saldo}`); ok++; continue; }

      const status = await escrever(ctx, item, atual, emp);
      const conf = await lerAjuste(page, item.cod);
      const depois = numBR(conf.novo_saldo);
      const bateu = depois === Number(item.novo_saldo);
      const reg = {
        quando: new Date().toISOString(), loja, empresa: emp, cod: String(item.cod), desc: item.desc,
        grupo: item.grupo || null, ref: item.ref ?? null, saldo_anterior: atual, saldo_alvo: Number(item.novo_saldo),
        saldo_confirmado: depois, ok: bateu, http: status, motivo: item.motivo, ms: Date.now() - t0,
      };
      registro.ajustes.push(reg);
      gravarLog(registro);                       // à prova de queda: grava a CADA item
      if (onItem) await onItem(reg);
      if (bateu) { ok++; if (ok % 10 === 0) log(`  ...${ok} ajustados`); }
      else { erro++; log(`  ${item.cod}: esperado ${item.novo_saldo}, ERP ficou ${depois} (http ${status})`); }
    } catch (e) {
      erro++;
      const reg = { quando: new Date().toISOString(), loja, cod: String(item.cod), desc: item.desc,
        grupo: item.grupo || null, ref: item.ref ?? null, saldo_anterior: atual, saldo_alvo: Number(item.novo_saldo),
        ok: false, falha: String(e.message).slice(0, 160) };
      registro.ajustes.push(reg); gravarLog(registro);
      if (onItem) await onItem(reg);
      log(`  ${item.cod} FALHOU: ${e.message.split("\n")[0]}`);
      if (/browser has been closed|Target closed/i.test(e.message)) throw e;
    }
  }
  return { ok, erro, pulado, abortado: false };
}
