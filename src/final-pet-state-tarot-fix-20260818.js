/* PetGrow final pet-state recovery — 2026-08-18 */
(() => {
  const STATE_KEYS = new Set(['bboggl:dogs','bboggl:cats','bboggl:activeIds']);
  const RECOVERY_KEY = '__pgPetStateRecoveryOnceV1';
  const startedAt = Date.now();

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const text = (el) => (el?.textContent || '').trim();

  /*
   * App marks its general shell as loaded immediately after auth, then fills pet state
   * asynchronously. If /api/state has a short transient failure, feature pages can look
   * permanently empty. Retry pet-state GETs before App decides there are no pets.
   */
  if (!window.__pgPetStateFetchRetryV1) {
    window.__pgPetStateFetchRetryV1 = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function(input, init = {}) {
      const url = typeof input === 'string' ? input : (input?.url || '');
      const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();
      let stateKey = '';
      try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.pathname === '/api/state') stateKey = parsed.searchParams.get('key') || '';
      } catch {}

      if (method !== 'GET' || !STATE_KEYS.has(stateKey)) {
        return nativeFetch(input, init);
      }

      let lastResponse;
      let lastError;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await nativeFetch(input, init);
          lastResponse = response;
          if (response.ok) {
            try {
              const json = await response.clone().json();
              /* null/undefined is treated as unresolved once or twice; an actual [] is valid. */
              if (json && Object.prototype.hasOwnProperty.call(json, 'value') && json.value != null) {
                return response;
              }
            } catch {
              return response;
            }
          }
        } catch (error) {
          lastError = error;
        }
        if (attempt < 2) await wait(180 + attempt * 220);
      }
      if (lastResponse) return lastResponse;
      throw lastError || new Error('pet state request failed');
    };
  }

  function featurePages() {
    return [...document.querySelectorAll('.feature-page-saju,.feature-page-tarot,.feature-page-petbti')];
  }

  function petButtons(page) {
    return [...page.querySelectorAll(':scope > .feature-pet-picker button, .feature-pet-picker button')]
      .filter((button) => text(button));
  }

  function falseEmptyCards(page) {
    return [...page.querySelectorAll('.feature-empty-wrap,.feature-empty-card')]
      .filter((el) => /등록된 아이가 아직 없어요|먼저 반려동물을 등록|register a pet first/i.test(text(el)));
  }

  function ensureLoading(page) {
    if (page.querySelector('.pg-pet-state-loading')) return;
    const node = document.createElement('div');
    node.className = 'pg-pet-state-loading';
    node.textContent = '저장된 우리 아이 정보를 확인하는 중이에요.';
    const picker = page.querySelector(':scope > .feature-pet-picker');
    if (picker?.nextSibling) page.insertBefore(node, picker.nextSibling);
    else page.appendChild(node);
  }

  function clearLoading(page) {
    page.classList.remove('pg-pet-state-checking');
    page.querySelector('.pg-pet-state-loading')?.remove();
  }

  async function readServerPets() {
    for (const key of ['bboggl:dogs','bboggl:cats']) {
      try {
        const response = await fetch(`/api/state?key=${encodeURIComponent(key)}`, { credentials: 'include' });
        if (!response.ok) continue;
        const json = await response.json();
        if (Array.isArray(json?.value) && json.value.length > 0) return true;
      } catch {}
    }
    return false;
  }

  let serverCheckPromise = null;
  function serverHasPets() {
    if (!serverCheckPromise) serverCheckPromise = readServerPets();
    return serverCheckPromise;
  }

  async function recoverFalsePetPrompt(page) {
    const empties = falseEmptyCards(page);
    if (!empties.length) {
      if (petButtons(page).length) {
        clearLoading(page);
        try { sessionStorage.removeItem(RECOVERY_KEY); } catch {}
      }
      return;
    }

    const buttons = petButtons(page);
    if (buttons.length) {
      /* Registered pets are already rendered: the empty card is stale/transient. */
      page.classList.add('pg-pet-state-checking');
      ensureLoading(page);
      empties.forEach((el) => el.style.setProperty('display','none','important'));
      const active = buttons.find((b) => b.matches('.active,[aria-pressed="true"]')) || buttons[0];
      if (active && active.dataset.pgPetReselect !== '1') {
        active.dataset.pgPetReselect = '1';
        setTimeout(() => { try { active.click(); } catch {} }, 20);
      }
      setTimeout(() => clearLoading(page), 500);
      return;
    }

    /* Never flash “register a pet” during the initial async state window. */
    if (Date.now() - startedAt < 2400) {
      page.classList.add('pg-pet-state-checking');
      ensureLoading(page);
      return;
    }

    const saved = await serverHasPets();
    if (!saved) {
      clearLoading(page);
      return;
    }

    /* Server definitely has pets but React did not receive them. Retry one clean load only. */
    page.classList.add('pg-pet-state-checking');
    ensureLoading(page);
    let already = false;
    try { already = sessionStorage.getItem(RECOVERY_KEY) === '1'; } catch {}
    if (!already) {
      try { sessionStorage.setItem(RECOVERY_KEY, '1'); } catch {}
      setTimeout(() => window.location.reload(), 450);
    } else {
      /* Avoid reload loops; keep the real state message visible after one recovery attempt. */
      setTimeout(() => clearLoading(page), 900);
    }
  }

  /* Defensive cleanup: older runtime revisions may have injected more than one Tarot pet head. */
  function cleanTarotDuplicates() {
    document.querySelectorAll('.feature-page-tarot').forEach((page) => {
      const heads = [...page.querySelectorAll('.pg-tarot-pet-head')];
      heads.slice(1).forEach((head) => head.remove());
    });
  }

  let raf = 0;
  function run() {
    cleanTarotDuplicates();
    featurePages().forEach((page) => recoverFalsePetPrompt(page).catch(() => {}));
  }
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; run(); });
  }

  function boot() {
    run();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { subtree: true, childList: true });
    setTimeout(run, 500);
    setTimeout(run, 1500);
    setTimeout(run, 2800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
