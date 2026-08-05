#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// pluggy_client.mjs — cliente da API da Pluggy (Open Finance) para a coleta da
// Conferência de Caixa.
//
// CREDENCIAIS: nunca ficam no código nem no repositório (que é PÚBLICO). Ficam
// no Keychain, gravadas pelo próprio Athila:
//   security add-generic-password -s pluggy-amgomes -a clientId     -w
//   security add-generic-password -s pluggy-amgomes -a clientSecret -w
// (o -w sem valor faz o terminal pedir a senha sem ecoar na tela)
//
// A apiKey da Pluggy vale 2h — é trocada por clientId/clientSecret a cada
// execução e mantida só em memória. Não gravar em arquivo.
//
// CLI de exploração (é o que se usa para descobrir os itemIds das lojas):
//   node pluggy_client.mjs items
//   node pluggy_client.mjs accounts <itemId>
//   node pluggy_client.mjs tx <accountId> --from 2026-08-04 --to 2026-08-04
//   node pluggy_client.mjs dump                → grava ~/.claude/caixa-arquivos/_dump.json
//
// ⚠️ O dump tem nome de pagador de PIX. Ele mora em ~/.claude/caixa-arquivos/,
// FORA do repositório, e serve só para conferir o formato dos dados. Apague
// depois de usar.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const BASE = "https://api.pluggy.ai";
export const DIR_ARQ = path.join(os.homedir(), ".claude", "caixa-arquivos");
export const CONTAS = path.join(os.homedir(), ".claude", "caixa-contas.json");

// ── credenciais ──────────────────────────────────────────────────────────────
function doKeychain(conta, servico = "pluggy-amgomes") {
  try {
    return execFileSync("/usr/bin/security",
      ["find-generic-password", "-s", servico, "-a", conta, "-w"],
      { encoding: "utf8" }).trim();
  } catch {
    throw new Error(
      "não achei '" + conta + "' no Keychain (serviço " + servico + ").\n" +
      "Grave assim, você mesmo (o terminal pede o valor sem mostrar na tela):\n" +
      "  security add-generic-password -s " + servico + " -a " + conta + " -w");
  }
}

// ── autenticação (apiKey vale 2h) ────────────────────────────────────────────
let _apiKey = null;
export async function apiKey() {
  if (_apiKey) return _apiKey;
  const r = await fetch(BASE + "/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: doKeychain("clientId"), clientSecret: doKeychain("clientSecret") }),
  });
  if (!r.ok) throw new Error("auth da Pluggy falhou (" + r.status + "): " + (await r.text()).slice(0, 300));
  const j = await r.json();
  if (!j.apiKey) throw new Error("auth da Pluggy não devolveu apiKey: " + JSON.stringify(j).slice(0, 300));
  _apiKey = j.apiKey;
  return _apiKey;
}

async function get(rota, params = {}) {
  const url = new URL(BASE + rota);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { "X-API-KEY": await apiKey() } });
  if (!r.ok) throw new Error("GET " + rota + " → " + r.status + ": " + (await r.text()).slice(0, 300));
  return r.json();
}

// ── recursos ─────────────────────────────────────────────────────────────────
export const listarItems = () => get("/items").then(j => j.results || j);
export const verItem = (itemId) => get("/items/" + itemId);
export const listarContas = (itemId) => get("/accounts", { itemId }).then(j => j.results || j);

// Paginado: a Pluggy devolve 20 por página por padrão. Um dia de loja passa
// disso com folga em PIX, então percorre até acabar — parar na primeira página
// perderia lançamentos em silêncio, que é o pior tipo de erro aqui.
export async function listarTransacoes(accountId, from, to) {
  const out = [];
  for (let page = 1; ; page++) {
    const j = await get("/transactions", { accountId, from, to, page, pageSize: 500 });
    const res = j.results || [];
    out.push(...res);
    const total = j.totalPages || 1;
    if (page >= total || !res.length) break;
  }
  return out;
}

