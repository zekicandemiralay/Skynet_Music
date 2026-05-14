const CACHE = 'skynet-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.add('/')).then(() => self.skipWaiting())
  );
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

  // Navigation: serve cached shell instantly, no network wait
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/').then((cached) =>
        cached || fetch(e.request).then((res) => {
          caches.open(CACHE).then((c) => c.put('/', res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Static assets: serve from cache immediately if available,
  // always fetch in background to keep cache fresh
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
