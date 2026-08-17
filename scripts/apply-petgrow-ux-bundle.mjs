import fs from 'node:fs';

const appFile='src/App.jsx';
const musicFile='api/music.js';
let s=fs.readFileSync(appFile,'utf8');
let music=fs.readFileSync(musicFile,'utf8');
const MARK='PETGROW_UX_BUNDLE_20260817';
if(s.includes(MARK)){console.log('UX bundle already applied');process.exit(0);}

function mustReplace(from,to,label){
  if(!s.includes(from)) throw new Error(`Missing App.jsx anchor: ${label}`);
  s=s.replace(from,to); console.log('Applied',label);
}
function maybeReplace(from,to,label){
  if(!s.includes(from)){console.warn('Skip optional',label);return false;}
  s=s.replace(from,to);console.log('Applied',label);return true;
}

const hero=`\n/* ${MARK} */\nfunction UnifiedMenuHero({ view, lang='ko' }) {\n  const meta={\n    pets:{eyebrow:'MY PET',ko:'우리 아이',en:'My Pet',koDesc:'반려동물의 기본정보부터 성장기록, 사진, 건강정보까지 한곳에서 관리해요.',enDesc:'Keep profiles, growth records, photos and care information together.'},\n    community:{eyebrow:'PETGROW TALK',ko:'Pet톡',en:'Pet Talk',koDesc:'우리 아이의 일상과 궁금한 점, 반려생활 정보를 회원들과 편하게 나눠보세요.',enDesc:'Share everyday moments, questions and useful pet-life tips.'},\n    tips:{eyebrow:'PETGROW INFO',ko:'Pet정보',en:'Pet Info',koDesc:'건강·식단·생활·훈련 등 반려생활에 바로 활용할 수 있는 정보를 모아봤어요.',enDesc:'Browse practical information for health, food, daily care and training.'},\n    saju:{eyebrow:'PETGROW CONTENT',ko:'Pet사주',en:'Pet Saju',koDesc:'우리 아이의 생년월일을 바탕으로 재미로 즐기는 특별한 이야기를 만나보세요.',enDesc:'Enjoy a lighthearted pet fortune story based on your pet profile.'},\n    petbti:{eyebrow:'PETGROW CONTENT',ko:'PetBTI',en:'PetBTI',koDesc:'강아지와 고양이의 행동 성향을 질문으로 살펴보고 우리 아이의 개성을 알아봐요.',enDesc:'Explore your pet’s personality through a simple behavior questionnaire.'},\n    guide:{eyebrow:'PETGROW GUIDE',ko:'정보가이드',en:'Guide',koDesc:'PetGrow의 주요 기능과 이용 방법을 한곳에서 쉽고 빠르게 확인해요.',enDesc:'See how PetGrow features work and how to use them.'},\n    my:{eyebrow:'PETGROW MY',ko:'마이페이지',en:'My Page',koDesc:'회원정보와 내가 남긴 활동, 좋아요한 콘텐츠를 한곳에서 관리해요.',enDesc:'Manage your account, activity and saved favorites.'},\n    more:{eyebrow:'PETGROW MENU',ko:'더보기',en:'More',koDesc:'PetGrow의 다양한 기능과 고객지원 메뉴를 한곳에서 확인해요.',enDesc:'Find additional PetGrow features and support options.'},\n    support:{eyebrow:'PETGROW SUPPORT',ko:'고객지원',en:'Support',koDesc:'서비스 이용 중 궁금한 점이나 도움이 필요한 내용을 남겨주세요.',enDesc:'Ask questions or get help using PetGrow.'},\n    'ad-inquiry':{eyebrow:'PETGROW PARTNERS',ko:'광고 문의',en:'Advertising',koDesc:'PetGrow와 함께할 광고·제휴 문의를 편하게 남겨주세요.',enDesc:'Contact PetGrow about advertising and partnership opportunities.'}\n  };\n  const x=meta[view]; if(!x)return null;\n  return <section className=\"nearby-hero bg-card petgrow-unified-hero\" style={{maxWidth:900,margin:'0 auto 18px'}}><div><span className=\"nearby-eyebrow\">{x.eyebrow}</span><h1>{lang==='en'?x.en:x.ko}</h1><p>{lang==='en'?x.enDesc:x.koDesc}</p>{view==='pets'&&<small className=\"nearby-search-help\">🐾 {lang==='en'?'Register dogs and cats separately and keep their changes organized over time.':'강아지와 고양이 정보를 각각 등록하고 우리 아이의 변화를 차곡차곡 기록해보세요.'}</small>}</div></section>;\n}\n\n`;

