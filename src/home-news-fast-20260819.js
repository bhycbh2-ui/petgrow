/* Fast PetGrow routing — lightweight Home, archive-first PetNews, music-only home feed — 2026-08-20 */
(() => {
  const originalFetch = window.fetch.bind(window);
  const NEWS_REFRESH_KEY = "petgrow_news_bg_refresh_at_v2";
  const NEWS_REFRESH_INTERVAL = 30 * 60 * 1000;
  let forceNewsRefresh = false;
  let backgroundRefreshStarted = false;

  const getUrl = (value) => {
    try {
      const raw = typeof value === "string" ? value : value?.url || "";
      return new URL(raw, window.location.origin);
    } catch { return null; }
  };

  const isPlainNewsUrl = (value) => {
    const url = getUrl(value);
    return !!url && url.origin === window.location.origin && url.pathname === "/api/news" && !url.search;
  };

  const isPlainHomeFeedUrl = (value) => {
    const url = getUrl(value);
    return !!url && url.origin === window.location.origin && url.pathname === "/api/home-feed" && !url.search;
  };

  const shouldRefreshNews = () => {
    if (backgroundRefreshStarted) return false;
    try {
      const last = Number(sessionStorage.getItem(NEWS_REFRESH_KEY) || 0);
      return !last || Date.now() - last >= NEWS_REFRESH_INTERVAL;
    } catch { return true; }
  };

  const startBackgroundNewsRefresh = () => {
    if (!shouldRefreshNews()) return;
    backgroundRefreshStarted = true;
    try { sessionStorage.setItem(NEWS_REFRESH_KEY, String(Date.now())); } catch {}

    const run = () => {
      originalFetch("/api/news", { method: "GET", cache: "no-store", headers: { "X-PetGrow-Background": "1" } })
        .catch(() => {
          backgroundRefreshStarted = false;
          try { sessionStorage.removeItem(NEWS_REFRESH_KEY); } catch {}
        });
    };

    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 3500 });
    else setTimeout(run, 1000);
  };

  /* Explicit PetNews refresh still performs a fresh collection immediately. */
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!button || !button.closest(".petnews-v10")) return;
    const label = (button.textContent || "").replace(/\s+/g, " ").trim();
    if (/새로고침|refresh|更新|刷新/i.test(label)) forceNewsRefresh = true;
  }, true);

  window.fetch = function(input, init = {}) {
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    if (method !== "GET") return originalFetch(input, init);

    /* HomeInfoMusicSections only needs TOP 5 music. Skip the extra news DB query. */
    if (isPlainHomeFeedUrl(input)) {
      return originalFetch("/api/home-feed?music=1", init);
    }

    if (!isPlainNewsUrl(input)) return originalFetch(input, init);

    /* Dashboard always uses the tiny read-only home news feed. */
    if (document.querySelector(".petgrow-dashboard-home")) {
      return originalFetch("/api/home-news", init);
    }

    /* Refresh button preserves the full live collection behavior. */
    if (forceNewsRefresh) {
      forceNewsRefresh = false;
      return originalFetch(input, { ...init, cache: "no-store" });
    }

    /* PetNews opens from the saved archive immediately. Fresh collection runs after first paint. */
    const archivePromise = originalFetch("/api/news-archive", init);
    archivePromise.then(() => startBackgroundNewsRefresh()).catch(() => {});
    return archivePromise;
  };
})();
