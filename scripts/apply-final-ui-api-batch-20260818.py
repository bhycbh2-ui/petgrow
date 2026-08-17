from pathlib import Path
import re

APP=Path('src/App.jsx')
TAROT=Path('src/PetDailyWidgets.jsx')
COMM=Path('server_lib/community.js')

s=APP.read_text(encoding='utf-8')
daily=TAROT.read_text(encoding='utf-8')
comm=COMM.read_text(encoding='utf-8')


def replace_once(text, old, new, label, required=True):
    n=text.count(old)
    if n==0:
        if required:
            raise RuntimeError(f'{label}: target not found')
        return text
    if n>1:
        raise RuntimeError(f'{label}: target found {n} times')
    return text.replace(old,new,1)

# 1) PetInfo: the common UnifiedMenuHero already contains the page title.
# Remove the small duplicate Pet정보 title row inside TipsPage.
tips_title='''      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <LightbulbIcon style={{ width: 22, height: 22, color: "var(--primary)" }} />
        <h1 style={{ fontSize: 18 }}>{t.tipsTitle}</h1>
      </div>

'''
s=replace_once(s,tips_title,'','remove duplicate PetInfo title',required=False)

# 2) PetTalk fallback: no second title/eyebrow block, show only functional fallback body.
pattern=r'''function PetTalkFallback\(\)\{[\s\S]*?\n\}\n\n// allPets:'''
replacement='''function PetTalkFallback(){
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=()=>{setLoading(true);setError("");fetch("/api/community?action=posts&category=all&sort=latest&page=1",{credentials:"include"}).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j?.message||j?.error||`Pet톡 접속 오류 (${r.status})`);return j;}).then(j=>setItems(j.posts||[])).catch(e=>setError(e.message||"Pet톡을 불러오지 못했어요.")).finally(()=>setLoading(false));};
  useEffect(()=>{load()},[]);
  return <div className="legal-page-shell pettalk-safe-fallback"><div className="pettalk-fallback-toolbar"><span>게시글을 다시 불러올 수 있어요.</span><button className="bg-chip" onClick={load}>새로고침</button></div>{loading?<div className="pettalk-state">Pet톡을 불러오는 중…</div>:error?<div className="pettalk-state error"><b>Pet톡 접속에 문제가 있어요.</b><span>{error}</span><button className="bg-btn" onClick={load}>다시 시도</button></div>:<div className="pettalk-fallback-list">{items.length?items.map(p=><div key={p.id} className="bg-card pettalk-fallback-item"><small>{p.authorNickname||'PetGrow 회원'} · {p.pet?.name||'우리 아이'}</small><b>{p.title}</b><p>{String(p.content||'').slice(0,180)}</p></div>):<div className="pettalk-state">아직 등록된 Pet톡이 없어요.</div>}</div>}</div>;
}

// allPets:'''
s2,n=re.subn(pattern,replacement,s,count=1)
if n!=1:
    raise RuntimeError(f'PetTalkFallback replacement count={n}')
s=s2

# 3) Community feed: expose a friendly retry state instead of silently swallowing a 500.
s=replace_once(s,
'''  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);


  const loadPage = async (nextPage) => {
    setLoading(true);
    try {''',
'''  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError,setLoadError]=useState("");

  const loadPage = async (nextPage) => {
    setLoading(true);
    setLoadError("");
    try {''','CommunityFeed add error state')
s=replace_once(s,
'''    } catch {}
    setLoading(false);
  };''',
'''    } catch (e) { setLoadError(e?.message||"Pet톡을 불러오지 못했어요."); }
    setLoading(false);
  };''','CommunityFeed catch error')
s=replace_once(s,
'''    <div className="legal-page-shell">
      <div className="cm-search-actions">''',
'''    <div className="legal-page-shell pettalk-feed-shell">
      {loadError&&<div className="pettalk-inline-error"><span>Pet톡 접속 시 오류가 발생했어요. {loadError}</span><button type="button" className="bg-chip" onClick={()=>loadPage(1)}>다시 시도</button></div>}
      <div className="cm-search-actions">''','CommunityFeed render error')

