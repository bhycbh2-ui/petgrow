from pathlib import Path
import re, collections

files=['src/App.jsx','src/PetDailyWidgets.jsx']
for f in files:
    s=Path(f).read_text(encoding='utf-8')
    print('\nFILE',f,'chars',len(s))
    vals=re.findall(r'fontSize\s*:\s*["\']?([^,"\'}]+)',s)
    print('fontSize inline top:',collections.Counter(v.strip() for v in vals).most_common(30))
    weights=re.findall(r'fontWeight\s*:\s*["\']?([^,"\'}]+)',s)
    print('fontWeight inline:',collections.Counter(v.strip() for v in weights).most_common(20))
    css_sizes=re.findall(r'font-size\s*:\s*([^;}]+)',s)
    print('css font-size top:',collections.Counter(v.strip() for v in css_sizes).most_common(30))
    css_weights=re.findall(r'font-weight\s*:\s*([^;}]+)',s)
    print('css font-weight:',collections.Counter(v.strip() for v in css_weights).most_common(20))

s=Path('src/App.jsx').read_text(encoding='utf-8')
for term in ['기본 300P','300P','InfoGuidePage','AboutPage','HomePage','Admin','PetTalk','Pet톡','오늘의 우리 아이','타로','font-size:11px','font-size:12px','font-size:13px','font-size:14px','font-size:15px','font-size:16px']:
    print('\nTERM',term)
    hits=[(i+1,line[:260]) for i,line in enumerate(s.splitlines()) if term in line]
    for x in hits[:40]: print(x)
    print('COUNT',len(hits))
