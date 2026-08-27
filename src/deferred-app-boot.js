const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

const primary=[
  // Only load feature CSS that may be reached from normal navigation soon after launch.
  ()=>Promise.all([
    import("./tarot-saju-rebuild-20260818.css"),
    import("./pet-tarot-intro-fix-20260819.css"),
  ]),
  ()=>Promise.all([import("./PetLifeApp.jsx"),import("./petlife-home-bridge.js")]).then(([petLife,bridge])=>{petLife.bootPetLife?.();bridge.bootPetLifeHomeBridge?.();}),
  ()=>import("./requested-polish-20260818.js"),
  ()=>import("./aab-ready-fixes-20260818.js"),
  ()=>import("./requested-final-fixes-20260818.js"),
  ()=>import("./home-quick-petbti-20260819.js"),
  ()=>import("./petgrow-final-batch-20260819.js"),
  ()=>import("./petlife-final-qa.js"),
  ()=>import("./petlife-mobile-form-v2.js"),
  ()=>Promise.all([import("./petlife-navigation-ux.js"),import("./petlife-server-bridge.js")]).then(([navigation,serverBridge])=>{navigation.bootPetLifeNavigationUX?.();serverBridge.bootPetLifeServerBridge?.();}),
];

const deep=[
  // Ads/privacy/admin are intentionally outside the first idle slice.
  ()=>import("./adsense-review-20260822.css"),
  ()=>Promise.all([import("./adsense-review-20260822.js"),import("./admob-readiness-20260822.js")]),
  ()=>Promise.all([import("./android-admob.js"),import("./admob-privacy-entry.js"),import("./android-admob-engagement-20260828.js")]),
  ()=>import("./admin-news-music-20260818.css"),
  ()=>import("./legacy-server-sync.js"),
  ()=>import("./account-data-export.js"),
  ()=>import("./admin-server-health.js"),
  ()=>import("./final-audit-20260818.js"),
  ()=>import("./legacy-growth-modal-ux.js"),
  ()=>import("./admin-news-music-runtime-20260818.js"),
  ()=>import("./about-petpoint-order-20260819.js"),
  ()=>import("./petinfo-cms-runtime.js"),
  ()=>import("./petinfo-cms-import-runtime.js"),
];

async function loadInSlices(loaders,gap){
  for(const load of loaders){
    while(document.visibilityState==="hidden")await sleep(700);
    try{await load();}catch{}
    await sleep(gap);
  }
}
function idle(callback,timeout,fallback){
  if("requestIdleCallback" in window)return requestIdleCallback(callback,{timeout});
  return setTimeout(callback,fallback);
}

let started=false;
export function bootDeferredApp(){
  if(started)return;started=true;

  // Let the home/splash transition finish before warming normal feature modules.
  idle(()=>loadInSlices(primary,44),1200,420);

  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const slow=connection?.saveData||/(^|-)2g$/.test(connection?.effectiveType||"");
  let deepStarted=false;
  const startDeep=()=>{
    if(deepStarted)return;deepStarted=true;
    idle(()=>loadInSlices(deep,86),3600,1200);
  };

  // Fast connections warm deep modules later; data-saver/2G waits much longer.
  const timer=setTimeout(startDeep,slow?18000:9000);

  // An actual user interaction is a better signal than loading everything at startup.
  const onIntent=()=>{
    clearTimeout(timer);
    setTimeout(startDeep,slow?4500:1800);
  };
  addEventListener("pointerdown",onIntent,{once:true,passive:true});
  addEventListener("keydown",onIntent,{once:true,passive:true});
}
