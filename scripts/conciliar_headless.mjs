#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// conciliar_headless.mjs — roda o MOTOR de conciliação do painel de Conferência
// de Caixa FORA do navegador.
//
// Por que existe: `conferencia_caixa_app.js` é código de página — a conciliação
// só acontecia quando uma pessoa arrastava o CSV na aba "Conciliação da
// maquininha". Sem isto não há como automatizar a rotina diária (baixar
// relatório → conferir → avisar) nem depurar o casamento sem clicar na tela.
//
// ⚠️ REGRA: este arquivo NÃO reimplementa o motor. Ele carrega o MESMO
// `conferencia_caixa_app.js` num contexto `vm` com stubs de document/PUBLICO e
// chama `processarConteudo()`. Qualquer melhoria no casamento vale para os dois
// (painel e robô) automaticamente. Se um dia for tentador copiar uma função
// para cá: não copie — as duas cópias divergem e o painel passa a mostrar um
// resultado diferente do que o robô mandou no resumo.
//
// Uso:
//   node conciliar_headless.mjs --loja L5 arquivo1.csv arquivo2.csv
//   node conciliar_headless.mjs --dir ~/.claude/caixa-arquivos        (loja pelo NOME)
//   ... --json resultado.json     grava o resultado completo (com os CSVs) no arquivo
//
// Saída em stdout: resumo legível. Código de saída 0 mesmo com divergência —
// divergência é resultado, não erro. Só sai != 0 se não deu para rodar.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, "..");
const APP = path.join(AQUI, "conferencia_caixa_app.js");
const RAW = path.join(REPO, "conferencia_caixa_raw.json");

