from pathlib import Path

app = Path('src/App.jsx')
css = Path('src/petgrow-premium-20260817.css')

s = app.read_text(encoding='utf-8')
old = 'onClick={()=>{setSelected(p);const c=searchCenterRef.current||{lat:Number(p.lat),lng:Number(p.lng)};loadMap(c,[p],pos,false).catch(()=>{});}}'
new = 'onClick={()=>{setSelected(p);window.setTimeout(()=>loadMap({lat:Number(p.lat),lng:Number(p.lng)},[p],null,false).catch(()=>{}),0);}}'
if old in s:
    s = s.replace(old, new, 1)
app.write_text(s, encoding='utf-8')

c = css.read_text(encoding='utf-8')
c = c.replace('font-weight:650!important', 'font-weight:600!important')
# Keep map geometry stable on all breakpoints and prevent layout transitions from looking like zoom oscillation.
if '/* MAP_STABILITY_FINAL_20260817 */' not in c:
    c += '''\n\n/* MAP_STABILITY_FINAL_20260817 */\n.map-wrap,.map-container,.nearby-map,.leaflet-container,[id*="map"]{transition:none!important;animation:none!important}\n.nearby-map,.map-container,.leaflet-container{width:100%!important;contain:layout paint}\n@media (min-width:1025px){.nearby-map,.map-container,.leaflet-container{height:500px!important;min-height:500px!important;max-height:500px!important}}\n@media (min-width:761px) and (max-width:1024px){.nearby-map,.map-container,.leaflet-container{height:440px!important;min-height:440px!important;max-height:440px!important}}\n@media (max-width:760px){.nearby-map,.map-container,.leaflet-container{height:390px!important;min-height:390px!important;max-height:390px!important}}\n@media (max-width:390px){.nearby-map,.map-container,.leaflet-container{height:350px!important;min-height:350px!important;max-height:350px!important}}\n'''
css.write_text(c, encoding='utf-8')

print('premium design finalization complete')
print('map click stabilized:', new in s)
