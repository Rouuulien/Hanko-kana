/* Hanko · service worker : l'appli fonctionne hors ligne.
   Pages HTML : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
   Le reste (icônes, polices, bibliothèque Supabase) : cache d'abord.
   Les appels à Supabase ne sont jamais mis en cache. */
const V = 'hanko-v5';
const SHELL = ['./', './index.html', './confidentialite.html', './manifest.webmanifest', './data/kana-strokes.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
  if (r.mode === 'navigate' || (u.origin === location.origin && u.pathname.endsWith('.html'))) {
    e.respondWith(fetch(r).then(keep).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(keep)));
});
