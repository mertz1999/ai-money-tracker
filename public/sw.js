// Update this version number whenever you make changes to force cache refresh
const CACHE_VERSION = '1.0.1';
const CACHE_NAME = `money-tracker-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/css/styles.css',
  '/js/main.js',
  '/components/sidebar.html',
  '/components/summary-cards.html',
  '/components/sources-table.html',
  '/components/transactions-table.html',
  '/components/modals.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing with cache version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event - network first, then cache (better for development)
self.addEventListener('fetch', (event) => {
  // Skip caching for API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Update cache in background
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If both fail and it's a document request, show offline page
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating, cleaning old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline transactions when back online
  const offlineTransactions = await getOfflineTransactions();
  for (const transaction of offlineTransactions) {
    try {
      await syncTransaction(transaction);
      await removeOfflineTransaction(transaction.id);
    } catch (error) {
      console.log('Failed to sync transaction:', error);
    }
  }
}

// Helper functions for offline storage
async function getOfflineTransactions() {
  // Implementation for getting offline transactions
  return [];
}

async function syncTransaction(transaction) {
  // Implementation for syncing transaction to server
  return fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(transaction)
  });
}

async function removeOfflineTransaction(id) {
  // Implementation for removing synced transaction
  return Promise.resolve();
}
