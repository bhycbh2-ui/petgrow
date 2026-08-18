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
    document.getElementById("petgrow-initial-splash")?.remove();
  } catch {
    try { document.getElementById("petgrow-initial-splash")?.remove(); } catch {}
  }
};

const splashWatchdog = window.setTimeout(hideInitialSplash, 2600);

function BootErrorScreen({ error }) {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",background:"#F8FAF7",fontFamily:"-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",textAlign:"center",position:"relative",zIndex:2147483647,visibility:"visible",opacity:1}}>
      <div style={{maxWidth:"620px"}}>
        <h1 style={{fontSize:"22px",margin:"0 0 10px"}}>PetGrow</h1>
        <p style={{margin:"0 0 10px",color:"#5F6B63",lineHeight:1.6}}>앱 실행 중 오류가 발생했어요.</p>
        {error?.message ? (
          <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",fontSize:"12px",lineHeight:1.5,textAlign:"left",padding:"12px",borderRadius:"10px",background:"#fff",border:"1px solid #dfe7df",margin:"0 0 16px"}}>{String(error.message)}</pre>
        ) : null}
        <button type="button" onClick={() => window.location.reload()} style={{border:0,borderRadius:"12px",padding:"12px 18px",background:"#4F8A5B",color:"white",fontWeight:800}}>새로고침</button>
      </div>
    </main>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[PetGrow] render/runtime error", error, info);
    hideInitialSplash();
  }

  render() {
    if (this.state.error) return <BootErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}

// IMPORTANT: legacy runtime DOM patches are intentionally paused here.
// They previously ran together immediately after mount and could mutate the
// same React DOM tree. Keep the files in the repository, but do not execute
// them until the core app is confirmed stable.
const RUNTIME_PATCHES_PAUSED = true;

const loadOptionalRuntimePatches = async () => {
  if (RUNTIME_PATCHES_PAUSED) {
    console.info("[PetGrow] optional runtime patches paused for core-app isolation");
    return;
  }

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

import("./App.jsx")
  .then(({ default: App }) => {
    root.render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    );

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.clearTimeout(splashWatchdog);
        hideInitialSplash();
      });
    });

    window.setTimeout(loadOptionalRuntimePatches, 3000);
  })
  .catch((error) => {
    console.error("[PetGrow] App boot failed", error);
    window.clearTimeout(splashWatchdog);
    hideInitialSplash();
    root.render(<BootErrorScreen error={error} />);
  });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=49", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
