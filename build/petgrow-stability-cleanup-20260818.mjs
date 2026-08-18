export default function petgrowStabilityCleanup(){
  return {
    name:"petgrow-stability-cleanup-20260818",
    enforce:"pre",
    transform(code,id){
      const norm=String(id||"").replaceAll("\\","/");
      let out=code;

      if(norm.endsWith("/src/App.jsx")){
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

        // Mobile hamburger: render the same route map directly; no DOM reordering script needed.
        const groups=`[
    {label:lang==="en"?"PET LIFE":"반려생활",items:[{key:"about",label:t.aboutNav,Icon:InfoIcon},{key:"pets",label:t.myPetsNav,Icon:PawIcon},{key:"nearby",label:t.nearbyNav,Icon:MapPinIcon}]},
    {label:lang==="en"?"COMMUNITY · CONTENT":"커뮤니티 · 콘텐츠",items:[{key:"community",label:t.communityNav,Icon:TalkIcon},{key:"music",label:lang==="en"?"Pet Music":"Pet음악",Icon:MusicIcon},{key:"petbti",label:t.petBtiNav,Icon:PetBtiIcon},{key:"saju",label:t.sajuNav,Icon:SajuIcon},{key:"tarot",label:lang==="en"?"Pet Tarot":"Pet타로",Icon:SajuIcon}]},
    {label:lang==="en"?"INFO · SUPPORT":"정보 · 지원",items:[{key:"tips",label:t.tipsTitle,Icon:LightbulbIcon},{key:"news",label:lang==="en"?"Pet News":"Pet뉴스",Icon:InfoIcon}]}
  ]`;
        out=out.replace(/(function HamburgerMenu\([\s\S]*?const groups=)\[[\s\S]*?\];(\s*const Btn=)/,`$1${groups};$2`);
      }

      if(norm.endsWith("/src/PetDailyWidgets.jsx")){
        // Remove every previously injected Tarot identity header from older transforms.
        out=out.replace(/<div className="pg-tarot-pet-identity">[\s\S]*?<\/div><style>\{`/g,'<style>{`');
        out=out.replace(/<div className="pet-tarot-native-head">[\s\S]*?<\/div>/g,'');
        out=out.replace(/<div className="pet-tarot-clean-head">[\s\S]*?<\/div>/g,'');

        // Insert exactly one selected-pet identity inside the Tarot main card.
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
