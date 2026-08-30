import "./petlife-menu-regression-fix-20260822.css";

const PETLIFE_LABELS = new Set(["펫라이프", "petlife", "pet生活"]);
const LEGACY_GUIDE_LABELS = new Set([
  "정보가이드",
  "펫가이드",
  "펫 가이드",
  "pet가이드",
  "pet guide",
  "guide",
  "petgrow guide",
]);
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

function dispatchPetInfo() {
  window.dispatchEvent(new CustomEvent("petgrow:navigate", { detail: CURRENT_PETINFO_VIEW }));
}

function redirectLegacyGuideToPetInfo() {
  if (petInfoRedirectPending) return;
  petInfoRedirectPending = true;

  // 사용자가 실제로 예전 정보가이드 진입을 요청했을 때만 현재 Pet정보로 연결합니다.
  queueMicrotask(dispatchPetInfo);
  window.setTimeout(() => {
    dispatchPetInfo();
    petInfoRedirectPending = false;
  }, 80);
}

function hideRemovedMenuEntries() {
  document.querySelectorAll("button").forEach((button) => {
    if (isPetLifeMenuButton(button)) {
      button.setAttribute("aria-hidden", "true");
      button.setAttribute("data-petgrow-petlife-menu", "removed");
      button.style.setProperty("display", "none", "important");
      return;
    }

    if (!isLegacyGuideButton(button)) return;
    button.setAttribute("aria-hidden", "true");
    button.setAttribute("data-petgrow-legacy-guide", "hidden");
    button.style.setProperty("display", "none", "important");
  });
}

export function bootPetLifeMenuRegressionFix() {
  if (started || typeof document === "undefined") return;
  started = true;

  // 자동 DOM 감지로 화면을 바꾸지 않습니다. 명시적인 guide 요청만 Pet정보로 연결합니다.
  window.addEventListener("petgrow:navigate", (event) => {
    if (String(event?.detail || "").toLowerCase() !== LEGACY_GUIDE_VIEW) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    event.stopImmediatePropagation?.();
    redirectLegacyGuideToPetInfo();
  });

  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");

    // 펫라이프 메뉴는 제거된 항목입니다. DOM에 잠깐 생성되더라도 진입을 막습니다.
    if (isPetLifeMenuButton(button)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }

    if (!isLegacyGuideButton(button)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    redirectLegacyGuideToPetInfo();
  }, true);

  const runHide = () => window.requestAnimationFrame(hideRemovedMenuEntries);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideRemovedMenuEntries, { once: true });
  } else {
    hideRemovedMenuEntries();
  }

  const observer = new MutationObserver(runHide);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

bootPetLifeMenuRegressionFix();