mustReplace('\nfunction HomePage({ account, pets = [], lang, onGoPets, onGoView }) {',`\n${hero}function HomePage({ account, pets = [], lang, onGoPets, onGoView }) {`,'unified hero component');

mustReplace(`        {effectiveView === \"pets\" && (\n          <SpeciesTabBar species={species} dogCount={pets.dog.length} catCount={pets.cat.length}\n            onChange={(s) => { setSpecies(s); setMode(\"view\"); }} />\n        )}`,
`        {effectiveView === \"pets\" && <>\n          <UnifiedMenuHero view=\"pets\" lang={lang} />\n          <SpeciesTabBar species={species} dogCount={pets.dog.length} catCount={pets.cat.length}\n            onChange={(s) => { setSpecies(s); setMode(\"view\"); }} />\n        </>}`,'pets hero');

mustReplace('      <div className="petgrow-content-stage">',`      <div className=\"petgrow-content-stage\">\n      {[\"community\",\"tips\",\"saju\",\"petbti\",\"guide\",\"my\",\"more\",\"support\",\"ad-inquiry\"].includes(effectiveView) && <UnifiedMenuHero view={effectiveView} lang={lang} />}`,'other menu heroes');

const quickRe=/  const quick = \[[\s\S]*?\n  \];\n  return \(/;
const quickMatch=s.match(quickRe);
if(!quickMatch)throw new Error('Missing Home quick menu block');
const quickNew=`  const allQuick = [\n    [\"pets\", \"🐾\", lang === \"en\" ? \"My Pet\" : \"우리 아이\"],\n    [\"music\", \"🎵\", lang === \"en\" ? \"Pet Music\" : \"Pet음악\"],\n    [\"news\", \"📰\", lang === \"en\" ? \"Pet News\" : \"Pet뉴스\"],\n    [\"nearby\", \"📍\", lang === \"en\" ? \"Nearby Pet\" : \"내 주변 Pet\"],\n    [\"community\", \"💬\", lang === \"en\" ? \"Pet Talk\" : \"Pet톡\"],\n    [\"petbti\", \"🧠\", \"PetBTI\"],\n    [\"saju\", \"🔮\", lang === \"en\" ? \"Pet Saju\" : \"Pet사주\"],\n    [\"tips\", \"💡\", lang === \"en\" ? \"Pet Info\" : \"Pet정보\"],\n    [\"guide\", \"📚\", lang === \"en\" ? \"Guide\" : \"정보가이드\"]\n  ];\n  const defaultQuickKeys=[\"pets\",\"music\",\"news\",\"nearby\",\"community\",\"petbti\"];\n  const quickStorageKey=account?.id?\`petgrow_quick_\${account.id}\`:\"petgrow_quick_guest\";\n  const [quickKeys,setQuickKeys]=useState(()=>{try{const v=JSON.parse(localStorage.getItem(quickStorageKey)||\"null\");return Array.isArray(v)&&v.length?v.slice(0,6):defaultQuickKeys;}catch{return defaultQuickKeys;}});\n  const [quickEditing,setQuickEditing]=useState(false);\n  useEffect(()=>{\n    let cancelled=false;\n    if(!account?.id)return;\n    fetch('/api/core?action=state&key=home_quick_menu').then(r=>r.ok?r.json():null).then(j=>{if(cancelled)return;const v=j?.value;if(Array.isArray(v)&&v.length)setQuickKeys(v.filter(k=>allQuick.some(x=>x[0]===k)).slice(0,6));}).catch(()=>{});\n    return()=>{cancelled=true};\n  },[account?.id]);\n  const saveQuick=(next)=>{const clean=next.filter(k=>allQuick.some(x=>x[0]===k)).slice(0,6);setQuickKeys(clean);try{localStorage.setItem(quickStorageKey,JSON.stringify(clean));}catch{}if(account?.id)fetch('/api/core?action=state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'home_quick_menu',value:clean})}).catch(()=>{});};\n  const toggleQuick=(key)=>{if(quickKeys.includes(key))saveQuick(quickKeys.filter(k=>k!==key));else if(quickKeys.length<6)saveQuick([...quickKeys,key]);};\n  const quick=quickKeys.map(k=>allQuick.find(x=>x[0]===k)).filter(Boolean);\n  return (`;
s=s.replace(quickRe,quickNew);
console.log('Applied customizable home quick menu');

const quickSection=`      <section className=\"dash-section\"><div className=\"dash-section-head\"><h2>{lang === \"en\" ? \"Quick access\" : \"자주 사용하는 메뉴\"}</h2><span>{lang === \"en\" ? \"Tap to open\" : \"빠르게 이동\"}</span></div><div className=\"dash-quick-grid\">{quick.map(([key,icon,label])=><button type=\"button\" key={key} onClick={()=>key===\"pets\"?onGoPets():key===\"more\"?onGoView(\"more\"):onGoView(key)}><i>{icon}</i><span>{label}</span></button>)}</div></section>`;
if(!s.includes(quickSection))throw new Error('Missing exact quick section');
const quickSectionNew=`      <section className=\"dash-section\"><div className=\"dash-section-head\"><h2>{lang === \"en\" ? \"Quick access\" : \"자주 사용하는 메뉴\"}</h2><button type=\"button\" className=\"bg-chip\" onClick={()=>setQuickEditing(v=>!v)}>{quickEditing?(lang==='en'?'Done':'완료'):(lang==='en'?'Edit':'편집')}</button></div>{quickEditing&&<div className=\"bg-card\" style={{padding:14,marginBottom:12}}><p className=\"bg-sub\" style={{fontSize:12,margin:'0 0 10px'}}>원하는 메뉴를 최대 6개까지 선택할 수 있어요. 로그인하면 계정에 저장돼 다른 기기에서도 이어서 사용할 수 있어요.</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{allQuick.map(([key,icon,label])=><button type=\"button\" key={key} className={\`bg-chip \${quickKeys.includes(key)?'active':''}\`} onClick={()=>toggleQuick(key)}>{icon} {label}</button>)}</div></div>}<div className=\"dash-quick-grid\">{quick.map(([key,icon,label])=><button type=\"button\" key={key} onClick={()=>key===\"pets\"?onGoPets():onGoView(key)}><i>{icon}</i><span>{label}</span></button>)}</div></section>`;
s=s.replace(quickSection,quickSectionNew);console.log('Applied quick menu editor UI');

// GPS follow mode for Nearby Pet
mustReplace('  const requestSeq=useRef(0);',`  const requestSeq=useRef(0);\n  const [followMyLocation,setFollowMyLocation]=useState(true);\n  const locationWatchId=useRef(null);`,'nearby follow state');

const locateEffect='  useEffect(()=>{ if(!locationRequested.current){locationRequested.current=true;locate();} },[]);';
if(!s.includes(locateEffect))throw new Error('Missing location initial effect');
const watchEffect=`  useEffect(()=>{\n    if(!followMyLocation||!navigator.geolocation)return;\n    locationWatchId.current=navigator.geolocation.watchPosition(p=>{\n      const c={lat:p.coords.latitude,lng:p.coords.longitude};\n      setPositionAccuracy(Math.round(Number(p.coords.accuracy)||0));\n      setPos(c);\n      setItems(prev=>{\n        const updated=(prev||[]).map(x=>({...x,userDistance:calcClientDistance(c.lat,c.lng,Number(x.lat),Number(x.lng))})).sort((a,b)=>(a.userDistance??1e12)-(b.userDistance??1e12));\n        const mc=mapObj.current?.getCenter?.();\n        let center=c;\n        if(!followMyLocation&&mc){center={lat:typeof mc.lat==='function'?mc.lat():mc.lat,lng:typeof mc.lng==='function'?mc.lng():mc.lng};}\n        loadMap(center,updated,c,false).catch(()=>{});\n        return updated;\n      });\n    },()=>{}, {enableHighAccuracy:true,maximumAge:15000,timeout:10000});\n    return()=>{if(locationWatchId.current!=null){navigator.geolocation.clearWatch(locationWatchId.current);locationWatchId.current=null;}};\n  },[followMyLocation]);\n  ${locateEffect}`;
s=s.replace(locateEffect,watchEffect);console.log('Applied GPS watchPosition');

const searchRowEnd='</button></div>\n    <ResponsiveCategoryMenu className="nearby-responsive-categories"';
if(!s.includes(searchRowEnd))throw new Error('Missing nearby search row end');
s=s.replace(searchRowEnd,`</button></div>\n    <div style={{display:'flex',justifyContent:'flex-end',margin:'8px 0 10px'}}><button type=\"button\" className={\`bg-chip \${followMyLocation?'active':''}\`} onClick={()=>setFollowMyLocation(v=>!v)}>📍 내 위치 따라가기 {followMyLocation?'ON':'OFF'}</button></div>\n    <ResponsiveCategoryMenu className=\"nearby-responsive-categories\"`);console.log('Applied follow toggle UI');

// Music pagination: 10 tracks per page.
if(!music.includes('pageSize=20'))throw new Error('Missing music pageSize anchor');
music=music.replace('pageSize=20','pageSize=10');
console.log('Applied music page size 10');

fs.writeFileSync(appFile,s);fs.writeFileSync(musicFile,music);\nconsole.log('PetGrow UX bundle applied successfully');
