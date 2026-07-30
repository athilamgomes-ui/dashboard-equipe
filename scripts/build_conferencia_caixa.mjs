#!/usr/bin/env node
/**
 * build_conferencia_caixa.mjs — ÚNICO escritor de conferencia_caixa.html.
 * Lê conferencia_caixa_raw.json (gerado por coleta_conferencia_caixa.mjs) e
 * renderiza o painel com os dados EMBUTIDOS (padrão vendas/compras/financeiro).
 *
 * Uso: node build_conferencia_caixa.mjs
 * Exit: 0 ok · 20 build falhou (o .sh restaura a versão anterior).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

// ── senha do painel (NUNCA vai pro repo): env ou Keychain (amgomes-caixa / caixa-web) ──
// Criada com a mesma senha do painel Financeiro, mas em entrada própria — dá pra rotacionar
// uma sem mexer na outra.
function getSenha() {
  if (process.env.CAIXA_SENHA) return process.env.CAIXA_SENHA;
  for (const [conta, servico] of [["caixa-web", "amgomes-caixa"], ["financeiro-web", "amgomes-financeiro"]]) {
    try {
      return execSync(`security find-generic-password -a ${conta} -s ${servico} -w`,
        { stdio: ["ignore", "pipe", "ignore"] }).toString().replace(/\n$/, "");
    } catch { /* tenta a próxima */ }
  }
  return null;
}
const ITERS = 200000;
function cifrar(plain, senha) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(senha, salt, ITERS, 32, "sha256");
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return {
    salt: salt.toString("base64"), iv: iv.toString("base64"),
    data: Buffer.concat([ct, c.getAuthTag()]).toString("base64"), iters: ITERS,
  };
}
const RAIZ = path.join(DIR, "..");
const RAW = path.join(RAIZ, "conferencia_caixa_raw.json");
const OUT = path.join(RAIZ, "conferencia_caixa.html");

// Só publica de julho/2026 em diante: junho foi coletado antes da correção de encoding
// (cartão/crediário/convênio faltando) e o Athila pediu para tratar o passado depois.
// Quando junho for recoletado, é só apagar esta constante.
const DATA_MINIMA = "2026-07-01";

// ⚠️ O JavaScript do painel mora em conferencia_caixa_app.js e é injetado como VALOR.
// Não voltar a escrevê-lo dentro do template literal deste arquivo: o Node interpreta as
// sequências de escape e come as barras invertidas dos regexes — `/(\d{2})\/(\d{2})/`
// virava `/(d{2})/(d{2})/`, quebrando a página com "Invalid or unexpected token".
// Aconteceu em 30/07 ao acrescentar a aba de conciliação.
const APP_JS = fs.readFileSync(path.join(DIR, "conferencia_caixa_app.js"), "utf8");

const raw = JSON.parse(fs.readFileSync(RAW, "utf8"));
if (!raw.dias || !Object.keys(raw.dias).length) {
  console.error("conferencia_caixa_raw.json sem dias coletados");
  process.exit(20);
}

const LOJAS = [
  { key: "L1", nome: "Casa da Beleza", cidade: "Altamira", cor: "#d97706" },
  { key: "L3", nome: "Casa da Beleza", cidade: "Itaituba", cor: "#0891b2" },
  { key: "L4", nome: "MissBeleza", cidade: "Altamira", cor: "#dc2626" },
  { key: "L5", nome: "MissBeleza", cidade: "Santarém", cor: "#6366f1" },
];

// ── Monta a série por loja/dia, já limpa para o front ──
const dias = Object.values(raw.dias)
  .filter(d => d && d.data && d.data >= DATA_MINIMA)
  .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.loja.localeCompare(b.loja)));

const F = (o, k) => ({
  calc: o?.formas?.[k]?.calc ?? 0,
  inf: o?.formas?.[k]?.inf ?? 0,
  dif: o?.formas?.[k]?.dif ?? 0,
});

// ── CONFERÊNCIA DE CAIXA: o "informado" em dinheiro é SALDO, não movimento ──────
// O "Valor Calculado" do ERP é o dinheiro finalizado nas vendas do dia (um fluxo).
// O "Valor Informado" é o que estava FISICAMENTE no caixa no fim do dia (um saldo).
// Comparar um com o outro direto não significa nada — o teste correto é:
//
//     caixa_esperado = caixa_de_ontem + dinheiro_do_dia + suprimentos − sangria
//     diferença      = caixa_informado − caixa_esperado
//
// Conferido com o Athila em 29/07 e validado nos dados: L4 fecha com deriva de
// R$ 1,95 no mês inteiro. É por isso que cartão e PIX sempre "batiam" (são fluxo
// contra fluxo, preenchidos pelo próprio ERP) e o dinheiro nunca batia.
const TOL = 1.00;   // R$ — abaixo disso é arredondamento de troco, não divergência

