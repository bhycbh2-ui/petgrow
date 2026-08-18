from pathlib import Path

APP=Path('src/App.jsx')
DAILY=Path('src/PetDailyWidgets.jsx')
MAIN=Path('src/main.jsx')
CSS=Path('src/runtime-hotfix-20260818-v2.css')

s=APP.read_text(encoding='utf-8')
d=DAILY.read_text(encoding='utf-8')
m=MAIN.read_text(encoding='utf-8')


def once(text,old,new,label):
    if old not in text:
        print(f'[skip] {label}')
        return text
    print(f'[ok] {label}')
    return text.replace(old,new,1)

# Common locale dictionary used by sidebar, hamburger, home and common heroes.
if 'PETGROW_RUNTIME_LOCALE_V2' not in s:
    locale='''\n/* PETGROW_RUNTIME_LOCALE_V2 */\nconst PG_UI={\nko:{petLife:'반려생활',content:'커뮤니티 · 콘텐츠',info:'정보 · 지원',about:'소개',pets:'우리 아이',nearby:'내 주변 Pet',music:'Pet음악',talk:'Pet톡',bti:'PetBTI',saju:'Pet사주',tarot:'Pet타로',tips:'Pet정보',news:'Pet뉴스',tagline:'우리 아이의 건강한 성장을 함께',day:'우리 아이와 더 행복한 하루',homeDesc:'우리 아이의 성장·음악·주변 시설·커뮤니티를 한곳에서 확인해요.',today:'오늘의 우리 아이',weight:'현재 체중',gender:'성별',type:'구분',add:'우리 아이를 등록해보세요',addDesc:'성장 기록과 맞춤 기능을 바로 시작할 수 있어요.',quick:'자주 사용하는 메뉴',wait:'결과를 준비하고 있어요',waitDesc:'우리 아이에게 맞는 내용을 불러오는 중이에요. 잠시만 기다려주세요.'},\nen:{petLife:'PET LIFE',content:'COMMUNITY · CONTENT',info:'INFO · SUPPORT',about:'About PetGrow',pets:'My Pets',nearby:'Nearby Pet',music:'Pet Music',talk:'Pet Talk',bti:'PetBTI',saju:'Pet Saju',tarot:'Pet Tarot',tips:'Pet Info',news:'Pet News',tagline:'Healthy growth, together',day:'A happier day with your pet',homeDesc:'Everything your pet needs, in one simple dashboard.',today:'TODAY WITH MY PET',weight:'Weight',gender:'Gender',type:'Type',add:'Add your pet',addDesc:'Start growth records and personalized features.',quick:'Quick access',wait:'Preparing your result',waitDesc:'We are loading your pet\\'s personalized result. Please wait a moment.'},\nja:{petLife:'ペットライフ',content:'コミュニティ・コンテンツ',info:'情報・サポート',about:'PetGrowについて',pets:'うちの子',nearby:'近くのPet',music:'Pet音楽',talk:'Petトーク',bti:'PetBTI',saju:'Pet占い',tarot:'Petタロット',tips:'Pet情報',news:'Petニュース',tagline:'うちの子の健やかな成長を一緒に',day:'うちの子ともっと幸せな一日',homeDesc:'成長・音楽・周辺施設・コミュニティをひとつの画面で確認できます。',today:'今日のうちの子',weight:'現在の体重',gender:'性別',type:'種類',add:'うちの子を登録しましょう',addDesc:'成長記録とパーソナライズ機能をすぐに始められます。',quick:'よく使うメニュー',wait:'結果を準備しています',waitDesc:'うちの子に合った内容を読み込んでいます。少しお待ちください。'},\nzh:{petLife:'宠物生活',content:'社区 · 内容',info:'信息 · 支持',about:'关于 PetGrow',pets:'我的宠物',nearby:'附近Pet',music:'Pet音乐',talk:'Pet社区',bti:'PetBTI',saju:'Pet命理',tarot:'Pet塔罗',tips:'Pet信息',news:'Pet新闻',tagline:'陪伴宠物健康成长',day:'和宠物一起度过更幸福的一天',homeDesc:'在一个页面查看成长、音乐、周边设施和社区内容。',today:'今天的宠物',weight:'当前体重',gender:'性别',type:'类型',add:'添加你的宠物',addDesc:'立即开始成长记录和个性化功能。',quick:'常用菜单',wait:'正在准备结果',waitDesc:'正在加载适合你宠物的内容，请稍等片刻。'}\n};\nfunction pgUi(lang,key){return PG_UI[lang]?.[key]||PG_UI.en[key]||PG_UI.ko[key]||key;}\nconst PG_HERO={\nja:{pets:['うちの子','基本情報、成長記録、写真、健康情報をひとつの場所で管理できます。'],community:['Petトーク','日常の出来事や質問、ペット暮らしの情報を気軽に共有しましょう。'],tips:['Pet情報','健康・食事・暮らし・しつけに役立つ情報をまとめています。'],saju:['Pet占い','うちの子の生年月日をもとに楽しく楽しめるコンテンツです。'],tarot:['Petタロット','今日のテーマに合わせてカードを選び、うちの子へのメッセージを確認しましょう。'],petbti:['PetBTI','行動に関する質問から、うちの子の個性を楽しくチェックできます。'],guide:['情報ガイド','PetGrowの主な機能と使い方をわかりやすく確認できます。'],my:['マイページ','会員情報、アクティビティ、お気に入りをまとめて管理できます。'],more:['その他','PetGrowの追加機能とサポートメニューを確認できます。'],nearby:['近くのPet','住所や現在地をもとに近くのペット関連施設を探せます。'],music:['Pet音楽','犬と猫のための音楽を聴き、お気に入りやコメントを楽しめます。'],news:['Petニュース','最新のペットニュースを読みやすくまとめています。'],support:['サポート','サービス利用中の質問やサポート依頼を送れます。'],'ad-inquiry':['広告・提携のお問い合わせ','PetGrowとの広告や提携についてお問い合わせください。']},\nzh:{pets:['我的宠物','在一个页面管理基本信息、成长记录、照片和健康信息。'],community:['Pet社区','轻松分享宠物日常、问题和养宠经验。'],tips:['Pet信息','查看健康、饮食、生活和训练等实用养宠信息。'],saju:['Pet命理','根据宠物生日体验轻松有趣的专属内容。'],tarot:['Pet塔罗','按今日主题选择卡牌，查看送给宠物的趣味信息。'],petbti:['PetBTI','通过行为问题了解宠物的个性特点。'],guide:['信息指南','快速了解 PetGrow 的主要功能和使用方法。'],my:['我的页面','统一管理账号信息、活动记录和收藏内容。'],more:['更多','查看 PetGrow 的更多功能和支持菜单。'],nearby:['附近Pet','根据地址或当前位置查找附近的宠物相关设施。'],music:['Pet音乐','收听犬猫音乐，并通过点赞和评论记录宠物反应。'],news:['Pet新闻','浏览最新宠物资讯。'],support:['客户支持','提交使用 PetGrow 时遇到的问题或需要的帮助。'],'ad-inquiry':['广告合作','联系 PetGrow 咨询广告与合作事项。']}\n};\nfunction pgHeroText(lang,view,x){const v=PG_HERO[lang]?.[view];return v?{title:v[0],desc:v[1]}:{title:lang==='en'?x.en:x.ko,desc:lang==='en'?x.enDesc:x.koDesc};}\n'''
    s=once(s,'\nfunction useT() {',locale+'\nfunction useT() {','locale helper')

