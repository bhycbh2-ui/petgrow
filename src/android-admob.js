let started=false;
let initialized=false;
let bannerVisible=false;
let petLifeOpen=false;
let api=null;
let consentPromise=null;
let consentReady=false;
let showTimer=0;

const DEFAULT_BANNER_ID="ca-app-pub-9699974051273244/9809518314";
const MIN_CONTENT_CHARS=700;
const RESTRICTED_ROUTE_RE=/(?:^|[\/#?&=_-])(loading|login|signin|signup|auth|admin|error|404|empty|consent|terms|privacy|delete-account|account|profile)(?:$|[\/#?&=_-])/i;
const RESTRICTED_HEADING_RE=/(로그인|회원가입|관리자\s*센터|회원\s*정보|개인정보\s*처리방침|이용약관|회원탈퇴|계정\s*삭제|오류|에러|페이지를\s*찾을\s*수|검색\s*결과\s*없|불러오는\s*중|준비\s*중|동의)/i;
const CONTENT_VIEW_RE=/(pet\s*정보|pet정보|펫\s*정보|pet\s*뉴스|pet뉴스|펫\s*뉴스)/i;

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

async function ensureConsent(){
  if(consentReady)return true;
  if(consentPromise)return consentPromise;
  consentPromise=(async()=>{
    try{
      const m=await ensureApi();
      if(!m)return false;
      let info=await m.AdMob.requestConsentInfo({tagForUnderAgeOfConsent:false});
      const status=String(info?.status||"UNKNOWN").toUpperCase();
      if(status==="REQUIRED"){
        if(!info?.isConsentFormAvailable)return false;
        info=await m.AdMob.showConsentForm();
      }
      const finalStatus=String(info?.status||"UNKNOWN").toUpperCase();
      // UMP의 OBTAINED는 사용자가 동의 화면에서 선택을 완료했다는 뜻이며,
      // NOT_REQUIRED는 해당 지역/상황에서 동의 화면이 필요하지 않다는 뜻입니다.
      consentReady=finalStatus==="OBTAINED"||finalStatus==="NOT_REQUIRED";
      document.documentElement.toggleAttribute("data-petgrow-ad-consent-ready",consentReady);
      if(consentReady)window.dispatchEvent(new CustomEvent("petgrow:admob-consent-ready"));
      return consentReady;
    }catch(e){
      console.warn("PetGrow AdMob consent",e?.message||e);
      // 동의 상태를 확인하지 못한 세션에서는 광고를 요청하지 않는 fail-closed 방식입니다.
      consentReady=false;
      return false;
    }finally{
      consentPromise=null;
    }
  })();
  return consentPromise;
}

async function initialize(){
  if(initialized)return true;
  const m=await ensureApi();
  if(!m)return false;
  if(!(await ensureConsent()))return false;
  await m.AdMob.initialize({initializeForTesting:false,testingDevices:[]});
  initialized=true;
  return true;
}

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

function isAdEligibleScreen(){
  if(document.visibilityState!=="visible")return false;
  if(petLifeOpen||document.querySelector("#petlife-react-root .pl-shell"))return false;
  if(document.body?.classList.contains("petgrow-ads-restricted"))return false;
  if(hasBlockingOverlay())return false;
  if(RESTRICTED_ROUTE_RE.test(`${location.pathname} ${location.search} ${location.hash}`))return false;
  if(RESTRICTED_HEADING_RE.test(currentHeadingText()))return false;

  // 심사 안정성을 위해 앱 광고는 'Pet정보/Pet뉴스'처럼 편집 콘텐츠가 중심인 화면에서만 허용합니다.
  // 홈·우리 아이·커뮤니티·지도·음악·검사·사주·계정·입력/관리 화면에는 광고를 표시하지 않습니다.
  const label=activeViewLabel();
  if(!label||!CONTENT_VIEW_RE.test(label))return false;
  if(publisherTextLength()<MIN_CONTENT_CHARS)return false;
  return true;
}

async function showBanner(){
  if(bannerVisible||!isAdEligibleScreen())return;
  try{
    if(!(await initialize())||!isAdEligibleScreen())return;
    const {AdMob,BannerAdPosition,BannerAdSize}=api;
    const adId=String(import.meta.env.VITE_ADMOB_BANNER_ID||DEFAULT_BANNER_ID).trim();
    if(!adId)return;
    ensureSafetyZone();
    await AdMob.showBanner({
      adId,
      adSize:BannerAdSize.ADAPTIVE_BANNER,
      position:BannerAdPosition.BOTTOM_CENTER,
      margin:0,
      isTesting:false
    });
    bannerVisible=true;
    document.documentElement.classList.add("petgrow-admob-banner");
  }catch(e){console.warn("PetGrow AdMob banner",e?.message||e);}
}

async function hideBanner(){
  clearTimeout(showTimer);showTimer=0;
  if(!bannerVisible){document.documentElement.classList.remove("petgrow-admob-banner");return;}
  try{await api?.AdMob?.hideBanner?.();}catch{}
  bannerVisible=false;
  document.documentElement.classList.remove("petgrow-admob-banner");
}

async function removeBanner(){
  clearTimeout(showTimer);showTimer=0;
  try{await api?.AdMob?.removeBanner?.();}catch{}
  bannerVisible=false;
  document.documentElement.classList.remove("petgrow-admob-banner");
}

function reconcileBanner(){
  if(!isAdEligibleScreen()){
    hideBanner();
    return;
  }
  if(bannerVisible||showTimer)return;
  // 화면 전환 직후 광고가 먼저 뜨는 일을 막고 실제 콘텐츠가 안정된 뒤에만 요청합니다.
  showTimer=window.setTimeout(()=>{
    showTimer=0;
    if(isAdEligibleScreen())showBanner();
  },900);
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
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","hidden","aria-hidden","aria-modal"]});
  addEventListener("popstate",queue);
  addEventListener("hashchange",queue);
  document.addEventListener("visibilitychange",queue);
  window.addEventListener("petgrow:critical-ready",queue);
  scan();
}

async function requestPrivacyChoices(){
  try{
    const m=await ensureApi();if(!m)return false;
    await hideBanner();
    await m.AdMob.resetConsentInfo();
    consentReady=false;consentPromise=null;
    document.documentElement.removeAttribute("data-petgrow-ad-consent-ready");
    const ok=await ensureConsent();
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
    await ensureConsent();
    reconcileBanner();
    window.PetGrowAdMob={showBanner,hideBanner,removeBanner,requestPrivacyChoices,isAdEligibleScreen};
  }catch(e){console.warn("PetGrow AdMob init",e?.message||e);}
}

bootAndroidAdMob();
