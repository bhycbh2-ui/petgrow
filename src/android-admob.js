let started=false;
let initialized=false;
let bannerVisible=false;
let petLifeOpen=false;
let api=null;

const DEFAULT_BANNER_ID="ca-app-pub-9699974051273244/9809518314";

function installInsetStyle(){
  if(document.getElementById("petgrow-admob-inset-style"))return;
  const style=document.createElement("style");style.id="petgrow-admob-inset-style";
  style.textContent=`html.petgrow-admob-banner body{padding-bottom:max(62px,env(safe-area-inset-bottom))!important}html.petgrow-admob-banner #root{min-height:calc(100dvh - max(62px,env(safe-area-inset-bottom)))}`;
  document.head.append(style);
}

async function ensureApi(){
  if(api)return api;
  const core=await import("@capacitor/core");
  if(!core.Capacitor.isNativePlatform()||core.Capacitor.getPlatform()!=="android")return null;
  const admob=await import("@capacitor-community/admob");
  api={...admob,Capacitor:core.Capacitor};
  return api;
}

async function initialize(){
  if(initialized)return true;
  const m=await ensureApi();if(!m)return false;
  await m.AdMob.initialize({initializeForTesting:false,testingDevices:[]});
  initialized=true;return true;
}

async function showBanner(){
  if(petLifeOpen||bannerVisible)return;
  try{
    if(!(await initialize()))return;
    const {AdMob,BannerAdPosition,BannerAdSize}=api;
    const adId=String(import.meta.env.VITE_ADMOB_BANNER_ID||DEFAULT_BANNER_ID).trim();
    if(!adId)return;
    await AdMob.showBanner({adId,adSize:BannerAdSize.ADAPTIVE_BANNER,position:BannerAdPosition.BOTTOM_CENTER,margin:0,isTesting:false});
    bannerVisible=true;installInsetStyle();document.documentElement.classList.add("petgrow-admob-banner");
  }catch(e){console.warn("PetGrow AdMob banner",e?.message||e);}
}

async function hideBanner(){
  if(!bannerVisible)return;
  try{await api?.AdMob?.hideBanner?.();}catch{}
  bannerVisible=false;document.documentElement.classList.remove("petgrow-admob-banner");
}

async function removeBanner(){
  try{await api?.AdMob?.removeBanner?.();}catch{}
  bannerVisible=false;document.documentElement.classList.remove("petgrow-admob-banner");
}

function watchPetLife(){
  let last=false;
  const scan=()=>{
    const open=Boolean(document.querySelector("#petlife-react-root .pl-shell"));
    if(open===last)return;last=open;petLifeOpen=open;
    if(open)hideBanner();else window.setTimeout(showBanner,220);
  };
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  scan();
}

export async function bootAndroidAdMob(){
  if(started)return;started=true;
  try{
    if(!(await ensureApi()))return;
    watchPetLife();
    window.setTimeout(showBanner,3200);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!petLifeOpen)showBanner();});
    window.PetGrowAdMob={showBanner,hideBanner,removeBanner};
  }catch(e){console.warn("PetGrow AdMob init",e?.message||e);}
}

bootAndroidAdMob();
