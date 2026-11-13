// Cache hors-ligne du jeu Wald Royale (3D)
var V = 'wald-royale-3d-v20';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'three.min.js', 'polo3d.js', 'skins.js', 'nature.js', 'weapons3d.js', 'city.js', 'polo3d.html', 'avatar.jpg', 'logo.jpg', 'sons/polo.mp3', 'sons/wald_off.mp3', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); if (r.ok && new URL(e.request.url).origin === location.origin) caches.open(V).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('./'); }); }));
});
