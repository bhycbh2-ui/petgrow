/* Fast PetGrow routing — lightweight Home, live PetNews collection, fast PetMusic list — 2026-08-20 */
(() => {
  const originalFetch = window.fetch.bind(window);
  let forceNewsRefresh = false;

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

  const getFastMusicListUrl = (value) => {
    const url = getUrl(value);
    if (!url || url.origin !== window.location.origin || url.pathname !== "/api/music") return null;
    const action = url.searchParams.get("action") || "list";
    if (action !== "list") return null;
    url.pathname = "/api/music-list";
    url.searchParams.delete("action");
    return `${url.pathname}${url.search}`;
  };

  /* Explicit PetNews refresh performs a fresh collection immediately. */
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!button || !button.closest(".petnews-v10")) return;
    const label = (button.textContent || "").replace(/\s+/g, " ").trim();
    if (/새로고침|refresh|更新|刷新/i.test(label)) forceNewsRefresh = true;
  }, true);

  window.fetch = function(input, init = {}) {
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    if (method !== "GET") return originalFetch(input, init);

    /* PetMusic public list reads skip the full schema bootstrap; likes/comments/admin writes stay on /api/music. */
    const fastMusicUrl = getFastMusicListUrl(input);
    if (fastMusicUrl) return originalFetch(fastMusicUrl, init);

    /* HomeInfoMusicSections only needs TOP 5 music. Skip the extra news DB query. */
    if (isPlainHomeFeedUrl(input)) {
      return originalFetch("/api/home-feed?music=1", init);
    }

    if (!isPlainNewsUrl(input)) return originalFetch(input, init);

    /* Dashboard always uses the tiny read-only home news feed. */
    if (document.querySelector(".petgrow-dashboard-home")) {
      return originalFetch("/api/home-news", init);
    }

    /* Refresh button preserves the full live collection behavior and bypasses caches. */
    if (forceNewsRefresh) {
      forceNewsRefresh = false;
      return originalFetch(input, { ...init, cache: "no-store" });
    }

    /* PetNews itself must call /api/news so collection, append-only archive save,
       link/title dedupe and newest-first display all happen in the same request. */
    return originalFetch(input, init);
  };
})();
