const CACHE_NAME = "cloka-cache-v2";
const STATIC_CACHE_NAME = "cloka-static-v2";
const DYNAMIC_CACHE_NAME = "cloka-dynamic-v2";

// Static assets that can be cached aggressively
const STATIC_ASSETS = [
  "/",
  "/site.webmanifest",
  "/favicon.ico",
  "/logo.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
];

// API routes that should use network-first strategy
const API_ROUTES = [
  "/api/events",
  "/api/feed",
  "/api/user",
  "/api/notifications",
  "/api/products",
];

// Install a service worker
self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
  // Skip waiting to activate immediately
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log("Caching static assets");
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`Failed to cache static asset ${url}:`, err);
              return null;
            })
          )
        );
      }),
      // Create dynamic cache
      caches.open(DYNAMIC_CACHE_NAME),
    ]).then(() => {
      console.log("Cache setup completed");
    })
  );
});

// Cache and return requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests for caching
  if (request.method !== "GET") {
    return;
  }

  // Check if this is an API route that needs network-first strategy
  const isApiRoute = API_ROUTES.some((route) => url.pathname.startsWith(route));

  if (isApiRoute) {
    // Network-first strategy for API routes with better cache management
    event.respondWith(
      fetch(request, {
        // Add cache-busting headers for critical API routes
        headers: {
          ...request.headers,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            // Clone the response before using it
            const responseClone = response.clone();

            // Cache the fresh response with timestamp
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              // Add timestamp to cache key for better invalidation
              const cacheKey = new Request(
                request.url + "?sw_timestamp=" + Date.now(),
                {
                  method: request.method,
                  headers: request.headers,
                }
              );
              cache.put(cacheKey, responseClone);

              // Also store the original request for fallback
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log("Serving API response from cache:", url.pathname);
              // Add a header to indicate this is cached data
              const headers = new Headers(cachedResponse.headers);
              headers.set("X-Served-From-Cache", "true");
              headers.set("X-Cache-Timestamp", new Date().toISOString());

              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers,
              });
            }
            // If no cache, return a fallback response
            return new Response(
              JSON.stringify({ error: "Network unavailable" }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          });
        })
    );
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(request).then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});

// Update a service worker
self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

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

      // Notify all clients about the update
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_UPDATED",
            message: "Service worker updated successfully",
          });
        });
      });
    })
  );
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Clearing cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }

  if (event.data && event.data.type === "INVALIDATE_CACHE") {
    const { urlPattern } = event.data;
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          const requestsToDelete = requests.filter((request) => {
            const url = new URL(request.url);
            return url.pathname.includes(urlPattern);
          });

          return Promise.all(
            requestsToDelete.map((request) => {
              console.log("Invalidating cache for:", request.url);
              return cache.delete(request);
            })
          );
        });
      })
    );
  }

  if (event.data && event.data.type === "CLEAR_EVENTS_CACHE") {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          const eventRequests = requests.filter((request) => {
            const url = new URL(request.url);
            return (
              url.pathname.includes("/api/events") ||
              url.pathname.includes("/api/user/events") ||
              url.pathname.includes("/api/feed")
            );
          });

          return Promise.all(
            eventRequests.map((request) => {
              console.log("Clearing events cache for:", request.url);
              return cache.delete(request);
            })
          );
        });
      })
    );
  }
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
