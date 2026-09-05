import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Android does not replace /api/me with a synthetic timeout response", () => {
  const entry = read("src/app-entry.jsx");
  assert.doesNotMatch(entry, /auth_check_timeout/);
  assert.doesNotMatch(entry, /window\.fetch\s*=/);
});

test("gated navigation rechecks the shared server session before showing login", () => {
  const app = read("src/App.jsx");
  assert.match(app, /authChecked\s*&&\s*GATED_VIEWS\.includes\(view\)\s*&&\s*!account/);
  assert.match(app, /GATED_VIEWS\.includes\(next\)[\s\S]*await fetchMe\(16000\)/);
  assert.match(app, /cloudGet\("bboggl:dogs"\)[\s\S]*cloudGet\("bboggl:cats"\)[\s\S]*cloudGet\("bboggl:activeIds"\)/);
});

test("auth continuity survives new tabs and transient API latency", () => {
  const app = read("src/App.jsx");
  assert.match(app, /window\.localStorage\.getItem\(AUTH_ACCOUNT_CACHE_KEY\)/);
  assert.match(app, /window\.localStorage\.setItem\(AUTH_ACCOUNT_CACHE_KEY, value\)/);
  assert.match(app, /useState\(readCachedAccount\)/);
  assert.match(app, /async function fetchMe\(timeoutMs = 16000\)/);
  assert.match(app, /if \(meResult !== undefined\) setAccount\(meResult\)/);
});

test("normal Kakao login reuses the existing Kakao session", () => {
  const login = read("api/auth/kakao/login.js");
  assert.match(login, /if \(req\.query\?\.switch === "1"\) authorizeUrl\.searchParams\.set\("prompt", "select_account"\)/);
  assert.equal((login.match(/searchParams\.set\("prompt", "select_account"\)/g) || []).length, 1);
});

test("deep result split forwards multiline Recharts imports", () => {
  const splitter = read("build/petgrow-deep-screen-split-v7-20260821.mjs");
  assert.match(splitter, /const importRe = \/\^\\s\*import\\s\+\(\[\\s\\S\]\+\?\)/);
  assert.match(splitter, /const multiDeclarationRe = \/\\b\(\?:let\|var\)/);
});

test("release workflow publishes the next build to Google Play production", () => {
  const workflow = read(".github/workflows/android-aab.yml");
  const gradle = read("android/app/build.gradle");
  assert.match(workflow, /PLAY_TRACK:\s*production/);
  assert.match(workflow, /PetGrow-production-aab-/);
  assert.match(gradle, /versionName\s+"1\.7\.4"/);
});
