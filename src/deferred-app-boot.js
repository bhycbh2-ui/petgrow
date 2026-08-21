const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

const primary=[
  ()=>Promise.all([import("./PetLifeApp.jsx"),import("./petlife-home-bridge.js")]).then(([petLife,bridge])=>{petLife.bootPetLife?.();bridge.bootPetLifeHomeBridge?.();}),
  ()=>import("./requested-polish-20260818.js"),
  ()=>import("./aab-ready-fixes-20260818.js"),
  ()=>import("./requested-final-fixes-20260818.js"),
  ()=>import("./home-quick-petbti-20260819.js"),
  ()=>import("./petgrow-final-batch-20260819.js"),
  ()=>import("./petlife-final-qa.js"),
  ()=>import("./petlife-mobile-form-v2.js"),
  ()=>Promise.all([import("./petlife-navigation-ux.js"),import("./petlife-server-bridge.js")]).then(([navigation,serverBridge])=>{navigation.bootPetLifeNavigationUX?.();serverBridge.bootPetLifeServerBridge?.();}),
  ()=>import("./android-admob.js"),
];

const deep=[
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
  for(const load of loaders){try{await load();}catch{}await sleep(gap);}
}
function idle(callback,timeout,fallback){
  if("requestIdleCallback" in window)return requestIdleCallback(callback,{timeout});
  return setTimeout(callback,fallback);
}

let started=false;
export function bootDeferredApp(){
  if(started)return;started=true;
  idle(()=>loadInSlices(primary,30),900,250);
  const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const slow=connection?.saveData||/(^|-)2g$/.test(connection?.effectiveType||"");
  setTimeout(()=>idle(()=>loadInSlices(deep,64),2800,850),slow?15000:10000);
}