# Mobile hamburger menu: consistent order + non-empty translation in all 4 languages.
hs=s.find('function HamburgerMenu(')
if hs>=0:
    gs=s.find('  const groups=[',hs)
    ge=s.find('  const Btn=',gs)
    if gs>=0 and ge>gs:
        block='''  const groups=[\n    {label:pgUi(lang,'petLife'),items:[{key:'about',label:pgUi(lang,'about'),Icon:InfoIcon},{key:'pets',label:pgUi(lang,'pets'),Icon:PawIcon},{key:'nearby',label:pgUi(lang,'nearby'),Icon:MapPinIcon}]},\n    {label:pgUi(lang,'content'),items:[{key:'community',label:pgUi(lang,'talk'),Icon:TalkIcon},{key:'music',label:pgUi(lang,'music'),Icon:MusicIcon},{key:'petbti',label:pgUi(lang,'bti'),Icon:PetBtiIcon},{key:'saju',label:pgUi(lang,'saju'),Icon:SajuIcon},{key:'tarot',label:pgUi(lang,'tarot'),Icon:SajuIcon}]},\n    {label:pgUi(lang,'info'),items:[{key:'tips',label:pgUi(lang,'tips'),Icon:LightbulbIcon},{key:'news',label:pgUi(lang,'news'),Icon:InfoIcon}]}\n  ];\n'''
        s=s[:gs]+block+s[ge:]
        print('[ok] hamburger locale/order')

