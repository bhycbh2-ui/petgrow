import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../api/petinfo.js", import.meta.url), "utf8");

test("PetInfo API keeps public list and protected admin actions", () => {
  assert.match(source, /action === "list"/);
  assert.match(source, /action === "admin-list"/);
  assert.match(source, /action === "admin-save"/);
  assert.match(source, /action === "admin-toggle"/);
  assert.match(source, /action === "admin-delete"/);
  assert.match(source, /action === "admin-import"/);
});

test("PetInfo API enforces centralized capability and admin token", () => {
  assert.match(source, /roleCan\(role, "petinfo"\)/);
  assert.match(source, /x-petgrow-admin-token/);
  assert.match(source, /verifyToken/);
});

test("PetInfo public list excludes hidden and future content", () => {
  assert.match(source, /where active=true/);
  assert.match(source, /publish_at is null or publish_at <=/);
});
