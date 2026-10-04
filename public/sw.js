const CACHE_NAME = 'esse-otoyikama-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First strategy: Always fetch live network version so changes are seen instantly
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
  );
});

// Listen for message events from client tabs to display native system notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data;
    const options = {
      body: body || '',
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: tag || 'esse-appointment-notification',
      renotify: true,
      data: {
        url: '/',
        dateOfArrival: Date.now(),
      },
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Esse Detailing', options)
    );
  }
});

// Handle push events (if backend push is configured)
self.addEventListener('push', (event) => {
  let data = { title: 'Esse Detailing', body: 'Randevu durumunuz güncellendi.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Esse Detailing', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'esse-push-notification',
    renotify: true,
    data: {
      url: '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Esse Detailing', options)
  );
});

// When user taps on the native notification in device/browser tray
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK' });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
