// Service Worker for Weekendly - Offline functionality
const CACHE_NAME = "weekendly-v2";
const STATIC_CACHE_NAME = "weekendly-static-v2";
const DYNAMIC_CACHE_NAME = "weekendly-dynamic-v2";

// Files to cache for offline functionality
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/App.css",
  "/src/index.css",
  // Add other critical assets
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/activities/,
  /\/api\/categories/,
  /\/api\/weekends/,
  /\/api\/preferences/,
];

// Weather API patterns (cache with shorter TTL)
const WEATHER_CACHE_PATTERNS = [
  /api\.openweathermap\.org/,
  /api\.open-meteo\.com/,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  } else if (isWeatherRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME, 300000)); // 5 min TTL
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
  }
});

// Message event - handle messages from the main thread
self.addEventListener("message", (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
    case "CACHE_ACTIVITIES":
      cacheActivities(payload);
      break;
    case "CLEAR_CACHE":
      clearAllCaches();
      break;
    case "GET_CACHE_STATUS":
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Caching strategies
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Cache first strategy failed:", error);
    return new Response("Offline - Resource not available", { status: 503 });
  }
}

async function networkFirst(request, cacheName, maxAge = 3600000) {
  // 1 hour default
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();

      // Add timestamp for TTL
      const headers = new Headers(responseToCache.headers);
      headers.set("sw-cache-timestamp", Date.now().toString());

      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cached response is still valid
      const cacheTimestamp = cachedResponse.headers.get("sw-cache-timestamp");
      if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < maxAge) {
        return cachedResponse;
      }
    }

    return new Response(
      JSON.stringify({ error: "Offline - No cached data available" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname === "/"
  );
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.href));
}

function isWeatherRequest(request) {
  const url = new URL(request.url);
  return WEATHER_CACHE_PATTERNS.some((pattern) => pattern.test(url.href));
}

// Cache management functions
async function cacheActivities(activities) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(JSON.stringify(activities), {
      headers: {
        "Content-Type": "application/json",
        "sw-cache-timestamp": Date.now().toString(),
      },
    });

    await cache.put("/api/activities", response);
    console.log("Activities cached successfully");
  } catch (error) {
    console.error("Failed to cache activities:", error);
  }
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log("All caches cleared");
  } catch (error) {
    console.error("Failed to clear caches:", error);
  }
}

async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        count: keys.length,
        urls: keys.map((req) => req.url),
      };
    }

    return status;
  } catch (error) {
    console.error("Failed to get cache status:", error);
    return {};
  }
}

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Notify the main thread that sync is starting
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_STARTED" });
    });

    // The actual sync logic will be handled by the persistence store
    // This just notifies the app that it can attempt to sync

    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_COMPLETED" });
    });
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: data.data,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
