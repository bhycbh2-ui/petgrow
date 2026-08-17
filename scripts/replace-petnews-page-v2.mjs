import fs from 'node:fs';

const file='src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const start=s.indexOf('function PetNewsPage({ lang = "ko" }) {');
const end=s.indexOf('function PetNewsPrivacyAddendum()', start);
if(start<0||end<0) throw new Error('PetNewsPage anchors not found');

const component=String.raw`function PetNewsPage({ lang = "ko" }) {
  const [data,setData]=useState({items:[],updatedAt:null});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [category,setCategory]=useState("전체");
  const [showAllCategories,setShowAllCategories]=useState(false);
  const [searchInput,setSearchInput]=useState("");
  const [newsSearch,setNewsSearch]=useState("");
  const [newsPage,setNewsPage]=useState(1);
  const NEWS_PAGE_SIZE=10;
  const load=async()=>{setLoading(true);setError("");try{const r=await fetch("/api/news");const j=await r.json();if(!r.ok)throw new Error(j.error||"뉴스를 불러오지 못했어요.");setData(j);}catch(e){setError(e?.message||"뉴스를 불러오지 못했어요.");}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"];
  const visibleCats=showAllCategories?cats:cats.slice(0,4);
  const normalize=v=>String(v||"").toLowerCase().replace(/\s+/g," ").trim();
  const baseItems=category==="전체"?(data.items||[]):(data.items||[]).filter(x=>x.category===category);
  const q=normalize(newsSearch);
  const items=!q?baseItems:baseItems.filter(x=>normalize([x.title,x.description,x.source,x.category].join(" ")).includes(q));
  const totalPages=Math.max(1,Math.ceil(items.length/NEWS_PAGE_SIZE));
  const safePage=Math.min(newsPage,totalPages);
  const pagedItems=items.slice((safePage-1)*NEWS_PAGE_SIZE,safePage*NEWS_PAGE_SIZE);
  useEffect(()=>{setNewsPage(1);},[category,newsSearch]);
  const runSearch=()=>{setNewsSearch(searchInput.trim());setNewsPage(1);};
  const clearSearch=()=>{setSearchInput("");setNewsSearch("");setNewsPage(1);};
  const timeLabel=(iso)=>{if(!iso)return "";const d=new Date(iso),diff=Date.now()-d.getTime();if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+"분 전";if(diff<86400000)return Math.floor(diff/3600000)+"시간 전";return d.toLocaleDateString("ko-KR");};
  const goPage=p=>{setNewsPage(p);window.setTimeout(()=>document.querySelector('.petnews-tools')?.scrollIntoView({behavior:'smooth',block:'start'}),20);};
  return <div className="legal-page-shell" style={{maxWidth:980,margin:"0 auto",padding:"0 16px 48px"}}>
    <section className="nearby-hero bg-card" style={{marginBottom:16}}><div><span className="nearby-eyebrow">PETGROW NEWS</span><h1>{lang==="en"?"Pet News":"Pet뉴스"}</h1><p>{lang==="en"?"Recent pet-related news with direct links to original publishers.":"강아지·고양이·건강·정책·입양 등 반려동물 관련 최신 뉴스만 모아봐요."}</p><small className="nearby-search-help">📰 약 1시간 단위로 갱신되며 기사 전문은 원문 언론사에서 확인해요.</small></div></section>
    <section className="bg-card petnews-tools" style={{padding:14,marginBottom:14}}>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:8,alignItems:"stretch"}}>
        <input className="bg-input" value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")runSearch();}} placeholder={lang==="en"?"Search headlines, summaries or publishers":"뉴스 제목·소제목·언론사 검색"}/>
        <button type="button" className="bg-btn" onClick={runSearch}>🔎 {lang==="en"?"Search":"검색"}</button>
      </div>
      {(newsSearch||searchInput)&&<div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><button type="button" className="bg-chip" onClick={clearSearch}>{lang==="en"?"Reset":"검색 초기화"}</button></div>}
    </section>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:"2px 0 14px"}}>
      {visibleCats.map(c=><button key={c} type="button" className={"bg-chip "+(category===c?"active":"")} onClick={()=>{setCategory(c);setNewsPage(1);}} style={{whiteSpace:"nowrap"}}>{c}</button>)}
      {!showAllCategories&&<button type="button" className="bg-chip" onClick={()=>setShowAllCategories(true)}>더보기 +{cats.length-visibleCats.length}</button>}
      {showAllCategories&&<button type="button" className="bg-chip" onClick={()=>setShowAllCategories(false)}>접기 ▲</button>}
    </div>
    {(newsSearch||category!=="전체")&&<div className="bg-sub" style={{fontSize:12,margin:"0 0 12px"}}>검색 결과 {items.length}건{category!=="전체"?" · "+category:""}{newsSearch?" · ‘"+newsSearch+"’":""}</div>}
    {loading?<div className="bg-card" style={{padding:28,textAlign:"center"}}>최신 펫뉴스를 불러오는 중이에요…</div>:error?<div className="bg-card" style={{padding:28,textAlign:"center"}}><b>Pet뉴스를 불러오지 못했어요.</b><p className="bg-sub">{error}</p><button className="bg-btn" onClick={load}>다시 시도</button></div>:items.length===0?<div className="bg-card" style={{padding:28,textAlign:"center"}}>조건에 맞는 최신 뉴스가 아직 없어요.</div>:<div style={{display:"grid",gap:12}}>{pagedItems.map(item=><article key={item.id} className="bg-card" style={{padding:"18px 20px"}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}><span className="bg-chip active">{item.category}</span><small style={{color:"var(--sub)"}}>{item.source+" · "+timeLabel(item.publishedAt)}</small></div><h2 style={{fontSize:18,lineHeight:1.45,margin:"0 0 8px"}}>{item.title}</h2><p className="bg-sub" style={{fontSize:14,lineHeight:1.7,margin:"0 0 12px"}}>{item.description}</p><a href={item.link} target="_blank" rel="noopener noreferrer" className="bg-btn bg-btn-ghost" style={{display:"inline-flex",textDecoration:"none"}}>원문 보기 ↗</a></article>)}</div>}
    {!loading&&!error&&items.length>NEWS_PAGE_SIZE&&<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,flexWrap:"wrap",margin:"18px 0 8px"}}>
      <button type="button" className="bg-chip" disabled={safePage<=1} onClick={()=>goPage(Math.max(1,safePage-1))}>‹ 이전</button>
      {Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} type="button" className={"bg-chip "+(p===safePage?"active":"")} onClick={()=>goPage(p)}>{p}</button>)}
      <button type="button" className="bg-chip" disabled={safePage>=totalPages} onClick={()=>goPage(Math.min(totalPages,safePage+1))}>다음 ›</button>
    </div>}
    {data.updatedAt&&<p className="bg-sub" style={{fontSize:12,marginTop:14}}>최근 갱신: {new Date(data.updatedAt).toLocaleString("ko-KR")}</p>}
    <p className="bg-sub" style={{fontSize:12,lineHeight:1.65,marginTop:8}}>Pet뉴스는 외부 뉴스 검색 결과의 제목·요약·출처·링크를 제공하며 기사 전문을 PetGrow가 복제해 제공하지 않습니다.</p>
  </div>;
}

`;

s=s.slice(0,start)+component+s.slice(end);
fs.writeFileSync(file,s);
console.log('PetNews v2 page replaced safely.');
