const IMPORT_BUTTON_ID = "petinfo-cms-import-existing";

function adminToken() {
  try { return sessionStorage.getItem("petgrow_admin_token") || ""; }
  catch { return ""; }
}

async function importExistingTips(button) {
  const source = Array.isArray(window.__PETGROW_TIPS_DATA__) ? window.__PETGROW_TIPS_DATA__ : [];
  if (!source.length) {
    window.alert("기존 Pet정보 데이터를 찾지 못했어요. 사용자 화면 연결 패치가 먼저 적용됐는지 확인해 주세요.");
    return;
  }
  const payload = source.map((item, index) => ({
    ...item,
    sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index,
  }));
  if (!window.confirm(`기존 Pet정보 ${payload.length}개를 중앙 DB로 가져올까요?\n같은 ID가 이미 있으면 중복 생성하지 않습니다.`)) return;

  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "가져오는 중...";
  try {
    const response = await fetch("/api/petinfo?action=admin-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-petgrow-admin-token": adminToken(),
      },
      body: JSON.stringify({ items: payload }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "기존 Pet정보 가져오기에 실패했어요.");
    const imported = Number(body.imported) || 0;
    const skipped = Number(body.skipped) || 0;
    window.alert(`DB 가져오기 완료\n신규 등록: ${imported}개\n기존/건너뜀: ${skipped}개`);
    const refresh = document.querySelector(".petinfo-cms-refresh");
    if (refresh) refresh.click();
  } catch (error) {
    window.alert(error?.message || "기존 Pet정보 가져오기 중 오류가 발생했어요.");
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

function installImportButton() {
  const head = document.querySelector(".petinfo-cms-head");
  if (!head || document.getElementById(IMPORT_BUTTON_ID)) return;
  const close = head.querySelector(".petinfo-cms-close");
  if (!close) return;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "8px";

  const button = document.createElement("button");
  button.id = IMPORT_BUTTON_ID;
  button.type = "button";
  button.className = "petinfo-cms-new petinfo-cms-secondary";
  button.textContent = "기존 Pet정보 가져오기";
  button.addEventListener("click", () => importExistingTips(button));

  close.replaceWith(wrap);
  wrap.appendChild(button);
  wrap.appendChild(close);
}

const observer = new MutationObserver(installImportButton);
observer.observe(document.documentElement, { childList: true, subtree: true });
installImportButton();
