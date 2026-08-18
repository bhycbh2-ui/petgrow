// Fast, cache-first dynamic sections for the PetGrow home screen.
// Keeps the large App.jsx untouched and progressively enhances HomePage.

const HOME_FEED_CACHE_KEY = "petgrow_home_feed_v3";
const ROOT_ID = "petgrow-home-fast-content";
const STYLE_ID = "petgrow-home-fast-style";

const TIP_POOL = [
  { category: "건강", title: "강아지·고양이 물 섭취량, 평소와 달라졌다면 확인해요" },
  { category: "건강", title: "반려동물 구토, 색과 횟수로 먼저 체크할 포인트" },
  { category: "생활", title: "산책 후 발바닥은 어떻게 관리하는 게 좋을까요?" },
  { category: "식단", title: "사료를 갑자기 바꾸면 안 되는 이유와 교체 방법" },
  { category: "행동", title: "강아지가 자꾸 핥는 행동, 언제 주의해야 할까요?" },
  { category: "행동", title: "고양이가 갑자기 숨는 시간이 늘었다면 확인할 것" },
  { category: "생활", title: "초보 보호자가 놓치기 쉬운 집안 안전 체크리스트" },
  { category: "건강", title: "예방접종 전후 보호자가 챙기면 좋은 것들" },
  { category: "식단", title: "반려동물 간식은 하루에 얼마나 주는 게 좋을까요?" },
  { category: "생활", title: "여름철 산책 시간과 아스팔트 온도 체크 방법" },
  { category: "건강", title: "귀를 자주 긁거나 머리를 흔들 때 살펴볼 부분" },
  { category: "행동", title: "낯선 사람·동물과의 사회화는 천천히 시작해요" }
];

let currentAudio = null;
let currentTrackId = "";
let lastFeed = null;
let observer = null;
let refreshTimer = null;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID}{display:grid;gap:18px;margin:0 0 18px}
    #${ROOT_ID} .pg-fast-section{margin:0}
    #${ROOT_ID} .pg-fast-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}
    #${ROOT_ID} .pg-fast-head h2{margin:0;font-size:18px;line-height:1.35}
    #${ROOT_ID} .pg-fast-all{border:0;background:transparent;color:var(--primary,#6f55e8);font:inherit;font-size:13px;font-weight:800;cursor:pointer;padding:6px 0}
    #${ROOT_ID} .pg-fast-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    #${ROOT_ID} .pg-fast-card{appearance:none;width:100%;box-sizing:border-box;border:1px solid var(--border,#e8e8ef);background:var(--card,#fff);border-radius:16px;padding:14px 15px;text-align:left;color:inherit;font:inherit;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.025)}
    #${ROOT_ID} .pg-fast-card small{display:block;color:var(--primary,#6f55e8);font-size:11px;font-weight:800;margin-bottom:5px}
    #${ROOT_ID} .pg-fast-card strong{display:block;font-size:14px;line-height:1.5;word-break:keep-all}
    #${ROOT_ID} .pg-fast-list{display:grid;gap:8px}
    #${ROOT_ID} .pg-fast-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px;border:1px solid var(--border,#e8e8ef);background:var(--card,#fff);border-radius:14px;padding:10px 12px}
    #${ROOT_ID} .pg-fast-rank{font-weight:900;color:var(--primary,#6f55e8);text-align:center}
    #${ROOT_ID} .pg-fast-title{border:0;background:transparent;color:inherit;font:inherit;text-align:left;min-width:0;padding:0;cursor:pointer}
    #${ROOT_ID} .pg-fast-title b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #${ROOT_ID} .pg-fast-title span{display:block;margin-top:3px;font-size:11px;color:var(--muted,#85858f)}
    #${ROOT_ID} .pg-fast-play{width:42px;height:34px;border-radius:999px;border:1px solid var(--border,#e8e8ef);background:var(--card,#fff);color:inherit;cursor:pointer;font-weight:900}
    #${ROOT_ID} .pg-fast-news{display:grid;gap:8px}
    #${ROOT_ID} .pg-fast-news .pg-fast-card{padding:13px 15px}
    #${ROOT_ID} .pg-fast-loading{height:60px;border-radius:14px;background:linear-gradient(90deg,rgba(127,127,127,.08),rgba(127,127,127,.14),rgba(127,127,127,.08));background-size:200% 100%;animation:pgFastPulse 1.2s linear infinite}
    @keyframes pgFastPulse{to{background-position:-200% 0}}
    @media(max-width:720px){#${ROOT_ID} .pg-fast-grid{grid-template-columns:1fr}#${ROOT_ID}{gap:16px}#${ROOT_ID} .pg-fast-head h2{font-size:17px}}
  `;
  document.head.appendChild(style);
}

function koreaDayIndex() {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return Math.floor(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)) / 86400000);
  } catch {
    return Math.floor(Date.now() / 86400000);
  }
}

function todayTips() {
  const start = (koreaDayIndex() * 5) % TIP_POOL.length;
  return [0, 1, 2].map(i => TIP_POOL[(start + i) % TIP_POOL.length]);
}

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HOME_FEED_CACHE_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch { return null; }
}

function saveCache(feed) {
  try { localStorage.setItem(HOME_FEED_CACHE_KEY, JSON.stringify({ ...feed, cachedAt: Date.now() })); } catch {}
}

function isHomeVisible() {
  const headings = [...document.querySelectorAll(".dash-section-head h2")];
  return headings.some(h => /자주 사용하는 메뉴|Quick access/i.test(h.textContent || ""));
}

function findQuickSection() {
  const heading = [...document.querySelectorAll(".dash-section-head h2")].find(h => /자주 사용하는 메뉴|Quick access/i.test(h.textContent || ""));
  return heading?.closest?.("section") || null;
}

function hideSlowHomeNews() {
  [...document.querySelectorAll(".dash-section-head h2")].forEach(h => {
    if (/주요 Pet뉴스|Important Pet News/i.test(h.textContent || "")) {
      const section = h.closest("section");
      if (section && !section.closest(`#${ROOT_ID}`)) section.style.display = "none";
    }
  });
}

