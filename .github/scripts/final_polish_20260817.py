from pathlib import Path
import re

app=Path('src/App.jsx')
s=app.read_text()

# PetTalk route hardening
m=re.search(r'const\s+GATED_VIEWS\s*=\s*\[(.*?)\]',s,re.S)
if m:
    body=m.group(1)
    body=re.sub(r'(["\'])community\1\s*,?', '', body)
    s=s[:m.start(1)]+body+s[m.end(1):]
s=s.replace('view === "community" ? (','effectiveView === "community" ? (')
s=s.replace("view === 'community' ? (","effectiveView === 'community' ? (")
s=s.replace('onOpenPost={() => setView("community")}', 'onOpenPost={() => goView("community")}')
s=s.replace("onOpenPost={() => setView('community')}", "onOpenPost={() => goView('community')}")

# PetPoint idempotent spending UI
old='async function petPointSpend(feature){const r=await apiJson("/api/points?action=spend",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({feature})});if(r?.spent)window.dispatchEvent(new CustomEvent("petgrow:points",{detail:{amount:-r.spent,balance:r.balance,label:r.label||"PetPoint 사용"}}));return r;}'
if old in s:
    s=s.replace(old,'const petPointKstDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());\nasync function petPointSpend(feature,refKey=null){const r=await apiJson("/api/points?action=spend",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({feature,refKey})});if(r?.spent)window.dispatchEvent(new CustomEvent("petgrow:points",{detail:{amount:-r.spent,balance:r.balance,label:r.label||"PetPoint 사용"}}));return r;}')
s=s.replace('const setMode=(next)=>{if(next==="daily"||next==="fortune"){petPointSpend("saju_daily").then(()=>setModeRaw(next)).catch(e=>window.alert(e.message));return;}setModeRaw(next);};','const setMode=(next)=>{if(next==="daily"||next==="fortune"){const ref=`saju-daily:${pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"}:${petPointKstDate()}`;petPointSpend("saju_daily",ref).then(()=>setModeRaw(next)).catch(e=>window.alert(e.message));return;}setModeRaw(next);};')
s=s.replace('try{await petPointSpend("saju_compat")}catch(e){window.alert(e.message);return;}','try{const ref=`saju-compat:${pet?.id||pet?.profile?.id||petName}:${guardianBirthDate}:${name.toLowerCase()}`;await petPointSpend("saju_compat",ref)}catch(e){window.alert(e.message);return;}')
old_basic='const startBasic = () => setInput({ name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, gender: pet.profile.gender, birthTime: "", breed: pet.profile.breedName, profileImage: pet.profile.profileImage || null });'
if old_basic in s:
    s=s.replace(old_basic,'const startBasic = async () => {try{const ref=`saju-basic:${pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"}`;await petPointSpend("saju_basic",ref)}catch(e){window.alert(e.message);return;}setInput({ name: pet.profile.name, species: pet.profile.species, birthDate: pet.profile.birthDate, gender: pet.profile.gender, birthTime: "", breed: pet.profile.breedName, profileImage: pet.profile.profileImage || null });};')

