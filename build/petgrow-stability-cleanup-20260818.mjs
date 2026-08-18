export default function petgrowStabilityCleanup(){
  return {
    name:"petgrow-stability-cleanup-20260818",
    enforce:"pre",
    transform(code,id){
      const norm=String(id||"").replaceAll("\\","/");
      let out=code;

      if(norm.endsWith("/src/App.jsx")){
        // Language policy: KO / EN only in every surface (web, mobile web, native app).
        out=out.replace(
          /function LangToggle\(\{lang,onChange\}\)\{return <div className="lang-toggle"[\s\S]*?<\/div>\}/,
          'function LangToggle({lang,onChange}){return <div className="lang-toggle" aria-label="Language"><button type="button" className={lang==="ko"?"active":""} onClick={()=>onChange("ko")}>KO</button><button type="button" className={lang==="en"?"active":""} onClick={()=>onChange("en")}>EN</button></div>}'
        );
        out=out.replace(
          'const [lang, setLang] = useState(()=>{try{const v=localStorage.getItem("petgrow:lang");return ["ko","en","ja","zh"].includes(v)?v:"ko"}catch{return "ko"}});',
          'const [lang, setLang] = useState(()=>{try{const v=localStorage.getItem("petgrow:lang");return ["ko","en"].includes(v)?v:"ko"}catch{return "ko"}});'
        );

        // Storage policy: cloud + account-scoped local safety copy.
        out=out.replace(
          /async function safeGet\(key, account\) \{[\s\S]*?\n\}\nasync function safeSet\(key, value, account\) \{[\s\S]*?\n\}/,
`function accountLocalStateKey(key, account) {
  return account?.id ? \`${'${key}'}:account:${'${account.id}'}\` : key;
}
async function safeGet(key, account) {
  if (!account) return localGet(key);
  const shadowKey = accountLocalStateKey(key, account);
  const shadowValue = await localGet(shadowKey);
  const cloudValue = await cloudGet(key);

  if (cloudValue === null || cloudValue === undefined) return shadowValue;

  // A failed/slow cloud save must never turn a just-registered local pet into a false empty state.
  if ((key === "bboggl:dogs" || key === "bboggl:cats") &&
      Array.isArray(shadowValue) && shadowValue.length > 0 &&
      Array.isArray(cloudValue) && cloudValue.length < shadowValue.length) {
    cloudSet(key, shadowValue).catch(() => {});
    return shadowValue;
  }

  if (key === "bboggl:activeIds" && shadowValue && typeof shadowValue === "object" &&
      (!cloudValue || typeof cloudValue !== "object" || (!cloudValue.dog && !cloudValue.cat))) {
    cloudSet(key, shadowValue).catch(() => {});
    return shadowValue;
  }

  await localSet(shadowKey, cloudValue);
  return cloudValue;
}
async function safeSet(key, value, account) {
  if (!account) return localSet(key, value);
  const shadowKey = accountLocalStateKey(key, account);
  const localOk = await localSet(shadowKey, value);
  let cloudOk = await cloudSet(key, value);
  if (!cloudOk && localOk) {
    // Best-effort retry; UI remains usable from the account-scoped safety copy meanwhile.
    window.setTimeout(() => { cloudSet(key, value).catch(() => {}); }, 900);
    window.setTimeout(() => { cloudSet(key, value).catch(() => {}); }, 2800);
  }
  return Boolean(localOk || cloudOk);
}`
        );

        // Do not expose feature pages before saved pet state has finished loading.
        out=out.replace(
          /setAuthChecked\(true\);\s*\/\/ 로그인 확인만 끝나면 홈부터 먼저 보여주고, 반려동물 데이터는 아래에서 비동기로 채워요\.\s*setLoaded\(true\);/,
          'setAuthChecked(true);\n      // 저장된 반려동물 상태까지 확인한 뒤 화면을 열어 false-empty 화면을 방지해요.'
        );

        // Guest/local registrations must remain usable.
        out=out.replace(
          /if \(!me\) \{\s*dogs = \[\];\s*cats = \[\];\s*\}\s*\n\s*setPets\(\{ dog: dogs, cat: cats \}\);/,
          'dogs = Array.isArray(dogs) ? dogs : [];\n      cats = Array.isArray(cats) ? cats : [];\n\n      setPets({ dog: dogs, cat: cats });'
        );

        // Mark app data ready only after pets + active ids are installed in React state.
        out=out.replace(
          /setActiveId\(\{\s*dog: \(actives && actives\.dog\) \|\| \(dogs\[0\] && dogs\[0\]\.id\) \|\| null,\s*cat: \(actives && actives\.cat\) \|\| \(cats\[0\] && cats\[0\]\.id\) \|\| null,\s*\}\);/,
          'setActiveId({\n        dog: (actives && actives.dog) || (dogs[0] && dogs[0].id) || null,\n        cat: (actives && actives.cat) || (cats[0] && cats[0].id) || null,\n      });\n      setLoaded(true);'
        );

        out=out.replace(
          /const persistPets = async \(next\) => \{\s*setPets\(next\);\s*const ok1 = await safeSet\("bboggl:dogs", next\.dog, account\);\s*const ok2 = await safeSet\("bboggl:cats", next\.cat, account\);\s*flashSaveToast\(ok1 && ok2\);\s*\};\s*const persistActive = \(next\) => \{\s*setActiveId\(next\);\s*safeSet\("bboggl:activeIds", next, account\);\s*\};/,
`const persistPets = async (next) => {
    setPets(next);
    const [ok1, ok2] = await Promise.all([
      safeSet("bboggl:dogs", next.dog, account),
      safeSet("bboggl:cats", next.cat, account),
    ]);
    const ok = Boolean(ok1 && ok2);
    flashSaveToast(ok);
    return ok;
  };
  const persistActive = async (next) => {
    setActiveId(next);
    return safeSet("bboggl:activeIds", next, account);
  };`
        );

        // Newly registered pet becomes the selected feature pet immediately.
        out=out.replace(
          'persistActive({ ...activeId, [species]: newPet.id });\n    setMode("view");',
          'persistActive({ ...activeId, [species]: newPet.id });\n    setFeaturePetId(newPet.id);\n    setMode("view");'
        );

        // Desktop sidebar: one canonical order and one canonical route per visible label.
        const sidebar=`<nav className="petgrow-sidebar-nav petgrow-sidebar-nav-grouped">
            <button className={view === "home" ? "active" : ""} onClick={() => goView("home")}><HomeIcon /><span>{t.hamNavHome}</span></button>
            <div className="sidebar-section-label">{lang === "en" ? "PET LIFE" : "반려생활"}</div>
            <button className={view === "about" ? "active" : ""} onClick={() => goView("about")}><InfoIcon /><span>{t.aboutNav}</span></button>
            <button className={view === "pets" ? "active" : ""} onClick={() => goView("pets")}><HeartOutlineIcon /><span>{t.myPetsNav}</span></button>
            <button className={view === "nearby" ? "active" : ""} onClick={() => goView("nearby")}><MapPinIcon /><span>{t.nearbyNav}</span></button>
            <div className="sidebar-section-label">{lang === "en" ? "COMMUNITY · CONTENT" : "커뮤니티 · 콘텐츠"}</div>
            <button className={view === "community" ? "active" : ""} onClick={() => goView("community")}><TalkIcon /><span>{t.communityNav}</span></button>
            <button className={view === "music" ? "active" : ""} onClick={() => goView("music")}><MusicIcon /><span>{lang === "en" ? "Pet Music" : "Pet음악"}</span></button>
            <button className={view === "petbti" ? "active" : ""} onClick={() => goView("petbti")}><PetBtiIcon /><span>{t.petBtiNav}</span></button>
            <button className={view === "saju" ? "active" : ""} onClick={() => goView("saju")}><SajuIcon /><span>{t.sajuNav}</span></button>
            <button className={"tarot-nav "+(view === "tarot" ? "active" : "")} onClick={() => goView("tarot")}><span className="sidebar-tarot-mark">🃏</span><span>{lang === "en" ? "Pet Tarot" : "Pet타로"}</span></button>
            <div className="sidebar-section-label">{lang === "en" ? "INFO · SUPPORT" : "정보 · 지원"}</div>
            <button className={view === "tips" ? "active" : ""} onClick={() => goView("tips")}><LightbulbIcon /><span>{t.tipsTitle}</span></button>
            <button className={view === "news" ? "active" : ""} onClick={() => goView("news")}><InfoIcon /><span>{lang === "en" ? "Pet News" : "Pet뉴스"}</span></button>
          </nav>`;
        out=out.replace(/<nav className="petgrow-sidebar-nav petgrow-sidebar-nav-grouped">[\s\S]*?<\/nav>/,sidebar);

        const groups=`[
    {label:lang==="en"?"PET LIFE":"반려생활",items:[{key:"about",label:t.aboutNav,Icon:InfoIcon},{key:"pets",label:t.myPetsNav,Icon:PawIcon},{key:"nearby",label:t.nearbyNav,Icon:MapPinIcon}]},
    {label:lang==="en"?"COMMUNITY · CONTENT":"커뮤니티 · 콘텐츠",items:[{key:"community",label:t.communityNav,Icon:TalkIcon},{key:"music",label:lang==="en"?"Pet Music":"Pet음악",Icon:MusicIcon},{key:"petbti",label:t.petBtiNav,Icon:PetBtiIcon},{key:"saju",label:t.sajuNav,Icon:SajuIcon},{key:"tarot",label:lang==="en"?"Pet Tarot":"Pet타로",Icon:SajuIcon}]},
    {label:lang==="en"?"INFO · SUPPORT":"정보 · 지원",items:[{key:"tips",label:t.tipsTitle,Icon:LightbulbIcon},{key:"news",label:lang==="en"?"Pet News":"Pet뉴스",Icon:InfoIcon}]}
  ]`;
        out=out.replace(/(function HamburgerMenu\([\s\S]*?const groups=)\[[\s\S]*?\];(\s*const Btn=)/,`$1${groups};$2`);
      }

      if(norm.endsWith("/src/PetDailyWidgets.jsx")){
        out=out.replace(/<div className="pg-tarot-pet-identity">[\s\S]*?<\/div><style>\{`/g,'<style>{`');
        out=out.replace(/<div className="pet-tarot-native-head">[\s\S]*?<\/div>/g,'');
        out=out.replace(/<div className="pet-tarot-clean-head">[\s\S]*?<\/div>/g,'');
        const stage='<div className="bg-card pet-tarot-stage">';
        const head='<div className="pet-tarot-clean-head"><span className="pet-tarot-clean-avatar">{(pet?.profile?.profileImage||pet?.profile?.photo||pet?.profileImage||pet?.photo)?<img src={pet?.profile?.profileImage||pet?.profile?.photo||pet?.profileImage||pet?.photo} alt={petName}/>:<em>{String(pet?.profile?.species||pet?.species||pet?.profile?.type||pet?.type||"dog").toLowerCase().includes("cat")||String(pet?.profile?.species||pet?.species||"").includes("고양")?"🐱":"🐶"}</em>}</span><b className="pet-user-name">{petName}</b></div>';
        if(!out.includes(stage)) throw new Error('[petgrow-stability-cleanup] tarot stage not found');
        out=out.replace(stage,stage+head);
      }

      if(norm.endsWith("/src/final-ux-20260818.css")){
        const start=out.indexOf('/* Pet사주/Pet타로 배경과 여백을 한 톤으로 */');
        const end=out.indexOf('/* 포인트: 숫자 중심 + 도움말은 ? 클릭 시만 */',start);
        if(start>=0&&end>start) out=out.slice(0,start)+out.slice(end);
      }

      return out===code?null:{code:out,map:null};
    }
  };
}
