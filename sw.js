// sw.js - LibrePT Service Worker for Offline Functionality
const CACHE_NAME = 'librept-v1';
const ASSETS = [
  './',
  './index.html',
  './index.css',
  './app.js',
  './mockData.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version, but fetch fresh version in background to update cache (stale-while-revalidate)
        fetch(e.request).then(response => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, response));
          }
        }).catch(err => console.log('Offline: using cached fallback asset.', err));
        
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
