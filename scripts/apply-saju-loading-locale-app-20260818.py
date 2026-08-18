from pathlib import Path
import re

APP = Path('src/App.jsx')
DAILY = Path('src/PetDailyWidgets.jsx')
MAIN = Path('src/main.jsx')
CSS = Path('src/feature-unify-locale-20260818.css')

s = APP.read_text(encoding='utf-8')
d = DAILY.read_text(encoding='utf-8')
m = MAIN.read_text(encoding='utf-8')


def replace_once(text, old, new, label, required=True):
    count = text.count(old)
    if count == 0:
        if required:
            raise RuntimeError(f'{label}: target not found')
        return text
    if count > 1:
        raise RuntimeError(f'{label}: target found {count} times')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=0, required=True):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count == 0 and required:
        raise RuntimeError(f'{label}: pattern not found')
    return out


# -----------------------------------------------------------------------------
# Locale safety: navigation/common hero copy must never be blank or fall back to
# Korean when EN/JA/ZH is selected.
# -----------------------------------------------------------------------------
locale_block = r'''

/* PETGROW_LOCALE_SAFETY_20260818 */
Object.assign(STRINGS.en,{
  nearbyNav:"Nearby Pet",nearbyTitle:"Nearby Pet",aboutNav:"About PetGrow",
  myPetsNav:"My Pets",communityNav:"Pet Talk",sajuNav:"Pet Saju",petBtiNav:"PetBTI",tipsTitle:"Pet Info"
});
Object.assign(STRINGS.ja,{
  nearbyNav:"近くのPet",nearbyTitle:"近くのPet",aboutNav:"PetGrowについて",
  myPetsNav:"うちの子",communityNav:"Petトーク",sajuNav:"Pet占い",petBtiNav:"PetBTI",tipsTitle:"Pet情報"
});
Object.assign(STRINGS.zh,{
  nearbyNav:"附近Pet",nearbyTitle:"附近Pet",aboutNav:"关于 PetGrow",
  myPetsNav:"我的宠物",communityNav:"Pet社区",sajuNav:"Pet命理",petBtiNav:"PetBTI",tipsTitle:"Pet信息"
});

const UI_LOCALE={
  ko:{home:"Home",sectionPetLife:"반려생활",sectionContent:"커뮤니티 · 콘텐츠",sectionInfo:"정보 · 지원",about:"소개",pets:"우리 아이",nearby:"내 주변 Pet",music:"Pet음악",community:"Pet톡",petbti:"PetBTI",saju:"Pet사주",tarot:"Pet타로",tips:"Pet정보",news:"Pet뉴스",tagline:"우리 아이의 건강한 성장을 함께",dayMessage:"우리 아이와 더 행복한 하루",homeSubtitle:"우리 아이의 성장·음악·주변 시설·커뮤니티를 한곳에서 확인해요.",welcome:"오늘도 우리 아이와 행복한 하루 🐾",todayPet:"오늘의 우리 아이",weight:"현재 체중",gender:"성별",type:"구분",addPet:"우리 아이를 등록해보세요",addPetDesc:"성장 기록과 맞춤 기능을 바로 시작할 수 있어요.",quickAccess:"자주 사용하는 메뉴",loadingTitle:"결과를 준비하고 있어요",loadingDesc:"우리 아이에게 맞는 내용을 불러오는 중이에요. 잠시만 기다려주세요."},
  en:{home:"Home",sectionPetLife:"PET LIFE",sectionContent:"COMMUNITY · CONTENT",sectionInfo:"INFO · SUPPORT",about:"About PetGrow",pets:"My Pets",nearby:"Nearby Pet",music:"Pet Music",community:"Pet Talk",petbti:"PetBTI",saju:"Pet Saju",tarot:"Pet Tarot",tips:"Pet Info",news:"Pet News",tagline:"Healthy growth, together",dayMessage:"A happier day with your pet",homeSubtitle:"Everything your pet needs, in one simple dashboard.",welcome:"Welcome to PetGrow! 🐾",todayPet:"TODAY WITH MY PET",weight:"Weight",gender:"Gender",type:"Type",addPet:"Add your pet",addPetDesc:"Start growth records and personalized features.",quickAccess:"Quick access",loadingTitle:"Preparing your result",loadingDesc:"We are loading your pet's personalized result. Please wait a moment."},
  ja:{home:"ホーム",sectionPetLife:"ペットライフ",sectionContent:"コミュニティ・コンテンツ",sectionInfo:"情報・サポート",about:"PetGrowについて",pets:"うちの子",nearby:"近くのPet",music:"Pet音楽",community:"Petトーク",petbti:"PetBTI",saju:"Pet占い",tarot:"Petタロット",tips:"Pet情報",news:"Petニュース",tagline:"うちの子の健やかな成長を一緒に",dayMessage:"うちの子ともっと幸せな一日",homeSubtitle:"成長・音楽・周辺施設・コミュニティをひとつの画面で確認できます。",welcome:"今日もうちの子と幸せな一日を 🐾",todayPet:"今日のうちの子",weight:"現在の体重",gender:"性別",type:"種類",addPet:"うちの子を登録しましょう",addPetDesc:"成長記録とパーソナライズ機能をすぐに始められます。",quickAccess:"よく使うメニュー",loadingTitle:"結果を準備しています",loadingDesc:"うちの子に合った内容を読み込んでいます。少しお待ちください。"},
  zh:{home:"首页",sectionPetLife:"宠物生活",sectionContent:"社区 · 内容",sectionInfo:"信息 · 支持",about:"关于 PetGrow",pets:"我的宠物",nearby:"附近Pet",music:"Pet音乐",community:"Pet社区",petbti:"PetBTI",saju:"Pet命理",tarot:"Pet塔罗",tips:"Pet信息",news:"Pet新闻",tagline:"陪伴宠物健康成长",dayMessage:"和宠物一起度过更幸福的一天",homeSubtitle:"在一个页面查看成长、音乐、周边设施和社区内容。",welcome:"今天也和宠物一起度过幸福的一天 🐾",todayPet:"今天的宠物",weight:"当前体重",gender:"性别",type:"类型",addPet:"添加你的宠物",addPetDesc:"立即开始成长记录和个性化功能。",quickAccess:"常用菜单",loadingTitle:"正在准备结果",loadingDesc:"正在加载适合你宠物的内容，请稍等片刻。"}
};
function uiText(lang,key){return UI_LOCALE[lang]?.[key]||UI_LOCALE.en[key]||UI_LOCALE.ko[key]||key;}

const UI_HERO_LOCALE={
  ja:{
    pets:{title:"うちの子",desc:"基本情報、成長記録、写真、健康情報をひとつの場所で管理できます。"},
    community:{title:"Petトーク",desc:"日常の出来事や質問、ペット暮らしの情報を気軽に共有しましょう。"},
    tips:{title:"Pet情報",desc:"健康・食事・暮らし・しつけに役立つ情報をまとめています。"},
    saju:{title:"Pet占い",desc:"うちの子の生年月日をもとに、楽しく楽しめる特別なストーリーを見てみましょう。"},
    tarot:{title:"Petタロット",desc:"今日のテーマに合わせてカードを選び、うちの子へのメッセージを確認しましょう。"},
    petbti:{title:"PetBTI",desc:"行動に関する質問から、うちの子の個性を楽しくチェックできます。"},
    guide:{title:"情報ガイド",desc:"PetGrowの主な機能と使い方をわかりやすく確認できます。"},
    my:{title:"マイページ",desc:"会員情報、アクティビティ、お気に入りをまとめて管理できます。"},
    more:{title:"その他",desc:"PetGrowの追加機能とサポートメニューを確認できます。"},
    nearby:{title:"近くのPet",desc:"住所や現在地をもとに近くのペット関連施設を探せます。"},
    music:{title:"Pet音楽",desc:"犬と猫のための音楽を聴き、お気に入りやコメントを楽しめます。"},
    news:{title:"Petニュース",desc:"犬・猫・健康・制度など最新のペットニュースを読みやすくまとめています。"},
    support:{title:"サポート",desc:"サービス利用中の質問やサポート依頼を送れます。"},
    "ad-inquiry":{title:"広告・提携のお問い合わせ",desc:"PetGrowとの広告や提携についてお問い合わせください。"}
  },
  zh:{
    pets:{title:"我的宠物",desc:"在一个页面管理基本信息、成长记录、照片和健康信息。"},
    community:{title:"Pet社区",desc:"轻松分享宠物日常、问题和养宠经验。"},
    tips:{title:"Pet信息",desc:"查看健康、饮食、生活和训练等实用养宠信息。"},
    saju:{title:"Pet命理",desc:"根据宠物生日体验轻松有趣的专属内容。"},
    tarot:{title:"Pet塔罗",desc:"按今日主题选择卡牌，查看送给宠物的趣味信息。"},
    petbti:{title:"PetBTI",desc:"通过行为问题了解宠物的个性特点。"},
    guide:{title:"信息指南",desc:"快速了解 PetGrow 的主要功能和使用方法。"},
    my:{title:"我的页面",desc:"统一管理账号信息、活动记录和收藏内容。"},
    more:{title:"更多",desc:"查看 PetGrow 的更多功能和支持菜单。"},
    nearby:{title:"附近Pet",desc:"根据地址或当前位置查找附近的宠物相关设施。"},
    music:{title:"Pet音乐",desc:"收听犬猫音乐，并通过点赞和评论记录宠物反应。"},
    news:{title:"Pet新闻",desc:"浏览犬猫、健康、政策等最新宠物资讯。"},
    support:{title:"客户支持",desc:"提交使用 PetGrow 时遇到的问题或需要的帮助。"},
    "ad-inquiry":{title:"广告合作",desc:"联系 PetGrow 咨询广告与合作事项。"}
  }
};
'''

