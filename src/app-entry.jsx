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

/*
 * The splash now owns the only visible loading phase.
 * PetLife's home bridge is brought up behind the splash first so the user does not
 * see a second "records are loading" card after the progress reaches 100%.
 */
const waitForCriticalHome = async (timeout = 3000) => {
  const started = performance.now();
  let homeSeenAt = 0;
  while (performance.now() - started < timeout) {
    const home = document.querySelector(".petgrow-dashboard-home");
    if (!home) {
      if (performance.now() - started > 500) return "not-home";
      await sleep(40);
      continue;
    }
    homeSeenAt ||= performance.now();
    const petLifeSection = home.querySelector("#pg-petlife-home-dashboard");
    const petLifeLoading = petLifeSection?.querySelector(".pgh-loading");
    if (petLifeSection && !petLifeLoading) return "ready";
    /* Logged-out users intentionally do not receive a PetLife dashboard. */
    if (!petLifeSection && performance.now() - homeSeenAt > 900) return "not-applicable";
    await sleep(45);
  }
  return "timeout";
};

let criticalBootPromise = null;
const bootCriticalUi = () => {
  if (criticalBootPromise) return criticalBootPromise;
  criticalBootPromise = (async () => {
    try {
      const [petLifeModule, bridge] = await Promise.all([
        import("./PetLifeApp.jsx"),
        import("./petlife-home-bridge.js"),
      ]);
      petLifeModule.bootPetLife?.();
      bridge.bootPetLifeHomeBridge?.();
      await waitForCriticalHome();
    } catch (error) {
      console.warn("PetGrow critical home preload failed", error);
    } finally {
      window.__petgrowCriticalAppReady = true;
      window.dispatchEvent(new CustomEvent("petgrow:critical-ready"));
    }
  })();
  return criticalBootPromise;
};

/* Start immediately after the first React paint while the splash is still covering it. */
requestAnimationFrame(() => window.setTimeout(bootCriticalUi, 0));

/*
 * Phase 1: usability and interaction helpers. Critical PetLife home hydration was
 * already started above, so these can stay off the first rendering path.
 */
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

/*
 * Phase 2: deep-page/admin helpers. None of these are required to paint or use
 * the first screen, so keep them outside the initial interaction window.
 */
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
