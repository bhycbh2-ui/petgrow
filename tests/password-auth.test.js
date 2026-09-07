import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { authCodeHash, hashPassword, loginAttemptKey, normalizeEmail, normalizePhone, normalizeUsername, validatePassword, validateUsername, verifyPassword } from "../server_lib/passwordAuth.js";

test("normalizes login identifiers", () => {
  assert.equal(normalizeUsername(" Pet_User "), "pet_user");
  assert.equal(normalizeEmail(" Me@Example.COM "), "me@example.com");
  assert.equal(normalizePhone("010-1234-5678"), "01012345678");
});

test("validates username and password policy", () => {
  assert.equal(validateUsername("petgrow_1").ok, true);
  assert.equal(validateUsername("1pet").ok, false);
  assert.equal(validatePassword("pets1234").ok, true);
  assert.equal(validatePassword("password").ok, false);
});

test("hashes and verifies password without storing plaintext", async () => {
  const stored = await hashPassword("pets1234");
  assert.equal(stored.includes("pets1234"), false);
  assert.equal(await verifyPassword("pets1234", stored), true);
  assert.equal(await verifyPassword("wrong1234", stored), false);
});

test("hashes one-time codes and scopes login throttling by username and IP", () => {
  assert.match(authCodeHash("123456"), /^[a-f0-9]{64}$/);
  assert.equal(authCodeHash("123456"), authCodeHash("123456"));
  assert.notEqual(authCodeHash("123456"), authCodeHash("123457"));
  assert.equal(loginAttemptKey(" Pet_User ", "127.0.0.1"), loginAttemptKey("pet_user", "127.0.0.1"));
  assert.notEqual(loginAttemptKey("pet_user", "127.0.0.1"), loginAttemptKey("pet_user", "127.0.0.2"));
});

test("signup and Kakao linking require a verified email boundary", () => {
  const localApi = fs.readFileSync(new URL("../api/auth/local.js", import.meta.url), "utf8");
  const passwordAuth = fs.readFileSync(new URL("../server_lib/passwordAuth.js", import.meta.url), "utf8");
  assert.match(localApi, /consumeEmailVerificationCode/);
  assert.match(localApi, /purpose: action/);
  assert.match(passwordAuth, /!match\.rows\[0\]\.kakao_id && match\.rows\[0\]\.email_verified_at/);
  assert.match(passwordAuth, /email_verified_at=now\(\)/);
});
