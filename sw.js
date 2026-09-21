/* Tracker Spese: fa funzionare l'app anche senza connessione.
   Con la rete prende sempre la versione più recente della pagina, senza rete usa la copia salvata.
   I tuoi dati non passano mai di qui: restano nella memoria dell'app sul dispositivo. */
const CACHE = 'tracker-spese-app';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const fromNet = fetch(req, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    const timeout = new Promise(r => setTimeout(r, 3000, null));
    try {
      const res = await Promise.race([fromNet, timeout]);
      if (res) return res;
    } catch (err) {}
    const hit = await cache.match(req, { ignoreSearch: true }) || await cache.match('./index.html') || await cache.match('./');
    return hit || fromNet;
  })());
});
