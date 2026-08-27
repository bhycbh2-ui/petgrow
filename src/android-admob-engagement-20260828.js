let booted=false;
let api=null;
let initialized=false;
let scanFrame=0;
let rewardedBusy=false;
let interstitialBusy=false;

const REWARDED_AD_ID="ca-app-pub-9699974051273244/3347474750";
const INTERSTITIAL_AD_ID="ca-app-pub-9699974051273244/4416129367";
const INTERSTITIAL_EVERY=5;
const INTERSTITIAL_COOLDOWN_MS=20*60*1000;
const COUNT_KEY="petgrow-admob-result-exits-v1";
const LAST_INTERSTITIAL_KEY="petgrow-admob-last-interstitial-v1";

const LABELS={
  ko:{
    reward:"🎁 광고 보고 보너스 케어 팁 보기",
    loading:"광고 준비 중…",
    retry:"광고를 불러오지 못했어요 · 다시 시도",
    close:"확인",
    bonusTitle:"보너스 케어 팁",
  },
  en:{
    reward:"🎁 Watch an ad for a bonus care tip",
    loading:"Preparing ad…",
    retry:"Ad unavailable · try again",
    close:"Done",
    bonusTitle:"Bonus care tip",
  }
};

function isAndroidNative(){
  try{return Boolean(api?.Capacitor?.isNativePlatform?.()&&api?.Capacitor?.getPlatform?.()==="android");}catch{return false;}
}

function isVisible(el){
  if(!el)return false;
  const style=getComputedStyle(el);
  if(style.display==="none"||style.visibility==="hidden"||Number(style.opacity)===0)return false;
  const rect=el.getBoundingClientRect();
  return rect.width>1&&rect.height>1;
}

function text(el){return String(el?.textContent||"").replace(/\s+/g," ").trim();}
function visibleButtons(){return [...document.querySelectorAll("button")].filter(isVisible);}

function detectResultKind(){
  const buttons=visibleButtons();
  const labels=buttons.map(text);
  const petBtiRestart=labels.some(v=>v==="다시 테스트하기"||v==="Take the test again");
  const petBtiShare=labels.some(v=>v.includes("PetBTI 공유")||v.includes("Share my PetBTI"));
  if(petBtiRestart&&petBtiShare)return "petbti";

  const sajuRestart=labels.some(v=>v==="다시 보기"||v==="Try again");
  const sajuShare=labels.some(v=>v.includes("사주 공유")||v.includes("Share this fortune"));
  if(sajuRestart&&sajuShare)return "saju";
  return "";
}

function language(){
  const body=String(document.body?.innerText||"");
  return /다시 테스트하기|우리 아이 사주 공유하기|보호자/.test(body)?"ko":"en";
}

function consentReady(){return document.documentElement.hasAttribute("data-petgrow-ad-consent-ready");}

async function ensureApi(){
  if(api)return api;
  const core=await import("@capacitor/core");
  if(!core.Capacitor.isNativePlatform()||core.Capacitor.getPlatform()!=="android")return null;
  const admob=await import("@capacitor-community/admob");
  api={...admob,Capacitor:core.Capacitor};
  return api;
}

async function ensureInitialized(){
  const m=await ensureApi();
  if(!m||!consentReady())return false;
  if(initialized)return true;
  await m.AdMob.initialize({initializeForTesting:false,testingDevices:[]});
  initialized=true;
  return true;
}

function bonusCopy(kind,lang){
  if(lang==="en"){
    return kind==="petbti"
      ? "Try a simple 10-minute routine that fits today's personality result: 3 minutes exploring, 4 minutes of play, then 3 minutes of calm rest. Note what your pet enjoyed most for the next session."
      : "Today's bonus mission: enjoy a short 10-minute walk or play session and save one photo to your growth album. Keep Pet Fortune as light entertainment; use real observation and professional advice for health or behavior decisions.";
  }
  return kind==="petbti"
    ? "오늘 결과에 맞춰 10분 루틴을 해보세요. 3분 탐색 → 4분 놀이 → 3분 차분한 휴식으로 진행하고, 가장 반응이 좋았던 활동을 기록해두면 다음 놀이를 고르기 쉬워요."
    : "오늘의 보너스 미션은 짧은 산책이나 놀이 10분 + 성장앨범에 사진 한 장 남기기예요. Pet사주는 가볍게 즐기고 실제 건강·행동 판단은 관찰과 전문가 상담을 우선해 주세요.";
}

function showBonus(kind){
  document.getElementById("petgrow-rewarded-bonus")?.remove();
  const lang=language();
  const copy=LABELS[lang];
  const wrap=document.createElement("div");
  wrap.id="petgrow-rewarded-bonus";
  wrap.setAttribute("role","dialog");
  wrap.setAttribute("aria-modal","true");
  wrap.style.cssText="position:fixed;inset:0;z-index:2147483400;background:rgba(17,34,25,.46);display:grid;place-items:center;padding:20px";
  const card=document.createElement("div");
  card.style.cssText="width:min(92vw,430px);background:#fff;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.22);color:#223027;font-family:inherit";
  const title=document.createElement("h3");
  title.textContent=`🎁 ${copy.bonusTitle}`;
  title.style.cssText="margin:0 0 12px;font-size:20px;line-height:1.35";
  const p=document.createElement("p");
  p.textContent=bonusCopy(kind,lang);
  p.style.cssText="margin:0;font-size:15px;line-height:1.75;color:#4e5f54";
  const close=document.createElement("button");
  close.type="button";
  close.textContent=copy.close;
  close.style.cssText="width:100%;margin-top:18px;border:0;border-radius:14px;padding:13px 16px;font:700 15px/1 inherit;background:#2f7a52;color:#fff;cursor:pointer";
  close.addEventListener("click",()=>wrap.remove(),{once:true});
  wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove();});
  card.append(title,p,close);wrap.append(card);document.body.append(wrap);
}

