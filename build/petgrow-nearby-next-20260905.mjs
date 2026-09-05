function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`[petgrow-nearby-next] ${label} anchor not found`);
  return source.replace(from, to);
}

export function transformNearbyNext(source) {
  let out = source;
  out = replaceRequired(out,
    '  const pageSize=10;',
    '  const pageSize=6;\n  const mapResultLimit=12;',
    'result density');
  out = replaceRequired(out,
    'const cachedItems=cachedItemsRaw.filter(x=>Number(x.distance)<=1000);',
    'const cachedItems=cachedItemsRaw.filter(x=>Number(x.distance)<=1000&&(nextCat==="all"||x.typeKey===nextCat));',
    'cached category filter');
  out = replaceRequired(out,
    'loadMap(cached.searchCenter,cachedItems.slice(0,30),distanceOrigin)',
    'loadMap(cached.searchCenter,cachedItems.slice(0,mapResultLimit),distanceOrigin)',
    'cached map density');
  out = replaceRequired(out,
    'let nextItems=j.items.filter(x=>Number(x.distance)<=1000);',
    'let nextItems=j.items.filter(x=>Number(x.distance)<=1000&&(nextCat==="all"||x.typeKey===nextCat));',
    'response category filter');
  out = replaceRequired(out,
    'loadMap(j.searchCenter,(j.items||[]).slice(0,30),distanceOrigin)',
    'loadMap(j.searchCenter,(j.items||[]).slice(0,mapResultLimit),distanceOrigin)',
    'map marker limit');
  out = replaceRequired(out,
    `  useEffect(()=>{
    if(searchMode==="address"&&area.trim())search(cat,null,area,{background:false,mode:"address"});
    else if(searchMode==="current"&&pos)search(cat,pos,"",{background:false,mode:"current",userCoords:pos});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cat]);
  const cats=[["all","전체"],["hospital","동물병원"],["pharmacy","동물약국"],["shop","펫샵·용품"],["grooming","펫미용"],["hotel","호텔·유치원"]];`,
    `  const cats=[["all","전체"],["hospital","동물병원"],["pharmacy","동물약국"],["shop","펫샵·용품"],["grooming","펫미용"],["hotel","호텔·유치원"]];
  const catIcons={all:"🐾",hospital:"🏥",pharmacy:"💊",shop:"🛍️",grooming:"✂️",hotel:"🏡"};
  const selectCategory=(nextCat)=>{
    if(nextCat===cat||loading)return;
    setCat(nextCat);setSelected(null);setPage(1);setMsg("");
    if(area.trim())search(nextCat,null,area,{mode:"address"});
    else if(pos)search(nextCat,pos,"",{mode:"current",userCoords:pos});
    else setMsg("주소를 입력하거나 현재 위치를 허용하면 선택한 카테고리만 검색해요.");
  };`,
    'category interaction');
  out = replaceRequired(out,
    '    <ResponsiveCategoryMenu className="nearby-responsive-categories" primaryCount={3} items={cats.map(([id,label])=>({id,label}))} activeId={cat} onSelect={setCat} lang={"ko"} />',
    '    <div className="nearby-category-grid" role="group" aria-label="장소 카테고리">\n      {cats.map(([id,label])=><button type="button" key={id} className={cat===id?"active":""} aria-pressed={cat===id} disabled={loading} onClick={()=>selectCategory(id)}><span>{catIcons[id]}</span><b>{label}</b></button>)}\n    </div>',
    'category grid');
  out = replaceRequired(out,
    '    <div className="nearby-results-head"><div><h2>{searchMode==="current"?"현재 위치 주변":"검색 주소 주변"}</h2><span>{items.length}곳</span></div><small className="nearby-results-detail">{searchMode==="current"?`내 위치에서 가까운 순 · 검색범위 ${searchRadius < 1000 ? `${searchRadius}m` : `${searchRadius/1000}km`}`:pos?`내 위치에서 가까운 순 · 검색범위 ${searchRadius < 1000 ? `${searchRadius}m` : `${searchRadius/1000}km`}`:`검색 주소 기준 가까운 순 · 검색범위 ${searchRadius < 1000 ? `${searchRadius}m` : `${searchRadius/1000}km`}`}</small></div>',
    '    <div className="nearby-results-head"><div><h2>{cats.find(([id])=>id===cat)?.[1]||"전체"}</h2><span>{items.length}곳</span></div><small className="nearby-results-detail">가까운 순 · 지도에는 최대 {mapResultLimit}곳만 표시</small></div>',
    'results summary');
  out = replaceRequired(out,
    'return <div className="nearby-page">',
    'return <div className="nearby-page pg-place-next">',
    'page root');
  out = replaceRequired(out,
    '    <section className="nearby-map-card bg-card modern-nearby-map">',
    '    <div className="pg-place-workspace"><div className="pg-place-map-column">\n    <section className="nearby-map-card bg-card modern-nearby-map">',
    'workspace start');
  out = replaceRequired(out,
    '    </section>\n    {msg&&<div className="nearby-message">{msg}</div>}\n    <div className="nearby-results-head">',
    '    </section>\n    {selected&&<aside className="pg-place-focus" aria-live="polite"><div className="pg-place-focus-top"><span className={`nearby-type-badge nearby-type-${selected.typeKey||"other"}`}>{selected.typeIcon||"🐾"} {selected.typeLabel||"반려동물 관련"}</span><b>{searchMode==="current"?`내 위치 ${fmt(selected.userDistance ?? selected.distance)}`:pos?`내 위치 ${fmt(selected.userDistance ?? selected.distance)}`:`주소 기준 ${fmt(selected.distance)}`}</b></div><strong>{selected.name}</strong><p>{selected.address||"주소 정보를 확인하고 있어요."}</p><div className="pg-place-focus-actions">{selected.phone&&<a href={`tel:${selected.phone}`}>전화하기</a>}{selected.url&&<a href={selected.url} target="_blank" rel="noreferrer">길찾기 ↗</a>}</div></aside>}\n    {msg&&<div className="nearby-message">{msg}</div>}\n    </div><div className="pg-place-results-column">\n    <div className="nearby-results-head">',
    'map focus and results column');
  out = replaceRequired(out,
    '    </nav>}\n\n    {selected&&<section className="bg-card nearby-review-panel">',
    '    </nav>}\n    </div></div>\n\n    {selected&&<section className="bg-card nearby-review-panel">',
    'workspace end');
  return out;
}

export default function petgrowNearbyNext() {
  return {
    name: "petgrow-nearby-next-20260905",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      return { code: transformNearbyNext(code), map: null };
    },
  };
}
