export const AUTH_ACCOUNT_CACHE_KEY = "petgrow:auth-account:v1";
export const AUTH_SIGNED_OUT_KEY = "petgrow:auth-signed-out:v1";

export function readCachedAccount(browser = window) {
  try {
    if (browser.localStorage.getItem(AUTH_SIGNED_OUT_KEY)
      || new URLSearchParams(browser.location.search).get("login") === "success") return null;
    const raw = browser.localStorage.getItem(AUTH_ACCOUNT_CACHE_KEY)
      || browser.sessionStorage.getItem(AUTH_ACCOUNT_CACHE_KEY);
    const account = JSON.parse(raw || "null");
    return account?.id ? account : null;
  } catch { return null; }
}

export function cacheAccount(account, browser = window) {
  // A persistent sign-out marker also prevents another tab's sessionStorage restoring an old profile.
  if (account?.id) {
    try {
      browser.localStorage.removeItem(AUTH_SIGNED_OUT_KEY);
      browser.localStorage.setItem(AUTH_ACCOUNT_CACHE_KEY, JSON.stringify(account));
    } catch {}
    try { browser.sessionStorage.setItem(AUTH_ACCOUNT_CACHE_KEY, JSON.stringify(account)); } catch {}
  } else {
    try {
      browser.localStorage.setItem(AUTH_SIGNED_OUT_KEY, "1");
      browser.localStorage.removeItem(AUTH_ACCOUNT_CACHE_KEY);
    } catch {}
    try { browser.sessionStorage.removeItem(AUTH_ACCOUNT_CACHE_KEY); } catch {}
  }
}

export function kakaoLoginPath({ switchAccount = false, android = false } = {}, browser = window) {
  const params = new URLSearchParams();
  if (android) params.set("client", "android");
  let signedOut = false;
  try { signedOut = !!browser.localStorage.getItem(AUTH_SIGNED_OUT_KEY); } catch {}
  if (switchAccount || signedOut) params.set("switch", "1");
  return `/api/auth/kakao/login${params.size ? `?${params}` : ""}`;
}

export function clearAccountBrowserData({ withdrawn = false } = {}, browser = window) {
  const keys = ["petgrow_home_pet_snapshot_session_v1", "petgrow_petlife_dashboard_pet_v1",
    "petgrow_petlife_legacy_import_v2", "petgrow_admin_token"];
  if (withdrawn) keys.push("bboggl:dogs", "bboggl:cats", "bboggl:activeIds", "bboggl:photos",
    "bboggl:profile", "bboggl:records", "bboggl:dogs:guest", "bboggl:cats:guest", "bboggl:activeIds:guest");
  for (const key of keys) {
    try { browser.localStorage.removeItem(key); } catch {}
    try { browser.sessionStorage.removeItem(key); } catch {}
  }
}