if 'PETGROW_LOCALE_SAFETY_20260818' not in s:
    s = replace_once(s, '\nfunction useT() {', locale_block + '\nfunction useT() {', 'insert locale safety block')

# Hamburger grouping + translation + previously requested menu order.
ham_pattern = r'''  const groups=\[[\s\S]*?\n  \];\n  const Btn='''
ham_repl = '''  const groups=[
    {label:uiText(lang,"sectionPetLife"),items:[{key:"about",label:uiText(lang,"about"),Icon:InfoIcon},{key:"pets",label:uiText(lang,"pets"),Icon:PawIcon},{key:"nearby",label:uiText(lang,"nearby"),Icon:MapPinIcon}]},
    {label:uiText(lang,"sectionContent"),items:[{key:"community",label:uiText(lang,"community"),Icon:TalkIcon},{key:"music",label:uiText(lang,"music"),Icon:MusicIcon},{key:"petbti",label:uiText(lang,"petbti"),Icon:PetBtiIcon},{key:"saju",label:uiText(lang,"saju"),Icon:SajuIcon},{key:"tarot",label:uiText(lang,"tarot"),Icon:SajuIcon}]},
    {label:uiText(lang,"sectionInfo"),items:[{key:"tips",label:uiText(lang,"tips"),Icon:LightbulbIcon},{key:"news",label:uiText(lang,"news"),Icon:InfoIcon}]}
  ];
  const Btn='''
