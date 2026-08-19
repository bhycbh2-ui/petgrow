/* Fast PetNews routing — archive first, background refresh, explicit refresh support — 2026-08-19 */
(() => {
  const originalFetch = window.fetch.bind(window);
  const REFRESH_KEY = "petgrow_news_bg_refresh_at_v1";
  const REFRESH_INTERVAL = 30 * 60 * 1000;
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

  const shouldBackgroundRefresh = () => {
    if (backgroundRefreshStarted) return false;
    try {
      const last = Number(sessionStorage.getItem(REFRESH_KEY) || 0);
      return !last || Date.now() - last >= REFRESH_INTERVAL;
    } catch {
      return true;
    }
  };

  const startBackgroundRefresh = () => {
    if (!shouldBackgroundRefresh()) return;
    backgroundRefreshStarted = true;
    try { sessionStorage.setItem(REFRESH_KEY, String(Date.now())); } catch {}

    const run = () => {
      originalFetch("/api/news", { method: "GET", cache: "no-store", headers: { "X-PetGrow-Background": "1" } })
        .catch(() => {
          try { sessionStorage.removeItem(REFRESH_KEY); } catch {}
          backgroundRefreshStarted = false;
        });
    };

    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 700);
  };

  /* Refresh button should still fetch fresh news immediately. */
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!button || !button.closest(".petnews-v10")) return;
    const label = (button.textContent || "").replace(/\s+/g, " ").trim();
    if (/새로고침|refresh|更新|刷新/i.test(label)) forceNewsRefresh = true;
  }, true);

  window.fetch = function(input, init = {}) {
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    if (method !== "GET" || !isPlainNewsUrl(input)) return originalFetch(input, init);

    /* Dashboard always uses the tiny home feed. */
    if (document.querySelector(".petgrow-dashboard-home")) {
      return originalFetch("/api/home-news", init);
    }

    /* Explicit refresh keeps the existing full collection behavior. */
    if (forceNewsRefresh) {
      forceNewsRefresh = false;
      return originalFetch(input, { ...init, cache: "no-store" });
    }

    /* PetNews opens from the archive immediately, then refreshes the archive in the background. */
    const archivePromise = originalFetch("/api/news-archive", init);
    archivePromise.then(() => startBackgroundRefresh()).catch(() => {});
    return archivePromise;
  };
})();
