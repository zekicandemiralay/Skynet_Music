const CACHE = 'skynet-v4';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { pathname } = new URL(e.request.url);

  // Never intercept API calls
  if (pathname.startsWith('/api/')) return;

  // Navigation (HTML): network-first so the app always loads with the latest
  // JS/CSS filenames after a deploy. Falls back to cache only when offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put('/', res.clone()));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets (JS, CSS, images): content-hashed by Vite so safe to cache
  // forever. Serve from cache instantly; fetch in background to warm new hashes.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const update = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || update;
    })
  );
});
