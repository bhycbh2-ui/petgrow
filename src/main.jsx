import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA: 서비스워커 등록 (오프라인 캐싱 + 홈화면 추가 지원)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js?v=22", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
