from pathlib import Path
import re
APP=Path('src/App.jsx'); MAIN=Path('src/main.jsx'); TAROT=Path('src/PetDailyWidgets.jsx'); COMM=Path('api/community.js'); PAPI=Path('api/points.js'); PLIB=Path('server_lib/points.js')
app=APP.read_text(encoding='utf-8'); main=MAIN.read_text(encoding='utf-8'); tarot=TAROT.read_text(encoding='utf-8'); comm=COMM.read_text(encoding='utf-8'); papi=PAPI.read_text(encoding='utf-8'); plib=PLIB.read_text(encoding='utf-8')
def rep(t,a,b,label):
 if a not in t: raise SystemExit('missing '+label)
 return t.replace(a,b,1)
def sub(t,p,r,label):
 o,n=re.subn(p,r,t,count=1,flags=re.S)
 if n!=1: raise SystemExit(f'{label} {n}')
 return o
if 'final-ux-20260818.css' not in main: main=rep(main,'import "./petgrow-premium-20260817.css";','import "./petgrow-premium-20260817.css";\nimport "./final-ux-20260818.css";','css import')
app=app.replace('submitEdit: "수정 완료",','submitEdit: "저장하기",',1).replace('onboardingConfirmEditTitle: "정보를 수정하시겠습니까?",','onboardingConfirmEditTitle: "저장하시겠습니까?",',1).replace('onboardingConfirmMessage: (name) => `${name}의 정보를 저장할게요. 계속할까요?`,','onboardingConfirmMessage: (name) => `수정한 ${name}의 정보를 저장합니다. 계속할까요?`,',1).replace('saveToastOk: "저장됐어요",','saveToastOk: "저장되었습니다.",',1)
helper='''function logPetActivity(payload={}) { try { fetch("/api/activity?action=log",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{}); } catch {} }\n\n'''
if 'function logPetActivity' not in app: app=rep(app,'function goToKakaoLogin() {',helper+'function goToKakaoLogin() {','activity helper')
loc='''STRINGS.ja={...STRINGS.en,cancel:"キャンセル",hamNavHome:"ホーム",myPetsNav:"うちの子",sajuNav:"Pet占い",petBtiNav:"PetBTI",tipsTitle:"Pet情報",communityNav:"Petトーク",nearbyNav:"近くのPet",nearbyTitle:"近くのPet",infoGuideTitle:"情報ガイド",myPageTitle:"マイページ",accountLoginBtn:"ログイン",accountLogoutBtn:"ログアウト",accountDeleteBtn:"退会",privacyFooterLink:"プライバシー",termsFooterLink:"利用規約",loginContinueKakao:"Kakaoで始める",homeGreeting:(n)=>`こんにちは、${n}さん！ 🐾`,submitEdit:"保存",onboardingConfirmEditTitle:"保存しますか？",onboardingConfirmMessage:(n)=>`${n}の情報を保存します。続けますか？`,saveToastOk:"保存しました。"};\nSTRINGS.zh={...STRINGS.en,cancel:"取消",hamNavHome:"首页",myPetsNav:"我的宠物",sajuNav:"Pet命理",petBtiNav:"PetBTI",tipsTitle:"Pet信息",communityNav:"Pet社区",nearbyNav:"附近Pet",nearbyTitle:"附近Pet",infoGuideTitle:"信息指南",myPageTitle:"我的页面",accountLoginBtn:"登录",accountLogoutBtn:"退出登录",accountDeleteBtn:"注销账号",privacyFooterLink:"隐私政策",termsFooterLink:"使用条款",loginContinueKakao:"使用Kakao开始",homeGreeting:(n)=>`你好，${n}！ 🐾`,submitEdit:"保存",onboardingConfirmEditTitle:"要保存吗？",onboardingConfirmMessage:(n)=>`将保存${n}的信息。是否继续？`,saveToastOk:"已保存。"};\n\n'''
if 'STRINGS.ja=' not in app: app=rep(app,'function useT() {\n  const lang = useLang();\n  return STRINGS[lang];\n}',loc+'function useT() {\n  const lang = useLang();\n  return STRINGS[lang] || STRINGS.ko;\n}','locale block')
app=sub(app,r'function LangToggle\(\{ lang, onChange \}\) \{.*?\n\}', '''function LangToggle({lang,onChange}){return <div className="lang-toggle" aria-label="Language"><button type="button" className={lang==="ko"?"active":""} onClick={()=>onChange("ko")}>KO</button><button type="button" className={lang==="en"?"active":""} onClick={()=>onChange("en")}>EN</button><button type="button" className={lang==="ja"?"active":""} onClick={()=>onChange("ja")} title="日本語">JA</button><button type="button" className={lang==="zh"?"active":""} onClick={()=>onChange("zh")} title="简体中文">中文</button></div>}''','lang toggle')
app=rep(app,'const [lang, setLang] = useState("ko");','const [lang, setLang] = useState(()=>{try{const v=localStorage.getItem("petgrow:lang");return ["ko","en","ja","zh"].includes(v)?v:"ko"}catch{return "ko"}});\n  useEffect(()=>{try{localStorage.setItem("petgrow:lang",lang)}catch{}},[lang]);','lang state')
old='const goView = (v) => { const next=(v==="talk"||v==="pettalk"||v==="pet-talk")?"community":v; setView(next); scrollToTop(); };'
new='const goView = (v) => { const next=(v==="talk"||v==="pettalk"||v==="pet-talk")?"community":v; setView(next); if(account?.id)logPetActivity({section:next,action:"view",title:({home:"홈",about:"소개",pets:"우리 아이",nearby:"내 주변 Pet",community:"Pet톡",saju:"Pet사주",tarot:"Pet타로",petbti:"PetBTI",music:"Pet음악",tips:"Pet정보",news:"Pet뉴스",guide:"정보가이드",my:"마이페이지",support:"고객지원"}[next]||next)}); scrollToTop(); };'
app=rep(app,old,new,'goView')
app=app.replace('{account?.name?.slice(0,1) || "🐾"}</button>','{"MY"}</button>',1)
app=sub(app,r'  const q=guideSearch\.trim\(\)\.toLowerCase\(\);\n  const filtered=guides\.filter\(g=>!q\|\|.*?\);','  const filtered=guides;','guide filter')
app=rep(app,'<><AdminReportsPage onBack={() => goView("my")} /><PetPointAdminOverview /></>','<AdminReportsPage onBack={() => goView("my")} />','admin leak')
app=rep(app,'{tab==="dashboard"&&<>\n     <div className="admin-stat-grid">','{tab==="dashboard"&&<>\n     <PetPointAdminOverview />\n     <div className="admin-stat-grid">','admin dashboard')
old_t='const chooseTopic=(key)=>{setTopic(key);setError("");const old=todayMap[key];if(old){setResult(old.result_json);setRecordId(old.id);setSaved(!!old.saved);setPhase("result");}else{setResult(null);setRecordId("");setSaved(false);setPicked(-1);setPhase("prompt");window.setTimeout(()=>setPhase("focus"),1600);window.setTimeout(()=>setPhase("shuffle"),3600);window.setTimeout(()=>setPhase("choose"),6800);}};'
new_t=old_t.replace('1600','650').replace('3600','1300').replace('6800','2300')
tarot=rep(tarot,old_t,new_t,'tarot timings')
tarot=tarot.replace('setPhase("reveal");window.setTimeout(()=>setPhase("result"),2800)},1400);','setPhase("reveal");window.setTimeout(()=>setPhase("result"),900)},500);',1)
comm=rep(comm,'const pointEvent = await awardPoints(uid, "community_comment", `comment:${comment.id}`).catch(()=>null);','const pointEvent = await awardPoints(uid, "community_comment", `comment-post:${postId}`).catch(()=>null);','comment reward')
comm=rep(comm,'if(ok) await revokePoints(uid,`comment:${id}`,"Pet톡 댓글 삭제로 포인트 회수").catch(()=>{});','// 댓글 적립은 게시글당 최초 1회만 인정하며 삭제 후 재작성해도 재적립되지 않도록 참조값을 유지합니다.','comment delete')
plib=rep(plib,'community_comment: { label: "Pet톡 댓글 작성", amount: 20, cap: 15 },','community_comment: { label: "Pet톡 댓글 작성", amount: 20, cap: 5 },','comment cap')
plib=plib.replace('하루 최대 15회','게시글당 최초 1회 · 하루 최대 5회').replace('하루 최대 50회','같은 글·같은 이용자 최초 1회 · 하루 최대 50회')
papi=rep(papi,'if(!["saju_basic","saju_daily","saju_compat"].includes(feature))','if(!["saju_basic","saju_daily","saju_compat","tarot"].includes(feature))','tarot spend')
if 'PETGROW_FINAL_UX_APPLIED_20260818' not in app: app+='\n/* PETGROW_FINAL_UX_APPLIED_20260818 */\n'
APP.write_text(app,encoding='utf-8'); MAIN.write_text(main,encoding='utf-8'); TAROT.write_text(tarot,encoding='utf-8'); COMM.write_text(comm,encoding='utf-8'); PAPI.write_text(papi,encoding='utf-8'); PLIB.write_text(plib,encoding='utf-8')
print('core patch ok')
