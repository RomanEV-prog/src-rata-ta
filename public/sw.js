// Service worker za /dostop (odpiranje vrat). Poti so RELATIVNE na mesto, kjer
// leži sw.js, zato ista datoteka deluje na strelisce-maribor.si (koren) in na
// GitHub Pages zrcalu (/src-rata-ta/). Prej so bile poti trdo vpisane za zrcalo
// in namestitev na pravi domeni je padla (addAll → 404).
const CACHE = "src-dostop-v2";
const BASE = new URL("./", self.location.href).pathname; // "/" ali "/src-rata-ta/"
const DOSTOP = BASE + "dostop/";
const SHELL = [DOSTOP, BASE + "icons/icon-192.svg"];

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
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/functions/v1/")) return; // Supabase Edge Functions — bypass
  // Prestrezamo SAMO stran /dostop — ostale strani gredo mimo service workerja
  // (prej je ob izpadu omrežja vsaka stran dobila predpomnjen /dostop).
  if (e.request.method !== "GET" || !url.pathname.startsWith(DOSTOP)) return;

  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r => r ?? caches.match(DOSTOP))
    )
  );
});
