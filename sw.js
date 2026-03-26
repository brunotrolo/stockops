var CACHE_NAME = 'stockops-v3';
var GAS_URL    = 'https://script.google.com/macros/s/AKfycbzFYVHCWG9D6lfkPuylb5_-uMY5_S0H8rcwDu9pAcXi/dev';
var SHELL = [
  '/stockops/',
  '/stockops/index.html',
  '/stockops/icon-192.png',
  '/stockops/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Network-first: tenta rede, cai no cache se offline
self.addEventListener('fetch', function(e) {
  // Nao interceptar requests para o GAS (cross-origin)
  if (e.request.url.indexOf('script.google.com') >= 0) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        return caches.match(e.request);
      })
  );
});
