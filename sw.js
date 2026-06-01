const CACHE = 'vasteria-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/home.html',
  '/global.css',
  '/auth.css',
  '/style.css',
  '/themes.css',
  '/auth.js?v=20260508',
  '/themes.js?v=20260508',
  '/bg.js?v=20260508',
  '/index.js?v=20260508',
  '/cloud/vgcloud.js?v=20260508',
  '/manifest.json',
  '/pwa-icons/icon.svg',
  '/pwa-icons/icon-maskable.svg'
];

// Hosts que nunca devem ser cacheados (Firebase, Google APIs)
const SKIP_HOSTS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'securetoken.googleapis.com',
  'identitytoolkit.googleapis.com',
  'www.googleapis.com',
  'fcmregistrations.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'storage.googleapis.com'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;

  // Navegação (HTML): network-first, fallback offline para index
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(r => { putCache(request, r.clone()); return r; })
        .catch(() => caches.match(request).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  // Assets estáticos: cache-first, atualiza em background
  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(r => {
        if (r.ok) putCache(request, r.clone());
        return r;
      });
      return cached || network;
    })
  );
});

async function putCache(req, res) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(req, res);
  } catch (_) {}
}
