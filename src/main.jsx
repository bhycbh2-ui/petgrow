import React from "react";
import ReactDOM from "react-dom/client";
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

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

const hideInitialSplash = () => {
  try {
    if (typeof window.__hidePetGrowSplash === "function") {
      window.__hidePetGrowSplash();
      return;
    }
    const splash = document.getElementById("petgrow-initial-splash");
    if (splash) splash.remove();
  } catch {
    try { document.getElementById("petgrow-initial-splash")?.remove(); } catch {}
  }
};

// Hard fail-safe: the splash must never cover the app forever, even if App.jsx
// or an optional module fails during startup.
const splashWatchdog = window.setTimeout(hideInitialSplash, 2600);

const loadOptionalRuntimePatches = async () => {
  const patches = [
    () => import("./requested-polish-20260818.js"),
    () => import("./aab-ready-fixes-20260818.js"),
    () => import("./admin-news-music-runtime-20260818.js"),
    () => import("./final-audit-20260818.js"),
    () => import("./requested-final-fixes-20260818.js"),
  ];

  const results = await Promise.allSettled(patches.map((load) => load()));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.warn(`[PetGrow] optional runtime patch ${index + 1} skipped`, result.reason);
    }
  });
};

// Load the very large App bundle separately so its failure cannot keep the
// static splash on screen forever.
import("./App.jsx")
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Give React one paint, then release the splash independently of App state.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.clearTimeout(splashWatchdog);
        hideInitialSplash();
      });
    });

    // UI enhancement scripts are non-critical and start only after the app mounts.
    window.setTimeout(loadOptionalRuntimePatches, 0);
  })
  .catch((error) => {
    console.error("[PetGrow] App boot failed", error);
    window.clearTimeout(splashWatchdog);
    hideInitialSplash();
    root.render(
      <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",background:"#F8FAF7",fontFamily:"-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",textAlign:"center"}}>
        <div>
          <h1 style={{fontSize:"22px",margin:"0 0 10px"}}>PetGrow</h1>
          <p style={{margin:"0 0 16px",color:"#5F6B63",lineHeight:1.6}}>화면을 불러오지 못했어요. 새로고침하면 다시 연결합니다.</p>
          <button type="button" onClick={() => window.location.reload()} style={{border:0,borderRadius:"12px",padding:"12px 18px",background:"#4F8A5B",color:"white",fontWeight:800}}>새로고침</button>
        </div>
      </main>
    );
  });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=48", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
