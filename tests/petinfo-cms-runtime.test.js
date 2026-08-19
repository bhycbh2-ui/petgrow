import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/petinfo-cms-runtime.js", import.meta.url), "utf8");

test("PetInfo CMS uses the existing admin token session key", () => {
  assert.match(source, /petgrow_admin_token/);
});

test("PetInfo CMS exposes create, edit, visibility, and delete controls", () => {
  assert.match(source, /admin-save/);
  assert.match(source, /admin-toggle/);
  assert.match(source, /admin-delete/);
  assert.match(source, /수정/);
  assert.match(source, /삭제/);
});

test("PetInfo CMS supports scheduled publishing fields", () => {
  assert.match(source, /publishAt/);
  assert.match(source, /datetime-local/);
});
