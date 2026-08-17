import fs from 'fs';

function replaceOrFail(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`Patch target not found: ${label}`);
  return text.replace(from, to);
}

let app = fs.readFileSync('src/App.jsx','utf8');

app = replaceOrFail(app,
`  const categoryColors = { dog: "#EEF8E9", cat: "#FFF1F5", health: "#EAF4FF", life: "#F5F8F4", food: "#FFF0E5", training: "#F1F5F1", safety: "#E9F8F5", grooming: "#FCEEF9" };\n  const categoryText = { dog: "#4F8A5B", cat: "#D66B8D", health: "#4C86B8", life: "#A37B18", food: "#C8733C", training: "#7965B3", safety: "#388C7D", grooming: "#B45D9A" };\n  const answerColors = { dog: "#F7FBF5", cat: "#FFF7FA", health: "#F6FAFF", life: "#FBFAF3", food: "#FFF8F3", training: "#F8F7FC", safety: "#F4FBF9", grooming: "#FFF7FC" };\n  const answerBorders = { dog: "#D5E8D0", cat: "#F1D9E2", health: "#D7E8F6", life: "#E9E3C7", food: "#F2DCCB", training: "#E0DAF1", safety: "#D1EAE4", grooming: "#EED8E8" };`,
`  const categoryColors = { dog: "#F7FBF7", cat: "#FFF9FB", health: "#F7FAFD", life: "#FAFBF9", food: "#FFF9F5", training: "#FAF9FC", safety: "#F7FBFA", grooming: "#FFF9FD" };\n  const categoryText = { dog: "#4F8A5B", cat: "#C96E8A", health: "#4C7FA7", life: "#8B792F", food: "#B87343", training: "#7466A0", safety: "#3C8175", grooming: "#A96191" };\n  const answerColors = { dog: "#FFFFFF", cat: "#FFFFFF", health: "#FFFFFF", life: "#FFFFFF", food: "#FFFFFF", training: "#FFFFFF", safety: "#FFFFFF", grooming: "#FFFFFF" };\n  const answerBorders = { dog: "#E4EAE5", cat: "#E8E8E8", health: "#E4E9EC", life: "#E9E8E2", food: "#ECE7E2", training: "#E8E6ED", safety: "#E3EAE7", grooming: "#ECE6EA" };`, 'PetInfo white tone');

app = app.replace(
`.tip-answer-panel{margin-top:13px;padding:15px 16px;border:1px solid #EADFD6;border-left:4px solid #D8B49B;border-radius:13px;background:#FFF8F3;color:var(--text);font-size:13px;line-height:1.78;box-shadow:0 5px 16px rgba(82,62,46,.055);display:flex;align-items:flex-start;gap:10px}`,
`.tip-answer-panel{margin-top:13px;padding:16px 17px;border:1px solid #E6EBE7;border-left:3px solid #AFC9B5;border-radius:13px;background:#fff;color:var(--text);font-size:13px;line-height:1.8;box-shadow:0 4px 14px rgba(55,75,61,.045);display:flex;align-items:flex-start;gap:10px}`
);

app = replaceOrFail(app,
`          const map=new K.Map(mapRef.current,{center:centerPos,level:4});mapObj.current=map;mapObj.current.__engine="kakao";`,
`          const map=new K.Map(mapRef.current,{center:centerPos,level:4});mapObj.current=map;mapObj.current.__engine="kakao";\n          window.setTimeout(()=>{try{map.relayout();map.setCenter(centerPos)}catch{}},60);\n          window.setTimeout(()=>{try{map.relayout()}catch{}},260);`, 'Kakao relayout');

app = replaceOrFail(app,
`    window.setTimeout(()=>map.invalidateSize(),60);\n  };\n\n  const mergeNearbyRows=(groups)=>{`,
`    window.setTimeout(()=>map.invalidateSize(),60);\n    window.setTimeout(()=>map.invalidateSize(),260);\n  };\n\n  useEffect(()=>{\n    let disposed=false;\n    const timer=window.setTimeout(()=>{\n      if(disposed||!mapRef.current||mapObj.current)return;\n      loadMap({lat:37.5665,lng:126.9780},[],null,false).catch(e=>console.warn("Initial nearby map load failed",e));\n    },100);\n    return()=>{disposed=true;window.clearTimeout(timer);};\n  },[]);\n\n  const mergeNearbyRows=(groups)=>{`, 'initial nearby map');

app = app.replace(
`<div ref={mapRef} className="nearby-map"><div className="nearby-map-fallback"><MapPinIcon/><b>주소 또는 현재 위치로 검색해 주세요</b><span>검색 기준 주변 업체를 지도에서 확인할 수 있어요.</span></div></div>`,
`<div ref={mapRef} className="nearby-map"><div className="nearby-map-fallback"><MapPinIcon/><b>지도를 불러오는 중이에요</b><span>주소를 검색하면 검색 지점과 주변 업체가 지도에 표시돼요.</span></div></div>`
);

fs.writeFileSync('src/App.jsx', app);
console.log('Map visibility and PetInfo white-tone refinement applied');
