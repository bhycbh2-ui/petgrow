import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformAboutNext } from "../build/petgrow-about-next-20260905.mjs";

const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
const transformed=transformAboutNext(app);
const css=readFileSync(new URL("../src/petgrow-about-next-20260905.css",import.meta.url),"utf8");

test("About page uses the PetGrow record-insight-care narrative",()=>{
  assert.match(transformed,/className="landing-root pg-about-next"/);
  assert.match(transformed,/RECORD → INSIGHT → CARE/);
  assert.match(transformed,/기록이 쌓일수록/);
  assert.match(transformed,/우리 아이에게 필요한 기능을 하나의 흐름으로/);
});

test("About page supports desktop, mobile and reduced-motion layouts",()=>{
  assert.match(css,/@media\(max-width:920px\)/);
  assert.match(css,/@media\(max-width:620px\)/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
