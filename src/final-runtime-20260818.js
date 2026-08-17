/* PETGROW_FINAL_RUNTIME_20260818 */
const PG_LANG = { KO: "ko", EN: "en", JA: "ja", "中文": "zh" };
const textSources = new WeakMap();
const translatedCache = new Map();
let localizeTimer = null;
let localizeBusy = false;
let activityCache = null;
let activityCacheAt = 0;

function currentLang() {
  const active = document.querySelector(".lang-toggle button.active");
  const raw = active?.textContent?.trim() || "KO";
  return PG_LANG[raw] || (raw.includes("中") ? "zh" : "ko");
}

const HERO_TITLES = {
  "우리 아이": { en:"My Pet", ja:"うちの子", zh:"我的宠物" },
  "Pet톡": { en:"Pet Talk", ja:"Petトーク", zh:"Pet社区" },
  "Pet정보": { en:"Pet Info", ja:"Pet情報", zh:"Pet信息" },
  "Pet사주": { en:"Pet Saju", ja:"Pet占い", zh:"Pet命理" },
  "Pet타로": { en:"Pet Tarot", ja:"Petタロット", zh:"Pet塔罗" },
  "정보가이드": { en:"Guide", ja:"情報ガイド", zh:"信息指南" },
  "마이페이지": { en:"My Page", ja:"マイページ", zh:"我的页面" },
  "더보기": { en:"More", ja:"その他", zh:"更多" },
  "내 주변 Pet": { en:"Nearby Pet", ja:"近くのPet", zh:"附近Pet" },
  "Pet음악": { en:"Pet Music", ja:"Pet音楽", zh:"Pet音乐" },
  "Pet뉴스": { en:"Pet News", ja:"Petニュース", zh:"Pet新闻" },
  "고객지원": { en:"Support", ja:"サポート", zh:"客户支持" },
  "광고 문의": { en:"Advertising", ja:"広告・提携のお問い合わせ", zh:"广告合作咨询" },
  "이용약관": { en:"Terms of Service", ja:"利用規約", zh:"使用条款" },
  "개인정보처리방침": { en:"Privacy Policy", ja:"プライバシーポリシー", zh:"隐私政策" }
};

function applyImmediateTitles() {
  const lang = currentLang();
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  document.querySelectorAll(".petgrow-unified-hero h1,.legal-page-title").forEach(el => {
    const now = el.textContent.trim();
    if (!el.dataset.pgOriginalTitle && HERO_TITLES[now]) el.dataset.pgOriginalTitle = now;
    const source = el.dataset.pgOriginalTitle || now;
    if (lang === "ko") {
      if (el.dataset.pgOriginalTitle) el.textContent = el.dataset.pgOriginalTitle;
    } else if (HERO_TITLES[source]?.[lang]) {
      el.textContent = HERO_TITLES[source][lang];
    }
  });
}

function excludedFromAutoTranslation(parent) {
  return !parent || !!parent.closest([
    "script","style","textarea","input","select","option","[contenteditable='true']",
    ".lang-toggle",".pet-user-name",".cm-card",".cm-detail-body-card",".cm-comment-list",
    ".petnews-comment-list",".my-activity-timeline",".account-code",".admin-reports-page"
  ].join(","));
}

function collectTranslatableNodes() {
  const lang = currentLang();
  if (lang === "ko") {
    document.querySelectorAll("body *").forEach(el => {
      for (const node of el.childNodes || []) {
        if (node.nodeType === Node.TEXT_NODE && textSources.has(node)) {
          const src = textSources.get(node);
          if (node.nodeValue !== src) node.nodeValue = src;
        }
      }
    });
    return [];
  }
  const root = document.getElementById("root") || document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (excludedFromAutoTranslation(parent)) continue;
    const raw = String(node.nodeValue || "");
    const trimmed = raw.trim();
    if (!trimmed || !/[가-힣]/.test(trimmed) || trimmed.length > 700) continue;
    if (!textSources.has(node)) textSources.set(node, trimmed);
    nodes.push({ node, source: textSources.get(node), prefix: raw.match(/^\s*/)?.[0] || "", suffix: raw.match(/\s*$/)?.[0] || "" });
  }
  return nodes;
}

