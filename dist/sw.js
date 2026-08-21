// Service Worker PWA KEDGO - Suporte Offline Completo
const CACHE_NAME = 'kedgo-pwa-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kedpelomundo-logo.png',
  '/pwa-192.png',
  '/pwa-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Falha ao pré-armazenar assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorar rotas de API do backend (devem ser tratadas pela lógica da aplicação)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Requisições que não sejam GET
  if (request.method !== 'GET') {
    return;
  }

  // 3. Estratégia Network First com Fallback para Cache para navegação e assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a resposta for válida, clonar e salvar no cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Se a rede falhar (Modo Offline), buscar do cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se for navegação de página HTML, retornar index.html do cache (SPA fallback)
        if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
          const indexFallback = await caches.match('/index.html') || await caches.match('/');
          if (indexFallback) {
            return indexFallback;
          }
        }

        return new Response('Offline: Recurso não disponível no cache.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
