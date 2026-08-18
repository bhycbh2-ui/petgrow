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
import "./requested-polish-20260818.js";
import "./aab-ready-fixes-20260818.js";
import "./admin-news-music-runtime-20260818.js";
import "./final-audit-20260818.js";
import "./requested-final-fixes-20260818.js";
import "./home-news-fast-20260819.js";
import "./home-quick-petbti-20260819.js";
import "./about-petpoint-order-20260819.js";
import "./petgrow-final-batch-20260819.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=48", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