async function autoLocalize() {
  if (localizeBusy) return;
  applyImmediateTitles();
  const lang = currentLang();
  const entries = collectTranslatableNodes();
  if (lang === "ko" || !entries.length) return;
  localizeBusy = true;
  try {
    const unique = [...new Set(entries.map(x => x.source))];
    const missing = unique.filter(x => !translatedCache.has(`${lang}:${x}`));
    for (let i=0; i<missing.length; i+=18) {
      const texts = missing.slice(i,i+18);
      try {
        const r = await fetch("/api/localize-ui", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({lang,texts}) });
        if (!r.ok) continue;
        const j = await r.json();
        (j.items || []).forEach((translated,idx) => translatedCache.set(`${lang}:${texts[idx]}`, translated || texts[idx]));
      } catch {}
    }
    entries.forEach(({node,source,prefix,suffix}) => {
      if (!node.isConnected) return;
      const translated = translatedCache.get(`${lang}:${source}`);
      if (translated && translated !== source) node.nodeValue = `${prefix}${translated}${suffix}`;
    });
  } finally {
    localizeBusy = false;
  }
}

function scheduleLocalize(delay=80) {
  clearTimeout(localizeTimer);
  localizeTimer = setTimeout(autoLocalize, delay);
}

function enhancePointHelp() {
  document.querySelectorAll(".petpoint-help-btn").forEach(btn => {
    if (btn.dataset.pgEnhanced) return;
    btn.dataset.pgEnhanced = "1";
    btn.textContent = "포인트 안내";
    btn.setAttribute("aria-label","PetPoint 적립·차감 안내");
  });
  document.querySelectorAll(".petpoint-help-panel").forEach(panel => {
    if (panel.querySelector(".petpoint-help-extra")) return;
    const extra = document.createElement("div");
    extra.className = "petpoint-help-extra";
    extra.innerHTML = `
      <p><b>차감 방식</b> · 오늘의 펫운세 20P · 기본 Pet사주 50P · 보호자 궁합 40P · Pet타로 30P</p>
      <p><b>적립 기준</b> · Pet톡 글 +50P(하루 5회) · 댓글 +20P(하루 5회) · 좋아요 받기 +5P(하루 50회) · 하루 첫 접속 +30P</p>
      <p>같은 활동을 반복하거나 취소 후 다시 실행하는 방식으로는 중복 적립되지 않아요. PetPoint는 PetGrow 안에서 재미 콘텐츠를 이용하기 위한 무료 활동 포인트이며 현금 구매·환전·출금·양도는 지원하지 않아요.</p>`;
    panel.appendChild(extra);
    scheduleLocalize(30);
  });
}

async function getActivity() {
  if (activityCache && Date.now()-activityCacheAt < 15000) return activityCache;
  try {
    const r = await fetch("/api/activity?action=timeline", { credentials:"include" });
    if (!r.ok) return [];
    const j = await r.json();
    activityCache = j.items || [];
    activityCacheAt = Date.now();
    return activityCache;
  } catch { return []; }
}

async function enhanceActivityHub() {
  const hub = document.querySelector(".my-activity-hub");
  if (!hub) return;
  const sub = hub.querySelector(".my-activity-hub-head small");
  const subText = "메뉴 방문 기록은 제외하고, 글·댓글·좋아요와 Pet사주·Pet타로 이용 기록만 보여줘요. 항목을 누르면 관련 화면으로 이동해요.";
  if (sub && sub.textContent !== subText) sub.textContent = subText;
  const items = await getActivity();
  const rows = [...hub.querySelectorAll(".my-activity-row")];
  rows.forEach((row,i) => {
    const item = items[i];
    if (!item?.target?.view) return;
    row.dataset.view = item.target.view;
    row.tabIndex = 0;
    const go = () => window.dispatchEvent(new CustomEvent("petgrow:navigate", { detail:{ view:item.target.view, postId:item.target.postId || null } }));
    row.onclick = go;
    row.onkeydown = e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } };
  });
}