# 4) PetNews: keep the common page hero, turn the inner duplicated hero into a tiny refresh row.
news_hero_pattern=r'''\s*<section className="petnews-hero"><div><small>PETGROW NEWS</small><h1>Pet뉴스</h1><p>반려동물 소식을 제목만 나열하지 않고 핵심 설명과 함께 보기 쉽게 정리했어요\.</p></div><button type="button" className="bg-btn bg-btn-ghost" onClick=\{load\}>새로고침</button></section>'''
s2,n=re.subn(news_hero_pattern,'\n    <div className="petnews-refresh-row"><span>최신 반려동물 뉴스를 핵심 요약과 함께 확인해보세요.</span><button type="button" className="bg-chip" onClick={load}>새로고침</button></div>',s,count=1)
if n!=1:
    raise RuntimeError(f'PetNews duplicate hero replacement count={n}')
s=s2

# 5) Information guide: remove both PetPoint advertising banners and keep the common title hero.
s=s.replace('    <PetPointGuideCard />\n','',1)
s=replace_once(s,'<><PetPointGuideCard /><InfoGuidePage /></>','<InfoGuidePage />','remove guide top PetPoint banner',required=False)
# Replace duplicate premium title hero with search-only panel.
guide_hero_pattern=r'''\s*<section className="guide-premium-hero">[\s\S]*?</section>\n\s*\{!q&&<section className="guide-start-card">'''
guide_repl='''
    <section className="guide-search-only bg-card"><div className="guide-search-box"><span>⌕</span><input value={guideSearch} onChange={e=>setGuideSearch(e.target.value)} placeholder="무엇을 도와드릴까요? 예: 타로, 음악, 포인트" /></div></section>
    {!q&&<section className="guide-start-card">'''
s2,n=re.subn(guide_hero_pattern,guide_repl,s,count=1)
if n!=1:
    raise RuntimeError(f'Guide duplicate hero replacement count={n}')
s=s2

# 6) PetPoint belongs inside Member Info only, not above Home/MyPage.
s=s.replace('      {account&&(effectiveView==="home"||effectiveView==="my")&&<PetPointDashboard compact={effectiveView==="home"}/>}\n','',1)
s=replace_once(s,
'''      </div>

      <div className="my-menu-grid my-menu-grid-top">''',
'''      </div>

      <section className="mypage-petpoint-section"><PetPointDashboard /></section>

      <div className="my-menu-grid my-menu-grid-top">''','insert PetPoint in MyPage')
# Daily-login and activity point toast should disappear automatically too.
s=replace_once(s,
'''  const load=async(silent=false)=>{if(!silent)setRefreshing(true);try{const x=await petPointSummary();setD(x);if(x?.pointEvent?.awarded)setToast({amount:x.pointEvent.awarded,label:x.pointEvent.label,balance:x.pointEvent.balance})}catch{}finally{if(!silent)setRefreshing(false)}};''',
'''  const load=async(silent=false)=>{if(!silent)setRefreshing(true);try{const x=await petPointSummary();setD(x);if(x?.pointEvent?.awarded){setToast({amount:x.pointEvent.awarded,label:x.pointEvent.label,balance:x.pointEvent.balance});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2600)}}catch{}finally{if(!silent)setRefreshing(false)}};''','PetPoint auto-hide initial toast')
s=s.replace('toastTimer.current=setTimeout(()=>setToast(null),3000)','toastTimer.current=setTimeout(()=>setToast(null),2600)')

# 7) Home: expand the six visual feature cards to an even 10-card set.
home_tail='''        <button type="button" className="dash-widget dash-widget-guide" onClick={()=>onGoView("guide")}><div className="dash-widget-icon">📚</div><div><small>GUIDE</small><h3>{lang === "en" ? "PetGrow guide" : "정보가이드"}</h3><p>{lang === "en" ? "See how each PetGrow feature works." : "PetGrow의 주요 기능 사용법을 한곳에서 확인해요."}</p></div><b>›</b></button>
      </section>'''