// A conexão do Open Finance sincroniza sozinha algumas vezes por dia. Se o
// último updatedAt for anterior ao fechamento da loja, o dia de ontem pode vir
// incompleto — daí o disparo explícito de atualização.
export async function atualizarItem(itemId) {
  const r = await fetch(BASE + "/items/" + itemId, {
    method: "PATCH",
    headers: { "X-API-KEY": await apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!r.ok) throw new Error("PATCH /items/" + itemId + " → " + r.status + ": " + (await r.text()).slice(0, 200));
  return r.json();
}

// ── mapa loja → conexão ──────────────────────────────────────────────────────
// Mora em ~/.claude/caixa-contas.json (fora do repo público). Formato:
// { "L1": { "itemId": "...", "accountId": "...", "instituicao": "InfinitePay" }, ... }
export function lerContas() {
  if (!fs.existsSync(CONTAS)) throw new Error("não achei " + CONTAS + " — rode `node pluggy_client.mjs items` e monte o mapa.");
  return JSON.parse(fs.readFileSync(CONTAS, "utf8"));
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const cmds = {
  async items() {
    const its = await listarItems();
    console.log(its.length + " conexão(ões):\n");
    for (const i of its) {
      console.log("  itemId      " + i.id);
      console.log("  instituição " + (i.connector?.name || "?") + "  (" + (i.connector?.id ?? "?") + ")");
      console.log("  status      " + i.status + (i.executionStatus ? " / " + i.executionStatus : ""));
      console.log("  atualizado  " + (i.lastUpdatedAt || i.updatedAt || "—"));
      if (i.error) console.log("  ERRO        " + JSON.stringify(i.error).slice(0, 200));
      const cs = await listarContas(i.id).catch(e => { console.log("  contas: " + e.message); return []; });
      for (const c of cs) {
        console.log("    conta " + c.id + "  " + c.type + "/" + c.subtype +
                    "  nº " + (c.number || "—") + "  saldo " + c.balance +
                    "  titular " + (c.owner || "—") + "  CNPJ " + (c.taxNumber || "—"));
      }
      console.log("");
    }
    console.log("Monte o mapa em " + CONTAS + " com { loja: {itemId, accountId} }.");
  },

  async accounts([itemId]) { console.log(JSON.stringify(await listarContas(itemId), null, 2)); },

  async tx(args) {
    const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
    const id = args[0];
    const from = opt("--from"), to = opt("--to");
    const ts = await listarTransacoes(id, from, to);
    console.log(ts.length + " lançamento(s) de " + from + " a " + to + "\n");
    for (const t of ts) {
      console.log([t.date, t.type, String(t.amount).padStart(10), (t.category || "—"), t.description].join("  "));
    }
  },

  // Dump completo para eu conferir o formato real antes de escrever o conversor.
  async dump() {
    fs.mkdirSync(DIR_ARQ, { recursive: true });
    const hoje = new Date();
    const d = new Date(hoje); d.setDate(d.getDate() - 7);
    const iso = x => x.toISOString().slice(0, 10);
    const saida = { geradoEm: new Date().toISOString(), items: [] };
    for (const i of await listarItems()) {
      const contas = await listarContas(i.id);
      const bloco = { id: i.id, conector: i.connector?.name, status: i.status,
                      lastUpdatedAt: i.lastUpdatedAt, contas: [] };
      for (const c of contas) {
        bloco.contas.push({
          id: c.id, type: c.type, subtype: c.subtype, number: c.number,
          balance: c.balance, owner: c.owner, taxNumber: c.taxNumber,
          transacoes: await listarTransacoes(c.id, iso(d), iso(hoje)),
        });
      }
      saida.items.push(bloco);
    }
    const arq = path.join(DIR_ARQ, "_dump.json");
    fs.writeFileSync(arq, JSON.stringify(saida, null, 2));
    console.log("gravado em " + arq + " (" + (fs.statSync(arq).size / 1024).toFixed(0) + " KB)");
    console.log("⚠️ tem nome de pagador de PIX — apague depois de usar.");
  },
};

if (import.meta.url === "file://" + process.argv[1]) {
  const [cmd, ...resto] = process.argv.slice(2);
  const fn = cmds[cmd];
  if (!fn) { console.error("comandos: " + Object.keys(cmds).join(" | ")); process.exit(2); }
  fn(resto).catch(e => { console.error("❌ " + (e.message || e)); process.exit(1); });
}