# Narrow replacement to HamburgerMenu only.
ham_start = s.find('function HamburgerMenu(')
if ham_start < 0:
    raise RuntimeError('HamburgerMenu not found')
ham_end = s.find('\n}', ham_start)
ham_chunk = s[ham_start:ham_end+2]
ham_new, ham_count = re.subn(ham_pattern, ham_repl, ham_chunk, count=1)
if ham_count != 1:
    raise RuntimeError(f'Hamburger groups replacement count={ham_count}')
s = s[:ham_start] + ham_new + s[ham_end+2:]

# Desktop sidebar: exact same order and translations as mobile hamburger.
nav_anchor = '<nav className="petgrow-sidebar-nav petgrow-sidebar-nav-grouped">'
nav_start = s.find(nav_anchor)
if nav_start < 0:
    raise RuntimeError('desktop sidebar nav not found')
first_section = s.find('<div className="sidebar-section-label">', nav_start)
nav_close = s.find('</nav>', first_section)
if first_section < 0 or nav_close < 0:
    raise RuntimeError('desktop sidebar section range not found')
new_sidebar = '''<div className="sidebar-section-label">{uiText(lang,"sectionPetLife")}</div>
            <button className={view === "about" ? "active" : ""} onClick={() => goView("about")}><InfoIcon /><span>{uiText(lang,"about")}</span></button>
            <button className={view === "pets" ? "active" : ""} onClick={() => goView("pets")}><HeartOutlineIcon /><span>{uiText(lang,"pets")}</span></button>
            <button className={view === "nearby" ? "active" : ""} onClick={() => goView("nearby")}><MapPinIcon /><span>{uiText(lang,"nearby")}</span></button>
            <div className="sidebar-section-label">{uiText(lang,"sectionContent")}</div>
            <button className={view === "community" ? "active" : ""} onClick={() => goView("community")}><TalkIcon /><span>{uiText(lang,"community")}</span></button>
            <button className={view === "music" ? "active" : ""} onClick={() => goView("music")}><MusicIcon /><span>{uiText(lang,"music")}</span></button>
            <button className={view === "petbti" ? "active" : ""} onClick={() => goView("petbti")}><PetBtiIcon /><span>{uiText(lang,"petbti")}</span></button>
            <button className={view === "saju" ? "active" : ""} onClick={() => goView("saju")}><SajuIcon /><span>{uiText(lang,"saju")}</span></button>
            <button className={`tarot-nav ${view === "tarot" ? "active" : ""}`} onClick={() => goView("tarot")}><span className="sidebar-tarot-mark">🃏</span><span>{uiText(lang,"tarot")}</span></button>
            <div className="sidebar-section-label">{uiText(lang,"sectionInfo")}</div>
            <button className={view === "tips" ? "active" : ""} onClick={() => goView("tips")}><LightbulbIcon /><span>{uiText(lang,"tips")}</span></button>
            <button className={view === "news" ? "active" : ""} onClick={() => goView("news")}><InfoIcon /><span>{uiText(lang,"news")}</span></button>
          '''
s = s[:first_section] + new_sidebar + s[nav_close:]

s = s.replace('{lang === "en" ? "Healthy growth, together" : "우리 아이의 건강한 성장을 함께"}', '{uiText(lang,"tagline")}', 1)
s = s.replace('{lang === "en" ? "A happier day with your pet" : "우리 아이와 더 행복한 하루"}', '{uiText(lang,"dayMessage")}', 1)