function clickMenu(kind) {
  const labels = {
    tips: ["Pet정보", "펫정보", "PET INFO"],
    music: ["Pet음악", "PET MUSIC"],
    news: ["Pet뉴스", "PET NEWS"]
  }[kind] || [];
  const candidates = [...document.querySelectorAll("button,a")].filter(el => !el.closest(`#${ROOT_ID}`));
  const exact = candidates.find(el => labels.some(label => (el.textContent || "").trim().toLowerCase() === label.toLowerCase()));
  const partial = candidates.find(el => labels.some(label => (el.textContent || "").toLowerCase().includes(label.toLowerCase())));
  (exact || partial)?.click?.();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function sectionHead(title, kind) {
  const head = el("div", "pg-fast-head");
  head.appendChild(el("h2", "", title));
  const all = el("button", "pg-fast-all", "전체보기 →");
  all.type = "button";
  all.addEventListener("click", () => clickMenu(kind));
  head.appendChild(all);
  return head;
}

function buildTipsSection() {
  const section = el("section", "pg-fast-section");
  section.appendChild(sectionHead("오늘의 Pet정보", "tips"));
  const grid = el("div", "pg-fast-grid");
  todayTips().forEach(tip => {
    const card = el("button", "pg-fast-card");
    card.type = "button";
    card.appendChild(el("small", "", tip.category));
    card.appendChild(el("strong", "", tip.title));
    card.addEventListener("click", () => clickMenu("tips"));
    grid.appendChild(card);
  });
  section.appendChild(grid);
  return section;
}

function buildMusicSection(top5) {
  const section = el("section", "pg-fast-section");
  section.appendChild(sectionHead("인기 Pet음악 TOP 5", "music"));
  const list = el("div", "pg-fast-list");
  if (!Array.isArray(top5) || !top5.length) {
    for (let i = 0; i < 3; i++) list.appendChild(el("div", "pg-fast-loading"));
  } else {
    top5.slice(0, 5).forEach((track, index) => {
      const row = el("div", "pg-fast-row");
      row.appendChild(el("div", "pg-fast-rank", String(index + 1)));
      const title = el("button", "pg-fast-title");
      title.type = "button";
      title.appendChild(el("b", "", track.title || "Pet음악"));
      title.appendChild(el("span", "", `▶ ${Number(track.playCount ?? track.play_count ?? 0).toLocaleString()} · ♥ ${Number(track.likeCount ?? track.like_count ?? 0).toLocaleString()}`));
      title.addEventListener("click", () => clickMenu("music"));
      row.appendChild(title);
      const play = el("button", "pg-fast-play", currentTrackId === String(track.id) && currentAudio && !currentAudio.paused ? "❚❚" : "▶");
      play.type = "button";
      play.setAttribute("aria-label", "음악 재생 또는 일시정지");
      play.addEventListener("click", async () => {
        const id = String(track.id ?? "");
        const url = track.audioUrl || track.audio_url || "";
        if (!url) return clickMenu("music");
        if (currentAudio && currentTrackId === id && !currentAudio.paused) {
          currentAudio.pause();
          currentTrackId = "";
          render(lastFeed);
          return;
        }
        try { currentAudio?.pause?.(); } catch {}
        currentAudio = new Audio(url);
        currentTrackId = id;
        currentAudio.onended = () => { currentTrackId = ""; render(lastFeed); };
        currentAudio.onerror = () => { currentTrackId = ""; render(lastFeed); };
        render(lastFeed);
        try {
          await currentAudio.play();
          fetch("/api/music?action=play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: track.id, trackId: track.id }) }).catch(() => {});
        } catch { currentTrackId = ""; render(lastFeed); }
      });
      row.appendChild(play);
      list.appendChild(row);
    });
  }
  section.appendChild(list);
  return section;
}

function buildNewsSection(news) {
  const section = el("section", "pg-fast-section");
  section.appendChild(sectionHead("최신 Pet뉴스", "news"));
  const list = el("div", "pg-fast-news");
  if (!Array.isArray(news) || !news.length) {
    for (let i = 0; i < 3; i++) list.appendChild(el("div", "pg-fast-loading"));
  } else {
    news.slice(0, 3).forEach(item => {
      const card = el("button", "pg-fast-card");
      card.type = "button";
      card.appendChild(el("small", "", `${item.category || "Pet뉴스"}${item.source ? ` · ${item.source}` : ""}`));
      card.appendChild(el("strong", "", item.title || "Pet뉴스"));
      card.addEventListener("click", () => clickMenu("news"));
      list.appendChild(card);
    });
  }
  section.appendChild(list);
  return section;
}

function ensureRoot() {
  if (!isHomeVisible()) return null;
  const quick = findQuickSection();
  if (!quick) return null;
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = el("div", "");
    root.id = ROOT_ID;
    quick.insertAdjacentElement("afterend", root);
  }
  hideSlowHomeNews();
  return root;
}

function render(feed) {
  const root = ensureRoot();
  if (!root) return;
  lastFeed = feed || lastFeed || readCache() || { news: [], top5: [] };
  root.replaceChildren(
    buildTipsSection(),
    buildMusicSection(lastFeed.top5),
    buildNewsSection(lastFeed.news)
  );
  hideSlowHomeNews();
}

async function refreshFeed() {
  try {
    const response = await fetch("/api/home-feed", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const feed = await response.json();
    if (!feed || typeof feed !== "object") return;
    lastFeed = { news: Array.isArray(feed.news) ? feed.news : [], top5: Array.isArray(feed.top5) ? feed.top5 : [] };
    saveCache(lastFeed);
    render(lastFeed);
  } catch {}
}

function boot() {
  injectStyle();
  lastFeed = readCache() || { news: [], top5: [] };
  render(lastFeed); // cache/static PetInfo appears before any network request finishes
  refreshFeed();
  observer = new MutationObserver(() => {
    if (isHomeVisible()) {
      render(lastFeed);
      hideSlowHomeNews();
    } else if (currentAudio) {
      try { currentAudio.pause(); } catch {}
      currentTrackId = "";
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  refreshTimer = window.setInterval(refreshFeed, 5 * 60 * 1000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();

window.addEventListener("beforeunload", () => {
  try { currentAudio?.pause?.(); } catch {}
  observer?.disconnect?.();
  if (refreshTimer) clearInterval(refreshTimer);
});
