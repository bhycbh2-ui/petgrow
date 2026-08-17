from pathlib import Path
import re

app=Path('src/App.jsx')
s=app.read_text(encoding='utf-8')

# 1) Remove the stray MenuHelpCoach tail that is visibly rendered under the admin/login area.
s=s.replace('\nonClose={() => setMenuHelpOpen(false)}\n        />\n      )}\n', '\n', 1)
s=s.replace('onClose=/> )}', '')
s=re.sub(r'\n\s*onClose\s*=\{\(\)\s*=>\s*setMenuHelpOpen\(false\)\}\s*\n\s*/>\s*\n\s*\)\}\s*', '\n', s, count=1)

# 2) PetTalk navigation: normalize every old alias to the actual community route.
s=s.replace('const goView = (v) => { setView(v); scrollToTop(); };', 'const goView = (v) => { const next=(v==="talk"||v==="pettalk"||v==="pet-talk")?"community":v; setView(next); scrollToTop(); };', 1)
s=s.replace('goView("pettalk")','goView("community")').replace('goView("talk")','goView("community")').replace('goView("pet-talk")','goView("community")')
s=s.replace('setView("pettalk")','setView("community")').replace('setView("talk")','setView("community")').replace('setView("pet-talk")','setView("community")')

# Make the PetTalk boundary reset cleanly whenever the user/account changes.
s=s.replace('<PetTalkErrorBoundary><CommunityPage allPets={allPets} account={account}', '<PetTalkErrorBoundary key={`pettalk-${account?.id||"guest"}`}><CommunityPage allPets={allPets} account={account}', 1)

# 3) PetMusic: never persist an empty response into the browser cache.
s=s.replace('try{const next=await musicList(sp,pg);musicCacheRef.current.set(key,next);setData(next)}catch(e){console.error(e);setData({items:[],top5:[],pages:1,total:0})}finally{setLoading(false)}', 'try{const next=await musicList(sp,pg);if((next?.items||[]).length||Number(next?.total||0)>0)musicCacheRef.current.set(key,next);else musicCacheRef.current.delete(key);setData(next)}catch(e){console.error(e);musicCacheRef.current.delete(key);setData({items:[],top5:[],pages:1,total:0})}finally{setLoading(false)}', 1)

# Make cover replacement wording explicit in admin UI.
s=s.replace('커버 이미지 {editing?"(새 사진을 선택하면 교체)":""}', '커버/로고 이미지 {editing?"(새 사진을 선택하면 바로 교체)":""}', 1)
s=s.replace('정사각형 이미지 권장 · JPG/PNG/WebP', '정사각형 이미지 권장 · JPG/PNG/WebP · 기존 음악도 수정에서 교체 가능', 1)

# 4) About/introduction cards: find the grid immediately after the visible heading and make it a clean 2-column x 5-row layout.
heading='우리 아이와 함께하는 모든 순간'
idx=s.find(heading)
if idx!=-1 and 'petgrow-intro-ten-grid' not in s[idx:idx+8000]:
    pos=idx
    for _ in range(30):
        d=s.find('<div',pos)
        if d==-1 or d>idx+8000: break
        end=s.find('>',d)
        if end==-1: break
        tag=s[d:end+1]
        if 'display: "grid"' in tag or 'display:"grid"' in tag or 'grid' in tag.lower():
            if 'className=' in tag:
                tag2=re.sub(r'className="([^"]*)"', lambda m:f'className="{m.group(1)} petgrow-intro-ten-grid"', tag, count=1)
            else:
                tag2=tag[:-1]+' className="petgrow-intro-ten-grid">'
            s=s[:d]+tag2+s[end+1:]
            break
        pos=end+1

# Global CSS overrides for intro cards and stable PetTalk stage.
anchor='  /* ===== 내 주변 Pet ===== */'
css='''  /* PETGROW_UI_FIX_V8_20260817 */\n  .petgrow-intro-ten-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important;max-width:1040px!important;margin-left:auto!important;margin-right:auto!important}\n  .petgrow-intro-ten-grid>*{min-height:190px!important;padding:24px!important}\n  .petgrow-intro-ten-grid strong,.petgrow-intro-ten-grid h3,.petgrow-intro-ten-grid b{font-size:17px!important}.petgrow-intro-ten-grid p,.petgrow-intro-ten-grid small,.petgrow-intro-ten-grid span{line-height:1.65}\n  .pettalk-safe-fallback,.legal-page-shell:has(.cm-search-actions){min-height:420px!important}\n  @media(max-width:700px){.petgrow-intro-ten-grid{grid-template-columns:1fr!important;gap:11px!important}.petgrow-intro-ten-grid>*{min-height:150px!important;padding:18px!important}}\n'''
if 'PETGROW_UI_FIX_V8_20260817' not in s and anchor in s:
    s=s.replace(anchor,css+anchor,1)

app.write_text(s,encoding='utf-8')

