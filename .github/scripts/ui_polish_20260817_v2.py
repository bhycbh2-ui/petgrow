from pathlib import Path
import runpy

# Apply the main patch first.
runpy.run_path('.github/scripts/ui_polish_20260817.py', run_name='__main__')

# The main patch intentionally targets GlobalStyle; move the injected CSS
# inside the existing template literal before its closing `}.
p=Path('src/App.jsx')
s=p.read_text()
marker='/* PETGROW_UI_POLISH_20260817 */'
idx=s.find(marker)
if idx<0:
    raise SystemExit('UI polish marker missing')
close=s.find('</style>',idx)
if close<0:
    raise SystemExit('style closing tag missing')
backtick=s.rfind('`}',0,idx)
if backtick<0:
    raise SystemExit('GlobalStyle template closing marker missing')
css=s[idx:close].rstrip()
between=s[backtick:idx]
# Avoid moving twice if marker is already inside the template.
if backtick < idx:
    s=s[:backtick]+css+'\n  '+between+s[close:]
p.write_text(s)

# Final sanity check: the CSS marker must occur before the closing `}.
s=p.read_text(); idx=s.find(marker); backtick_after=s.find('`}',idx)
if idx<0 or backtick_after<0:
    raise SystemExit('CSS injection repair failed')
print('CSS injection repaired OK')
