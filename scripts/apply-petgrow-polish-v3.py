from pathlib import Path
import re

APP=Path('src/App.jsx'); W=Path('src/PetDailyWidgets.jsx'); T=Path('server_lib/tarot.js'); N=Path('api/news.js')
app=APP.read_text(encoding='utf-8'); w=W.read_text(encoding='utf-8'); t=T.read_text(encoding='utf-8'); n=N.read_text(encoding='utf-8')

def rep(s,old,new,label):
    if old not in s: raise RuntimeError('missing anchor: '+label)
    return s.replace(old,new,1)

# Consistent naming.
for old in ['오늘의 타로','오늘의  Pet타로','Pet 타로']:
    app=app.replace(old,'오늘의 Pet타로' if '오늘의' in old else 'Pet타로')
    w=w.replace(old,'오늘의 Pet타로' if '오늘의' in old else 'Pet타로')
    t=t.replace(old,'오늘의 Pet타로' if '오늘의' in old else 'Pet타로')

# News: real provider images only, no PetGrow placeholder.
n=n.replace('function fallbackImage(category){if(category==="반려견")return "/pettalk-demo-dog.webp";if(category==="반려묘")return "/pettalk-demo-cat.webp";return "/intro-video-poster.webp";}\n','')
n=rep(n,'  const image=item.image||imageFromHtml(item.rawDescription||item.description)||fallbackImage(category);\n  return {id:`${title}|${link}`,title,description,category,source:item.source||sourceFromUrl(link),link,naverLink:item.link||link,publishedAt,image,imageIsFallback:!item.image&&!imageFromHtml(item.rawDescription||item.description)};','  const image=item.image||imageFromHtml(item.rawDescription||item.description)||"";\n  return {id:`${title}|${link}`,title,description,category,source:item.source||sourceFromUrl(link),link,naverLink:item.link||link,publishedAt,image,imageIsFallback:false};','news image')
n=rep(n,'function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));','function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).filter(item=>/^https?:\\/\\//i.test(item.image||"")).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));','news filter')

# Mobile hamburger = desktop sidebar grouping/order.
start=app.index('function HamburgerMenu('); end=app.index('\n\nfunction normalizeNickname',start)
new_ham=r'''function HamburgerMenu({ open, onClose, view, onNavigate, onOpenAccount, account }) {
  const t=useT(),lang=useLang();
  useEffect(()=>{if(!open)return;const prev=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=prev}},[open]);
  const groups=[
    {label:lang==="en"?"PET LIFE":"반려생활",items:[{key:"pets",label:t.myPetsNav,Icon:PawIcon},{key:"nearby",label:t.nearbyNav,Icon:MapPinIcon},{key:"music",label:lang==="en"?"Pet Music":"Pet음악",Icon:MusicIcon}]},
    {label:lang==="en"?"COMMUNITY · CONTENT":"커뮤니티 · 콘텐츠",items:[{key:"community",label:t.communityNav,Icon:TalkIcon},{key:"petbti",label:t.petBtiNav,Icon:PetBtiIcon},{key:"saju",label:t.sajuNav,Icon:SajuIcon},{key:"tarot",label:lang==="en"?"Pet Tarot":"Pet타로",Icon:SajuIcon}]},
    {label:lang==="en"?"INFO · SUPPORT":"정보 · 지원",items:[{key:"tips",label:t.tipsTitle,Icon:LightbulbIcon},{key:"news",label:lang==="en"?"Pet News":"Pet뉴스",Icon:InfoIcon},{key:"about",label:t.aboutNav,Icon:InfoIcon}]}
  ];
  const Btn=({item})=>{const Icon=item.Icon;return <button type="button" className={`ham-nav-item ${view===item.key?"active":""}`} onClick={()=>{onNavigate(item.key);onClose()}}><Icon style={{width:18,height:18}}/><span>{item.label}</span></button>};
  return <><div className={`ham-overlay ${open?"open":""}`} onClick={onClose}/><div className={`ham-panel ${open?"open":""}`} role="dialog"><div className="ham-panel-header"><span style={{fontWeight:800,fontFamily:"'Jua',sans-serif",fontSize:16}}><span style={{color:"var(--text)"}}>Pet</span><span style={{color:"var(--primary)"}}>Grow</span></span><button type="button" className="icon-btn" onClick={onClose} aria-label={t.hamCloseAria}><CloseIcon style={{width:18,height:18}}/></button></div><nav className="ham-nav ham-nav-grouped"><Btn item={{key:"home",label:t.hamNavHome,Icon:HomeIcon}}/>{groups.map(g=><div className="ham-nav-group" key={g.label}><div className="ham-section-label">{g.label}</div>{g.items.map(x=><Btn key={x.key} item={x}/>)}</div>)}<div className="ham-divider"/><Btn item={{key:"my",label:t.hamNavMy,Icon:UserIcon}}/><button type="button" className="ham-nav-item" onClick={()=>{onOpenAccount();onClose()}}><SettingsIcon style={{width:18,height:18}}/><span>{t.hamNavSettings}</span></button></nav></div></>;
}'''
app=app[:start]+new_ham+app[end:]