# Common menu hero: use JA/ZH translations instead of silently falling back to Korean.
hero_old = '''  const x=meta[view]; if(!x)return null;
  return <section className="nearby-hero bg-card petgrow-unified-hero" style={{width:'100%',maxWidth:'none',margin:'0 0 18px'}}><div><span className="nearby-eyebrow">{x.eyebrow}</span><h1>{lang==='en'?x.en:x.ko}</h1><p>{lang==='en'?x.enDesc:x.koDesc}</p>{view==='pets'&&<small className="nearby-search-help">🐾 {lang==='en'?'Register dogs and cats separately and keep their changes organized over time.':'강아지와 고양이 정보를 각각 등록하고 우리 아이의 변화를 차곡차곡 기록해보세요.'}</small>}</div></section>;'''
hero_new = '''  const x=meta[view]; if(!x)return null;
  const localizedHero=UI_HERO_LOCALE[lang]?.[view];
  const petsHelp={ko:'강아지와 고양이 정보를 각각 등록하고 우리 아이의 변화를 차곡차곡 기록해보세요.',en:'Register dogs and cats separately and keep their changes organized over time.',ja:'犬と猫をそれぞれ登録して、うちの子の変化を少しずつ記録しましょう。',zh:'分别登记犬猫信息，持续记录宠物的成长变化。'}[lang]||'Register dogs and cats separately and keep their changes organized over time.';
  return <section className="nearby-hero bg-card petgrow-unified-hero" style={{width:'100%',maxWidth:'none',margin:'0 0 18px'}}><div><span className="nearby-eyebrow">{x.eyebrow}</span><h1>{localizedHero?.title||(lang==='en'?x.en:x.ko)}</h1><p>{localizedHero?.desc||(lang==='en'?x.enDesc:x.koDesc)}</p>{view==='pets'&&<small className="nearby-search-help">🐾 {petsHelp}</small>}</div></section>;'''
s = replace_once(s, hero_old, hero_new, 'localize common menu hero')

# Home: no KO fallback for JA/ZH and no blank EN Nearby menu.
s = replace_once(s,
'''  const petName = pet ? normalizePetDisplayText(pet.profile?.name, lang === "en" ? "My Pet" : "우리 아이") : "";''',
'''  const petName = pet ? normalizePetDisplayText(pet.profile?.name, uiText(lang,"pets")) : "";''',
'home pet fallback')

all_quick_pattern = r'''  const allQuick = \[[\s\S]*?\n  \];\n  const defaultQuickKeys'''
all_quick_repl = '''  const allQuick = [
    ["pets", "🐾", uiText(lang,"pets")],
    ["music", "🎵", uiText(lang,"music")],
    ["news", "📰", uiText(lang,"news")],
    ["nearby", "📍", uiText(lang,"nearby")],
    ["community", "💬", uiText(lang,"community")],
    ["petbti", "🧠", uiText(lang,"petbti")],
    ["saju", "🔮", uiText(lang,"saju")],
    ["tarot", "🃏", uiText(lang,"tarot")],
    ["tips", "💡", uiText(lang,"tips")],
    ["about", "ℹ️", uiText(lang,"about")],
  ];
  const defaultQuickKeys'''
s = sub_once(s, all_quick_pattern, all_quick_repl, 'localize home quick menu')

s = replace_once(s,
'''<h1>{accountName ? t.homeGreeting(accountName) : (lang === "en" ? "Welcome to PetGrow! 🐾" : "오늘도 우리 아이와 행복한 하루 🐾")}</h1><p>{lang === "en" ? "Everything your pet needs, in one simple dashboard." : "우리 아이의 성장·음악·주변 시설·커뮤니티를 한곳에서 확인해요."}</p>''',
'''<h1>{accountName ? t.homeGreeting(accountName) : uiText(lang,"welcome")}</h1><p>{uiText(lang,"homeSubtitle")}</p>''',
'localize home greeting body')

s = s.replace('<small>{lang === "en" ? "TODAY WITH MY PET" : "오늘의 우리 아이"}</small>', '<small>{uiText(lang,"todayPet")}</small>', 1)
s = s.replace('<small>{lang === "en" ? "Weight" : "현재 체중"}</small>', '<small>{uiText(lang,"weight")}</small>', 1)
s = s.replace('<small>{lang === "en" ? "Gender" : "성별"}</small>', '<small>{uiText(lang,"gender")}</small>', 1)
s = s.replace('<small>{lang === "en" ? "Type" : "구분"}</small>', '<small>{uiText(lang,"type")}</small>', 1)
s = s.replace('<h2>{lang === "en" ? "Add your pet" : "우리 아이를 등록해보세요"}</h2><p>{lang === "en" ? "Start growth records and personalized features." : "성장 기록과 맞춤 기능을 바로 시작할 수 있어요."}</p>', '<h2>{uiText(lang,"addPet")}</h2><p>{uiText(lang,"addPetDesc")}</p>', 1)
s = s.replace('{lang === "en" ? "Quick access" : "자주 사용하는 메뉴"}', '{uiText(lang,"quickAccess")}', 1)

