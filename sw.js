var CACHE_NAME = 'stockops-v4';
var GAS_URL    = 'https://script.google.com/macros/s/AKfycbzFYVHCWG9D6lfkPuylb5_-uMY5_S0H8rcwDu9pAcXi/dev';

// Shell minimo — apenas uma entrada para a raiz (evita duplicata index.html)
var SHELL = [
  '/stockops/',
  '/stockops/icon-192.png',
  '/stockops/icon-512.png',
  '/stockops/manifest.json'
];

// -------------------------------------------------------
// INSTALL: pre-cacheia o shell
// -------------------------------------------------------
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(SHELL);
      })
      .then(function() {
        // Ativa imediatamente sem esperar o cliente recarregar
        return self.skipWaiting();
      })
  );
});

// -------------------------------------------------------
// ACTIVATE: remove caches de versoes anteriores
// -------------------------------------------------------
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('[SW] Removendo cache antigo:', k);
              return caches.delete(k);
            })
        );
      })
      .then(function() {
        // Assume controle de todos os clientes abertos imediatamente
        return self.clients.claim();
      })
  );
});

// -------------------------------------------------------
// FETCH: network-first para o shell, ignora GAS (cross-origin)
// -------------------------------------------------------
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Nao interceptar requests cross-origin para o GAS
  if (url.indexOf('script.google.com') >= 0) return;

  // Nao interceptar requests que nao sejam GET
  if (e.request.method !== 'GET') return;

  // Nao interceptar requests de outras origens (ex: extensoes do browser)
  if (url.indexOf(self.location.origin) < 0) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Cacheia apenas respostas validas (status 200, tipo basico)
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Rede indisponivel: tenta servir do cache
        return caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          // Fallback final: serve a raiz do app (para navegacao offline)
          return caches.match('/stockops/');
        });
      })
  );
});
