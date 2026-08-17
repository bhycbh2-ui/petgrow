from pathlib import Path
import re

app=Path('src/App.jsx')
s=app.read_text()

# 1) Nearby: clicking a result must redraw the map with only that business.
old='onClick={()=>{setSelected(p);const c=searchCenterRef.current||{lat:Number(p.lat),lng:Number(p.lng)};loadMap(c,[p],pos,false).catch(()=>{});}}'
new='onClick={()=>{setSelected(p);window.setTimeout(()=>loadMap({lat:Number(p.lat),lng:Number(p.lng)},[p],null,false).catch(()=>{}),0);}}'
if old in s:
    s=s.replace(old,new)
else:
    s=re.sub(r'onClick=\{\(\)=>\{setSelected\(p\);[^}]*loadMap\([^;]+;?\}\}',new,s,count=1)

# 2) Always-visible PetPoint card for Home/About.
if 'function PetPointVisibleCard(' not in s:
    insert_at=s.find('function InfoGuidePage()')
    if insert_at<0: raise SystemExit('InfoGuidePage not found for PetPoint insertion')
    comp=r'''function PetPointVisibleCard({account,compact=false}){
  const [summary,setSummary]=useState(null);
  useEffect(()=>{let alive=true;if(!account?.id){setSummary(null);return()=>{alive=false}};apiJson('/api/points?action=summary').then(j=>{if(alive)setSummary(j)}).catch(()=>{});return()=>{alive=false}},[account?.id]);
  const balance=summary?.balance;
  return <section className={'petpoint-visible '+(compact?'compact':'about')}>
    <div className="petpoint-visible-icon">🪙</div><div className="petpoint-visible-copy"><small>PETPOINT</small><h2>{compact?'활동하고 PetPoint를 모아보세요':'PetPoint로 PetGrow를 더 재미있게'}</h2><p>{account?.id?(balance==null?'포인트를 불러오는 중이에요.':`현재 ${balance}P · 하루 첫 접속과 Pet톡 활동으로 포인트를 모을 수 있어요.`):'처음 로그인하면 300P가 지급돼요. 하루 첫 접속·Pet톡 글·댓글·좋아요 받기로 더 모을 수 있어요.'}</p></div>
    <div className="petpoint-visible-actions"><b>{account?.id&&balance!=null?`${balance}P`:'시작 300P'}</b><span>Pet타로 30P · 오늘의 운세 20P · 기본 사주 50P · 궁합 40P</span></div>
  </section>;
}

'''
    s=s[:insert_at]+comp+s[insert_at:]

# Insert PetPoint card just before main view switch.
marker='{effectiveView === "about" ? ('
if marker in s and 'petpoint-visible-switch' not in s:
    s=s.replace(marker,'{/* petpoint-visible-switch */}\n      {(effectiveView==="home"||effectiveView==="about")&&<PetPointVisibleCard account={account} compact={effectiveView==="home"}/>}\n      '+marker,1)

