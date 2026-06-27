// Self-destructing service worker.
// Earlier versions cached the app shell and kept serving stale builds. This
// version takes control, deletes every cache, unregisters itself, and reloads
// open pages so they fetch everything fresh from the network from now on.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) {}
  })());
});

// Pure pass-through — never serve from cache.
self.addEventListener('fetch', () => {});
