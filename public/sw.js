// PetGrow service worker v22
// 배포 안정성을 위해 페이지/JS/CSS 요청은 서비스워커가 가로채지 않습니다.
// PWA 설치 지원만 유지하고, 이전 버전에서 남은 캐시는 활성화 시 제거합니다.
const CACHE_NAME = "petgrow-v22";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// fetch 이벤트를 등록하지 않습니다.
// 모든 웹 요청은 브라우저가 Vercel의 최신 배포에서 직접 가져옵니다.
