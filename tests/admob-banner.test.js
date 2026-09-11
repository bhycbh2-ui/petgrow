import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createAdMobSession } from "../src/admob-session.js";

// Run the production controller with a native bridge and a minimal content DOM.
// No requests reach Google; native load/failure events are controlled by the test.
async function fixture() {
  const classes = new Set();
  const attrs = new Set();
  const elements = new Map();
  const listeners = new Map();
  const timers = new Map();
  const calls = [];
  let clock = 0;
  let timerId = 0;
  let nativeShow = async () => {};
  const classList = { contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) };
  const element = () => ({ classList, setAttribute() {}, closest: () => null, getBoundingClientRect: () => ({ width: 400, height: 600 }) });
  const block = { ...element(), innerText: "content ".repeat(30) };
  const root = { ...element(), innerText: "content ".repeat(200), querySelectorAll: () => [block, block, block] };
  const view = { dataset: { petgrowView: "tips" } };
  let menuOpen = false;
  const menu = { ...element(), closest: () => menuOpen ? null : menu };
  const document = {
    visibilityState: "visible",
    documentElement: { classList, toggleAttribute: (x, on) => on ? attrs.add(x) : attrs.delete(x) },
    head: { append: el => elements.set(el.id, el) },
    body: { classList, append: el => elements.set(el.id, el) },
    getElementById: id => id === "root" ? root : elements.get(id),
    createElement: element,
    querySelector: selector => selector === "main" ? root : selector === "[data-petgrow-view]" ? view : null,
    querySelectorAll: selector => selector.startsWith('[role="dialog"]') ? [menu] : [],
    addEventListener() {},
  };
  const AdMob = {
    async requestConsentInfo() { return { status: "NOT_REQUIRED", canRequestAds: true }; },
    async initialize() { calls.push("initialize"); },
    async addListener(event, handler) { listeners.set(event, handler); },
    async showBanner() { calls.push("show"); await nativeShow(); },
    async removeBanner() { calls.push("remove"); },
  };
  const window = {
    dispatchEvent() {}, addEventListener() {},
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, at: clock + delay }); return id; },
  };
  const context = vm.createContext({
    createAdMobSession, document, window, location: { pathname: "/", search: "", hash: "" },
    fakeCore: { Capacitor: { isNativePlatform: () => true, getPlatform: () => "android" } },
    fakePlugin: { AdMob, BannerAdPluginEvents: { Loaded: "loaded", FailedToLoad: "failed" }, BannerAdPosition: {}, BannerAdSize: {} },
    fakeEnv: {}, Date: { now: () => clock }, console,
    getComputedStyle: () => ({ display: "block", visibility: "visible", opacity: "1" }),
    clearTimeout: id => timers.delete(id), requestAnimationFrame: () => 1, addEventListener() {},
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    MutationObserver: class { observe() {} },
  });
  const source = readFileSync(new URL("../src/android-admob.js", import.meta.url), "utf8")
    .replace(/^import .*;\n/, "")
    .replaceAll("export ", "")
    .replace('await import("@capacitor/core")', "fakeCore")
    .replace('await import("@capacitor-community/admob")', "fakePlugin")
    .replaceAll("import.meta.env", "fakeEnv")
    .replace(/bootAndroidAdMob\(\);\s*$/, "window.boot = bootAndroidAdMob; window.reconcile = reconcileBanner;");
  vm.runInContext(source, context);
  await window.boot();
  return {
    calls, classes, ads: window.PetGrowAdMob,
    setView(value) { view.dataset.petgrowView = value; window.reconcile(); },
    setMenuOpen(value) { menuOpen = value; window.reconcile(); },
    setNativeShow(fn) { nativeShow = fn; },
    emit: (name, data) => listeners.get(name)?.(data),
    async advance(ms) {
      clock += ms;
      for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn(); }
      await window.PetGrowAdMob.showBanner();
    },
  };
}

test("concurrent banner loads create one view and reserve space only after native Loaded", async () => {
  const f = await fixture();
  await Promise.all([f.ads.showBanner(), f.ads.showBanner()]);
  assert.equal(f.calls.filter(x => x === "show").length, 1);
  assert.equal(f.classes.has("petgrow-admob-banner"), false);
  f.emit("loaded");
  assert.equal(f.classes.has("petgrow-admob-banner"), true);
});

test("leaving content during an in-flight banner removes it and allows a fresh request on return", async () => {
  const f = await fixture();
  let finish;
  let started;
  const opening = new Promise(resolve => { started = resolve; });
  f.setNativeShow(() => new Promise(resolve => { finish = resolve; started(); }));
  const pending = f.ads.showBanner();
  await opening;
  f.setView("home");
  finish();
  await pending;
  f.emit("loaded");
  assert.equal(f.ads.getStatus().bannerCreated, false);
  assert.equal(f.classes.has("petgrow-admob-banner"), false);
  assert.ok(f.calls.includes("remove"));
  f.setNativeShow(async () => {});
  f.setView("tips");
  await f.ads.showBanner();
  assert.equal(f.calls.filter(x => x === "show").length, 2);
  assert.equal(f.calls.filter(x => x === "initialize").length, 1);
});

test("native load failure clears reserved space and permits a retry after backoff", async () => {
  const f = await fixture();
  await f.ads.showBanner();
  f.emit("loaded");
  f.emit("failed", { message: "no fill" });
  await f.ads.removeBanner();
  assert.equal(f.classes.has("petgrow-admob-banner"), false);
  await f.ads.showBanner();
  assert.equal(f.calls.filter(x => x === "show").length, 1);
  await f.advance(30000);
  assert.equal(f.calls.filter(x => x === "show").length, 2);
  assert.equal(f.ads.getStatus().bannerCreated, true);
});

test("a closed inert navigation drawer does not block ads but an open drawer does", async () => {
  const f = await fixture();
  assert.equal(f.ads.isAdEligibleScreen(), true);
  await f.ads.showBanner();
  f.setMenuOpen(true);
  assert.equal(f.ads.isAdEligibleScreen(), false);
  assert.equal(f.ads.getStatus().bannerCreated, false);
  f.setMenuOpen(false);
  assert.equal(f.ads.isAdEligibleScreen(), true);
});
