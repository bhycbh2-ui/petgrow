/* PetGrow boot: never leave users trapped behind the splash screen. */
window.__petgrowSplashSoundPlayed = true;

const BOOT_RECOVERY_PARAM = "pg_boot_recover";
const BOOT_RECOVERY_KEY = "petgrow_boot_recovery_v4";
const EXTERNAL_RETURN_KEY = "petgrow_external_return_v1";
const EXTERNAL_RETURN_MAX_AGE_MS = 3 * 60 * 1000;
const bootStartedAt = performance.now();
const root = document.getElementById("root");
let bootFinished = false;
let recoveryStarted = false;

function hasRenderedApp() {
  return Boolean(root && (root.firstElementChild || String(root.textContent || "").trim()));
}

function hasAuthReturnParams() {
  const value = `${location.search || ""}&${location.hash || ""}`;
  return /(?:^|[?&#])(code|state|access_token|refresh_token|error|error_description)=/i.test(value);
}

function markExternalReturnHint() {
  try { sessionStorage.setItem(EXTERNAL_RETURN_KEY, String(Date.now())); } catch {}
}

function hasRecentExternalReturnHint() {
  try {
    const stamp = Number(sessionStorage.getItem(EXTERNAL_RETURN_KEY) || 0);
    if (!Number.isFinite(stamp) || stamp <= 0) return false;
    const age = Date.now() - stamp;
    return age >= 0 && age < EXTERNAL_RETURN_MAX_AGE_MS;
  } catch {
    return false;
  }
}

function clearExternalReturnHint() {
  try { sessionStorage.removeItem(EXTERNAL_RETURN_KEY); } catch {}
}

function hardHideSplash() {
  const splash = document.getElementById("petgrow-initial-splash");
  if (!splash) return;
  const bar = splash.querySelector(".petgrow-splash__progress-bar");
  if (bar) {
    bar.style.animation = "none";
    bar.style.transition = "width 60ms ease-out";
    bar.style.width = "100%";
  }
  splash.style.transition = "opacity 90ms ease, visibility 90ms ease";
  splash.style.opacity = "0";
  splash.style.visibility = "hidden";
  splash.style.pointerEvents = "none";
  window.setTimeout(() => splash.remove(), 110);
}

window.__petgrowForceHideSplash = hardHideSplash;

function releaseSplashAfterExternalReturn() {
  const returning = hasRecentExternalReturnHint() || hasAuthReturnParams();
  if (!returning && !hasRenderedApp()) return;
  hardHideSplash();
  if (hasRenderedApp()) clearExternalReturnHint();
}

// Kakao/other external authentication can background the browser or Android WebView.
// Remember that transition and never show the launch splash again when the user returns.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    markExternalReturnHint();
    return;
  }
  window.setTimeout(releaseSplashAfterExternalReturn, 0);
});
window.addEventListener("pageshow", () => window.setTimeout(releaseSplashAfterExternalReturn, 0));
window.addEventListener("focus", () => window.setTimeout(releaseSplashAfterExternalReturn, 0));

// A full OAuth callback reload keeps sessionStorage in the same tab/WebView. In that case
// remove the repeated launch splash quickly instead of making the user watch it twice.
if (hasRecentExternalReturnHint() || hasAuthReturnParams()) {
  window.setTimeout(hardHideSplash, 360);
}

function hideWhenReady() {
  if (!hasRenderedApp()) return false;
  // Keep the welcome motion visible long enough to read as a deliberate greeting,
  // while external-auth returns above still bypass it immediately.
  const minimumVisibleMs = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? 1450 : 1250;
  const elapsed = performance.now() - bootStartedAt;
  if (elapsed < minimumVisibleMs) {
    window.setTimeout(hardHideSplash, minimumVisibleMs - elapsed);
  } else {
    hardHideSplash();
  }
  return true;
}

const renderObserver = new MutationObserver(() => {
  if (hideWhenReady()) renderObserver.disconnect();
});
if (root) renderObserver.observe(root, { childList: true, subtree: true });

async function clearStaleWebState() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map(registration => registration.unregister()));
    }
  } catch {}
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.allSettled(names.map(name => caches.delete(name)));
    }
  } catch {}
}

