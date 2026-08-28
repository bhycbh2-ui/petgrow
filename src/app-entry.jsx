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
import "./loading-speed-20260822.css";
import "./logo-safe-area-fix-20260828.css";
import "./home-news-fast-20260819.js";
import "./petlife-menu-regression-fix-20260822.js";
import "./ugc-safety-runtime.js";
import "./ugc-extra-block-runtime.js";
import "./android-location-gate.js";
import "./home-approved-redesign-20260828.js";
import "./home-mobile-airiness-20260828.css";
import "./home-pet-instant-sync-20260828.js";
import "./ui-brand-consistency-20260828.css";

// Android WebView에서 /api/me 요청이 드물게 끝나지 않아도 앱 첫 화면 전체를 막지 않도록
// 인증 확인만 짧게 제한합니다. 이후 focus 시 기존 App 로직이 다시 상태를 확인합니다.
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
  let rawUrl="";
  try{rawUrl=typeof input==="string"?input:String(input?.url||"");}catch{}
  let path=rawUrl;
  try{path=new URL(rawUrl,location.href).pathname;}catch{}
  if(path!=="/api/me")return nativeFetch(input,init);

  let timer=0;
  const request=nativeFetch(input,init);
  const hardTimeout=new Promise((resolve)=>{
    timer=window.setTimeout(()=>resolve(new Response(JSON.stringify({error:"auth_check_timeout"}),{
      status:503,
      headers:{"Content-Type":"application/json"},
    })),1200);
  });
  return Promise.race([request,hardTimeout]).finally(()=>window.clearTimeout(timer));
};

window.__petgrowCriticalAppReady=false;
const root=document.getElementById("root");
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
window.__petgrowAppMountedAt=performance.now();

// #petgrow-fast-shell은 React 바깥의 임시 셸입니다.
// React가 직접 관리하는 .petgrow-boot-skeleton은 절대로 외부에서 remove() 하지 않습니다.
// 이를 삭제하면 React fiber와 실제 DOM이 어긋나 iOS/Safari에서 빈 화면이 남을 수 있습니다.
const FAST_BOOT_SHELL_SELECTOR="#petgrow-fast-shell";

const ready=()=>{
  if(window.__petgrowCriticalAppReady)return;
  window.__petgrowCriticalAppReady=true;
  window.dispatchEvent(new CustomEvent("petgrow:critical-ready"));
};

const releaseFastBootShell=(reason="timeout")=>{
  const shell=document.querySelector(FAST_BOOT_SHELL_SELECTOR);
  if(shell){
    try{
      shell.setAttribute("aria-hidden","true");
      shell.style.setProperty("pointer-events","none","important");
      shell.remove();
    }catch{}
  }
  try{window.__hidePetGrowSplash?.();}catch{}
  try{window.dispatchEvent(new CustomEvent("petgrow:home-shell-released",{detail:{reason}}));}catch{}
  return Boolean(shell);
};

const started=performance.now();
const probe=()=>{
  const rendered=!!(root?.firstElementChild||String(root?.textContent||"").trim());
  if(rendered||performance.now()-started>1400){ready();return;}
  requestAnimationFrame(probe);
};
requestAnimationFrame(()=>{
  document.getElementById("petgrow-fast-start-style")?.remove();
  probe();
});

// 스플래시는 일정 시간이 지나면 걷어내되 React의 로딩/홈 DOM은 그대로 둡니다.
window.setTimeout(()=>releaseFastBootShell("startup-timeout"),1800);

addEventListener("pageshow",()=>{
  try{window.__hidePetGrowSplash?.();}catch{}
  window.setTimeout(()=>releaseFastBootShell("pageshow"),650);
});
addEventListener("focus",()=>{
  window.setTimeout(()=>releaseFastBootShell("focus"),650);
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden)return;
  try{window.__hidePetGrowSplash?.();}catch{}
  window.setTimeout(()=>releaseFastBootShell("visible"),650);
});

const startDeferred=()=>import("./deferred-app-boot.js").then(m=>m.bootDeferredApp?.()).catch(()=>{});
if("requestIdleCallback" in window)requestIdleCallback(startDeferred,{timeout:850});
else setTimeout(startDeferred,260);

if("serviceWorker" in navigator){
  addEventListener("load",()=>navigator.serviceWorker.register("/sw.js?v=96",{updateViaCache:"none"}).catch(()=>{}),{once:true});
}
