// Caching logic with stale-while-revalidate strategy

const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `static-cache-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `image-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `api-cache-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://i.postimg.cc/QNW4B8KQ/00WZrbng.png', // favicon
  'https://i.postimg.cc/g2mhxC8q/vas_AGbotko-OBs.png', // logo
];

// Stale-while-revalidate function
const staleWhileRevalidate = (request, cacheName) => {
  return caches.open(cacheName).then(cache => {
    return cache.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request).then(networkResponse => {
        // Check if we received a valid response
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        // The network request failed, possibly offline.
        // The cachedResponse will be used if it exists.
        console.warn(`Service Worker: Fetch failed for ${request.url}; using cache if available.`, err);
      });
      return cachedResponse || fetchPromise;
    });
  });
};

// Install: Cache the app shell
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting()) // Activate new service worker immediately
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Delete all caches except the current ones
          return ![STATIC_CACHE_NAME, IMAGE_CACHE_NAME, API_CACHE_NAME].includes(cacheName);
        }).map(cacheName => {
          console.log('Service Worker: Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

// Fetch: Implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignore requests to Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API calls for streamer data
  if (url.hostname.includes('kick.com') && url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME));
    return;
  }
  
  // Image requests from postimg.cc or kick.com user content
  if (request.destination === 'image' && (url.hostname.includes('postimg.cc') || url.hostname.includes('kick.com'))) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE_NAME));
    return;
  }

  // For app shell and other assets, use a cache-first strategy.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request).then(fetchResponse => {
        // Cache newly fetched static assets
        if (fetchResponse && fetchResponse.status === 200) {
           return caches.open(STATIC_CACHE_NAME).then(cache => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
           });
        }
        return fetchResponse;
      });
    })
  );
});

// Push notification logic
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || 'https://i.postimg.cc/QNW4B8KQ/00WZrbng.png', // Fallback icon
    data: { url: data.url },
    tag: data.tag,
    renotify: true,
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;
  if (!urlToOpen) return;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(clientList => {
      for (const client of clientList) {
        if (new URL(client.url).pathname === new URL(urlToOpen).pathname && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});