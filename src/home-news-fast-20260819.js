/* Fast PetNews routing — lightweight dashboard, live PetNews collection — 2026-08-19 */
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

    /* Dashboard stays on the tiny read-only feed for fast first paint. */
    if (document.querySelector(".petgrow-dashboard-home")) {
      return originalFetch("/api/home-news", init);
    }

    /* PetNews itself must call /api/news so collection, append-only archive save,
       link/title dedupe and newest-first display all happen in the same request. */
    if (forceNewsRefresh) {
      forceNewsRefresh = false;
      return originalFetch(input, { ...init, cache: "no-store" });
    }

    return originalFetch(input, init);
  };
})();
