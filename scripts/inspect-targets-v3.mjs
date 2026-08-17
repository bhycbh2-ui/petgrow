import fs from 'node:fs';
const s=fs.readFileSync('src/App.jsx','utf8');
const needles=['function MyPage','function AdminReportsPage','function PetNewsPage','function InfoGuidePage','function NearbyPage','function PetForm','function PetsPage','function LandingPage','dash-welcome','petpoint-help','effectiveView === "admin"'];
for(const n of needles){const i=s.indexOf(n);console.log(n, i, i>=0?s.slice(Math.max(0,i-400),i+1800):'NOT FOUND');}