home_new='''        <button type="button" className="dash-widget dash-widget-guide" onClick={()=>onGoView("guide")}><div className="dash-widget-icon">📚</div><div><small>GUIDE</small><h3>{lang === "en" ? "PetGrow guide" : "정보가이드"}</h3><p>{lang === "en" ? "See how each PetGrow feature works." : "PetGrow의 주요 기능 사용법을 한곳에서 확인해요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-news" onClick={()=>onGoView("news")}><div className="dash-widget-icon">📰</div><div><small>PET NEWS</small><h3>{lang === "en" ? "Pet news at a glance" : "최신 Pet뉴스"}</h3><p>{lang === "en" ? "Read clear titles and short summaries." : "반려동물 주요 소식을 제목과 핵심 요약으로 확인해요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-tarot" onClick={()=>onGoView("tarot")}><div className="dash-widget-icon">🃏</div><div><small>PET TAROT</small><h3>{lang === "en" ? "Daily Pet Tarot" : "오늘의 Pet타로"}</h3><p>{lang === "en" ? "Draw one card for each daily topic." : "오늘·궁합·마음·산책·조언 카드 메시지를 만나보세요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-info" onClick={()=>onGoView("tips")}><div className="dash-widget-icon">💡</div><div><small>PET INFO</small><h3>{lang === "en" ? "Practical pet info" : "Pet정보"}</h3><p>{lang === "en" ? "Health, food, training and daily care." : "건강·식단·훈련·생활 정보를 쉽고 빠르게 찾아봐요."}</p></div><b>›</b></button>
        <button type="button" className="dash-widget dash-widget-pets" onClick={onGoPets}><div className="dash-widget-icon">🐾</div><div><small>MY PET</small><h3>{lang === "en" ? "Manage my pets" : "우리 아이 관리"}</h3><p>{lang === "en" ? "Profiles, growth records and photos." : "프로필·성장기록·사진과 건강정보를 한곳에서 관리해요."}</p></div><b>›</b></button>
      </section>'''
s=replace_once(s,home_tail,home_new,'expand home feature cards')

# 8) Nearby map: move location controls inside map, keep realtime follow, and simplify the outer chrome.
old_nearby='''    <div style={{display:'flex',justifyContent:'flex-end',margin:'8px 0 10px'}}><button type="button" className={`bg-chip ${followMyLocation?'active':''}`} onClick={()=>setFollowMyLocation(v=>!v)}>📍 내 위치 따라가기 {followMyLocation?'ON':'OFF'}</button></div>
    <ResponsiveCategoryMenu className="nearby-responsive-categories" primaryCount={3} items={cats.map(([id,label])=>({id,label}))} activeId={cat} onSelect={setCat} lang={"ko"} />
    <section className="nearby-map-card bg-card">
      <div className="nearby-map-head"><div><b>🗺️ {searchMode==="current"?"현재 위치 기준 지도":"검색 주소 기준 지도"}</b><small className="nearby-map-description">{searchMode==="current"?"현재 위치 1km 안의 가까운 장소만 표시해요. 목록에서 업체를 누르면 지도에는 그 업체만 크게 표시돼요.":pos?"입력한 주소 기준으로 검색하고 지도에는 내 위치와 업체 거리를 함께 표시해요.":"입력한 주소 기준으로 검색해요. 위치 허용 시 내 위치도 표시해요."}</small></div><div className="nearby-location-controls">{pos&&<span className="nearby-live-pill">● 내 위치</span>}<button type="button" className="nearby-location-btn" onClick={locate}>{pos?"위치 새로고침":"내 위치 표시"}</button></div></div>
      <div ref={mapRef} className="nearby-map"><div className="nearby-map-fallback"><MapPinIcon/><b>지도를 불러오는 중이에요</b><span>1km 안의 가까운 업체만 표시해 지도를 가볍게 유지해요.</span></div></div>
    </section>'''