function reconciliar(lista) {
  const porLoja = {};
  for (const d of lista) (porLoja[d.loja] = porLoja[d.loja] || []).push(d);

  for (const loja of Object.keys(porLoja)) {
    const dias = porLoja[loja].sort((a, b) => (a.data < b.data ? -1 : 1));
    let caixaAnterior = null, dataAnterior = null;
    // O saldo de partida só vale se o dia anterior foi realmente CONTADO. Se veio de um dia
    // "sem contagem" (informado = sistema), ele é o dinheiro do dia, não a gaveta — usar isso
    // como base acusa sobra/falta que não existe. Aconteceu na L3 em 29/07: primeiro dia em
    // que Itaituba contou de verdade, e a base era o valor espelhado de 28/07 → daria
    // +R$ 647,45 de "sobra" fantasma.
    let baseConfiavel = false;

    for (const d of dias) {
      const f = k => d.formas?.[k] || { calc: 0, inf: 0 };
      const calc = f("dinheiro").calc || 0;
      const inf = f("dinheiro").inf || 0;
      const sangria = f("sangria").calc || 0;
      const suprimento = f("suprimentos").calc || 0;

      d.caixa = { calc, inf, sangria, suprimento, anterior: caixaAnterior, dataAnterior, esperado: null, residuo: null };

      if (d.status === "sem_movimento") { d.conf = "sem_movimento"; continue; }   // caixa não se mexe

      // Ninguém lançou o fechamento: não há o que conferir e a corrente quebra.
      if (d.total.inf === 0 && d.total.calc > 0) {
        d.conf = "nao_fechado";
        caixaAnterior = null; dataAnterior = null; baseConfiavel = false;
        continue;
      }

      // Informado idêntico ao calculado, centavo a centavo. Verificado em 29/07 sobre
      // 45 dias: L1 e L4 divergem em 100% dos dias (contagem real), L3 e L5 coincidem
      // em 100% (0 de 68 dias com qualquer diferença). Nessas duas o fechamento existe
      // no POS, mas está lançado num login que não tem as vendas — o bloco do caixa vem
      // com Valor Calculado zerado —, então a declaração não confronta nada.
      // Não é falta de dinheiro: é conferência que não apura diferença.
      if (Math.abs(inf - calc) < 0.005 && (sangria > 0 || (caixaAnterior || 0) > 0.005)) {
        d.conf = "nao_conferido";
        caixaAnterior = inf; dataAnterior = d.data; baseConfiavel = false;
        continue;
      }

      if (caixaAnterior === null || !baseConfiavel) {
        // Sem saldo de partida contado, não há conferência possível — só registra o dia.
        d.conf = "sem_base";
      } else {
        const esperado = +(caixaAnterior + calc + suprimento - sangria).toFixed(2);
        const residuo = +(inf - esperado).toFixed(2);
        d.caixa.esperado = esperado;
        d.caixa.residuo = residuo;
        d.conf = Math.abs(residuo) <= TOL ? "ok" : "divergente";
      }
      // Dia contado (mesmo divergente) vira base confiável para o dia seguinte.
      caixaAnterior = inf; dataAnterior = d.data; baseConfiavel = true;
    }
  }
  return lista;
}
reconciliar(dias);

