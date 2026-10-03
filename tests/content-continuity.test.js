import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { dailyPetInfo, kstDateKey } from "../server_lib/petinfo-daily.js";
import { fallbackMusicCover, withFallbackMusicCovers } from "../server_lib/music-cover.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("every music track receives a stable local cover fallback", () => {
  const track = { id:"new-dog-alley-walk-01", species:"dog", cover_url:null };
  const first = fallbackMusicCover(track);
  assert.equal(first, fallbackMusicCover(track));
  assert.match(first, /^\/petmusic\/covers\/cover-\d{2}\.webp$/);
  assert.equal(withFallbackMusicCovers([track])[0].cover_url, first);
});

test("uploaded music covers are preserved", () => {
  const url = "https://example.com/custom-cover.webp";
  assert.equal(fallbackMusicCover({ id:"custom", species:"cat", cover_url:url }), url);
});

test("PetInfo chooses one deterministic Seoul-date article", () => {
  const date = new Date("2026-10-04T00:30:00+09:00");
  assert.equal(kstDateKey(date), "2026-10-04");
  const item = dailyPetInfo(date);
  assert.match(item.id, /^daily-2026-10-04-/);
  assert.ok(item.title.length > 5);
  assert.ok(item.body.length > 20);
});

test("Vercel schedules daily PetInfo publishing", () => {
  const config = JSON.parse(read("vercel.json"));
  assert.deepEqual(config.crons.find((item) => item.path === "/api/petinfo-cron"), { path:"/api/petinfo-cron", schedule:"15 0 * * *" });
});