# -----------------------------------------------------------------------------
# Shared result loading overlay for Pet Saju / PetBTI.
# -----------------------------------------------------------------------------
loading_component = r'''
function PetFeatureLoadingOverlay({lang='ko'}){
  return <div className="pet-feature-loading-overlay" role="status" aria-live="polite"><div className="pet-feature-loading-card"><span className="pet-feature-spinner"/><b>{uiText(lang,"loadingTitle")}</b><small>{uiText(lang,"loadingDesc")}</small></div></div>;
}

'''
if 'function PetFeatureLoadingOverlay' not in s:
    s = replace_once(s, 'function SajuPage({ pet, onGoRegister }) {', loading_component + 'function SajuPage({ pet, onGoRegister }) {', 'insert feature loading component')

# Pet Saju: switching dog/cat/pet must clear the previous pet's result.
saju_state_pattern = r'''  const \[input, setInput\] = useState\(null\);\n  const \[mode, setModeRaw\] = useState\("menu"\);\n  const setMode=\(next\)=>\{[^\n]+\};\n  const \[guardianName, setGuardianName\] = useState\(""\);\n  const \[guardianBirthDate, setGuardianBirthDate\] = useState\(""\);\n  const \[compatResult, setCompatResult\] = useState\(null\);'''
saju_state_repl = '''  const [input, setInput] = useState(null);
  const [mode, setModeRaw] = useState("menu");
  const [guardianName, setGuardianName] = useState("");
  const [guardianBirthDate, setGuardianBirthDate] = useState("");
  const [compatResult, setCompatResult] = useState(null);
  const [featureLoading,setFeatureLoading]=useState(false);
  const petKey=String(pet?.id||pet?.profile?.id||`${pet?.profile?.species||""}:${pet?.profile?.name||""}`);
  const setMode=(next)=>{if(next==="daily"||next==="fortune"){const ref=`saju-daily:${pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"}:${petPointKstDate()}`;setFeatureLoading(true);petPointSpend("saju_daily",ref).then(()=>setModeRaw(next)).catch(e=>window.alert(e.message)).finally(()=>setFeatureLoading(false));return;}setModeRaw(next);};
  useEffect(()=>{setInput(null);setModeRaw("menu");setCompatResult(null);setGuardianName("");setGuardianBirthDate("");setFeatureLoading(false);},[petKey]);'''
s = sub_once(s, saju_state_pattern, saju_state_repl, 'reset Pet Saju when pet changes')

s = replace_once(s,
'''  if (input) return <SajuResultView input={input} onRestart={() => { setInput(null); setMode("menu"); }} />;''',
'''  if (featureLoading) return <PetFeatureLoadingOverlay lang={lang} />;
  if (input) return <SajuResultView input={input} onRestart={() => { setInput(null); setMode("menu"); }} />;''',
'Saju loading overlay')

start_basic_pattern = r'''  const startBasic = async \(\) => \{try\{const ref=`saju-basic:[^\n]+?\};\n  const modes = \['''
start_basic_repl = '''  const startBasic = async () => {
    setFeatureLoading(true);
    try{
      const ref=`saju-basic:${pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"}`;
      await petPointSpend("saju_basic",ref);
      await new Promise(resolve=>window.setTimeout(resolve,180));
      setInput({ name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, gender: pet.profile.gender, birthTime: "", breed: pet.profile.breedName, profileImage: pet.profile.profileImage || null });
    }catch(e){window.alert(e.message);}
    finally{setFeatureLoading(false);}
  };
  const modes = ['''
s = sub_once(s, start_basic_pattern, start_basic_repl, 'Saju basic loading state')

# Compatibility point call also shows the same wait overlay.
compat_old = '''      try{const ref=`saju-compat:${pet?.id||pet?.profile?.id||petName}:${guardianBirthDate}:${name.toLowerCase()}`;await petPointSpend("saju_compat",ref)}catch(e){window.alert(e.message);return;}'''
compat_new = '''      setFeatureLoading(true);
      try{const ref=`saju-compat:${pet?.id||pet?.profile?.id||petName}:${guardianBirthDate}:${name.toLowerCase()}`;await petPointSpend("saju_compat",ref)}catch(e){window.alert(e.message);return;}finally{setFeatureLoading(false);}'''
s = replace_once(s, compat_old, compat_new, 'Saju compatibility loading', required=False)

# PetBTI: short transition overlay while generating/saving result, and reset when pet changes.
s = replace_once(s,
'''  const [phase, setPhase] = useState("intro"); // intro | quiz | result
  const [liveResult, setLiveResult] = useState(null);''',
'''  const [phase, setPhase] = useState("intro"); // intro | quiz | result
  const [liveResult, setLiveResult] = useState(null);
  const [resultLoading,setResultLoading]=useState(false);''',
'PetBTI loading state')

