// PETGROW_FINAL_POLISH_TRIGGER_20260817_V3
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

const toggleLine="  const toggleQuick=(key)=>{if(quickKeys.includes(key))saveQuick(quickKeys.filter(k=>k!==key));else if(quickKeys.length<6)saveQuick([...quickKeys,key]);};";
if(app.includes(toggleLine)&&!app.includes('const moveQuick=')){
 app=app.replace(toggleLine,toggleLine+"\n  const moveQuick=(key,dir)=>{const i=quickKeys.indexOf(key);if(i<0)return;const j=dir==='first'?0:dir==='last'?quickKeys.length-1:i+(dir==='left'?-1:1);if(j<0||j>=quickKeys.length||j===i)return;const next=[...quickKeys];next.splice(i,1);next.splice(j,0,key);saveQuick(next);};");
}
const oldEdit=`{quickEditing&&<div className="bg-card" style={{padding:14,marginBottom:12}}><p className="bg-sub" style={{fontSize:12,margin:'0 0 10px'}}>{lang==='en'?'Choose up to six shortcuts. Signed-in choices sync to your account.':'원하는 메뉴를 최대 6개까지 선택할 수 있어요. 로그인하면 계정에 저장돼 다른 기기에서도 이어서 사용할 수 있어요.'}</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{allQuick.map(([key,icon,label])=><button type="button" key={key} className={\`bg-chip \${quickKeys.includes(key)?'active':''}\`} onClick={()=>toggleQuick(key)}>{icon} {label}</button>)}</div></div>}`;
const newEdit=`{quickEditing&&<div className="bg-card" style={{padding:14,marginBottom:12}}><p className="bg-sub" style={{fontSize:12,margin:'0 0 10px'}}>{lang==='en'?'Choose up to six shortcuts, then reorder them below. Signed-in choices sync to your account.':'원하는 메뉴를 최대 6개까지 선택한 뒤 아래에서 순서를 바꿀 수 있어요. 로그인하면 계정에 저장돼 다른 기기에서도 그대로 보여요.'}</p><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{allQuick.map(([key,icon,label])=><button type="button" key={key} className={\`bg-chip \${quickKeys.includes(key)?'active':''}\`} onClick={()=>toggleQuick(key)}>{icon} {label}</button>)}</div><div className="quick-order-list">{quick.map(([key,icon,label],i)=><div className="quick-order-row" key={key}><span><i>{icon}</i><b>{label}</b></span><div><button type="button" disabled={i===0} onClick={()=>moveQuick(key,'first')}>{lang==='en'?'First':'맨앞'}</button><button type="button" disabled={i===0} onClick={()=>moveQuick(key,'left')}>←</button><button type="button" disabled={i===quick.length-1} onClick={()=>moveQuick(key,'right')}>→</button><button type="button" disabled={i===quick.length-1} onClick={()=>moveQuick(key,'last')}>{lang==='en'?'Last':'맨뒤'}</button></div></div>)}</div></div>}`;
if(app.includes(oldEdit)) app=app.replace(oldEdit,newEdit);

const quickMarker='      <section className="dash-section"><div className="dash-section-head"><h2>{lang === "en" ? "Quick access" : "자주 사용하는 메뉴"}</h2>';
if(app.includes(quickMarker)&&!app.includes('<TodayPetHomeCard account={account}')) app=app.replace(quickMarker,'      <TodayPetHomeCard account={account} onOpenSaju={()=>onGoView("saju")} lang={lang} />\n\n'+quickMarker);
if(!app.includes('<PetDailyHistory account={account} lang={lang} />')){const likedIdx=app.indexOf('id="my-liked-music"');if(likedIdx>0){const close=app.indexOf('\n      </div>',likedIdx);if(close>0)app=app.slice(0,close)+'\n        <PetDailyHistory account={account} lang={lang} />'+app.slice(close);}}

app=app.replace('기본 Pet사주, 오늘의 펫운세, 보호자 궁합 중 원하는 콘텐츠를 골라 재미로 즐겨보세요.','기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합 중 원하는 콘텐츠를 골라 재미로 즐겨보세요.');
app=app.replace('Enjoy Pet Saju, today\'s fortune, or guardian compatibility for fun.','Enjoy Pet Saju, today\'s fortune, Pet Tarot, or guardian compatibility for fun.');
app=app.replace('{ title: "Pet사주", body: "등록한 우리 아이 정보를 바탕으로 성격과 특징을 재미로 살펴보는 콘텐츠예요. 실제 성격이나 미래를 판단하는 자료가 아니라 가볍게 즐기는 콘텐츠로 이용해 주세요." },','{ title: "Pet사주", body: "등록한 우리 아이 정보를 바탕으로 기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합을 재미로 즐길 수 있어요. 타로는 메이저 아르카나 22장의 전통적인 상징을 PetGrow식 반려생활 메시지로 재해석하며, 직전에 뽑은 카드와 같은 카드는 연속으로 나오지 않아요. 실제 성격이나 미래를 판단하는 자료는 아니에요." },');
app=app.replace('- Pet사주 등 저장이 필요한 서비스 정보\\','- Pet사주·오늘의 펫운세·저장한 Pet타로 등 저장이 필요한 서비스 정보\\');
app=app.replace('기본 Pet사주, 오늘의 펫운세, 보호자 궁합 및 PetBTI는 재미와 참고를 위한 콘텐츠','기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합 및 PetBTI는 재미와 참고를 위한 콘텐츠');
app=app.replace('Pet사주(기본 Pet사주·오늘의 펫운세·보호자 궁합), PetBTI','Pet사주(기본 Pet사주·오늘의 펫운세·오늘의 Pet타로·보호자 궁합), PetBTI');

