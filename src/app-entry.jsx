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

const BOOT_BLOCKER_SELECTOR=".petgrow-boot-skeleton,#petgrow-fast-shell";

const ready=()=>{
  if(window.__petgrowCriticalAppReady)return;
  window.__petgrowCriticalAppReady=true;
  window.dispatchEvent(new CustomEvent("petgrow:critical-ready"));
};

// 앱 본체/보조 UI가 이미 올라왔는데 스켈레톤만 남는 회귀를 막습니다.
// 새로고침이나 캐시 삭제를 하지 않고 임시 로딩 레이어만 제거하므로 루프가 생기지 않습니다.
const releaseStalledBootShell=(reason="timeout")=>{
  const blockers=[...document.querySelectorAll(BOOT_BLOCKER_SELECTOR)];
  if(!blockers.length)return false;
  blockers.forEach((node)=>{
    try{
      node.setAttribute("aria-hidden","true");
      node.style.setProperty("pointer-events","none","important");
      node.style.setProperty("opacity","0","important");
      node.style.setProperty("visibility","hidden","important");
      node.style.setProperty("display","none","important");
      node.remove();
    }catch{}
  });
  try{window.__hidePetGrowSplash?.();}catch{}
  try{window.dispatchEvent(new CustomEvent("petgrow:home-shell-released",{detail:{reason}}));}catch{}
  ready();
  return true;
};

const started=performance.now();
const probe=()=>{
  const rendered=!!(root?.firstElementChild||String(root?.textContent||"").trim());
  const blocking=document.querySelector(BOOT_BLOCKER_SELECTOR);
  if((rendered&&!blocking)||(rendered&&performance.now()-started>700)||performance.now()-started>1200){ready();return;}
  requestAnimationFrame(probe);
};
requestAnimationFrame(()=>{
  document.getElementById("petgrow-fast-start-style")?.remove();
  probe();
});

// 정상 로딩은 이보다 훨씬 빨리 끝납니다. 1.8초 뒤에도 로딩 레이어가 있으면
// 앱 실행 실패가 아니라 '레이어 해제 누락'으로 보고 강제로 걷어냅니다.
window.setTimeout(()=>releaseStalledBootShell("startup-timeout"),1800);

addEventListener("pageshow",()=>{
  try{window.__hidePetGrowSplash?.();}catch{}
  window.setTimeout(()=>releaseStalledBootShell("pageshow"),650);
});
addEventListener("focus",()=>{
  window.setTimeout(()=>releaseStalledBootShell("focus"),650);
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden)return;
  try{window.__hidePetGrowSplash?.();}catch{}
  window.setTimeout(()=>releaseStalledBootShell("visible"),650);
});

const startDeferred=()=>import("./deferred-app-boot.js").then(m=>m.bootDeferredApp?.()).catch(()=>{});
if("requestIdleCallback" in window)requestIdleCallback(startDeferred,{timeout:850});
else setTimeout(startDeferred,260);

if("serviceWorker" in navigator){
  addEventListener("load",()=>navigator.serviceWorker.register("/sw.js?v=86",{updateViaCache:"none"}).catch(()=>{}),{once:true});
}