# Desktop sidebar: same grouping/order as hamburger.
na=s.find('<nav className="petgrow-sidebar-nav petgrow-sidebar-nav-grouped">')
if na>=0:
    fs=s.find('<div className="sidebar-section-label">',na)
    nc=s.find('</nav>',fs)
    if fs>=0 and nc>fs:
        block='''<div className="sidebar-section-label">{pgUi(lang,'petLife')}</div>\n            <button className={view === "about" ? "active" : ""} onClick={() => goView("about")}><InfoIcon /><span>{pgUi(lang,'about')}</span></button>\n            <button className={view === "pets" ? "active" : ""} onClick={() => goView("pets")}><HeartOutlineIcon /><span>{pgUi(lang,'pets')}</span></button>\n            <button className={view === "nearby" ? "active" : ""} onClick={() => goView("nearby")}><MapPinIcon /><span>{pgUi(lang,'nearby')}</span></button>\n            <div className="sidebar-section-label">{pgUi(lang,'content')}</div>\n            <button className={view === "community" ? "active" : ""} onClick={() => goView("community")}><TalkIcon /><span>{pgUi(lang,'talk')}</span></button>\n            <button className={view === "music" ? "active" : ""} onClick={() => goView("music")}><MusicIcon /><span>{pgUi(lang,'music')}</span></button>\n            <button className={view === "petbti" ? "active" : ""} onClick={() => goView("petbti")}><PetBtiIcon /><span>{pgUi(lang,'bti')}</span></button>\n            <button className={view === "saju" ? "active" : ""} onClick={() => goView("saju")}><SajuIcon /><span>{pgUi(lang,'saju')}</span></button>\n            <button className={`tarot-nav ${view === "tarot" ? "active" : ""}`} onClick={() => goView("tarot")}><span className="sidebar-tarot-mark">🃏</span><span>{pgUi(lang,'tarot')}</span></button>\n            <div className="sidebar-section-label">{pgUi(lang,'info')}</div>\n            <button className={view === "tips" ? "active" : ""} onClick={() => goView("tips")}><LightbulbIcon /><span>{pgUi(lang,'tips')}</span></button>\n            <button className={view === "news" ? "active" : ""} onClick={() => goView("news")}><InfoIcon /><span>{pgUi(lang,'news')}</span></button>\n          '''
        s=s[:fs]+block+s[nc:]
        print('[ok] desktop sidebar locale/order')

# Common hero language fallback.
s=s.replace("{lang==='en'?x.en:x.ko}","{pgHeroText(lang,view,x).title}",1)
s=s.replace("{lang==='en'?x.enDesc:x.koDesc}","{pgHeroText(lang,view,x).desc}",1)

