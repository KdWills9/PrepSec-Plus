// Bump this number every time you upload a new index.html so devices refresh.
const V = 'prepsec-v115-1';
const LOCAL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const REMOTE = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];
// Cross-origin files that are safe to keep for offline use. Everything else
// (Google sign-in, the Firestore database) is left alone so it is never cached.
const CACHEABLE_HOSTS = ['cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

function cacheable(url) {
  if (url.origin === self.location.origin) return true;
  if (CACHEABLE_HOSTS.includes(url.hostname)) return true;
  return url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
}

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
  const url = new URL(e.request.url);
  if (!cacheable(url)) return;
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
