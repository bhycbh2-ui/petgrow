import fs from 'node:fs';

const file='src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const MARK='PETNEWS_PAGINATION_20260817';
if(s.includes(MARK)){console.log('PetNews pagination already applied');process.exit(0);}

const stateAnchor='  const [category,setCategory]=useState("전체");';
if(!s.includes(stateAnchor)) throw new Error('PetNews category state anchor not found');
s=s.replace(stateAnchor, `${stateAnchor}\n  const [newsPage,setNewsPage]=useState(1);\n  const [newsSearchInput,setNewsSearchInput]=useState(\"\");\n  const [newsSearch,setNewsSearch]=useState(\"\");\n  const [showAllNewsCategories,setShowAllNewsCategories]=useState(false);\n  const NEWS_PAGE_SIZE=10;\n  /* ${MARK} */`);

const itemsAnchor='  const items=category==="전체"?(data.items||[]):(data.items||[]).filter(x=>x.category===category);';
if(!s.includes(itemsAnchor)) throw new Error('PetNews items anchor not found');
s=s.replace(itemsAnchor, `  const categoryItems=category===\"전체\"?(data.items||[]):(data.items||[]).filter(x=>x.category===category);\n  const normalizedNewsSearch=newsSearch.trim().toLowerCase();\n  const items=!normalizedNewsSearch?categoryItems:categoryItems.filter(x=>[x.title,x.description,x.source,x.category].some(v=>String(v||\"\").toLowerCase().includes(normalizedNewsSearch)));\n  const totalPages=Math.max(1,Math.ceil(items.length/NEWS_PAGE_SIZE));\n  const safePage=Math.min(newsPage,totalPages);\n  const pagedItems=items.slice((safePage-1)*NEWS_PAGE_SIZE,safePage*NEWS_PAGE_SIZE);\n  useEffect(()=>{setNewsPage(1);},[category,newsSearch]);\n  const submitNewsSearch=(e)=>{e?.preventDefault?.();setNewsSearch(newsSearchInput.trim());setNewsPage(1);};\n  const clearNewsSearch=()=>{setNewsSearchInput(\"\");setNewsSearch(\"\");setNewsPage(1);};`);

const categoryBar='<div style={{display:"flex",gap:8,overflowX:"auto",padding:"2px 0 14px"}}>{cats.map(c=><button key={c} type="button" className={"bg-chip "+(category===c?"active":"")} onClick={()=>setCategory(c)} style={{whiteSpace:"nowrap"}}>{c}</button>)}</div>';
if(!s.includes(categoryBar)) throw new Error('PetNews category bar anchor not found');
const categoryAndSearch=`<form onSubmit={submitNewsSearch} className=\"bg-card\" style={{padding:12,marginBottom:12,display:'flex',gap:8,alignItems:'center'}}>\n      <input value={newsSearchInput} onChange={e=>setNewsSearchInput(e.target.value)} placeholder={lang==='en'?'Search Pet News':'뉴스 제목·내용·출처 검색'} aria-label=\"Pet뉴스 검색\" style={{flex:1,minWidth:0,border:'1px solid var(--line)',borderRadius:12,padding:'11px 13px',background:'var(--card)',color:'var(--text)',fontSize:14}} />\n      {newsSearch&&<button type=\"button\" className=\"bg-chip\" onClick={clearNewsSearch}>초기화</button>}\n      <button type=\"submit\" className=\"bg-btn\" style={{whiteSpace:'nowrap'}}>🔎 검색</button>\n    </form>\n    <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'2px 0 10px'}}>\n      {(showAllNewsCategories?cats:cats.slice(0,4)).map(c=><button key={c} type=\"button\" className={'bg-chip '+(category===c?'active':'')} onClick={()=>{setCategory(c);setNewsPage(1);}}>{c}</button>)}\n      {cats.length>4&&<button type=\"button\" className=\"bg-chip\" onClick={()=>setShowAllNewsCategories(v=>!v)}>{showAllNewsCategories?'접기 ▲':'더보기 +'+String(cats.length-4)}</button>}\n    </div>\n    {(newsSearch||category!=='전체')&&<div className=\"bg-sub\" style={{fontSize:12,margin:'0 0 12px'}}>검색 결과 {items.length}건{category!=='전체'?' · '+category:''}{newsSearch?' · “'+newsSearch+'”':''}</div>`;
s=s.replace(categoryBar,categoryAndSearch);

const mapAnchor='items.map(item=><article';
if(!s.includes(mapAnchor)) throw new Error('PetNews map anchor not found');
s=s.replace(mapAnchor,'pagedItems.map(item=><article');

const emptyText='선택한 카테고리의 최신 뉴스가 아직 없어요.';
s=s.replace(emptyText,'조건에 맞는 최신 뉴스가 아직 없어요.');

const afterGrid='</article>)}</div>}\n    {data.updatedAt&&<p className="bg-sub" style={{fontSize:12,marginTop:14}}>최근 갱신:';
if(!s.includes(afterGrid)) throw new Error('PetNews pagination insertion anchor not found');
const pager=`</article>)}</div>}\n    {!loading&&!error&&items.length>NEWS_PAGE_SIZE&&<div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,flexWrap:'wrap',margin:'18px 0 8px'}}>\n      <button type=\"button\" className=\"bg-chip\" disabled={safePage<=1} onClick={()=>{setNewsPage(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:'smooth'});}}>‹ 이전</button>\n      {Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} type=\"button\" className={'bg-chip '+(p===safePage?'active':'')} onClick={()=>{setNewsPage(p);window.scrollTo({top:0,behavior:'smooth'});}}>{p}</button>)}\n      <button type=\"button\" className=\"bg-chip\" disabled={safePage>=totalPages} onClick={()=>{setNewsPage(p=>Math.min(totalPages,p+1));window.scrollTo({top:0,behavior:'smooth'});}}>다음 ›</button>\n    </div>}\n    {data.updatedAt&&<p className=\"bg-sub\" style={{fontSize:12,marginTop:14}}>최근 갱신:`;
s=s.replace(afterGrid,pager);

fs.writeFileSync(file,s);
console.log('PetNews: search, expandable categories and 10-item pagination applied.');
