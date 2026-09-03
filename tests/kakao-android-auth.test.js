import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = file => fs.readFileSync(path.resolve(file), "utf8");

test("Android Kakao login uses an app-specific OAuth path and deep link", () => {
  const app = read("src/App.jsx");
  const entry = read("src/app-entry.jsx");
  const manifest = read("android/app/src/main/AndroidManifest.xml");

  assert.match(app, /client=android/);
  assert.match(entry, /@capacitor\/app/);
  assert.match(entry, /appUrlOpen/);
  assert.match(entry, /getLaunchUrl/);
  assert.match(entry, /\/api\/auth\/kakao\/handoff\?token=/);
  assert.match(manifest, /android:scheme="kr\.co\.petgrow\.app"/);
  assert.match(manifest, /android:host="auth"/);
  assert.match(manifest, /android:pathPrefix="\/callback"/);
});

test("OAuth state and Android handoff tokens are short-lived and one-time", () => {
  const db = read("server_lib/db.js");
  const login = read("api/auth/kakao/login.js");
  const callback = read("api/auth/kakao/callback.js");
  const handoff = read("api/auth/kakao/handoff.js");

  assert.match(login, /createOAuthState\(client\)/);
  assert.match(callback, /rawState !== cookies\[OAUTH_STATE_COOKIE\]/);
  assert.match(callback, /consumeOAuthState\(rawState\)/);
  assert.match(callback, /createAuthHandoff\(user\.id\)/);
  assert.match(callback, /kr\.co\.petgrow\.app:\/\/auth\/callback/);
  assert.match(handoff, /consumeAuthHandoff\(token\)/);
  assert.match(handoff, /HttpOnly; Secure; SameSite=Lax/);
  assert.match(db, /delete from pg_oauth_states[\s\S]*returning client/);
  assert.match(db, /delete from pg_auth_handoffs[\s\S]*returning user_id/);
  assert.match(db, /interval '10 minutes'/);
  assert.match(db, /interval '3 minutes'/);
});
