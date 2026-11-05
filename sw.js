/* Фокус ЕГЭ — service worker для офлайн-режима и установки как приложения. */
const CACHE_NAME = 'fokus-ege-v11';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/ui-refresh.css',
  './css/motion.css',
  './js/data.js',
  './js/fipi-data.js',
  './js/essay-data.js',
  './js/practice.js',
  './js/visuals-data.js',
  './js/constants.js',
  './js/essay-works-practice.js',
  './js/core.js',
  './js/sync.js',
  './js/search.js',
  './js/features.js',
  './js/model.js',
  './js/ui.js',
  './js/views.js',
  './js/essay-views.js',
  './js/onboarding.js',
  './js/auth.js',
  './js/app.js',
  './icons/favicon.ico',
  './icons/favicon-16.png',
  './icons/favicon-32.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/visuals/maps/map-east-slavs.svg',
  './assets/visuals/maps/map-mongol.svg',
  './assets/visuals/maps/map-muscovy.svg',
  './assets/visuals/maps/map-peter.svg',
  './assets/visuals/maps/map-1812.svg',
  './assets/visuals/maps/map-crimea-1853.svg',
  './assets/visuals/maps/map-crimea-1877.svg',
  './assets/visuals/maps/map-civil.svg',
  './assets/visuals/maps/map-wwii.svg',
  './assets/visuals/appearance-christ.jpg',
  './assets/visuals/barge-haulers.jpg',
  './assets/visuals/black-square.jpg',
  './assets/visuals/bolshoi-theatre.jpg',
  './assets/visuals/bronze-horseman.jpg',
  './assets/visuals/christ-saviour.jpg',
  './assets/visuals/conservatory.jpg',
  './assets/visuals/isaac-cathedral.jpg',
  './assets/visuals/kazan-cathedral.jpg',
  './assets/visuals/last-day-pompeii.jpg',
  './assets/visuals/lenin-mausoleum.jpg',
  './assets/visuals/mariinsky.jpg',
  './assets/visuals/melnikov-house.jpg',
  './assets/visuals/minin-pozharsky.jpg',
  './assets/visuals/morning-execution.jpg',
  './assets/visuals/moscow-kremlin.jpg',
  './assets/visuals/motherland.jpg',
  './assets/visuals/msu.jpg',
  './assets/visuals/novodevichy.jpg',
  './assets/visuals/ostankino-tower.jpg',
  './assets/visuals/pashkov-house.jpg',
  './assets/visuals/pokrova-nerli.jpg',
  './assets/visuals/red-horse.jpg',
  './assets/visuals/saint-basil.jpg',
  './assets/visuals/shukhov-tower.jpg',
  './assets/visuals/sophia-kiev.jpg',
  './assets/visuals/sophia-novgorod.jpg',
  './assets/visuals/trinity-rublev.jpg',
  './assets/visuals/uspensky-vladimir.jpg',
  './assets/visuals/vdnh.jpg',
  './assets/visuals/winter-palace.jpg',
  './assets/visuals/worker-kolkhoz.jpg',
  './assets/fipi/math/2026-demo/graph-task-11.png',
  './assets/fipi/physics/2026-demo/graph-task-1.png',
  './assets/fipi/physics/2026-demo/springs-task-2.png',
  './assets/fipi/history/2026-demo/map-razin-uprising.png',
  './assets/fipi/history/2026-demo/medal-minin-pozharsky.png',
  './assets/fipi/history/2026-demo/culture-1-intercession-nerl.png',
  './assets/fipi/history/2026-demo/culture-2-ascension-kolomenskoye.png',
  './assets/fipi/history/2026-demo/culture-3-assumption-vladimir.png',
  './assets/fipi/history/2026-demo/culture-4-st-isaac.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'reload' });
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await cache.match('./index.html');
    if (shell) return shell;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || network;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/index.html') || url.pathname === '/' || url.pathname.endsWith('/manifest.webmanifest')) {
      event.respondWith(networkFirst(request));
      return;
    }
    if (/\.(png|jpe?g|webp|svg|ico|webmanifest)$/.test(url.pathname)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    if (request.destination === 'script' || request.destination === 'style') {
      event.respondWith(networkFirst(request));
      return;
    }
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
