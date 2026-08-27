import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./petgrow-premium-20260817.css";
import "./final-ux-20260818.css";
import "./ui-fixes-20260818.css";
import "./news-pettalk-tarot-20260818.css";
import "./runtime-ui-20260818.css";
import "./critical-ui-hotfix-20260818.css";
import "./requested-polish-20260818.css";
import "./aab-ready-fixes-20260818.css";
import "./requested-final-fixes-20260818.css";
import "./home-quick-petbti-20260819.css";
import "./petgrow-global-palette-20260819.css";
import "./petgrow-final-batch-20260819.css";
import "./splash-motion-20260821.css";
import "./loading-speed-20260822.css";
import "./logo-safe-area-fix-20260828.css";
import "./home-news-fast-20260819.js";
import "./petlife-menu-regression-fix-20260822.js";

window.__petgrowCriticalAppReady=false;
const root=document.getElementById("root");
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
window.__petgrowAppMountedAt=performance.now();

const HOME_BLOCKER_SELECTOR=".petgrow-boot-skeleton,#petgrow-fast-shell";
const HOME_RECOVERY_PARAM="pg_home_recover";
const isPetGrowApp=/(?:^|[?&])app_version=/i.test(location.search)||Boolean(window.Capacitor?.isNativePlatform?.());
let homeRecoveryBusy=false;
let lastHiddenAt=0;

const homeBlockers=()=>Array.from(document.querySelectorAll(HOME_BLOCKER_SELECTOR));

const clearHomeRecoveryMarker=()=>{
  try{
    const url=new URL(location.href);
    if(url.searchParams.get(HOME_RECOVERY_PARAM)!=="1")return;
    url.searchParams.delete(HOME_RECOVERY_PARAM);
    url.searchParams.delete("pg_refresh");
    history.replaceState(null,"",url.pathname+url.search+url.hash);
  }catch{}
};

const releaseStalledHomeShell=(reason)=>{
  const blockers=homeBlockers();
  if(!blockers.length)return false;
  blockers.forEach((node)=>{
    try{
      node.setAttribute("aria-hidden","true");
      node.style.setProperty("pointer-events","none","important");
      node.style.setProperty("opacity","0","important");
      node.style.setProperty("visibility","hidden","important");
      node.style.setProperty("display","none","important");
    }catch{}
  });
  try{window.dispatchEvent(new CustomEvent("petgrow:home-shell-released",{detail:{reason}}));}catch{}
  try{window.dispatchEvent(new Event("resize"));}catch{}
  try{window.dispatchEvent(new Event("online"));}catch{}
  return true;
};

const clearStaleAppCache=async()=>{
  try{
    if("serviceWorker" in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(regs.map((reg)=>reg.unregister()));
    }
  }catch{}
  try{
    if("caches" in window){
      const names=await caches.keys();
      await Promise.allSettled(names.map((name)=>caches.delete(name)));
    }
  }catch{}
};

const recoverStalledHome=async(reason)=>{
  if(homeRecoveryBusy||!homeBlockers().length)return;
  homeRecoveryBusy=true;
  try{
    const url=new URL(location.href);
    const alreadyRecovered=url.searchParams.get(HOME_RECOVERY_PARAM)==="1";

    if(isPetGrowApp&&!alreadyRecovered){
      try{window.__hidePetGrowSplash?.();}catch{}
      await clearStaleAppCache();
      url.searchParams.set(HOME_RECOVERY_PARAM,"1");
      url.searchParams.set("pg_refresh",String(Date.now()));
      location.replace(url.toString());
      return;
    }

    // Never leave the user trapped behind an infinite home skeleton. On the
    // one-time recovered pass we reveal the mounted app even if a data request
    // or OAuth-resume callback failed to clear its temporary shell.
    releaseStalledHomeShell(reason);
    ready();
    window.setTimeout(()=>{
      if(!homeBlockers().length)clearHomeRecoveryMarker();
    },500);
  }finally{
    homeRecoveryBusy=false;
  }
};

const scheduleHomeRecovery=(reason,delay)=>{
  window.setTimeout(()=>{
    if(homeBlockers().length)recoverStalledHome(reason);
    else clearHomeRecoveryMarker();
  },delay);
};

const ready=()=>{
  if(window.__petgrowCriticalAppReady)return;
  window.__petgrowCriticalAppReady=true;
  window.dispatchEvent(new CustomEvent("petgrow:critical-ready"));
};
const started=performance.now();
const probe=()=>{
  const rendered=!!(root?.firstElementChild||String(root?.textContent||"").trim());
  const blocking=document.querySelector(HOME_BLOCKER_SELECTOR);
  if((rendered&&!blocking)||(rendered&&performance.now()-started>700)||performance.now()-started>1200){ready();return;}
  requestAnimationFrame(probe);
};
requestAnimationFrame(()=>{
  document.getElementById("petgrow-fast-start-style")?.remove();
  probe();
});

// A normal home skeleton is brief. If it survives this bounded window in the
// Android app, treat it as an OAuth/session resume stall and recover once.
scheduleHomeRecovery("startup",isPetGrowApp?2600:4500);

addEventListener("pageshow",()=>{
  try{window.__hidePetGrowSplash?.();}catch{}
  scheduleHomeRecovery("pageshow",isPetGrowApp?950:2200);
});
addEventListener("focus",()=>{
  if(lastHiddenAt&&Date.now()-lastHiddenAt>350)scheduleHomeRecovery("focus-return",isPetGrowApp?950:2200);
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){lastHiddenAt=Date.now();return;}
  try{window.__hidePetGrowSplash?.();}catch{}
  if(lastHiddenAt&&Date.now()-lastHiddenAt>350)scheduleHomeRecovery("visible-return",isPetGrowApp?950:2200);
});

const startDeferred=()=>import("./deferred-app-boot.js").then(m=>m.bootDeferredApp?.()).catch(()=>{});
if("requestIdleCallback" in window)requestIdleCallback(startDeferred,{timeout:850});
else setTimeout(startDeferred,260);

if("serviceWorker" in navigator){
  addEventListener("load",()=>navigator.serviceWorker.register("/sw.js?v=84",{updateViaCache:"none"}).catch(()=>{}),{once:true});
}