# 5) Repair PetMusic API: the previous warm-cache wrapper was left syntactically incomplete,
# causing /api/music to fail at runtime even though the frontend build succeeded.
music=Path('api/music.js')
m=music.read_text(encoding='utf-8')
m=m.replace('let starterTracksReadyPromise=null;\nasync function ensureStarterTracks(){\n  if(starterTracksReadyPromise) return starterTracksReadyPromise;\n  starterTracksReadyPromise=(async()=>{\n', 'async function ensureStarterTracks(){\n', 1)
m=m.replace('  const {rows:meta}=await sql`select value from pg_app_meta where key=${seedKey} limit 1`;\n  if(meta[0]) return;\n', '  const {rows:meta}=await sql`select value from pg_app_meta where key=${seedKey} limit 1`;\n  const {rows:existing}=await sql`select count(*)::int n from pg_music_tracks where active=true`;\n  if(meta[0] && Number(existing?.[0]?.n||0)>=16) return;\n', 1)
# Ensure cover replacement keeps working even when Blob is not configured.
old='if(body.coverDataUrl){const f=parseDataUrl(body.coverDataUrl,IMAGE_MIME,MAX_COVER_BYTES);const ext=f.mime.includes("png")?"png":f.mime.includes("webp")?"webp":"jpg";const b=await put(`petmusic/covers/${id}-${Date.now()}.${ext}`,f.buffer,{access:"public",contentType:f.mime,token:process.env.BLOB_READ_WRITE_TOKEN});coverUrl=b.url;}'
new='if(body.coverDataUrl){const f=parseDataUrl(body.coverDataUrl,IMAGE_MIME,MAX_COVER_BYTES);if(process.env.BLOB_READ_WRITE_TOKEN){const ext=f.mime.includes("png")?"png":f.mime.includes("webp")?"webp":"jpg";const b=await put(`petmusic/covers/${id}-${Date.now()}.${ext}`,f.buffer,{access:"public",contentType:f.mime,token:process.env.BLOB_READ_WRITE_TOKEN});coverUrl=b.url;}else{coverUrl=String(body.coverDataUrl);}}'
m=m.replace(old,new)
music.write_text(m,encoding='utf-8')

# 6) PetNews: do not spend the whole Hobby-function budget crawling article pages for images.
# Return relevant RSS/API articles immediately; cards can render without a representative image.
news=Path('api/news.js')
n=news.read_text(encoding='utf-8')
old_prepare='async function prepare(raw){let normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));normalized=await enrichArticleImages(normalized);normalized=normalized.filter(item=>/^https?:\\/\\//i.test(item.image||""));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);return(recent.length>=12?recent:normalized).slice(0,40);}'
new_prepare='async function prepare(raw){const normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);return(recent.length>=12?recent:normalized).slice(0,40);}'
n=n.replace(old_prepare,new_prepare,1)
n=n.replace('message:items.length?"":"대표이미지가 확인된 새 기사를 찾고 있어요. 잠시 후 다시 확인해 주세요."','message:items.length?"":"새 반려동물 뉴스를 찾고 있어요. 잠시 후 다시 확인해 주세요."')
news.write_text(n,encoding='utf-8')

# 7) Tarot: slower guided sequence + PetSaju-like large one-row menu cards.
tar=Path('src/PetDailyWidgets.jsx')
t=tar.read_text(encoding='utf-8')
t=t.replace('window.setTimeout(()=>setPhase("focus"),650);window.setTimeout(()=>setPhase("shuffle"),1350);window.setTimeout(()=>setPhase("choose"),2200);', 'window.setTimeout(()=>setPhase("focus"),1100);window.setTimeout(()=>setPhase("shuffle"),2400);window.setTimeout(()=>setPhase("choose"),4300);', 1)
t=t.replace('setPhase("reveal");window.setTimeout(()=>setPhase("result"),1150)},360)', 'setPhase("reveal");window.setTimeout(()=>setPhase("result"),1800)},700)', 1)
marker='/* PET_TAROT_SEQUENCE_V7 */'
tarcss='''/* PET_TAROT_MENU_SLOW_V8 */\n.pet-tarot-topic-grid{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;max-width:760px!important;margin:18px auto 0!important}.pet-tarot-topic{min-height:104px!important;padding:20px 22px!important;border-radius:22px!important;display:flex!important;align-items:center!important;gap:17px!important;text-align:left!important;background:#f3f7f3!important;border:1px solid #e1e9e2!important}.pet-tarot-topic>span{font-size:34px!important;flex:0 0 44px!important}.pet-tarot-topic>div{min-width:0!important}.pet-tarot-topic b{font-size:17px!important;display:block!important;margin-bottom:5px!important}.pet-tarot-topic small{font-size:13px!important;line-height:1.55!important}.pet-tarot-topic em{display:block!important;margin-top:7px!important;font-size:11px!important;color:#4f8a5b!important;font-style:normal!important;font-weight:800!important}.pet-tarot-topic:hover{transform:translateY(-1px)!important;box-shadow:0 10px 24px rgba(45,75,55,.07)!important}.pet-tarot-guide-step,.pet-tarot-shuffle-scene{transition:opacity .4s ease!important}@media(max-width:680px){.pet-tarot-topic{min-height:96px!important;padding:17px!important;gap:13px!important}.pet-tarot-topic>span{font-size:30px!important;flex-basis:38px!important}.pet-tarot-topic b{font-size:16px!important}.pet-tarot-topic small{font-size:12px!important}}\n'''
if 'PET_TAROT_MENU_SLOW_V8' not in t:
    if marker in t:t=t.replace(marker,tarcss+'\n'+marker,1)
    else:t+='\n'+tarcss

tar.write_text(t,encoding='utf-8')

print('PetGrow UI/API fix v8 applied')
