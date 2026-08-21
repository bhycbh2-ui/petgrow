// PetGrow service worker v29
// HTML/API는 항상 최신 네트워크 응답을 사용하고, 해시 정적 자산과 버전된 브랜드 자산만 캐시합니다.
const ASSET_CACHE = "petgrow-assets-v29";
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

async function fetchAndCache(cache, request, event) {
  const response = await fetch(request);
  if (response && response.ok && response.status === 200 && response.type !== "opaque") {
    // 사용자 응답과 캐시 기록을 분리하되 서비스워커 수명은 캐시 정리까지 유지합니다.
    event.waitUntil(putAndTrim(cache, request, response.clone()).catch(() => {}));
  }
  return response;
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

  const isHashedAsset = url.pathname.startsWith(ASSET_PATH);
  const isBrandAsset = BRAND_PATHS.has(url.pathname);
  if (!isHashedAsset && !isBrandAsset) return;

  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      const cached = await cache.match(request);

      // 해시 자산은 URL 자체가 버전이므로 cache-first가 가장 효율적입니다.
      if (cached && isHashedAsset) return cached;

      // 로고/아이콘처럼 URL이 고정된 브랜드 자산은 캐시를 즉시 보여주되
      // 백그라운드에서 최신 버전을 갱신해 다음 방문부터 오래된 이미지가 남지 않게 합니다.
      if (cached && isBrandAsset) {
        event.waitUntil(fetchAndCache(cache, request, event).catch(() => {}));
        return cached;
      }

      return fetchAndCache(cache, request, event);
    })
  );
});
