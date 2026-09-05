import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
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
import "./petgrow-shell-authority.css";
import "./ugc-safety-runtime.js";
import "./ugc-extra-block-runtime.js";
import "./android-location-gate.js";
import "./home-pet-instant-sync-20260828.js";
import "./ui-brand-consistency-20260828.css";
import "./premium-core-surfaces-20260828.js";
import "./logo-final-crop-guard-20260901.css";
import "./responsive-footer-20260903.css";
import "./petgrow-oracle-suite-20260904.css";
import "./petgrow-about-next-20260905.css";
import "./petgrow-nearby-next-20260905.css";

const APP_AUTH_CALLBACK = "kr.co.petgrow.app://auth/callback";

function continueAndroidKakaoLogin(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.startsWith(APP_AUTH_CALLBACK)) return false;
  try {
    const callbackUrl = new URL(rawUrl);
    const token = callbackUrl.searchParams.get("token") || "";
    if (!/^[A-Za-z0-9_-]{32,160}$/.test(token)) {
      window.location.replace("/?login=error");
      return true;
    }
    window.location.replace(`/api/auth/kakao/handoff?token=${encodeURIComponent(token)}`);
    return true;
  } catch {
    window.location.replace("/?login=error");
    return true;
  }
}

if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
  CapacitorApp.addListener("appUrlOpen", ({ url }) => continueAndroidKakaoLogin(url));
  CapacitorApp.getLaunchUrl().then(result => continueAndroidKakaoLogin(result?.url)).catch(() => {});
}

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
  addEventListener("load",()=>navigator.serviceWorker.register("/sw.js?v=99",{updateViaCache:"none"}).catch(()=>{}),{once:true});
}
