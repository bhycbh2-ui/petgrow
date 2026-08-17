from pathlib import Path
import re
p=Path('src/App.jsx'); s=p.read_text(encoding='utf-8')
component=r'''function AccountActivityHub({lang}){
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{const j=await apiJson("/api/activity?action=timeline");setItems(j.items||[])}catch{setItems([])}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const icon=t=>String(t||"").startsWith("news")?"📰":String(t||"").startsWith("music")?"🎵":String(t||"").startsWith("pettalk")?"💬":String(t||"").startsWith("support")?"✉️":String(t||"").startsWith("report")?"🚩":String(t||"").startsWith("tarot")?"🃏":String(t||"").startsWith("saju")?"🔮":String(t||"").startsWith("nearby")?"📍":"🐾";
  const title=lang==="ja"?"最近のアクティビティ":lang==="zh"?"最近活动":lang==="en"?"Recent activity":"전체 활동내역";
  return <section className="my-activity-hub"><div className="my-activity-hub-head"><div><h2>{title}</h2><small className="bg-sub">PetGrow 메뉴 이용·글·댓글·좋아요·신고·문의 등을 최근순으로 확인해요.</small></div><button onClick={load}>{loading?"…":"새로고침"}</button></div>{loading&&!items.length?<div className="bg-sub">활동내역을 불러오는 중…</div>:items.length?<div className="my-activity-timeline">{items.slice(0,40).map((x,i)=><div className="my-activity-row" key={`${x.type}-${x.createdAt}-${i}`}><span>{icon(x.type)}</span><div><b>{x.title||"PetGrow 활동"}</b>{x.detail&&<small>{x.detail}</small>}</div><time>{x.createdAt?new Date(x.createdAt).toLocaleString(lang==="ja"?"ja-JP":lang==="zh"?"zh-CN":lang==="en"?"en-US":"ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):""}</time></div>)}</div>:<div className="bg-sub">아직 기록된 활동이 없어요. 앞으로 이용한 메뉴와 활동이 여기에 쌓여요.</div>}</section>
}

function MyPage({account,allPets,lang,onOpenAccount,onGoPets,onOpenPost,onOpenAdmin,onLogout,onDeleteAccount,onGoSupport}){
  const [adminEntry,setAdminEntry]=useState(null),[likedMusic,setLikedMusic]=useState([]),[likedMusicLoaded,setLikedMusicLoaded]=useState(false),[likedMusicLoading,setLikedMusicLoading]=useState(false),[openActivity,setOpenActivity]=useState(null);
  const loadLikedMusic=async(force=false)=>{if(!account){setLikedMusic([]);setLikedMusicLoaded(true);return}if(likedMusicLoading||(likedMusicLoaded&&!force))return;setLikedMusicLoading(true);try{const r=await musicLiked();setLikedMusic(r.items||[]);setLikedMusicLoaded(true)}catch{}finally{setLikedMusicLoading(false)}};
  useEffect(()=>{setLikedMusic([]);setLikedMusicLoaded(false);setOpenActivity(null)},[account?.id]);
  useEffect(()=>{let alive=true;if(!account){setAdminEntry(null);return()=>{alive=false}}adminStatus().then(st=>{if(alive)setAdminEntry(st)}).catch(()=>{if(alive)setAdminEntry(null)});return()=>{alive=false}},[account?.id]);
  const togglePetTalk=()=>setOpenActivity(v=>v==="pettalk"?null:"pettalk");
  const toggleMusic=()=>{const x=openActivity!=="music";setOpenActivity(x?"music":null);if(x)loadLikedMusic(true)};
  return <div style={{maxWidth:760,margin:"0 auto",padding:"0 20px 70px"}}>
    <div className="my-page-head"><div><div className="my-page-kicker">MY PETGROW</div><h1>{lang==="ja"?"マイページ":lang==="zh"?"我的页面":lang==="en"?"My Page":"마이페이지"}</h1><p style={{fontSize:13}}>{lang==="en"?"Your PetGrow account and activity hub.":"계정·우리 아이·포인트·활동내역을 한곳에서 관리해요."}</p></div><span className="my-page-head-icon" style={{fontSize:16,fontWeight:950}}>MY</span></div>
    <section className="mypage-petpoint-section"><PetPointDashboard /></section>
    <div className="my-menu-grid my-menu-grid-top"><button type="button" className="my-menu-card my-menu-pink" onClick={onOpenAccount}><span className="my-menu-card-icon">✏️</span><span className="my-menu-card-copy"><strong>정보 수정</strong><small>닉네임과 계정 정보를 관리해요.</small></span><span className="my-menu-card-arrow">›</span></button><button type="button" className="my-menu-card my-menu-blue" onClick={onGoPets}><span className="my-menu-card-icon">🐾</span><span className="my-menu-card-copy"><strong>반려동물 관리</strong><small>등록한 아이 {allPets.length}마리를 관리해요.</small></span><span className="my-menu-card-arrow">›</span></button></div>
    <div className="my-activity-stack"><button type="button" className={`my-menu-card my-menu-purple my-menu-card-wide${openActivity==="pettalk"?" is-open":""}`} onClick={togglePetTalk}><span className="my-menu-card-icon">💬</span><span className="my-menu-card-copy"><strong>Pet톡 내 활동</strong><small>내 글·댓글·좋아요를 확인해요.</small></span><span className="my-menu-card-arrow">{openActivity==="pettalk"?"⌃":"›"}</span></button>
      {openActivity==="pettalk"&&<div className="bg-card my-activity-card my-accordion-panel"><MyActivityPage lang={lang} onOpenPost={onOpenPost} embedded /></div>}
      <button type="button" className={`my-menu-card my-menu-mint my-menu-card-wide${openActivity==="music"?" is-open":""}`} onClick={toggleMusic}><span className="my-menu-card-icon">❤️</span><span className="my-menu-card-copy"><strong>좋아요한 Pet음악</strong><small>내가 좋아요한 음악을 확인해요.</small></span><span className="my-menu-card-arrow">{openActivity==="music"?"⌃":"›"}</span></button>
      {openActivity==="music"&&<div className="bg-card my-activity-card my-accordion-panel">{likedMusicLoading&&!likedMusicLoaded?<div className="bg-sub">불러오는 중…</div>:likedMusic.length?<div style={{display:"grid",gap:8}}>{likedMusic.slice(0,20).map(x=><div key={x.id} className="my-liked-music-row">{x.cover_url?<img src={x.cover_url} alt="" loading="lazy"/>:<span>🎵</span>}<div><b>{x.title}</b><small>♥ {Number(x.like_count)||0}</small></div></div>)}</div>:<div className="bg-sub">아직 좋아요한 음악이 없어요.</div>}</div>}
      <PetDailyHistory account={account} lang={lang} />
    </div>
    <AccountActivityHub lang={lang}/>
    {adminEntry&&(!adminEntry.adminExists||adminEntry.isAdmin||adminEntry.recoveryAvailable)&&<button type="button" className="my-admin-below-activity" onClick={onOpenAdmin}><span>🛡️</span><div><b>{adminEntry.isAdmin?"관리자센터":(adminEntry.adminExists?"관리자 등록/복구":"최초 관리자 등록")}</b><small>운영 데이터는 PIN 인증 후 확인할 수 있어요.</small></div><em>›</em></button>}
    <section className="my-account-manage"><h2>계정 관리</h2><div className="my-account-actions"><button type="button" className="logout" onClick={onLogout}>로그아웃</button><button type="button" className="delete" onClick={onDeleteAccount}>회원탈퇴</button></div>{onGoSupport&&<button type="button" className="bg-btn bg-btn-ghost" style={{width:"100%",marginTop:8}} onClick={onGoSupport}>내 문의 · 고객지원 확인</button>}</section>
  </div>
}

'''
pat=r'function MyPage\(\{ account, allPets, lang, onOpenAccount, onGoPets, onOpenPost, onOpenAdmin \}\) \{.*?\n\}\n\n(?=class PetTalkErrorBoundary)'
s,n=re.subn(pat,component,s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'MyPage replacement {n}')
old='''<MyPage account={account} allPets={allPets} lang={lang}
          onOpenAccount={() => setAccountModalOpen(true)} onGoPets={() => goView("pets")}
          onOpenPost={() => goView("community")} onOpenAdmin={() => goView("admin")} />'''
new='''<MyPage account={account} allPets={allPets} lang={lang}
          onOpenAccount={() => setAccountModalOpen(true)} onGoPets={() => goView("pets")}
          onOpenPost={() => goView("community")} onOpenAdmin={() => goView("admin")}
          onLogout={handleLogout} onDeleteAccount={() => setDeleteAccountConfirmOpen(true)} onGoSupport={() => goView("support")} />'''
if old not in s: raise SystemExit('MyPage call missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8'); print('mypage patch ok')
