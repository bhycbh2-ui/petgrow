import React from "react";
import ReactDOM from "react-dom/client";
import "./petgrow-premium-20260817.css";

// Temporary core-CSS isolation mode.
// Recent hotfix styles remain in the repository but are not imported here
// until the blank-screen conflict is identified.
const CSS_ISOLATION_MODE = true;

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

const forceRootVisible = () => {
  try {
    document.documentElement.style.visibility = "visible";
    document.documentElement.style.opacity = "1";
    document.body.style.visibility = "visible";
    document.body.style.opacity = "1";
    document.body.style.display = "block";
    rootElement.style.visibility = "visible";
    rootElement.style.opacity = "1";
    rootElement.style.display = "block";
    rootElement.style.minHeight = "100vh";
  } catch {}
};

const hideInitialSplash = () => {
  try {
    if (typeof window.__hidePetGrowSplash === "function") {
      window.__hidePetGrowSplash();
    }
    document.getElementById("petgrow-initial-splash")?.remove();
  } catch {
    try { document.getElementById("petgrow-initial-splash")?.remove(); } catch {}
  }
  forceRootVisible();
};

forceRootVisible();
const splashWatchdog = window.setTimeout(hideInitialSplash, 1800);

function BootErrorScreen({ error }) {
  forceRootVisible();
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

// Legacy runtime DOM patches remain paused during core-app isolation.
const RUNTIME_PATCHES_PAUSED = true;

const loadOptionalRuntimePatches = async () => {
  if (RUNTIME_PATCHES_PAUSED) {
    console.info("[PetGrow] optional runtime patches paused");
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
    forceRootVisible();
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
    navigator.serviceWorker.register("/sw.js?v=50", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
