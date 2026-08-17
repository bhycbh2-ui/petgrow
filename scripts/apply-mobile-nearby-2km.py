from pathlib import Path

p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
needle='''  const loadMap=async(center,places,userPos=pos,showSearchPin=true)=>{\n    if(!mapRef.current)return;'''
replacement='''  const loadMap=async(center,places,userPos=pos,showSearchPin=true)=>{\n    if(!mapRef.current)return;\n    const mobileNearby=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(max-width: 700px)").matches;\n    if(mobileNearby){\n      const within2km=(places||[]).filter((p)=>{\n        const d=Number(p?.distance ?? p?.userDistance);\n        return !Number.isFinite(d)||d<=2000;\n      });\n      places=within2km.slice(0,25);\n    }'''
if needle not in s:
    raise SystemExit('loadMap anchor not found')
s=s.replace(needle,replacement,1)
css='''\n/* PETGROW_MOBILE_NEARBY_2KM_20260817 */\n@media(max-width:700px){\n  .nearby-map-marker{width:26px!important;height:30px!important;border-radius:11px 11px 11px 3px!important;box-shadow:0 4px 10px rgba(35,54,40,.16)!important}\n  .nearby-map-marker span{width:18px!important;height:18px!important;font-size:11px!important}\n  .nearby-map-marker i{right:-5px!important;top:-5px!important;width:15px!important;height:15px!important;font-size:8px!important}\n  .nearby-search-pin span{width:18px!important;height:18px!important;border-width:2px!important;font-size:11px!important}\n  .nearby-search-pin b,.nearby-me-pin b{font-size:9px!important;padding:4px 7px!important}\n  .nearby-me-pin span{width:14px!important;height:14px!important;border-width:3px!important}\n}\n'''
if 'PETGROW_MOBILE_NEARBY_2KM_20260817' not in s:
    s += css
p.write_text(s,encoding='utf-8')
print('patched mobile nearby: <=2km, max 25 markers, smaller markers')
