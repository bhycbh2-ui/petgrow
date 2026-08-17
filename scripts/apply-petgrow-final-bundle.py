from pathlib import Path
import re

APP=Path('src/App.jsx')
WIDGET=Path('src/PetDailyWidgets.jsx')
ADMIN=Path('api/admin.js')
app=APP.read_text(encoding='utf-8')
widget=WIDGET.read_text(encoding='utf-8')
admin=ADMIN.read_text(encoding='utf-8')

def rep(s, old, new, label):
    if old not in s:
        raise RuntimeError('missing anchor: '+label)
    return s.replace(old,new,1)

# 1) Common menu hero: add missing menus and force identical size/position.
app=rep(app,
"    support:{eyebrow:'PETGROW SUPPORT',ko:'고객지원',en:'Support',koDesc:'서비스 이용 중 궁금한 점이나 도움이 필요한 내용을 남겨주세요.',enDesc:'Ask questions or get help using PetGrow.'},",
"    nearby:{eyebrow:'PETGROW NEARBY',ko:'내 주변 Pet',en:'Nearby Pet',koDesc:'주소나 현재 위치를 기준으로 가까운 반려동물 시설을 찾아보세요.',enDesc:'Find nearby pet hospitals, shops, grooming and care services.'},\n    music:{eyebrow:'PETGROW SOUND',ko:'Pet음악',en:'Pet Music',koDesc:'강아지와 고양이를 위한 음악을 듣고 좋아요·댓글로 반응을 나눠보세요.',enDesc:'Listen to music for dogs and cats and save your favorites.'},\n    news:{eyebrow:'PETGROW NEWS',ko:'Pet뉴스',en:'Pet News',koDesc:'반려견·반려묘·건강·정책 등 최신 반려동물 뉴스를 보기 좋게 모아봐요.',enDesc:'Browse recent pet news with clear summaries and publisher links.'},\n    support:{eyebrow:'PETGROW SUPPORT',ko:'고객지원',en:'Support',koDesc:'서비스 이용 중 궁금한 점이나 도움이 필요한 내용을 남겨주세요.',enDesc:'Ask questions or get help using PetGrow.'},",
'hero meta')
app=rep(app,
'{["community","tips","saju","tarot","petbti","guide","my","more","support","ad-inquiry"].includes(effectiveView) && <UnifiedMenuHero view={effectiveView} lang={lang} />}',
'{["community","tips","saju","tarot","petbti","guide","my","more","support","ad-inquiry","nearby","music","news"].includes(effectiveView) && <UnifiedMenuHero view={effectiveView} lang={lang} />}',
'hero view list')

