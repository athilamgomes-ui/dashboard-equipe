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

// ═══ WEB PUSH (notificações do app das vendedoras, 04/07/2026) ═══════════════
// Estratégia SEM payload criptografado (dispensa RFC8291): o push enviado é
// VAZIO — só acorda o service worker do device, que busca GET /push-inbox e
// monta a notificação com o conteúdo de lá. Só precisamos do VAPID (JWT ES256).
// Env vars necessárias (Settings → Variables do Worker):
//   VAPID_PUBLIC_KEY  = base64url do ponto público P-256 (mesma do loja.html)
//   VAPID_PRIVATE_JWK = JSON do JWK privado (SECRET — nunca commitar; repo é público)

function b64url(buf) {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function vapidAuthHeader(endpoint, env) {
  const aud = new URL(endpoint).origin;
  const header = b64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:athilamgomes@gmail.com'
  })));
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${header}.${payload}`));
  return `vapid t=${header}.${payload}.${b64url(sig)}, k=${env.VAPID_PUBLIC_KEY}`;
}

// Envia push VAZIO pra uma subscription. Retorna status HTTP do push service.
async function enviarPushVazio(sub, env) {
  const auth = await vapidAuthHeader(sub.endpoint, env);
  const r = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { 'Authorization': auth, 'TTL': '86400', 'Urgency': 'normal', 'Content-Length': '0' },
  });
  return r.status;
}

// Hash curto do endpoint pra chavear subscriptions por device.
async function hashEndpoint(endpoint) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return b64url(d).slice(0, 16);
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

      // === MENSAGEM DA GERENTE PRA EQUIPE ===
      // A gerente escreve no app dela (loja.html detecta currentUser ===
      // GERENTE_LOJA) e publica; toda a equipe da loja vê na aba Hoje.
      // Uma mensagem ativa por loja (overwrite). Key: msg_gerente:<loja>.
      if (method === 'POST' && url.pathname === '/mensagem-gerente') {
        const body = await request.json();
        const { loja, por, texto } = body;
        if (!loja || !por || texto === undefined) {
          return jsonResponse(request, { error: 'Campos obrigatorios: loja, por, texto' }, 400);
        }
        if (String(texto).length > 600) {
          return jsonResponse(request, { error: 'Mensagem muito longa (max 600 chars)' }, 413);
        }
        const key = `msg_gerente:${loja}`;
        const reg = { loja, por, texto: String(texto), em: new Date().toISOString() };
        await KV.put(key, JSON.stringify(reg));
        return jsonResponse(request, { ok: true, salvo: reg });
      }

      if (method === 'GET' && url.pathname === '/mensagem-gerente') {
        const items = await listAll(KV, 'msg_gerente:');
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

      // === WEB PUSH: SUBSCRIPTION DO DEVICE ===
      // Key: push_sub:<loja>:<vendedora>:<hash(endpoint)> — vendedora pode ter
      // mais de um device. POST idempotente (o app re-sincroniza todo boot).
      if (method === 'POST' && url.pathname === '/push-subscribe') {
        const body = await request.json();
        const { loja, vendedora, sub } = body;
        if (!loja || !vendedora || !sub || !sub.endpoint) {
          return jsonResponse(request, { error: 'Campos obrigatorios: loja, vendedora, sub{endpoint}' }, 400);
        }
        const h = await hashEndpoint(sub.endpoint);
        const key = `push_sub:${loja}:${vendedora}:${h}`;
        await KV.put(key, JSON.stringify({ loja, vendedora, sub, em: new Date().toISOString() }));
        return jsonResponse(request, { ok: true });
      }

      if (method === 'POST' && url.pathname === '/push-unsubscribe') {
        const body = await request.json();
        const { endpoint } = body;
        if (!endpoint) return jsonResponse(request, { error: 'Campo obrigatorio: endpoint' }, 400);
        const h = await hashEndpoint(endpoint);
        let removidas = 0;
        let cursor = null;
        do {
          const r = await KV.list({ prefix: 'push_sub:', cursor });
          for (const k of r.keys) {
            if (k.name.endsWith(':' + h)) { await KV.delete(k.name); removidas++; }
          }
          cursor = r.cursor;
          if (r.list_complete) break;
        } while (cursor);
        return jsonResponse(request, { ok: true, removidas });
      }

      // === WEB PUSH: INBOX (o service worker busca aqui o conteúdo ao acordar) ===
      // Mensagens individuais (vendedora exata) + da loja inteira (_loja) + gerais (_geral).
      // TTL de 3 dias no KV — expiram sozinhas.
      if (method === 'GET' && url.pathname === '/push-inbox') {
        const loja = url.searchParams.get('loja');
        const vendedora = url.searchParams.get('vendedora');
        if (!loja) return jsonResponse(request, { error: 'Param obrigatorio: loja' }, 400);
        const itens = [];
        for (const prefix of [
          vendedora ? `push_inbox:${loja}:${vendedora}:` : null,
          `push_inbox:${loja}:_loja:`,
          `push_inbox:_geral:_geral:`,
        ].filter(Boolean)) {
          itens.push(...await listAll(KV, prefix));
        }
        itens.sort((a, b) => (b.em || '').localeCompare(a.em || ''));
        return jsonResponse(request, { items: itens.slice(0, 5) });
      }

      // === WEB PUSH: ENVIAR ===
      // {titulo, corpo, url?, loja?, vendedora?}
      //   loja+vendedora → só ela · só loja → equipe da loja · nenhum → todas as lojas.
      // Grava na inbox (TTL 3d) e dispara push VAZIO pra cada device inscrito.
      // Subscriptions mortas (404/410 do push service) são removidas na hora.
      if (method === 'POST' && url.pathname === '/push-send') {
        if (!env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY) {
          return jsonResponse(request, { error: 'VAPID nao configurado (env vars)' }, 500);
        }
        const body = await request.json();
        const { titulo, corpo, url: destino, loja, vendedora, tag } = body;
        if (!titulo || !corpo) return jsonResponse(request, { error: 'Campos obrigatorios: titulo, corpo' }, 400);

        const em = new Date().toISOString();
        const inboxKey = `push_inbox:${loja || '_geral'}:${vendedora || (loja ? '_loja' : '_geral')}:${Date.now()}`;
        await KV.put(inboxKey, JSON.stringify({ titulo: String(titulo).slice(0, 80), corpo: String(corpo).slice(0, 240), url: destino || null, tag: tag || inboxKey, em }), { expirationTtl: 259200 });

        const prefix = loja && vendedora ? `push_sub:${loja}:${vendedora}:` : loja ? `push_sub:${loja}:` : 'push_sub:';
        const subs = await listAll(KV, prefix);
        let enviadas = 0, mortas = 0, falhas = 0;
        for (const s of subs) {
          try {
            const st = await enviarPushVazio(s.sub, env);
            if (st === 404 || st === 410) {
              const h = await hashEndpoint(s.sub.endpoint);
              await KV.delete(`push_sub:${s.loja}:${s.vendedora}:${h}`);
              mortas++;
            } else if (st >= 200 && st < 300) enviadas++;
            else falhas++;
          } catch (_) { falhas++; }
        }
        return jsonResponse(request, { ok: true, devices: subs.length, enviadas, mortas, falhas });
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
