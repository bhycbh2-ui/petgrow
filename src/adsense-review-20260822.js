const AD_SELECTORS = [
  "ins.adsbygoogle",
  ".google-auto-placed",
  "iframe[src*='googleads']",
  "iframe[src*='doubleclick.net']",
  "[id^='google_ads_']",
  "[data-ad-client]"
].join(",");

function isNativeShell() {
  return /(?:^|[?&])app_version=/i.test(location.search) ||
    Boolean(window.Capacitor?.isNativePlatform?.());
}

export function isContentSafeView() {
  if (isNativeShell() || document.getElementById("petgrow-initial-splash")) return false;
  // Navigation labels and character counts cannot establish editorial quality.
  // SPA tools, news feeds, account pages and empty results never qualify.
  if (!/^\/guides\/[a-z-]+\.html$/.test(location.pathname)) return false;
  const article = document.querySelector("article[data-publisher-reviewed='true']");
  if (!article || article.hidden || article.getAttribute("aria-busy") === "true") return false;
  return article.querySelectorAll("h2").length >= 3 &&
    (article.textContent || "").trim().length >= 900;
}

function guardAdPlacement() {
  const restricted = !isContentSafeView();
  document.documentElement.classList.toggle("petgrow-ads-restricted", restricted);
  if (!restricted) return;
  document.querySelectorAll(AD_SELECTORS).forEach((node) => {
    if (node.dataset?.petgrowAdGuard === "1") return;
    if (node.dataset) node.dataset.petgrowAdGuard = "1";
    node.setAttribute?.("aria-hidden", "true");
    node.style?.setProperty("display", "none", "important");
  });
}

// The old AdSense review helper used to create a PetGrow Care Guide section at
// the bottom of Home. That surface is retired. Keep only a cleanup guard so an
// already-rendered stale node can never survive a later mutation/navigation.
function removeLegacyEditorialHub() {
  document.getElementById("petgrow-editorial-hub")?.remove();
}

let timer = 0;
function scheduleSync() {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    guardAdPlacement();
    removeLegacyEditorialHub();
  }, 120);
}

const observer = new MutationObserver(scheduleSync);

export function bootAdSenseReviewBoost() {
  const start = () => {
    guardAdPlacement();
    removeLegacyEditorialHub();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "hidden", "aria-busy"] });
    addEventListener("popstate", scheduleSync);
    addEventListener("hashchange", scheduleSync);
    document.addEventListener("click", scheduleSync, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

bootAdSenseReviewBoost();