css='''\n/* PETGROW_FINAL_LAYOUT_20260817 */\n.petgrow-content-stage>.petgrow-unified-hero{width:calc(100% - 40px)!important;max-width:900px!important;margin:0 auto 18px!important;box-sizing:border-box!important;padding:24px 26px!important;min-height:132px!important;display:flex!important;align-items:center!important}\n.petgrow-page-top>.petgrow-unified-hero{box-sizing:border-box!important;padding:24px 26px!important;min-height:132px!important;display:flex!important;align-items:center!important}\n.petgrow-unified-hero .nearby-eyebrow{display:block!important;font-size:11px!important;line-height:1.2!important;font-weight:900!important;letter-spacing:.13em!important;margin:0 0 8px!important}\n.petgrow-unified-hero h1{font-family:inherit!important;font-size:28px!important;line-height:1.18!important;font-weight:900!important;letter-spacing:-.035em!important;margin:0 0 8px!important}\n.petgrow-unified-hero p{font-size:14px!important;line-height:1.65!important;margin:0!important;max-width:720px!important;word-break:keep-all!important}\n.petgrow-content-stage>.petgrow-unified-hero+.petmusic-page>.petmusic-hero,.petgrow-content-stage>.petgrow-unified-hero+.nearby-page>.nearby-hero{display:none!important}\n.petgrow-footer{width:calc(100% - 40px);max-width:900px;margin:34px auto 0;padding:22px 0 38px;border-top:1px solid var(--border);box-sizing:border-box;text-align:center}\n.petgrow-footer-email,.petgrow-footer-copy{font-size:11px;color:var(--sub);line-height:1.6}.petgrow-footer-copy{margin-top:2px}.petgrow-footer-links{display:flex;justify-content:center;align-items:center;gap:8px 18px;flex-wrap:wrap;margin-top:12px}.petgrow-footer-links button,.petgrow-footer-links a{font:600 11px/1.4 inherit;color:var(--primary);background:none;border:0;padding:3px 0;text-decoration:none;cursor:pointer}\n.petnews-list{display:grid;gap:12px}.petnews-card{display:grid;grid-template-columns:180px minmax(0,1fr);gap:16px;padding:0!important;overflow:hidden;text-align:left;border:1px solid var(--border)!important;cursor:pointer}.petnews-card-media{min-height:145px;background:#eef4ee;overflow:hidden}.petnews-card-media img{width:100%;height:100%;min-height:145px;object-fit:cover;display:block}.petnews-card-body{padding:16px 18px 16px 0;min-width:0}.petnews-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:11px;color:var(--sub);margin-bottom:7px}.petnews-meta b{color:var(--primary)}.petnews-title{font-size:17px;line-height:1.42;font-weight:900;letter-spacing:-.025em;word-break:keep-all}.petnews-summary{font-size:13px;line-height:1.68;color:var(--sub);margin:7px 0 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:keep-all}.petnews-detail{max-width:820px;margin:0 auto}.petnews-detail-back{margin:0 0 12px}.petnews-detail-hero{overflow:hidden;padding:0!important}.petnews-detail-image{width:100%;max-height:420px;object-fit:cover;display:block;background:#eef4ee}.petnews-detail-copy{padding:22px}.petnews-detail-copy h2{font-size:26px;line-height:1.35;letter-spacing:-.035em;margin:8px 0 14px;word-break:keep-all}.petnews-detail-summary{font-size:15px;line-height:1.85;white-space:pre-line;word-break:keep-all}.petnews-source-note{margin-top:18px;padding:14px 16px;border-radius:14px;background:var(--surface);font-size:12px;line-height:1.7;color:var(--sub)}\n@media(max-width:700px){.petgrow-content-stage>.petgrow-unified-hero{width:calc(100% - 28px)!important;padding:20px 18px!important;min-height:118px!important}.petgrow-page-top>.petgrow-unified-hero{padding:20px 18px!important;min-height:118px!important}.petgrow-unified-hero h1{font-size:23px!important}.petgrow-unified-hero p{font-size:13px!important}.petgrow-footer{width:calc(100% - 28px);padding:18px 0 92px}.petnews-card{grid-template-columns:112px minmax(0,1fr);gap:12px}.petnews-card-media,.petnews-card-media img{min-height:128px}.petnews-card-body{padding:12px 12px 12px 0}.petnews-title{font-size:15px}.petnews-summary{font-size:12px;-webkit-line-clamp:3}.petnews-detail-copy{padding:18px}.petnews-detail-copy h2{font-size:21px}.petnews-detail-summary{font-size:14px}}\n'''
app=rep(app,'.app-bottom-nav{position:fixed;',css+'\n.app-bottom-nav{position:fixed;','layout css')

# 2) Home tarot opens standalone Tarot, and terms actually render news conditions.
app=rep(app,'<TodayPetHomeCard account={account} onOpenSaju={()=>onGoView("saju")} lang={lang} />','<TodayPetHomeCard account={account} onOpenSaju={()=>onGoView("saju")} onOpenTarot={()=>onGoView("tarot")} lang={lang} />','home tarot callback')
app=rep(app,') : effectiveView === "terms" ? (\n        <TermsContent />\n      ) : effectiveView === "about" ? (',') : effectiveView === "terms" ? (\n        <><TermsContent /><PetNewsTermsAddendum /></>\n      ) : effectiveView === "about" ? (','terms addendum')