// ── Vendas canceladas × vendas refeitas ───────────────────────────────────────
// Cancelar e refazer é rotina de loja (cliente trocou de ideia, errou a forma de
// pagamento). O que interessa é: a venda voltou? e paga como?
// Sinal forte = mesmo valor, mesmo dia, e o documento finalizado logo em seguida —
// medido em julho/2026 na L5, 18 de 23 casos tinham o número EXATAMENTE seguinte.
// ⚠️ Comparar número de documento só vale dentro da MESMA SÉRIE: o movimento diário
// não traz a série, então a proximidade é indício, não prova. Por isso o painel
// classifica a confiança em vez de afirmar.
function casarCanceladas(canceladas, movimento) {
  const saida = {};
  for (const loja of Object.keys(canceladas || {})) {
    const mov = (movimento && movimento[loja]) || [];
    saida[loja] = (canceladas[loja] || []).map(c => {
      const dc = parseInt(c.doc, 10);
      const cands = mov.filter(x => Math.abs(x.v - c.v) <= 0.02 && diffDias(x.d, c.d) <= 1);
      let melhor = null;
      for (const x of cands) {
        const df = parseInt(String(x.doc).split("|")[0], 10);
        const gap = Number.isFinite(df) && Number.isFinite(dc) ? df - dc : null;
        const mesmoDia = x.d === c.d;
        let conf;
        if (mesmoDia && gap !== null && gap > 0 && gap <= 40) conf = "forte";
        else if (mesmoDia && gap !== null && Math.abs(gap) <= 40) conf = "media";
        else if (mesmoDia) conf = "fraca";
        else conf = "fraca";
        const peso = { forte: 3, media: 2, fraca: 1 }[conf];
        if (!melhor || peso > melhor.peso || (peso === melhor.peso && Math.abs(gap ?? 1e9) < Math.abs(melhor.gap ?? 1e9)))
          melhor = { peso, conf, gap, doc: x.doc, data: x.d,
                     formas: formasDe(x), total: x.v };
      }
      // Quando existe verificação fina (data, hora, vendedora e produtos), ela manda:
      // é evidência direta, enquanto a proximidade de documento é só indício.
      if (c.verificacao) {
        const v = c.verificacao;
        // ⚠️ O relatório de cancelamentos às vezes traz a lista de produtos INCOMPLETA
        // (visto na L5: documento de R$ 67,83 listando um único item de R$ 34,90).
        // Exigir conjunto idêntico marcaria "produtos divergentes" por falha do
        // relatório, não por diferença real. O teste honesto é de CONTENÇÃO: todo item
        // da cancelada aparece na refeita, com quantidade compatível.
        const itC = c.itens || [], itR = v.itens || [];
        let produtosBatem = null, itensIguais = null;
        if (itC.length && itR.length) {
          const porCod = {};
          itR.forEach(i => { porCod[i.cod] = (porCod[i.cod] || 0) + (i.qtd || 0); });
          produtosBatem = itC.every(i => (porCod[i.cod] || 0) >= (i.qtd || 0) - 0.001);
          const ch = l => l.map(i => i.cod + "x" + (i.qtd || 0)).sort().join("|");
          itensIguais = ch(itC) === ch(itR);
        }
        v.produtosBatem = produtosBatem;
        v.itensIguais = itensIguais;
        v.pontos = (v.mesmoDia ? 1 : 0) + (v.mesmaVendedora ? 1 : 0) +
                   (produtosBatem === true ? 1 : 0) +
                   (v.minutos !== null && v.minutos <= 30 ? 1 : 0);
        const conf = v.pontos >= 4 ? "forte" : v.pontos === 3 ? "forte" : v.pontos === 2 ? "media" : "fraca";
        return { ...c, refeita: {
          conf, verificada: true, pontos: v.pontos,
          doc: v.doc, data: v.data, hora: v.hora, minutos: v.minutos,
          mesmaVendedora: v.mesmaVendedora, mesmosProdutos: v.produtosBatem, itensIguais: v.itensIguais,
          mesmoDia: v.mesmoDia, itensCancelada: c.itens || [],
          vendedor: v.vendedor, itens: v.itens,
          formas: (v.formas || []).map(f => ({ k: f.nome, v: f.v })),
          total: c.v,
        } };
      }
      return { ...c, refeita: melhor };
    });
  }
  return saida;
}
const diffDias = (a, b) => Math.abs(Math.round((new Date(a + "T00:00:00") - new Date(b + "T00:00:00")) / 864e5));
function formasDe(x) {
  const f = [];
  if (x.din > 0) f.push({ k: "dinheiro", v: x.din });
  if (x.car > 0) f.push({ k: "cartão", v: x.car });
  if (x.pix > 0) f.push({ k: "PIX", v: x.pix });
  if (x.lnk > 0) f.push({ k: "link", v: x.lnk });
  return f;
}

