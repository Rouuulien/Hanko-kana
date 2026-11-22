/* Hanko · service worker : l'appli fonctionne hors ligne.
   Fichiers du site (HTML, modules JS, CSS, données) : réseau d'abord, en revalidant le cache HTTP,
   pour qu'une page à jour ne soit jamais servie avec d'anciens modules ; cache si hors ligne.
   Le reste (icônes, polices, bibliothèque Supabase) : cache d'abord.
   Les appels à Supabase ne sont jamais mis en cache. */
const V = 'hanko-v10';
const SHELL = ['./', './index.html', './styles.css', './src/util.js', './src/core/romaji.js', './src/core/state.js', './src/core/merge.js', './src/core/srs.js', './src/core/progress.js', './src/draw/strokes.js', './src/draw/recognize.js', './src/draw/svg.js', './src/sync/cloud.js', './src/ui/app-state.js', './src/ui/icons.js', './src/ui/daru.js', './src/ui/sounds.js', './src/data/kana.js', './src/data/notes.js', './src/data/words.js',
  './confidentialite.html', './manifest.webmanifest', './data/kana-strokes.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('supabase.co') || u.protocol.startsWith('chrome')) return;
  const keep = res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; };
  if (r.mode === 'navigate' || (u.origin === location.origin && /\.(html|js|css|json)$/.test(u.pathname))) {
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(keep).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(keep)));
});
