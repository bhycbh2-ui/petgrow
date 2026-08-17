from pathlib import Path
import runpy
p=Path('src/PetDailyWidgets.jsx')
s=p.read_text(encoding='utf-8')
s=s.replace('<small className="pet-daily-eyebrow">{lang==="en"?"PETGROW TAROT · 22 MAJOR ARCANA":"PETGROW TAROT · 메이저 아르카나 22장"}</small><h2>🃏 {petName}{lang==="en"?"\'s Tarot":"의 Pet타로"}</h2>','<small className="pet-daily-eyebrow">PETGROW TAROT · 22 MAJOR ARCANA</small><h2>🃏 {petName}{lang==="en"?"\'s Tarot":"의 Pet타로"}</h2>')
s=s.replace('<div className="pet-tarot-title"><b>{lang==="en"?(result.en||result.name):result.name}</b>{lang==="en"&&result.name&&<small>{result.name}</small>}</div>','<div className="pet-tarot-title"><b>{result.name}</b><small>{result.en}</small></div>')
p.write_text(s,encoding='utf-8')
runpy.run_path('scripts/apply-petgrow-final-bundle.py',run_name='__main__')
