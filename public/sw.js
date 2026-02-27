// LIMPP DAY Service Worker
const CACHE_NAME = 'limpp-day-v1'

// Install
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'LIMPP DAY', body: 'Nova notificacao', icon: '/logo.jpg' }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo.jpg',
      badge: '/logo.jpg',
      vibrate: [200, 100, 200],
      data: data.url || '/login',
    })
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data || '/login'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
