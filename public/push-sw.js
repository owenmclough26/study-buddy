/* Study Buddy: notification handling, loaded into the main service worker. */

// A reminder arrives from the server
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Study Buddy', {
      body: data.body || '',
      icon: '/pwa-192.png',
      tag: data.tag, // same tag replaces an older notification instead of stacking
      renotify: !!data.tag,
      data: { url: data.url || '/' },
    }),
  )
})

// Tapping a reminder opens the app at the right room
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.navigate(url).then((c) => (c || client).focus())
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
