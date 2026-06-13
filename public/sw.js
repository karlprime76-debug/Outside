/* OUTSIDE Push Service Worker — with offline cache */

const STATIC_CACHE = "outside-static-v1";
const API_CACHE = "outside-api-v1";
const IMAGE_CACHE = "outside-images-v1";

const STATIC_RESOURCES = [
  "/",
  "/home",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(
        STATIC_RESOURCES.map((url) =>
          cache.add(url).catch(() => console.warn("[SW] Failed to precache", url))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const cachesToKeep = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("outside-") && !cachesToKeep.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeoutMs = 5000) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return caches.match("/offline");
    }
    return new Response("Offline", { status: 503 });
  }
}

const STATIC_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

async function cacheFirstWithAge(request, cacheName, maxAge) {
  const cached = await caches.match(request);
  if (cached) {
    const dateHeader = cached.headers.get("date");
    if (dateHeader) {
      const cachedTime = new Date(dateHeader).getTime();
      if (Date.now() - cachedTime < maxAge) {
        return cached;
      }
    }
    // No Date header — use cached response anyway (better than nothing)
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/_next/data/")) return;

  // Hashed static assets: cache-first (safe, URL changes on content change)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Unhashed JS/CSS: network-first to avoid stale cache
  if (url.pathname.match(/\.(js|css|woff2?|ttf)$/)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Images: cache-first with freshness check
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/)) {
    event.respondWith(cacheFirstWithAge(request, IMAGE_CACHE, STATIC_CACHE_MAX_AGE));
    return;
  }

  // API GET requests: network-first with timeout
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Page navigations: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
});

/* Push notification handlers */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "OUTSIDE", body: event.data.text() };
  }

  const title = payload.title || "OUTSIDE";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
    tag: payload.tag || payload.url || undefined,
    data: { url: payload.url || "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
