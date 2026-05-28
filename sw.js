// Service Worker — A.M. Gomes
// Estrategia: NETWORK-FIRST pra HTML/JS/JSON (sempre busca novo).
// Cache-first pra icones/imagens (raramente mudam).
// Fallback pro cache se internet cair.

const CACHE = 'amgomes-v5';

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
  // HTML, JS, JSON, manifest: NETWORK FIRST
  const networkFirst = (
    path.endsWith('/') ||
    path.endsWith('.html') ||
    path.endsWith('.js') ||
    path.endsWith('.json')
  );

  if (networkFirst) {
    event.respondWith(
      fetch(req)
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

  // Outros (imagens, ícones, css): CACHE FIRST
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