# 3) Replace PetNews page with readable in-app detail + images.
start=app.index('/* PETNEWS_UI_FIXED_20260817 */')
end=app.index('function PetNewsPrivacyAddendum',start)
news_component=r'''/* PETNEWS_UI_FIXED_20260817 */
function PetNewsPage({ lang = "ko" }) {
  const [data,setData]=useState({items:[]}),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [category,setCategory]=useState("전체"),[showAllCategories,setShowAllCategories]=useState(false),[searchInput,setSearchInput]=useState(""),[newsSearch,setNewsSearch]=useState(""),[newsPage,setNewsPage]=useState(1),[selectedNews,setSelectedNews]=useState(null);
  const NEWS_PAGE_SIZE=10,cats=["전체","반려견","반려묘","건강","정책·제도","입양·보호","산업·서비스","반려동물"],visibleCats=showAllCategories?cats:cats.slice(0,4);
  const clean=v=>String(v||"").replace(/&nbsp;|&#160;|&#xA0;/gi," ").replace(/\s+/g," ").trim();
  const fallback=n=>n?.category==="반려견"?"/pettalk-demo-dog.webp":n?.category==="반려묘"?"/pettalk-demo-cat.webp":"/intro-video-poster.webp";
  const load=async()=>{setLoading(true);setError("");try{const r=await fetch('/api/news');const j=await r.json();if(!r.ok)throw new Error();setData({...j,items:(j.items||[]).map(x=>({...x,title:clean(x.title),description:clean(x.description)}))});}catch{setError("뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const q=clean(newsSearch).toLowerCase();
  const items=(data.items||[]).filter(x=>(category==="전체"||x.category===category)&&(!q||[x.title,x.description,x.source,x.category].some(v=>clean(v).toLowerCase().includes(q))));
  const totalPages=Math.max(1,Math.ceil(items.length/NEWS_PAGE_SIZE)),safePage=Math.min(newsPage,totalPages),paged=items.slice((safePage-1)*NEWS_PAGE_SIZE,safePage*NEWS_PAGE_SIZE);
  const runSearch=()=>{setNewsSearch(searchInput);setNewsPage(1)},clearSearch=()=>{setSearchInput("");setNewsSearch("");setNewsPage(1)};
  const timeLabel=iso=>{if(!iso)return "";const d=new Date(iso),diff=Date.now()-d.getTime();if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+"분 전";if(diff<86400000)return Math.floor(diff/3600000)+"시간 전";return d.toLocaleDateString("ko-KR")};
  if(selectedNews){const n=selectedNews;return <div className="legal-page-shell petnews-detail"><button type="button" className="bg-btn bg-btn-ghost petnews-detail-back" onClick={()=>setSelectedNews(null)}>← 뉴스 목록</button><article className="bg-card petnews-detail-hero"><img className="petnews-detail-image" src={n.image||fallback(n)} alt="" loading="eager" onError={e=>{e.currentTarget.src=fallback(n)}}/><div className="petnews-detail-copy"><div className="petnews-meta"><b>{n.category||"Pet뉴스"}</b><span>{n.source||"언론사"}</span><span>·</span><span>{timeLabel(n.publishedAt)}</span></div><h2>{n.title}</h2><div className="petnews-detail-summary">{n.description||"기사의 핵심 내용은 원문에서 확인할 수 있어요."}</div><div className="petnews-source-note">PetGrow에서는 기사 제목과 제공된 요약을 보기 좋게 정리해 보여드려요. 기사 전문과 이미지의 권리는 각 언론사에 있으며, 자세한 내용은 원문에서 확인할 수 있어요.</div><a className="bg-btn" href={n.link} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",marginTop:16,textDecoration:"none"}}>원문 전체보기 ↗</a></div></article></div>}
  return <div className="legal-page-shell" style={{maxWidth:900,margin:"0 auto",padding:"0 20px 48px"}}>
    <section className="bg-card petnews-tools" style={{padding:14,marginBottom:14}}><div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:8}}><input className="bg-input" value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")runSearch()}} placeholder="뉴스 제목·내용·언론사 검색"/><button className="bg-btn" onClick={runSearch}>검색</button></div>{newsSearch&&<button className="bg-chip" style={{marginTop:8}} onClick={clearSearch}>검색 초기화</button>}</section>
    <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>{visibleCats.map(c=><button key={c} className={"bg-chip "+(category===c?"active":"")} onClick={()=>{setCategory(c);setNewsPage(1)}}>{c}</button>)}<button className="bg-chip" onClick={()=>setShowAllCategories(v=>!v)}>{showAllCategories?"접기":`더보기 +${cats.length-4}`}</button></div>
    {loading?<div className="bg-card" style={{textAlign:"center",padding:30}}>뉴스를 불러오는 중...</div>:error?<div className="bg-card" style={{textAlign:"center",padding:30}}>{error}<br/><button className="bg-btn" style={{marginTop:12}} onClick={load}>다시 시도</button></div>:paged.length?<div className="petnews-list">{paged.map(n=><button type="button" className="bg-card petnews-card" key={n.id} onClick={()=>{setSelectedNews(n);window.scrollTo({top:0,behavior:"smooth"})}}><div className="petnews-card-media"><img src={n.image||fallback(n)} alt="" loading="lazy" onError={e=>{e.currentTarget.src=fallback(n)}}/></div><div className="petnews-card-body"><div className="petnews-meta"><b>{n.category||"Pet뉴스"}</b><span>{n.source||"언론사"}</span><span>·</span><span>{timeLabel(n.publishedAt)}</span></div><div className="petnews-title">{n.title}</div><p className="petnews-summary">{n.description||"기사 내용을 눌러 자세히 확인해보세요."}</p></div></button>)}</div>:<div className="bg-card" style={{textAlign:"center",padding:30}}>조건에 맞는 뉴스가 없어요.</div>}
    {!loading&&!error&&items.length>NEWS_PAGE_SIZE&&<div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginTop:18}}><button className="bg-chip" disabled={safePage<=1} onClick={()=>setNewsPage(p=>Math.max(1,p-1))}>‹ 이전</button>{Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} className={"bg-chip "+(p===safePage?"active":"")} onClick={()=>setNewsPage(p)}>{p}</button>)}<button className="bg-chip" disabled={safePage>=totalPages} onClick={()=>setNewsPage(p=>Math.min(totalPages,p+1))}>다음 ›</button></div>}
    <p className="bg-sub" style={{fontSize:12,lineHeight:1.7,marginTop:16}}>Pet뉴스는 공개 뉴스 검색 결과를 바탕으로 제목·요약을 제공하며 기사 전문과 저작권은 각 언론사에 있습니다.</p>
  </div>;
}

'''
app=app[:start]+news_component+app[end:]

