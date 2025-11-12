// This service worker is intentionally left without fetch/caching logic to ensure
// the client always retrieves the freshest content from the network, as requested.
// Its sole purpose is now to handle push notifications.

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