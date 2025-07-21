const CACHE_NAME = "cloka-cache-v1";
const urlsToCache = [
  "/",
  "/site.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
];

// Install a service worker
self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
  // Skip waiting to activate immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      // Cache each URL individually to handle failures gracefully
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err);
            return null;
          })
        )
      ).then(() => {
        console.log("Cache setup completed");
      });
    })
  );
});

// Cache and return requests
self.addEventListener("fetch", (event) => {
  // Only handle GET requests for caching
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Update a service worker
self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log("Service worker activated and claimed control");
    })
  );
});

// Handle push events
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let notificationData = {
    title: "CLOKA Run Club",
    body: "New notification from CLOKA",
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    tag: "cloka-notification",
    data: {
      url: "/",
    },
  };

  // Parse the push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: {
          url: data.url || notificationData.data.url,
          ...data.data,
        },
        // Additional options
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
      };
    } catch (error) {
      console.error("Error parsing push data:", error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Handle notification click events
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  // Close the notification
  event.notification.close();

  // Handle action clicks
  if (event.action) {
    console.log("Action clicked:", event.action);
    // Handle different actions here if needed
  }

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || "/";

  // Focus or open the app
  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((clientList) => {
      // Check if there's already a window/tab open with this URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);

  // Track notification close event
  if (event.notification.data?.trackingId) {
    fetch("/api/notifications/track-close", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trackingId: event.notification.data.trackingId,
      }),
    }).catch((error) => {
      console.error("Failed to track notification close:", error);
    });
  }
});
