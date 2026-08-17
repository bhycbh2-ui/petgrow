from pathlib import Path

app=Path('src/App.jsx')
s=app.read_text(encoding='utf-8')

# Admin page: some nested admin controls still reference onClose; map it to the page back action.
s=s.replace('function AdminReportsPage({onBack}){\n const adminAutofillTrap=', 'function AdminReportsPage({onBack}){\n const onClose=onBack;\n const adminAutofillTrap=', 1)

# Pet profile image: use a much smaller avatar payload so replacing a pet photo does not exceed cloud-state request limits.
s=s.replace('const dataUrl = await fileToCompressedDataUrl(file);\n      onChange(dataUrl);', 'const dataUrl = await fileToCompressedDataUrl(file,480,.70);\n      onChange(dataUrl);', 1)
s=s.replace('const dataUrl = await fileToCompressedDataUrl(file);\n      onUpdateProfileImage(dataUrl);', 'const dataUrl = await fileToCompressedDataUrl(file,480,.70);\n      onUpdateProfileImage(dataUrl);', 1)

# PetTalk: guard the full community screen from a runtime crash and keep a usable feed fallback.
community_marker='// allPets: 강아지+고양이 통합 목록, onGoRegister: 등록된 아이가 없을 때 \'우리 아이\' 등록으로 보내는 콜백\nfunction CommunityPage'
if 'class PetTalkErrorBoundary' not in s and community_marker in s:
    fallback='''class PetTalkErrorBoundary extends React.Component {\n  constructor(props){super(props);this.state={error:false};}\n  static getDerivedStateFromError(){return {error:true};}\n  componentDidCatch(err){console.error("PetTalk render error",err);}\n  render(){return this.state.error?<PetTalkFallback/>:this.props.children;}\n}\nfunction PetTalkFallback(){\n  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");\n  const load=()=>{setLoading(true);setError("");fetch("/api/community?action=posts&category=all&sort=latest&page=1",{credentials:"include"}).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j?.message||j?.error||"Pet톡을 불러오지 못했어요.");return j;}).then(j=>setItems(j.posts||[])).catch(e=>setError(e.message||"Pet톡을 불러오지 못했어요.")).finally(()=>setLoading(false));};\n  useEffect(()=>{load()},[]);\n  return <div className="legal-page-shell pettalk-safe-fallback"><div className="bg-card" style={{padding:20}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}><div><small className="my-page-kicker">PETGROW TALK</small><h2 style={{margin:'5px 0'}}>Pet톡</h2><p className="bg-sub" style={{margin:0}}>반려생활 이야기를 편하게 나눠보세요.</p></div><button className="bg-chip" onClick={load}>새로고침</button></div>{loading?<div className="bg-sub" style={{padding:'28px 0',textAlign:'center'}}>Pet톡을 불러오는 중…</div>:error?<div className="nearby-message" style={{marginTop:16}}>{error}</div>:<div style={{display:'grid',gap:10,marginTop:16}}>{items.length?items.map(p=><div key={p.id} className="bg-card" style={{padding:14,border:'1px solid var(--border)'}}><small style={{fontWeight:800,color:'var(--primary)'}}>{p.authorNickname||'PetGrow 회원'} · {p.pet?.name||'우리 아이'}</small><b style={{display:'block',fontSize:15,marginTop:5}}>{p.title}</b><p className="bg-sub" style={{fontSize:12,lineHeight:1.6,margin:'5px 0 0'}}>{String(p.content||'').slice(0,180)}</p></div>):<div className="bg-sub" style={{padding:'24px 0',textAlign:'center'}}>아직 등록된 Pet톡이 없어요.</div>}</div>}</div></div>;\n}\n\n'''
    s=s.replace(community_marker,fallback+community_marker,1)

s=s.replace('<CommunityPage allPets={allPets} account={account} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} />','<PetTalkErrorBoundary><CommunityPage allPets={allPets} account={account} onGoRegister={() => { setMode("onboarding"); goView("pets"); }} /></PetTalkErrorBoundary>',1)

# PetMusic admin: new uploads no longer require a cover image; use a plain white placeholder by default.
s=s.replace('if(!editing&&!form.coverFile)return window.alert("커버 이미지를 선택해 주세요.");','')
s=s.replace('let audioUrl=editing?.audio_url||form.audioUrl||"",coverUrl=editing?.cover_url||form.coverUrl||"";','let audioUrl=editing?.audio_url||form.audioUrl||"",coverUrl=editing?.cover_url||form.coverUrl||"/petmusic/covers/blank-white.svg";',1)
s=s.replace('음원·제목·커버 이미지를 등록하면 사용자 Pet음악 메뉴에 연결돼요.', '음원을 등록하면 제목·설명과 함께 사용자 Pet음악 메뉴에 연결돼요. 새 음악의 커버는 기본 흰색으로 등록되고, 이후 수정에서 원하는 사진으로 교체할 수 있어요.',1)

# Show the map on every responsive layout and prevent parent clipping.
css_anchor='  /* ===== 내 주변 Pet ===== */'
extra_css='''  /* PETGROW_STABILITY_V2_20260817 */\n  .nearby-map-card{display:block!important;visibility:visible!important;overflow:hidden!important}.nearby-map{display:block!important;visibility:visible!important;width:100%!important;min-height:380px!important}.nearby-map .leaflet-container{width:100%!important;height:100%!important;min-height:380px!important}\n  .pettalk-safe-fallback{max-width:900px!important;margin:0 auto!important}\n'''
if 'PETGROW_STABILITY_V2_20260817' not in s and css_anchor in s:
    s=s.replace(css_anchor,extra_css+css_anchor,1)

