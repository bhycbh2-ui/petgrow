import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformAboutNext } from "../build/petgrow-about-next-20260905.mjs";

const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
const transformed=transformAboutNext(app);
const css=readFileSync(new URL("../src/petgrow-about-next-20260905.css",import.meta.url),"utf8");

test("About page introduces the complete pet life experience",()=>{
  assert.match(transformed,/className="landing-root pg-about-next pg-about-overview"/);
  for (const feature of ['성장과 생활 기록','다이어리','Pet톡','정보와 뉴스','음악','PetBTI','Pet사주','Pet타로','내 주변 Pet']) assert.ok(transformed.includes(feature));
  assert.match(transformed,/<IntroVideo \/>/);
  assert.doesNotMatch(transformed,/GROWTH SIGNAL|\+12\.4%/);
});

test("About page supports desktop, mobile and reduced-motion layouts",()=>{
  assert.match(css,/@media\(max-width:920px\)/);
  assert.match(css,/@media\(max-width:620px\)/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/petgrow-sidebar-brand img[^}]+content:normal!important/);
});
