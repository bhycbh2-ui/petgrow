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

// Android WebView에서 /api/me 요청이 드물게 AbortSignal 이후에도 끝나지 않는 경우가 있어요.
// 앱 첫 화면을 네트워크 한 건이 영구적으로 막지 못하도록 /api/me만 독립적인 hard timeout을 둡니다.
// 503 응답은 App의 기존 fetchMe 재시도/undefined 처리로 이어져 로그인 상태는 다음 focus에서 다시 확인합니다.
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

const ready=()=>{
  if(window.__petgrowCriticalAppReady)return;
  window.__petgrowCriticalAppReady=true;
  window.dispatchEvent(new CustomEvent("petgrow:critical-ready"));
};
const started=performance.now();
const probe=()=>{
  const rendered=!!(root?.firstElementChild||String(root?.textContent||"").trim());
  const blocking=document.querySelector(".petgrow-boot-skeleton,#petgrow-fast-shell");
  if((rendered&&!blocking)||(rendered&&performance.now()-started>700)||performance.now()-started>1200){ready();return;}
  requestAnimationFrame(probe);
};
requestAnimationFrame(()=>{
  document.getElementById("petgrow-fast-start-style")?.remove();
  probe();
});

const startDeferred=()=>import("./deferred-app-boot.js").then(m=>m.bootDeferredApp?.()).catch(()=>{});
if("requestIdleCallback" in window)requestIdleCallback(startDeferred,{timeout:850});
else setTimeout(startDeferred,260);

if("serviceWorker" in navigator){
  addEventListener("load",()=>navigator.serviceWorker.register("/sw.js?v=85",{updateViaCache:"none"}).catch(()=>{}),{once:true});
}
