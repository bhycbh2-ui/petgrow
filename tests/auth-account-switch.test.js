import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_ACCOUNT_CACHE_KEY, AUTH_SIGNED_OUT_KEY, readCachedAccount, cacheAccount, kakaoLoginPath, clearAccountBrowserData } from '../src/auth-browser.js';
import { createSessionChecker } from '../src/session-checker.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
const browser = (localStorage = storage()) => ({ localStorage, sessionStorage: storage(), location: { search: '' } });

test('sign-out prevents an old profile in another tab from restoring; verified new login replaces it', () => {
  const first = browser();
  const second = browser(first.localStorage);
  cacheAccount({ id: 'old-user' }, first);
  second.sessionStorage.setItem(AUTH_ACCOUNT_CACHE_KEY, JSON.stringify({ id: 'old-user' }));
  cacheAccount(null, first);
  assert.equal(readCachedAccount(second), null);
  assert.equal(kakaoLoginPath({}, second), '/api/auth/kakao/login?switch=1');
  cacheAccount({ id: 'new-user' }, second);
  assert.deepEqual(readCachedAccount(second), { id: 'new-user' });
  assert.equal(second.localStorage.getItem(AUTH_SIGNED_OUT_KEY), null);
});

test('callback waits for the actual server identity instead of the prior cached account', () => {
  const page = browser();
  cacheAccount({ id: 'old-user' }, page);
  page.location.search = '?login=success';
  assert.equal(readCachedAccount(page), null);
});

test('normal login remains convenient, and explicit switch works on web and Android', () => {
  const page = browser();
  assert.equal(kakaoLoginPath({}, page), '/api/auth/kakao/login');
  assert.equal(kakaoLoginPath({ switchAccount: true }, page), '/api/auth/kakao/login?switch=1');
  assert.equal(kakaoLoginPath({ switchAccount: true, android: true }, page), '/api/auth/kakao/login?client=android&switch=1');
});

test('account cleanup removes old pet and admin caches from both stores, keeping unrelated settings', () => {
  const page = browser();
  for (const store of [page.localStorage, page.sessionStorage]) {
    store.setItem('petgrow_home_pet_snapshot_session_v1', 'old pet');
    store.setItem('petgrow_admin_token', 'old token');
    store.setItem('bboggl:dogs', 'old dogs');
    store.setItem('bboggl:dogs:guest', 'guest');
    store.setItem('language', 'ko');
  }
  clearAccountBrowserData({ withdrawn: true }, page);
  for (const store of [page.localStorage, page.sessionStorage]) {
    for (const key of ['petgrow_home_pet_snapshot_session_v1', 'petgrow_admin_token', 'bboggl:dogs', 'bboggl:dogs:guest']) assert.equal(store.getItem(key), null);
    assert.equal(store.getItem('language'), 'ko');
  }
});

test('another-tab logout invalidates a pending session response before it can re-cache an account', async () => {
  let resolve;
  const cached = [];
  const checker = createSessionChecker({ fetcher: () => new Promise(done => { resolve = done; }), cacheAccount: account => cached.push(account) });
  const pending = checker.check();
  checker.invalidate();
  resolve({ status: 200, ok: true, json: async () => ({ account: { id: 'old-user' } }) });
  assert.equal(await pending, undefined);
  assert.deepEqual(cached, []);
});
