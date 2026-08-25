import "./petlife-menu-regression-fix-20260822.css";

const PETLIFE_LABELS = new Set(["펫라이프", "petlife", "pet生活"]);
const LEGACY_GUIDE_LABELS = new Set(["정보가이드", "guide", "petgrow guide"]);
const LEGACY_GUIDE_TITLE = "반려생활에 바로 쓰는 petgrow 가이드";
const LEGACY_GUIDE_VIEW = "guide";
const CURRENT_PETINFO_VIEW = "tips";
let started = false;
let petInfoRedirectPending = false;

function cleanText(node) {
  return String(node?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isPetLifeMenuButton(button) {
  if (!(button instanceof HTMLButtonElement)) return false;
  if (button.closest("#petlife-react-root")) return false;
  return PETLIFE_LABELS.has(cleanText(button));
}

function isLegacyGuideButton(button) {
  if (!(button instanceof HTMLButtonElement)) return false;
  if (button.matches(".dash-widget-guide,.more-menu-guide")) return true;
  return LEGACY_GUIDE_LABELS.has(cleanText(button));
}

function openPetLife(attempt = 0) {
  const launcher = document.querySelector("#petlife-react-root .pl-launcher");
  if (launcher instanceof HTMLButtonElement) {
    launcher.click();
    return;
  }
  if (attempt < 30) window.setTimeout(() => openPetLife(attempt + 1), 80);
}

function dispatchPetInfo() {
  window.dispatchEvent(new CustomEvent("petgrow:navigate", { detail: CURRENT_PETINFO_VIEW }));
}

function legacyGuideScreenVisible() {
  if (document.querySelector(".info-guide-v4")) return true;
  return Array.from(document.querySelectorAll("h1,h2,h3")).some(
    (heading) => cleanText(heading) === LEGACY_GUIDE_TITLE,
  );
}

function redirectLegacyGuideToPetInfo() {
  if (petInfoRedirectPending) return;
  petInfoRedirectPending = true;

  // React의 전역 navigation effect가 붙기 전에도 안전하게 동작하도록
  // 현재 tick과 다음 tick에서 Pet정보 화면을 요청합니다.
  queueMicrotask(dispatchPetInfo);
  window.setTimeout(() => {
    dispatchPetInfo();
    petInfoRedirectPending = false;
  }, 80);
}

function hideLegacyGuideEntries() {
  document.querySelectorAll("button").forEach((button) => {
    if (!isLegacyGuideButton(button)) return;
    button.setAttribute("aria-hidden", "true");
    button.setAttribute("data-petgrow-legacy-guide", "hidden");
    button.style.setProperty("display", "none", "important");
  });
}

function reconcileLegacyGuide() {
  hideLegacyGuideEntries();
  if (legacyGuideScreenVisible()) redirectLegacyGuideToPetInfo();
}

export function bootPetLifeMenuRegressionFix() {
  if (started || typeof document === "undefined") return;
  started = true;

  // 예전에 제거한 정보가이드가 새로고침/렌더링 과정에서 다시 노출되는 회귀를 막습니다.
  // 기존 guide 진입은 모두 현재 Pet정보(tips)로 통일합니다.
  window.addEventListener("petgrow:navigate", (event) => {
    if (String(event?.detail || "").toLowerCase() !== LEGACY_GUIDE_VIEW) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    event.stopImmediatePropagation?.();
    redirectLegacyGuideToPetInfo();
  });

  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");

    if (isPetLifeMenuButton(button)) {
      // 2026-08-22 브랜드 리프레시에서 기존 '우리 아이' 메뉴의 표시명만
      // PetLife로 바뀌어 클릭 시 예전 pets 화면으로 이동하던 회귀를 차단합니다.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      openPetLife();
      return;
    }

    if (!isLegacyGuideButton(button)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    redirectLegacyGuideToPetInfo();
  }, true);

  const runReconcile = () => window.requestAnimationFrame(reconcileLegacyGuide);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reconcileLegacyGuide, { once: true });
  } else {
    reconcileLegacyGuide();
  }

  const observer = new MutationObserver(runReconcile);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

bootPetLifeMenuRegressionFix();
