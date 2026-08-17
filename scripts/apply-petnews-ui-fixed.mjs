import fs from 'node:fs';

const file='src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const MARK='PETNEWS_UI_FIXED_20260817';
if(s.includes(MARK)){console.log('PetNews UI already applied');process.exit(0);}
const rep=(from,to,label,required=true)=>{if(!s.includes(from)){if(required)throw new Error('Missing anchor: '+label);console.warn('Skip optional:',label);return;}s=s.replace(from,to);console.log('Applied:',label);};

const component=[
'/* '+MARK+' */',
'function PetNewsPage({ lang = "ko" }) {',
'  const [data,setData]=useState({items:[],updatedAt:null});',
'  const [loading,setLoading]=useState(true);',
'  const [error,setError]=useState("");',
'  const [category,setCategory]=useState("전체");',
'  const load=async()=>{setLoading(true);setError("");try{const r=await fetch("/api/news");const j=await r.json();if(!r.ok)throw new Error(j.error||"뉴스를 불러오지 못했어요.");setData(j);}catch(e){setError(e?.message||"뉴스를 불러오지 못했어요.");}finally{setLoading(false);}};',
'  useEffect(()=>{load();},[]);',
'  const cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"];',
'  const items=category==="전체"?(data.items||[]):(data.items||[]).filter(x=>x.category===category);',
'  const timeLabel=(iso)=>{if(!iso)return "";const d=new Date(iso),diff=Date.now()-d.getTime();if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+"분 전";if(diff<86400000)return Math.floor(diff/3600000)+"시간 전";return d.toLocaleDateString("ko-KR");};',
'  return <div className="legal-page-shell" style={{maxWidth:980,margin:"0 auto",padding:"0 16px 48px"}}>',
'    <section className="nearby-hero bg-card" style={{marginBottom:16}}><div><span className="nearby-eyebrow">PETGROW NEWS</span><h1>{lang==="en"?"Pet News":"Pet뉴스"}</h1><p>{lang==="en"?"Recent pet-related news with direct links to original publishers.":"강아지·고양이·건강·정책·입양 등 반려동물 관련 최신 뉴스만 모아봐요."}</p><small className="nearby-search-help">📰 약 1시간 단위로 갱신되며 기사 전문은 원문 언론사에서 확인해요.</small></div></section>',
'    <div style={{display:"flex",gap:8,overflowX:"auto",padding:"2px 0 14px"}}>{cats.map(c=><button key={c} type="button" className={"bg-chip "+(category===c?"active":"")} onClick={()=>setCategory(c)} style={{whiteSpace:"nowrap"}}>{c}</button>)}</div>',
'    {loading?<div className="bg-card" style={{padding:28,textAlign:"center"}}>최신 펫뉴스를 불러오는 중이에요…</div>:error?<div className="bg-card" style={{padding:28,textAlign:"center"}}><b>Pet뉴스를 불러오지 못했어요.</b><p className="bg-sub">{error}</p><button className="bg-btn" onClick={load}>다시 시도</button></div>:items.length===0?<div className="bg-card" style={{padding:28,textAlign:"center"}}>선택한 카테고리의 최신 뉴스가 아직 없어요.</div>:<div style={{display:"grid",gap:12}}>{items.map(item=><article key={item.id} className="bg-card" style={{padding:"18px 20px"}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}><span className="bg-chip active">{item.category}</span><small style={{color:"var(--sub)"}}>{item.source+" · "+timeLabel(item.publishedAt)}</small></div><h2 style={{fontSize:18,lineHeight:1.45,margin:"0 0 8px"}}>{item.title}</h2><p className="bg-sub" style={{fontSize:14,lineHeight:1.7,margin:"0 0 12px"}}>{item.description}</p><a href={item.link} target="_blank" rel="noopener noreferrer" className="bg-btn bg-btn-ghost" style={{display:"inline-flex",textDecoration:"none"}}>원문 보기 ↗</a></article>)}</div>}',
'    {data.updatedAt&&<p className="bg-sub" style={{fontSize:12,marginTop:14}}>최근 갱신: {new Date(data.updatedAt).toLocaleString("ko-KR")}</p>}',
'    <p className="bg-sub" style={{fontSize:12,lineHeight:1.65,marginTop:8}}>Pet뉴스는 외부 뉴스 검색 결과의 제목·요약·출처·링크를 제공하며 기사 전문을 PetGrow가 복제해 제공하지 않습니다.</p>',
'  </div>;',
'}',
'',
'function PetNewsPrivacyAddendum(){return <section className="bg-card" style={{maxWidth:900,margin:"14px auto 36px",padding:22}}><h2 style={{fontSize:18,marginTop:0}}>Pet뉴스 관련 개인정보 안내</h2><p className="bg-sub" style={{lineHeight:1.75}}>Pet뉴스는 공개 뉴스 검색 API를 이용합니다. 뉴스 조회를 위해 이용자의 이름, 계정정보, 반려동물 정보 등 개인정보를 뉴스 검색 제공자에게 전송하지 않습니다. 원문 보기를 선택하면 외부 언론사 페이지로 이동하며 이후 개인정보 처리는 해당 서비스의 정책이 적용됩니다.</p></section>}',
'function PetNewsTermsAddendum(){return <section className="bg-card" style={{maxWidth:900,margin:"14px auto 36px",padding:22}}><h2 style={{fontSize:18,marginTop:0}}>Pet뉴스 서비스 이용조건</h2><p className="bg-sub" style={{lineHeight:1.75}}>Pet뉴스는 외부 검색 API 기반의 뉴스 탐색 기능입니다. 기사 내용과 저작권은 각 기사 제공자에게 있으며, 건강·의료·정책 관련 뉴스는 전문적인 진단이나 법률·행정 자문을 대체하지 않습니다.</p></section>}',
''
].join('\n');