# Guide redesign
start=s.find('function InfoGuidePage()')
if start<0: raise SystemExit('InfoGuidePage not found')
nextm=re.search(r'\nfunction [A-Z][A-Za-z0-9_]*\(',s[start+10:])
if not nextm: raise SystemExit('next component not found')
end=start+10+nextm.start()+1
new_guide='''function InfoGuidePage() {
  const [guideSearch,setGuideSearch]=useState("");
  const [activeKey,setActiveKey]=useState("pets");
  const guides=[
    {key:"pets",icon:"🐾",title:"우리 아이",sub:"프로필과 기본정보를 한곳에서",tone:"mint",intro:"반려동물 정보를 먼저 등록하면 PetGrow의 다른 기능을 더 편하게 이용할 수 있어요.",steps:["우리 아이 메뉴에서 강아지 또는 고양이를 선택해요.","이름·생년월일·품종·성별·현재 체중과 사진을 입력해요.","등록 후 성장기록과 각 콘텐츠에서 우리 아이를 선택해 이용해요."],faq:"여러 마리를 등록해도 아이 선택 메뉴에서 바로 바꿀 수 있어요.",tip:"처음이라면 가장 먼저 우리 아이 등록부터 시작해 보세요."},
    {key:"growth",icon:"📈",title:"성장 기록",sub:"사진과 체중 변화를 차곡차곡",tone:"sage",intro:"하루하루 달라지는 모습을 사진과 체중 기록으로 모아볼 수 있어요.",steps:["우리 아이에서 성장 기록을 열어요.","날짜와 체중을 입력하고 필요하면 사진을 추가해요.","누적된 기록과 그래프로 변화 흐름을 확인해요."],faq:"사진은 성장앨범에서 수정하거나 삭제할 수 있어요.",tip:"같은 시간대와 비슷한 조건으로 체중을 기록하면 변화 비교가 쉬워요."},
    {key:"saju",icon:"🔮",title:"Pet사주",sub:"재미로 보는 우리 아이 이야기",tone:"cream",intro:"등록한 생년월일을 바탕으로 성격·인연·놀이 스타일과 오늘의 운세를 재미로 살펴봐요.",steps:["등록된 우리 아이를 선택해요.","기본 Pet사주·오늘의 펫운세·보호자 궁합 중 원하는 메뉴를 골라요.","필요한 PetPoint를 확인한 뒤 결과를 읽어봐요."],faq:"Pet사주는 재미와 참고용 콘텐츠이며 실제 미래를 판단하는 자료가 아니에요.",tip:"결과는 우리 아이의 실제 행동과 함께 가볍게 참고해 주세요."},
    {key:"tarot",icon:"🃏",title:"Pet타로",sub:"22장 중 마음이 가는 카드 한 장",tone:"gold",intro:"카드를 천천히 섞고 펼친 뒤 마음이 가는 한 장을 골라 오늘의 메시지를 확인해요.",steps:["오늘·궁합·마음·산책·조언 중 주제를 선택해요.","카드가 섞이고 펼쳐지는 동안 우리 아이를 떠올려요.","22장 중 한 장을 선택하고 상세 해석을 확인해요."],faq:"같은 아이·같은 주제의 오늘 카드는 하루 동안 바뀌지 않아요.",tip:"카드 한 장보다 결과의 ‘오늘의 실천 포인트’를 가볍게 활용해 보세요."},
    {key:"petbti",icon:"🧠",title:"PetBTI",sub:"20문항으로 알아보는 행동 성향",tone:"blue",intro:"평소 행동을 기준으로 질문에 답하면 우리 아이의 성향을 재미있게 확인할 수 있어요.",steps:["검사할 우리 아이를 선택해요.","20개 질문에 평소 행동을 떠올리며 답해요.","완료 후 성향 결과와 세부 특징을 확인해요."],faq:"전문 행동진단이 아니라 반려생활 이해를 돕는 재미 콘텐츠예요.",tip:"특별한 날보다 평소 모습에 가까운 답을 고르는 게 좋아요."},
    {key:"music",icon:"🎵",title:"Pet음악",sub:"강아지·고양이 음악을 편하게",tone:"rose",intro:"휴식·수면·놀이 등에 어울리는 음악을 듣고 좋아요와 댓글로 반응을 남길 수 있어요.",steps:["전체·강아지·고양이 탭에서 음악을 찾아요.","원하는 곡을 눌러 재생하고 반복 방식을 선택해요.","좋아하는 음악은 좋아요를 눌러 회원정보에서 다시 확인해요."],faq:"관리자가 등록한 음악과 커버는 관리자센터에서 수정할 수 있어요.",tip:"음악은 반려동물의 반응을 보면서 편안한 볼륨으로 들려주세요."},
    {key:"nearby",icon:"📍",title:"내 주변 Pet",sub:"1km 안의 가까운 업체를 가볍게",tone:"mint",intro:"주소나 현재 위치를 기준으로 가까운 동물병원·약국·미용·펫샵 등을 찾아볼 수 있어요.",steps:["주소를 검색하거나 현재 위치 검색을 선택해요.","1km 안의 가까운 업체를 목록과 지도에서 확인해요.","목록에서 업체를 누르면 지도에서 해당 위치를 집중해서 볼 수 있어요."],faq:"현재 위치는 주변 검색과 거리 계산에 일시적으로만 사용돼요.",tip:"업체 정보와 영업시간은 방문 전에 전화나 지도 원문에서 한 번 더 확인해 주세요."},
    {key:"community",icon:"💬",title:"Pet톡",sub:"반려생활 이야기를 나누는 커뮤니티",tone:"sage",intro:"일상·질문·건강·산책 등 다양한 주제로 다른 보호자들과 이야기를 나눌 수 있어요.",steps:["Pet톡에서 원하는 카테고리나 글을 찾아봐요.","글쓰기에서 우리 아이와 제목·내용·사진을 등록해요.","댓글과 좋아요로 소통하고 회원정보에서 내 활동을 확인해요."],faq:"글과 댓글 활동으로 PetPoint를 모을 수 있으며 일일 적립 한도가 있어요.",tip:"개인정보나 타인의 권리를 침해하는 내용은 게시하지 말아 주세요."},
    {key:"news",icon:"📰",title:"Pet뉴스",sub:"최신 반려동물 소식을 보기 쉽게",tone:"cream",intro:"반려견·반려묘·건강·정책 등 최신 뉴스를 요약과 함께 확인할 수 있어요.",steps:["Pet뉴스 목록에서 관심 있는 기사를 선택해요.","PetGrow 안에서 핵심 요약을 먼저 확인해요.","자세한 내용은 원문 전체보기를 통해 언론사 페이지에서 확인해요."],faq:"뉴스는 기사 전문을 복사하지 않고 검색 결과의 설명을 바탕으로 요약해 보여줘요.",tip:"의료·정책 관련 내용은 기사 작성일과 원문을 함께 확인해 주세요."},
    {key:"points",icon:"🪙",title:"PetPoint",sub:"활동하고 모아서 재미 콘텐츠 이용",tone:"gold",intro:"현금 결제가 아닌 PetGrow 내부 무료 활동 포인트예요. Pet톡 활동과 하루 첫 접속으로 모을 수 있어요.",steps:["처음 이용하면 기본 300P가 지급돼요.","Pet톡 글·댓글·좋아요 받기와 하루 첫 접속으로 포인트를 모아요.","Pet사주·오늘의 운세·보호자 궁합·Pet타로 이용 시 안내된 포인트가 차감돼요."],faq:"현금 구매·환전·출금·양도는 지원하지 않아요.",tip:"회원정보와 홈에서 현재 포인트를 실시간으로 확인할 수 있어요."},
    {key:"my",icon:"👤",title:"회원정보",sub:"계정·내 활동·저장 기록 관리",tone:"blue",intro:"닉네임과 계정 정보, Pet톡 활동, 좋아요한 음악과 저장 기록을 한곳에서 관리해요.",steps:["회원정보에서 현재 계정과 PetPoint를 확인해요.","Pet톡 내 활동과 좋아요한 콘텐츠를 펼쳐 확인해요.","필요하면 정보 수정·로그아웃·회원탈퇴 메뉴를 이용해요."],faq:"동일한 카카오 계정으로 로그인하면 서버에 저장된 지원 데이터가 동기화돼요.",tip:"회원탈퇴 전 필요한 기록이 남아 있는지 먼저 확인해 주세요."}
  ];
  const q=guideSearch.trim().toLowerCase();
  const filtered=guides.filter(g=>!q||`${g.title} ${g.sub} ${g.intro} ${g.steps.join(" ")} ${g.faq} ${g.tip}`.toLowerCase().includes(q));
  const active=guides.find(g=>g.key===activeKey)||guides[0];
  const quick=["pets","growth","saju","tarot","petbti","music","nearby","community","news","my"];
  return <div className="guide-premium-page">
    <section className="guide-premium-hero"><div className="guide-hero-copy"><small>PETGROW GUIDE</small><h1>정보가이드</h1><p>처음 사용하는 분도 헤매지 않도록, 필요한 기능을 쉽고 빠르게 안내해드려요.</p><div className="guide-search-box"><span>⌕</span><input value={guideSearch} onChange={e=>setGuideSearch(e.target.value)} placeholder="무엇을 도와드릴까요? 예: 타로, 음악, 포인트" /></div></div><div className="guide-hero-art" aria-hidden="true"><div className="guide-art-sun">✦</div><div className="guide-art-pet dog">🐶</div><div className="guide-art-pet cat">🐱</div><span className="guide-art-leaf l1">🌿</span><span className="guide-art-leaf l2">🍃</span></div></section>
    {!q&&<section className="guide-start-card"><div className="guide-section-title"><div><small>START HERE</small><h2>처음 시작 3단계</h2></div><span>처음이라면 이 순서대로 해보세요</span></div><div className="guide-start-grid"><article><b>1</b><span>🐾</span><h3>우리 아이 등록</h3><p>기본 정보를 입력하고 프로필을 만들어보세요.</p></article><article><b>2</b><span>▦</span><h3>기능 선택</h3><p>필요한 기능을 골라 PetGrow를 둘러보세요.</p></article><article><b>3</b><span>💬</span><h3>기록 · 커뮤니티</h3><p>기록을 남기고 Pet톡에서 함께 소통해보세요.</p></article></div></section>}
    {!q&&<section className="guide-quick-section"><div className="guide-section-title"><div><small>POPULAR</small><h2>자주 찾는 기능</h2></div><span>카드를 누르면 바로 설명을 볼 수 있어요</span></div><div className="guide-quick-grid">{quick.map(k=>{const g=guides.find(x=>x.key===k);return <button key={k} type="button" className={`guide-quick-card tone-${g.tone} ${activeKey===k?"active":""}`} onClick={()=>{setActiveKey(k);document.getElementById("guide-detail")?.scrollIntoView({behavior:"smooth",block:"start"})}}><span>{g.icon}</span><b>{g.title}</b><small>{g.sub}</small></button>})}</div></section>}
    {q&&<section className="guide-search-results"><div className="guide-section-title"><div><small>SEARCH</small><h2>검색 결과 {filtered.length}개</h2></div></div><div className="guide-search-result-grid">{filtered.map(g=><button key={g.key} type="button" onClick={()=>{setActiveKey(g.key);setGuideSearch("");setTimeout(()=>document.getElementById("guide-detail")?.scrollIntoView({behavior:"smooth",block:"start"}),30)}}><span>{g.icon}</span><div><b>{g.title}</b><small>{g.sub}</small></div><em>›</em></button>)}</div>{!filtered.length&&<div className="guide-empty">검색 결과가 없어요. 다른 단어로 검색해보세요.</div>}</section>}
    <section id="guide-detail" className={`guide-detail-card tone-${active.tone}`}><div className="guide-detail-visual"><div className="guide-detail-orb">{active.icon}</div><span>PetGrow</span><i>✦</i></div><div className="guide-detail-main"><small>FEATURE GUIDE</small><h2>{active.title}</h2><p className="guide-detail-intro">{active.intro}</p><div className="guide-detail-tabs"><span className="active">이용 방법</span><span>초보자 팁</span><span>꼭 알아두기</span></div><div className="guide-step-list">{active.steps.map((step,i)=><article key={i}><b>{i+1}</b><div><h3>{i===0?"시작하기":i===1?"이용하기":"확인하기"}</h3><p>{step}</p></div></article>)}</div><div className="guide-note-grid"><div><b>💡 초보자 TIP</b><p>{active.tip}</p></div><div><b>✓ 꼭 알아두기</b><p>{active.faq}</p></div></div></div></section>
    <PetPointGuideCard />
  </div>;
}
'''
s=s[:start]+new_guide+s[end:]