# 3) Replace PetNewsPage with robust list/detail implementation.
start=s.find('function PetNewsPage(')
if start<0: raise SystemExit('PetNewsPage not found')
m=re.search(r'\nfunction [A-Z][A-Za-z0-9_]*\(',s[start+10:])
if not m: raise SystemExit('next component after PetNewsPage not found')
end=start+10+m.start()+1
news=r'''function PetNewsPage({ lang = "ko" }) {
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [category,setCategory]=useState("전체"),[query,setQuery]=useState(""),[page,setPage]=useState(1),[selected,setSelected]=useState(null);
  const PAGE=10,cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"];
  const load=async()=>{setLoading(true);setError("");try{const j=await apiJson('/api/news');setItems(Array.isArray(j.items)?j.items:[]);if(!j.items?.length)setError(j.message||'새 반려동물 뉴스를 찾고 있어요. 잠시 후 다시 확인해 주세요.')}catch(e){setError(e.message||'뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const clean=v=>String(v||'').replace(/&nbsp;|&#160;|&#xA0;/gi,' ').replace(/\s+/g,' ').trim();
  const q=query.trim().toLowerCase();
  const filtered=items.filter(x=>(category==='전체'||x.category===category)&&(!q||`${x.title||''} ${x.description||''} ${x.source||''}`.toLowerCase().includes(q)));
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE)),safe=Math.min(page,pages),pageItems=filtered.slice((safe-1)*PAGE,safe*PAGE);
  useEffect(()=>{setPage(1)},[category,query]);
  const summary=v=>{const t=clean(v);if(!t)return '기사 설명을 확인하고 있어요. 원문에서 자세한 내용을 확인할 수 있어요.';const parts=t.split(/(?<=[.!?다요])\s+/).filter(Boolean);return parts.slice(0,2).join(' ').slice(0,230)};
  return <div className="petnews-v10">
    <section className="petnews-hero"><div><small>PETGROW NEWS</small><h1>Pet뉴스</h1><p>반려동물 소식을 제목만 나열하지 않고 핵심 설명과 함께 보기 쉽게 정리했어요.</p></div><button type="button" className="bg-btn bg-btn-ghost" onClick={load}>새로고침</button></section>
    <div className="petnews-tools"><div className="petnews-cats">{cats.map(c=><button key={c} type="button" className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><input className="bg-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="뉴스 제목·내용 검색"/></div>
    {loading?<div className="petnews-state">최신 Pet뉴스를 불러오는 중…</div>:error&&!items.length?<div className="petnews-state error"><b>뉴스를 불러오지 못했어요.</b><span>{error}</span><button className="bg-btn" onClick={load}>다시 불러오기</button></div>:<>
      <div className="petnews-grid">{pageItems.map((n,i)=><article className="petnews-card-v10" key={n.id||n.link||i} onClick={()=>setSelected(n)}>{n.image?<img src={n.image} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="petnews-image-fallback">🐾<small>PetGrow News</small></div>}<div className="petnews-card-body"><div className="petnews-meta"><span>{n.category||'반려동물'}</span><small>{n.source||'언론사'}{n.publishedAt?` · ${new Date(n.publishedAt).toLocaleDateString('ko-KR')}`:''}</small></div><h2>{clean(n.title)}</h2><p>{summary(n.description)}</p><button type="button">요약 자세히 보기 →</button></div></article>)}</div>
      {!pageItems.length&&<div className="petnews-state">조건에 맞는 뉴스가 없어요. 다른 카테고리나 검색어를 선택해 주세요.</div>}
      {pages>1&&<div className="petnews-pages"><button disabled={safe<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>이전</button><b>{safe} / {pages}</b><button disabled={safe>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>다음</button></div>}
    </>}
    {selected&&<div className="petnews-modal-backdrop" onClick={()=>setSelected(null)}><section className="petnews-modal" onClick={e=>e.stopPropagation()}><button className="petnews-close" onClick={()=>setSelected(null)}>×</button><small>{selected.category||'반려동물'} · {selected.source||'언론사'}</small><h2>{clean(selected.title)}</h2>{selected.image&&<img src={selected.image} alt=""/>}<div className="petnews-summary-box"><b>핵심 요약</b><p>{summary(selected.description)}</p></div><p className="petnews-source-note">PetGrow는 기사 설명을 바탕으로 핵심 내용을 정리해 보여줘요. 정확한 세부 내용은 원문을 확인해 주세요.</p><a className="bg-btn" href={selected.link||selected.naverLink} target="_blank" rel="noreferrer">원문 전체보기</a></section></div>}
  </div>;
}

'''
s=s[:start]+news+s[end:]

