const CACHE_NAME = 'ceny-paliw-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './cenypaliw/fuelstyle.css',
  './cenypaliw/fuelscript.js'
];

// Instalacja Service Workera i zapisywanie plików do pamięci podręcznej
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Serwowanie plików z pamięci podręcznej (przyspiesza działanie)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Czyszczenie starych pamięci podręcznych przy aktualizacji plików
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
