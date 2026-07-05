// Minimaler Service Worker: macht ValCrypta installierbar und hält die
// App-Shell offline verfügbar. Nachrichten selbst laufen weiter live über
// Supabase — hier wird ausschließlich statisches, unverschlüsseltes
// Build-Material gecacht, nie API-Antworten oder Chiffretext.
const CACHE = 'valcrypta-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation: Netz zuerst (frischer Build), Cache als Offline-Fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Nur eigene statische Assets cachen (Vite-Dateien sind inhaltsgehasht,
  // Cache-first ist dort sicher). Fremd-Origins (Supabase, Fonts) unberührt.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
