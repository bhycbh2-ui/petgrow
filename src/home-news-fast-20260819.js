/* Fast PetNews routing — dashboard home stays lightweight; PetNews keeps normal collection — 2026-08-19 */
(() => {
  const originalFetch = window.fetch.bind(window);

  const isNewsUrl = (value) => {
    try {
      const raw = typeof value === "string" ? value : value?.url || "";
      const url = new URL(raw, window.location.origin);
      return url.origin === window.location.origin && url.pathname === "/api/news" && !url.search;
    } catch { return false; }
  };

  window.fetch = function(input, init = {}) {
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    if (method === "GET" && isNewsUrl(input) && document.querySelector(".petgrow-dashboard-home")) {
      return originalFetch("/api/home-news", init);
    }
    return originalFetch(input, init);
  };
})();
