import "./petlife-final-qa.css";
import "./petlife-stable-sheet-20260821.css";

let bypassDeleteGuard = false;
let activeConfirm = null;

function closeConfirm() {
  activeConfirm?.remove();
  activeConfirm = null;
}

function runWithConfirmedDelete(button) {
  const originalConfirm = window.confirm;
  bypassDeleteGuard = true;
  window.confirm = () => true;
  try {
    button.click();
  } finally {
    window.confirm = originalConfirm;
    bypassDeleteGuard = false;
  }
}

function showDeleteConfirm(button, kind) {
  closeConfirm();
  const backdrop = document.createElement("div");
  backdrop.className = "pl-qa-confirmback";
  backdrop.innerHTML = `
    <section class="pl-qa-confirm" role="alertdialog" aria-modal="true" aria-labelledby="pl-qa-confirm-title">
      <button type="button" class="pl-qa-confirm-x" aria-label="확인창 닫기">×</button>
      <span class="pl-qa-confirm-icon">${kind === "pet" ? "🐾" : "🗑️"}</span>
      <h3 id="pl-qa-confirm-title">${kind === "pet" ? "우리 아이 기록을 삭제할까요?" : "이 기록을 삭제할까요?"}</h3>
      <p>${kind === "pet" ? "선택한 아이의 PetLife 기록이 함께 삭제되며 되돌릴 수 없어요." : "삭제한 PetLife 기록은 되돌릴 수 없어요."}</p>
      <div class="pl-qa-confirm-actions">
        <button type="button" class="pl-qa-cancel">취소</button>
        <button type="button" class="pl-qa-delete">삭제</button>
      </div>
    </section>`;

  const cancel = () => closeConfirm();
  backdrop.querySelector(".pl-qa-confirm-x")?.addEventListener("click", cancel);
  backdrop.querySelector(".pl-qa-cancel")?.addEventListener("click", cancel);
  backdrop.querySelector(".pl-qa-delete")?.addEventListener("click", () => {
    closeConfirm();
    runWithConfirmedDelete(button);
  });
  backdrop.addEventListener("pointerdown", (event) => {
    if (event.target === backdrop) cancel();
  });
  document.body.appendChild(backdrop);
  activeConfirm = backdrop;
  requestAnimationFrame(() => backdrop.querySelector(".pl-qa-cancel")?.focus());
}

function deleteTarget(target) {
  const button = target?.closest?.("#petlife-react-root button");
  if (!button) return null;
  if (button.matches(".pl-petmeta button.danger")) return { button, kind: "pet" };
  if (button.closest(".pl-entryactions") && String(button.textContent || "").trim() === "삭제") return { button, kind: "entry" };
  return null;
}

document.addEventListener("click", (event) => {
  if (bypassDeleteGuard) return;
  const hit = deleteTarget(event.target);
  if (!hit) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  showDeleteConfirm(hit.button, hit.kind);
}, true);

function closeTopPetLifeLayer() {
  if (activeConfirm) {
    closeConfirm();
    return true;
  }
  const modal = [...document.querySelectorAll("#petlife-react-root .pl-modalback")].find((el) => getComputedStyle(el).display !== "none");
  if (modal) {
    modal.querySelector(".pl-modal > header button")?.click();
    return true;
  }
  const shell = document.querySelector("#petlife-react-root .pl-backdrop .pl-close");
  if (shell) {
    shell.click();
    return true;
  }
  return false;
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!closeTopPetLifeLayer()) return;
  event.preventDefault();
  event.stopPropagation();
}, true);

function annotateDialogs() {
  document.querySelectorAll("#petlife-react-root .pl-modal").forEach((modal) => {
    modal.setAttribute("role", modal.getAttribute("role") || "dialog");
    modal.setAttribute("aria-modal", "true");
  });
}

function syncVisualViewport() {
  const vv = window.visualViewport;
  const height = Math.max(320, Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight));
  const top = Math.max(0, Math.round(vv?.offsetTop || 0));
  const layoutHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
  const keyboardOpen = layoutHeight - height > 120;
  document.documentElement.style.setProperty("--pl-vv-height", `${height}px`);
  document.documentElement.style.setProperty("--pl-vv-top", `${top}px`);
  document.documentElement.classList.toggle("pl-keyboard-open", keyboardOpen);
}

window.visualViewport?.addEventListener("resize", syncVisualViewport, { passive: true });
window.visualViewport?.addEventListener("scroll", syncVisualViewport, { passive: true });
window.addEventListener("resize", syncVisualViewport, { passive: true });
syncVisualViewport();

let raf = 0;
const observer = new MutationObserver(() => {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    annotateDialogs();
    syncVisualViewport();
  });
});
observer.observe(document.documentElement, { childList: true, subtree: true });
annotateDialogs();
