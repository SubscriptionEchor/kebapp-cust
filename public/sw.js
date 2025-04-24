// sw.js - place this in your public folder
const CACHE_NAME = 'kebab-customer-cache-v1';

// Assets we want to cache using stale-while-revalidate
const ASSET_DESTINATIONS = ['image', 'script', 'style', 'font', 'document', 'manifest', 'json'];
const ASSET_EXTENSIONS = /\.(js|css|png|jpg|jpeg|svg|gif|json|woff2?)$/i;

// Install event
self.addEventListener('install', (event) => {
    // Activate worker immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - implement stale-while-revalidate
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Determine if asset should be cached
    const url = new URL(event.request.url);
    const destination = event.request.destination;
    const shouldCache =
        ASSET_DESTINATIONS.includes(destination) ||
        ASSET_EXTENSIONS.test(url.pathname);

    if (shouldCache) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    // Start network fetch in background
                    const fetchPromise = fetch(event.request)
                        .then((networkResponse) => {
                            // Only cache successful responses
                            if (networkResponse && networkResponse.status === 200) {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            console.log('Network fetch failed for:', event.request.url);
                            return null;
                        });

                    // Return cached response immediately if available
                    // Otherwise wait for network response
                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});
