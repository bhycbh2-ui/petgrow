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

test("official channel list includes the Naver Clip profile",()=>{
  const app=read("src/App.jsx");
  assert.match(app,/https:\/\/naver\.me\/FORGDLhE/);
  assert.match(app,/clip: "네이버 클립"/);
  assert.match(app,/\.social-links\{display:flex; flex-wrap:wrap;/);
  assert.match(app,/\.petgrow-footer \.social-links\{flex-wrap:nowrap;/);
  assert.match(app,/<footer className="petgrow-footer">[\s\S]*?<SocialLinks \/>/);
  assert.match(app,/상호명 아우리녹 · 대표자 정재현 · 사업자등록번호 297-32-01792/);
});

test("Kakao channel and one-to-one chat are linked on app and web support",()=>{
  const app=read("src/App.jsx");
  const contact=read("public/contact.html");
  assert.match(app,/https:\/\/pf\.kakao\.com\/_TLyxaX/);
  assert.match(app,/KAKAO_CHAT_URL = `\$\{KAKAO_CHANNEL_URL\}\/chat`/);
  assert.match(app,/카카오톡 1:1 상담/);
  assert.match(contact,/https:\/\/pf\.kakao\.com\/_TLyxaX\/chat/);
});
