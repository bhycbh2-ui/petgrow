import "./petlife-menu-regression-fix-20260822.css";
import "./petgrow-shell-authority.css";

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
const CANONICAL_BRAND_SRC = "/petgrow-brand-source.svg";

/*
 * Only inspect actual navigation surfaces and the known legacy guide cards.
 * The previous version scanned every button/link in the document and then
 * watched the entire React tree. That was too broad and made unrelated menu
 * state vulnerable to text-based hide rules.
 */
const NAV_ENTRY_SELECTOR = [
  ".petgrow-sidebar-nav button",
  ".desktop-nav-links button",
  ".ham-nav button",
  ".app-bottom-nav button",
  ".more-menu-grid button",
  ".dash-widget-guide",
  ".more-menu-guide",
  ".bottom-nav-guide",
  ".nav-guide",
  "[data-view='guide']",
  "[data-route='guide']",
].join(",");

/* Top-level brand images only. Never search feature/home content for logos. */
const BRAND_IMAGE_SELECTOR = [
  ".petgrow-splash__logo",
  ".petgrow-sidebar-brand img",
  ".desktop-brand-logo",
  ".mobile-brand-logo",
  ".ham-panel-header img",
].join(",");

let started = false;
let petInfoRedirectPending = false;
let syncFrame = 0;

function cleanText(node) {
  return String(node?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isPetInfoEntry(entry) {
  const label = cleanText(entry);
  return (
    label === "pet정보" ||
    label === "pet info" ||
    label === "pet情報".toLowerCase() ||
    label === "pet信息".toLowerCase() ||
    label.startsWith("pet정보 ") ||
    label.startsWith("pet info ") ||
    label.includes(" pet정보") ||
    label.includes(" pet info")
  );
}

function isPetLifeMenuButton(entry) {
  if (!(entry instanceof HTMLButtonElement)) return false;
  if (entry.closest("#petlife-react-root")) return false;
  return PETLIFE_LABELS.has(cleanText(entry));
}

function isLegacyGuideEntry(entry) {
  if (!(entry instanceof Element)) return false;
  if (entry.matches(".dash-widget-guide,.more-menu-guide,.bottom-nav-guide,.nav-guide,[data-view='guide'],[data-route='guide']")) return true;
  const label = cleanText(entry);
  if (LEGACY_GUIDE_LABELS.has(label)) return true;
  return label.includes("펫가이드") || label.includes("pet guide") || label === "guide";
}

function protectPetInfo(entry) {
  if (!(entry instanceof Element) || !isPetInfoEntry(entry)) return false;
  entry.setAttribute("data-petgrow-petinfo", "current");
  entry.removeAttribute("data-petgrow-legacy-guide");
  entry.removeAttribute("aria-hidden");
  if (entry instanceof HTMLElement) {
    entry.style.removeProperty("display");
    entry.style.removeProperty("visibility");
    entry.style.removeProperty("pointer-events");
  }
  return true;
}

function hideEntry(entry, reason) {
  if (!(entry instanceof HTMLElement)) return;
  entry.setAttribute("aria-hidden", "true");
  entry.setAttribute(reason, "hidden");
  entry.style.setProperty("display", "none", "important");
}

function syncBrandImages() {
  document.querySelectorAll(BRAND_IMAGE_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLImageElement)) return;
    const currentPath = (() => {
      try { return new URL(node.currentSrc || node.src, location.href).pathname; }
      catch { return ""; }
    })();
    if (currentPath !== CANONICAL_BRAND_SRC) node.src = CANONICAL_BRAND_SRC;
    node.setAttribute("data-petgrow-brand-source", "canonical");
  });
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

function syncNavigationEntries() {
  document.querySelectorAll(NAV_ENTRY_SELECTOR).forEach((entry) => {
    /* Current PetInfo wins over every legacy text rule. */
    if (protectPetInfo(entry)) return;

    if (isPetLifeMenuButton(entry)) {
      hideEntry(entry, "data-petgrow-petlife-menu");
      return;
    }

    if (isLegacyGuideEntry(entry)) {
      hideEntry(entry, "data-petgrow-legacy-guide");
    }
  });
}

function syncShell() {
  syncBrandImages();
  syncNavigationEntries();
}

function scheduleShellSync() {
  if (syncFrame) return;
  syncFrame = window.requestAnimationFrame(() => {
    syncFrame = 0;
    syncShell();
  });
}

export function bootPetLifeMenuRegressionFix() {
  if (started || typeof document === "undefined") return;
  started = true;

  /* Keep old deep links/bookmarks working, but land them on current PetInfo. */
  window.addEventListener("petgrow:navigate", (event) => {
    if (String(event?.detail || "").toLowerCase() !== LEGACY_GUIDE_VIEW) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    event.stopImmediatePropagation?.();
    redirectLegacyGuideToPetInfo();
  });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const entry = target?.closest?.(NAV_ENTRY_SELECTOR);
    if (!entry) return;

    /* Never intercept current PetInfo. */
    if (protectPetInfo(entry)) return;

    if (isPetLifeMenuButton(entry)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }

    if (!isLegacyGuideEntry(entry)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    redirectLegacyGuideToPetInfo();
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncShell, { once: true });
  } else {
    syncShell();
  }

  /* React can replace navigation/header nodes. Observe those replacements, but
     the actual scans remain limited to the explicit shell selectors above. */
  const observer = new MutationObserver(scheduleShellSync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

bootPetLifeMenuRegressionFix();
