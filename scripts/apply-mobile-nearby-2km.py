from pathlib import Path

p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
needle='''  const loadMap=async(center,places,userPos=pos,showSearchPin=true)=>{\n    if(!mapRef.current)return;'''
replacement='''  const loadMap=async(center,places,userPos=pos,showSearchPin=true)=>{\n    if(!mapRef.current)return;\n    const mobileNearby=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(max-width: 700px)").matches;\n    if(mobileNearby){\n      const within2km=(places||[]).filter((p)=>{\n        const d=Number(p?.distance ?? p?.userDistance);\n        return !Number.isFinite(d)||d<=2000;\n      });\n      places=within2km.slice(0,25);\n    }'''
if needle not in s:
    raise SystemExit('loadMap anchor not found')
s=s.replace(needle,replacement,1)
p.write_text(s,encoding='utf-8')
print('patched mobile nearby: <=2km, max 25 markers')
