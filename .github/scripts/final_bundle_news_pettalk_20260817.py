from pathlib import Path
import re

app=Path('src/App.jsx')
s=app.read_text(encoding='utf-8')
news=Path('api/news.js')
n=news.read_text(encoding='utf-8')

# NEWS API: actually enrich missing article images, but keep request latency bounded.
n=n.replace('setTimeout(()=>ac.abort(),2200)', 'setTimeout(()=>ac.abort(),1200)')
n=n.replace('const candidates=items.slice(0,32),out=[];\n  for(let i=0;i<candidates.length;i+=4){\n    const batch=candidates.slice(i,i+4);', 'const candidates=items.slice(0,16),out=[];\n  for(let i=0;i<candidates.length;i+=8){\n    const batch=candidates.slice(i,i+8);')
n=n.replace('    if(out.filter(x=>x.image).length>=24)break;', '    if(out.filter(x=>x.image).length>=12)break;')
old='async function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);return(recent.length>=12?recent:normalized).slice(0,40);}'
new='async function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);const picked=(recent.length>=12?recent:normalized).slice(0,40);const enriched=await enrichArticleImages(picked);const byId=new Map(enriched.map(x=>[x.id,x]));return picked.map(x=>byId.get(x.id)||x);}'
if old in n: n=n.replace(old,new)
else: print('prepare signature already changed or not exact')
news.write_text(n,encoding='utf-8')

# NEWS UI: 8 per page, stronger search, stable 16:9 media, contextual fallback thumbnails.
s=s.replace('const PAGE=10,cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"];','const PAGE=8,cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"];')
s=s.replace("const filtered=items.filter(x=>(category==='전체'||x.category===category)&&(!q||`${x.title||''} ${x.description||''} ${x.source||''}`.toLowerCase().includes(q)));","const filtered=items.filter(x=>(category==='전체'||x.category===category)&&(!q||`${x.title||''} ${x.description||''} ${x.source||''} ${x.category||''}`.toLowerCase().includes(q)));\n  const fallbackVisual=n=>{const h=`${n.title||''} ${n.description||''} ${n.category||''}`;if(/병원|수의|건강|질병|백신|치료|예방/.test(h))return ['🏥','건강'];if(/입양|유기|보호소|구조|학대/.test(h))return ['💚','입양·보호'];if(/법|정책|정부|지자체|조례|제도/.test(h))return ['📋','정책·제도'];if(/보험|산업|서비스|용품|사료|펫푸드/.test(h))return ['🛍️','산업·서비스'];if(/고양이|반려묘|애묘/.test(h))return ['🐱','반려묘'];if(/강아지|반려견|애견/.test(h))return ['🐶','반려견'];return ['🐾','PetGrow News']};")
s=s.replace('<div className="petnews-tools"><div className="petnews-cats">{cats.map(c=><button key={c} type="button" className={category===c?\'active\':\'\'} onClick={()=>setCategory(c)}>{c}</button>)}</div><input className="bg-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="뉴스 제목·내용 검색"/></div>', '<div className="petnews-tools"><div className="petnews-cats">{cats.map(c=><button key={c} type="button" className={category===c?\'active\':\'\'} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="petnews-search"><span>⌕</span><input className="bg-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="제목·내용·언론사 검색"/>{query&&<button type="button" onClick={()=>setQuery(\'\')} aria-label="검색어 지우기">×</button>}</div></div><div className="petnews-result-count">{query||category!==\'전체\'?`검색 결과 ${filtered.length}건`:`최신 뉴스 ${items.length}건`} · 페이지당 {PAGE}건</div>')
old_card="{n.image?<img src={n.image} alt=\"\" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className=\"petnews-image-fallback\">🐾<small>PetGrow News</small></div>}"
new_card="{(()=>{const [ico,label]=fallbackVisual(n);return <div className=\"petnews-media\">{n.image&&<img src={n.image} alt=\"\" loading=\"lazy\" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextElementSibling?.classList.add('show')}}/>}<div className={`petnews-image-fallback ${n.image?'':'show'}`}><span>{ico}</span><small>{label}</small></div></div>})()}"
s=s.replace(old_card,new_card)
s=s.replace("{pages>1&&<div className=\"petnews-pages\"><button disabled={safe<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>이전</button><b>{safe} / {pages}</b><button disabled={safe>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>다음</button></div>}","{pages>1&&<ResponsivePagination page={safe} totalPages={pages} lang={lang} onChange={setPage} />}" )
# Modal image also gets a fallback if image fails.
s=s.replace("{selected.image&&<img src={selected.image} alt=\"\"/>}","{selected.image&&<img src={selected.image} alt=\"\" onError={e=>{e.currentTarget.style.display='none'}}/>}")

# CSS: consistent 16:9 thumbnails and stronger search control.
css_old='.petnews-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.petnews-card-v10{overflow:hidden;border:1px solid #e4e8e0;border-radius:20px;background:#fff;cursor:pointer;display:grid;grid-template-columns:180px 1fr;min-height:190px;box-shadow:0 10px 28px rgba(55,75,58,.05)}.petnews-card-v10>img,.petnews-image-fallback{width:100%;height:100%;min-height:190px;object-fit:cover;background:linear-gradient(145deg,#edf5ea,#f8f3e7);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:38px}.petnews-image-fallback small{font-size:9px;margin-top:7px;color:#78917d}'
css_new='.petnews-result-count{font-size:10.5px;color:var(--sub);margin:-4px 0 12px}.petnews-search{position:relative;display:flex;align-items:center}.petnews-search>span{position:absolute;left:12px;z-index:1;color:#758178}.petnews-search input{width:100%;padding-left:34px!important;padding-right:34px!important}.petnews-search>button{position:absolute;right:8px;border:0;background:#eef3ed;width:25px;height:25px;border-radius:50%;cursor:pointer;color:#607066}.petnews-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.petnews-card-v10{overflow:hidden;border:1px solid #e4e8e0;border-radius:20px;background:#fff;cursor:pointer;display:block;box-shadow:0 10px 28px rgba(55,75,58,.05)}.petnews-media{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#eef4ee}.petnews-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;z-index:2}.petnews-image-fallback{position:absolute;inset:0;background:linear-gradient(145deg,#edf5ea,#f8f3e7);display:none;flex-direction:column;align-items:center;justify-content:center;font-size:38px}.petnews-image-fallback.show{display:flex}.petnews-image-fallback small{font-size:9px;margin-top:7px;color:#78917d}'
s=s.replace(css_old,css_new)
s=s.replace('.petnews-card-v10{grid-template-columns:120px 1fr;min-height:160px}.petnews-card-v10>img,.petnews-image-fallback{min-height:160px}', '.petnews-card-v10{display:block}.petnews-media{aspect-ratio:16/9}')

# PetTalk must remain a public-readable view. Remove community from any gated view list if present.
s=re.sub(r'(GATED_VIEWS\s*=\s*\[[^\]]*)[\"\']community[\"\']\s*,?\s*', r'\1', s, flags=re.S)
# Guard against accidental direct account gate before rendering community route if the exact compact pattern exists.
s=s.replace('if (!account && view === "community") return', 'if (!account && false && view === "community") return')

app.write_text(s,encoding='utf-8')

# Assertions
assert 'const PAGE=8' in s
assert 'fallbackVisual=n=>' in s
assert 'aspect-ratio:16/9' in s
assert 'ResponsivePagination page={safe}' in s
assert 'const enriched=await enrichArticleImages(picked)' in n
assert 'items.slice(0,16)' in n
print('final bundle patched: news images/search/paging + PetTalk public-read guard')
