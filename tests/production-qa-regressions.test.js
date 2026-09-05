import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("public PetInfo and guide views do not require login", () => {
  const app = read("src/App.jsx");
  const gated = app.match(/const GATED_VIEWS = \[([^\]]+)\]/)?.[1] || "";
  assert.doesNotMatch(gated, /"tips"|"guide"/);
});

test("quick menu state uses the routed state endpoint", () => {
  const app = read("src/App.jsx");
  assert.doesNotMatch(app, /fetch\('\/api\/core\?action=state/);
  assert.match(app, /fetch\('\/api\/state\?key=home_quick_menu/);
});

test("nearby results validate actual Kakao category or place name", () => {
  const core = read("api/core.js");
  assert.match(core, /kakaoPlaceMatchesKeyword/);
  assert.match(core, /docs\.filter\(d=>kakaoPlaceMatchesKeyword\(d,kw\)\)/);
  assert.doesNotMatch(core, /placeType\(d\.category_name, kw\)/);
  assert.match(core, /items\.filter\(x=>x\.typeKey===category\)/);
});

test("news is served in bounded pages and collection is cron-only", () => {
  const news = read("api/news.js");
  const cron = read("api/news-cron.js");
  assert.match(news, /LIMIT \$\{safeSize\} OFFSET \$\{offset\}/);
  assert.match(news, /shouldCollect/);
  assert.match(cron, /refresh: "1"/);
});

test("PWA no longer blocks published guide pages or runs the reset helper", () => {
  const html = read("index.html");
  const sw = read("public/sw.js");
  assert.doesNotMatch(html, /sw-reset-20260901/);
  assert.doesNotMatch(sw, /isLegacyGuidePath|legacy_guide_removed/);
});

test("Android release removes duplicate remote-only audio", () => {
  const workflow = read(".github/workflows/android-aab.yml");
  assert.match(workflow, /Remove remote-only music from Android bundle/);
  assert.match(workflow, /android\/app\/src\/main\/assets\/public\/petmusic/);
});