# Brand/home labels.
s=s.replace('{lang === "en" ? "Healthy growth, together" : "우리 아이의 건강한 성장을 함께"}',"{pgUi(lang,'tagline')}",1)
s=s.replace('{lang === "en" ? "A happier day with your pet" : "우리 아이와 더 행복한 하루"}',"{pgUi(lang,'day')}",1)
s=s.replace('{lang === "en" ? "Everything your pet needs, in one simple dashboard." : "우리 아이의 성장·음악·주변 시설·커뮤니티를 한곳에서 확인해요."}',"{pgUi(lang,'homeDesc')}",1)
s=s.replace('{lang === "en" ? "TODAY WITH MY PET" : "오늘의 우리 아이"}',"{pgUi(lang,'today')}",1)
s=s.replace('{lang === "en" ? "Weight" : "현재 체중"}',"{pgUi(lang,'weight')}",1)
s=s.replace('{lang === "en" ? "Gender" : "성별"}',"{pgUi(lang,'gender')}",1)
s=s.replace('{lang === "en" ? "Type" : "구분"}',"{pgUi(lang,'type')}",1)
s=s.replace('{lang === "en" ? "Quick access" : "자주 사용하는 메뉴"}',"{pgUi(lang,'quick')}",1)

# Home quick menu labels, including the previously blank EN Nearby entry.
qstart=s.find('  const allQuick = [')
qend=s.find('  const defaultQuickKeys=',qstart)
if qstart>=0 and qend>qstart:
    quick='''  const allQuick = [\n    ["pets","🐾",pgUi(lang,'pets')],["music","🎵",pgUi(lang,'music')],["news","📰",pgUi(lang,'news')],["nearby","📍",pgUi(lang,'nearby')],["community","💬",pgUi(lang,'talk')],["petbti","🧠",pgUi(lang,'bti')],["saju","🔮",pgUi(lang,'saju')],["tarot","🃏",pgUi(lang,'tarot')],["tips","💡",pgUi(lang,'tips')],["guide","📚",lang==='ja'?'情報ガイド':lang==='zh'?'信息指南':lang==='en'?'Guide':'정보가이드']\n  ];\n'''
    s=s[:qstart]+quick+s[qend:]

# Shared fixed loading overlay component.
if 'function PetFeatureLoadingOverlay' not in s:
    comp='''function PetFeatureLoadingOverlay({lang='ko'}){return <div className="pet-feature-loading-overlay" role="status" aria-live="polite"><div className="pet-feature-loading-card"><span className="pet-feature-spinner"/><b>{pgUi(lang,'wait')}</b><small>{pgUi(lang,'waitDesc')}</small></div></div>;}\n\n'''
    s=once(s,'function SajuPage({ pet, onGoRegister }) {',comp+'function SajuPage({ pet, onGoRegister }) {','loading component')

# Saju: clear stale result whenever selected pet/species changes.
needle='  const [compatResult, setCompatResult] = useState(null);'
if needle in s and 'PETGROW_SAJU_PET_RESET_V2' not in s:
    extra='''  const [compatResult, setCompatResult] = useState(null);\n  /* PETGROW_SAJU_PET_RESET_V2 */\n  const [featureLoading,setFeatureLoading]=useState(false);\n  const petResetKey=String(pet?.id||pet?.profile?.id||`${pet?.profile?.species||''}:${pet?.profile?.name||''}`);\n  useEffect(()=>{setInput(null);setModeRaw('menu');setCompatResult(null);setGuardianName('');setGuardianBirthDate('');setFeatureLoading(false);},[petResetKey]);'''
    s=s.replace(needle,extra,1)

