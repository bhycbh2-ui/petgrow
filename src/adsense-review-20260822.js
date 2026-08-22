const GUIDE_LINKS = [
  ["강아지 예방접종 시기 총정리", "/guides/dog-vaccination.html", "예방접종 일정과 접종 전후 체크사항"],
  ["강아지 목욕 주기와 피부 관리", "/guides/dog-bath.html", "피부 상태와 생활환경에 맞춘 목욕 기준"],
  ["강아지 산책 시간과 횟수 가이드", "/guides/dog-walk.html", "나이·체력·날씨에 따른 안전한 산책 습관"],
  ["강아지 사료 선택 기준", "/guides/dog-food.html", "연령과 체형을 고려한 사료 라벨 읽는 법"],
  ["강아지 체중 관리 방법", "/guides/dog-weight.html", "체형 점검부터 기록 습관까지"],
  ["강아지 치아관리와 양치 습관", "/guides/dog-dental-care.html", "구강 건강을 위한 단계별 관리법"],
  ["반려견 분리불안 완화 방법", "/guides/separation-anxiety.html", "혼자 있는 시간을 편안하게 만드는 연습"],
  ["강아지 배변훈련 기초", "/guides/potty-training.html", "실수를 줄이는 환경·보상 중심 훈련"],
  ["초보 보호자 준비물 체크", "/guides/new-owner-checklist.html", "입양 전후 꼭 필요한 물품과 준비 순서"],
  ["병원에 가야 할 위험 신호", "/guides/vet-warning-signs.html", "지켜봐도 되는 변화와 빠른 진료가 필요한 신호"],
  ["먹으면 위험한 음식과 대응", "/guides/toxic-foods.html", "위험 식품과 섭취 시 확인할 정보"],
  ["열사병 예방과 더운 날 산책", "/guides/heatstroke.html", "여름철 환경 관리와 위험 신호"],
];

const AD_SELECTORS = [
  "ins.adsbygoogle",
  ".google-auto-placed",
  "iframe[src*='googleads']",
  "iframe[src*='doubleclick.net']",
  "[id^='google_ads_']",
  "[data-ad-client]"
].join(",");

function isNativeShell() {
  return /(?:^|[?&])app_version=/i.test(location.search) ||
    Boolean(window.Capacitor?.isNativePlatform?.());
}

function activeViewLabel() {
  const active = document.querySelector(
    ".desktop-nav-link.active,.petgrow-sidebar-nav button.active,.app-bottom-nav button.active,[aria-current='page']"
  );
  return (active?.textContent || "").replace(/\s+/g, " ").trim();
}

function isContentSafeView() {
  // Android 앱에서는 웹 AdSense를 전부 막고 네이티브 AdMob만 사용합니다.
  if (isNativeShell()) return false;
  if (document.getElementById("petgrow-initial-splash")) return false;
  const path = `${location.pathname}${location.hash}`.toLowerCase();
  if (location.pathname !== "/") return false;
  if (/login|signup|admin|404|error|loading|privacy|terms/.test(path)) return false;

  const label = activeViewLabel();
  if (label) {
    return /홈|home|pet정보|정보|pet뉴스|news|소개|about/i.test(label);
  }

  const rootText = (document.getElementById("root")?.innerText || "").slice(0, 2200);
  if (/로그인이 필요|회원가입|관리자센터|게시물이 없습니다|검색 결과가 없습니다|불러오는 중|잠시만 기다려|콘텐츠가 없습니다/.test(rootText)) return false;
  return rootText.replace(/\s+/g, " ").trim().length >= 320;
}

function isHomeView() {
  if (isNativeShell()) return false;
  if (location.pathname !== "/" || document.getElementById("petgrow-initial-splash")) return false;
  const label = activeViewLabel();
  if (label) return /홈|home/i.test(label);
  const rootText = (document.getElementById("root")?.innerText || "").slice(0, 1400);
  return !/로그인이 필요|관리자센터|검색 결과가 없습니다|게시물이 없습니다/.test(rootText);
}

function guardAdPlacement() {
  const restricted = !isContentSafeView();
  document.documentElement.classList.toggle("petgrow-ads-restricted", restricted);
  if (!restricted) return;
  document.querySelectorAll(AD_SELECTORS).forEach((node) => {
    if (node.dataset?.petgrowAdGuard === "1") return;
    if (node.dataset) node.dataset.petgrowAdGuard = "1";
    node.setAttribute?.("aria-hidden", "true");
    node.style?.setProperty("display", "none", "important");
  });
}

function createEditorialHub() {
  if (isNativeShell()) return null;
  let section = document.getElementById("petgrow-editorial-hub");
  if (section) return section;
  section = document.createElement("section");
  section.id = "petgrow-editorial-hub";
  section.setAttribute("aria-labelledby", "petgrow-editorial-title");
  section.innerHTML = `
    <div class="petgrow-editorial-inner">
      <div class="petgrow-editorial-intro">
        <span class="petgrow-editorial-kicker">PETGROW CARE GUIDE</span>
        <h2 id="petgrow-editorial-title">반려생활에 바로 쓰는 PetGrow 가이드</h2>
        <p>PetGrow는 반려동물의 성장과 일상을 기록하는 기능뿐 아니라 보호자가 일상에서 판단하기 어려운 관리 기준을 이해하기 쉽게 정리합니다. 건강·위생·산책·식사·행동 관리의 기본 원칙을 확인하고, 우리 아이의 상태에 맞게 기록해 보세요.</p>
        <p class="petgrow-editorial-note">아래 정보는 일반적인 반려생활 안내이며 개별 질환의 진단이나 치료를 대신하지 않습니다. 이상 증상이 지속되거나 급격한 변화가 있다면 수의사와 상담하세요.</p>
      </div>
      <div class="petgrow-editorial-grid">
        ${GUIDE_LINKS.map(([title, href, desc]) => `<a class="petgrow-editorial-card" href="${href}"><strong>${title}</strong><span>${desc}</span><em>가이드 보기 →</em></a>`).join("")}
      </div>
      <div class="petgrow-editorial-footer">
        <a href="/pet-guide.html">가이드 전체보기</a><span>•</span>
        <a href="/editorial-policy.html">콘텐츠 편집 원칙</a><span>•</span>
        <a href="/privacy-policy.html">개인정보처리방침</a><span>•</span>
        <a href="/app.html">앱 안내</a><span>•</span>
        <a href="/contact.html">고객지원</a>
      </div>
    </div>`;
  document.body.appendChild(section);
  return section;
}

function syncEditorialHub() {
  if (isNativeShell()) {
    document.getElementById("petgrow-editorial-hub")?.remove();
    return;
  }
  const section = createEditorialHub();
  if (!section) return;
  const nextHidden = !isHomeView();
  if (section.hidden !== nextHidden) section.hidden = nextHidden;
}

let timer = 0;
function scheduleSync() {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    guardAdPlacement();
    syncEditorialHub();
  }, 120);
}

const observer = new MutationObserver(scheduleSync);

export function bootAdSenseReviewBoost() {
  const start = () => {
    guardAdPlacement();
    syncEditorialHub();
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
    addEventListener("popstate", scheduleSync);
    addEventListener("hashchange", scheduleSync);
    document.addEventListener("click", scheduleSync, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

bootAdSenseReviewBoost();
