import fs from 'node:fs';
const s=fs.readFileSync('src/App.jsx','utf8');
const t=fs.readFileSync('src/PetDailyWidgets.jsx','utf8');
fs.mkdirSync('debug',{recursive:true});
function around(text,needle,before=1800,after=7000){
  const i=text.indexOf(needle); if(i<0)return `NOT FOUND: ${needle}\n`;
  return text.slice(Math.max(0,i-before),Math.min(text.length,i+after));
}
function allAround(text,needle,before=900,after=3200){
  let out='',p=0,n=0; while((p=text.indexOf(needle,p))>=0&&n<8){out+=`\n--- hit ${++n} @${p} ---\n`+text.slice(Math.max(0,p-before),Math.min(text.length,p+after));p+=needle.length||1;}return out||`NOT FOUND: ${needle}\n`;
}
fs.writeFileSync('debug/mypage-v3.txt',around(s,'function MyPage',1200,15000));
fs.writeFileSync('debug/admin-v3.txt',around(s,'function AdminReportsPage',1200,21000)+around(s,'effectiveView === "admin"',800,2200));
fs.writeFileSync('debug/news-v3.txt',around(s,'function PetNewsPage',1000,13000));
fs.writeFileSync('debug/guide-v3.txt',around(s,'function InfoGuidePage',1000,14000));
fs.writeFileSync('debug/footer-v3.txt',allAround(s,'고객지원',1800,5000)+allAround(s,'개인정보처리방침',1800,5000));
fs.writeFileSync('debug/pets-v3.txt',allAround(s,'강아지 정보',2200,7000)+allAround(s,'고양이 정보',2200,7000)+allAround(s,'저장하기',2200,7000)+allAround(s,'setEditingPet',2200,7000));
fs.writeFileSync('debug/nearby-v3.txt',around(s,'followMyLocation',1800,16000)+allAround(s,'setFollowMyLocation(false)',1200,3500));
fs.writeFileSync('debug/landing-v3.txt',around(s,'function LandingPage',1200,18000)+allAround(s,'안녕하세요,',1500,4500));
fs.writeFileSync('debug/points-v3.txt',around(s,'function PetPointDashboard',1200,13000)+allAround(s,'포인트는 어떻게 모아요?',1200,5000)+allAround(s,'포인트 이용내역',1200,5000));
fs.writeFileSync('debug/tarot-v3.txt',around(t,'export function PetTarotPanel',1000,22000));
console.log('focused target files written');