# 4) Footer: same page width/alignment as content.
footer_re=re.compile(r'\n      \{effectiveView !== "login" && \(\n        <div style=\{\{ maxWidth: 900, margin: "0 auto", padding: "0 20px 40px" \}\}>[\s\S]*?\n        </div>\n      \)\}\n\n      \{effectiveView !== "login" && MENU_HELP',re.M)
m=footer_re.search(app)
if not m: raise RuntimeError('missing footer block')
footer='''\n      {effectiveView !== "login" && (\n        <footer className="petgrow-footer">\n          <div className="petgrow-footer-email">help.petgrow@gmail.com</div>\n          <div className="petgrow-footer-copy">Copyright ⓒ PetGrow. All rights reserved.</div>\n          <div className="petgrow-footer-links">\n            <button type="button" onClick={()=>goView("privacy")}>{t.privacyFooterLink}</button>\n            <button type="button" onClick={()=>goView("terms")}>{t.termsFooterLink}</button>\n            <button type="button" onClick={()=>goView("guide")}>{lang==="en"?"Guide":"정보가이드"}</button>\n            <button type="button" onClick={()=>goView("ad-inquiry")}>{lang==="en"?"Partnerships":"광고·제휴 문의"}</button>\n            <button type="button" onClick={()=>goView("support")}>{lang==="en"?"Support":"고객지원"}</button>\n          </div>\n        </footer>\n      )}\n\n      {effectiveView !== "login" && MENU_HELP'''
app=app[:m.start()]+footer+app[m.end():]

# 5) About wording reflects in-app news reading.
app=app.replace('"반려동물 관련 최신 뉴스만 모아보고 원문까지 바로 확인해요."','"반려동물 관련 최신 뉴스를 사진·요약과 함께 PetGrow 안에서 먼저 읽고, 필요할 때 원문을 확인해요."')

