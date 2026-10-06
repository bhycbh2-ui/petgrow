// Cached profile data never authorizes API access. The HttpOnly cookie remains authoritative.
export function createSessionChecker({ fetcher, cacheAccount, delay = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  let inFlight = null;
  let generation = 0;
  let suspended = false;
  let activeController = null;
  const check = (timeoutMs = 16000) => {
    if (suspended) return Promise.resolve(undefined);
    if (inFlight) return inFlight;
    const started = generation;
    const task = (async () => {
      let unauthorized = 0;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        activeController = controller;
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetcher('/api/me', { credentials: 'include', signal: controller.signal, cache: 'no-store' });
          if (generation !== started || suspended) return undefined;
          if (res.status === 401) {
            unauthorized++;
            if (unauthorized === 2) { cacheAccount(null); return null; }
          } else {
            if (!res.ok) throw new Error(`me_${res.status}`);
            const account = await res.json();
            if (generation !== started || suspended) return undefined;
            if (!account?.id) throw new Error('invalid_account');
            cacheAccount(account);
            return account;
          }
        } catch {
          if (generation !== started || suspended) return undefined;
        } finally { clearTimeout(timer); }
        if (attempt === 0) await delay(300);
        if (generation !== started || suspended) return undefined;
      }
      // Network/5xx failures and an unconfirmed 401 leave the UI state intact.
      return undefined;
    })();
    const wrapped = task.finally(() => { if (inFlight === wrapped) { inFlight = null; activeController = null; } });
    inFlight = wrapped;
    return wrapped;
  };
  return {
    check,
    async suspend() { suspended = true; generation++; activeController?.abort(); await inFlight; },
    resume() { suspended = false; },
  };
}
