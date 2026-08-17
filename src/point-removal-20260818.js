/* PetGrow PetPoint removal compatibility layer - 2026-08-18
 *
 * PetPoint has been removed from the product. This file runs before React mounts so
 * legacy PetPoint components that still exist in the large App bundle cannot show,
 * poll the server, or block free content while the old component code is phased out.
 */

const ZERO_COSTS = Object.freeze({
  saju_basic: 0,
  saju_daily: 0,
  saju_compat: 0,
  tarot: 0,
});

const ZERO_SUMMARY = Object.freeze({
  disabled: true,
  balance: 0,
  startPoints: 0,
  costs: ZERO_COSTS,
  recent: [],
  pointEvent: null,
  todayEarned: 0,
  todaySpent: 0,
  weekSpent: 0,
  totalEarned: 0,
  totalSpent: 0,
  rank: 0,
  memberCount: 0,
  topPercent: 0,
  earnGuide: [],
});

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function installPointFetchCompatibility() {
  if (typeof window === "undefined" || window.__petgrowPointRemovalFetchInstalled) return;
  window.__petgrowPointRemovalFetchInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = function petgrowFetchWithoutPoints(input, init) {
    try {
      const rawUrl = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
      const url = new URL(rawUrl, window.location.origin);
      if (url.origin === window.location.origin && url.pathname === "/api/points") {
        const action = url.searchParams.get("action") || "summary";
        if (action === "spend") {
          return Promise.resolve(jsonResponse({ ok: true, disabled: true, spent: 0, balance: 0, label: "" }));
        }
        if (action === "admin") {
          return Promise.resolve(jsonResponse({ disabled: true, users: 0, balance: 0, earned: 0, spent: 0, events: 0 }));
        }
        return Promise.resolve(jsonResponse(ZERO_SUMMARY));
      }
    } catch {
      // Fall through to the original fetch for every non-PetPoint request.
    }
    return originalFetch(input, init);
  };
}

function installPointRemovalStyle() {
  if (typeof document === "undefined" || document.getElementById("petgrow-point-removal-style")) return;
  const style = document.createElement("style");
  style.id = "petgrow-point-removal-style";
  style.textContent = `
    [class*="petpoint"],
    [class*="pg-point"],
    .pet-tarot-point-cost,
    [data-petgrow-point-removed="true"] {
      display: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

const EXACT_TEXT_REPLACEMENTS = new Map([
  ["필요한 PetPoint를 확인한 뒤 결과를 읽어봐요.", "원하는 메뉴를 선택한 뒤 결과를 확인해요."],
  ["글과 댓글 활동으로 PetPoint를 모을 수 있으며 일일 적립 한도가 있어요.", "글과 댓글, 좋아요로 다른 보호자와 편하게 소통할 수 있어요."],
  ["회원정보에서 현재 계정과 PetPoint를 확인해요.", "회원정보에서 현재 계정과 저장된 활동을 확인해요."],
]);

function replaceExactText(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const raw = String(node.nodeValue || "");
    const trimmed = raw.trim();
    const replacement = EXACT_TEXT_REPLACEMENTS.get(trimmed);
    if (!replacement) continue;
    const prefix = raw.match(/^\s*/)?.[0] || "";
    const suffix = raw.match(/\s*$/)?.[0] || "";
    node.nodeValue = `${prefix}${replacement}${suffix}`;
  }
}

function hidePointGuideEntries() {
  document.querySelectorAll(".guide-search-result-grid button, .guide-quick-card, .more-menu-card").forEach((el) => {
    if (/\bPetPoint\b/i.test(el.textContent || "")) el.dataset.petgrowPointRemoved = "true";
  });

  document.querySelectorAll(".guide-detail-card").forEach((card) => {
    const title = card.querySelector("h2")?.textContent?.trim();
    if (title === "PetPoint") card.dataset.petgrowPointRemoved = "true";
  });

  document.querySelectorAll("input[placeholder]").forEach((input) => {
    if (input.placeholder === "무엇을 도와드릴까요? 예: 타로, 음악, 포인트") {
      input.placeholder = "무엇을 도와드릴까요? 예: 타로, 음악, 성장 기록";
    }
  });
}

function hideLegacyCurrencyBadges() {
  const selectors = [
    ".bg-chip",
    ".saju-cost",
    ".saju-point-cost",
    ".tarot-point-cost",
    "small",
    "em",
  ].join(",");

  document.querySelectorAll(selectors).forEach((el) => {
    if (el.children.length) return;
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (/^PetPoint(?:\s+\d[\d,]*P)?(?:\s+사용)?$/i.test(text)) {
      el.dataset.petgrowPointRemoved = "true";
      return;
    }
    if (/^\d[\d,]*P\s*(?:사용|차감|필요)$/i.test(text)) {
      el.dataset.petgrowPointRemoved = "true";
    }
  });
}

function sanitizePointUi() {
  if (typeof document === "undefined") return;
  installPointRemovalStyle();
  replaceExactText(document.body || document);
  hidePointGuideEntries();
  hideLegacyCurrencyBadges();
}

installPointFetchCompatibility();
installPointRemovalStyle();

if (typeof window !== "undefined") {
  const start = () => {
    sanitizePointUi();
    const root = document.getElementById("root") || document.body;
    if (!root || window.__petgrowPointRemovalObserver) return;
    const observer = new MutationObserver(() => sanitizePointUi());
    observer.observe(root, { childList: true, subtree: true });
    window.__petgrowPointRemovalObserver = observer;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