async function showRewarded(kind=detectResultKind()||"petbti"){
  if(rewardedBusy)return false;
  rewardedBusy=true;
  try{
    if(!(await ensureInitialized()))return false;
    await api.AdMob.prepareRewardVideoAd({adId:REWARDED_AD_ID,isTesting:false});
    const reward=await api.AdMob.showRewardVideoAd();
    if(!reward||typeof reward!=="object")return false;
    showBonus(kind);
    window.dispatchEvent(new CustomEvent("petgrow:rewarded-ad-complete",{detail:{kind,reward}}));
    return true;
  }catch(e){
    console.warn("PetGrow rewarded AdMob",e?.message||e);
    return false;
  }finally{rewardedBusy=false;}
}

function ensureRewardCta(){
  const kind=detectResultKind();
  const old=document.getElementById("petgrow-rewarded-cta");
  if(!kind||!isAndroidNative()||!consentReady()){
    old?.remove();
    return;
  }
  if(old){old.dataset.kind=kind;return;}
  const lang=language();
  const copy=LABELS[lang];
  const button=document.createElement("button");
  button.id="petgrow-rewarded-cta";
  button.dataset.kind=kind;
  button.type="button";
  button.textContent=copy.reward;
  button.setAttribute("aria-label",copy.reward);
  button.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom));z-index:2147482500;width:min(calc(100vw - 32px),430px);border:1px solid rgba(47,122,82,.18);border-radius:16px;padding:13px 16px;background:#f7fff9;color:#245d40;box-shadow:0 10px 30px rgba(31,82,53,.16);font:800 14px/1.3 inherit;cursor:pointer";
  button.addEventListener("click",async()=>{
    if(button.disabled)return;
    button.disabled=true;
    button.textContent=copy.loading;
    const ok=await showRewarded(button.dataset.kind||kind);
    if(ok){button.remove();return;}
    button.disabled=false;
    button.textContent=copy.retry;
  });
  document.body.append(button);
}

function readCount(){
  try{return Math.max(0,Number.parseInt(localStorage.getItem(COUNT_KEY)||"0",10)||0);}catch{return 0;}
}
function writeCount(n){try{localStorage.setItem(COUNT_KEY,String(n));}catch{}}
function readLastInterstitial(){try{return Number(localStorage.getItem(LAST_INTERSTITIAL_KEY)||0)||0;}catch{return 0;}}
function writeLastInterstitial(t){try{localStorage.setItem(LAST_INTERSTITIAL_KEY,String(t));}catch{}}

async function maybeShowInterstitial(){
  if(interstitialBusy)return false;
  const now=Date.now();
  if(now-readLastInterstitial()<INTERSTITIAL_COOLDOWN_MS)return false;
  const next=readCount()+1;
  if(next<INTERSTITIAL_EVERY){writeCount(next);return false;}
  writeCount(0);
  interstitialBusy=true;
  try{
    if(!(await ensureInitialized()))return false;
    await api.AdMob.prepareInterstitial({adId:INTERSTITIAL_AD_ID,isTesting:false});
    await api.AdMob.showInterstitial();
    writeLastInterstitial(Date.now());
    window.dispatchEvent(new CustomEvent("petgrow:interstitial-ad-shown"));
    return true;
  }catch(e){
    console.warn("PetGrow interstitial AdMob",e?.message||e);
    return false;
  }finally{interstitialBusy=false;}
}

function isResultRestartButton(button,kind){
  const value=text(button);
  if(kind==="petbti")return value==="다시 테스트하기"||value==="Take the test again";
  if(kind==="saju")return value==="다시 보기"||value==="Try again";
  return false;
}

function onClick(event){
  const button=event.target?.closest?.("button");
  if(!button||!isVisible(button))return;
  const kind=detectResultKind();
  if(!kind||!isResultRestartButton(button,kind))return;
  // 결과를 확인하고 나가는 자연스러운 전환 시점에만 카운트합니다.
  setTimeout(()=>{maybeShowInterstitial();},120);
}

function queueScan(){
  if(scanFrame)return;
  scanFrame=requestAnimationFrame(()=>{scanFrame=0;ensureRewardCta();});
}

async function boot(){
  if(booted)return;booted=true;
  if(!(await ensureApi()))return;
  document.addEventListener("click",onClick,true);
  new MutationObserver(queueScan).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","hidden","aria-hidden"]});
  window.addEventListener("petgrow:admob-consent-ready",queueScan);
  window.addEventListener("petgrow:critical-ready",queueScan);
  document.addEventListener("visibilitychange",queueScan);
  window.PetGrowEngagementAds={
    rewardedAdId:REWARDED_AD_ID,
    interstitialAdId:INTERSTITIAL_AD_ID,
    showRewarded,
    maybeShowInterstitial,
    detectResultKind,
  };
  queueScan();
}

boot().catch(e=>console.warn("PetGrow engagement AdMob init",e?.message||e));