new_nearby='''    <ResponsiveCategoryMenu className="nearby-responsive-categories" primaryCount={3} items={cats.map(([id,label])=>({id,label}))} activeId={cat} onSelect={setCat} lang={"ko"} />
    <section className="nearby-map-card bg-card modern-nearby-map">
      <div className="nearby-map-head"><div><b>{searchMode==="current"?"현재 위치 주변":"검색한 주소 주변"}</b><small className="nearby-map-description">{pos?"빨간 점은 실시간 내 위치예요. 장소를 누르면 상세 정보를 확인할 수 있어요.":"위치 권한을 허용하면 지도에 내 위치와 장소까지의 거리를 함께 표시해요."}</small></div>{pos&&<span className="nearby-live-pill">LIVE</span>}</div>
      <div className="nearby-map-shell"><div ref={mapRef} className="nearby-map"><div className="nearby-map-fallback"><MapPinIcon/><b>지도를 불러오는 중이에요</b><span>가까운 반려동물 장소를 간결하게 표시해요.</span></div></div><div className="nearby-map-floating-controls"><button type="button" className="nearby-map-icon-btn" onClick={locate} aria-label={pos?"현재 위치 새로고침":"현재 위치 표시"} title={pos?"현재 위치 새로고침":"현재 위치 표시"}><MapPinIcon/></button><button type="button" className={`nearby-map-icon-btn follow ${followMyLocation?'active':''}`} onClick={()=>setFollowMyLocation(v=>!v)} aria-label="실시간 위치 따라가기" title="실시간 위치 따라가기">◎</button></div></div>
    </section>'''
s=replace_once(s,old_nearby,new_nearby,'modern nearby map layout')

