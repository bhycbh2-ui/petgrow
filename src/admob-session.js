// One UMP/Mobile Ads session shared by every native ad format.
export function createAdMobSession(getApi, onChange = () => {}, now = Date.now) {
  let consentFlight = null;
  let initializationFlight = null;
  let privacyFlight = null;
  let initialized = false;
  let retryAt = 0;
  let state = { ready: false, status: "UNKNOWN", privacyOptionsRequired: false, error: null };

  function publish(info, error = null) {
    const status = String(info?.status || "UNKNOWN").toUpperCase();
    state = {
      // Older installed plugins do not return canRequestAds. An explicit false
      // from newer UMP versions must always take precedence over status.
      ready: typeof info?.canRequestAds === "boolean"
        ? info.canRequestAds : status === "OBTAINED" || status === "NOT_REQUIRED",
      status,
      privacyOptionsRequired: info?.privacyOptionsRequirementStatus
        ? info.privacyOptionsRequirementStatus === "REQUIRED" : state.privacyOptionsRequired,
      error: error ? String(error.message || error).slice(0, 240) : null,
    };
    onChange({ ...state });
    return state.ready;
  }

  async function ensureConsent() {
    if (privacyFlight) return false;
    if (state.ready) return true;
    if (consentFlight) return consentFlight;
    if (now() < retryAt) return false;
    consentFlight = (async () => {
      try {
        const api = await getApi();
        if (!api) return false;
        let info = await api.AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false });
        if (info?.status === "REQUIRED") info = await api.AdMob.showConsentForm();
        const ready = publish(info);
        retryAt = ready ? 0 : now() + 30000;
        return ready;
      } catch (error) {
        retryAt = now() + 30000;
        return publish(null, error);
      } finally { consentFlight = null; }
    })();
    return consentFlight;
  }

  async function initialize() {
    if (!(await ensureConsent())) return false;
    if (initialized) return true;
    if (initializationFlight) return initializationFlight;
    initializationFlight = (async () => {
      try {
        const api = await getApi();
        if (!api || privacyFlight || !state.ready) return false;
        await api.AdMob.initialize({ initializeForTesting: false, testingDevices: [] });
        initialized = true;
        return state.ready && !privacyFlight;
      } finally { initializationFlight = null; }
    })();
    return initializationFlight;
  }

  async function requestPrivacyChoices() {
    if (privacyFlight) return privacyFlight;
    if (consentFlight) await consentFlight;
    if (privacyFlight) return privacyFlight;
    privacyFlight = (async () => {
      try {
        const api = await getApi();
        if (!api) return false;
        publish(null);
        let info = await api.AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false });
        if (info?.privacyOptionsRequirementStatus === "REQUIRED") {
          // resetConsentInfo is a testing API, not a production privacy control.
          await api.AdMob.showPrivacyOptionsForm();
          info = await api.AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false });
        } else if (info?.status === "REQUIRED") {
          info = await api.AdMob.showConsentForm();
        }
        retryAt = 0;
        publish(info);
        // Saving privacy choices succeeds even when those choices disallow ads.
        return true;
      } catch (error) {
        retryAt = now() + 30000;
        return publish(null, error);
      } finally { privacyFlight = null; }
    })();
    return privacyFlight;
  }

  return { ensureConsent, initialize, requestPrivacyChoices, getStatus: () => ({ ...state, initialized, retryAt }) };
}