app.write_text(s,encoding='utf-8')

# Tarot sequence and responsive motion.
tar=Path('src/PetDailyWidgets.jsx')
t=tar.read_text(encoding='utf-8')

# Topic selection now follows a short guided sequence: prompt -> focus -> shuffle -> choose.
old='const chooseTopic=(key)=>{setTopic(key);setError("");const old=todayMap[key];if(old){setResult(old.result_json);setRecordId(old.id);setSaved(!!old.saved);setPhase("result");}else{setResult(null);setRecordId("");setSaved(false);setPicked(-1);setPhase("shuffle");window.setTimeout(()=>setPhase("choose"),720);}};'
new='const chooseTopic=(key)=>{setTopic(key);setError("");const old=todayMap[key];if(old){setResult(old.result_json);setRecordId(old.id);setSaved(!!old.saved);setPhase("result");}else{setResult(null);setRecordId("");setSaved(false);setPicked(-1);setPhase("prompt");window.setTimeout(()=>setPhase("focus"),650);window.setTimeout(()=>setPhase("shuffle"),1350);window.setTimeout(()=>setPhase("choose"),2200);}};'
if old in t:t=t.replace(old,new,1)

# Add guided copy before shuffle.
needle='{phase==="shuffle"&&<div className="pet-tarot-shuffle-scene">'
insert='{phase==="prompt"&&<div className="pet-tarot-guide-step"><span>🃏</span><b>카드를 뽑아주세요</b><small>오늘 마음이 가는 한 장을 천천히 골라볼게요.</small></div>}\n      {phase==="focus"&&<div className="pet-tarot-guide-step focus"><span>✦</span><b>카드에 집중해 주세요</b><small>우리 아이를 떠올리며 잠시 카드에 마음을 모아보세요.</small></div>}\n      '+needle
if 'pet-tarot-guide-step' not in t and needle in t:t=t.replace(needle,insert,1)

t=t.replace('<b>오늘의 카드가 열렸어요</b>','<b>짜잔! 오늘의 카드가 열렸어요</b>',1)
t=t.replace('선택한 카드의 메시지를 펼치는 중…','선택한 카드를 천천히 펼치는 중…',1)

marker='/* PET_TAROT_PREMIUM_V6 */'
css='''/* PET_TAROT_SEQUENCE_V7 */\n.pet-tarot-guide-step{min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;animation:tarotGuideIn .5s cubic-bezier(.2,.8,.2,1) both}.pet-tarot-guide-step>span{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;font-size:31px;color:#f4dfaa;background:linear-gradient(145deg,#1b3b2f,#2d5b46);box-shadow:0 16px 34px rgba(34,67,51,.18)}.pet-tarot-guide-step>b{font-size:20px;letter-spacing:-.03em;margin-top:9px}.pet-tarot-guide-step>small{font-size:12px;color:#7a867e;line-height:1.6}.pet-tarot-guide-step.focus>span{animation:tarotFocusPulse 1.15s ease-in-out infinite}@keyframes tarotGuideIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}@keyframes tarotFocusPulse{0%,100%{transform:scale(1);box-shadow:0 14px 30px rgba(34,67,51,.16)}50%{transform:scale(1.06);box-shadow:0 18px 42px rgba(198,166,91,.22)}}\n.pet-tarot-shell,.pet-tarot-stage{overflow:visible!important}.pet-tarot-deck22{box-sizing:border-box!important;width:100%!important;max-width:100%!important;padding-top:34px!important;padding-bottom:66px!important}.pet-tarot-back22{transform-origin:50% 100%!important}.pet-tarot-reveal-scene{overflow:visible!important;padding:24px 10px!important}.pet-tarot-result-wrap{box-sizing:border-box!important;width:100%!important}\n@media(max-width:680px){.pet-tarot-shell{width:100%!important;max-width:100%!important}.pet-tarot-stage{overflow:visible!important;padding-left:14px!important;padding-right:14px!important}.pet-tarot-guide-step{min-height:250px}.pet-tarot-guide-step>span{width:62px;height:62px;font-size:27px}.pet-tarot-deck22{display:flex!important;align-items:flex-end!important;gap:0!important;overflow-x:auto!important;overflow-y:visible!important;scroll-snap-type:x proximity!important;-webkit-overflow-scrolling:touch!important;padding:38px 22px 78px!important;margin-left:0!important;margin-right:0!important}.pet-tarot-back22{flex:0 0 66px!important;min-width:66px!important;scroll-snap-align:center!important;margin-left:-12px!important}.pet-tarot-back22:first-child{margin-left:0!important}.pet-tarot-back22.picked{transform:translateY(-36px) scale(1.08) rotate(0)!important}.pet-tarot-reveal-scene{min-height:360px!important;padding:28px 4px 34px!important}.pet-tarot-reveal-card{width:min(205px,58vw)!important}.pet-tarot-result-wrap{padding:14px!important;margin-left:0!important;margin-right:0!important}.pet-tarot-result-topic{margin-left:0!important;margin-right:0!important}.pet-tarot-face{max-width:198px!important}}\n@media(max-width:390px){.pet-tarot-stage{padding-left:10px!important;padding-right:10px!important}.pet-tarot-deck22{padding-left:14px!important;padding-right:14px!important}.pet-tarot-back22{flex-basis:62px!important;min-width:62px!important}.pet-tarot-reveal-card{width:190px!important}}\n'''
if 'PET_TAROT_SEQUENCE_V7' not in t:
    if marker in t:t=t.replace(marker,css+'\n'+marker,1)
    else:t=t+'\n'+css

tar.write_text(t,encoding='utf-8')
print('stability v2 patch applied')
