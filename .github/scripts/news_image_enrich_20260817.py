from pathlib import Path
p=Path('api/news.js')
s=p.read_text(encoding='utf-8')
old='async function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);return(recent.length>=12?recent:normalized).slice(0,40);}'
new='async function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);const base=(recent.length>=12?recent:normalized).slice(0,40);const enriched=await enrichArticleImages(base);return base.map((item,i)=>enriched[i]||item);}'
if old not in s:
    raise SystemExit('prepare() target not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
assert 'const enriched=await enrichArticleImages(base)' in s
print('PetNews article image enrichment enabled')
