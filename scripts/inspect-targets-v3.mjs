import fs from 'node:fs';
const s=fs.readFileSync('src/App.jsx','utf8');
const needles=[
  'function MyPage','const menuItems = [','function AdminReportsPage','effectiveView === "admin"',
  'function PetNewsPage','petnews-modal-backdrop','function InfoGuidePage','guide-search-only',
  'function LandingPage','landing-feature-grid','landing-core','landingFeature',
  'dash-welcome','안녕하세요,','운영자 보호자님','function Footer','개인정보처리방침','고객지원',
  'function PetProfile','function PetRegistration','function PetEdit','function PetForm','savePet','handleSavePet','onSavePet','setEditingPet',
  '강아지 정보','고양이 정보','저장하기','성장 기록','function Nearby','followMyLocation','setFollowMyLocation(false)',
  'petpoint-dashboard','function PetPointDashboard','포인트는 어떻게 모아요?','포인트 이용내역'
];
for(const n of needles){
  const hits=[];let p=0;
  while((p=s.indexOf(n,p))>=0&&hits.length<3){hits.push(p);p+=Math.max(1,n.length)}
  console.log('\n===== '+n+' :: '+hits.join(',')+' =====');
  for(const i of hits) console.log(s.slice(Math.max(0,i-900),i+3600));
}