# News UI only image-backed records, hide broken images rather than substitute.
app=app.replace('const fallback=n=>n?.category==="반려견"?"/pettalk-demo-dog.webp":n?.category==="반려묘"?"/pettalk-demo-cat.webp":"/intro-video-poster.webp";','const fallback=()=>"";')
app=app.replace('const items=(data.items||[]).filter(x=>(category==="전체"||x.category===category)&&(!q||[x.title,x.description,x.source,x.category].some(v=>clean(v).toLowerCase().includes(q))));','const items=(data.items||[]).filter(x=>x.image&&(category==="전체"||x.category===category)&&(!q||[x.title,x.description,x.source,x.category].some(v=>clean(v).toLowerCase().includes(q))));')
app=app.replace('src={n.image||fallback(n)}','src={n.image}')
app=app.replace('onError={e=>{e.currentTarget.src=fallback(n)}}','onError={e=>{e.currentTarget.closest(".petnews-card")?.remove?.();e.currentTarget.style.display="none"}}')

# Practical menu-by-menu information guide.
guide=r'''function InfoGuidePage() {
  const guides=[
    ["🐾","우리 아이","반려동물 등록 → 프로필 사진·체중 기록 → 성장그래프와 성장앨범 확인. 여러 마리를 등록했다면 상단 아이 선택에서 바로 전환할 수 있어요."],
    ["🎵","Pet음악","강아지/고양이 필터로 음악을 찾고 재생·반복재생을 이용해요. 마음에 드는 곡은 좋아요하고 댓글을 남길 수 있어요."],
    ["📍","내 주변 Pet","주소를 검색하면 주변 동물병원·약국·펫샵·미용·호텔을 확인할 수 있어요. 위치 권한을 허용하면 내 위치와의 거리도 함께 볼 수 있어요."],
    ["💬","Pet톡","카테고리를 선택해 글을 읽거나 작성해요. 댓글·좋아요·내 활동에서 내가 쓴 글과 반응을 다시 확인할 수 있어요."],
    ["🔮","Pet사주","등록한 아이를 선택한 뒤 기본 Pet사주·오늘의 펫운세·보호자 궁합을 재미로 확인해요. 전문적인 진단이나 미래 예측 자료는 아니에요."],
    ["🃏","Pet타로","아이와 주제를 선택한 뒤 메이저 아르카나 22장 중 한 장을 골라요. 오늘의 Pet타로·궁합·마음·산책·조언은 주제별 하루 1회이며 결과는 회원정보에 저장할 수 있어요."],
    ["🧠","PetBTI","등록한 아이를 선택하고 20개 질문에 답하면 성향 결과를 확인할 수 있어요. 검사 결과는 우리 아이 정보와 함께 다시 볼 수 있어요."],
    ["💡","Pet정보","건강·식단·훈련·생활 정보를 카테고리와 검색으로 찾아봐요. 건강 정보는 참고용이며 이상 증상은 동물병원 진료를 우선해 주세요."],
    ["📰","Pet뉴스","대표이미지가 확인된 최신 반려동물 기사만 보여줘요. 카드를 누르면 PetGrow 안에서 제목·요약을 읽고 필요할 때 원문 전체보기를 이용해요."],
    ["👤","회원정보","닉네임과 계정 정보를 관리하고 Pet톡 활동, 좋아요한 콘텐츠, 저장한 Pet사주·Pet타로 기록을 확인해요."],
    ["⚙️","설정·지원","회원정보에서 로그아웃·회원탈퇴를 이용할 수 있고, 고객지원에서 공지사항·문의·피드백을 남길 수 있어요."]
  ];
  return <div className="legal-page-shell info-guide-practical"><div className="bg-card info-guide-intro"><b>PetGrow 이용가이드</b><p className="bg-sub">궁금한 기능을 메뉴별로 바로 찾아보세요. 복잡한 설명보다 실제 이용 순서 중심으로 정리했어요.</p></div><div className="info-guide-grid">{guides.map(([ic,title,body])=><section className="bg-card info-guide-card" key={title}><span>{ic}</span><div><h3>{title}</h3><p>{body}</p></div></section>)}</div></div>;
}'''
app=re.sub(r'function InfoGuidePage\(\) \{[\s\S]*?\n\}\n(?=\nfunction )',guide+'\n',app,count=1)

