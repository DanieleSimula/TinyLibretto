const CACHE = 'tinylibretto-v10';
const FILES = ['./', './index.html', './style.css', './segreteria.css', './app.js', './icon.svg', './favicon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  // cache: 'reload' scavalca la cache HTTP, così la versione nuova non salva copie vecchie
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

// La versione v1 non ha la barra "Nuova versione disponibile": le sue pagine aperte
// vengono ricaricate una volta sola, così passano subito alla versione nuova.
// Dalle versioni successive in poi ci pensa la barra.
const VERSIONI_SENZA_AVVISO = ['tinylibretto-v1'];

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      const daVecchia = keys.some(k => VERSIONI_SENZA_AVVISO.includes(k));
      return Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        .then(() => self.clients.claim())
        .then(() => {
          if (!daVecchia) return;
          return self.clients.matchAll({ type: 'window' })
            .then(pagine => Promise.all(pagine.map(p => p.navigate(p.url))));
        });
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