async function openPointModal() {
  if (document.querySelector(".pg-point-modal-backdrop")) return;
  let balanceText = "로그인하면 현재 포인트를 확인할 수 있어요";
  try {
    const r = await fetch("/api/points?action=summary", {credentials:"include"});
    if (r.ok) {
      const j = await r.json();
      balanceText = `${Number(j.balance||0).toLocaleString()}P`;
    }
  } catch {}
  const overlay = document.createElement("div");
  overlay.className = "pg-point-modal-backdrop";
  overlay.innerHTML = `<section class="pg-point-modal" role="dialog" aria-modal="true" aria-label="PetPoint 안내">
    <button type="button" class="pg-point-modal-close" aria-label="닫기">×</button>
    <div class="pg-point-modal-head"><small>PETGROW REWARD</small><h2>PetPoint 이용 안내</h2><p>PetGrow에서 건강한 참여를 보상하고 재미 콘텐츠를 부담 없이 즐길 수 있도록 만든 무료 활동 포인트예요.</p></div>
    <div class="pg-point-balance"><span>현재 보유 포인트</span><b>${balanceText}</b></div>
    <div class="pg-point-info-grid">
      <section><h3>🐾 어떻게 적립하나요?</h3><ul><li>처음 시작 시 <strong>1,000P</strong></li><li>하루 첫 접속 <strong>+30P / 1회</strong></li><li>Pet톡 글 작성 <strong>+50P / 하루 5회</strong></li><li>Pet톡 댓글 작성 <strong>+20P / 하루 5회</strong></li><li>내 글이 좋아요 받기 <strong>+5P / 하루 50회</strong></li></ul></section>
      <section><h3>🎟️ 어디에 사용하나요?</h3><ul><li>오늘의 펫운세 <strong>20P</strong></li><li>기본 Pet사주 <strong>50P</strong></li><li>보호자 궁합 <strong>40P</strong></li><li>Pet타로 카드 뽑기 <strong>30P</strong></li></ul></section>
      <section><h3>🔒 차감·중복 기준</h3><p>콘텐츠를 실제 이용할 때 안내된 포인트가 차감돼요. 같은 게시글의 댓글 적립이나 같은 이용자의 반복 좋아요처럼 동일 활동을 반복해 포인트를 중복으로 얻는 것은 제한돼요.</p></section>
      <section><h3>💚 운영 취지</h3><p>유료 충전을 유도하는 재화가 아니라 PetGrow 안에서 기록하고 소통한 활동을 다시 재미 콘텐츠 이용으로 돌려주는 참여 보상 방식이에요.</p></section>
      <section class="pg-point-purpose"><h3>꼭 알아두기</h3><p>PetPoint는 현금으로 구매·환전·출금하거나 다른 사람에게 양도할 수 없어요. 비정상 활동이나 운영정책 위반으로 적립된 포인트는 지급 취소 또는 회수될 수 있어요.</p></section>
    </div>
  </section>`;
  const close = () => overlay.remove();
  overlay.addEventListener("click", e => { if(e.target === overlay || e.target.closest(".pg-point-modal-close")) close(); });
  document.addEventListener("keydown", function esc(e){ if(e.key === "Escape"){ close(); document.removeEventListener("keydown",esc); } });
  document.body.appendChild(overlay);
  scheduleLocalize(30);
}

function bindPointAbout() {
  document.querySelectorAll(".petpoint-about").forEach(card => {
    if (card.dataset.pgPointBound) return;
    card.dataset.pgPointBound = "1";
    card.setAttribute("role","button"); card.tabIndex = 0;
    card.addEventListener("click", openPointModal);
    card.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){e.preventDefault();openPointModal();} });
  });
}

