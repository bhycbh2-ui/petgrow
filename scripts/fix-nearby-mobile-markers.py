from pathlib import Path
p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
anchor='@media(max-width:700px){.nearby-search-row{grid-template-columns:minmax(0,1fr) auto;gap:8px}'
if anchor not in s: raise SystemExit('anchor not found')
mobile='''@media(max-width:700px){
  .nearby-map-marker{width:26px!important;height:30px!important;border-radius:12px 12px 12px 3px!important;box-shadow:0 4px 10px rgba(35,54,40,.16)!important}
  .nearby-map-marker span{width:18px!important;height:18px!important;font-size:11px!important;line-height:1!important}
  .nearby-map-marker i{right:-5px!important;top:-5px!important;width:15px!important;height:15px!important;font-size:7px!important}
  .petgrow-leaflet-place{width:32px!important;height:36px!important;margin-left:-16px!important;margin-top:-32px!important}
  .nearby-search-pin span{width:18px!important;height:18px!important;border-width:2px!important;font-size:10px!important}
  .nearby-search-pin b,.nearby-me-pin b{font-size:8px!important;padding:4px 6px!important}
}
'''
s=s.replace(anchor,mobile+'\n'+anchor,1)
s=s.replace('iconSize:[44,50],iconAnchor:[22,46]','iconSize:[32,36],iconAnchor:[16,32]')
p.write_text(s,encoding='utf-8')