const DADOS = {
  geradoEm: raw.geradoEm || null,
  geradoEmBR: raw.geradoEmBR || "—",
  janela: raw.janela || {},
  lojas: LOJAS,
  tolerancia: TOL,
  dias: dias.map(d => ({
    data: d.data,
    loja: d.loja,
    status: d.status,
    conf: d.conf,
    caixa: d.caixa,
    total: d.total,
    // saldo_inicial/saldo_final do ERP NÃO são publicados de propósito: contradizem a
    // conferência real (davam negativo para a L4 nos dias em que ela fechou certo) e
    // só geravam alarme falso. O saldo que vale é caixa.inf.
    dinheiro: F(d, "dinheiro"),
    cartao: F(d, "cartao"),
    pix: F(d, "pix"),
    crediario: F(d, "crediario"),
    convenio: F(d, "convenio"),
    deposito: F(d, "deposito"),
    qrlinx: F(d, "qrlinx"),
    cashback: F(d, "cashback"),
    link_pgto: F(d, "link_pgto"),
    devolucoes: F(d, "devolucoes"),
    sangria: F(d, "sangria"),
    suprimentos: F(d, "suprimentos"),
    operadores: (d.operadores || []).map(o => ({
      login: o.login,
      total: o.total,
      dinheiro: o.dinheiro,
      sangria: o.sangria,
    })),
    adms: d.cartao_administradoras || {},
  })),
  planos: raw.planos || null,
  recebivel: raw.recebivel || null,
  // Movimento documento a documento: insumo da conciliação de cartão feita no navegador.
  movimento: raw.movimento || null,
  movimentoPeriodo: raw.movimentoPeriodo || null,
  canceladas: casarCanceladas(raw.canceladas, raw.movimento),
};

// ── Os dados são SENSÍVEIS (falta de caixa com nome de operador) e o repo do painel é
//    público → o JSON vai CIFRADO no HTML e só é decifrado no navegador com a senha. ──
const SENHA = getSenha();
if (!SENHA) {
  console.error("senha do painel não encontrada (env CAIXA_SENHA ou Keychain amgomes-caixa) — abortando");
  console.error("sem senha o painel iria pro repo público em texto puro");
  process.exit(20);
}
const PAYLOAD = cifrar(JSON.stringify(DADOS), SENHA);

// Só metadados não-sensíveis ficam em claro (para o cabeçalho antes do login).
const PUBLICO = {
  geradoEmBR: DADOS.geradoEmBR,
  janela: DADOS.janela,
  qtdDias: DADOS.dias.length,
};

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#7c3aed">
<title>Conferência de Caixa — A.M. Gomes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f0f4f8; --card:#fff; --card2:#f8fafc;
  --text:#0f172a; --text2:#334155; --muted:#64748b; --border:#e2e8f0;
  --accent:#7c3aed;
  --ok:#059669; --falta:#dc2626; --sobra:#0891b2; --alerta:#f59e0b; --neutro:#94a3b8;
  --shadow:0 1px 3px rgba(15,23,42,.06), 0 6px 20px rgba(15,23,42,.05);
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{
  background:radial-gradient(900px 460px at 100% -8%, rgba(124,58,237,.10), transparent 60%),var(--bg);
  color:var(--text);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  min-height:100vh;font-size:15px;-webkit-font-smoothing:antialiased;
}
.wrap{max-width:1180px;margin:0 auto;padding:0 18px 60px}

/* header */
.hdr{display:flex;align-items:center;gap:14px;padding:26px 0 6px;flex-wrap:wrap}
.hdr .ico{width:50px;height:50px;border-radius:15px;background:linear-gradient(135deg,#7c3aed,#0891b2);
  display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:0 8px 22px rgba(124,58,237,.32)}
.hdr h1{font-size:23px;font-weight:800;letter-spacing:-.4px}
.hdr p{color:var(--muted);font-size:12.5px;margin-top:2px;font-weight:500}
.voltar{margin-left:auto;text-decoration:none;color:var(--muted);font-size:12.5px;font-weight:600;
  border:1px solid var(--border);background:var(--card);padding:8px 13px;border-radius:9px}
.voltar:hover{color:var(--accent);border-color:var(--accent)}

/* selo de coleta — timestamp REAL, estático, escrito pelo pipeline */
.selo{display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--border);
  border-radius:9px;padding:7px 12px;font-size:11.5px;color:var(--muted);font-weight:600;margin:6px 0 4px}
.selo b{color:var(--text2);font-weight:700}
.selo .pulse{width:7px;height:7px;border-radius:50%;background:var(--ok)}

/* tabs */
.tabs{display:flex;gap:6px;margin:16px 0 4px;overflow-x:auto;padding-bottom:4px}
.tab{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:10px 15px;
  font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;white-space:nowrap;transition:.15s}
