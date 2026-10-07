const KEYS = ['bboggl:dogs', 'bboggl:cats', 'bboggl:activeIds'];

export async function loadPetState({ fetcher = fetch, readShadow = () => null, timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`/api/state?keys=${encodeURIComponent(KEYS.join(','))}`, {
      credentials: 'include', cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) throw new Error('pet_state_unavailable');
    const payload = await response.json();
    if (!payload.values || !KEYS.every(key => Object.hasOwn(payload.values, key))) throw new Error('invalid_pet_state');
    const values = payload.values;
    const list = key => {
      const server = values[key];
      const shadow = readShadow(key);
      if (server !== null && !Array.isArray(server)) throw new Error('invalid_pet_list');
      // Preserve the account's existing safety copy after an interrupted save.
      return Array.isArray(shadow) && shadow.length > (server?.length || 0) ? shadow : server || [];
    };
    return { dogs: list(KEYS[0]), cats: list(KEYS[1]), actives: values[KEYS[2]] || readShadow(KEYS[2]) || {} };
  } finally { clearTimeout(timer); }
}

export function petViewStatus({ authResolved, authError = false, accountId, load }) {
  if (authError) return 'error';
  if (!authResolved) return 'loading';
  if (!accountId) return 'ready';
  return load.accountId === accountId ? load.status : 'loading';
}
