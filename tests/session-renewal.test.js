import test from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession, getSessionUserId, createSessionCookies, clearSessionCookies, renewSessionIfNeeded } from '../server_lib/session.js';
import { SESSION_MAX_AGE } from '../server_lib/config.js';
import { createSessionChecker } from '../src/session-checker.js';
process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters';
const req = (host = 'www.petgrow.co.kr', cookie = '') => ({ headers: { host, cookie } });
const response = (status, account = { id: 'user' }) => ({ status, ok: status === 200, json: async () => account });
const checker = (responses, saved) => createSessionChecker({ fetcher: async () => { const item = responses.shift(); if (item instanceof Error) throw item; return item; }, cacheAccount: account => saved.push(account), delay: async () => {} });

test('production cookie covers both addresses; preview and localhost stay host-only', () => {
  for (const host of ['petgrow.co.kr', 'www.petgrow.co.kr']) {
    const cookies = createSessionCookies(req(host), 'user');
    assert.match(cookies[0], /^pg_session_shared=/);
    assert.match(cookies[0], /Domain=petgrow.co.kr/);
    assert.match(cookies[0], /HttpOnly; Secure; SameSite=Lax/);
    assert.match(cookies[0], new RegExp(`Max-Age=${SESSION_MAX_AGE}`));
    assert.equal(verifySession(cookies[0].split(';')[0].split('=')[1]).uid, 'user');
  }
  for (const host of ['preview.vercel.app', 'localhost:5173', 'petgrow.co.kr.evil.test']) assert.doesNotMatch(createSessionCookies(req(host), 'user').join(''), /Domain=/);
});
test('legacy session migrates without login and shared session wins over old host cookies', () => {
  const legacy = signSession({ uid: 'old' });
  const shared = signSession({ uid: 'new' });
  assert.equal(getSessionUserId(req(undefined, `pg_session=${legacy}`)), 'old');
  assert.equal(getSessionUserId(req(undefined, `pg_session_shared=${shared}; pg_session=${legacy}`)), 'new');
  assert.equal(getSessionUserId(req(undefined, `pg_session_shared=invalid; pg_session=${legacy}`)), null);
  let cookies;
  renewSessionIfNeeded(req(undefined, `pg_session=${legacy}`), { setHeader: (key, value) => { cookies = value; } }, verifySession(legacy));
  assert.match(cookies[0], /^pg_session_shared=/);
});
test('active sessions renew after a day, fresh and expired sessions do not renew', () => {
  const current = verifySession(signSession({ uid: 'user' }));
  const request = req(undefined, 'pg_session_shared=present');
  let calls = 0;
  const res = { setHeader: () => calls++ };
  renewSessionIfNeeded(request, res, current);
  assert.equal(calls, 0);
  renewSessionIfNeeded(request, res, { ...current, iat: current.iat - 86401 });
  assert.equal(calls, 1);
  renewSessionIfNeeded(request, res, { ...current, exp: 1 });
  assert.equal(calls, 1);
});
test('logout clears host and shared cookies; invalid signatures cannot authenticate', () => {
  const cookies = clearSessionCookies(req());
  assert.ok(cookies.some(cookie => cookie.startsWith('pg_session_shared=') && cookie.includes('Domain=petgrow.co.kr')));
  assert.ok(cookies.some(cookie => cookie.startsWith('pg_session=') && !cookie.includes('Domain=')));
  assert.ok(cookies.every(cookie => cookie.includes('Max-Age=0')));
  const token = signSession({ uid: 'user' });
  assert.equal(verifySession(token + 'corrupt'), null);
  const secret = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;
  assert.throws(() => verifySession(token), /SESSION_SECRET/);
  process.env.SESSION_SECRET = secret;
});
test('a transient 401 recovers and two confirmed 401 responses end login', async () => {
  const saved = [];
  assert.deepEqual(await checker([response(401), response(200)], saved).check(), { id: 'user' });
  assert.deepEqual(saved, [{ id: 'user' }]);
  assert.equal(await checker([response(401), response(401)], saved).check(), null);
  assert.equal(saved.at(-1), null);
});
test('timeouts, 5xx and unconfirmed 401 do not erase the cached login', async () => {
  for (const responses of [[new Error('offline'), response(500)], [response(401), response(503)], [response(200, {}), response(500)]]) {
    const saved = [];
    assert.equal(await checker(responses, saved).check(), undefined);
    assert.deepEqual(saved, []);
  }
});
test('concurrent checks share one request; a late response cannot restore login during logout', async () => {
  let resolve;
  let calls = 0;
  const saved = [];
  const session = createSessionChecker({ fetcher: () => { calls++; return new Promise(done => { resolve = done; }); }, cacheAccount: account => saved.push(account) });
  const first = session.check();
  assert.equal(session.check(), first);
  assert.equal(calls, 1);
  const stop = session.suspend();
  resolve(response(200));
  await stop;
  assert.equal(await first, undefined);
  assert.deepEqual(saved, []);
  assert.equal(await session.check(), undefined);
  session.resume();
  const next = session.check();
  resolve(response(200));
  assert.deepEqual(await next, { id: 'user' });
});

test('account endpoint renews only after confirming the user still exists', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../api/core.js', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('async function handleMe('), source.indexOf('\nasync function handleState('));
  const payload = verifySession(signSession({ uid: 'user' }));
  const run = new Function('getSessionPayload', 'getUserById', 'isAdminUserId', 'renewSessionIfNeeded', `${body}; return handleMe;`);
  for (const user of [null, { id: 'user', nickname: 'member' }]) {
    let renewed = 0;
    const handler = run(() => payload, async () => user, async () => false, () => { renewed++; });
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; } };
    await handler(req(), res);
    assert.equal(res.code, user ? 200 : 401);
    assert.equal(renewed, user ? 1 : 0);
    assert.equal(res.headers['Cache-Control'], 'no-store, max-age=0');
  }
});

test('OAuth begun on the bare domain moves to callback host before creating state', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../api/auth/kakao/login.js', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export default async function handler')).replace('export default ', '');
  let calls = 0;
  const handler = new Function('BASE_URL', 'OAUTH_STATE_COOKIE', 'createOAuthState', `${body}; return handler;`)('https://www.petgrow.co.kr', 'pg_oauth_state', async () => { calls++; return 'state'; });
  const res = { setHeader() {}, writeHead(code, headers) { this.code = code; this.location = headers.Location; }, end() {} };
  await handler({ headers: { host: 'petgrow.co.kr' }, query: { client: 'android', switch: '1' } }, res);
  assert.equal(calls, 0);
  assert.equal(res.code, 302);
  assert.equal(res.location, 'https://www.petgrow.co.kr/api/auth/kakao/login?client=android&switch=1');
});
