// Worker: API de feedbacks de sugestões do dashboard de premiação
// Armazena em KV (key-value store gratuito do Cloudflare)
// Endpoints:
//   POST /feedback         -> recebe feedback de vendedora
//   GET  /feedbacks        -> lista todos (pro athila/skill)
//   POST /override         -> recebe aprovação/rejeição/edição do athila
//   GET  /overrides        -> lista todas as decisões athila (pra sincronizar HTMLs)
//   POST /avaliacao        -> athila avalia sugestão (funcionou/indif/nao)
//   GET  /avaliacoes       -> lista avaliações
//
// CORS aberto pra GitHub Pages (athilamgomes-ui.github.io)
// Auth: chave secreta opcional via header (configurar como env var SHARED_KEY)

const ORIGINS_PERMITIDOS = [
  'https://athilamgomes-ui.github.io',
  'http://localhost:8080',
  'null', // file:// para teste local
];

function corsHeaders(req) {
  const origin = req.headers.get('Origin') || '';
  const allow = ORIGINS_PERMITIDOS.includes(origin) ? origin : ORIGINS_PERMITIDOS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Shared-Key',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(req, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) }
  });
}

// Helper: lista todas as entries de um prefixo no KV
async function listAll(KV, prefix) {
  const items = [];
  let cursor = null;
  do {
    const r = await KV.list({ prefix, cursor });
    for (const k of r.keys) {
      const v = await KV.get(k.name);
      if (v) items.push(JSON.parse(v));
    }
    cursor = r.cursor;
    if (r.list_complete) break;
  } while (cursor);
  return items;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // Auth opcional
    const sharedKey = env.SHARED_KEY;
    if (sharedKey && request.headers.get('X-Shared-Key') !== sharedKey && method !== 'GET') {
      return jsonResponse(request, { error: 'Unauthorized' }, 401);
    }

    const KV = env.FEEDBACKS_KV;
    if (!KV) {
      return jsonResponse(request, { error: 'KV namespace nao configurado' }, 500);
    }

    try {
      // === FEEDBACK DA VENDEDORA ===
      if (method === 'POST' && url.pathname === '/feedback') {
        const body = await request.json();
        const { id_sugestao, loja, vendedora, acao, comentario } = body;
        if (!id_sugestao || !loja || !vendedora || !acao) {
          return jsonResponse(request, { error: 'Campos obrigatorios: id_sugestao, loja, vendedora, acao' }, 400);
        }
        const key = `feedback:${id_sugestao}:${loja}:${vendedora}`;
        const reg = {
          id_sugestao, loja, vendedora, acao,
          comentario: comentario || '',
          em: new Date().toISOString()
        };
        await KV.put(key, JSON.stringify(reg));
        return jsonResponse(request, { ok: true, salvo: reg });
      }

      if (method === 'GET' && url.pathname === '/feedbacks') {
        const items = await listAll(KV, 'feedback:');
        return jsonResponse(request, { items });
      }

      // === OVERRIDE DO ATHILA (aprovar/editar/rejeitar) ===
      if (method === 'POST' && url.pathname === '/override') {
        const body = await request.json();
        const { id_sugestao, status, texto_editado, prazo } = body;
        if (!id_sugestao || !status) {
          return jsonResponse(request, { error: 'Campos obrigatorios: id_sugestao, status' }, 400);
        }
        const key = `override:${id_sugestao}`;
        const reg = {
          id_sugestao, status,
          texto_editado: texto_editado || null,
          prazo: prazo || null,
          em: new Date().toISOString()
        };
        await KV.put(key, JSON.stringify(reg));
        return jsonResponse(request, { ok: true });
      }

      if (method === 'GET' && url.pathname === '/overrides') {
        const items = await listAll(KV, 'override:');
        return jsonResponse(request, { items });
      }

      // === AVALIAÇÃO DO ATHILA (funcionou/indif/nao) ===
      if (method === 'POST' && url.pathname === '/avaliacao') {
        const body = await request.json();
        const { id_sugestao, resultado, comentario } = body;
        if (!id_sugestao || !resultado) {
          return jsonResponse(request, { error: 'Campos obrigatorios: id_sugestao, resultado' }, 400);
        }
        const key = `avaliacao:${id_sugestao}`;
        const reg = {
          id_sugestao, resultado,
          comentario: comentario || '',
          em: new Date().toISOString()
        };
        await KV.put(key, JSON.stringify(reg));
        return jsonResponse(request, { ok: true });
      }

      if (method === 'GET' && url.pathname === '/avaliacoes') {
        const items = await listAll(KV, 'avaliacao:');
        return jsonResponse(request, { items });
      }

      // === RETORNO DO DONO PRO FEEDBACK DA VENDEDORA ===
      // Athila escreve um retorno sobre um feedback específico (id_feedback inclui
      // id_sugestao+loja+vendedora). Vendedora vê esse retorno no app dela.
      if (method === 'POST' && url.pathname === '/feedback-retorno') {
        const body = await request.json();
        const { id_sugestao, loja, vendedora, status, texto } = body;
        if (!id_sugestao || !loja || !vendedora || !status) {
          return jsonResponse(request, { error: 'Campos obrigatorios: id_sugestao, loja, vendedora, status' }, 400);
        }
        const key = `feedback_retorno:${id_sugestao}:${loja}:${vendedora}`;
        const reg = {
          id_sugestao, loja, vendedora, status,
          texto: texto || '',
          em: new Date().toISOString()
        };
        await KV.put(key, JSON.stringify(reg));
        return jsonResponse(request, { ok: true, salvo: reg });
      }

      if (method === 'GET' && url.pathname === '/feedback-retornos') {
        const items = await listAll(KV, 'feedback_retorno:');
        return jsonResponse(request, { items });
      }

      // === LEITURA DO QUIZ (vendedora respondeu) ===
      if (method === 'POST' && url.pathname === '/quiz') {
        const body = await request.json();
        const { loja, vendedora, semana, acertos } = body;
        if (!loja || !vendedora || !semana) {
          return jsonResponse(request, { error: 'Campos obrigatorios: loja, vendedora, semana' }, 400);
        }
        const key = `quiz:${loja}:${vendedora}:${semana}`;
        await KV.put(key, JSON.stringify({
          loja, vendedora, semana, acertos: acertos || 0,
          em: new Date().toISOString()
        }));
        return jsonResponse(request, { ok: true });
      }

      if (method === 'GET' && url.pathname === '/quizzes') {
        const items = await listAll(KV, 'quiz:');
        return jsonResponse(request, { items });
      }

      // === AVATAR DA VENDEDORA ===
      if (method === 'POST' && url.pathname === '/avatar') {
        const body = await request.json();
        const { loja, vendedora, config } = body;
        if (!loja || !vendedora || !config) {
          return jsonResponse(request, { error: 'Campos obrigatorios: loja, vendedora, config' }, 400);
        }
        const key = `avatar:${loja}:${vendedora}`;
        await KV.put(key, JSON.stringify({
          loja, vendedora, config, em: new Date().toISOString()
        }));
        return jsonResponse(request, { ok: true });
      }

      if (method === 'GET' && url.pathname === '/avatars') {
        const items = await listAll(KV, 'avatar:');
        return jsonResponse(request, { items });
      }

      // === FOTO DE PERFIL DA VENDEDORA (base64) ===
      if (method === 'POST' && url.pathname === '/foto') {
        const body = await request.json();
        const { loja, vendedora, foto } = body;
        if (!loja || !vendedora || !foto) {
          return jsonResponse(request, { error: 'Campos obrigatorios: loja, vendedora, foto' }, 400);
        }
        // Limita tamanho da foto pra nao estourar KV (~25KB max)
        if (foto.length > 100000) {
          return jsonResponse(request, { error: 'Foto muito grande - reduza a qualidade' }, 413);
        }
        const key = `foto:${loja}:${vendedora}`;
        await KV.put(key, JSON.stringify({
          loja, vendedora, foto, em: new Date().toISOString()
        }));
        return jsonResponse(request, { ok: true });
      }

      if (method === 'GET' && url.pathname === '/fotos') {
        const items = await listAll(KV, 'foto:');
        return jsonResponse(request, { items });
      }

      // === AJUSTE DE METAS POR LOJA (sincroniza painel ↔ app vendedora) ===
      // O painel salva ajuste de meta em localStorage, mas localStorage é
      // por-device. Pra vendedoras no celular dela verem o valor atualizado,
      // precisamos sincronizar via Worker. Key: metas_loja:<mes>:<loja>.
      if (method === 'POST' && url.pathname === '/metas-loja') {
        const body = await request.json();
        const { mes, loja, tipo, metas } = body;
        if (!mes || !loja || !Array.isArray(metas)) {
          return jsonResponse(request, { error: 'Campos obrigatorios: mes, loja, metas[]' }, 400);
        }
        const key = `metas_loja:${mes}:${loja}`;
        const reg = {
          mes, loja, tipo: tipo || 'custom', metas,
          em: new Date().toISOString()
        };
        await KV.put(key, JSON.stringify(reg));
        return jsonResponse(request, { ok: true, salvo: reg });
      }

      if (method === 'GET' && url.pathname === '/metas-loja') {
        const items = await listAll(KV, 'metas_loja:');
        return jsonResponse(request, { items });
      }

      // === HEALTH CHECK ===
      if (url.pathname === '/' || url.pathname === '/health') {
        return jsonResponse(request, { ok: true, msg: 'Premiacao Worker AMGomes' });
      }

      return jsonResponse(request, { error: 'Rota nao encontrada' }, 404);
    } catch (e) {
      return jsonResponse(request, { error: e.message, stack: e.stack }, 500);
    }
  }
};