s=s.replace('  if (input) return <SajuResultView input={input} onRestart={() => { setInput(null); setMode("menu"); }} />;',"  if (featureLoading) return <PetFeatureLoadingOverlay lang={lang} />;\n  if (input) return <SajuResultView input={input} onRestart={() => { setInput(null); setMode(\"menu\"); }} />;",1)
old_basic='''  const startBasic = async () => {try{const ref=`saju-basic:${pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"}`;await petPointSpend("saju_basic",ref)}catch(e){window.alert(e.message);return;}setInput({ name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, gender: pet.profile.gender, birthTime: "", breed: pet.profile.breedName, profileImage: pet.profile.profileImage || null });};'''
new_basic='''  const startBasic = async () => {setFeatureLoading(true);try{const ref=`saju-basic:${pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"}`;await petPointSpend("saju_basic",ref);await new Promise(r=>window.setTimeout(r,120));setInput({ name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, gender: pet.profile.gender, birthTime: "", breed: pet.profile.breedName, profileImage: pet.profile.profileImage || null });}catch(e){window.alert(e.message);}finally{setFeatureLoading(false);}};'''
s=once(s,old_basic,new_basic,'Saju basic loading')

# PetBTI: show a short wait panel before rendering the result and reset on pet switch.
s=s.replace('  const [liveResult, setLiveResult] = useState(null);','  const [liveResult, setLiveResult] = useState(null);\n  const [resultLoading,setResultLoading]=useState(false);',1)
s=s.replace('  const savedBti = pet && pet.petBti;','  const savedBti = pet && pet.petBti;\n  useEffect(()=>{setPhase("intro");setLiveResult(null);setResultLoading(false);},[pet?.id]);',1)
h=s.find('  const handleComplete = (answers) => {')
if h>=0:
    body=s.find('    const input = ',h)
    if body>=0:
        s=s[:body]+'    setResultLoading(true);\n    window.setTimeout(()=>{\n'+s[body:]
        h2=s.find('  const handleComplete = (answers) => {',h)
        phase=s.find('    setPhase("result");',h2)
        if phase>=0:
            end=phase+len('    setPhase("result");')
            s=s[:end]+'\n    setResultLoading(false);\n    },120);'+s[end:]
s=s.replace('  if (phase === "quiz") {','  if (resultLoading) return <PetFeatureLoadingOverlay lang={lang} />;\n\n  if (phase === "quiz") {',1)

# Tarot: add the same avatar/name position as Saju/BTI; CSS below turns its loading state into popup.
old_tarot='''      <small className="pet-daily-eyebrow">{lang==="en"?"PETGROW TAROT · 22 MAJOR ARCANA":"PETGROW 타로 · 메이저 아르카나 22장"}</small><h2>{petName}{lang==="en"?"'s Tarot":"의 Pet타로"}</h2>'''
new_tarot='''      <div className="feature-pet-header feature-pet-header-tarot"><span className="feature-pet-avatar">{pet?.profile?.profileImage?<img src={pet.profile.profileImage} alt=""/>:<span>{pet?.profile?.species==="cat"?"🐱":"🐶"}</span>}</span><strong>{petName}</strong></div>\n      <small className="pet-daily-eyebrow">{{ko:"PETGROW 타로 · 메이저 아르카나 22장",en:"PETGROW TAROT · 22 MAJOR ARCANA",ja:"PETGROW タロット · 大アルカナ22枚",zh:"PETGROW 塔罗 · 22张大阿尔卡那"}[lang]||"PETGROW TAROT · 22 MAJOR ARCANA"}</small><h2>{{ko:`${petName}의 Pet타로`,en:`${petName}'s Pet Tarot`,ja:`${petName}のPetタロット`,zh:`${petName}的Pet塔罗`}[lang]||`${petName}'s Pet Tarot`}</h2>'''
d=once(d,old_tarot,new_tarot,'Tarot avatar/header')