function normalizeMenuText(v="") { return String(v).replace(/\s+/g," ").trim().toLowerCase(); }
function menuRole(text="") {
  const x=normalizeMenuText(text);
  const sets={
    about:["소개","about","about petgrow","petgrow 소개","紹介","关于"],
    pets:["우리 아이","my pet","うちの子","我的宠物"],
    nearby:["내 주변 pet","nearby pet","近くのpet","附近pet"],
    music:["pet음악","pet music","pet音楽","pet音乐"],
    talk:["pet톡","pet talk","petトーク","pet社区"],
    bti:["petbti"],saju:["pet사주","pet saju","pet占い","pet命理"],tarot:["pet타로","pet tarot","petタロット","pet塔罗"],
    info:["pet정보","pet info","pet情報","pet信息"],news:["pet뉴스","pet news","petニュース","pet新闻"]
  };
  for(const [k,arr] of Object.entries(sets)) if(arr.some(v=>x===v||x.includes(v))) return k;
  return "";
}
function reorderMenus() {
  const side=document.querySelector(".petgrow-sidebar-nav");
  if(side){
    const labels=[...side.querySelectorAll(".sidebar-section-label")];
    const buttons=[...side.querySelectorAll(":scope>button")];
    const by={};buttons.forEach(b=>{const k=menuRole(b.textContent);if(k)by[k]=b});
    const target=["about","pets","nearby","talk","music","bti","saju","tarot","info","news"];
    const current=buttons.map(b=>menuRole(b.textContent)).filter(Boolean);
    if(labels.length>=3 && current.join(",")!==target.filter(k=>by[k]).join(",")){
      const life=labels[0],content=labels[1],info=labels[2];
      ["about","pets","nearby"].reverse().forEach(k=>by[k]&&life.after(by[k]));
      let anchor=content;["talk","music","bti","saju","tarot"].forEach(k=>{if(by[k]){anchor.after(by[k]);anchor=by[k]}});
      anchor=info;["info","news"].forEach(k=>{if(by[k]){anchor.after(by[k]);anchor=by[k]}});
    }
  }
  const groups=[...document.querySelectorAll(".ham-nav-group")];
  if(groups.length>=3){
    const all=[...document.querySelectorAll(".ham-nav-group .ham-nav-item")],by={};all.forEach(b=>{const k=menuRole(b.textContent);if(k)by[k]=b});
    const target=["about","pets","nearby","talk","music","bti","saju","tarot","info","news"];
    const current=all.map(b=>menuRole(b.textContent)).filter(Boolean);
    if(current.join(",")!==target.filter(k=>by[k]).join(",")){
      const place=(g,keys)=>keys.forEach(k=>by[k]&&g.appendChild(by[k]));
      place(groups[0],["about","pets","nearby"]);place(groups[1],["talk","music","bti","saju","tarot"]);place(groups[2],["info","news"]);
    }
  }
  const desktop=document.querySelector(".desktop-nav-links");
  if(desktop){const all=[...desktop.querySelectorAll("button")],by={};all.forEach(b=>{const k=menuRole(b.textContent);if(k)by[k]=b});const target=["about","pets","nearby","talk","music","bti","saju","tarot","info","news"];const current=all.map(b=>menuRole(b.textContent)).filter(Boolean);if(current.join(",")!==target.filter(k=>by[k]).join(","))target.forEach(k=>by[k]&&desktop.appendChild(by[k]));}
}

function applyFinalRuntimeFixes() {
  applyImmediateTitles();
  enhancePointHelp();
  enhanceActivityHub();
  bindPointAbout();
  reorderMenus();
  scheduleLocalize();
}

if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    applyFinalRuntimeFixes();
    const root = document.getElementById("root") || document.body;
    const observer = new MutationObserver(() => applyFinalRuntimeFixes());
    observer.observe(root,{childList:true,subtree:true,characterData:true});
    document.addEventListener("click", e => {
      if (e.target.closest(".lang-toggle button")) setTimeout(()=>{ activityCache=null; applyFinalRuntimeFixes(); },80);
      if (e.target.closest(".my-activity-hub-head button")) { activityCache=null; setTimeout(enhanceActivityHub,220); }
    },true);
  });
}
