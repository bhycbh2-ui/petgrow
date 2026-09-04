const CACHE_VERSION = "petgrow-2026-09-04-stable-v1";
const APP_CACHE = `${CACHE_VERSION}-assets`;

// Never precache HTML. This prevents an old document/app shell from being
// resurrected by an installed PWA after the server version has changed.
const SAFE_ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(SAFE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Delete every older PetGrow cache, including caches created by previous
    // service-worker versions.
    const names = await caches.keys();
    await Promise.all(
      names.map((name) => name === APP_CACHE ? Promise.resolve(false) : caches.delete(name))
    );

    await self.clients.claim();

  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Control files must always come from the network.
  if (
    url.pathname === "/sw.js" ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/app-update.json"
  ) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  // Documents are never read from or written to Cache Storage. If the network
  // is unavailable, return a small offline response instead of an old app shell.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: "no-store" });
      } catch {
        return new Response(
          "PetGrow 연결이 필요합니다. 네트워크를 확인한 뒤 다시 시도해 주세요.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store"
            }
          }
        );
      }
    })());
    return;
  }

  // Hashed production assets can be cached safely because their URL changes on
  // each build. Everything else remains network-first/no-persist.
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

  event.respondWith(fetch(request, { cache: "no-store" }));
});
