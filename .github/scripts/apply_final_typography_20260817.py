from pathlib import Path

p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
orig=s

# Correct the remaining outdated PetPoint guide copy.
s=s.replace('처음 이용하면 기본 300P가 지급돼요.','처음 이용하면 기본 1,000P가 지급돼요.')

# Normalize non-standard font weights to a small, predictable scale.
repls={
 'font-weight:550!important':'font-weight:600!important',
 'font-weight:550;':'font-weight:600;',
 'font-weight:650!important':'font-weight:600!important',
 'font-weight:650;':'font-weight:600;',
 'font-weight:750!important':'font-weight:700!important',
 'font-weight:750;':'font-weight:700;',
 'font-weight:850!important':'font-weight:800!important',
 'font-weight:850;':'font-weight:800;',
 'font-weight:950!important':'font-weight:900!important',
 'font-weight:950;':'font-weight:900;',
 'fontWeight:550':'fontWeight:600',
 'fontWeight:650':'fontWeight:600',
 'fontWeight:750':'fontWeight:700',
 'fontWeight:850':'fontWeight:800',
 'fontWeight:950':'fontWeight:900',
}
for a,b in repls.items(): s=s.replace(a,b)

# Mobile: keep 16px only for form fields (prevents iOS zoom), while buttons/chips follow the UI scale.
old='.bboggl-root{font-size:16px;-webkit-text-size-adjust:100%;text-size-adjust:100%}.bg-btn,.bg-chip,.tab-pill,input,textarea,select{font-size:16px}'
new='.bboggl-root{font-size:16px;-webkit-text-size-adjust:100%;text-size-adjust:100%}.bg-btn,.tab-pill{font-size:14px}.bg-chip{font-size:13px}input,textarea,select{font-size:16px}'
if old in s: s=s.replace(old,new)

# Small admin navigation was noticeably undersized on phones.
s=s.replace('.admin-tabs button{font-size:11px!important}', '.admin-tabs button{font-size:12px!important}')

# Keep secondary album text on the same family as the rest of the product.
s=s.replace("font-family:'Gowun Dodum',sans-serif; font-size:12px;", 'font-family:inherit; font-size:12px;')

# Ensure controls consistently inherit the product font even when browser defaults differ.
marker='/* PETGROW_FINAL_TYPOGRAPHY_20260817 */'
if marker not in s:
    insert='''\n<style>{`\n/* PETGROW_FINAL_TYPOGRAPHY_20260817 */\n.bboggl-root,button,input,textarea,select{font-family:inherit}\n.bboggl-root{font-synthesis:none;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}\nbutton,input,textarea,select{letter-spacing:inherit}\n`}</style>\n'''
    # Insert once immediately before the main app return marker if present; otherwise append is unsafe.
    needle='return (\n    <div className="bboggl-root'
    if needle in s:
        s=s.replace(needle,insert+needle,1)

assert '기본 300P' not in s
assert '기본 1,000P' in s
assert 'font-weight:850' not in s
assert 'font-weight:950' not in s
assert s!=orig
p.write_text(s,encoding='utf-8')
print('final typography consistency patch applied')
