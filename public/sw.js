const CACHE = "src-dostop-v1";
const SHELL = ["/src-rata-ta/dostop", "/src-rata-ta/icons/icon-192.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes("/functions/v1/")) return; // Supabase Edge Functions — bypass

  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r => r ?? caches.match("/src-rata-ta/dostop"))
    )
  );
});
