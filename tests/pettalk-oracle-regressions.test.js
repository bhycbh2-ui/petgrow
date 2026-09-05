import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformPetTalkOracle } from "../build/petgrow-pettalk-oracle-fixes-20260904.mjs";

const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
const transformedApp=transformPetTalkOracle(app);
const widgets=readFileSync(new URL("../src/PetDailyWidgets.jsx",import.meta.url),"utf8");
const tarotApi=readFileSync(new URL("../server_lib/tarot.js",import.meta.url),"utf8");
const sajuSplit=readFileSync(new URL("../build/petgrow-deep-menu-split-v6-20260821.mjs",import.meta.url),"utf8");
const menuSplit=readFileSync(new URL("../build/petgrow-menu-split-v4-20260821.mjs",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");

test("PetTalk composer dependencies and three examples remain available",()=>{
  assert.match(transformedApp,/function validatePetTalkText\(\.\.\.parts\)/);
  assert.match(transformedApp,/function petSnapshot\(pet\)/);
  const demo=transformedApp.match(/const COMMUNITY_DEMO_POSTS = \[([\s\S]*?)\n\];/);
  assert.ok(demo,"PetTalk demo list must exist");
  assert.equal((demo[1].match(/^\s*\["/gm)||[]).length,3);
  assert.match(transformedApp,/onSaved\(saved\)/);
  assert.match(transformedApp,/if \(saved\?\.id\) setActivePostId\(saved\.id\)/);
  assert.match(menuSplit,/communityDeps = \[[^\]]*"COMMUNITY_DEMO_POSTS"/);
  assert.match(menuSplit,/PostCard, COMMUNITY_CATEGORY_KEYS, COMMUNITY_DEMO_POSTS \}/);
});

test("PetTalk deletion only leaves the detail after the API succeeds",()=>{
  const fn=transformedApp.match(/const confirmDeletePost = async \(\) => \{([\s\S]*?)\n  \};/);
  assert.ok(fn);
  assert.ok(fn[1].indexOf("await communityDeletePost(postId)")<fn[1].indexOf("onDeleted()"));
  assert.match(fn[1],/catch \(err\)/);
});

test("Saju split carries the Korean particle helper into its lazy chunk",()=>{
  assert.match(sajuSplit,/deps: \[[^\]]*"josa"/);
});

test("fortune save feedback and tarot sequence cleanup are wired",()=>{
  assert.match(widgets,/pg-oracle-save-state/);
  assert.match(widgets,/const clearSequence=/);
  assert.match(widgets,/return clearSequence/);
  assert.match(tarotApi,/clean\(req\.body\?\.id,240\)/);
});

test("PetGrow splash uses a brand-native growth infographic",()=>{
  assert.match(html,/class="petgrow-splash__story"/);
  assert.match(html,/petgrow-splash__metric-heart/);
  assert.match(html,/class="petgrow-splash__stem"/);
  assert.match(html,/class="petgrow-splash__metric"/);
  assert.match(html,/@keyframes petgrow-stem-grow/);
  assert.doesNotMatch(html,/petgrow-splash-pets-20260905/);
  assert.doesNotMatch(html,/class="pg-growth-system"/);
  assert.doesNotMatch(html,/class="petgrow-runners"/);
});
