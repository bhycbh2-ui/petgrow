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
import "./tarot-saju-rebuild-20260818.css";
import "./admin-news-music-20260818.css";
import "./requested-final-fixes-20260818.css";
import "./home-quick-petbti-20260819.css";
import "./petgrow-global-palette-20260819.css";
import "./petgrow-final-batch-20260819.css";
import "./pet-tarot-intro-fix-20260819.css";
import "./splash-motion-20260821.css";
import "./loading-speed-20260822.css";
import "./home-news-fast-20260819.js";

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
  // register() 자체가 필요 시 새 service worker를 확인합니다.
  // 매 접속마다 registration.update()를 한 번 더 호출하면 sw.js 요청이 중복될 수 있어 제거합니다.
  addEventListener("load",()=>navigator.serviceWorker.register("/sw.js?v=72",{updateViaCache:"none"}).catch(()=>{}),{once:true});
}
