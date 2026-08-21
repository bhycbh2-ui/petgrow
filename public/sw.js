// PetGrow service worker v24
// HTML/API는 항상 최신 네트워크 응답을 사용하고, 해시 정적 자산과 버전된 브랜드 자산만 캐시합니다.
const ASSET_CACHE = "petgrow-assets-v24";
const ASSET_PATH = "/assets/";
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

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
      if (response && response.ok && response.type !== "opaque") {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
  );
});
