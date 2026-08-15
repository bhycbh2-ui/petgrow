// PetGrow service worker v20
// HTML/JS는 브라우저가 항상 최신 배포를 받도록 런타임 캐시에서 제외합니다.
const CACHE_NAME = "petgrow-static-v20";
const STATIC_ASSETS = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || event.request.destination === "video") return;

  // 문서와 Vite JS/CSS 번들은 캐시하지 않음: 오래된 index.html + 새 번들 불일치 방지
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document" ||
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  // 아이콘/이미지 등 정적 자산만 network-first로 캐시
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
