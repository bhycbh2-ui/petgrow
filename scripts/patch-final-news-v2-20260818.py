from pathlib import Path
src=Path('scripts/patch-final-news-20260818.py').read_text(encoding='utf-8')
old="s,n=re.subn(pat,news,s,count=1,flags=re.S)"
new="s,n=re.subn(pat,lambda _m:news,s,count=1,flags=re.S)"
if old not in src: raise SystemExit('news patch wrapper target missing')
exec(compile(src.replace(old,new,1),'patch-final-news-v2','exec'))