s = replace_once(s,
'''  const savedBti = pet && pet.petBti;

  const handleComplete = (answers) => {
    const input = { name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, profileImage: pet.profile.profileImage || null };''',
'''  const savedBti = pet && pet.petBti;
  useEffect(()=>{setPhase("intro");setLiveResult(null);setResultLoading(false);},[pet?.id]);

  const handleComplete = (answers) => {
    setResultLoading(true);
    window.setTimeout(()=>{
    const input = { name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, profileImage: pet.profile.profileImage || null };''',
'PetBTI result transition start')

s = replace_once(s,
'''    setPhase("result");
  }

  if (phase === "quiz") {''',
'''    setPhase("result");
    setResultLoading(false);
    },180);
  }

  if (resultLoading) return <PetFeatureLoadingOverlay lang={lang} />;
  if (phase === "quiz") {''',
'PetBTI result transition finish')

# -----------------------------------------------------------------------------
# Tarot: same avatar placement, same wait overlay, localized JA/ZH topic/menu copy.
# -----------------------------------------------------------------------------
if 'PETGROW_TAROT_LOCALE_20260818' not in d:
    d = replace_once(d, 'async function jsonFetch(url,options={}){', '''/* PETGROW_TAROT_LOCALE_20260818 */
const TAROT_UI={
  ko:{eyebrow:"PETGROW 타로 · 메이저 아르카나 22장",title:n=>`${n}의 Pet타로`,intro:"주제마다 하루에 한 번씩 뽑을 수 있어요. 오늘 뽑은 카드는 같은 날 다시 바뀌지 않아요.",checking:"오늘의 Pet타로 기록을 확인하는 중…",drawing:"선택한 카드를 천천히 펼치는 중…",waitTitle:"결과를 준비하고 있어요",waitDesc:"우리 아이에게 맞는 타로 메시지를 불러오는 중이에요. 잠시만 기다려주세요."},
  en:{eyebrow:"PETGROW TAROT · 22 MAJOR ARCANA",title:n=>`${n}'s Pet Tarot`,intro:"You can draw once per topic each day. Today's card stays the same for the rest of the day.",checking:"Checking today's Pet Tarot…",drawing:"Opening your selected card…",waitTitle:"Preparing your result",waitDesc:"We are loading your pet's Tarot message. Please wait a moment."},
  ja:{eyebrow:"PETGROW タロット · 大アルカナ22枚",title:n=>`${n}のPetタロット`,intro:"テーマごとに1日1回カードを引けます。今日のカードは同じ日の間は変わりません。",checking:"今日のPetタロットを確認しています…",drawing:"選んだカードを開いています…",waitTitle:"結果を準備しています",waitDesc:"うちの子へのタロットメッセージを読み込んでいます。少しお待ちください。"},
  zh:{eyebrow:"PETGROW 塔罗 · 22张大阿尔卡那",title:n=>`${n}的Pet塔罗`,intro:"每个主题每天可抽取一次，同一天内抽到的牌不会改变。",checking:"正在查看今天的Pet塔罗…",drawing:"正在翻开你选择的卡牌…",waitTitle:"正在准备结果",waitDesc:"正在加载宠物的塔罗信息，请稍等片刻。"}
};
const TAROT_TOPICS={
  ko:[{key:"daily",icon:"☀️",label:"오늘의 Pet타로",desc:"오늘 하루의 흐름과 작은 행운 포인트"},{key:"bond",icon:"💞",label:"보호자 궁합 타로",desc:"오늘 보호자와 우리 아이의 교감 포인트"},{key:"heart",icon:"💗",label:"우리 아이 마음 타로",desc:"오늘 우리 아이의 마음을 이해하는 힌트"},{key:"activity",icon:"🌿",label:"산책·활동 타로",desc:"산책과 놀이에 어울리는 오늘의 흐름"},{key:"advice",icon:"✨",label:"오늘의 조언 타로",desc:"보호자가 챙기면 좋은 작은 포인트"}],
  en:[{key:"daily",icon:"☀️",label:"Today's Pet Tarot",desc:"A small hint for today's flow and luck"},{key:"bond",icon:"💞",label:"Guardian Bond Tarot",desc:"A clue for today's bond with your pet"},{key:"heart",icon:"💗",label:"Pet Heart Tarot",desc:"A hint for understanding your pet today"},{key:"activity",icon:"🌿",label:"Walk & Activity Tarot",desc:"Today's flow for walks and play"},{key:"advice",icon:"✨",label:"Today's Advice Tarot",desc:"A small point for the guardian to remember"}],
  ja:[{key:"daily",icon:"☀️",label:"今日のPetタロット",desc:"今日の流れと小さな幸運のヒント"},{key:"bond",icon:"💞",label:"飼い主との絆タロット",desc:"今日のコミュニケーションのヒント"},{key:"heart",icon:"💗",label:"うちの子の気持ちタロット",desc:"今日の気持ちを理解するヒント"},{key:"activity",icon:"🌿",label:"散歩・活動タロット",desc:"散歩や遊びに合う今日の流れ"},{key:"advice",icon:"✨",label:"今日のアドバイスタロット",desc:"飼い主が覚えておきたい小さなポイント"}],
  zh:[{key:"daily",icon:"☀️",label:"今日Pet塔罗",desc:"今天的节奏与小幸运提示"},{key:"bond",icon:"💞",label:"主人缘分塔罗",desc:"今天与宠物互动的提示"},{key:"heart",icon:"💗",label:"宠物心情塔罗",desc:"理解宠物今天心情的提示"},{key:"activity",icon:"🌿",label:"散步·活动塔罗",desc:"适合今天散步和玩耍的节奏"},{key:"advice",icon:"✨",label:"今日建议塔罗",desc:"主人今天可以留意的小提示"}]
};
function tarotCopy(lang){return TAROT_UI[lang]||TAROT_UI.en;}
function TarotLoadingOverlay({lang}){const c=tarotCopy(lang);return <div className="pet-feature-loading-overlay" role="status" aria-live="polite"><div className="pet-feature-loading-card"><span className="pet-feature-spinner"/><b>{c.waitTitle}</b><small>{c.waitDesc}</small></div></div>}

async function jsonFetch(url,options={}){''', 'insert Tarot locale/loading helpers')

    # Remove old single-language TAROT_TOPICS array now that localized map is above.
    d = sub_once(d, r'''\nconst TAROT_TOPICS=\[[\s\S]*?\n\];\nconst CARD_BACKS=''', '\nconst CARD_BACKS=', 'replace old Tarot topics')

