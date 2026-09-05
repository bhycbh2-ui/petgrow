import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const entry=readFileSync(new URL("../src/app-entry.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/petgrow-color-harmony-20260905.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");

test("the shared color layer loads after the page-specific themes",()=>{
  const about=entry.indexOf('petgrow-about-next-20260905.css');
  const nearby=entry.indexOf('petgrow-nearby-next-20260905.css');
  const harmony=entry.indexOf('petgrow-color-harmony-20260905.css');
  assert.ok(about>=0&&nearby>=0&&harmony>about&&harmony>nearby);
});

test("core pages share one green-neutral palette",()=>{
  assert.match(css,/--pg-harmony-deep:#234f3c/);
  assert.match(css,/\.pg-about-next\{[\s\S]*--about-green:var\(--pg-harmony-deep\)/);
  assert.match(css,/\.pg-place-next\{[\s\S]*--place-green:var\(--pg-harmony-green\)/);
  assert.match(css,/\.dash-quick-grid>button:nth-child\(3n\+1\)/);
  assert.doesNotMatch(css,/#(?:f4f0fb|eef5fb|fff4ec|fff1f3|fff8e9)/i);
});

test("browser chrome uses the PetGrow deep green",()=>{
  assert.match(html,/<meta name="theme-color" content="#234f3c" \/>/);
});
