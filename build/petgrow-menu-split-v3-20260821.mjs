const NEWS_START = "/* PETNEWS_FINAL_INLINE_20260818 */\nfunction PetNewsPage";
const NEWS_END = "function PetNewsPrivacyAddendum";
const MUSIC_START = "function PetMusicPage({ account, lang }) {";
const MUSIC_END = "function AdminMusicPanel(){";

function replaceRange(code, startMarker, endMarker, replacement, label) {
  const start = code.indexOf(startMarker);
  if (start < 0) throw new Error(`PetGrow v3 menu split: ${label} start anchor missing`);
  const end = code.indexOf(endMarker, start);
  if (end < 0) throw new Error(`PetGrow v3 menu split: ${label} end anchor missing`);
  return code.slice(0, start) + replacement + "\n\n" + code.slice(end);
}

const newsWrapper = `/* PETNEWS_FINAL_INLINE_20260818 — lazy menu wrapper */
let __petgrowNewsPageComponent = null;
let __petgrowNewsPagePromise = null;
function __petgrowLoadNewsPage(){
  if (__petgrowNewsPageComponent) return Promise.resolve(__petgrowNewsPageComponent);
  if (!__petgrowNewsPagePromise) {
    __petgrowNewsPagePromise = import("./lazy/PetNewsPage.jsx")
      .then((mod) => {
        __petgrowNewsPageComponent = mod.default;
        return __petgrowNewsPageComponent;
      })
      .catch((error) => {
        __petgrowNewsPagePromise = null;
        throw error;
      });
  }
  return __petgrowNewsPagePromise;
}
function PetNewsPage(props){
  const [Component,setComponent] = useState(() => __petgrowNewsPageComponent);
  const [failed,setFailed] = useState(false);
  const [retryKey,setRetryKey] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    __petgrowLoadNewsPage()
      .then((Next) => { if (active) setComponent(() => Next); })
      .catch((error) => { console.warn("PetNews menu chunk load failed", error); if (active) setFailed(true); });
    return () => { active = false; };
  }, [retryKey]);
  if (!Component) return <div className="bg-card" role="status" aria-live="polite" aria-busy={!failed} style={{minHeight:180,display:"grid",placeItems:"center",textAlign:"center",padding:24}}><div><b>{failed?"Pet뉴스를 불러오지 못했어요.":"Pet뉴스를 준비하고 있어요…"}</b>{failed&&<div style={{marginTop:12}}><button type="button" className="bg-btn" onClick={()=>setRetryKey((v)=>v+1)}>다시 시도</button></div>}</div></div>;
  return <Component {...props} onActivity={logPetActivity} />;
}`;

const musicWrapper = `let __petgrowMusicPageComponent = null;
let __petgrowMusicPagePromise = null;
function __petgrowLoadMusicPage(){
  if (__petgrowMusicPageComponent) return Promise.resolve(__petgrowMusicPageComponent);
  if (!__petgrowMusicPagePromise) {
    __petgrowMusicPagePromise = import("./lazy/PetMusicPage.jsx")
      .then((mod) => {
        __petgrowMusicPageComponent = mod.default;
        return __petgrowMusicPageComponent;
      })
      .catch((error) => {
        __petgrowMusicPagePromise = null;
        throw error;
      });
  }
  return __petgrowMusicPagePromise;
}
function PetMusicPage(props){
  const [Component,setComponent] = useState(() => __petgrowMusicPageComponent);
  const [failed,setFailed] = useState(false);
  const [retryKey,setRetryKey] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    __petgrowLoadMusicPage()
      .then((Next) => { if (active) setComponent(() => Next); })
      .catch((error) => { console.warn("PetMusic menu chunk load failed", error); if (active) setFailed(true); });
    return () => { active = false; };
  }, [retryKey]);
  if (!Component) return <div className="bg-card" role="status" aria-live="polite" aria-busy={!failed} style={{minHeight:180,display:"grid",placeItems:"center",textAlign:"center",padding:24}}><div><b>{failed?"Pet음악을 불러오지 못했어요.":"Pet음악을 준비하고 있어요…"}</b>{failed&&<div style={{marginTop:12}}><button type="button" className="bg-btn" onClick={()=>setRetryKey((v)=>v+1)}>다시 시도</button></div>}</div></div>;
}`;

export default function petgrowMenuSplitV3(){
  return {
    name: "petgrow-menu-split-v3-20260821",
    enforce: "pre",
    transform(code, id){
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      let next = code;
      next = replaceRange(next, NEWS_START, NEWS_END, newsWrapper, "PetNewsPage");
      next = replaceRange(next, MUSIC_START, MUSIC_END, musicWrapper, "PetMusicPage");
      return { code: next, map: null };
    },
  };
}
