function replaceRequired(code, from, to, label) {
  if (!code.includes(from)) throw new Error(`[petgrow-news-pettalk-tarot] missing required pattern: ${label}`);
  return code.replace(from, to);
}

function replaceOptionalAll(code, from, to) {
  return code.includes(from) ? code.split(from).join(to) : code;
}

function replaceBetween(code, startMarker, endMarker, replacement, label) {
  const start = code.indexOf(startMarker);
  if (start < 0) throw new Error(`[petgrow-news-pettalk-tarot] missing start marker: ${label}`);
  const end = code.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`[petgrow-news-pettalk-tarot] missing end marker: ${label}`);
  return code.slice(0, start) + replacement + code.slice(end);
}

export default function petgrowNewsPetTalkTarotFixes() {
  return {
    name: "petgrow-news-pettalk-tarot-20260818",
    enforce: "pre",
    transform(code, id) {
      const norm = String(id || "").replaceAll("\\", "/");
      if (!norm.endsWith("/src/App.jsx")) return null;
      let out = code;

      // PetTalk render crash: the UI referenced this category list without declaring it.
      if (!out.includes('const COMMUNITY_CATEGORY_KEYS = ["daily","brag","question","health","info","walk","training","shopping","free"];')) {
        out = replaceRequired(
          out,
          'function CmPetAvatar({ pet, size = 34 }) {',
          'const COMMUNITY_CATEGORY_KEYS = ["daily","brag","question","health","info","walk","training","shopping","free"];\n\nfunction CmPetAvatar({ pet, size = 34 }) {',
          "PetTalk category keys"
        );
      }

      // PetNews becomes a simple directory: title/meta/image -> original publisher article.
      const directNewsPage = `/* PETNEWS_DIRECT_LINK_20260818 */
function PetNewsPage({lang="ko"}){
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [category,setCategory]=useState("전체"),[query,setQuery]=useState(""),[page,setPage]=useState(1),[localized,setLocalized]=useState({});
  const PAGE=8,cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"];
  const ui={
    ko:{refresh:"새로고침",search:"뉴스 검색",open:"원문 보기 ↗",empty:"조건에 맞는 뉴스가 없어요."},
    en:{refresh:"Refresh",search:"Search news",open:"Open article ↗",empty:"No matching news."},
    ja:{refresh:"更新",search:"ニュース検索",open:"原文を開く ↗",empty:"該当するニュースがありません。"},
    zh:{refresh:"刷新",search:"搜索新闻",open:"查看原文 ↗",empty:"没有符合条件的新闻。"}
  }[lang]||{refresh:"새로고침",search:"뉴스 검색",open:"원문 보기 ↗",empty:"조건에 맞는 뉴스가 없어요."};
  const catLabel=c=>({en:{"전체":"All","반려견":"Dogs","반려묘":"Cats","건강":"Health","정책·제도":"Policy","입양·보호":"Adoption","산업·서비스":"Industry","반려동물":"Pets"},ja:{"전체":"すべて","반려견":"犬","반려묘":"猫","건강":"健康","정책·제도":"制度","입양·보호":"保護・譲渡","산업·서비스":"サービス","반려동물":"ペット"},zh:{"전체":"全部","반려견":"犬","반려묘":"猫","건강":"健康","정책·제도":"政策","입양·보호":"领养保护","산업·서비스":"产业服务","반려동물":"宠物"}}[lang]?.[c]||c);
  const clean=v=>String(v||"").replace(/&nbsp;|&#160;|&#xA0;/gi," ").replace(/\\s+/g," ").trim();
  const key=n=>String(n?.id||n?.link||n?.title||"");
  const href=n=>String(n?.link||n?.naverLink||"");
  const fallback=n=>/고양이|반려묘/.test(\`${'${n.title} ${n.category}'}\`)?"🐱":/강아지|반려견/.test(\`${'${n.title} ${n.category}'}\`)?"🐶":/병원|건강|수의/.test(\`${'${n.title} ${n.category}'}\`)?"🏥":"📰";
  const load=async()=>{setLoading(true);setError("");try{const j=await apiJson("/api/news");setItems(Array.isArray(j.items)?j.items:[]);if(!j.items?.length)setError(j.message||"새 뉴스를 찾고 있어요.")}catch(e){setError(e.message||"뉴스를 불러오지 못했어요.")}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const q=query.trim().toLowerCase();
  const filtered=items.filter(x=>(category==="전체"||x.category===category)&&(!q||\`${'${x.title||""} ${x.source||""} ${x.category||""}'}\`.toLowerCase().includes(q)));
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE)),safe=Math.min(page,pages),pageItems=filtered.slice((safe-1)*PAGE,safe*PAGE);
  useEffect(()=>{setPage(1)},[category,query]);
  useEffect(()=>{if(lang==="ko"){setLocalized({});return}const b=pageItems.map(x=>({id:key(x),title:x.title,description:""}));if(!b.length)return;fetch("/api/news-localize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,items:b})}).then(r=>r.ok?r.json():null).then(j=>{if(j?.items){const m={};j.items.forEach(x=>m[x.id]=x);setLocalized(m)}}).catch(()=>{})},[lang,safe,category,query,items.length]);
  return <div className="petnews-v10 petnews-direct-list">
    <div className="petnews-refresh-row"><span>{items.length?\`${'${items.length}'} ${'${lang==="ko"?"개의 최신 기사":""}'}\`:""}</span><button className="bg-chip" onClick={load}>{ui.refresh}</button></div>
    <div className="petnews-tools"><div className="petnews-cats">{cats.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{catLabel(c)}</button>)}</div><div className="petnews-search"><span>⌕</span><input className="bg-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder={ui.search}/></div></div>
    <div className="petnews-result-count">{filtered.length}{lang==="ko"?"건":""}</div>
    {loading?<div className="petnews-state">…</div>:error&&!items.length?<div className="petnews-state error"><b>{error}</b><button className="bg-btn" onClick={load}>{ui.refresh}</button></div>:<>
      <div className="petnews-grid">{pageItems.map((n,i)=>{const loc=localized[key(n)]||n;const url=href(n);return <a className="petnews-card-v10 petnews-direct-card" key={key(n)||i} href={url||undefined} target="_blank" rel="noopener noreferrer" aria-label={\`${'${clean(loc.title||n.title)} ${ui.open}'}\`}>
        <div className="petnews-media">{n.image&&<img src={n.image} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling?.classList.add("show")}}/>}<div className={\`petnews-image-fallback ${'${n.image?"":"show"}'}\`}><span>{fallback(n)}</span><small>{catLabel(n.category||"반려동물")}</small></div></div>
        <div className="petnews-card-body"><div className="petnews-meta"><span>{catLabel(n.category||"반려동물")}</span><small>{n.source||"Media"}{n.publishedAt?\` · ${'${new Date(n.publishedAt).toLocaleDateString()}'}\`:""}</small></div><h2>{clean(loc.title||n.title)}</h2><span className="petnews-open-link">{ui.open}</span></div>
      </a>})}</div>
      {!pageItems.length&&<div className="petnews-state">{ui.empty}</div>}
      {pages>1&&<ResponsivePagination page={safe} totalPages={pages} lang={lang} onChange={setPage}/>} 
    </>}
  </div>;
}

`;
      out = replaceBetween(out, "/* PETNEWS_FINAL_INLINE_20260818 */", "function PetNewsPrivacyAddendum", directNewsPage, "PetNews direct link page");

      // Home news cards also open the corresponding publisher article directly.
      const homeNewsSection = `{homeNews.length>0&&<section className="dash-section"><div className="dash-section-head"><h2>{lang==='en'?'Important Pet News':'주요 Pet뉴스'}</h2><button type="button" className="bg-chip" onClick={()=>onGoView('news')}>{lang==='en'?'View all':'전체보기'}</button></div><div style={{display:'grid',gap:10}}>{homeNews.map(n=><a key={n.id} className="bg-card home-news-direct-link" href={n.link||n.naverLink||undefined} target="_blank" rel="noopener noreferrer" style={{padding:'15px 16px',textAlign:'left',border:'1px solid var(--border)'}}><small style={{fontWeight:800,color:'var(--primary)'}}>{n.category||'Pet뉴스'} · {n.source||''}</small><div style={{fontWeight:800,fontSize:15,lineHeight:1.5,marginTop:5}}>{n.title}</div><small className="bg-sub">{n.publishedAt?new Date(n.publishedAt).toLocaleDateString('ko-KR'):''}</small><span className="home-news-open">{lang==='en'?'Open article ↗':'원문 보기 ↗'}</span></a>)}</div></section>}`;
      out = replaceBetween(out, '{homeNews.length>0&&<section className="dash-section">', '\n\n      <section className="dash-widget-grid">', homeNewsSection, "home direct news links");

      // Remove summary/reaction wording anywhere users can still encounter it.
      out=replaceOptionalAll(out,'반려견·반려묘·건강·정책 등 최신 반려동물 뉴스를 보기 좋게 모아봐요.','반려견·반려묘·건강·정책 등 최신 뉴스의 제목과 출처를 확인하고 원문으로 바로 이동해요.');
      out=replaceOptionalAll(out,'Browse recent pet news with clear summaries and publisher links.','Browse recent pet news and open the original publisher article directly.');
      out=replaceOptionalAll(out,'반려동물 주요 소식을 제목과 핵심 요약으로 확인해요.','반려동물 주요 소식의 제목을 확인하고 원문으로 바로 이동해요.');
      out=replaceOptionalAll(out,'Read clear titles and short summaries.','See the latest headlines and open the original article directly.');
      out=replaceOptionalAll(out,'반려견·반려묘·건강·정책 등 최신 뉴스를 요약과 함께 확인할 수 있어요.','반려견·반려묘·건강·정책 등 최신 뉴스의 제목과 출처를 확인하고 원문으로 바로 이동할 수 있어요.');
      out=replaceOptionalAll(out,'PetGrow 안에서 핵심 요약을 먼저 확인해요.','기사 제목·출처·게시일을 확인해요.');
      out=replaceOptionalAll(out,'자세한 내용은 원문 전체보기를 통해 언론사 페이지에서 확인해요.','관심 있는 기사를 누르면 해당 뉴스 원문으로 바로 이동해요.');
      out=replaceOptionalAll(out,'뉴스는 기사 전문을 복사하지 않고 검색 결과의 설명을 바탕으로 요약해 보여줘요.','PetGrow는 기사 전문이나 별도 요약을 저장하지 않고 원문 링크를 안내해요.');

      return out===code?null:{code:out,map:null};
    }
  };
}
