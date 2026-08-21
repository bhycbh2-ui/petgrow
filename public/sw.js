// PetGrow service worker v28
// HTML/API는 항상 최신 네트워크 응답을 사용하고, 해시 정적 자산과 버전된 브랜드 자산만 캐시합니다.
const ASSET_CACHE = "petgrow-assets-v28";
const ASSET_PATH = "/assets/";
const MAX_CACHE_ENTRIES = 120;
const BRAND_PATHS = new Set([
  "/petgrow-brand-source.png",
  "/petgrow-splash-logo.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== ASSET_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function putAndTrim(cache, request, response) {
  await cache.put(request, response);
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_ENTRIES) {
    await Promise.all(keys.slice(0, keys.length - MAX_CACHE_ENTRIES).map((key) => cache.delete(key)));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Audio/video assets can be large and are commonly served with byte-range semantics.
  // Leave media streaming to the browser/network instead of consuming the bounded app cache.
  if (request.destination === "audio" || request.destination === "video") return;

  // Other byte-range requests can return 206 Partial Content.
  // Never cache those partial responses as if they were the complete asset.
  if (request.headers.has("range")) return;

  let url;
  try { url = new URL(request.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  const cacheable = url.pathname.startsWith(ASSET_PATH) || BRAND_PATHS.has(url.pathname);
  if (!cacheable) return;

  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok && response.status === 200 && response.type !== "opaque") {
        // Keep the response fast, but explicitly extend the service-worker lifetime so
        // the asynchronous cache write and bounded-cache cleanup both finish reliably.
        event.waitUntil(putAndTrim(cache, request, response.clone()).catch(() => {}));
      }
      return response;
    })
  );
});
