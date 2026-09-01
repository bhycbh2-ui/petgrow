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

function activeViewLabel() {
  const active = document.querySelector(
    ".desktop-nav-link.active,.petgrow-sidebar-nav button.active,.app-bottom-nav button.active,[aria-current='page']"
  );
  return (active?.textContent || "").replace(/\s+/g, " ").trim();
}

function isContentSafeView() {
  // Android 앱에서는 웹 AdSense를 전부 막고 네이티브 AdMob만 사용합니다.
  if (isNativeShell()) return false;
  if (document.getElementById("petgrow-initial-splash")) return false;
  const path = `${location.pathname}${location.hash}`.toLowerCase();
  if (location.pathname !== "/") return false;
  if (/login|signup|admin|404|error|loading|privacy|terms/.test(path)) return false;

  const label = activeViewLabel();
  if (label) {
    return /홈|home|pet정보|정보|pet뉴스|news|소개|about/i.test(label);
  }

  const rootText = (document.getElementById("root")?.innerText || "").slice(0, 2200);
  if (/로그인이 필요|회원가입|관리자센터|게시물이 없습니다|검색 결과가 없습니다|불러오는 중|잠시만 기다려|콘텐츠가 없습니다/.test(rootText)) return false;
  return rootText.replace(/\s+/g, " ").trim().length >= 320;
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
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
    addEventListener("popstate", scheduleSync);
    addEventListener("hashchange", scheduleSync);
    document.addEventListener("click", scheduleSync, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

bootAdSenseReviewBoost();
