from pathlib import Path
p=Path('src/PetDailyWidgets.jsx')
s=p.read_text(encoding='utf-8')
repls={
'''<div className="pet-daily-orb">🌤️</div><small className="pet-daily-eyebrow">TODAY'S PET FORTUNE</small>''':'''<div className="pet-daily-orb">🌤️</div><small className="pet-daily-eyebrow">{lang==="en"?"TODAY'S PET FORTUNE":"오늘의 펫운세"}</small>''',
'''<small className="pet-daily-eyebrow">PETGROW TAROT · 22 MAJOR ARCANA</small>''':'''<small className="pet-daily-eyebrow">{lang==="en"?"PETGROW TAROT · 22 MAJOR ARCANA":"PETGROW TAROT · 메이저 아르카나 22장"}</small>''',
'''<div className="pet-tarot-title"><b>{result.name}</b><small>{result.en}</small></div>''':'''<div className="pet-tarot-title"><b>{lang==="en"?(result.en||result.name):result.name}</b>{lang==="en"&&result.name&&<small>{result.name}</small>}</div>''',
'''<b>PetGrow</b><em>🐾</em><small>{String(i+1).padStart(2,"0")}</small>''':'''<b>PetGrow</b><em>🐾</em><small>{String(i+1).padStart(2,"0")}</small>'''
}
changed=False
for old,new in repls.items():
    if old in s:
        s=s.replace(old,new,1);changed=True
if not changed:
    raise SystemExit('No matching Korean-label anchors found')
p.write_text(s,encoding='utf-8')
print('Tarot Korean labels normalized')
