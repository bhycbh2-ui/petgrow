import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPetState, petViewStatus } from '../src/pet-state-loader.js';

const response = values => ({ ok: true, json: async () => ({ values }) });
const values = (dogs = [], cats = [], actives = {}) => ({ 'bboggl:dogs': dogs, 'bboggl:cats': cats, 'bboggl:activeIds': actives });

test('delayed pet retrieval stays loading until the saved profile arrives', async () => {
  let complete;
  let load = { accountId: 'member', status: 'loading' };
  const state = () => petViewStatus({ authResolved: true, accountId: 'member', load });
  const request = loadPetState({ fetcher: () => new Promise(resolve => { complete = resolve; }) });
  assert.equal(state(), 'loading');
  await Promise.resolve();
  assert.equal(state(), 'loading');
  complete(response(values([{ id: 'dog', profile: { name: '하루' } }])));
  const result = await request;
  load = { accountId: 'member', status: 'ready' };
  assert.equal(state(), 'ready');
  assert.equal(result.dogs[0].profile.name, '하루');
});

test('pets and selection arrive in one uncached, authenticated request', async () => {
  const calls = [];
  const result = await loadPetState({ fetcher: async (url, options) => {
    calls.push({ url, options });
    return response(values([{ id: 'd' }], [{ id: 'c' }], { dog: 'd', cat: 'c' }));
  } });
  assert.equal(calls.length, 1);
  assert.deepEqual(new URL(calls[0].url, 'https://www.petgrow.co.kr').searchParams.get('keys').split(','), Object.keys(values()));
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.credentials, 'include');
  assert.deepEqual(result.actives, { dog: 'd', cat: 'c' });
});

test('network, HTTP, malformed and incomplete responses never become an empty registered-pet state', async () => {
  for (const fetcher of [async () => { throw new Error('offline'); }, async () => ({ ok: false }),
    async () => response({}), async () => response(values('invalid'))]) {
    await assert.rejects(loadPetState({ fetcher }));
  }
});

test('a successful account with no pets is an actual empty state', async () => {
  assert.deepEqual(await loadPetState({ fetcher: async () => response(values(null, null, null)) }), { dogs: [], cats: [], actives: {} });
});

test('account changes hide previous-account readiness and errors', () => {
  for (const status of ['ready', 'error']) assert.equal(petViewStatus({ authResolved: true, accountId: 'new', load: { accountId: 'old', status } }), 'loading');
  assert.equal(petViewStatus({ authResolved: true, accountId: 'new', load: { accountId: 'new', status: 'error' } }), 'error');
});

test('boot release cannot turn an unresolved login into registration guidance', () => {
  assert.equal(petViewStatus({ authResolved: false, accountId: null, load: { status: 'ready' } }), 'loading');
  assert.equal(petViewStatus({ authResolved: false, accountId: 'cached', load: { accountId: 'cached', status: 'ready' } }), 'loading');
  assert.equal(petViewStatus({ authResolved: true, accountId: null, load: { status: 'ready' } }), 'ready');
  assert.equal(petViewStatus({ authResolved: true, authError: true, accountId: null, load: { status: 'ready' } }), 'error');
});

test('an interrupted save retains only the safety copy selected for this account', async () => {
  const dog = { id: 'recent-dog' };
  const result = await loadPetState({ fetcher: async () => response(values()), readShadow: key => key === 'bboggl:dogs' ? [dog] : null });
  assert.deepEqual(result.dogs, [dog]);
});

test('timeout is surfaced as a failed load instead of no pets', async () => {
  await assert.rejects(loadPetState({ timeoutMs: 10, fetcher: (_url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) }), /aborted/);
});