# 4) Design polish CSS: about 2 columns x 5 rows, visible PetPoint, PetNews, Saju/Tarot consistency.
css=r'''
  /* PETGROW_UI_POLISH_20260817 */
  .petpoint-visible{max-width:1120px;margin:16px auto 20px;padding:22px 24px;border:1px solid #d9e6d7;border-radius:24px;background:linear-gradient(135deg,#fffdf7,#eef7ed);display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;box-shadow:0 14px 34px rgba(55,75,58,.07)}.petpoint-visible-icon{width:58px;height:58px;border-radius:18px;background:#fff;display:grid;place-items:center;font-size:30px;border:1px solid #e4eadf}.petpoint-visible-copy small{font-size:10px;font-weight:900;letter-spacing:.14em;color:#4f8a5b}.petpoint-visible-copy h2{margin:4px 0 5px;font-size:20px}.petpoint-visible-copy p{margin:0;color:var(--sub);font-size:12px;line-height:1.65}.petpoint-visible-actions{text-align:right;max-width:320px}.petpoint-visible-actions b{display:block;color:#315f40;font-size:26px}.petpoint-visible-actions span{display:block;margin-top:4px;color:#7a806f;font-size:10px;line-height:1.5}.petpoint-visible.compact{padding:16px 20px;border-radius:20px}.petpoint-visible.compact .petpoint-visible-icon{width:46px;height:46px;font-size:24px}.petpoint-visible.compact .petpoint-visible-copy h2{font-size:16px}
  .about-feature-grid,.about-features-grid,.intro-feature-grid,.intro-features-grid,.about-grid,.about-feature-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important}.about-feature-grid>*,.about-features-grid>*,.intro-feature-grid>*,.intro-features-grid>*,.about-grid>*,.about-feature-cards>*{min-height:220px!important;border:1px solid #dde8da!important;box-shadow:0 12px 30px rgba(55,75,58,.06)!important}.about-feature-grid>*:nth-child(4n+1),.about-features-grid>*:nth-child(4n+1),.intro-feature-grid>*:nth-child(4n+1),.intro-features-grid>*:nth-child(4n+1),.about-grid>*:nth-child(4n+1){background:#eef7ef!important}.about-feature-grid>*:nth-child(4n+2),.about-features-grid>*:nth-child(4n+2),.intro-feature-grid>*:nth-child(4n+2),.intro-features-grid>*:nth-child(4n+2),.about-grid>*:nth-child(4n+2){background:#f8f6ec!important}.about-feature-grid>*:nth-child(4n+3),.about-features-grid>*:nth-child(4n+3),.intro-feature-grid>*:nth-child(4n+3),.intro-features-grid>*:nth-child(4n+3),.about-grid>*:nth-child(4n+3){background:#edf6f6!important}.about-feature-grid>*:nth-child(4n),.about-features-grid>*:nth-child(4n),.intro-feature-grid>*:nth-child(4n),.intro-features-grid>*:nth-child(4n),.about-grid>*:nth-child(4n){background:#fbf1ec!important}
  .pet-tarot-stage,.feature-module-shell .bg-card{border-radius:22px}.pet-tarot-stage>h2,.pet-daily-fortune-card>h2{font-family:inherit!important;font-size:24px!important;font-weight:900!important;letter-spacing:-.035em!important;color:var(--text)!important;margin:6px 0 12px!important}.pet-tarot-topic-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.pet-tarot-topic{min-height:92px!important;padding:14px 16px!important;border-radius:16px!important}.pet-tarot-topic b{font-family:inherit!important;font-size:13px!important}.pet-tarot-topic small{font-size:10.5px!important;line-height:1.5!important}.pet-tarot-intro{font-family:inherit!important}.pet-tarot-back-link{font-family:inherit!important}
  .petnews-v10{max-width:1120px;margin:0 auto;padding:0 0 36px}.petnews-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:28px;border:1px solid #e0e8dc;border-radius:24px;background:linear-gradient(135deg,#fffdf8,#eef6ec);margin-bottom:14px}.petnews-hero small{font-size:10px;font-weight:900;letter-spacing:.14em;color:#4f8a5b}.petnews-hero h1{margin:4px 0 7px;font-size:28px}.petnews-hero p{margin:0;color:var(--sub);font-size:12px}.petnews-tools{display:grid;grid-template-columns:1fr 280px;gap:12px;margin-bottom:14px}.petnews-cats{display:flex;gap:7px;overflow:auto;padding-bottom:3px}.petnews-cats button{white-space:nowrap;border:1px solid #dde5d9;background:#fff;border-radius:999px;padding:9px 12px;font-size:11px;font-weight:800;cursor:pointer}.petnews-cats button.active{background:#315f40;color:#fff;border-color:#315f40}.petnews-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.petnews-card-v10{overflow:hidden;border:1px solid #e4e8e0;border-radius:20px;background:#fff;cursor:pointer;display:grid;grid-template-columns:180px 1fr;min-height:190px;box-shadow:0 10px 28px rgba(55,75,58,.05)}.petnews-card-v10>img,.petnews-image-fallback{width:100%;height:100%;min-height:190px;object-fit:cover;background:linear-gradient(145deg,#edf5ea,#f8f3e7);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:38px}.petnews-image-fallback small{font-size:9px;margin-top:7px;color:#78917d}.petnews-card-body{padding:17px}.petnews-meta{display:flex;justify-content:space-between;gap:10px;align-items:center}.petnews-meta span{font-size:10px;font-weight:900;color:#4f8a5b}.petnews-meta small{font-size:9px;color:var(--sub)}.petnews-card-body h2{font-size:16px;line-height:1.4;margin:8px 0}.petnews-card-body p{font-size:11.5px;line-height:1.65;color:#667168;margin:0}.petnews-card-body button{border:0;background:transparent;color:#4f8a5b;font-size:10.5px;font-weight:900;padding:10px 0 0;cursor:pointer}.petnews-state{padding:46px;text-align:center;border:1px solid #e4e8e0;border-radius:20px;background:#fff;color:var(--sub)}.petnews-state.error{display:grid;gap:8px;justify-items:center}.petnews-pages{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:18px}.petnews-pages button{border:1px solid #dce5d8;background:#fff;border-radius:12px;padding:8px 13px}.petnews-modal-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(20,35,26,.42);display:grid;place-items:center;padding:18px}.petnews-modal{position:relative;width:min(680px,100%);max-height:88vh;overflow:auto;border-radius:24px;background:#fff;padding:28px;box-shadow:0 25px 80px rgba(0,0,0,.2)}.petnews-modal>img{width:100%;max-height:300px;object-fit:cover;border-radius:16px;margin:12px 0}.petnews-close{position:absolute;right:16px;top:14px;border:0;background:#f2f4f1;border-radius:50%;width:34px;height:34px;font-size:22px}.petnews-summary-box{background:#f5f8f3;border:1px solid #e2e9df;border-radius:16px;padding:16px}.petnews-summary-box p,.petnews-source-note{font-size:12px;line-height:1.75;color:#616d64}.petnews-source-note{margin:12px 0}
  @media(max-width:760px){.petpoint-visible{margin:12px;padding:16px;grid-template-columns:auto 1fr}.petpoint-visible-actions{grid-column:1/-1;text-align:left;max-width:none}.about-feature-grid,.about-features-grid,.intro-feature-grid,.intro-features-grid,.about-grid,.about-feature-cards{grid-template-columns:1fr!important}.pet-tarot-topic-grid{grid-template-columns:1fr!important}.petnews-v10{padding:0 12px 28px}.petnews-hero{padding:20px;align-items:flex-start}.petnews-tools{grid-template-columns:1fr}.petnews-grid{grid-template-columns:1fr}.petnews-card-v10{grid-template-columns:120px 1fr;min-height:160px}.petnews-card-v10>img,.petnews-image-fallback{min-height:160px}.petnews-modal{padding:22px}}
'''
marker='/* PETGROW_UI_POLISH_20260817 */'
if marker not in s:
    pos=s.rfind('</style>')
    if pos<0: raise SystemExit('style close not found')
    s=s[:pos]+css+s[pos:]

