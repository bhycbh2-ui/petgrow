import "./petlife-menu-regression-fix-20260822.css";

const PETLIFE_LABELS = new Set(["펫라이프", "petlife", "pet生活"]);
const LEGACY_GUIDE_LABELS = new Set([
  "정보가이드",
  "guide",
  "petgrow guide",
  "펫가이드",
  "펫 가이드",
  "pet guide",
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
  if (button.matches(".dash-widget-guide,.more-menu-guide,.bottom-nav-guide,.nav-guide")) return true;
  const label = cleanText(button);
  if (LEGACY_GUIDE_LABELS.has(label)) return true;
  return label.includes("펫가이드") || label.includes("pet guide") || label === "guide";
}

function dispatchPetInfo() {
  window.dispatchEvent(new CustomEvent("petgrow:navigate", { detail: CURRENT_PETINFO_VIEW }));
}

function redirectLegacyGuideToPetInfo() {
  if (petInfoRedirectPending) return;
  petInfoRedirectPending = true;

  queueMicrotask(dispatchPetInfo);
  window.setTimeout(() => {
    dispatchPetInfo();
    petInfoRedirectPending = false;
  }, 80);
}

function hideRemovedMenuEntries() {
  document.querySelectorAll("button,a,[role='button']").forEach((entry) => {
    const label = cleanText(entry);

    if (entry instanceof HTMLButtonElement && isPetLifeMenuButton(entry)) {
      entry.setAttribute("aria-hidden", "true");
      entry.setAttribute("data-petgrow-petlife-menu", "removed");
      entry.style.setProperty("display", "none", "important");
      return;
    }

    const legacyGuide =
      (entry instanceof HTMLButtonElement && isLegacyGuideButton(entry)) ||
      LEGACY_GUIDE_LABELS.has(label) ||
      label.includes("펫가이드") ||
      label.includes("pet guide") ||
      entry.matches?.(".dash-widget-guide,.more-menu-guide,.bottom-nav-guide,.nav-guide,[data-view='guide'],[data-route='guide']");

    if (!legacyGuide) return;
    entry.setAttribute("aria-hidden", "true");
    entry.setAttribute("data-petgrow-legacy-guide", "hidden");
    entry.style.setProperty("display", "none", "important");
  });
}

export function bootPetLifeMenuRegressionFix() {
  if (started || typeof document === "undefined") return;
  started = true;

  window.addEventListener("petgrow:navigate", (event) => {
    if (String(event?.detail || "").toLowerCase() !== LEGACY_GUIDE_VIEW) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    event.stopImmediatePropagation?.();
    redirectLegacyGuideToPetInfo();
  });

  document.addEventListener("click", (event) => {
    const entry = event.target?.closest?.("button,a,[role='button']");
    if (!entry) return;

    if (entry instanceof HTMLButtonElement && isPetLifeMenuButton(entry)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }

    const label = cleanText(entry);
    const legacyGuide =
      (entry instanceof HTMLButtonElement && isLegacyGuideButton(entry)) ||
      LEGACY_GUIDE_LABELS.has(label) ||
      label.includes("펫가이드") ||
      label.includes("pet guide") ||
      entry.matches?.(".dash-widget-guide,.more-menu-guide,.bottom-nav-guide,.nav-guide,[data-view='guide'],[data-route='guide']");

    if (!legacyGuide) return;
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
