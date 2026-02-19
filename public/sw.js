const CACHE_NAME = 'biometric-storage-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if some assets aren't available
        return cache.add('/').catch(() => {})
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API requests - they need fresh data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone()
            const cache = caches.open(CACHE_NAME)
            cache.then((c) => c.put(request, responseClone))
          }
          return response
        })
        .catch(async () => {
          // Return cached API response if available
          const cached = await caches.match(request)
          if (cached) {
            return cached
          }
          // Return offline error response
          return new Response(
            JSON.stringify({
              error: 'You are offline. Some features may be limited.',
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        })
    )
    return
  }

  // For static assets: cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone()
            const cache = caches.open(CACHE_NAME)
            cache.then((c) => c.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // Return cached version or 404
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline - Resource not available', { status: 503 })
          })
        })
    })
  )
})

// Background sync - sync data when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-files') {
    event.waitUntil(syncFiles())
  }
})

async function syncFiles() {
  try {
    // This would sync any pending file uploads when connection is restored
    return Promise.resolve()
  } catch (error) {
    console.error('Background sync failed:', error)
    throw error
  }
}

// Push notifications (optional feature)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'You have a notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'notification',
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification('Biometric File Storage', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
