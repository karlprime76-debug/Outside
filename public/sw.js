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
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_RESOURCES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const cachesToKeep = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !cachesToKeep.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip Next.js data (already handled by SW bundle)
  if (url.pathname.startsWith("/_next/data/")) return;

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images: cache-first with background update
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // API GET requests: network-first, fallback to cache
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

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
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
    icon: payload.icon || "/icon.png",
    badge: payload.badge || "/icon.png",
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