# PetTarotPanel uses per-language topic list.
d = replace_once(d,
'''  const petId=String(pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"),petName=String(pet?.profile?.name||"우리 아이");''',
'''  const petId=String(pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"),petName=String(pet?.profile?.name||"우리 아이");
  const topics=TAROT_TOPICS[lang]||TAROT_TOPICS.en;
  const copy=tarotCopy(lang);''',
'Tarot localized topic source')
d = d.replace('const currentTopic=TAROT_TOPICS.find(x=>x.key===topic)||TAROT_TOPICS[0];', 'const currentTopic=topics.find(x=>x.key===topic)||topics[0];', 1)
d = d.replace('{TAROT_TOPICS.map(x=>', '{topics.map(x=>', 1)

# Add avatar/name in same position and shape as Saju/BTI + global loading overlay.
tarot_stage_old = '''    <div className="bg-card pet-tarot-stage">
      <small className="pet-daily-eyebrow">{lang==="en"?"PETGROW TAROT · 22 MAJOR ARCANA":"PETGROW 타로 · 메이저 아르카나 22장"}</small><h2>{petName}{lang==="en"?"'s Tarot":"의 Pet타로"}</h2>'''
tarot_stage_new = '''    {(loadingToday||phase==="drawing")&&<TarotLoadingOverlay lang={lang}/>} 
    <div className="bg-card pet-tarot-stage">
      <div className="feature-pet-header feature-pet-header-tarot"><span className="feature-pet-avatar">{pet?.profile?.profileImage?<img src={pet.profile.profileImage} alt=""/>:<span>{pet?.profile?.species==="cat"?"🐱":"🐶"}</span>}</span><strong>{petName}</strong></div>
      <small className="pet-daily-eyebrow">{copy.eyebrow}</small><h2>{copy.title(petName)}</h2>'''
d = replace_once(d, tarot_stage_old, tarot_stage_new, 'Tarot unified pet header')
d = d.replace('''<p className="bg-sub pet-tarot-intro">주제마다 하루에 한 번씩 뽑을 수 있어요. 오늘 뽑은 카드는 같은 날 다시 바뀌지 않아요.</p>''', '''<p className="bg-sub pet-tarot-intro">{copy.intro}</p>''', 1)
d = d.replace('''{loadingToday&&<div className="pet-tarot-loading">오늘의 Pet타로 기록을 확인하는 중…</div>}''', '''{loadingToday&&<div className="pet-tarot-loading">{copy.checking}</div>}''', 1)
d = d.replace('''{phase==="drawing"&&<div className="pet-tarot-loading">선택한 카드를 천천히 펼치는 중…</div>}''', '''{phase==="drawing"&&<div className="pet-tarot-loading">{copy.drawing}</div>}''', 1)
d = d.replace('{result.topicLabel||currentTopic.label}', '{currentTopic.label}', 1)

