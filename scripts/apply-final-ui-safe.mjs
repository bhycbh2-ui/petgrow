import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');

function replaceOrFail(from, to, label) {
  if (!app.includes(from)) throw new Error(`Patch target not found: ${label}`);
  app = app.replace(from, to);
}

// 우리 아이 메뉴 명칭을 관리/정보 중심으로 정리
replaceOrFail(
  '    tabDog: (n) => `멍그로우${n > 0 ? ` (${n})` : ""}`,\n    tabCat: (n) => `냥그로우${n > 0 ? ` (${n})` : ""}`,',
  '    tabDog: (n) => `강아지 정보${n > 0 ? ` (${n})` : ""}`,\n    tabCat: (n) => `고양이 정보${n > 0 ? ` (${n})` : ""}`,',
  'Korean pet information labels'
);
replaceOrFail(
  '    tabDog: (n) => `Bark-Grow${n > 0 ? ` (${n})` : ""}`,\n    tabCat: (n) => `Meow-Grow${n > 0 ? ` (${n})` : ""}`,',
  '    tabDog: (n) => `Dog profile${n > 0 ? ` (${n})` : ""}`,\n    tabCat: (n) => `Cat profile${n > 0 ? ` (${n})` : ""}`,',
  'English pet information labels'
);

// Pet사주 / PetBTI 비등록 안내는 PC에서 중앙 카드로 제한
const emptyOld = '<div className="feature-module-shell"><div className="bg-card" style={{ textAlign: "center" }}>';
const emptyNew = '<div className="feature-module-shell" style={{ display: "flex", justifyContent: "center", padding: "24px 20px 40px" }}><div className="bg-card" style={{ textAlign: "center", width: "100%", maxWidth: 560, padding: "34px 30px" }}>';
const emptyCount = app.split(emptyOld).length - 1;
if (emptyCount !== 2) throw new Error(`Expected 2 empty-state targets, found ${emptyCount}`);
app = app.split(emptyOld).join(emptyNew);

// 우리 아이 결과는 PC에서도 2열 masonry 대신 위에서 아래로 한 줄씩 읽도록 변경
replaceOrFail(
  '      <div className="result-columns">\n        <div className="result-block">\n          <AdultWeightHero',
  '      <div className="result-columns" style={{ display: "flex", flexDirection: "column", gap: 16, columnCount: "auto" }}>\n        <div className="result-block">\n          <AdultWeightHero',
  'single-column pet result'
);

fs.writeFileSync(path, app);
console.log('Safe final UI patch applied');
