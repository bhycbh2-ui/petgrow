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

/* Home/PetNews fetch routing must be ready before the full app mounts. */
import "./home-news-fast-20260819.js";

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
 * Avoid parsing every historical runtime patch in one burst.
 * Loading these small chunks one-by-one leaves breathing room for scrolling/taps on slower phones.
 */
const deferredLoaders = [
  () => import("./requested-polish-20260818.js"),
  () => import("./aab-ready-fixes-20260818.js"),
  () => import("./requested-final-fixes-20260818.js"),
  () => import("./home-quick-petbti-20260819.js"),
  () => import("./final-audit-20260818.js"),
  () => import("./petgrow-final-batch-20260819.js"),
  () => import("./legacy-growth-modal-ux.js"),
  () => import("./petlife-final-qa.js"),
  () => import("./PetLifeApp.jsx").then((m) => {
    m.bootPetLife?.();
    return import("./petlife-home-bridge.js").then((bridge) => bridge.bootPetLifeHomeBridge?.());
  }),
  () => import("./admin-news-music-runtime-20260818.js"),
  () => import("./about-petpoint-order-20260819.js"),
  () => import("./petinfo-cms-runtime.js"),
  () => import("./petinfo-cms-import-runtime.js"),
];

const loadDeferredRuntime = async () => {
  for (const load of deferredLoaders) {
    try {
      await load();
    } catch (_) {
      // A non-critical patch must never block the core app.
    }
    await sleep(28);
  }
};

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(() => loadDeferredRuntime(), { timeout: 1100 });
} else {
  setTimeout(loadDeferredRuntime, 320);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=55", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
