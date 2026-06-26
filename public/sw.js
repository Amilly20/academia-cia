const CACHE_NAME = 'cia-fitness-v6'; // Versão do cache, mude se alterar os arquivos cacheados
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png'
];

// Instala o Service Worker e guarda a página inicial
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições para o Firebase, deixando-as passar direto para a rede.
  // Isso garante que a autenticação seja sempre aplicada corretamente pelo app.
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('firebasestorage.googleapis.com')) {
    return; // Deixa a requisição prosseguir sem interceptação.
  }

  // Para todas as outras requisições, usa a estratégia "Stale-While-Revalidate".
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchPromise; // Serve do cache primeiro, depois atualiza.
      });
    })
  );
});