const CATEGORY_LABELS = {
  dog: "강아지", cat: "고양이", health: "건강", life: "생활",
  food: "식단·영양", training: "훈련", safety: "안전", grooming: "미용·위생",
};

const api = async (action, options = {}) => {
  const token = sessionStorage.getItem("petgrow_admin_token") || "";
  const response = await fetch(`/api/petinfo?action=${encodeURIComponent(action)}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-petgrow-admin-token": token,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Pet정보 요청에 실패했어요.");
  return body;
};

function injectStyle() {
  if (document.getElementById("petinfo-cms-runtime-style")) return;
  const style = document.createElement("style");
  style.id = "petinfo-cms-runtime-style";
  style.textContent = `
    .petinfo-cms-modal{position:fixed;inset:0;z-index:99999;background:rgba(21,31,24,.48);display:flex;align-items:flex-start;justify-content:center;padding:4vh 14px;overflow:auto}
    .petinfo-cms-shell{width:min(980px,100%);background:#f7faf7;border-radius:22px;box-shadow:0 24px 80px rgba(0,0,0,.22);padding:18px}
    .petinfo-cms-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.petinfo-cms-head h2{margin:0;font-size:20px}.petinfo-cms-head p{margin:4px 0 0;color:#718076;font-size:12px}.petinfo-cms-close{border:0;background:#fff;border-radius:12px;width:40px;height:40px;font-size:22px;cursor:pointer}
    .petinfo-cms-grid{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(0,1.4fr);gap:14px}.petinfo-cms-card{background:#fff;border:1px solid #e1e9e2;border-radius:16px;padding:14px}.petinfo-cms-card h3{margin:0 0 10px;font-size:15px}
    .petinfo-cms-form{display:grid;gap:8px}.petinfo-cms-form input,.petinfo-cms-form textarea,.petinfo-cms-form select{width:100%;box-sizing:border-box;border:1px solid #d9e4da;border-radius:11px;padding:10px;font:inherit;background:#fff}.petinfo-cms-form textarea{min-height:88px;resize:vertical}.petinfo-cms-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.petinfo-cms-checks{display:flex;gap:14px;flex-wrap:wrap;font-size:12px}.petinfo-cms-actions{display:flex;gap:8px;flex-wrap:wrap}.petinfo-cms-actions button,.petinfo-cms-new{border:0;border-radius:10px;padding:9px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.petinfo-cms-primary{background:#4f7f5a;color:#fff}.petinfo-cms-secondary{background:#eef4ef;color:#4e6654}.petinfo-cms-danger{background:#fff0f0;color:#a64a4a}
    .petinfo-cms-list{display:grid;gap:8px;max-height:70vh;overflow:auto}.petinfo-cms-item{border:1px solid #e4ebe5;border-radius:13px;padding:11px;background:#fff;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start}.petinfo-cms-item b{font-size:13px}.petinfo-cms-item small{display:block;margin-top:4px;color:#7b887f}.petinfo-cms-badge{display:inline-block;border-radius:999px;background:#eef5ef;padding:3px 7px;font-size:10px;font-weight:800;margin-right:5px}.petinfo-cms-off{opacity:.55}.petinfo-cms-empty{padding:24px;text-align:center;color:#7b887f}.petinfo-cms-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;background:#223027;color:#fff;padding:10px 16px;border-radius:12px;font-size:12px}
    @media(max-width:760px){.petinfo-cms-grid{grid-template-columns:1fr}.petinfo-cms-row{grid-template-columns:1fr}.petinfo-cms-modal{padding:10px}.petinfo-cms-shell{border-radius:16px;padding:12px}.petinfo-cms-list{max-height:none}}
  `;
  document.head.appendChild(style);
}

const emptyForm = () => ({
  id: "", category: "dog", titleKo: "", titleEn: "", summaryKo: "", summaryEn: "",
  bodyKo: "", bodyEn: "", featured: false, active: true, sortOrder: 0, publishAt: "",
});

function toast(message) {
  const el = document.createElement("div");
  el.className = "petinfo-cms-toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function openCms() {
  if (document.querySelector(".petinfo-cms-modal")) return;
  injectStyle();
  let items = [];
  let form = emptyForm();

  const modal = document.createElement("div");
  modal.className = "petinfo-cms-modal";
  modal.innerHTML = `
    <div class="petinfo-cms-shell">
      <div class="petinfo-cms-head"><div><h2>💡 Pet정보 CMS</h2><p>코드 수정 없이 Pet정보를 등록·수정·숨김·삭제할 수 있어요.</p></div><button class="petinfo-cms-close" type="button">×</button></div>
      <div class="petinfo-cms-grid">
        <section class="petinfo-cms-card"><h3>콘텐츠 편집</h3><form class="petinfo-cms-form">
          <div class="petinfo-cms-row"><select name="category">${Object.entries(CATEGORY_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select><input name="sortOrder" type="number" placeholder="정렬 순서" value="0"></div>
          <input name="titleKo" placeholder="한국어 제목 *"><input name="titleEn" placeholder="영문 제목">
          <textarea name="summaryKo" placeholder="한국어 요약 *"></textarea><textarea name="summaryEn" placeholder="영문 요약"></textarea>
          <textarea name="bodyKo" placeholder="한국어 본문 *"></textarea><textarea name="bodyEn" placeholder="영문 본문"></textarea>
          <input name="publishAt" type="datetime-local" title="예약 게시 시각">
          <div class="petinfo-cms-checks"><label><input name="featured" type="checkbox"> 추천 콘텐츠</label><label><input name="active" type="checkbox" checked> 공개</label></div>
          <div class="petinfo-cms-actions"><button class="petinfo-cms-primary" type="submit">저장</button><button class="petinfo-cms-secondary petinfo-cms-reset" type="button">새로 작성</button></div>
        </form></section>
        <section class="petinfo-cms-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px"><h3 style="margin:0">등록된 Pet정보</h3><button class="petinfo-cms-new petinfo-cms-secondary petinfo-cms-refresh" type="button">새로고침</button></div><div class="petinfo-cms-list"><div class="petinfo-cms-empty">불러오는 중...</div></div></section>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const shell = modal.querySelector(".petinfo-cms-shell");
  const formEl = modal.querySelector("form");
  const listEl = modal.querySelector(".petinfo-cms-list");

  const readForm = () => ({
    ...form,
    category: formEl.category.value,
    titleKo: formEl.titleKo.value,
    titleEn: formEl.titleEn.value,
    summaryKo: formEl.summaryKo.value,
    summaryEn: formEl.summaryEn.value,
    bodyKo: formEl.bodyKo.value,
    bodyEn: formEl.bodyEn.value,
    featured: formEl.featured.checked,
    active: formEl.active.checked,
    sortOrder: Number(formEl.sortOrder.value) || 0,
    publishAt: formEl.publishAt.value ? new Date(formEl.publishAt.value).toISOString() : null,
  });
  const fillForm = (next) => {
    form = { ...emptyForm(), ...next };
    formEl.category.value = form.category || "dog";
    formEl.titleKo.value = form.titleKo || ""; formEl.titleEn.value = form.titleEn || "";
    formEl.summaryKo.value = form.summaryKo || ""; formEl.summaryEn.value = form.summaryEn || "";
    formEl.bodyKo.value = form.bodyKo || ""; formEl.bodyEn.value = form.bodyEn || "";
    formEl.featured.checked = !!form.featured; formEl.active.checked = form.active !== false;
    formEl.sortOrder.value = Number(form.sortOrder) || 0;
    formEl.publishAt.value = form.publishAt ? String(form.publishAt).slice(0,16) : "";
    formEl.titleKo.focus();
  };
  const renderList = () => {
    if (!items.length) { listEl.innerHTML = '<div class="petinfo-cms-empty">DB에 등록된 Pet정보가 아직 없어요.<br>왼쪽에서 첫 콘텐츠를 등록할 수 있어요.</div>'; return; }
    listEl.innerHTML = items.map((x, i) => `
      <div class="petinfo-cms-item ${x.active ? "" : "petinfo-cms-off"}" data-index="${i}">
        <div><span class="petinfo-cms-badge">${CATEGORY_LABELS[x.category] || x.category}</span>${x.featured?'<span class="petinfo-cms-badge">추천</span>':''}<b>${escapeHtml(x.title?.ko || "제목 없음")}</b><small>${escapeHtml(x.summary?.ko || "")} · ${x.active?"공개":"비공개"}</small></div>
        <div class="petinfo-cms-actions"><button class="petinfo-cms-secondary" data-act="edit">수정</button><button class="petinfo-cms-secondary" data-act="toggle">${x.active?"숨김":"공개"}</button><button class="petinfo-cms-danger" data-act="delete">삭제</button></div>
      </div>`).join("");
  };
  const load = async () => {
    listEl.innerHTML = '<div class="petinfo-cms-empty">불러오는 중...</div>';
    try { items = (await api("admin-list")).items || []; renderList(); }
    catch (e) { listEl.innerHTML = `<div class="petinfo-cms-empty">${escapeHtml(e.message)}</div>`; }
  };

  modal.querySelector(".petinfo-cms-close").onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  shell.onclick = (e) => e.stopPropagation();
  modal.querySelector(".petinfo-cms-reset").onclick = () => fillForm(emptyForm());
  modal.querySelector(".petinfo-cms-refresh").onclick = load;
  formEl.onsubmit = async (e) => {
    e.preventDefault();
    const payload = readForm();
    try {
      await api("admin-save", { method: "POST", body: JSON.stringify(payload) });
      toast(form.id ? "Pet정보를 수정했어요." : "Pet정보를 등록했어요.");
      fillForm(emptyForm()); await load();
    } catch (err) { window.alert(err.message); }
  };
  listEl.onclick = async (e) => {
    const button = e.target.closest("button[data-act]"); if (!button) return;
    const row = button.closest(".petinfo-cms-item"); const x = items[Number(row?.dataset.index)]; if (!x) return;
    if (button.dataset.act === "edit") {
      fillForm({ id:x.id, category:x.category, titleKo:x.title?.ko, titleEn:x.title?.en, summaryKo:x.summary?.ko, summaryEn:x.summary?.en, bodyKo:x.body?.ko, bodyEn:x.body?.en, featured:x.featured, active:x.active, sortOrder:x.sortOrder, publishAt:x.publishAt });
    } else if (button.dataset.act === "toggle") {
      try { await api("admin-toggle", { method:"POST", body:JSON.stringify({id:x.id, active:!x.active}) }); await load(); }
      catch (err) { window.alert(err.message); }
    } else if (button.dataset.act === "delete") {
      if (!window.confirm(`'${x.title?.ko || "Pet정보"}'를 완전히 삭제할까요?`)) return;
      try { await api("admin-delete", { method:"POST", body:JSON.stringify({id:x.id}) }); await load(); toast("삭제했어요."); }
      catch (err) { window.alert(err.message); }
    }
  };
  load();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function installAdminButton() {
  const tabs = document.querySelector(".admin-tabs");
  if (!tabs || tabs.querySelector("[data-petinfo-cms-button]")) return;
  const roleText = document.body.textContent || "";
  if (!/최고관리자|운영관리자|관리자센터/.test(roleText)) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.petinfoCmsButton = "1";
  button.textContent = "Pet정보";
  button.addEventListener("click", openCms);
  const musicButton = [...tabs.querySelectorAll("button")].find(b => /Pet음악/.test(b.textContent || ""));
  if (musicButton) tabs.insertBefore(button, musicButton); else tabs.appendChild(button);
}

const observer = new MutationObserver(() => installAdminButton());
observer.observe(document.documentElement, { childList:true, subtree:true });
installAdminButton();
