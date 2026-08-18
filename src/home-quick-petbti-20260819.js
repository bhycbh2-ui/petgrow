/* PetGrow home shortcuts + PetBTI visual polish — 2026-08-19 */
(() => {
  const MENU_ITEMS = [
    ["pets", "🐾", { ko: "우리 아이", en: "My Pet" }],
    ["music", "🎵", { ko: "Pet음악", en: "Pet Music" }],
    ["news", "📰", { ko: "Pet뉴스", en: "Pet News" }],
    ["nearby", "📍", { ko: "내 주변 Pet", en: "Nearby Pet" }],
    ["community", "💬", { ko: "Pet톡", en: "Pet Talk" }],
    ["petbti", "🧠", { ko: "PetBTI", en: "PetBTI" }],
    ["saju", "🔮", { ko: "Pet사주", en: "Pet Saju" }],
    ["tarot", "🃏", { ko: "Pet타로", en: "Pet Tarot" }],
    ["tips", "💡", { ko: "Pet정보", en: "Pet Info" }],
    ["guide", "📚", { ko: "정보가이드", en: "Guide" }],
  ];

  const ORDER_KEY = "petgrow_home_quick_visual_order_v1";
  let expanded = false;
  let dragView = "";
  let dragUntil = 0;
  let raf = 0;

  const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
  const norm = (value) => String(value || "").replace(/\s+/g, "").toLowerCase();

  function currentLang() {
    const label = text(document.querySelector(".lang-toggle button.active"));
    return label === "EN" ? "en" : "ko";
  }

  function viewFromLabel(label) {
    const n = norm(label);
    for (const [view, , labels] of MENU_ITEMS) {
      const candidates = [labels.ko, labels.en];
      if (candidates.some((x) => n === norm(x))) return view;
    }
    return "";
  }

  function storedOrder() {
    try {
      const value = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
      return Array.isArray(value) ? value.filter((x) => MENU_ITEMS.some(([v]) => v === x)) : [];
    } catch {
      return [];
    }
  }

  function saveOrder(order) {
    const clean = [...new Set(order)].filter((x) => MENU_ITEMS.some(([v]) => v === x));
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(clean)); } catch {}

    /* Keep the existing PetGrow quick-menu local preference aligned where possible. */
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || "";
        if (!key.startsWith("petgrow_quick_")) continue;
        const old = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(old) || !old.length) continue;
        const visible = clean.filter((x) => old.includes(x));
        const rest = old.filter((x) => !visible.includes(x));
        localStorage.setItem(key, JSON.stringify([...visible, ...rest].slice(0, 6)));
      }
    } catch {}
  }

  function visualOrderFor(buttons) {
    const views = buttons.map((btn) => btn.dataset.pgQuickView).filter(Boolean);
    const saved = storedOrder();
    return [...saved.filter((v) => views.includes(v)), ...views.filter((v) => !saved.includes(v))];
  }

  function applyVisualOrder(grid) {
    const buttons = [...grid.querySelectorAll(":scope > button")];
    const order = visualOrderFor(buttons);
    buttons.forEach((btn) => {
      const view = btn.dataset.pgQuickView;
      const idx = order.indexOf(view);
      btn.style.order = String(idx < 0 ? 99 : idx);
    });
  }

  function navigate(view) {
    window.dispatchEvent(new CustomEvent("petgrow:navigate", { detail: view }));
  }

  function renderExtraMenus(section, grid) {
    let extra = section.querySelector(".pg-home-extra-menu-grid");
    if (!extra) {
      extra = document.createElement("div");
      extra.className = "pg-home-extra-menu-grid";
      grid.insertAdjacentElement("afterend", extra);
    }

    const visible = new Set([...grid.querySelectorAll(":scope > button")].map((btn) => btn.dataset.pgQuickView).filter(Boolean));
    const lang = currentLang();
    const remaining = MENU_ITEMS.filter(([view]) => !visible.has(view));

    extra.replaceChildren();
    remaining.forEach(([view, icon, labels]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pg-home-extra-menu-card";
      btn.dataset.pgView = view;
      btn.innerHTML = `<i aria-hidden="true"></i><span></span>`;
      btn.querySelector("i").textContent = icon;
      btn.querySelector("span").textContent = labels[lang] || labels.ko;
      btn.addEventListener("click", () => navigate(view));
      extra.appendChild(btn);
    });

    extra.hidden = !expanded || remaining.length === 0;
    return remaining.length;
  }

  function decorateQuickGrid() {
    const home = document.querySelector(".petgrow-dashboard-home");
    if (!home) return;

    const grid = home.querySelector(".dash-quick-grid");
    const section = grid?.closest(".dash-section");
    const head = section?.querySelector(":scope > .dash-section-head");
    if (!grid || !section || !head) return;

    const buttons = [...grid.querySelectorAll(":scope > button")];
    buttons.forEach((btn) => {
      const label = text(btn.querySelector("span")) || text(btn);
      const view = viewFromLabel(label);
      if (!view) return;
      btn.dataset.pgQuickView = view;
      btn.draggable = true;
      btn.classList.add("pg-home-quick-draggable");

      if (btn.dataset.pgQuickDragBound === "1") return;
      btn.dataset.pgQuickDragBound = "1";
      btn.addEventListener("dragstart", (event) => {
        dragView = btn.dataset.pgQuickView || "";
        btn.classList.add("pg-dragging");
        try { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", dragView); } catch {}
      });
      btn.addEventListener("dragover", (event) => {
        if (!dragView) return;
        event.preventDefault();
        try { event.dataTransfer.dropEffect = "move"; } catch {}
        btn.classList.add("pg-drag-over");
      });
      btn.addEventListener("dragleave", () => btn.classList.remove("pg-drag-over"));
      btn.addEventListener("drop", (event) => {
        event.preventDefault();
        const targetView = btn.dataset.pgQuickView || "";
        btn.classList.remove("pg-drag-over");
        if (!dragView || !targetView || dragView === targetView) return;

        const orderedButtons = [...grid.querySelectorAll(":scope > button")]
          .filter((x) => x.dataset.pgQuickView)
          .sort((a, b) => Number(a.style.order || 0) - Number(b.style.order || 0));
        const current = orderedButtons.map((x) => x.dataset.pgQuickView);
        const from = current.indexOf(dragView);
        const to = current.indexOf(targetView);
        if (from < 0 || to < 0) return;
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        saveOrder(next);
        applyVisualOrder(grid);
        dragUntil = Date.now() + 450;
      });
      btn.addEventListener("dragend", () => {
        dragView = "";
        dragUntil = Date.now() + 350;
        grid.querySelectorAll(".pg-dragging,.pg-drag-over").forEach((el) => el.classList.remove("pg-dragging", "pg-drag-over"));
      });
      btn.addEventListener("click", (event) => {
        if (Date.now() < dragUntil) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    });

    applyVisualOrder(grid);

    let actions = head.querySelector(".pg-home-quick-head-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "pg-home-quick-head-actions";
      const existing = [...head.children].filter((el) => el.tagName === "BUTTON");
      existing.forEach((btn) => actions.appendChild(btn));
      head.appendChild(actions);
    }

    let expandBtn = actions.querySelector(".pg-home-quick-expand");
    if (!expandBtn) {
      expandBtn = document.createElement("button");
      expandBtn.type = "button";
      expandBtn.className = "bg-chip pg-home-quick-expand";
      expandBtn.addEventListener("click", () => {
        expanded = !expanded;
        decorateQuickGrid();
      });
      actions.insertBefore(expandBtn, actions.firstChild);
    }

    const remainingCount = renderExtraMenus(section, grid);
    const lang = currentLang();
    expandBtn.hidden = remainingCount === 0;
    expandBtn.textContent = expanded ? (lang === "en" ? "Collapse" : "접기") : (lang === "en" ? "Show all" : "펼쳐보기");
    expandBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  function decoratePetBtiQuiz() {
    document.querySelectorAll(".feature-module-shell > .bg-card").forEach((card) => {
      const options = [...card.querySelectorAll("button.bg-btn.bg-btn-ghost")];
      const heading = card.querySelector("h3");
      const counter = [...card.querySelectorAll(".bg-sub")].find((el) => /^\s*\d+\s*\/\s*\d+\s*$/.test(text(el)));
      if (!heading || !counter || options.length < 2) {
        card.classList.remove("pg-petbti-quiz-card");
        return;
      }

      card.classList.add("pg-petbti-quiz-card");
      heading.classList.add("pg-petbti-question-title");
      counter.classList.add("pg-petbti-counter");
      options.forEach((btn, idx) => {
        btn.classList.add("pg-petbti-option", `pg-petbti-option-${(idx % 4) + 1}`);
        if (btn.dataset.pgPetBtiClickBound === "1") return;
        btn.dataset.pgPetBtiClickBound = "1";
        btn.addEventListener("pointerdown", () => btn.classList.add("pg-selected"));
      });
    });
  }

  function hideDuplicateHomeWidgets() {
    const home = document.querySelector(".petgrow-dashboard-home");
    if (!home) return;
    home.querySelectorAll(".dash-widget-grid").forEach((grid) => grid.classList.add("pg-home-duplicate-widget-grid"));
  }

  function run() {
    decorateQuickGrid();
    decoratePetBtiQuiz();
    hideDuplicateHomeWidgets();
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      run();
    });
  }

  const observer = new MutationObserver(schedule);
  function boot() {
    run();
    observer.observe(document.getElementById("root") || document.body, { subtree: true, childList: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