# 9) Global final visual/responsive overrides.
css_marker='/* PETGROW_FINAL_BATCH_20260818 */'
if css_marker not in s:
    css='''
  /* PETGROW_FINAL_BATCH_20260818 */
  .petgrow-unified-hero h1,.pets-page .petgrow-unified-hero h1,.my-pets-page .petgrow-unified-hero h1,.pet-profile-page .petgrow-unified-hero h1{font-size:30px!important;line-height:1.2!important;letter-spacing:-.04em!important;margin:6px 0 7px!important;font-weight:850!important}
  .petgrow-unified-hero{padding:26px 28px!important;border-radius:24px!important}
  .pettalk-feed-shell{padding-top:0!important}.pettalk-fallback-toolbar{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin:0 0 12px}.pettalk-fallback-toolbar span{font-size:11px;color:var(--sub)}.pettalk-state{min-height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:var(--sub);padding:24px}.pettalk-state.error{border:1px solid #f0d8d3;border-radius:18px;background:#fff9f7;color:#7b4c44}.pettalk-fallback-list{display:grid;gap:10px}.pettalk-fallback-item{padding:16px!important}.pettalk-fallback-item small{font-weight:800;color:var(--primary)}.pettalk-fallback-item b{display:block;font-size:15px;margin-top:5px}.pettalk-fallback-item p{font-size:12px;line-height:1.6;color:var(--sub);margin:5px 0 0}.pettalk-inline-error{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;margin:0 0 12px;border:1px solid #efd9d3;border-radius:15px;background:#fff9f7;color:#87564c;font-size:12px;font-weight:700}
  .petnews-v10{width:100%;max-width:none!important}.petnews-refresh-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 13px;padding:0 2px;color:var(--sub);font-size:12px}.petnews-tools{display:grid;gap:12px;margin-bottom:12px}.petnews-cats{display:flex;gap:7px;flex-wrap:wrap}.petnews-cats button{appearance:none;border:1px solid #dfe7e1;background:#fff;border-radius:999px;padding:8px 12px;color:#647068;font:inherit;font-size:12px;font-weight:750;cursor:pointer}.petnews-cats button.active{background:#487e57;color:#fff;border-color:#487e57}.petnews-search{position:relative;display:flex;align-items:center}.petnews-search>span{position:absolute;left:14px;color:#7d8981;z-index:1}.petnews-search .bg-input{width:100%;padding-left:38px!important;min-height:46px!important}.petnews-result-count{font-size:12px;font-weight:800;color:#657169;margin:6px 2px 12px}.petnews-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}.petnews-card-v10{display:grid!important;grid-template-columns:118px minmax(0,1fr)!important;min-height:150px!important;background:#fff!important;border:1px solid #e1e8e2!important;border-radius:20px!important;overflow:hidden!important;box-shadow:0 8px 24px rgba(41,62,48,.05)!important;cursor:pointer}.petnews-media{width:118px!important;height:100%!important;min-height:150px!important;position:relative!important;background:#f3f7f3!important;overflow:hidden!important}.petnews-media img{width:100%!important;height:100%!important;object-fit:cover!important;display:block}.petnews-image-fallback{position:absolute!important;inset:0!important;display:none!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:7px!important;background:linear-gradient(145deg,#eef5ef,#f8f5ee)!important;color:#55705e!important}.petnews-image-fallback.show{display:flex!important}.petnews-image-fallback span{font-size:30px!important}.petnews-image-fallback small{font-size:10px!important;font-weight:800!important}.petnews-card-body{padding:15px 16px!important;min-width:0!important}.petnews-meta{display:flex;justify-content:space-between;gap:8px;align-items:center}.petnews-meta span{font-size:10px;font-weight:900;color:#487e57}.petnews-meta small{font-size:10px;color:#8a948d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.petnews-card-body h2{font-size:16px!important;line-height:1.42!important;letter-spacing:-.025em!important;margin:8px 0 6px!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.petnews-card-body p{font-size:12px!important;line-height:1.65!important;color:#66736a!important;margin:0 0 9px!important;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.petnews-card-body>button{border:0;background:transparent;color:#487e57;padding:0;font:inherit;font-size:11px;font-weight:850;cursor:pointer}.petnews-state{padding:36px 18px!important;text-align:center!important;border:1px solid #e4e9e5!important;border-radius:18px!important;background:#fff!important}.petnews-modal{max-width:640px!important}
  .mypage-petpoint-section{margin:16px 0 20px}.mypage-petpoint-section .petpoint-card{max-width:none!important;margin:0!important;border:1px solid #dfe8e1!important;border-radius:22px!important;background:#fff!important;box-shadow:0 10px 28px rgba(38,60,45,.055)!important;padding:20px!important}.mypage-petpoint-section .petpoint-head{padding-bottom:14px;border-bottom:1px solid #edf1ee}.mypage-petpoint-section .petpoint-head small{color:#64816c!important}.mypage-petpoint-section .petpoint-head h2{font-size:20px!important}.mypage-petpoint-section .petpoint-head>strong{font-size:28px!important;color:#34784a!important}.mypage-petpoint-section .petpoint-live-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin:14px 0!important}.mypage-petpoint-section .petpoint-live-stats>div{padding:12px!important;border:1px solid #e5ebe6!important;border-radius:14px!important;background:#f9fbf9!important}.mypage-petpoint-section .petpoint-live-stats small{display:block;font-size:10px;color:#7a867e}.mypage-petpoint-section .petpoint-live-stats b{display:block;margin-top:4px;font-size:15px}.mypage-petpoint-section .petpoint-costs{grid-template-columns:repeat(4,minmax(0,1fr))!important}.mypage-petpoint-section .petpoint-guide{background:#fbfcfb;border:1px solid #e7ece8!important;border-radius:15px;padding:12px 14px!important;margin-top:12px!important}.mypage-petpoint-section .petpoint-history-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px}.mypage-petpoint-section .petpoint-history-head small{display:block;color:var(--sub);font-size:10px;margin-top:3px}.petpoint-toast{position:fixed!important;z-index:99999!important;right:22px!important;top:22px!important;max-width:min(340px,calc(100vw - 28px))!important;display:flex!important;flex-direction:column!important;gap:2px!important;border-radius:15px!important;padding:11px 14px!important;background:#245237!important;color:#fff!important;box-shadow:0 14px 36px rgba(25,52,35,.22)!important;animation:pointToast .22s ease-out,pointToastOut .28s ease-in 2.25s forwards!important}.petpoint-toast.minus{background:#6e5b34!important}.petpoint-toast span{font-size:10px;font-weight:600;opacity:.86}@keyframes pointToastOut{to{opacity:0;transform:translateY(-8px)}}
  .guide-search-only{padding:12px 14px!important;margin-bottom:16px!important;border:1px solid #e2e9e3!important;border-radius:18px!important;background:#fff!important}.guide-search-only .guide-search-box{display:flex;align-items:center;gap:9px;border:1px solid #dfe8e1;border-radius:14px;padding:0 13px;background:#fafcfb}.guide-search-only input{width:100%;border:0;outline:0;background:transparent;padding:13px 2px;font:inherit;font-size:13px}.guide-quick-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.guide-quick-card{min-height:112px!important;background:#fff!important;border:1px solid #e2e8e3!important;border-radius:20px!important;padding:18px!important;box-shadow:0 7px 20px rgba(39,58,45,.035)!important;color:var(--text)!important}.guide-quick-card.active{border-color:#9fc5a8!important;box-shadow:0 0 0 2px rgba(79,138,91,.08)!important}.guide-detail-card{border-radius:24px!important;background:#fff!important;border:1px solid #dfe7e1!important;box-shadow:0 10px 28px rgba(38,60,45,.05)!important}.guide-start-card{background:#fff!important;border:1px solid #e2e8e3!important}.petpoint-guide-hero{display:none!important}
  .dash-widget-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.dash-widget-grid .dash-widget{background:#fff!important;border:1px solid #e1e8e2!important;box-shadow:0 8px 22px rgba(37,58,43,.045)!important;min-height:126px!important}.dash-widget-grid .dash-widget-icon{background:#eff6f0!important}.dash-widget-grid .dash-widget:hover{border-color:#b9d2bf!important;transform:translateY(-1px)!important}
  .modern-nearby-map{border:1px solid #e1e8e2!important;border-radius:22px!important;box-shadow:0 10px 28px rgba(39,58,45,.05)!important;background:#fff!important}.modern-nearby-map .nearby-map-head{padding:12px 14px!important;background:#fff!important}.modern-nearby-map .nearby-map-head b{font-size:13px!important}.modern-nearby-map .nearby-map-description{font-size:10.5px!important}.nearby-map-shell{position:relative}.nearby-map-floating-controls{position:absolute;right:12px;bottom:14px;z-index:900;display:flex;flex-direction:column;gap:8px}.nearby-map-icon-btn{width:40px;height:40px;border:1px solid rgba(50,70,57,.13);border-radius:13px;background:rgba(255,255,255,.96);color:#3f6f4b;display:grid;place-items:center;box-shadow:0 6px 18px rgba(31,48,36,.16);cursor:pointer;backdrop-filter:blur(8px)}.nearby-map-icon-btn svg{width:18px;height:18px}.nearby-map-icon-btn.follow{font-size:18px;font-weight:900}.nearby-map-icon-btn.follow.active{background:#3f7750;color:#fff}.nearby-me-pin span{width:15px!important;height:15px!important;background:#e34d4d!important;border:3px solid #fff!important;box-shadow:0 0 0 7px rgba(227,77,77,.18),0 3px 12px rgba(120,39,39,.22)!important;animation:nearbyRedPulse 1.8s ease-out infinite!important}.nearby-me-pin b{display:none!important}@keyframes nearbyRedPulse{0%{box-shadow:0 0 0 0 rgba(227,77,77,.35),0 3px 12px rgba(120,39,39,.22)}70%{box-shadow:0 0 0 14px rgba(227,77,77,0),0 3px 12px rgba(120,39,39,.22)}100%{box-shadow:0 0 0 0 rgba(227,77,77,0),0 3px 12px rgba(120,39,39,.22)}}.nearby-map{background:#f2f5f2!important}.nearby-map-card .leaflet-control-attribution{font-size:8px!important;opacity:.65}.nearby-map-card .leaflet-control-zoom{border:0!important;box-shadow:0 5px 15px rgba(31,48,36,.12)!important}.nearby-map-card .leaflet-control-zoom a{border:0!important;color:#405849!important}
  @media(max-width:1024px){.petgrow-content-stage{min-width:0!important}.petnews-grid{grid-template-columns:1fr!important}.mypage-petpoint-section .petpoint-live-stats,.mypage-petpoint-section .petpoint-costs{grid-template-columns:repeat(2,minmax(0,1fr))!important}.dash-widget-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media(max-width:760px){.petgrow-unified-hero{padding:20px!important;border-radius:20px!important}.petgrow-unified-hero h1,.pets-page .petgrow-unified-hero h1,.my-pets-page .petgrow-unified-hero h1,.pet-profile-page .petgrow-unified-hero h1{font-size:25px!important}.pettalk-inline-error{align-items:flex-start;flex-direction:column}.pettalk-inline-error .bg-chip{width:100%}.petnews-refresh-row{align-items:flex-start}.petnews-card-v10{grid-template-columns:92px minmax(0,1fr)!important;min-height:132px!important}.petnews-media{width:92px!important;min-height:132px!important}.petnews-card-body{padding:13px!important}.petnews-card-body h2{font-size:15px!important}.petnews-card-body p{-webkit-line-clamp:2}.mypage-petpoint-section{margin-left:0!important;margin-right:0!important}.mypage-petpoint-section .petpoint-card{padding:16px!important;border-radius:18px!important}.mypage-petpoint-section .petpoint-head{align-items:flex-start!important}.mypage-petpoint-section .petpoint-head>strong{font-size:24px!important}.mypage-petpoint-section .petpoint-live-stats,.mypage-petpoint-section .petpoint-costs{grid-template-columns:repeat(2,minmax(0,1fr))!important}.petpoint-toast{right:14px!important;top:14px!important}.guide-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.guide-quick-card{min-height:102px!important;padding:14px!important}.guide-detail-card{border-radius:20px!important}.dash-widget-grid{grid-template-columns:1fr!important}.dash-widget-grid .dash-widget{min-height:110px!important}.modern-nearby-map .nearby-map-head{align-items:center!important;flex-wrap:nowrap!important}.modern-nearby-map .nearby-map-description{display:none!important}.nearby-map{height:360px!important;min-height:360px!important}.nearby-map-floating-controls{right:10px;bottom:12px}.nearby-map-icon-btn{width:38px;height:38px}.nearby-search-row{grid-template-columns:minmax(0,1fr) auto!important}.nearby-search-row .nearby-current-search-btn{grid-column:1/-1!important;width:100%!important}.my-page-head h1{font-size:25px!important}}
  @media(max-width:430px){.legal-page-shell{padding-left:12px!important;padding-right:12px!important}.petnews-card-v10{grid-template-columns:78px minmax(0,1fr)!important}.petnews-media{width:78px!important}.petnews-meta small{display:none}.petnews-card-body{padding:11px!important}.petnews-cats{gap:5px}.petnews-cats button{padding:7px 9px;font-size:10.5px}.guide-quick-card{padding:12px!important;min-height:96px!important}.guide-quick-card>span{font-size:22px!important}.guide-quick-card b{font-size:13px!important}.guide-quick-card small{font-size:10px!important}.mypage-petpoint-section .petpoint-live-stats{gap:6px!important}.mypage-petpoint-section .petpoint-live-stats>div{padding:10px!important}.nearby-map{height:330px!important;min-height:330px!important}}
'''
    s=s.replace('  /* PETGROW_STABILITY_V2_20260817 */',css+'\n  /* PETGROW_STABILITY_V2_20260817 */',1)