# -----------------------------------------------------------------------------
# CSS: title alignment + identical feature shell/card/avatar geometry + overlay.
# -----------------------------------------------------------------------------
css = r'''/* PetGrow feature/title unification 2026-08-18 */
.pet-feature-loading-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;background:rgba(247,250,247,.74);backdrop-filter:blur(7px)}
.pet-feature-loading-card{width:min(360px,calc(100vw - 40px));padding:28px 24px;border:1px solid #dce8de;border-radius:24px;background:#fff;box-shadow:0 22px 60px rgba(36,61,43,.14);display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px}
.pet-feature-loading-card b{font-size:18px;letter-spacing:-.025em}.pet-feature-loading-card small{font-size:12px;line-height:1.65;color:#7b877f;word-break:keep-all}
.pet-feature-spinner{width:34px;height:34px;border:3px solid #dfe9e1;border-top-color:#4f8a5b;border-radius:50%;animation:petFeatureSpin .8s linear infinite;margin-bottom:4px}@keyframes petFeatureSpin{to{transform:rotate(360deg)}}

/* Our Pets hero now uses exactly the same content width/position as Nearby Pet and other common heroes. */
@media(min-width:900px){
  .petgrow-web-layout .petgrow-page-top.pets-page-top{width:calc(100% - 40px)!important;max-width:1180px!important;margin:0 auto!important;padding:16px 20px 0!important;box-sizing:border-box!important}
  .petgrow-web-layout .petgrow-page-top.pets-page-top>.petgrow-unified-hero{width:100%!important;max-width:none!important;margin:0 0 18px!important;box-sizing:border-box!important}
  .petgrow-web-layout .petgrow-content-stage>.petgrow-unified-hero{width:calc(100% - 40px)!important;max-width:1180px!important;margin:0 auto 18px!important;box-sizing:border-box!important}
}

/* Pet Saju / Pet Tarot / PetBTI share one visual system. */
.feature-page-saju,.feature-page-tarot,.feature-page-petbti{width:100%!important;max-width:1180px!important;box-sizing:border-box!important}
.feature-page-saju .feature-module-shell,.feature-page-tarot .feature-module-shell,.feature-page-petbti .feature-module-shell{width:100%!important;max-width:900px!important;margin:22px auto 0!important;box-sizing:border-box!important}
.feature-page-saju .feature-module-shell{padding:28px!important;border:1px solid #dfe8e1!important;border-radius:24px!important;background:#fff!important;box-shadow:0 12px 34px rgba(38,65,46,.055)!important}
.feature-page-petbti .feature-module-shell>.bg-card,.feature-page-tarot .pet-tarot-stage{width:100%!important;min-height:0!important;padding:28px!important;border:1px solid #dfe8e1!important;border-radius:24px!important;background:#fff!important;box-shadow:0 12px 34px rgba(38,65,46,.055)!important;box-sizing:border-box!important}
.feature-page-saju .bg-surface-card,.feature-page-petbti .bg-surface-card,.feature-page-tarot .pet-tarot-topic{border-radius:18px!important}
.feature-pet-header,.feature-pet-header-tarot{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:8px!important;margin:0 auto 12px!important;text-align:center!important}
.feature-pet-avatar,.feature-pet-header-tarot .feature-pet-avatar{width:68px!important;height:68px!important;border-radius:50%!important;overflow:hidden!important;display:grid!important;place-items:center!important;border:3px solid var(--primary)!important;background:var(--surface)!important;box-sizing:border-box!important}
.feature-pet-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;display:block!important}.feature-pet-avatar>span{font-size:30px!important;line-height:1!important}
.feature-pet-header strong{font-size:16px!important;font-weight:900!important;color:var(--text)!important}
.feature-page-tarot .pet-tarot-stage>h2,.feature-page-petbti .feature-module-shell h2,.feature-page-saju .feature-module-shell h2{font-family:inherit!important;letter-spacing:-.03em!important}
.feature-page-tarot .pet-daily-eyebrow{display:block;text-align:center}.feature-page-tarot .pet-tarot-stage>h2{text-align:center!important;margin:7px 0 14px!important}

@media(max-width:899px){
  .feature-page-saju,.feature-page-tarot,.feature-page-petbti{padding-left:14px!important;padding-right:14px!important}
  .feature-page-saju .feature-module-shell,.feature-page-tarot .feature-module-shell,.feature-page-petbti .feature-module-shell{margin-top:14px!important}
  .feature-page-saju .feature-module-shell,.feature-page-petbti .feature-module-shell>.bg-card,.feature-page-tarot .pet-tarot-stage{padding:20px 16px!important;border-radius:20px!important}
}
'''
CSS.write_text(css, encoding='utf-8')

# Load CSS last so it safely overrides older conflicting design rules, and bump SW cache.
if 'feature-unify-locale-20260818.css' not in m:
    m = replace_once(m, 'import "./news-pettalk-tarot-20260818.css";\n', 'import "./news-pettalk-tarot-20260818.css";\nimport "./feature-unify-locale-20260818.css";\n', 'import final feature CSS')
m = m.replace('/sw.js?v=29', '/sw.js?v=30')

APP.write_text(s, encoding='utf-8')
DAILY.write_text(d, encoding='utf-8')
MAIN.write_text(m, encoding='utf-8')
print('Applied PetGrow 2026-08-18 Saju/loading/locale/feature UI batch')
