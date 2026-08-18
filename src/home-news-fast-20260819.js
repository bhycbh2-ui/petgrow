/* Fast PetNews routing — archive-first menu + explicit refresh — 2026-08-19 */
(() => {
  const originalFetch = window.fetch.bind(window);
  let forceNewsRefresh = false;

  const isNewsUrl = (value) => {
    try {
      const raw = typeof value === "string" ? value : value?.url || "";
      const url = new URL(raw, window.location.origin);
      return url.origin === window.location.origin && url.pathname === "/api/news" && !url.search;
    } catch { return false; }
  };

  /* Capture before React's onClick so only the explicit Refresh button performs a remote refresh. */
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!button || !button.closest(".petnews-v10")) return;
    const label = (button.textContent || "").replace(/\s+/g, " ").trim();
    if (/새로고침|refresh|更新|刷新/i.test(label)) forceNewsRefresh = true;
  }, true);

  window.fetch = function(input, init = {}) {
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    if (method === "GET" && isNewsUrl(input)) {
      if (document.querySelector(".petgrow-dashboard-home")) {
        return originalFetch("/api/home-news", init);
      }
      if (forceNewsRefresh) {
        forceNewsRefresh = false;
        return originalFetch(input, init);
      }
      return originalFetch("/api/news-archive", init);
    }
    return originalFetch(input, init);
  };
})();
