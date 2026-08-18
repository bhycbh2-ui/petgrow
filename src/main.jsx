import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./petgrow-premium-20260817.css";
import "./final-ux-20260818.css";
import "./ui-fixes-20260818.css";
import "./news-pettalk-tarot-20260818.css";
import "./runtime-ui-20260818.css";
import "./runtime-fixes-safe-20260818.js";
import "./lang-ko-en-only-20260818.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA: 서비스워커 등록 (오프라인 캐싱 + 홈화면 추가 지원)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=32", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