# Remove per-menu help popup; information guide is now the single guide surface.
app=re.sub(r'\n\s*\{effectiveView !== "login" && MENU_HELP\[effectiveView\] && \(\s*<MenuHelpCoach[\s\S]*?\)\}\s*', '\n', app, count=1)

# Terms/privacy explicitly cover tarot topics/history.
app=app.replace('기본 Pet사주, 오늘의 펫운세, 보호자 궁합, Pet타로 및 PetBTI는','기본 Pet사주, 오늘의 펫운세, 보호자 궁합, Pet타로(오늘의 Pet타로·보호자 궁합·우리 아이 마음·산책·활동·오늘의 조언) 및 PetBTI는')
app=app.replace('PetBTI 결과 및 저장되는 서비스 정보','PetBTI 결과, Pet사주·Pet타로 결과 및 이용자가 저장한 타로 기록 등 저장되는 서비스 정보')

# Navigation and guide typography polish.
css=r'''
/* PETGROW_POLISH_V3 */
.petgrow-sidebar-nav button,.ham-nav-item{font-weight:550!important;color:#425048!important}.petgrow-sidebar-nav button span,.ham-nav-item span{font-weight:inherit!important}.petgrow-sidebar-nav button.active,.ham-nav-item.active{font-weight:850!important;color:var(--primary)!important}.ham-nav-group{margin-top:12px}.ham-section-label{padding:8px 13px 5px;font-size:10px;letter-spacing:.12em;font-weight:800;color:#8a948d}.ham-nav-grouped .ham-nav-item{margin:2px 0}.info-guide-practical{max-width:900px;margin:0 auto;padding:0 20px 60px}.info-guide-intro{margin-bottom:14px}.info-guide-intro>b{font-size:19px}.info-guide-intro p{margin:7px 0 0;line-height:1.7}.info-guide-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.info-guide-card{display:flex;gap:13px;align-items:flex-start;padding:18px!important}.info-guide-card>span{font-size:25px}.info-guide-card h3{font-family:inherit!important;font-size:15px!important;font-weight:850!important;margin:0 0 7px!important}.info-guide-card p{font-size:12.5px;line-height:1.72;color:var(--sub);margin:0;word-break:keep-all}@media(max-width:650px){.info-guide-practical{padding:0 14px 90px}.info-guide-grid{grid-template-columns:1fr}.info-guide-card{padding:16px!important}}
'''
app=rep(app,'.app-bottom-nav{position:fixed;',css+'\n.app-bottom-nav{position:fixed;','polish css')