// ── stubs de navegador ───────────────────────────────────────────────────────
// O app roda 3 coisas no topo do arquivo (selo de data, releitura da senha da
// sessão, seletor de loja) e todo o resto só dentro de `iniciar()`, que NÃO
// chamamos. Então basta um elemento que aceite qualquer propriedade.
function elementoFake() {
  const alvo = {
    textContent: "", innerHTML: "", value: "", style: {},
    dataset: {}, classList: { add() {}, remove() {}, contains: () => false },
    addEventListener() {}, appendChild() {}, click() {},
    querySelectorAll: () => [], querySelector: () => null,
  };
  return new Proxy(alvo, {
    get(o, k) {
      if (k in o) return o[k];
      return typeof k === "string" ? undefined : o[k];
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}

function criarContexto(D) {
  const ctx = {
    console,
    crypto: globalThis.crypto,
    TextEncoder, TextDecoder, URLSearchParams,
    atob: globalThis.atob, btoa: globalThis.btoa,
    setTimeout, clearTimeout, setInterval, clearInterval,
    // O painel busca histórico no Supabase; no robô isso é responsabilidade de
    // quem chama (para não gravar sem querer durante um teste).
    fetch: async () => { throw new Error("fetch desligado no motor headless"); },
    location: { search: "?teste=1" },   // MODO_TESTE=true → nunca grava sozinho
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: {
      getElementById: () => elementoFake(),
      querySelector: () => elementoFake(),
      querySelectorAll: () => [],
      createElement: () => elementoFake(),
      addEventListener() {},
    },
    PUBLICO: { geradoEmBR: "", janela: { ini: "", fim: "" } },
    PAYLOAD: { salt: "", iv: "", data: "", iters: 250000 },
    SUPA_URL: "", SUPA_TAB: "", supaHead: () => ({}),
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(APP, "utf8"), ctx, { filename: "conferencia_caixa_app.js" });
  // `D` é `let` no topo do app: vive no escopo léxico do contexto, não como
  // propriedade do global. Por isso a injeção é uma atribuição executada NO
  // MESMO contexto — `ctx.D = ...` não teria efeito nenhum.
  ctx.__D = D;
  vm.runInContext("D = __D;", ctx);
  return ctx;
}

// ── carga do lado do ERP ─────────────────────────────────────────────────────
export function carregarMotor(rawPath = RAW) {
  if (!fs.existsSync(rawPath)) throw new Error("não achei " + rawPath + " — rode atualizar_conferencia_caixa.sh antes.");
  const D = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  if (!D.movimento) throw new Error("o raw JSON não tem `movimento` (Movimento Diário analítico).");
  return criarContexto(D);
}

// ── conciliação de uma loja ──────────────────────────────────────────────────
// `arquivos`: [{nome, txt}]. Espelha `carregarArquivos()` do painel: analisa num
// objeto à parte e só funde o que passou, para um arquivo recusado não deixar
// meia conferência no resultado.
export function conciliar(ctx, loja, arquivos) {
  const alvo = { loja, arquivos: [] };
  const erros = [];
  for (const { nome, txt } of arquivos) {
    try {
      const tmp = { loja, arquivos: [] };
      ctx.__tmp = tmp; ctx.__lj = loja; ctx.__nome = nome; ctx.__txt = txt;
      vm.runInContext("processarConteudo(__tmp, __lj, __nome, __txt);", ctx);
      if (tmp.cartao) alvo.cartao = tmp.cartao;
      if (tmp.pix) { alvo.pix = tmp.pix; alvo.conta = tmp.conta; }
      alvo.arquivos.push(...tmp.arquivos);
    } catch (e) {
      // A mensagem do app vem com <b> porque é feita para a tela.
      erros.push({ nome, erro: String(e.message || e).replace(/<[^>]+>/g, "") });
    }
  }
  alvo.erros = erros;
  return alvo;
}

// ── resumo (é o que vira mensagem no Telegram) ───────────────────────────────
const R$ = n => "R$ " + (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const soma = (arr, f) => (arr || []).reduce((a, x) => a + f(x), 0);

function resumoForma(r) {
  if (!r) return null;
  return {
    rotulo: r.rotulo, ini: r.ini, fim: r.fim,
    totERP: r.totERP, totExt: r.totExt, dif: r.totExt - r.totERP,
    nERP: r.nERP, nExt: r.nExt,
    // Ordem = gravidade. `soExterno` é o caso que tira dinheiro do lugar:
    // a adquirente cobrou o cliente e no ERP não existe venda.
    semVendaNoERP:   { n: (r.soExterno || []).length, v: soma(r.soExterno, t => t.v),
                       itens: (r.soExterno || []).map(t => ({ d: t.d, h: t.h, v: t.v, meio: t.meio, dica: t.dica || null })) },
    semCobranca:     { n: (r.soErp || []).length, v: soma(r.soErp, e => e[r.campo]),
                       itens: (r.soErp || []).map(e => ({ d: e.d, doc: e.doc, v: e[r.campo], dica: e.dica || null })) },
    formaTrocada:    { n: (r.trocadas || []).length, v: soma(r.trocadas, x => x.t.v) },
    centavos:        { n: (r.centavos || []).length, v: soma(r.centavos, x => Math.abs(x.dv || 0)) },
    agrupadas:       { n: (r.agrupadas || []).length },
    divididas:       { n: (r.divididas || []).length },
    foraJanela:      { n: (r.foraJanela || []).length, v: soma(r.foraJanela, t => t.v),
                       motivos: [...new Set((r.foraJanela || []).map(t => t.motivo).filter(Boolean))] },
  };
}

export function resumir(alvo) {
  const cartao = resumoForma(alvo.cartao);
  const pix = resumoForma(alvo.pix);
  const graves = [cartao, pix].filter(Boolean)
    .reduce((a, f) => a + f.semVendaNoERP.n + f.semCobranca.n, 0);
  return {
    loja: alvo.loja,
    arquivos: (alvo.arquivos || []).map(a => ({ nome: a.nome, tipo: a.tipo })),
    erros: alvo.erros || [],
    cartao, pix, conta: alvo.conta || null,
    graves,
    ok: graves === 0 && (alvo.erros || []).length === 0,
  };
}

export function textoResumo(r) {
  const L = [];
  const cab = r.ok ? "✅ " + r.loja : "⚠️ " + r.loja;
  L.push(cab + (r.cartao || r.pix ? "  (" + ((r.cartao || r.pix).ini) + " a " + ((r.cartao || r.pix).fim) + ")" : ""));
  for (const f of [r.cartao, r.pix].filter(Boolean)) {
    L.push("  " + f.rotulo + ": maquininha " + R$(f.totExt) + " × ERP " + R$(f.totERP) +
           (Math.abs(f.dif) >= 0.01 ? "  → dif. " + R$(f.dif) : "  → bate"));
    if (f.semVendaNoERP.n) L.push("    ❗ " + f.semVendaNoERP.n + " cobrada(s) sem venda no ERP — " + R$(f.semVendaNoERP.v));
    if (f.semCobranca.n)   L.push("    ❗ " + f.semCobranca.n + " venda(s) no ERP sem cobrança — " + R$(f.semCobranca.v));
    if (f.formaTrocada.n)  L.push("    • " + f.formaTrocada.n + " com forma de pagamento trocada");
    if (f.centavos.n)      L.push("    • " + f.centavos.n + " diferença(s) de centavos");
    if (f.agrupadas.n)     L.push("    • " + f.agrupadas.n + " cobrança(s) agrupada(s)");
    if (f.divididas.n)     L.push("    • " + f.divididas.n + " venda(s) paga(s) em 2+ cartões");
    if (f.foraJanela.n)    L.push("    ⏳ " + f.foraJanela.n + " fora do que o painel tem do ERP (" + f.foraJanela.motivos.join("; ") + ")");
  }
  if (r.conta) L.push("  conta: depósitos " + R$(r.conta.depositos) + " (" + r.conta.nDepositos + ")" +
                      " · PIX recebido " + R$(r.conta.pixRecebido) +
                      (r.conta.estornos ? " · estornos " + R$(r.conta.estornos) : ""));
  for (const e of r.erros) L.push("  ❌ " + e.nome + ": " + e.erro);
  return L.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const dir = opt("--dir");
  const lojaFixa = opt("--loja");
  const saidaJson = opt("--json");
  const rawPath = opt("--raw") || RAW;

  let arquivos = argv.filter(a => /\.csv$/i.test(a));
  if (dir) {
    const d = dir.replace(/^~/, process.env.HOME);
    arquivos = fs.readdirSync(d).filter(f => /\.csv$/i.test(f)).map(f => path.join(d, f));
  }
  if (!arquivos.length) {
    console.error("uso: node conciliar_headless.mjs --loja L5 arq.csv [arq2.csv]");
    console.error("     node conciliar_headless.mjs --dir ~/.claude/caixa-arquivos");
    process.exit(2);
  }

  const ctx = carregarMotor(rawPath);
  const D = ctx.__D;
  console.log("ERP: movimento de " + D.movimentoPeriodo.ini + " a " + D.movimentoPeriodo.fim +
              " · coletado em " + new Date(D.geradoEm).toLocaleString("pt-BR"));

  // Agrupa por loja. O relatório da adquirente NÃO diz de que empresa é — a
  // única marca confiável é o nome do arquivo (mesma regra do painel).
  const porLoja = {};
  for (const a of arquivos) {
    const nome = path.basename(a);
    ctx.__nomeArq = nome;
    const dono = lojaFixa || vm.runInContext("lojaDoNome(__nomeArq)", ctx);
    if (!dono) {
      console.error("❌ " + nome + ": não dá para saber de que loja é. Comece o nome pela loja " +
                    "(ex.: \"L5 maquininha 04-08.csv\") ou passe --loja.");
      process.exitCode = 3;
      continue;
    }
    (porLoja[dono] ||= []).push({ nome, txt: fs.readFileSync(a, "utf8") });
  }

  const saida = [];
  for (const loja of Object.keys(porLoja).sort()) {
    const alvo = conciliar(ctx, loja, porLoja[loja]);
    const r = resumir(alvo);
    saida.push({ resumo: r, alvo });
    console.log("");
    console.log(textoResumo(r));
  }

  if (saidaJson) {
    fs.writeFileSync(saidaJson, JSON.stringify(saida.map(s => s.resumo), null, 2));
    console.log("\nresumo gravado em " + saidaJson);
  }
}

if (import.meta.url === "file://" + process.argv[1]) main();
