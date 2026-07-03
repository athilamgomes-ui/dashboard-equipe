// Service Worker — A.M. Gomes
// Estrategia: NETWORK-FIRST pra HTML/JS/JSON (sempre busca novo).
// Cache-first pra icones/imagens (raramente mudam).
// Fallback pro cache se internet cair.

const CACHE = 'amgomes-v7';
const WORKER_URL = 'https://premiacao-amgomes.nhf6t85hdk.workers.dev';

// ─── WEB PUSH (04/07/2026) ───────────────────────────────────────────────────
// O push chega VAZIO (só acorda o SW). O conteúdo vem do GET /push-inbox do
// Worker. A identidade (loja/vendedora) é gravada pela página no Cache API em
// '/__push_ident' quando a vendedora ativa as notificações.
async function lerIdent() {
  try {
    const c = await caches.open('push-ident');
    const r = await c.match('/__push_ident');
    return r ? await r.json() : null;
  } catch (_) { return null; }
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let titulo = 'Premiação A.M. Gomes';
    let corpo = 'Tem novidade no seu app — toque pra ver.';
    let urlDestino = './loja.html';
    let tag = 'amgomes-push';
    try {
      const ident = await lerIdent();
      if (ident && ident.loja) {
        urlDestino = `./loja.html?l=${ident.loja}`;
        const r = await fetch(`${WORKER_URL}/push-inbox?loja=${encodeURIComponent(ident.loja)}&vendedora=${encodeURIComponent(ident.vendedora || '')}`, { cache: 'no-store' });
        const d = await r.json();
        const msg = (d.items || [])[0];
        if (msg) {
          titulo = msg.titulo || titulo;
          corpo = msg.corpo || corpo;
          if (msg.url) urlDestino = msg.url;
          tag = msg.tag || tag;   // mesma tag = substitui em vez de duplicar
        }
      }
    } catch (_) { /* mostra genérica — iOS exige exibir algo em todo push */ }
    await self.registration.showNotification(titulo, {
      body: corpo,
      tag,
      icon: './icons/app-192.png',
      badge: './icons/app-192.png',
      data: { url: urlDestino },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || './loja.html';
  event.waitUntil((async () => {
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.includes('loja.html') && 'focus' in w) return w.focus();
    }
    return clients.openWindow(destino);
  })());
});

// Instala: ativa logo, nao espera tabs antigas fecharem
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativa: toma controle de todas as tabs imediatamente + limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
    ])
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Não interfere com chamadas pra outros dominios (DiceBear, Cloudflare Worker, etc)
  if (url.origin !== location.origin) return;

  const path = url.pathname;
  // HTML, JS, JSON, manifest: NETWORK FIRST com cache:'no-store' para bypassar HTTP cache
  const networkFirst = (
    path.endsWith('/') ||
    path.endsWith('.html') ||
    path.endsWith('.js') ||
    path.endsWith('.json')
  );

  if (networkFirst) {
    event.respondWith(
      fetch(req, {cache: 'no-store'})
        .then(res => {
          // Cache em background pra fallback offline
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || new Response('Sem conexão', {status:503})))
    );
    return;
  }

  // Outros (imagens, ícones): CACHE FIRST
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
        return res;
      });
    })
  );
});