# 10) Tarot: fill the feature area like Saju with a softly tinted stage rather than a small white island.
tarot_css='''
/* PETGROW_TAROT_FULL_STAGE_20260818 */
.pet-tarot-shell{width:100%!important;max-width:900px!important;margin:0 auto!important}.pet-tarot-stage{width:100%!important;max-width:none!important;min-height:610px!important;box-sizing:border-box!important;padding:32px 34px!important;border-radius:28px!important;background:radial-gradient(circle at 12% 8%,rgba(79,138,91,.09),transparent 28%),radial-gradient(circle at 88% 10%,rgba(205,174,96,.10),transparent 26%),linear-gradient(180deg,#f4f8f4 0%,#f8f7f1 100%)!important;border:1px solid #dce7de!important;box-shadow:0 16px 42px rgba(42,65,49,.07)!important}.pet-tarot-topic-grid{width:100%!important;max-width:none!important;margin-top:20px!important}.pet-tarot-topic{width:100%!important;background:rgba(255,255,255,.92)!important;border:1px solid #dce6de!important;box-shadow:0 7px 18px rgba(43,64,49,.035)!important}.pet-tarot-intro{max-width:720px!important}.pet-tarot-result-wrap{background:rgba(255,255,255,.92)!important}.pet-tarot-deck22{max-width:820px!important;margin-left:auto!important;margin-right:auto!important}@media(max-width:760px){.pet-tarot-shell{max-width:none!important}.pet-tarot-stage{min-height:auto!important;padding:20px 14px!important;border-radius:20px!important}.pet-tarot-topic{min-height:92px!important;padding:16px!important}.pet-tarot-topic-grid{gap:9px!important}}@media(max-width:430px){.pet-tarot-stage{padding:16px 10px!important}.pet-tarot-topic{padding:14px 12px!important}}
'''
if 'PETGROW_TAROT_FULL_STAGE_20260818' not in daily:
    marker='\n`;\n\nexport const PETGROW_TAROT_RESIDUAL_READABILITY_20260818'
    if marker not in daily:
        raise RuntimeError('Tarot CSS closing marker not found')
    daily=daily.replace(marker,'\n'+tarot_css+'\n`;\n\nexport const PETGROW_TAROT_RESIDUAL_READABILITY_20260818',1)