css='''
  /* PETGROW_GUIDE_PREMIUM_20260817 */
  .guide-premium-page{max-width:1120px;margin:0 auto;padding:4px 0 38px}.guide-premium-hero{min-height:300px;border:1px solid #e2eadf;border-radius:30px;background:linear-gradient(135deg,#fffdf8 0%,#f8fbf4 58%,#eef6eb 100%);display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(55,75,58,.07)}.guide-hero-copy{padding:44px 48px;position:relative;z-index:2}.guide-hero-copy>small,.guide-section-title small,.guide-detail-main>small{font-size:10px;font-weight:900;letter-spacing:.15em;color:#4f8a5b}.guide-hero-copy h1{font-size:34px;margin:8px 0 8px;letter-spacing:-.04em}.guide-hero-copy>p{color:var(--sub);font-size:14px;line-height:1.7;margin:0 0 24px}.guide-search-box{height:54px;background:#fff;border:1px solid #d8e4d6;border-radius:18px;display:flex;align-items:center;gap:10px;padding:0 16px;max-width:620px;box-shadow:0 8px 24px rgba(56,85,62,.07)}.guide-search-box span{font-size:21px;color:#6f7d72}.guide-search-box input{border:0;outline:0;background:transparent;width:100%;font:inherit;font-size:13px;color:var(--text)}.guide-hero-art{position:relative;min-height:300px;background:radial-gradient(circle at 50% 70%,#dcebd7 0 28%,transparent 29%),radial-gradient(circle at 76% 76%,#c8ddc2 0 24%,transparent 25%)}.guide-art-pet{position:absolute;bottom:42px;font-size:82px;filter:drop-shadow(0 10px 9px rgba(50,70,55,.12))}.guide-art-pet.dog{left:24px}.guide-art-pet.cat{right:42px;font-size:68px}.guide-art-sun{position:absolute;right:62px;top:42px;width:46px;height:46px;border:1px solid #dfc995;border-radius:50%;display:grid;place-items:center;color:#b89445;background:#fff8e8}.guide-art-leaf{position:absolute;font-size:34px}.guide-art-leaf.l1{left:10px;bottom:14px}.guide-art-leaf.l2{right:9px;bottom:12px}.guide-start-card,.guide-quick-section,.guide-search-results{margin-top:18px;border:1px solid #e6ebe3;background:#fff;border-radius:24px;padding:24px;box-shadow:0 12px 34px rgba(55,75,58,.045)}.guide-section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}.guide-section-title h2{margin:4px 0 0;font-size:20px}.guide-section-title>span{font-size:11px;color:var(--sub)}.guide-start-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.guide-start-grid article{border:1px solid #e5eadf;background:linear-gradient(180deg,#fff,#fbfcf9);border-radius:19px;padding:20px;position:relative;text-align:center;min-height:180px}.guide-start-grid article>b{position:absolute;left:13px;top:12px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#2f6b43;color:#fff;font-size:12px}.guide-start-grid article>span{display:block;font-size:38px;margin:12px 0 10px}.guide-start-grid h3{font-size:16px;margin:0 0 7px}.guide-start-grid p{font-size:12px;line-height:1.65;color:var(--sub);margin:0}.guide-quick-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.guide-quick-card{border:1px solid #e3e8df;border-radius:17px;background:#fff;padding:15px 10px;min-height:126px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;transition:.18s ease}.guide-quick-card:hover,.guide-quick-card.active{transform:translateY(-2px);border-color:#a9c7ae;box-shadow:0 10px 22px rgba(61,99,70,.08)}.guide-quick-card>span{font-size:29px}.guide-quick-card>b{font-size:13px}.guide-quick-card>small{font-size:10px;line-height:1.45;color:var(--sub);text-align:center}.guide-search-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.guide-search-result-grid button{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;border:1px solid #e4e9e1;background:#fff;border-radius:15px;padding:13px;text-align:left;cursor:pointer}.guide-search-result-grid button>span{font-size:25px}.guide-search-result-grid b{display:block;font-size:13px}.guide-search-result-grid small{display:block;color:var(--sub);font-size:10px;margin-top:3px}.guide-search-result-grid em{font-style:normal;font-size:22px;color:#77947e}.guide-empty{text-align:center;color:var(--sub);padding:35px}.guide-detail-card{margin-top:18px;border:1px solid #e3e8df;background:#fff;border-radius:26px;display:grid;grid-template-columns:300px minmax(0,1fr);overflow:hidden;box-shadow:0 16px 42px rgba(55,75,58,.06);scroll-margin-top:20px}.guide-detail-visual{min-height:520px;background:linear-gradient(160deg,#edf5eb,#f8f4e9);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden}.guide-detail-visual:before,.guide-detail-visual:after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.58)}.guide-detail-visual:before{width:210px;height:210px;left:-60px;bottom:-55px}.guide-detail-visual:after{width:160px;height:160px;right:-60px;top:40px}.guide-detail-orb{width:126px;height:126px;border-radius:38px;background:#fff;border:1px solid #dfe8db;display:grid;place-items:center;font-size:58px;box-shadow:0 18px 42px rgba(56,85,62,.11);z-index:1}.guide-detail-visual>span{margin-top:18px;font-size:12px;font-weight:900;letter-spacing:.12em;color:#52745a;z-index:1}.guide-detail-visual>i{font-style:normal;color:#b89a55;margin-top:9px;z-index:1}.guide-detail-main{padding:34px 38px}.guide-detail-main h2{font-size:27px;margin:5px 0 8px}.guide-detail-intro{font-size:14px;line-height:1.75;color:#5e6a61;margin:0 0 19px}.guide-detail-tabs{display:flex;gap:7px;border-bottom:1px solid #e8ece5;padding-bottom:10px;margin-bottom:12px}.guide-detail-tabs span{font-size:10.5px;font-weight:800;padding:7px 10px;border-radius:999px;background:#f5f7f3;color:#7c867f}.guide-detail-tabs span.active{background:#315f40;color:#fff}.guide-step-list{display:grid;gap:9px}.guide-step-list article{display:grid;grid-template-columns:34px 1fr;gap:11px;padding:13px;border:1px solid #e7ebe4;border-radius:15px;background:#fff}.guide-step-list article>b{width:30px;height:30px;border-radius:50%;background:#edf5ee;color:#3d7950;display:grid;place-items:center;font-size:11px}.guide-step-list h3{font-size:12px;margin:0 0 4px}.guide-step-list p{font-size:11.5px;line-height:1.6;color:#667168;margin:0}.guide-note-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}.guide-note-grid>div{padding:14px;border-radius:15px;background:#f7faf5;border:1px solid #e5ebe2}.guide-note-grid b{font-size:11px;color:#426e4e}.guide-note-grid p{font-size:10.5px;line-height:1.6;color:#68736c;margin:6px 0 0}.guide-detail-card.tone-gold .guide-detail-visual{background:linear-gradient(160deg,#fbf5e6,#eff5e9)}.guide-detail-card.tone-rose .guide-detail-visual{background:linear-gradient(160deg,#fff4f5,#f0f6ed)}.guide-detail-card.tone-blue .guide-detail-visual{background:linear-gradient(160deg,#eef5f8,#f5f8ee)}.guide-detail-card.tone-cream .guide-detail-visual{background:linear-gradient(160deg,#fbf6eb,#eef5eb)}
  @media(max-width:820px){.guide-premium-page{padding:0 12px 30px}.guide-premium-hero{grid-template-columns:1fr;min-height:0}.guide-hero-copy{padding:25px 20px 20px}.guide-hero-copy h1{font-size:28px}.guide-hero-art{min-height:170px}.guide-art-pet{font-size:66px;bottom:18px}.guide-art-pet.cat{font-size:56px;right:24px}.guide-start-card,.guide-quick-section,.guide-search-results{padding:17px;border-radius:20px}.guide-section-title{align-items:flex-start}.guide-section-title>span{display:none}.guide-start-grid{grid-template-columns:1fr}.guide-start-grid article{min-height:0;text-align:left;padding:16px 16px 16px 62px}.guide-start-grid article>b{left:16px;top:16px}.guide-start-grid article>span{font-size:24px;margin:0 0 5px}.guide-quick-grid{grid-template-columns:repeat(2,1fr)}.guide-quick-card{min-height:114px}.guide-search-result-grid{grid-template-columns:1fr}.guide-detail-card{grid-template-columns:1fr;border-radius:21px}.guide-detail-visual{min-height:190px}.guide-detail-orb{width:92px;height:92px;border-radius:28px;font-size:43px}.guide-detail-main{padding:22px 18px}.guide-detail-main h2{font-size:23px}.guide-note-grid{grid-template-columns:1fr}.guide-detail-tabs{overflow-x:auto;white-space:nowrap}.guide-search-box{height:49px}.petpoint-guide-hero{margin-left:0!important;margin-right:0!important}}
'''
marker='/* PETGROW_UI_FIX_V8_20260817 */'
if 'PETGROW_GUIDE_PREMIUM_20260817' not in s:
    if marker not in s: raise SystemExit('CSS marker not found')
    s=s.replace(marker,css+'\n  '+marker,1)
