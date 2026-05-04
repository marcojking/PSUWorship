// Service Worker for caching piano samples
const CACHE_NAME = 'piano-samples-v1';

// Patterns to match piano sample URLs (smplr uses these CDNs)
const SAMPLE_PATTERNS = [
  /.*\.mp3$/,
  /.*\.ogg$/,
  /.*\.wav$/,
  /gleitz\.github\.io.*soundfont/,
  /unpkg\.com.*smplr/,
  /cdn\.jsdelivr\.net.*smplr/,
];

// Check if URL should be cached
function shouldCache(url) {
  return SAMPLE_PATTERNS.some(pattern => pattern.test(url));
}

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// Fetch event - cache piano samples
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only handle GET requests for audio samples
  if (event.request.method !== 'GET' || !shouldCache(url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        // Fetch and cache
        return fetch(event.request).then((networkResponse) => {
          // Clone the response since we need to use it twice
          const responseToCache = networkResponse.clone();

          // Only cache successful responses
          if (networkResponse.ok) {
            cache.put(event.request, responseToCache);
          }

          return networkResponse;
        });
      });
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({
          cached: keys.length > 0,
          count: keys.length,
        });
      });
    });
  }
});