.tab:hover{border-color:var(--accent);color:var(--accent)}
.tab.on{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 4px 14px rgba(124,58,237,.28)}
.pane{display:none;animation:fade .2s ease}
.pane.on{display:block}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

/* filtros */
.filtros{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}
.filtros select{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:8px 11px;
  font-size:12.5px;font-weight:600;color:var(--text2);font-family:inherit;cursor:pointer}
.filtros label{font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.5px}

/* KPIs */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:12px;margin:14px 0 18px}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:15px;padding:15px 16px;box-shadow:var(--shadow);
  position:relative;overflow:hidden}
.kpi::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px;background:var(--kc,var(--accent))}
.kpi .lbl{font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;font-weight:700;margin-bottom:7px}
.kpi .val{font-size:22px;font-weight:800;letter-spacing:-.6px;color:var(--kv,var(--text))}
.kpi .sub{font-size:11.5px;color:var(--muted);margin-top:4px;font-weight:500}

/* tabela */
.box{background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);
  overflow:hidden;margin-bottom:18px}
.box-h{padding:14px 17px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.box-h h3{font-size:14.5px;font-weight:700;letter-spacing:-.2px}
.box-h .hint{font-size:11.5px;color:var(--muted);font-weight:500}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px}
th{background:var(--card2);text-align:right;padding:10px 12px;font-size:10.5px;color:var(--muted);
  text-transform:uppercase;letter-spacing:.5px;font-weight:700;border-bottom:1px solid var(--border);white-space:nowrap}
th:first-child,td:first-child{text-align:left}
td{padding:10px 12px;text-align:right;border-bottom:1px solid var(--border);font-variant-numeric:tabular-nums}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover{background:var(--card2)}
.num{font-weight:600}
.falta{color:var(--falta);font-weight:700}
.sobra{color:var(--sobra);font-weight:700}
.zero{color:var(--neutro)}

