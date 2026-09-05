function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`[petgrow-nearby-next] ${label} anchor not found`);
  return source.replace(from, to);
}

export function transformNearbyNext(source) {
  let out = source;
  out = replaceRequired(out,
    'const cats=[["all","전체"],["hospital","동물병원"],["pharmacy","동물약국"],["shop","펫샵·용품"],["grooming","펫미용"],["hotel","호텔·유치원"]];',
    'const cats=[["all","🐾 전체"],["hospital","🏥 동물병원"],["pharmacy","💊 동물약국"],["shop","🛍 펫샵·용품"],["grooming","✂ 펫미용"],["hotel","🏡 호텔·유치원"]];',
    'category labels');
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
