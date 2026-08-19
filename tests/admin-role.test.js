import test from "node:test";
import assert from "node:assert/strict";
import { roleCan } from "../server_lib/admin.js";

test("superadmin can manage PetInfo", () => {
  assert.equal(roleCan("superadmin", "petinfo"), true);
});

test("operator can manage PetInfo", () => {
  assert.equal(roleCan("operator", "petinfo"), true);
});

test("report and ads roles cannot manage PetInfo", () => {
  assert.equal(roleCan("report", "petinfo"), false);
  assert.equal(roleCan("ads", "petinfo"), false);
});

test("unknown roles and capabilities are denied by default", () => {
  assert.equal(roleCan("unknown", "petinfo"), false);
  assert.equal(roleCan("operator", "unknown-capability"), false);
});
