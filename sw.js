const CACHE_NAME = 'advokat-exam-cache-v2';

const urlsToCache = [
  './',
  './index.html',
  './questionnaire.yaml',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './js-yaml.min.js' // <-- Заменили ссылку на локальный файл
];

// Установка Service Worker и кэширование файлов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Активация и очистка старых кэшей (если вы поменяете v1 на v2 в CACHE_NAME)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Стратегия: Stale-While-Revalidate (Сначала кэш, потом обновление в фоне)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Если скачалось успешно, обновляем кэш
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Если нет сети, игнорируем ошибку fetch (приложение будет работать из кэша)
      });

      // Возвращаем из кэша моментально, если есть, иначе ждем загрузки из сети
      return cachedResponse || fetchPromise;
    })
  );
});
