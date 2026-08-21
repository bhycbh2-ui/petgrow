/* Keep the premium splash visible while the full app and login/session state load. */
window.__petgrowSplashSoundPlayed = true;

import("./app-entry.jsx").catch(() => {
  const message = document.querySelector(".pg-premium-message");
  if (message) message.textContent = "화면을 불러오지 못했어요. 다시 실행해 주세요.";
  if (typeof window.__petgrowSetSplashProgress === "function") {
    window.__petgrowSetSplashProgress(94);
  }
});
