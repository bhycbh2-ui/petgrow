import "./legacy-growth-modal-ux.css";

const PATCHED = "data-pg-growth-modal-ux";
let raf = 0;

function visible(el) {
  if (!el || !el.isConnected) return false;
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function isGrowthRecordModal(card) {
  if (!visible(card)) return false;
  const text = String(card.textContent || "").replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (text.includes("우리 아이 성장 기록")) return true;
  const tabSignals = ["성장", "건강", "일정", "기록"].filter((word) => text.includes(word)).length;
  return text.includes("성장 기록") && tabSignals >= 3;
}

function requestClose(overlay) {
  if (!overlay) return;
  try {
    overlay.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse" }));
  } catch {
    overlay.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));
  }
}

function placeTopClose(card, button) {
  const rect = card.getBoundingClientRect();
  const size = 44;
  button.style.top = `${Math.max(10, rect.top + 12)}px`;
  button.style.left = `${Math.min(window.innerWidth - size - 10, rect.right - size - 12)}px`;
}

function patch(card) {
  if (!card || card.hasAttribute(PATCHED)) return;
  const overlay = card.closest(".modal-overlay");
  if (!overlay || !isGrowthRecordModal(card)) return;

  card.setAttribute(PATCHED, "1");
  card.classList.add("pg-growth-record-modal");
  overlay.classList.add("pg-growth-record-overlay");

  const closeTop = document.createElement("button");
  closeTop.type = "button";
  closeTop.className = "pg-growth-close-top";
  closeTop.setAttribute("aria-label", "성장 기록 닫기");
  closeTop.setAttribute("title", "닫기");
  closeTop.textContent = "×";
  closeTop.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    requestClose(overlay);
  });

  const closeBottom = document.createElement("button");
  closeBottom.type = "button";
  closeBottom.className = "pg-growth-close-bottom";
  closeBottom.setAttribute("aria-label", "성장 기록 닫기");
  closeBottom.textContent = "닫기";
  closeBottom.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    requestClose(overlay);
  });

  overlay.append(closeTop, closeBottom);
  placeTopClose(card, closeTop);

  const reposition = () => {
    if (!card.isConnected || !closeTop.isConnected) return;
    placeTopClose(card, closeTop);
  };
  window.addEventListener("resize", reposition, { passive: true });
  window.visualViewport?.addEventListener("resize", reposition, { passive: true });

  const cleanup = new MutationObserver(() => {
    if (card.isConnected) return;
    cleanup.disconnect();
    window.removeEventListener("resize", reposition);
    window.visualViewport?.removeEventListener("resize", reposition);
    closeTop.remove();
    closeBottom.remove();
  });
  cleanup.observe(document.body, { childList: true, subtree: true });
}

function scan() {
  raf = 0;
  document.querySelectorAll(".modal-overlay > .modal-card, .modal-overlay .modal-card").forEach(patch);
}

function scheduleScan() {
  if (raf) return;
  raf = requestAnimationFrame(scan);
}

const observer = new MutationObserver(scheduleScan);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("resize", scheduleScan, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const card = [...document.querySelectorAll(".pg-growth-record-modal")].find(visible);
  if (!card) return;
  event.preventDefault();
  requestClose(card.closest(".modal-overlay"));
});

scheduleScan();
