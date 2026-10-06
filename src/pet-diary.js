export function saveDiaryEntry(entries = [], draft, now = new Date().toISOString()) {
  const text = String(draft.text || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date || '') || !text || text.length > 1000) throw new Error('Invalid diary entry');
  const previous = entries.find(entry => entry.id === draft.id);
  const entry = { id: draft.id, date: draft.date, text, createdAt: previous?.createdAt || now, updatedAt: now };
  return previous ? entries.map(item => item.id === entry.id ? entry : item) : [...entries, entry];
}

export async function persistDiaryChange({ pets, target, species, account, write, change }) {
  if (!target) return null;
  const targetSpecies = target.species || species;
  if (!pets[targetSpecies]?.some(pet => pet.id === target.id)) return null;
  const list = pets[targetSpecies].map(pet => pet.id === target.id ? { ...pet, diaryEntries: change(pet.diaryEntries || []) } : pet);
  const ok = await write(targetSpecies === 'cat' ? 'bboggl:cats' : 'bboggl:dogs', list, account);
  return ok ? { ...pets, [targetSpecies]: list } : null;
}
