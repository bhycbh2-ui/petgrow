import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformNearbyNext } from "../build/petgrow-nearby-next-20260905.mjs";

const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
const transformed=transformNearbyNext(app);
const css=readFileSync(new URL("../src/petgrow-nearby-next-20260905.css",import.meta.url),"utf8");

test("Pet Places uses a map-first workspace and selected-place panel",()=>{
  assert.match(transformed,/nearby-page pg-place-next/);
  assert.match(transformed,/pg-place-workspace/);
  assert.match(transformed,/pg-place-focus/);
  assert.match(transformed,/nearby-category-grid/);
  assert.match(transformed,/selectCategory/);
});

test("Pet Places supports desktop split view and mobile app map layout",()=>{
  assert.match(css,/grid-template-columns:minmax\(0,1\.48fr\)/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/height:min\(54dvh,480px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
