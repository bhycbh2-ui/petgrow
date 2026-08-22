import { Capacitor } from "@capacitor/core";
import { AdMob, AdmobConsentStatus } from "@capacitor-community/admob";

const isNativeAndroid = () => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
};

const STATE_KEY = "petgrow:admob-consent-state";
let bootPromise = null;

function saveState(state) {
  window.__petgrowAdMobConsent = state;
  try { localStorage.setItem(STATE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() })); } catch {}
  window.dispatchEvent(new CustomEvent("petgrow:admob-consent", { detail: state }));
}

async function requestConsent({ reset = false } = {}) {
  if (!isNativeAndroid()) return { ready: false, reason: "not-native-android" };

  try {
    if (reset) await AdMob.resetConsentInfo();

    const info = await AdMob.requestConsentInfo();
    let status = info?.status || AdmobConsentStatus.UNKNOWN;

    if (status === AdmobConsentStatus.REQUIRED && info?.isConsentFormAvailable) {
      const result = await AdMob.showConsentForm();
      status = result?.status || status;
    }

    const canRequestAds = status === AdmobConsentStatus.OBTAINED || status === AdmobConsentStatus.NOT_REQUIRED;
    const state = {
      ready: canRequestAds,
      status,
      formAvailable: Boolean(info?.isConsentFormAvailable),
      platform: "android",
    };
    saveState(state);
    return state;
  } catch (error) {
    const state = {
      ready: false,
      status: "ERROR",
      platform: "android",
      message: String(error?.message || error || "consent-error").slice(0, 240),
    };
    saveState(state);
    return state;
  }
}

function installPrivacyControl() {
  if (!isNativeAndroid() || document.getElementById("petgrow-ad-privacy-control")) return;
  const box = document.createElement("aside");
  box.id = "petgrow-ad-privacy-control";
  box.setAttribute("aria-label", "광고 개인정보 설정");
  box.innerHTML = `
    <button type="button" id="petgrow-ad-privacy-button">광고 개인정보 설정</button>
    <span>맞춤형 광고·동의 선택을 다시 확인할 수 있어요.</span>
  `;
  box.querySelector("button")?.addEventListener("click", async () => {
    const btn = box.querySelector("button");
    if (btn) { btn.disabled = true; btn.textContent = "설정 불러오는 중…"; }
    try { await requestConsent({ reset: true }); }
    finally { if (btn) { btn.disabled = false; btn.textContent = "광고 개인정보 설정"; } }
  });
  document.body.appendChild(box);
}

export async function bootAdMobReadiness() {
  if (!isNativeAndroid()) return { ready: false, reason: "not-native-android" };
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    try {
      // 광고 SDK를 먼저 초기화한 뒤 UMP 동의 상태를 갱신합니다.
      // 실제 광고 요청은 동의 상태가 OBTAINED/NOT_REQUIRED일 때만 별도 광고 모듈에서 수행해야 합니다.
      await AdMob.initialize({ initializeForTesting: false });
      const state = await requestConsent();
      installPrivacyControl();
      return state;
    } catch (error) {
      const state = { ready: false, status: "ERROR", message: String(error?.message || error || "admob-init-error").slice(0, 240) };
      saveState(state);
      installPrivacyControl();
      return state;
    }
  })();

  return bootPromise;
}

window.petgrowRefreshAdConsent = () => requestConsent({ reset: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (isNativeAndroid()) bootAdMobReadiness();
  }, { once: true });
} else if (isNativeAndroid()) {
  bootAdMobReadiness();
}
