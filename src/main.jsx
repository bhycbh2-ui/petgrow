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

// Render the core app first. Optional DOM/UI patch modules are loaded only
// after React has mounted so a runtime patch error can never trap PetGrow
// on the splash/loading screen.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

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

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", loadOptionalRuntimePatches, { once: true });
} else {
  loadOptionalRuntimePatches();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=47", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
