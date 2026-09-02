import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read=(file)=>fs.readFileSync(path.resolve(file),"utf8");

test("publisher guide pages are substantial and listed in sitemap",()=>{
  const pages=[
    "public/pet-guide.html",
    "public/guides/weight-record.html",
    "public/guides/walk-routine.html",
    "public/guides/vaccination-record.html",
    "public/guides/dental-care.html",
    "public/guides/cat-water-litter.html",
    "public/guides/senior-home.html",
  ];
  const sitemap=read("public/sitemap.xml");
  for(const file of pages){
    const html=read(file);
    assert.ok(html.length>1800,`${file} should contain useful original content`);
    assert.match(html,/<link rel="canonical"/);
    assert.match(html,/application\/ld\+json/);
    const publicPath=`/${file.replace(/^public\//,"")}`;
    assert.ok(sitemap.includes(publicPath),`${publicPath} should be in sitemap.xml`);
  }
  assert.ok(fs.existsSync("public/guides/style.css"));
});

test("Vercel serves publisher content instead of returning review-time 404s",()=>{
  const config=JSON.parse(read("vercel.json"));
  const blocked=(config.routes||[]).filter(route=>route.status===404&&/pet-guide|guides/.test(String(route.src)));
  assert.deepEqual(blocked,[]);
});

test("Android ads remain consent-first and restricted to substantial content",()=>{
  const deferred=read("src/deferred-app-boot.js");
  const admob=read("src/android-admob.js");
  assert.ok(!deferred.includes('import("./admob-readiness-20260822.js")'));
  assert.match(admob,/MIN_CONTENT_CHARS=900/);
  assert.match(admob,/visibleEditorialBlocks\(\)<3/);
  assert.match(admob,/CONTENT_VIEW_RE/);
});