/* pills de status */
.pill{display:inline-block;padding:3px 9px;border-radius:7px;font-size:10.5px;font-weight:700;white-space:nowrap}
.p-ok{background:rgba(5,150,105,.11);color:var(--ok)}
.p-div{background:rgba(220,38,38,.11);color:var(--falta)}
.p-nf{background:rgba(245,158,11,.13);color:#b45309}
.p-sm{background:rgba(148,163,184,.15);color:var(--muted)}
.p-nc{background:rgba(124,58,237,.12);color:#6d28d9}

.loja-tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10.5px;font-weight:800;color:#fff}

/* barra de mix */
.mixbar{display:flex;height:26px;border-radius:8px;overflow:hidden;margin:6px 0 10px;border:1px solid var(--border)}
.mixbar div{display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;color:#fff}
.leg{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--muted);font-weight:600}
.leg span i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px}

.vazio{padding:30px 18px;text-align:center;color:var(--muted);font-size:13px}

/* ── upload / conciliação ── */
.up-linha{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.up-linha label{font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.up-linha select{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:8px 11px;
  font-size:12.5px;font-weight:600;color:var(--text2);font-family:inherit;cursor:pointer}
.dropzone{border:2px dashed color-mix(in srgb,var(--accent) 35%,var(--border));border-radius:14px;
  padding:26px 18px;text-align:center;cursor:pointer;transition:.15s;background:var(--card2)}
.dropzone:hover,.dropzone.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 6%,var(--card2))}
.dz-ico{font-size:30px;margin-bottom:8px}
.dz-titulo{font-size:14px;font-weight:700;color:var(--text)}
.dz-sub{font-size:12px;color:var(--muted);margin-top:5px}
.dz-erro{color:var(--falta);font-size:12.5px;font-weight:600;margin-top:10px;min-height:16px}
.chips-carregados{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.chip-arq{background:color-mix(in srgb,var(--ok) 10%,#fff);border:1px solid color-mix(in srgb,var(--ok) 25%,var(--border));
  color:#047857;border-radius:8px;padding:6px 11px;font-size:11.5px;font-weight:600;display:flex;align-items:center;gap:7px}
.chip-arq button{background:none;border:none;color:#047857;cursor:pointer;font-size:14px;line-height:1;padding:0;opacity:.6}
.chip-arq button:hover{opacity:1}
/* Cruzamento tem 11 colunas: sem compactar, não cabe na tela e obriga a rolar de lado. */
table.compacta{font-size:11.5px;min-width:0}
table.compacta th{padding:7px 6px;font-size:9.5px;letter-spacing:.3px}
table.compacta td{padding:6px 6px;white-space:nowrap}
table.compacta td:last-child,table.compacta th:last-child{white-space:normal;max-width:190px}
table.compacta .motivo{font-size:10.5px;line-height:1.3;display:inline-block}

/* linha destacada no cruzamento das 4 pontas */
tr.linha-ruim{background:color-mix(in srgb,var(--falta) 7%,transparent)}
tr.linha-ruim:hover{background:color-mix(in srgb,var(--falta) 12%,transparent)}
tr.linha-ruim td:first-child{box-shadow:inset 3px 0 0 var(--falta)}
.motivo{color:var(--falta);font-size:11.5px;font-weight:600}
.filtro-inc{margin-left:auto;font-size:12px;color:var(--text2);font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer}
.filtro-inc input{cursor:pointer}
.criterios{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.crit{font-size:10px;font-weight:700;padding:1px 6px;border-radius:5px;white-space:nowrap}
.crit-ok{background:rgba(5,150,105,.12);color:var(--ok)}
.crit-no{background:rgba(148,163,184,.16);color:var(--muted)}
.hist-aviso{padding:16px 17px;color:var(--muted);font-size:12.5px}
.btn-abrir{background:var(--accent);color:#fff;border:none;border-radius:7px;padding:5px 12px;
  font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}
.btn-abrir:hover{background:#6d28d9}
.btn-excluir{background:none;border:1px solid var(--border);color:var(--muted);border-radius:7px;
  padding:4px 9px;font-size:13px;font-weight:700;cursor:pointer;margin-left:6px;line-height:1;font-family:inherit}
.btn-excluir:hover{border-color:var(--falta);color:var(--falta);background:color-mix(in srgb,var(--falta) 8%,transparent)}
.chip-alerta{color:#b45309}
.vazio-ok{padding:22px 18px;text-align:center;color:var(--ok);font-size:13px;font-weight:600}

/* tela de senha */
.lock{max-width:380px;margin:70px auto;background:var(--card);border:1px solid var(--border);
  border-top:3px solid var(--accent);border-radius:16px;padding:30px 28px;box-shadow:var(--shadow);text-align:center}
.lock h2{font-size:17px;font-weight:800;margin-bottom:6px}
.lock p{color:var(--muted);font-size:12.5px;margin-bottom:16px;line-height:1.55}
.lock input{width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:10px;
  font-size:14px;font-family:inherit;margin-bottom:10px;text-align:center}
.lock input:focus{outline:none;border-color:var(--accent)}
.lock button{width:100%;padding:11px;border:none;border-radius:10px;background:var(--accent);
  color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.lock button:hover{background:#6d28d9}
.lock .err{color:var(--falta);font-size:12px;min-height:16px;margin-top:8px}
.nota{font-size:11.5px;color:var(--muted);line-height:1.6;padding:12px 17px;background:var(--card2);
  border-top:1px solid var(--border)}
footer{text-align:center;color:var(--muted);font-size:11.5px;padding:26px 0 10px}
@media (max-width:620px){.hdr h1{font-size:19px}.kpi .val{font-size:19px}}
</style>
</head>
<body>
<div class="wrap">

<div class="hdr">
  <div class="ico">🧮</div>
  <div>
    <h1>Conferência de Caixa</h1>
    <p>O que o ERP registrou × o que a loja informou no fechamento</p>
  </div>
  <a class="voltar" href="index.html">← Painel</a>
</div>

<div class="selo">
  <span class="pulse"></span>
  Coleta do ERP: <b id="selo-data">—</b> · janela <b id="selo-janela">—</b>
</div>

<!-- tela de senha: os dados só são decifrados no navegador após a senha correta -->
<div id="lock" class="lock">
  <div style="font-size:30px">🔒</div>
  <h2>Conferência de Caixa</h2>
  <p>Grupo A.M. Gomes · dados protegidos.<br>Digite a senha para visualizar.</p>
  <form onsubmit="return tentarSenha(event)">
    <input id="senha" type="password" placeholder="senha" autocomplete="current-password" autofocus/>
    <button type="submit">Entrar</button>
    <div id="lockerr" class="err"></div>
  </form>
</div>

<div id="app" style="display:none">

<div class="tabs">
  <div class="tab on" data-p="conf">💰 Conferência</div>
  <div class="tab" data-p="formas">💳 Formas de pagamento</div>
  <div class="tab" data-p="sangria">📤 Sangria e saldo</div>
  <div class="tab" data-p="banco">🏦 Cartão → banco</div>
  <div class="tab" data-p="concil">🔎 Conciliação da maquininha</div>
  <div class="tab" data-p="canc">🚫 Vendas canceladas</div>
</div>

<div class="filtros">
  <label>Loja</label>
  <select id="f-loja"><option value="">Todas</option></select>
  <label>Período</label>
  <select id="f-per">
    <option value="7">Últimos 7 dias</option>
    <option value="15">Últimos 15 dias</option>
    <option value="30" selected>Últimos 30 dias</option>
    <option value="999">Tudo</option>
  </select>
</div>

<!-- ══ 1. CONFERÊNCIA ══ -->
<div class="pane on" id="p-conf">
  <div class="kpis" id="kpi-conf"></div>
  <div class="box">
    <div class="box-h"><h3>Dia a dia</h3><span class="hint">caixa esperado = caixa anterior + dinheiro do dia − sangria</span></div>
    <div class="scroll"><table id="t-conf"></table></div>
    <div class="nota">
      O <b>caixa informado</b> é um <b>saldo</b>: o dinheiro que estava fisicamente na gaveta no fim
      do dia — não o movimento do dia. Por isso ele não é comparado direto com o dinheiro vendido, e
      sim com o que <i>deveria</i> ter sobrado:
      <b>caixa de ontem + dinheiro do dia + suprimento − sangria</b>. A coluna
      <b>diferença</b> é o que sobrou ou faltou de verdade; negativo = faltou dinheiro na gaveta.
      Diferenças abaixo de R$ 1,00 contam como acerto (arredondamento de troco).
      <br><br>
      <b>Não fechado</b> = ninguém lançou o fechamento no ERP; não há o que conferir, e a corrente
      recomeça no dia seguinte.
      <br><br>
      <b>Sem contagem</b> = o valor informado é idêntico ao do sistema, centavo a centavo. Em 45
      dias, Altamira (L1 e L4) divergiu em <b>100%</b> dos dias e Itaituba/Santarém (L3 e L5) em
      <b>0%</b> — nenhuma diferença em 68 fechamentos. Nessas duas o fechamento existe no POS, mas
      está lançado num login que não registrou as vendas: o bloco do caixa vem com Valor Calculado
      zerado, então a declaração não confronta nada. Não é dinheiro faltando; é conferência que
      não apura diferença. Enquanto for assim, essas lojas ficam fora do cálculo de deriva.
    </div>
  </div>
</div>

<!-- ══ 2. FORMAS DE PAGAMENTO ══ -->
<div class="pane" id="p-formas">
  <div class="kpis" id="kpi-formas"></div>
  <div class="box">
    <div class="box-h"><h3>Mix por forma de pagamento</h3><span class="hint">valor registrado pelo ERP no período</span></div>
    <div style="padding:15px 17px">
      <div class="mixbar" id="mixbar"></div>
      <div class="leg" id="mixleg"></div>
    </div>
    <div class="scroll"><table id="t-formas"></table></div>
  </div>
  <div class="box" id="box-planos">
    <div class="box-h"><h3>Detalhe por bandeira / plano</h3><span class="hint">as 4 lojas somadas</span></div>
    <div class="scroll"><table id="t-planos"></table></div>
  </div>
</div>

<!-- ══ 3. SANGRIA E SALDO ══ -->
<div class="pane" id="p-sangria">
  <div class="kpis" id="kpi-sangria"></div>
  <div class="box">
    <div class="box-h"><h3>Sangria, suprimento e caixa em dinheiro</h3><span class="hint">movimento físico da gaveta</span></div>
    <div class="scroll"><table id="t-sangria"></table></div>
    <div class="nota">
      <b>Sangria</b> = retirada de dinheiro do caixa (vai pro cofre/banco). <b>Suprimento</b> =
      dinheiro colocado no caixa (troco). <b>Caixa no fim do dia</b> é o saldo informado no
      fechamento — o mesmo valor conferido na primeira aba, então as duas telas sempre contam a
      mesma história. Dia sem sangria não é erro: significa que o dinheiro ficou na gaveta e
      entra no saldo do dia seguinte.
    </div>
  </div>
</div>

<!-- ══ 4. CARTÃO → BANCO ══ -->
<div class="pane" id="p-banco">
  <div class="kpis" id="kpi-banco"></div>
  <div class="box">
    <div class="box-h"><h3>Calendário de entrada no banco</h3><span class="hint">recebível de cartão em aberto, por data de vencimento</span></div>
    <div class="scroll"><table id="t-banco"></table></div>
    <div class="nota">
      Cartão não entra no banco na hora: cada parcela vira um recebível da administradora com data
      de vencimento. Esta é a agenda do que ainda vai cair na conta — inclui parcelas de vendas de
      meses anteriores, por isso o total não bate com o cartão vendido no período.
    </div>
  </div>
  <div class="box">
    <div class="box-h"><h3>Administradoras usadas nas vendas</h3><span class="hint">no período filtrado</span></div>
    <div class="scroll"><table id="t-banco-adm"></table></div>
  </div>
</div>

<!-- ══ 6. VENDAS CANCELADAS ══ -->
<div class="pane" id="p-canc">
  <div class="kpis" id="kpi-canc"></div>
  <div class="box">
    <div class="box-h"><h3>Cancelamentos no POS</h3>
      <span class="hint">e se a venda voltou depois, com qual forma de pagamento</span>
      <label class="filtro-inc"><input type="checkbox" id="canc-so-sem" onchange="rCanc()"> só as que não voltaram</label>
    </div>
    <div class="scroll"><table id="t-canc"></table></div>
    <div class="nota">
      Cancelar e refazer é rotina de loja — o cliente troca de ideia, o operador erra a forma de
      pagamento. O que importa é se a venda <b>voltou</b>. <b>Indício forte</b> = mesmo valor, mesmo
      dia e documento logo em seguida. Cancelamento que <b>não voltou</b> merece olhada: ou a venda
      se perdeu, ou saiu sem registro.
      <br><br>
      ⚠️ A comparação de número de documento só é exata dentro da mesma série, e o movimento diário
      não traz a série — por isso o painel classifica a confiança em vez de afirmar. O <b>motivo</b>
      vem em branco quando ninguém preencheu no POS.
    </div>
  </div>
</div>

<!-- ══ 5. CONCILIAÇÃO DA MAQUININHA ══ -->
<div class="pane" id="p-concil">
  <div class="box">
    <div class="box-h"><h3>Carregar o relatório da maquininha</h3>
      <span class="hint">o arquivo é lido aqui no seu navegador e não sai do seu computador</span></div>
    <div style="padding:16px 17px">
      <div class="up-linha">
        <label>Loja</label>
        <select id="c-loja"></select>
        <label>Adquirente</label>
        <select id="c-adq">
          <option value="infinitepay">InfinitePay</option>
          <option value="auto">Detectar pelas colunas</option>
        </select>
      </div>
      <div id="dropzone" class="dropzone">
        <div class="dz-ico">📄</div>
        <div class="dz-titulo">Arraste o relatório aqui, ou clique para escolher</div>
        <div class="dz-sub">Arquivo <b>.csv</b> da maquininha e/ou o extrato da conta — pode arrastar os dois juntos.<br>
          <b>Uma loja por vez:</b> trocar a loja acima limpa a tela.<br>
          <b>Comece o nome do arquivo pela loja</b> (ex.: <code>L5 maquininha julho.csv</code>) — o relatório
          da adquirente não diz de que empresa é, e assim o painel confere sozinho.</div>
        <input type="file" id="c-file" accept=".csv,text/csv" multiple hidden>
      </div>
      <div id="c-erro" class="dz-erro"></div>
      <div id="c-carregados" class="chips-carregados"></div>
    </div>
  </div>

  <div class="box">
    <div class="box-h"><h3>📚 Conferências guardadas</h3>
      <span class="hint">só da loja selecionada · cifradas com a senha do painel, abrem em qualquer computador da equipe</span></div>
    <div class="scroll" id="c-historico"><div class="hist-aviso">carregando…</div></div>
    </div>
  </div>

  <!-- Todo o resultado é gerado por rConcil() em conferencia_caixa_app.js:
       cartão e PIX usam o mesmo motor, então gerar evita manter ids em dobro. -->
  <div id="c-resultado" style="display:none"></div>
</div>

</div><!-- /#app -->

<footer>Grupo A.M. Gomes · Conferência de Caixa · dados do ERP Microvix</footer>
</div>

<script>
const PUBLICO = ${JSON.stringify(PUBLICO)};
const PAYLOAD = ${JSON.stringify(PAYLOAD)};
${APP_JS}
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`conferencia_caixa.html gerado (${(html.length / 1024).toFixed(0)} KB, ${DADOS.dias.length} dias-loja)`);
