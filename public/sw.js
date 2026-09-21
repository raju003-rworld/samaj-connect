// Service Worker for Samaj Connect Push & Local Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "સમાજ કનેક્ટ", body: event.data.text() };
    }
  }

  const title = data.title || "સમાજ કનેક્ટ";
  const options = {
    body: data.body || "નવો સંદેશ મળ્યો છે",
    icon: data.icon || "/icon.svg",
    badge: "/icon.svg",
    vibrate: [200, 100, 200],
    tag: data.tag || `sc_msg_${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || data.link || "/messages",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/messages";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
