import fs from 'node:fs';

const file='src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const MARK='PETNEWS_PAGINATION_20260817';
if(s.includes(MARK)){console.log('PetNews pagination already applied');process.exit(0);}

const stateAnchor='  const [category,setCategory]=useState("전체");';
if(!s.includes(stateAnchor)) throw new Error('PetNews category state anchor not found');
s=s.replace(stateAnchor, `${stateAnchor}\n  const [newsPage,setNewsPage]=useState(1);\n  const NEWS_PAGE_SIZE=10;\n  /* ${MARK} */`);

const itemsAnchor='  const items=category==="전체"?(data.items||[]):(data.items||[]).filter(x=>x.category===category);';
if(!s.includes(itemsAnchor)) throw new Error('PetNews items anchor not found');
s=s.replace(itemsAnchor, `${itemsAnchor}\n  const totalPages=Math.max(1,Math.ceil(items.length/NEWS_PAGE_SIZE));\n  const safePage=Math.min(newsPage,totalPages);\n  const pagedItems=items.slice((safePage-1)*NEWS_PAGE_SIZE,safePage*NEWS_PAGE_SIZE);\n  useEffect(()=>{setNewsPage(1);},[category]);`);

const categoryButton='onClick={()=>setCategory(c)}';
s=s.replaceAll(categoryButton,'onClick={()=>{setCategory(c);setNewsPage(1);}}');

const mapAnchor='items.map(item=><article';
if(!s.includes(mapAnchor)) throw new Error('PetNews map anchor not found');
s=s.replace(mapAnchor,'pagedItems.map(item=><article');

const afterGrid='</article>)}</div>}\n    {data.updatedAt&&<p className="bg-sub" style={{fontSize:12,marginTop:14}}>최근 갱신:';
if(!s.includes(afterGrid)) throw new Error('PetNews pagination insertion anchor not found');
const pager=`</article>)}</div>}\n    {!loading&&!error&&items.length>NEWS_PAGE_SIZE&&<div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,flexWrap:'wrap',margin:'18px 0 8px'}}>\n      <button type="button" className="bg-chip" disabled={safePage<=1} onClick={()=>{setNewsPage(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:'smooth'});}}>‹ 이전</button>\n      {Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} type="button" className={'bg-chip '+(p===safePage?'active':'')} onClick={()=>{setNewsPage(p);window.scrollTo({top:0,behavior:'smooth'});}}>{p}</button>)}\n      <button type="button" className="bg-chip" disabled={safePage>=totalPages} onClick={()=>{setNewsPage(p=>Math.min(totalPages,p+1));window.scrollTo({top:0,behavior:'smooth'});}}>다음 ›</button>\n    </div>}\n    {data.updatedAt&&<p className="bg-sub" style={{fontSize:12,marginTop:14}}>최근 갱신:`;
s=s.replace(afterGrid,pager);

fs.writeFileSync(file,s);
console.log('PetNews pagination applied: 10 items per page with category reset.');
