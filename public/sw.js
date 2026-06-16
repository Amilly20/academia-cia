const CACHE_NAME = 'cia-fitness-v1';

// Instala o Service Worker e guarda a página inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
});

// Intercepta requisições (Obrigatório para o Chrome liberar a instalação nativa)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match('/'))
  );
});