# 6) Tarot Korean copy + home routing.
widget=rep(widget,'<small className="pet-daily-eyebrow">PETGROW TAROT · 22 MAJOR ARCANA</small><h2>🃏 {petName}{lang==="en"?"\'s Tarot":"의 Pet타로"}</h2>','<small className="pet-daily-eyebrow">{lang==="en"?"PETGROW TAROT · 22 MAJOR ARCANA":"PETGROW 타로 · 메이저 아르카나 22장"}</small><h2>{petName}{lang==="en"?"\'s Tarot":"의 Pet타로"}</h2>','tarot eyebrow')
widget=rep(widget,'<div className="pet-tarot-title"><b>{result.name}</b><small>{result.en}</small></div>','<div className="pet-tarot-title"><b>{result.name}</b>{lang==="en"&&<small>{result.en}</small>}</div>','tarot english title')
widget=rep(widget,'export function TodayPetHomeCard({account,onOpenSaju,lang="ko"}){','export function TodayPetHomeCard({account,onOpenSaju,onOpenTarot,lang="ko"}){','home widget signature')
widget=rep(widget,'<button type="button" className="bg-card pet-today-item tarot" onClick={onOpenSaju}>','<button type="button" className="bg-card pet-today-item tarot" onClick={onOpenTarot||onOpenSaju}>','home tarot route')

# 7) Admin statistics: add Tarot/Saju feature use counts and tarot menu label.
admin=rep(admin,
'      platformUsage:()=>sql`\n        select platform,',
'''      featureUsage:()=>sql`\n        select feature,\n          count(*) filter(where created_at>=(now() at time zone 'Asia/Seoul')::date)::int today,\n          count(*) filter(where created_at>=now()-interval '7 days')::int d7,\n          count(*) filter(where created_at>=now()-interval '30 days')::int d30\n        from pg_feature_usage\n        where feature in ('saju_daily','tarot_daily','tarot_bond','tarot_heart','tarot_activity','tarot_advice','saju_tarot_save')\n          and created_at>=now()-interval '30 days'\n        group by feature order by d30 desc\n      `,\n      platformUsage:()=>sql`\n        select platform,''',
'admin feature query')
admin=rep(admin,
'    const platformRows=settled[ent.findIndex(([k])=>k==="platformUsage")]?.status==="fulfilled" ? settled[ent.findIndex(([k])=>k==="platformUsage")].value.rows : [];\n    return res.status(200).json({warnings,cards:',
'    const platformRows=settled[ent.findIndex(([k])=>k==="platformUsage")]?.status==="fulfilled" ? settled[ent.findIndex(([k])=>k==="platformUsage")].value.rows : [];\n    const featureRows=settled[ent.findIndex(([k])=>k==="featureUsage")]?.status==="fulfilled" ? settled[ent.findIndex(([k])=>k==="featureUsage")].value.rows : [];\n    return res.status(200).json({warnings,cards:',
'admin feature rows')
admin=rep(admin,'},menuUsage:menuRows,platformUsage:platformRows});','},menuUsage:menuRows,platformUsage:platformRows,featureUsage:featureRows});','admin return features')

# Admin dashboard front-end: menu label + a compact feature section.
app=app.replace('saju:"Pet사주",petbti:"PetBTI"','saju:"Pet사주",tarot:"Pet타로",petbti:"PetBTI"')
anchor='''     </div>\n   </>}\n   {tab==="reporting"'''
feature_ui='''     </div>\n     <div className="bg-card admin-menu-analytics">\n       <div className="admin-menu-analytics-head"><div><h3>Pet사주 · Pet타로 이용 현황</h3><small>주제별 결과 생성 및 저장 이용량 · 오늘 / 7일 / 30일</small></div></div>\n       {(()=>{const labels={saju_daily:"오늘의 펫운세",tarot_daily:"오늘의 타로",tarot_bond:"보호자 궁합 타로",tarot_heart:"우리 아이 마음 타로",tarot_activity:"산책·활동 타로",tarot_advice:"오늘의 조언 타로",saju_tarot_save:"타로 저장"};const rows=stats?.featureUsage||[];return rows.length?rows.map(x=><div className="admin-menu-row" key={x.feature}><div className="admin-menu-name">{labels[x.feature]||x.feature}</div><div className="admin-menu-value"><b>{Number(x.d30)||0}회</b><br/><small>7일 {Number(x.d7)||0} · 오늘 {Number(x.today)||0}</small></div></div>):<div className="bg-sub" style={{padding:"10px 0"}}>아직 Pet타로·운세 이용 데이터가 없어요.</div>})()}\n     </div>\n   </>}\n   {tab==="reporting"'''
app=rep(app,anchor,feature_ui,'admin feature ui')

APP.write_text(app,encoding='utf-8')
WIDGET.write_text(widget,encoding='utf-8')
ADMIN.write_text(admin,encoding='utf-8')
print('final bundle patch applied')