# 11) PetTalk 500 hardening: avoid driver-sensitive array parameters and make auxiliary joins non-fatal.
comm=replace_once(comm,
'''async function imagesForPosts(postIds) {
  if (!postIds.length) return {};
  const { rows } = await sql`
    select * from pg_post_images where post_id = ANY(${postIds}) order by post_id, sort_order asc
  `;''',
'''async function imagesForPosts(postIds) {
  if (!postIds.length) return {};
  const idList=postIds.join(",");
  const { rows } = await sql`
    select * from pg_post_images where post_id = any(string_to_array(${idList}, ',')) order by post_id, sort_order asc
  `;''','community image id array')
comm=replace_once(comm,
'''async function likedPostIds(viewerId, postIds) {
  if (!viewerId || !postIds.length) return new Set();
  const { rows } = await sql`
    select post_id from pg_likes where user_id = ${viewerId} and post_id = ANY(${postIds})
  `;''',
'''async function likedPostIds(viewerId, postIds) {
  if (!viewerId || !postIds.length) return new Set();
  const idList=postIds.join(",");
  const { rows } = await sql`
    select post_id from pg_likes where user_id = ${viewerId} and post_id = any(string_to_array(${idList}, ','))
  `;''','community liked id array')
comm=replace_once(comm,
'''  const [imgMap, liked] = await Promise.all([imagesForPosts(ids), likedPostIds(viewerId, ids)]);
  return {
    posts: pageRows.map((r) => shapePost(r, viewerId, imgMap[r.id], liked.has(r.id))),''',
'''  let imgMap={},liked=new Set();
  try{[imgMap,liked]=await Promise.all([imagesForPosts(ids),likedPostIds(viewerId,ids)]);}catch(e){console.error("PetTalk list decoration failed",e?.message||e);}
  return {
    posts: pageRows.map((r) => shapePost(r, viewerId, imgMap[r.id]||[], liked.has(r.id))),''','community feed decoration resilience')
