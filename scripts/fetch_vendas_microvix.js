/**
 * fetch_vendas_microvix.js
 *
 * Etapa 1 do cron `dashboard-premiacao-update` via API REST direta (sem UI scraping).
 *
 * Como rodar:
 *   Cole o conteúdo de `fetchVendasMicrovix()` no console DE UMA ABA do Chrome
 *   já aberta em `https://linx.microvix.com.br/gestor_web/...` (qualquer página
 *   gestor_web serve). Ou invoque via `javascript_tool` do Chrome MCP.
 *
 * Pré-requisitos:
 *   - Aba em `linx.microvix.com.br/gestor_web/*` (CORS).
 *   - Microvix logado, `localStorage.api_token_lma` válido.
 *
 * Retorna:
 *   { L1: {S1:{vend:R$,...}, S2:{...}, S3:{...}, S4:{...}}, L3: {...}, L4: {...}, L5: {...} }
 *
 * Estrutura idêntica ao `DADOS['<YYYY-MM>'].Lx.vendas[Sx]` esperado pelo painel.
 */

const LOJA_POR_EMPRESA = { 1: "L1", 3: "L3", 4: "L4", 10: "L5" };
const EMPRESAS = [1, 3, 4, 10];

// Vendedoras válidas por loja (filtra vendedores fantasma como VENDEDOR EXTERNO/PADRAO).
// Comparação é case-insensitive e por substring do primeiro nome.
// Nome canônico esperado em DADOS[mes][Lx].vendas[Sx] (igual ao painel)
const VENDEDORAS = {
  L1: ["Tatiane", "Rayra", "Alcione", "Sofia"],
  L3: ["Ana Mira", "Raimunda", "Brunna", "Naila"],
  L4: ["Tanaia", "Josilene", "Bruna F.", "Rosana"],
  L5: ["Rayssa", "Joyce", "Rosiene", "Karina", "Lucas"],
};

/**
 * Mapeia o `nome_vendedor` retornado pela API para o nome canônico
 * usado em DADOS[mes][Lx].vendas[Sx]. Retorna null se não casar.
 */
function canonicalizarNome(loja, nomeApi) {
  const upper = nomeApi.toUpperCase();
  for (const canonico of VENDEDORAS[loja]) {
    const first = canonico.toUpperCase().split(" ")[0];
    if (upper.includes(first)) return canonico;
  }
  return null;
}

/**
 * Faz UMA chamada à API (1 empresa × 1 período).
 * Retorna [{nome_vendedor, vlr_vendas, ...}] ou lança erro.
 */
async function fetchPerformance(empresaId, dataInicial, dataFinal) {
  const token = localStorage.getItem("api_token_lma");
  if (!token) throw new Error("token api_token_lma ausente — abrir gestor_web e logar");

  const body = JSON.stringify({
    EmpresasSelecionadasParam: String(empresaId),
    DataInicial: dataInicial,
    DataFinal: dataFinal,
    ConsiderarEntradaGarantiaNacional: true,
    op: "Listar",
  });

  const r = await fetch(
    "/gestor_web/faturamento/relatorios/performance_por_vendedor/performance_por_vendedor_service.asp",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data", // quirk do ASP — copiar literalmente
        Authorization: token,
      },
      body,
    }
  );

  if (r.status === 401 || r.status === 403) {
    throw new Error("TOKEN_EXPIRED");
  }
  if (r.status !== 200) {
    const txt = await r.text();
    throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`);
  }
  const txt = await r.text();
  // Microvix às vezes responde 200 + HTML "Sessão expirada" em vez de JSON
  if (/Sess.o expirada|sessao_expirada\.asp/i.test(txt)) {
    throw new Error("TOKEN_EXPIRED");
  }
  try {
    return JSON.parse(txt);
  } catch (e) {
    throw new Error(`Resposta não-JSON: ${txt.slice(0, 200)}`);
  }
}

/**
 * Renova token: navega pra v4/home e volta. Implementado como helper que retorna
 * boolean. Como rodamos dentro de uma aba MCP, a chamada `location.assign` quebra o
 * contexto JS atual; o cron deve detectar TOKEN_EXPIRED, navegar via Chrome MCP, e
 * re-invocar este script.
 */
function tokenExpiradoErro() {
  return new Error(
    "Token api_token_lma expirado. Navegue pra https://linx.microvix.com.br/v4/home/index.asp e depois volte pra gestor_web/* para renovar."
  );
}

/**
 * Função principal. Recebe lista de semanas e retorna estrutura completa.
 *
 * @param {Array<{id:string, di:string, df:string}>} semanas
 *   Ex: [{id:"S1", di:"01/05/2026", df:"09/05/2026"}, ...]
 * @returns {Object} { L1: {S1:{nome:R$}, ...}, L3:{...}, L4:{...}, L5:{...} }
 */
async function fetchVendasMicrovix(semanas) {
  const out = { L1: {}, L3: {}, L4: {}, L5: {} };
  for (const loja of ["L1", "L3", "L4", "L5"]) {
    for (const s of semanas) out[loja][s.id] = {};
  }

  for (const emp of EMPRESAS) {
    const loja = LOJA_POR_EMPRESA[emp];
    for (const s of semanas) {
      let attempt = 0;
      while (attempt < 2) {
        try {
          const rows = await fetchPerformance(emp, s.di, s.df);
          for (const row of rows) {
            const canonico = canonicalizarNome(loja, row.nome_vendedor);
            if (!canonico) continue; // VENDEDOR EXTERNO/PADRAO etc.
            const valor = parseFloat(String(row.vlr_vendas).replace(",", "."));
            out[loja][s.id][canonico] = Math.round(valor);
          }
          break;
        } catch (e) {
          if (e.message === "TOKEN_EXPIRED" && attempt === 0) {
            // Não tem como renovar sozinho dentro deste script — sinalize ao caller.
            throw tokenExpiradoErro();
          }
          attempt++;
          if (attempt >= 2) {
            console.error(`Falha ${loja}/${s.id}: ${e.message}`);
            // não trava o resto — deixa vazio
            break;
          }
          await new Promise((r) => setTimeout(r, 1500)); // retry simples
        }
      }
    }
  }

  return out;
}

// Exporta no escopo da janela para o cron pegar via javascript_tool
if (typeof window !== "undefined") {
  window.fetchVendasMicrovix = fetchVendasMicrovix;
  window.fetchPerformance = fetchPerformance;
}
