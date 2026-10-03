const DOG_COVERS = [1, 3, 5, 6, 8, 10, 11, 12, 16];
const CAT_COVERS = [2, 4, 7, 9, 13, 14];

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value || "petgrow")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function fallbackMusicCover(track = {}) {
  const current = String(track.cover_url ?? track.coverUrl ?? "").trim();
  if (current && !current.startsWith("data:image/")) return current;
  const covers = track.species === "cat" ? CAT_COVERS : DOG_COVERS;
  const number = covers[stableHash(track.id || track.title) % covers.length];
  return `/petmusic/covers/cover-${String(number).padStart(2, "0")}.webp`;
}

export function withFallbackMusicCovers(rows = []) {
  return rows.map((row) => ({ ...row, cover_url: fallbackMusicCover(row) }));
}
