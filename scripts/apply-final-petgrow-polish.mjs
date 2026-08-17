// PETGROW_FINAL_POLISH_TRIGGER_20260817
import fs from 'node:fs';

function mustReplace(s,from,to,label){if(!s.includes(from))throw new Error(`missing ${label}`);return s.replace(from,to);}
let app=fs.readFileSync('src/App.jsx','utf8');
let core=fs.readFileSync('api/core.js','utf8');

if(!app.includes('from "./PetDailyWidgets.jsx"')){
 app=mustReplace(app,'import { SplashScreen } from "@capacitor/splash-screen";','import { SplashScreen } from "@capacitor/splash-screen";\nimport { DailyFortunePanel, PetTarotPanel, TodayPetHomeCard, PetDailyHistory, PET_DAILY_CSS } from "./PetDailyWidgets.jsx";','daily widgets import');
}
app=app.replace('<h1>🎵 {lang==="en"?"Pet Music":"Pet음악"}</h1>','<h1>{lang==="en"?"Pet Music":"Pet음악"}</h1>');
app=app.replace('style={{maxWidth:900,margin:\'0 auto 18px\'}}','style={{width:\'100%\',maxWidth:\'none\',margin:\'0 0 18px\'}}');

const dailyStart='  if (mode === "daily") return <div className="feature-module-shell">';
const compatStart='  if (mode === "compat") {';
if(app.includes(dailyStart)&&app.includes(compatStart)){
 const a=app.indexOf(dailyStart),b=app.indexOf(compatStart,a);
 app=app.slice(0,a)+'  if (mode === "daily") return <DailyFortunePanel pet={pet} lang={lang} message={dailyMessages[idx]} onBack={() => setMode("menu")} />;\n\n  if (mode === "tarot") return <PetTarotPanel pet={pet} lang={lang} onBack={() => setMode("menu")} />;\n\n'+app.slice(b);
}
const dailyMode='    { id: "daily", icon: "🌤️", title: lang === "en" ? "Today\'s Pet Fortune" : "오늘의 펫운세", desc: lang === "en" ? "A light daily fortune for your pet" : "오늘 우리 아이에게 어울리는 행운 메시지를 확인해요.", bg: "#F5F8F4", click: () => setMode("daily") },';
if(app.includes(dailyMode)&&!app.includes('{ id: "tarot", icon: "🃏"')){
 app=app.replace(dailyMode,dailyMode+'\n    { id: "tarot", icon: "🃏", title: lang === "en" ? "Today\'s Pet Tarot" : "오늘의 Pet타로", desc: lang === "en" ? "Pick a Major Arcana card and read today\'s message" : "마음이 가는 카드를 골라 오늘의 메시지를 확인해요.", bg: "#F7F3EB", click: () => setMode("tarot") },');
}
app=app.replace('Choose one of three fun contents.','Choose one of four fun contents.');

const quickMarker='      <section className="dash-section"><div className="dash-section-head"><h2>{lang === "en" ? "Quick access" : "자주 사용하는 메뉴"}</h2>';
if(app.includes(quickMarker)&&!app.includes('<TodayPetHomeCard account={account}')){
 app=app.replace(quickMarker,'      <TodayPetHomeCard account={account} onOpenSaju={()=>onGoView("saju")} lang={lang} />\n\n'+quickMarker);
}

if(!app.includes('<PetDailyHistory account={account} lang={lang} />')){
 const likedIdx=app.indexOf('id="my-liked-music"');
 if(likedIdx>0){const close=app.indexOf('\n      </div>',likedIdx);if(close>0)app=app.slice(0,close)+'\n        <PetDailyHistory account={account} lang={lang} />'+app.slice(close);}
}

app=app.replace('기본 Pet사주, 오늘의 펫운세, 보호자 궁합 중 원하는 콘텐츠를 골라 재미로 즐겨보세요.','기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합 중 원하는 콘텐츠를 골라 재미로 즐겨보세요.');
app=app.replace('Enjoy Pet Saju, today\'s fortune, or guardian compatibility for fun.','Enjoy Pet Saju, today\'s fortune, Pet Tarot, or guardian compatibility for fun.');
app=app.replace('{ title: "Pet사주", body: "등록한 우리 아이 정보를 바탕으로 성격과 특징을 재미로 살펴보는 콘텐츠예요. 실제 성격이나 미래를 판단하는 자료가 아니라 가볍게 즐기는 콘텐츠로 이용해 주세요." },','{ title: "Pet사주", body: "등록한 우리 아이 정보를 바탕으로 기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합을 재미로 즐길 수 있어요. 타로는 메이저 아르카나 22장의 전통적인 상징을 PetGrow식 반려생활 메시지로 재해석하며, 직전에 뽑은 카드와 같은 카드는 연속으로 나오지 않아요. 실제 성격이나 미래를 판단하는 자료는 아니에요." },');
app=app.replace('- Pet사주 등 저장이 필요한 서비스 정보\\','- Pet사주·오늘의 펫운세·저장한 Pet타로 등 저장이 필요한 서비스 정보\\');
app=app.replace('기본 Pet사주, 오늘의 펫운세, 보호자 궁합 및 PetBTI는 재미와 참고를 위한 콘텐츠','기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합 및 PetBTI는 재미와 참고를 위한 콘텐츠');
app=app.replace('Pet사주(기본 Pet사주·오늘의 펫운세·보호자 궁합), PetBTI','Pet사주(기본 Pet사주·오늘의 펫운세·오늘의 Pet타로·보호자 궁합), PetBTI');

if(!app.includes('{PET_DAILY_CSS}')){
 const styleTag='<style>{`';
 const i=app.indexOf(styleTag);
 if(i>=0) app=app.slice(0,i+styleTag.length)+'${PET_DAILY_CSS}\n'+app.slice(i+styleTag.length);
}

if(!core.includes('handleTarot')){
 core=mustReplace(core,'import proj4 from "proj4";','import proj4 from "proj4";\nimport { handleTarot } from "../server_lib/tarot.js";','core tarot import');
 core=mustReplace(core,'    if (route === "nearby-reviews") return await handleNearbyReviews(req, res);','    if (route === "nearby-reviews") return await handleNearbyReviews(req, res);\n    if (route === "tarot") return await handleTarot(req, res);','core tarot route');
}

fs.writeFileSync('src/App.jsx',app);
fs.writeFileSync('api/core.js',core);
console.log('PetGrow final polish applied.');