if(!app.includes('{PET_DAILY_CSS}')){const styleTag='<style>{`';const i=app.indexOf(styleTag);if(i>=0) app=app.slice(0,i+styleTag.length)+'${PET_DAILY_CSS}\n'+app.slice(i+styleTag.length);}
if(!app.includes('PETGROW_UNIFIED_HEADER_TYPOGRAPHY_20260817')){
 const css=`\n/* PETGROW_UNIFIED_HEADER_TYPOGRAPHY_20260817 */\n.nearby-hero,.petmusic-hero,.petgrow-unified-hero,.more-menu-head{box-sizing:border-box;width:100%;text-align:left}\n.nearby-hero .nearby-eyebrow,.petgrow-unified-hero .nearby-eyebrow,.petmusic-hero>small,.more-menu-head>span{display:block;font-size:11px!important;line-height:1.25!important;font-weight:900!important;letter-spacing:.08em!important;text-transform:uppercase;margin:0 0 8px!important;color:var(--primary)!important}\n.nearby-hero h1,.petgrow-unified-hero h1,.petmusic-hero h1,.more-menu-head h1{font-family:inherit!important;font-size:28px!important;line-height:1.25!important;font-weight:900!important;letter-spacing:-.035em!important;margin:0 0 9px!important;padding:0!important;color:var(--text)!important;text-align:left!important;word-break:keep-all;overflow-wrap:anywhere}\n.nearby-hero p,.petgrow-unified-hero p,.petmusic-hero p,.more-menu-head p{font-family:inherit!important;font-size:14px!important;line-height:1.65!important;font-weight:500!important;margin:0!important;color:var(--sub)!important;text-align:left!important;word-break:keep-all;overflow-wrap:anywhere}\n.nearby-hero,.petgrow-unified-hero,.petmusic-hero{padding:24px!important;border-radius:24px!important;margin-bottom:18px!important;min-height:0!important}\n.quick-order-list{display:grid;gap:7px}.quick-order-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid var(--border);border-radius:13px;background:#fff}.quick-order-row>span{display:flex;align-items:center;gap:8px;min-width:0}.quick-order-row>span i{font-style:normal}.quick-order-row>span b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.quick-order-row>div{display:flex;gap:5px}.quick-order-row button{border:1px solid var(--border);background:#f8faf8;border-radius:9px;padding:6px 8px;font-size:11px;font-weight:800;cursor:pointer}.quick-order-row button:disabled{opacity:.35;cursor:default}\n@media(max-width:760px){.nearby-hero,.petgrow-unified-hero,.petmusic-hero{padding:20px!important;border-radius:20px!important;margin-bottom:14px!important}.nearby-hero h1,.petgrow-unified-hero h1,.petmusic-hero h1,.more-menu-head h1{font-size:23px!important;line-height:1.3!important;margin-bottom:7px!important}.nearby-hero p,.petgrow-unified-hero p,.petmusic-hero p,.more-menu-head p{font-size:13px!important;line-height:1.6!important}.nearby-hero .nearby-eyebrow,.petgrow-unified-hero .nearby-eyebrow,.petmusic-hero>small,.more-menu-head>span{font-size:10px!important;margin-bottom:7px!important}.quick-order-row{align-items:flex-start;flex-direction:column}.quick-order-row>div{width:100%}.quick-order-row button{flex:1;min-height:34px}}\n`;
 const marker='${PET_DAILY_CSS}\n';const i=app.indexOf(marker);if(i>=0)app=app.slice(0,i+marker.length)+css+app.slice(i+marker.length);
}

if(!core.includes('handleTarot')){core=mustReplace(core,'import proj4 from "proj4";','import proj4 from "proj4";\nimport { handleTarot } from "../server_lib/tarot.js";','core tarot import');core=mustReplace(core,'    if (route === "nearby-reviews") return await handleNearbyReviews(req, res);','    if (route === "nearby-reviews") return await handleNearbyReviews(req, res);\n    if (route === "tarot") return await handleTarot(req, res);','core tarot route');}

fs.writeFileSync('src/App.jsx',app);
fs.writeFileSync('api/core.js',core);
console.log('PetGrow final polish applied.');
