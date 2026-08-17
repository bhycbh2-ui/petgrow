import fs from 'node:fs';

const file='src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const marker='PETNEWS_MOBILE_NAV_20260817';
if(s.includes(marker)){console.log('PetNews mobile nav already applied');process.exit(0);}

const hStart=s.indexOf('function HamburgerMenu(');
const hEnd=s.indexOf('// 모바일 앱 하단',hStart);
if(hStart<0||hEnd<0) throw new Error('HamburgerMenu anchors not found');
let h=s.slice(hStart,hEnd);
const hAnchor='    { key: "nearby", label: t.nearbyNav, Icon: MapPinIcon },';
if(!h.includes(hAnchor)) throw new Error('Hamburger nearby anchor not found');
h=h.replace(hAnchor,hAnchor+'\n    { key: "news", label: lang === "en" ? "Pet News" : "Pet뉴스", Icon: InfoIcon }, // '+marker);
s=s.slice(0,hStart)+h+s.slice(hEnd);

const mStart=s.indexOf('function MoreMenuPage(');
const mEnd=s.indexOf('\nfunction ',mStart+20);
if(mStart<0||mEnd<0) throw new Error('MoreMenuPage anchors not found');
let m=s.slice(mStart,mEnd);
const mAnchor='  const items = [';
if(!m.includes(mAnchor)) throw new Error('More menu items anchor not found');
m=m.replace(mAnchor,mAnchor+'\n    ["news","📰","Pet뉴스",lang==="en"?"Latest pet news":"반려견·반려묘·건강·정책 등 최신 뉴스"],');
s=s.slice(0,mStart)+m+s.slice(mEnd);

fs.writeFileSync(file,s);
console.log('PetNews added to mobile hamburger and app More menu.');
