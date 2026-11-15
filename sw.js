// Bump this number every time you upload a new index.html so devices refresh.
const V = 'prepsec-v7-1';
const LOCAL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const REMOTE = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(LOCAL);
    for (const url of REMOTE) {
      try { await c.put(url, await fetch(new Request(url, { mode: 'no-cors' }))); } catch (err) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Network first (so uploads show up right away), cache as the offline fallback.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res && (res.ok || res.type === 'opaque')) {
        const c = await caches.open(V);
        c.put(e.request, res.clone());
      }
      return res;
    } catch (err) {
      return (await caches.match(e.request)) || (await caches.match('./index.html'));
    }
  })());
});