css='''/* PETGROW_RUNTIME_HOTFIX_V2 */\n.pet-feature-loading-overlay,.pet-tarot-loading{position:fixed!important;inset:0!important;z-index:9999!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(247,250,247,.78)!important;backdrop-filter:blur(7px)!important;color:#26342b!important}.pet-feature-loading-card{width:min(360px,calc(100vw - 40px));padding:28px 24px;border:1px solid #dce8de;border-radius:24px;background:#fff;box-shadow:0 22px 60px rgba(36,61,43,.14);display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px}.pet-feature-loading-card b{font-size:18px}.pet-feature-loading-card small{font-size:12px;line-height:1.65;color:#7b877f;word-break:keep-all}.pet-feature-spinner,.pet-tarot-loading:before{content:"";width:34px;height:34px;border:3px solid #dfe9e1;border-top-color:#4f8a5b;border-radius:50%;animation:pgspin .8s linear infinite;margin:0 10px 0 0;display:inline-block;vertical-align:middle}@keyframes pgspin{to{transform:rotate(360deg)}}\n@media(min-width:900px){.petgrow-web-layout .petgrow-page-top.pets-page-top{width:calc(100% - 40px)!important;max-width:1180px!important;margin:0 auto!important;padding:16px 20px 0!important;box-sizing:border-box!important}.petgrow-web-layout .petgrow-page-top.pets-page-top>.petgrow-unified-hero{width:100%!important;max-width:none!important;margin:0 0 18px!important}.petgrow-web-layout .petgrow-content-stage>.petgrow-unified-hero{width:calc(100% - 40px)!important;max-width:1180px!important;margin:0 auto 18px!important;box-sizing:border-box!important}}\n.feature-page-saju,.feature-page-tarot,.feature-page-petbti{width:100%!important;max-width:1180px!important;box-sizing:border-box!important}.feature-page-saju .feature-module-shell,.feature-page-tarot .feature-module-shell,.feature-page-petbti .feature-module-shell{width:100%!important;max-width:900px!important;margin:22px auto 0!important;box-sizing:border-box!important}.feature-page-saju .feature-module-shell{padding:28px!important;border:1px solid #dfe8e1!important;border-radius:24px!important;background:#fff!important;box-shadow:0 12px 34px rgba(38,65,46,.055)!important}.feature-page-petbti .feature-module-shell>.bg-card,.feature-page-tarot .pet-tarot-stage{width:100%!important;padding:28px!important;border:1px solid #dfe8e1!important;border-radius:24px!important;background:#fff!important;box-shadow:0 12px 34px rgba(38,65,46,.055)!important;box-sizing:border-box!important}.feature-pet-header{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:8px!important;margin:0 auto 12px!important;text-align:center!important}.feature-pet-avatar{width:68px!important;height:68px!important;border-radius:50%!important;overflow:hidden!important;display:grid!important;place-items:center!important;border:3px solid var(--primary)!important;background:var(--surface)!important;box-sizing:border-box!important}.feature-pet-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}.feature-pet-avatar>span{font-size:30px!important}.feature-pet-header strong{font-size:16px!important;font-weight:900!important}.feature-page-tarot .pet-daily-eyebrow{display:block;text-align:center}.feature-page-tarot .pet-tarot-stage>h2{text-align:center!important;margin:7px 0 14px!important}\n@media(max-width:899px){.feature-page-saju,.feature-page-tarot,.feature-page-petbti{padding-left:14px!important;padding-right:14px!important}.feature-page-saju .feature-module-shell,.feature-page-petbti .feature-module-shell>.bg-card,.feature-page-tarot .pet-tarot-stage{padding:20px 16px!important;border-radius:20px!important}}\n'''
CSS.write_text(css,encoding='utf-8')

if 'runtime-hotfix-20260818-v2.css' not in m:
    m=once(m,'import "./news-pettalk-tarot-20260818.css";\n','import "./news-pettalk-tarot-20260818.css";\nimport "./runtime-hotfix-20260818-v2.css";\n','CSS import')
m=m.replace('/sw.js?v=29','/sw.js?v=30')

APP.write_text(s,encoding='utf-8')
DAILY.write_text(d,encoding='utf-8')
MAIN.write_text(m,encoding='utf-8')
print('PetGrow runtime hotfix v2 applied')
