const CACHE_NAME = 'ovm-pro-v2.0-lightning-fast';
const OFFLINE_CACHE = 'ovm-offline-v2.0-lightning-fast';
const ASSETS_CACHE = 'ovm-assets-v2.0-lightning-fast';

// Ultra-optimized critical resources for instant PWA loading
const CRITICAL_RESOURCES = [
  '/',
  '/index.html', 
  '/offline.html',
  '/manifest.json',
  '/?source=pwa' // PWA start URL for iOS compatibility
];

// Assets to aggressively cache for instant access
const STATIC_ASSETS = [
  '/attached_assets/ovmlogo_1753908468997.png',
  '/attached_assets/avatar_1753922692670.png'
];

// API endpoints to cache for offline driver functionality
const API_CACHE_PATTERNS = [
  '/api/drivers/current/jobs',
  '/api/drivers/current/profile'
];

// INSTANT PWA LOADING - Install event with app shell caching
self.addEventListener('install', (event) => {
  console.log('Service Worker installing for instant PWA loading...');
  event.waitUntil(
    Promise.all([
      // Cache critical resources for instant loading
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('Pre-caching app shell for instant PWA startup...');
          return cache.addAll(CRITICAL_RESOURCES);
        }),
      // Cache static assets separately
      caches.open(ASSETS_CACHE)
        .then(cache => {
          return cache.addAll(STATIC_ASSETS);
        })
    ])
    .then(() => {
      console.log('Service Worker installed - PWA ready for instant loading!');
      self.skipWaiting();
    })
    .catch(error => {
      console.error('Service Worker install failed:', error);
    })
  );
});

// Activate event - smart cache cleanup (preserve app shell)
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, OFFLINE_CACHE, ASSETS_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !validCaches.includes(cacheName))
            .map(cacheName => {
              console.log('Cleaning old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker activated - app shell preserved for instant loading');
        return self.clients.claim();
      })
  );
});

// INSTANT PWA LOADING - Fetch event with navigation caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip admin API requests completely
  if (url.pathname.startsWith('/api/') && !isDriverRequest(url.pathname)) {
    return; 
  }
  
  // Handle driver API requests with stale-while-revalidate
  if (url.pathname.startsWith('/api/') && isDriverRequest(url.pathname)) {
    event.respondWith(handleDriverApiRequestFast(request));
    return;
  }
  
  // CRITICAL: Handle navigation requests for instant PWA loading
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle static resources with cache-first strategy
  event.respondWith(handleStaticResourceRequest(request));
});

// INSTANT navigation handling - serves app shell from cache immediately
async function handleNavigationRequest(request) {
  try {
    // Try to match exact request first
    let cachedResponse = await caches.match(request);
    
    // If not found, try root with ignoreSearch (handles /?source=pwa)
    if (!cachedResponse) {
      const rootRequest = new Request('/', { 
        headers: request.headers,
        mode: request.mode,
        credentials: request.credentials,
        cache: request.cache
      });
      cachedResponse = await caches.match(rootRequest);
    }
    
    // Return cached app shell instantly for PWA performance
    if (cachedResponse) {
      console.log('🚀 Serving app shell from cache for instant PWA load');
      
      // Update cache in background
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
            });
          }
        })
        .catch(() => {}); // Silent background update
      
      return cachedResponse;
    }
    
    // Fallback to network for navigation
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Offline fallback
    console.log('Navigation offline, serving cached app shell');
    return caches.match('/') || caches.match('/offline.html');
  }
}

// Ultra-fast driver API handling with stale-while-revalidate
async function handleDriverApiRequestFast(request) {
  const cache = await caches.open(OFFLINE_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached data IMMEDIATELY if available (stale-while-revalidate)
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse); // Fallback to cache on network error
  
  // Return cached immediately, update in background
  return cachedResponse || fetchPromise;
}

// Optimized static resource handling
async function handleStaticResourceRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Update cache occasionally in background
      if (Math.random() < 0.1) {
        fetch(request)
          .then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, response.clone());
              });
            }
          })
          .catch(() => {});
      }
      return cachedResponse;
    }
    
    // Not cached, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && networkResponse.status === 200) {
      const contentType = networkResponse.headers.get('content-type') || '';
      const shouldCache = 
        contentType.includes('text/html') ||
        contentType.includes('application/javascript') ||
        contentType.includes('text/css') ||
        contentType.includes('image/');
      
      if (shouldCache) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
    
  } catch (error) {
    // Offline fallback
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection restored
async function syncOfflineData() {
  try {
    // Use localStorage instead of IndexedDB to avoid transaction errors
    const offlineRequestKeys = Object.keys(localStorage).filter(key => key.startsWith('ovm_offline_request_'));
    
    for (const key of offlineRequestKeys) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        
        if (response.ok) {
          // Remove successfully synced item
          localStorage.removeItem(key);
          console.log('Successfully synced and removed:', key);
        }
      } catch (error) {
        console.log('Sync failed for item:', key, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Queue offline request for later sync using localStorage
async function queueOfflineRequest(requestData) {
  try {
    // Use localStorage-only to avoid IndexedDB errors
    const requestId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    const offlineRequest = {
      ...requestData,
      id: requestId,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`ovm_offline_request_${requestId}`, JSON.stringify(offlineRequest));
    console.log('Request queued for offline sync using localStorage');
  } catch (error) {
    console.error('Failed to queue offline request in localStorage:', error);
  }
}

// Check if request is from driver interface - ONLY handle very specific driver API calls
function isDriverRequest(pathname) {
  return pathname.includes('/drivers/jobs/') || // Driver job-specific routes like /drivers/jobs/123/collection
         pathname.includes('/api/jobs/by-number/') || // Job lookup by number for drivers
         (pathname.includes('/api/jobs/') && pathname.includes('/process')) || // Collection/delivery process APIs
         (pathname.includes('/api/jobs/') && pathname.includes('/photos')) || // Photo upload APIs for jobs
         (pathname.includes('/api/jobs/') && pathname.includes('/signatures')); // Signature APIs for jobs
}

// Handle driver API requests with offline support
async function handleDriverApiRequest(request) {
  try {
    const response = await fetch(request.clone());
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      const responseClone = response.clone();
      const cache = await caches.open(OFFLINE_CACHE);
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    // Handle offline scenarios
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } else {
      // Queue POST/PATCH/PUT requests for later sync
      const body = await request.clone().text();
      await queueOfflineRequest({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: body
      });
      
      return new Response(JSON.stringify({ 
        queued: true, 
        message: 'Data saved offline and will sync when connection is restored' 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// localStorage-only helper to avoid IndexedDB errors
function openDB() {
  // IndexedDB completely disabled - return null immediately
  return Promise.resolve(null);
}