app.write_text(s)

# Points API ref key
p=Path('api/points.js')
ps=p.read_text()
old="if(req.method==='POST'&&action==='spend'){const feature=String(req.body?.feature||'');if(!['saju_basic','saju_daily','saju_compat'].includes(feature))return res.status(400).json({error:'지원하지 않는 포인트 사용 항목이에요.'});return res.status(200).json({ok:true,...await spendPoints(uid,feature,POINT_COSTS[feature],null)});}"
new="if(req.method==='POST'&&action==='spend'){const feature=String(req.body?.feature||'');const refKey=String(req.body?.refKey||'').slice(0,180)||null;if(!['saju_basic','saju_daily','saju_compat'].includes(feature))return res.status(400).json({error:'지원하지 않는 포인트 사용 항목이에요.'});return res.status(200).json({ok:true,...await spendPoints(uid,feature,POINT_COSTS[feature],refKey)});}"
if old in ps: ps=ps.replace(old,new)
p.write_text(ps)

# Music fixed starter set 36
p=Path('api/music.js')
ms=p.read_text().replace('petmusic-starter-thirtytwo-v4','petmusic-starter-thirtysix-v5').replace('>=32) return','>=36) return')
a=ms.find('const tracks = [')
if a<0: raise SystemExit('tracks start missing')
b=ms.find('];',a)
if b<0: raise SystemExit('tracks end missing')
segment=ms[a:b]
refs=set(re.findall(r"audio:'(/petmusic/[^']+\.mp3)'",segment))
missing=[f for f in sorted(Path('public/petmusic').glob('*.mp3')) if '/petmusic/'+f.name not in refs]
need=max(0,36-len(refs))
if len(missing)<need: raise SystemExit(f'need {need} extra static mp3, only {len(missing)} found')
adds=[]
for idx,f in enumerate(missing[:need],start=len(refs)+1):
    species='cat' if 'cat' in f.name.lower() else ('dog' if 'dog' in f.name.lower() else ('dog' if idx%2 else 'cat'))
    adds.append("    ,{id:'starter-auto-%02d',title:'PetGrow 사운드 %02d',description:'PetGrow에서 편안하게 들을 수 있는 반려동물용 음악이에요.',species:'%s',vocalType:'instrumental',mood:'relax',cover:null,audio:'/petmusic/%s'}\n"%(idx,idx,species,f.name))
if adds: ms=ms[:b]+''.join(adds)+ms[b:]
p.write_text(ms)

# Mobile tarot last row
p=Path('src/PetDailyWidgets.jsx')
ts=p.read_text()
old='@media(max-width:760px){.pet-tarot-deck22{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important}.pet-tarot-back22{min-height:126px!important}.pet-tarot-reading-detail{grid-template-columns:1fr}.pet-tarot-reading-detail .wide{grid-column:auto}}'
new='@media(max-width:760px){.pet-tarot-deck22{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;padding-left:2px!important;padding-right:2px!important}.pet-tarot-back22{min-height:0!important;aspect-ratio:2/3!important}.pet-tarot-back22:nth-last-child(2):nth-child(4n+1){grid-column:2}.pet-tarot-reading-detail{grid-template-columns:1fr}.pet-tarot-reading-detail .wide{grid-column:auto}}'
if old in ts: ts=ts.replace(old,new)
p.write_text(ts)