rep('\nfunction AdminReportsPage({onBack}){','\n'+component+'function AdminReportsPage({onBack}){','components');
rep('<PrivacyContent />','<><PrivacyContent /><PetNewsPrivacyAddendum /></>','privacy');
rep('<TermsContent />','<><TermsContent /><PetNewsTermsAddendum /></>','terms');
rep('      ) : effectiveView === "tips" ? (\n        <TipsPage />','      ) : effectiveView === "news" ? (\n        <PetNewsPage lang={lang} />\n      ) : effectiveView === "tips" ? (\n        <TipsPage />','route');
rep('            <button className={view === "tips" ? "active" : ""} onClick={() => goView("tips")}><LightbulbIcon /><span>{t.tipsTitle}</span></button>','            <button className={view === "tips" ? "active" : ""} onClick={() => goView("tips")}><LightbulbIcon /><span>{t.tipsTitle}</span></button>\n            <button className={view === "news" ? "active" : ""} onClick={() => goView("news")}><InfoIcon /><span>{lang === "en" ? "Pet News" : "Pet뉴스"}</span></button>','sidebar news',false);
rep('                <button type="button" className={`desktop-nav-link ${view === "tips" ? "active" : ""}`} onClick={() => goView("tips")}><LightbulbIcon />{t.tipsTitle}</button>','                <button type="button" className={`desktop-nav-link ${view === "tips" ? "active" : ""}`} onClick={() => goView("tips")}><LightbulbIcon />{t.tipsTitle}</button>\n                <button type="button" className={`desktop-nav-link ${view === "news" ? "active" : ""}`} onClick={() => goView("news")}><InfoIcon />{lang === "en" ? "Pet News" : "Pet뉴스"}</button>','desktop news',false);
rep('            <LandingFeatureCard Illust={IllustTips} title={t.landingCardTipsTitle} desc={t.landingCardTipsDesc} />','            <LandingFeatureCard Illust={IllustTips} title={t.landingCardTipsTitle} desc={t.landingCardTipsDesc} />\n            <LandingFeatureCard Illust={InfoIcon} title={lang === "en" ? "📰 Pet News" : "📰 Pet뉴스"} desc={lang === "en" ? "Recent pet-related news with direct links to original publishers." : "반려동물 관련 최신 뉴스만 모아보고 원문까지 바로 확인해요."} />','about news',false);

fs.writeFileSync(file,s);
console.log('PetNews UI integration applied safely.');
