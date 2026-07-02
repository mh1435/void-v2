// Network-first service worker.
// An earlier cache-first version served stale builds, so caching was removed
// entirely. This version is safe: every request goes to the network first and
// the cache is only a fallback for when the device is offline — fresh deploys
// always win, but the app still opens with no connection.
const CACHE = 'void-net-first-v1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './gamehub-data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await cache.addAll(APP_SHELL);
    } catch (_) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never intercept API calls

  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      // Keep the offline copy current with whatever the network just served
      if (fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (_) {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html', { ignoreSearch: true });
        if (shell) return shell;
      }
      throw _;
    }
  })());
});
