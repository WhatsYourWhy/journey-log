const CACHE_VERSION = 'journey-log-shell-v2';
const APP_SHELL_FILES = [
  'index.html',
  'style.css',
  'script.js',
  'src/domain/insights.js',
  'src/domain/tasks.js',
  'src/services/storage.js',
  'src/ui/render.js',
  'src/app/init.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const normalizedPath = requestUrl.pathname.replace(/^\//, '');
  const leafPath = normalizedPath.split('/').pop();
  const isAppShellRequest = APP_SHELL_FILES.includes(normalizedPath) || APP_SHELL_FILES.includes(leafPath);

  if (!isSameOrigin || !isAppShellRequest) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      });
    })
  );
});
