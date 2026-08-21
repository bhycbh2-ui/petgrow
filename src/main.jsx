const root = document.getElementById("root");

const style = document.createElement("style");
style.id = "petgrow-fast-start-style";
style.textContent = `
  #petgrow-fast-shell{min-height:100dvh;background:#f8faf7;color:#26352b;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans KR",Arial,sans-serif;padding:18px 16px 28px;box-sizing:border-box}
  #petgrow-fast-shell .pgfs-wrap{width:min(1120px,100%);margin:0 auto}
  #petgrow-fast-shell .pgfs-head{height:56px;display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
  #petgrow-fast-shell .pgfs-brand{display:flex;align-items:center;gap:10px;font-size:19px;font-weight:800;letter-spacing:-.04em}
  #petgrow-fast-shell .pgfs-brand img{width:38px;height:38px;object-fit:contain}
  #petgrow-fast-shell .pgfs-chip{width:78px;height:30px;border-radius:999px;background:#e9efea}
  #petgrow-fast-shell .pgfs-hero{padding:22px;border:1px solid #e3e9e4;border-radius:22px;background:#fff;box-shadow:0 8px 24px rgba(38,53,43,.05);margin-bottom:14px}
  #petgrow-fast-shell .pgfs-line{height:13px;border-radius:999px;background:linear-gradient(90deg,#edf2ee 25%,#f7f9f7 50%,#edf2ee 75%);background-size:220% 100%;animation:pgfs-shimmer 1.15s linear infinite}
  #petgrow-fast-shell .pgfs-line.a{width:42%;height:20px;margin-bottom:12px}
  #petgrow-fast-shell .pgfs-line.b{width:68%}
  #petgrow-fast-shell .pgfs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  #petgrow-fast-shell .pgfs-card{height:112px;border-radius:18px;border:1px solid #e5ebe6;background:#fff;padding:14px;box-sizing:border-box}
  #petgrow-fast-shell .pgfs-card .pgfs-line:first-child{width:44%;margin-bottom:22px}
  #petgrow-fast-shell .pgfs-card .pgfs-line:last-child{width:72%;height:18px}
  #petgrow-fast-shell .pgfs-status{text-align:center;color:#6b786f;font-size:12px;font-weight:650;margin:18px 0 0}
  @keyframes pgfs-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
  @media(max-width:720px){#petgrow-fast-shell{padding:12px 12px 24px}#petgrow-fast-shell .pgfs-head{height:50px;margin-bottom:12px}#petgrow-fast-shell .pgfs-hero{padding:18px;border-radius:18px}#petgrow-fast-shell .pgfs-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#petgrow-fast-shell .pgfs-card{height:96px;border-radius:16px}}
  @media(prefers-reduced-motion:reduce){#petgrow-fast-shell .pgfs-line{animation:none}}
`;
document.head.appendChild(style);

if (root) {
  root.innerHTML = `
    <div id="petgrow-fast-shell" role="status" aria-live="polite" aria-label="PetGrow 화면 준비 중">
      <div class="pgfs-wrap">
        <div class="pgfs-head">
          <div class="pgfs-brand"><img src="/icon-192.png" alt="" width="38" height="38"><span>PetGrow</span></div>
          <div class="pgfs-chip"></div>
        </div>
        <div class="pgfs-hero"><div class="pgfs-line a"></div><div class="pgfs-line b"></div></div>
        <div class="pgfs-grid">
          <div class="pgfs-card"><div class="pgfs-line"></div><div class="pgfs-line"></div></div>
          <div class="pgfs-card"><div class="pgfs-line"></div><div class="pgfs-line"></div></div>
          <div class="pgfs-card"><div class="pgfs-line"></div><div class="pgfs-line"></div></div>
          <div class="pgfs-card"><div class="pgfs-line"></div><div class="pgfs-line"></div></div>
        </div>
        <p class="pgfs-status">우리 아이 화면을 준비하고 있어요</p>
      </div>
    </div>`;
}

/* Skip the old forced 1.15s splash hold and avoid creating an AudioContext during startup. */
window.__petgrowSplashSoundPlayed = true;
const splash = document.getElementById("petgrow-initial-splash");
if (splash) {
  splash.classList.add("petgrow-splash--hide");
  setTimeout(() => splash.remove(), 220);
}

/* Start downloading the full app immediately while the lightweight shell is already paintable. */
import("./app-entry.jsx").catch(() => {
  const status = document.querySelector("#petgrow-fast-shell .pgfs-status");
  if (status) status.textContent = "화면을 불러오지 못했어요. 새로고침해 주세요.";
});
