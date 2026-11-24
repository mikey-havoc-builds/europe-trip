/* Offline support: app shell cached, itinerary network-first, map tiles and photos cached as viewed. */
const V = 'trip-v1.0.0', RUNTIME = 'trip-runtime';
const SHELL = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'data.enc.json', 'vendor/leaflet.js', 'vendor/leaflet.css', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function trim() { const c = await caches.open(RUNTIME); const ks = await c.keys(); for (let i = 0; i < ks.length - 1500; i++) await c.delete(ks[i]); }
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.endsWith('data.enc.json')) {
      e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put('data.enc.json', cp)); return r; }).catch(() => caches.match('data.enc.json')));
      return;
    }
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; }).catch(() => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return hit || net;
    }));
    return;
  }
  if (/basemaps\.cartocdn\.com$|upload\.wikimedia\.org$/.test(url.hostname)) {
    e.respondWith(caches.open(RUNTIME).then(async c => { const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req); if (r.ok || r.type === 'opaque') { c.put(req, r.clone()); trim(); } return r; }));
  }
});
