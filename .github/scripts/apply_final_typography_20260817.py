from pathlib import Path
import re

p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
orig=s

# Correct the remaining outdated PetPoint guide copy.
s=s.replace('처음 이용하면 기본 300P가 지급돼요.','처음 이용하면 기본 1,000P가 지급돼요.')

# Normalize unusual font weights to a compact product scale.
weight_map={'550':'600','650':'600','750':'700','850':'800','950':'900'}
for old,new in weight_map.items():
    s=re.sub(rf'font-weight\s*:\s*{old}\b', f'font-weight:{new}', s)
    s=re.sub(rf'fontWeight\s*:\s*["\']?{old}["\']?', f'fontWeight:{new}', s)

# Mobile: 16px is retained for form controls to avoid iOS zoom; buttons/chips stay visually balanced.
old='.bboggl-root{font-size:16px;-webkit-text-size-adjust:100%;text-size-adjust:100%}.bg-btn,.bg-chip,.tab-pill,input,textarea,select{font-size:16px}'
new='.bboggl-root{font-size:16px;-webkit-text-size-adjust:100%;text-size-adjust:100%}.bg-btn,.tab-pill{font-size:14px}.bg-chip{font-size:13px}input,textarea,select{font-size:16px}'
if old in s: s=s.replace(old,new)

# Small admin navigation was noticeably undersized on phones.
s=re.sub(r'\.admin-tabs button\{font-size\s*:\s*11px!important\}', '.admin-tabs button{font-size:12px!important}', s)

# Keep secondary album text on the same family as the rest of the product.
s=s.replace("font-family:'Gowun Dodum',sans-serif; font-size:12px;", 'font-family:inherit; font-size:12px;')

# Make browser controls inherit the app font consistently.
marker='/* PETGROW_FINAL_TYPOGRAPHY_20260817 */'
if marker not in s:
    insert='''\n<style>{`\n/* PETGROW_FINAL_TYPOGRAPHY_20260817 */\n.bboggl-root,button,input,textarea,select{font-family:inherit}\n.bboggl-root{font-synthesis:none;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}\nbutton,input,textarea,select{letter-spacing:inherit}\n`}</style>\n'''
    needle='return (\n    <div className="bboggl-root'
    if needle in s:
        s=s.replace(needle,insert+needle,1)

assert '기본 300P' not in s
assert '기본 1,000P' in s
assert not re.search(r'font-weight\s*:\s*(550|650|750|850|950)\b',s)
assert s!=orig
p.write_text(s,encoding='utf-8')
print('final typography consistency patch applied')
