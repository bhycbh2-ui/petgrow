import { createAdMobSession } from "./admob-session.js";

let started=false;
let bannerVisible=false;
let bannerCreated=false;
let bannerLoadPromise=null;
let bannerRemovalPromise=null;
let bannerVersion=0;
let listenersReady=false;
let nextBannerAttemptAt=0;
let lastBannerError=null;
let petLifeOpen=false;
let api=null;
let showTimer=0;

const session=createAdMobSession(ensureApi,state=>{
  document.documentElement.toggleAttribute("data-petgrow-ad-consent-ready",state.ready);
  document.documentElement.toggleAttribute("data-petgrow-ad-privacy-required",state.privacyOptionsRequired);
  window.dispatchEvent(new CustomEvent("petgrow:admob-consent-changed",{detail:state}));
  if(state.ready)window.dispatchEvent(new CustomEvent("petgrow:admob-consent-ready"));
});

const DEFAULT_BANNER_ID="ca-app-pub-9699974051273244/9809518314";
const MIN_CONTENT_CHARS=900;
const EMPTY_CONTENT_RE=/(게시물이\s*없|검색\s*결과가\s*없|콘텐츠가\s*없|아직\s*등록된|불러오는\s*중|준비\s*중|다시\s*시도)/i;
const RESTRICTED_ROUTE_RE=/(?:^|[\/#?&=_-])(loading|login|signin|signup|auth|admin|error|404|empty|consent|terms|privacy|delete-account|account|profile)(?:$|[\/#?&=_-])/i;
const RESTRICTED_HEADING_RE=/(로그인|회원가입|관리자\s*센터|회원\s*정보|개인정보\s*처리방침|이용약관|회원탈퇴|계정\s*삭제|오류|에러|페이지를\s*찾을\s*수|검색\s*결과\s*없|불러오는\s*중|준비\s*중|동의)/i;
const CONTENT_VIEW_RE=/(pet\s*정보|펫\s*정보|pet\s*뉴스|펫\s*뉴스|pet\s*info|pet\s*news)/i;

function installInsetStyle(){
  if(document.getElementById("petgrow-admob-inset-style"))return;
  const style=document.createElement("style");
  style.id="petgrow-admob-inset-style";
  style.textContent=`
    #petgrow-admob-safe-zone{display:none;position:fixed;left:0;right:0;bottom:0;height:112px;background:#f8faf7;border-top:1px solid rgba(60,88,70,.12);box-shadow:0 -8px 22px rgba(35,59,43,.045);pointer-events:none;z-index:2147482000}
    html.petgrow-admob-banner #petgrow-admob-safe-zone{display:block}
    html.petgrow-admob-banner body{padding-bottom:calc(196px + env(safe-area-inset-bottom))!important}
    html.petgrow-admob-banner #root{min-height:calc(100dvh - 196px - env(safe-area-inset-bottom))}
    html.petgrow-admob-banner .app-bottom-nav{bottom:calc(124px + env(safe-area-inset-bottom))!important}
    html.petgrow-admob-banner .mobile-bottom-nav,html.petgrow-admob-banner .petgrow-bottom-nav{bottom:calc(124px + env(safe-area-inset-bottom))!important}
  `;
  document.head.append(style);
}

function ensureSafetyZone(){
  installInsetStyle();
  if(document.getElementById("petgrow-admob-safe-zone"))return;
  const zone=document.createElement("div");
  zone.id="petgrow-admob-safe-zone";
  zone.setAttribute("aria-hidden","true");
  document.body.append(zone);
}

function isVisible(el){
  if(!el)return false;
  const s=getComputedStyle(el);
  if(s.display==="none"||s.visibility==="hidden"||Number(s.opacity)===0)return false;
  const r=el.getBoundingClientRect();
  return r.width>1&&r.height>1;
}

async function ensureApi(){
  if(api)return api;
  const core=await import("@capacitor/core");
  if(!core.Capacitor.isNativePlatform()||core.Capacitor.getPlatform()!=="android")return null;
  const admob=await import("@capacitor-community/admob");
  api={...admob,Capacitor:core.Capacitor};
  return api;
}

export const initializeAdMob=()=>session.initialize();

function hasBlockingOverlay(){
  if(document.querySelector("#petgrow-initial-splash,.petgrow-boot-skeleton,#petgrow-fast-shell"))return true;
  return [...document.querySelectorAll('[role="dialog"],[aria-modal="true"],.modal,.dialog,.popup')].some(isVisible);
}

function currentHeadingText(){
  return [...document.querySelectorAll("main h1,main h2,#root h1,#root h2,#root [role='heading']")]
    .filter(isVisible).slice(0,6).map(el=>(el.textContent||"").trim()).join(" ");
}

function activeViewLabel(){
  const active=document.querySelector(
    ".desktop-nav-link.active,.petgrow-sidebar-nav button.active,.app-bottom-nav button.active,[aria-current='page']"
  );
  return String(active?.textContent||"").replace(/\s+/g," ").trim();
}

function publisherTextLength(){
  const root=document.querySelector("main")||document.getElementById("root");
  if(!root||!isVisible(root))return 0;
  return String(root.innerText||root.textContent||"").replace(/\s+/g," ").trim().length;
}

function visibleEditorialBlocks(){
  const root=document.querySelector("main")||document.getElementById("root");
  if(!root)return 0;
  return [...root.querySelectorAll("article,section,p,.bg-card,.petnews-card-v10,.petnews-inline-detail")]
    .filter(el=>isVisible(el)&&String(el.innerText||el.textContent||"").replace(/\s+/g," ").trim().length>=90)
    .length;
}

function isAdEligibleScreen(){
  if(document.visibilityState!=="visible")return false;
  if(petLifeOpen||document.querySelector("#petlife-react-root .pl-shell"))return false;
  if(document.body?.classList.contains("petgrow-ads-restricted"))return false;
  if(hasBlockingOverlay())return false;
  if(RESTRICTED_ROUTE_RE.test(`${location.pathname} ${location.search} ${location.hash}`))return false;
  if(RESTRICTED_HEADING_RE.test(currentHeadingText()))return false;

  // 심사 안정성을 위해 앱 광고는 'Pet정보/Pet뉴스'처럼 편집 콘텐츠가 중심인 화면에서만 허용합니다.
  // 홈·우리 아이·커뮤니티·지도·음악·검사·사주·계정·입력/관리 화면에는 광고를 표시하지 않습니다.
  const view=document.querySelector("[data-petgrow-view]")?.dataset.petgrowView;
  if(view){if(view!=="tips"&&view!=="news")return false;}
  else if(!CONTENT_VIEW_RE.test(activeViewLabel()))return false;
  const contentText=String((document.querySelector("main")||document.getElementById("root"))?.innerText||"");
  if(EMPTY_CONTENT_RE.test(contentText))return false;
  if(publisherTextLength()<MIN_CONTENT_CHARS||visibleEditorialBlocks()<3)return false;
  return true;
}

function setBannerVisible(visible){
  bannerVisible=visible;
  // Avoid feeding no-op class mutations back into the screen observer.
  if(document.documentElement.classList.contains("petgrow-admob-banner")!==visible){
    document.documentElement.classList.toggle("petgrow-admob-banner",visible);
  }
}

async function installBannerListeners(){
  if(listenersReady)return;
  const {AdMob,BannerAdPluginEvents}=api;
  await AdMob.addListener(BannerAdPluginEvents.Loaded,()=>{
    if(!bannerCreated)return;
    if(!session.getStatus().ready||!isAdEligibleScreen()){removeBanner();return;}
    lastBannerError=null;
    setBannerVisible(true);
    window.dispatchEvent(new CustomEvent("petgrow:ad-event",{detail:{event:"ad_ready"}}));
  });
  await AdMob.addListener(BannerAdPluginEvents.FailedToLoad,error=>{
    if(!bannerCreated)return;
    lastBannerError=String(error?.message||error?.code||"banner-load-failed").slice(0,240);
    nextBannerAttemptAt=Date.now()+30000;
    window.dispatchEvent(new CustomEvent("petgrow:ad-event",{detail:{event:"ad_error"}}));
    removeBanner().then(reconcileBanner);
  });
  listenersReady=true;
}

async function removeBanner(){
  clearTimeout(showTimer);showTimer=0;
  bannerVersion++;
  setBannerVisible(false);
  if(bannerRemovalPromise)return bannerRemovalPromise;
  if(!bannerCreated)return;
  bannerCreated=false;
  bannerRemovalPromise=(async()=>{
    try{await api?.AdMob?.removeBanner?.();}catch(e){console.warn("PetGrow AdMob remove",e?.message||e);}
    finally{bannerRemovalPromise=null;}
  })();
  return bannerRemovalPromise;
}

// Destroy hidden banners so the plugin can create and resolve a fresh request
// when returning to content; showBanner on an existing native view may not resolve.
const hideBanner=removeBanner;

async function showBanner(){
  if(bannerLoadPromise)return bannerLoadPromise;
  if(bannerCreated||!isAdEligibleScreen()||Date.now()<nextBannerAttemptAt)return;
  const version=++bannerVersion;
  bannerLoadPromise=(async()=>{
    try{
      if(bannerRemovalPromise)await bannerRemovalPromise;
      if(!(await initializeAdMob())){nextBannerAttemptAt=Date.now()+30000;return;}
      await installBannerListeners();
      if(version!==bannerVersion||!session.getStatus().ready||!isAdEligibleScreen())return;
      const {AdMob,BannerAdPosition,BannerAdSize}=api;
      const adId=String(import.meta.env.VITE_ADMOB_BANNER_ID||DEFAULT_BANNER_ID).trim();
      ensureSafetyZone();
      bannerCreated=true;
      window.dispatchEvent(new CustomEvent("petgrow:ad-event",{detail:{event:"ad_request"}}));
      await AdMob.showBanner({adId,adSize:BannerAdSize.ADAPTIVE_BANNER,position:BannerAdPosition.BOTTOM_CENTER,margin:0,isTesting:false});
      if(version!==bannerVersion||!session.getStatus().ready||!isAdEligibleScreen())await removeBanner();
    }catch(e){
      lastBannerError=String(e?.message||e).slice(0,240);
      nextBannerAttemptAt=Date.now()+30000;
      await removeBanner();
      console.warn("PetGrow AdMob banner",e?.message||e);
    }finally{
      bannerLoadPromise=null;
      reconcileBanner();
    }
  })();
  return bannerLoadPromise;
}

function reconcileBanner(){
  if(!isAdEligibleScreen()){
    if(bannerCreated||bannerLoadPromise||showTimer)hideBanner();
    return;
  }
  if(bannerCreated||bannerLoadPromise||showTimer)return;
  // 화면 전환 직후 광고가 먼저 뜨는 일을 막고 실제 콘텐츠가 안정된 뒤에만 요청합니다.
  showTimer=window.setTimeout(()=>{
    showTimer=0;
    if(isAdEligibleScreen())showBanner();
  },Math.max(900,nextBannerAttemptAt-Date.now()));
}

function watchScreenSafety(){
  let queued=0;
  const scan=()=>{
    queued=0;
    petLifeOpen=Boolean(document.querySelector("#petlife-react-root .pl-shell"));
    reconcileBanner();
  };
  const queue=()=>{
    if(queued)return;
    queued=requestAnimationFrame(scan);
  };
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","hidden","aria-hidden","aria-modal","data-petgrow-view"]});
  addEventListener("popstate",queue);
  addEventListener("hashchange",queue);
  document.addEventListener("visibilitychange",queue);
  window.addEventListener("petgrow:critical-ready",queue);
  scan();
}

async function requestPrivacyChoices(){
  try{
    const m=await ensureApi();if(!m)return false;
    await removeBanner();
    const ok=await session.requestPrivacyChoices();
    reconcileBanner();
    return ok;
  }catch(e){console.warn("PetGrow AdMob privacy choices",e?.message||e);return false;}
}

export async function bootAndroidAdMob(){
  if(started)return;started=true;
  try{
    if(!(await ensureApi()))return;
    watchScreenSafety();
    // UMP 상태를 먼저 갱신합니다. 실패/UNKNOWN이면 이번 세션은 광고를 요청하지 않습니다.
    await session.ensureConsent();
    reconcileBanner();
    window.PetGrowAdMob={showBanner,hideBanner,removeBanner,requestPrivacyChoices,isAdEligibleScreen,
      getStatus:()=>({...session.getStatus(),eligible:isAdEligibleScreen(),bannerCreated,bannerVisible,lastBannerError})};
  }catch(e){console.warn("PetGrow AdMob init",e?.message||e);}
}

bootAndroidAdMob();