comm=replace_once(comm,
'''  const [imgMap, liked] = await Promise.all([imagesForPosts([id]), likedPostIds(viewerId, [id])]);
  return shapePost(rows[0], viewerId, imgMap[id], liked.has(id));''',
'''  let imgMap={},liked=new Set();
  try{[imgMap,liked]=await Promise.all([imagesForPosts([id]),likedPostIds(viewerId,[id])]);}catch(e){console.error("PetTalk detail decoration failed",e?.message||e);}
  return shapePost(rows[0], viewerId, imgMap[id]||[], liked.has(id));''','community detail decoration resilience')

APP.write_text(s,encoding='utf-8')
TAROT.write_text(daily,encoding='utf-8')
COMM.write_text(comm,encoding='utf-8')

# Basic assertions for the requested batch.
final=APP.read_text(encoding='utf-8')
assert 'PETGROW_FINAL_BATCH_20260818' in final
assert '<PetPointGuideCard /><InfoGuidePage />' not in final
assert 'mypage-petpoint-section' in final
assert 'nearby-map-floating-controls' in final
assert 'dash-widget-news' in final and 'dash-widget-tarot' in final and 'dash-widget-info' in final and 'dash-widget-pets' in final
assert 'pettalk-inline-error' in final
assert 'PETGROW_TAROT_FULL_STAGE_20260818' in TAROT.read_text(encoding='utf-8')
print('Applied PetGrow final UI/API batch 20260818')
