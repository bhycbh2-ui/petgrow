import test from "node:test";
import assert from "node:assert/strict";
import { createAdMobSession } from "../src/admob-session.js";

function fixture(info = { status: "NOT_REQUIRED", canRequestAds: true }) {
  const calls = [];
  let current = info;
  let clock = 0;
  const AdMob = {
    async requestConsentInfo() { calls.push("consent"); if (current instanceof Error) throw current; return current; },
    async showConsentForm() { calls.push("form"); return { status: "OBTAINED", canRequestAds: true }; },
    async initialize() { calls.push("initialize"); },
    async showPrivacyOptionsForm() { calls.push("privacy"); },
    async resetConsentInfo() { throw new Error("Production must not reset UMP consent"); },
  };
  const states = [];
  const session = createAdMobSession(async () => ({ AdMob }), s => states.push(s), () => clock);
  return { session, AdMob, calls, states, setInfo: value => { current = value; }, advance: ms => { clock += ms; } };
}

test("concurrent banner and reward initialization uses one consent request and one SDK initialization", async () => {
  const f = fixture();
  assert.deepEqual(await Promise.all([f.session.initialize(), f.session.initialize(), f.session.initialize()]), [true, true, true]);
  assert.deepEqual(f.calls, ["consent", "initialize"]);
});

test("required consent is completed before the SDK can initialize", async () => {
  const f = fixture({ status: "REQUIRED", canRequestAds: false });
  assert.equal(await f.session.initialize(), true);
  assert.deepEqual(f.calls, ["consent", "form", "initialize"]);
});

test("explicit canRequestAds false blocks ads even if consent status is OBTAINED", async () => {
  const f = fixture({ status: "OBTAINED", canRequestAds: false });
  assert.equal(await f.session.initialize(), false);
  assert.deepEqual(f.calls, ["consent"]);
});

test("older installed plugins remain supported when canRequestAds is absent", async () => {
  const f = fixture({ status: "NOT_REQUIRED" });
  assert.equal(await f.session.initialize(), true);
});

test("consent network errors do not request ads or retry on every DOM change", async () => {
  const f = fixture(new Error("network unavailable"));
  assert.equal(await f.session.initialize(), false);
  assert.equal(await f.session.initialize(), false);
  assert.deepEqual(f.calls, ["consent"]);
  f.advance(30000);
  f.setInfo({ status: "NOT_REQUIRED", canRequestAds: true });
  assert.equal(await f.session.initialize(), true);
  assert.deepEqual(f.calls, ["consent", "consent", "initialize"]);
});

test("privacy changes use the privacy form, block new ads while open and re-check current eligibility", async () => {
  const f = fixture({ status: "OBTAINED", canRequestAds: true, privacyOptionsRequirementStatus: "REQUIRED" });
  await f.session.initialize();
  let closeForm;
  let formOpened;
  const opened = new Promise(resolve => { formOpened = resolve; });
  f.AdMob.showPrivacyOptionsForm = () => new Promise(resolve => { closeForm = resolve; formOpened(); f.calls.push("privacy"); });
  const pending = f.session.requestPrivacyChoices();
  await opened;
  assert.equal(await f.session.initialize(), false);
  f.setInfo({ status: "OBTAINED", canRequestAds: false, privacyOptionsRequirementStatus: "REQUIRED" });
  closeForm();
  assert.equal(await pending, true);
  assert.equal(f.session.getStatus().ready, false);
  assert.equal(await f.session.initialize(), false);
  assert.equal(f.calls.filter(c => c === "initialize").length, 1);
});

test("missing native platform performs no SDK requests", async () => {
  const session = createAdMobSession(async () => null);
  assert.equal(await session.initialize(), false);
});