function showRecoveryScreen(error) {
  console.error("[PetGrow] boot failed after recovery", error);
  hardHideSplash();
  if (!root) return;
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#f8faf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;color:#19392e">
      <section style="width:min(92vw,420px);padding:30px 24px;border-radius:24px;background:#fff;box-shadow:0 14px 40px rgba(25,57,46,.10);text-align:center">
        <img src="/petgrow-brand-source.svg?v=20260822b" alt="PetGrow" width="78" height="78" style="border-radius:20px" />
        <h1 style="margin:18px 0 8px;font-size:24px">PetGrow를 다시 불러올게요</h1>
        <p style="margin:0 0 10px;color:#6e7f76;font-size:14px;line-height:1.6">PetGrow를 불러오는 중 오류가 발생했습니다.</p>
        <p id="petgrow-boot-error" style="margin:0 0 20px;color:#8a9690;font-size:11px;line-height:1.5;word-break:break-word"></p>
        <button id="petgrow-boot-retry" type="button" style="width:100%;border:0;border-radius:14px;padding:14px 16px;background:#176b47;color:#fff;font-size:15px;font-weight:700;cursor:pointer">다시 불러오기</button>
      </section>
    </main>`;
  const errorEl = document.getElementById("petgrow-boot-error");
  if (errorEl) {
    const name = String(error?.name || "Error");
    const message = String(error?.message || "알 수 없는 오류");
    errorEl.textContent = `오류 정보: ${name}: ${message}`.slice(0, 220);
  }
  document.getElementById("petgrow-boot-retry")?.addEventListener("click", async () => {
    try { sessionStorage.removeItem(BOOT_RECOVERY_KEY); } catch {}
    await clearStaleWebState();
    const next = new URL(location.href);
    next.searchParams.delete(BOOT_RECOVERY_PARAM);
    next.searchParams.set("pg_refresh", String(Date.now()));
    location.replace(next.toString());
  });
}

async function recoverBoot(error) {
  if (recoveryStarted) return;
  recoveryStarted = true;
  const url = new URL(location.href);
  let alreadyRecovered = url.searchParams.get(BOOT_RECOVERY_PARAM) === "1";
  try { alreadyRecovered = alreadyRecovered || sessionStorage.getItem(BOOT_RECOVERY_KEY) === "1"; } catch {}

  if (!alreadyRecovered) {
    try { sessionStorage.setItem(BOOT_RECOVERY_KEY, "1"); } catch {}
    const message = document.querySelector(".petgrow-splash__status,.pg-premium-message");
    if (message) message.textContent = "최신 화면으로 다시 연결하고 있어요";
    try { window.__petgrowSetSplashProgress?.(96); } catch {}
    await clearStaleWebState();
    url.searchParams.set(BOOT_RECOVERY_PARAM, "1");
    url.searchParams.set("pg_refresh", String(Date.now()));
    location.replace(url.toString());
    return;
  }

  showRecoveryScreen(error);
}

async function boot() {
  try {
    await import("./app-entry.jsx");
    bootFinished = true;
    try { sessionStorage.removeItem(BOOT_RECOVERY_KEY); } catch {}
    if (location.search.includes(`${BOOT_RECOVERY_PARAM}=`)) {
      const clean = new URL(location.href);
      clean.searchParams.delete(BOOT_RECOVERY_PARAM);
      clean.searchParams.delete("pg_refresh");
      history.replaceState(null, "", clean.pathname + clean.search + clean.hash);
    }
    hideWhenReady();
    releaseSplashAfterExternalReturn();
  } catch (error) {
    console.error("[PetGrow] app entry import failed", error);
    await recoverBoot(error);
  }
}

boot();

// Safety net: a rendered app must never remain covered by the splash.
window.setTimeout(() => {
  if (hasRenderedApp()) {
    hardHideSplash();
    renderObserver.disconnect();
  }
}, 1900);

// If the entry module hangs rather than rejects, trigger the same one-time recovery.
window.setTimeout(() => {
  if (!bootFinished && !hasRenderedApp()) recoverBoot(new Error("PetGrow boot timeout"));
}, 5500);
