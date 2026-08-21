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

/* Home/PetNews fetch routing must be ready before the full app mounts. */
import "./home-news-fast-20260819.js";

window.__petgrowCriticalAppReady = false;

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.__petgrowAppMountedAt = performance.now();
requestAnimationFrame(() => {
  document.getElementById("petgrow-fast-start-style")?.remove();
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Critical home hydration runs behind the splash in its own small chunk. */
requestAnimationFrame(() => window.setTimeout(() => {
  import("./critical-home-boot.js")
    .then((module) => module.bootCriticalHome?.())
    .catch((error) => {
      console.warn("PetGrow critical home chunk failed", error);
      window.__petgrowCriticalAppReady = true;
      window.dispatchEvent(new CustomEvent("petgrow:critical-ready"));
    });
}, 0));

const primaryDeferredLoaders = [
  () => import("./requested-polish-20260818.js"),
  () => import("./aab-ready-fixes-20260818.js"),
  () => import("./requested-final-fixes-20260818.js"),
  () => import("./home-quick-petbti-20260819.js"),
  () => import("./petgrow-final-batch-20260819.js"),
  () => import("./petlife-final-qa.js"),
  () => import("./petlife-mobile-form-v2.js"),
  () => Promise.all([
    import("./petlife-navigation-ux.js"),
    import("./petlife-server-bridge.js"),
  ]).then(([navigation, serverBridge]) => {
    navigation.bootPetLifeNavigationUX?.();
    serverBridge.bootPetLifeServerBridge?.();
  }),
  () => import("./android-admob.js"),
];

const deepDeferredLoaders = [
  () => import("./legacy-server-sync.js"),
  () => import("./account-data-export.js"),
  () => import("./admin-server-health.js"),
  () => import("./final-audit-20260818.js"),
  () => import("./legacy-growth-modal-ux.js"),
  () => import("./admin-news-music-runtime-20260818.js"),
  () => import("./about-petpoint-order-20260819.js"),
  () => import("./petinfo-cms-runtime.js"),
  () => import("./petinfo-cms-import-runtime.js"),
];

const loadInSlices = async (loaders, gap = 34) => {
  for (const load of loaders) {
    try {
      await load();
    } catch (_) {
      // A non-critical patch must never block the core app.
    }
    await sleep(gap);
  }
};

const scheduleIdle = (callback, timeout, fallbackDelay) => {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(callback, fallbackDelay);
};

scheduleIdle(() => loadInSlices(primaryDeferredLoaders, 34), 1450, 520);

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const slowConnection = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "");
const deepDelay = slowConnection ? 14000 : 9000;
window.setTimeout(() => {
  scheduleIdle(() => loadInSlices(deepDeferredLoaders, 64), 2600, 750);
}, deepDelay);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=70", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
