import test from 'node:test';
import assert from 'node:assert/strict';
import { saveDiaryEntry, persistDiaryChange } from '../src/pet-diary.js';

test('text-only entries preserve line breaks and editing preserves creation time', () => {
  const entries = saveDiaryEntry([], { id: 'one', date: '2026-10-06', text: ' 산책했어요\n잘 먹었어요 ' }, 'first');
  assert.equal(entries[0].text, '산책했어요\n잘 먹었어요');
  const edited = saveDiaryEntry(entries, { id: 'one', date: '2026-10-05', text: '수정' }, 'second');
  assert.equal(edited.length, 1);
  assert.equal(edited[0].createdAt, 'first');
  assert.equal(edited[0].updatedAt, 'second');
  assert.equal(entries[0].text, '산책했어요\n잘 먹었어요');
});
test('blank or oversized entries cannot be saved', () => {
  for (const text of ['  ', 'a'.repeat(1001)]) assert.throws(() => saveDiaryEntry([], { id: 'one', date: '2026-10-06', text }));
});
const pets = { dog: [{ id: 'dog', photos: [{ id: 'photo' }], records: [1] }], cat: [{ id: 'cat', diaryEntries: [{ id: 'old', text: 'hello' }] }, { id: 'other' }] };
test('saving selected cat uses cat storage and preserves dogs, photos and other pets', async () => {
  let key;
  const next = await persistDiaryChange({ pets, target: { id: 'cat', species: 'cat' }, species: 'dog', write: async (storageKey) => { key = storageKey; return true; }, change: entries => saveDiaryEntry(entries, { id: 'new', date: '2026-10-06', text: '일기' }) });
  assert.equal(key, 'bboggl:cats');
  assert.equal(next.dog, pets.dog);
  assert.equal(next.cat[1], pets.cat[1]);
  assert.equal(next.cat[0].diaryEntries.length, 2);
  assert.equal(pets.cat[0].diaryEntries.length, 1);
});
test('failed or throwing storage leaves existing records unchanged', async () => {
  const options = { pets, target: { id: 'dog' }, species: 'dog', change: () => [{ id: 'new' }] };
  assert.equal(await persistDiaryChange({ ...options, write: async () => false }), null);
  await assert.rejects(persistDiaryChange({ ...options, write: async () => { throw new Error('offline'); } }));
  assert.equal(pets.dog[0].diaryEntries, undefined);
});
test('deletion removes only the requested entry; missing target never writes', async () => {
  const next = await persistDiaryChange({ pets, target: { id: 'cat', species: 'cat' }, write: async () => true, change: entries => entries.filter(entry => entry.id !== 'old') });
  assert.deepEqual(next.cat[0].diaryEntries, []);
  assert.equal(next.cat[1], pets.cat[1]);
  assert.equal(await persistDiaryChange({ pets, target: { id: 'missing' }, species: 'dog', write: () => { throw new Error('must not write'); }, change: () => [] }), null);
});

test('home shows one latest day with matching photo and text', async () => {
  const { latestDiaryPreview } = await import('../src/pet-diary.js');
  const pet = { photos: [{ date: '2026-10-05', dataUrl: 'old' }, { date: '2026-10-06', dataUrl: 'first' }, { date: '2026-10-06', dataUrl: 'last' }], diaryEntries: [{ date: '2026-10-06', text: 'older', createdAt: '01' }, { date: '2026-10-06', text: 'latest', createdAt: '02' }] };
  assert.deepEqual(latestDiaryPreview(pet), { date: '2026-10-06', photo: pet.photos[2], text: 'latest' });
  pet.diaryEntries.push({ date: '2026-10-07', text: 'text only' });
  assert.deepEqual(latestDiaryPreview(pet), { date: '2026-10-07', photo: null, text: 'text only' });
  assert.equal(latestDiaryPreview({}), null);
});
