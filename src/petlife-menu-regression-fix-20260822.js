import "./petlife-menu-regression-fix-20260822.css";

const PETLIFE_LABELS = new Set(["펫라이프", "petlife", "pet生活"]);
let started = false;

function cleanText(node) {
  return String(node?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isPetLifeMenuButton(button) {
  if (!(button instanceof HTMLButtonElement)) return false;
  if (button.closest("#petlife-react-root")) return false;
  return PETLIFE_LABELS.has(cleanText(button));
}

function openPetLife(attempt = 0) {
  const launcher = document.querySelector("#petlife-react-root .pl-launcher");
  if (launcher instanceof HTMLButtonElement) {
    launcher.click();
    return;
  }
  if (attempt < 30) window.setTimeout(() => openPetLife(attempt + 1), 80);
}

export function bootPetLifeMenuRegressionFix() {
  if (started || typeof document === "undefined") return;
  started = true;

  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!isPetLifeMenuButton(button)) return;

    // 2026-08-22 브랜드 리프레시에서 기존 '우리 아이' 메뉴의 표시명만
    // PetLife로 바뀌어 클릭 시 예전 pets 화면으로 이동하던 회귀를 차단합니다.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    openPetLife();
  }, true);
}

bootPetLifeMenuRegressionFix();