# Tarot: keep deck visible while drawing, add dealt/fan style variables and verify save through history reload.
w=rep(w,'const save=async()=>{if(!recordId)return;setError("");try{const j=await jsonFetch("/api/tarot?action=save",{method:"POST",body:JSON.stringify({id:recordId})});if(!j.ok)throw new Error("저장 상태를 확인하지 못했어요.");setSaved(true);setTodayMap(m=>({...m,[topic]:{...(m[topic]||{}),saved:true}}));window.dispatchEvent(new CustomEvent("petgrow:tarot-saved"));onAnalytics?.("feature_use","saju_tarot_save");}catch(e){setError(e.message)}};','const save=async()=>{if(!recordId)return;setError("");try{const j=await jsonFetch("/api/tarot?action=save",{method:"POST",body:JSON.stringify({id:recordId})});if(!j.ok)throw new Error("저장 상태를 확인하지 못했어요.");const verify=await jsonFetch("/api/tarot?action=history");if(!(verify.items||[]).some(x=>x.id===recordId&&x.saved))throw new Error("저장 확인 중 오류가 발생했어요. 다시 눌러주세요.");setSaved(true);setTodayMap(m=>({...m,[topic]:{...(m[topic]||{}),saved:true}}));window.dispatchEvent(new CustomEvent("petgrow:tarot-saved"));onAnalytics?.("feature_use","saju_tarot_save");}catch(e){setError(e.message)}};','save verify')
w=w.replace('{phase==="choose"&&<>','{(phase==="choose"||phase==="drawing")&&<>')
w=w.replace('className={"pet-tarot-back22 "+(picked===i&&phase==="drawing"?"picked":"")} onClick={()=>draw(i)}','style={{"--r":`${(i-10.5)*2.25}deg`,"--lift":`${Math.abs(i-10.5)*1.1}px`,"--delay":`${i*22}ms`}} className={"pet-tarot-back22 "+(picked===i&&phase==="drawing"?"picked":"")} disabled={phase==="drawing"} onClick={()=>draw(i)}')
extra=r'''
/* PET_TAROT_MOTION_V3 */
.pet-tarot-deck22{display:flex!important;justify-content:center!important;align-items:flex-end!important;gap:0!important;overflow:visible!important;min-height:215px!important;padding:30px 38px 4px!important;max-width:850px!important}.pet-tarot-back22{flex:0 0 62px!important;width:62px!important;aspect-ratio:2/3!important;margin-left:-34px!important;transform-origin:50% 120%!important;transform:rotate(var(--r)) translateY(var(--lift));animation:petTarotDeal .52s cubic-bezier(.2,.8,.25,1) both;animation-delay:var(--delay);z-index:1}.pet-tarot-back22:first-child{margin-left:0!important}.pet-tarot-back22:hover:not(:disabled){transform:rotate(var(--r)) translateY(-18px) scale(1.08)!important;z-index:20}.pet-tarot-back22.picked{z-index:40!important;animation:petTarotPick .62s cubic-bezier(.2,.8,.2,1) both!important}.pet-tarot-back22:disabled:not(.picked){opacity:.38;filter:blur(.2px)}@keyframes petTarotDeal{from{opacity:0;transform:translateY(70px) scale(.72) rotate(0deg)}to{opacity:1;transform:rotate(var(--r)) translateY(var(--lift))}}@keyframes petTarotPick{0%{transform:rotate(var(--r)) translateY(var(--lift))}55%{transform:translateY(-38px) scale(1.22) rotateY(0)}100%{transform:translateY(-44px) scale(1.24) rotateY(180deg)}}.pet-tarot-result-wrap{max-width:720px!important;margin:0 auto!important;grid-template-columns:200px minmax(0,1fr)!important;align-items:start!important;background:#fff;border:1px solid var(--border);border-radius:22px;padding:18px!important}.pet-tarot-reading{text-align:left!important}.pet-tarot-reading h3{font-family:inherit!important;font-weight:850!important;font-size:14px!important;margin:16px 0 6px!important}.pet-tarot-reading p{margin:0!important;line-height:1.75!important}.pet-tarot-actions{grid-column:1/-1!important;border-top:1px solid var(--border);padding-top:14px!important;margin-top:4px!important}.pet-tarot-actions .bg-btn{width:100%!important}.pet-tarot-luck{margin-top:16px!important;padding:12px 14px!important;border-radius:14px!important;background:#f3f8f3!important}.pet-tarot-loading{font-weight:800;color:var(--primary);padding:12px}@media(max-width:760px){.pet-tarot-deck22{justify-content:flex-start!important;overflow-x:auto!important;overflow-y:hidden!important;padding:28px 36px 18px 46px!important;scrollbar-width:none}.pet-tarot-deck22::-webkit-scrollbar{display:none}.pet-tarot-back22{flex-basis:58px!important;width:58px!important;margin-left:-31px!important}.pet-tarot-result-wrap{grid-template-columns:150px minmax(0,1fr)!important}}@media(max-width:480px){.pet-tarot-result-wrap{grid-template-columns:1fr!important}.pet-tarot-face{width:min(210px,72vw)!important;margin:0 auto!important}.pet-tarot-reading{padding-top:2px!important}}
@media(prefers-reduced-motion:reduce){.pet-tarot-back22{animation:none!important;transition:none!important}.pet-tarot-back22.picked{animation:none!important;transform:translateY(-14px)!important}}
'''
w=w.replace('export const PET_DAILY_CSS=`','export const PET_DAILY_CSS=`\n'+extra)

APP.write_text(app,encoding='utf-8'); W.write_text(w,encoding='utf-8'); T.write_text(t,encoding='utf-8'); N.write_text(n,encoding='utf-8')
print('polish v3 applied')
