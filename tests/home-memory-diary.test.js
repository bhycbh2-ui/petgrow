import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const homeExtras = fs.readFileSync(new URL("../src/HomeInfoMusicSections.jsx", import.meta.url), "utf8");
const entry = fs.readFileSync(new URL("../src/app-entry.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/home-memory-diary-20260906.css", import.meta.url), "utf8");

test("home prioritizes the pet profile and a recent memory diary", () => {
  const profileIndex = app.indexOf('className={`dash-pet-spotlight');
  const diaryIndex = app.indexOf("<HomeMemoryDiary pet={pet}");
  const quickIndex = app.indexOf('className="dash-section"><div className="dash-section-head"', profileIndex);
  assert.ok(profileIndex >= 0);
  assert.ok(diaryIndex > profileIndex);
  assert.ok(quickIndex > diaryIndex);
  assert.match(app, /slice\(0, 4\)/);
  assert.match(styles, /\.home-memory-photos/);
});

test("the full photo album is styled and ordered as a memory diary", () => {
  assert.match(app, /className="bg-card memory-diary-album"/);
  assert.match(app, /className="memory-diary-timeline"/);
  assert.match(app, /사진과 날짜를 남기면 우리 아이의 하루가 시간순으로 쌓여요/);
  const albumIndex = app.indexOf("<PhotoAlbum birthDate={profile.birthDate}");
  const chartIndex = app.indexOf("<GrowthChartCard", albumIndex - 1000);
  assert.ok(albumIndex >= 0 && albumIndex < chartIndex);
});

test("home keeps news and music previews compact", () => {
  assert.match(app, /setHomeNews\([\s\S]*?slice\(0,2\)\)/);
  assert.match(homeExtras, /cached\.items\.slice\(0, 2\)/);
  assert.match(homeExtras, /data\?\.top5\) \? data\.top5\.slice\(0, 2\)/);
  assert.match(homeExtras, /Pet음악 미리듣기/);
});

test("PetPoint is no longer exposed on About or My Page", () => {
  assert.doesNotMatch(app, /<PetPointAboutCard \/>/);
  assert.doesNotMatch(app, /<section className="mypage-petpoint-section"><PetPointDashboard \/><\/section>/);
  assert.doesNotMatch(app, /계정·우리 아이·포인트·활동내역/);
});

test("the memory diary stylesheet is loaded last", () => {
  const categoryIndex = entry.indexOf('import "./category-one-row-20260905.css"');
  const diaryStyleIndex = entry.indexOf('import "./home-memory-diary-20260906.css"');
  assert.ok(diaryStyleIndex > categoryIndex);
});