app.write_text(s)

# 5) Tarot title/card proportions aligned to Saju visual language.
p=Path('src/PetDailyWidgets.jsx')
t=p.read_text()
t=t.replace('.pet-tarot-back22{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;aspect-ratio:2/3!important;min-height:112px!important;', '.pet-tarot-back22{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;aspect-ratio:2/3!important;min-height:112px!important;')
# Keep component-local style but normalize title typography.
if 'PETGROW_TAROT_SAJU_ALIGN_20260817' not in t:
    t=t.replace('/* PETGROW_TAROT_PREMIUM_V2 */','/* PETGROW_TAROT_PREMIUM_V2 */\n/* PETGROW_TAROT_SAJU_ALIGN_20260817 */\n.pet-tarot-stage>h2{font-family:inherit!important;font-size:24px!important;font-weight:900!important;letter-spacing:-.035em!important;color:var(--text)!important}.pet-tarot-topic{font-family:inherit!important}')
p.write_text(t)

# Assertions
checks=[
 ('PetPoint visible card','function PetPointVisibleCard(' in s),
 ('PetNews v10','function PetNewsPage' in s and 'petnews-v10' in s),
 ('Nearby single place','loadMap({lat:Number(p.lat),lng:Number(p.lng)},[p],null,false)' in s),
 ('About 2col CSS','grid-template-columns:repeat(2,minmax(0,1fr))!important' in s),
 ('Tarot align','PETGROW_TAROT_SAJU_ALIGN_20260817' in t),
]
for name,ok in checks:
    print(name, 'OK' if ok else 'FAIL')
    if not ok: raise SystemExit(name+' failed')
