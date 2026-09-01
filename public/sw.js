const CACHE_VERSION = "petgrow-2026-09-01-v1";
const APP_CACHE = `${CACHE_VERSION}-app`;

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(SHELL_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.map((name) => {
        if (name !== APP_CACHE) return caches.delete(name);
        return Promise.resolve(false);
      })
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_PETGROW_CACHES") {
    event.waitUntil((async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    })());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Never cache the service worker itself or app-update metadata.
  if (url.pathname === "/sw.js" || url.pathname === "/app-update.json") {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // HTML/navigation must always prefer the network so removed UI/routes cannot
  // reappear from a stale application shell. Fall back to the cached shell only
  // when the device is genuinely offline.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: "no-store" });
      } catch {
        const cache = await caches.open(APP_CACHE);
        return (await cache.match("/index.html")) || Response.error();
      }
    })());
    return;
  }

  // Hashed build assets are safe to cache. Use stale-while-revalidate so a
  // previously downloaded asset can load immediately without pinning HTML.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith((async () => {
      const cache = await caches.open(APP_CACHE);
      const cached = await cache.match(request);
      const network = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => null);
      return cached || (await network) || Response.error();
    })());
    return;
  }

  // Everything else is network-first and is not persisted as page content.
  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(APP_CACHE);
    return (await cache.match(request)) || Response.error();
  }));
});
