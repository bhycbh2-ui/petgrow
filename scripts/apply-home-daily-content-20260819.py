from pathlib import Path
import re

p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')
MARK='HOME_DAILY_CONTENT_20260819'
if MARK in s:
    print('already applied')
    raise SystemExit(0)

home=s.index('function HomePage({ account, pets = [], lang, onGoPets, onGoView }) {')
ret=s.index('  return (', home)

logic=r'''  /* HOME_DAILY_CONTENT_20260819 */
  const [homeMusicTop5,setHomeMusicTop5]=useState([]);
  const [homePlayingId,setHomePlayingId]=useState("");
  const [homeLatestNews,setHomeLatestNews]=useState([]);
  const homeAudioRef=useRef(null);
  const homeTodayKey=new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10);
  const homeTipDay=Math.floor(Date.parse(homeTodayKey+'T00:00:00Z')/86400000);
  const homeRecommendedTips=useMemo(()=>{
    const list=Array.isArray(TIPS_DATA)?TIPS_DATA:[];
    if(!list.length)return [];
    const offsets=[0,7,19];
    return offsets.map((n,i)=>list[(homeTipDay*3+n+i)%list.length]).filter(Boolean);
  },[homeTipDay]);
  useEffect(()=>{
    let cancelled=false;
    fetch('/api/music?action=list&species=all&page=1').then(r=>r.ok?r.json():null).then(j=>{if(!cancelled)setHomeMusicTop5(Array.isArray(j?.top5)?j.top5.slice(0,5):[])}).catch(()=>{});
    fetch('/api/news').then(r=>r.ok?r.json():null).then(j=>{if(cancelled)return;const items=Array.isArray(j?.items)?j.items:[];setHomeLatestNews([...items].sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0)).slice(0,3));}).catch(()=>{});
    return()=>{cancelled=true;if(homeAudioRef.current){homeAudioRef.current.pause();homeAudioRef.current=null;}};
  },[]);
  const playHomeTrack=(track)=>{
    const src=track?.audio_url||track?.audioUrl||track?.audio||'';
    if(!src)return onGoView('music');
    if(homeAudioRef.current&&homePlayingId===track.id){homeAudioRef.current.pause();homeAudioRef.current=null;setHomePlayingId('');return;}
    if(homeAudioRef.current)homeAudioRef.current.pause();
    const audio=new Audio(src);homeAudioRef.current=audio;setHomePlayingId(track.id);
    audio.onended=()=>{homeAudioRef.current=null;setHomePlayingId('')};
    audio.onerror=()=>{homeAudioRef.current=null;setHomePlayingId('');onGoView('music')};
    audio.play().then(()=>fetch('/api/music?action=play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:track.id})}).catch(()=>{})).catch(()=>{setHomePlayingId('');onGoView('music')});
  };
'''
s=s[:ret]+logic+s[ret:]

# Remove the older standalone important-news block; the new section below replaces it.
pattern=r'''\n\s*\{homeNews\.length>0&&<section className="dash-section">.*?</section>\}\n'''
s,n=re.subn(pattern,'\n',s,count=1,flags=re.S)
if n!=1:
    raise RuntimeError('old homeNews block not found')

anchor='      <section className="dash-widget-grid">'
if anchor not in s[home:]:
    raise RuntimeError('home widget grid anchor not found')

sections=r'''      <section className="dash-section home-live-section">
        <div className="dash-section-head"><div><small style={{fontWeight:900,color:'var(--primary)'}}>TODAY PICK</small><h2>{lang==='en'?"Today's Pet Info":"오늘의 Pet정보 추천 3개"}</h2></div><button type="button" className="bg-chip" onClick={()=>onGoView('tips')}>{lang==='en'?'View all':'전체보기 →'}</button></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>{homeRecommendedTips.map(tip=><button type="button" key={tip.id} className="bg-card" onClick={()=>onGoView('tips')} style={{padding:'17px 18px',textAlign:'left',border:'1px solid var(--border)',cursor:'pointer',minHeight:126}}><small style={{fontWeight:900,color:'var(--primary)'}}>💡 {t.tipCategoryLabels?.[tip.category]||tip.category||'Pet정보'}</small><div style={{fontWeight:850,fontSize:15,lineHeight:1.45,margin:'7px 0 5px'}}>{tip.title?.[lang]||tip.title?.ko||tip.title}</div><div className="bg-sub" style={{fontSize:12,lineHeight:1.55}}>{tip.summary?.[lang]||tip.summary?.ko||''}</div></button>)}</div>
      </section>

      {homeMusicTop5.length>0&&<section className="dash-section home-live-section">
        <div className="dash-section-head"><div><small style={{fontWeight:900,color:'var(--primary)'}}>PET MUSIC CHART</small><h2>{lang==='en'?'Popular Pet Music TOP 5':'인기 Pet음악 TOP 5'}</h2></div><button type="button" className="bg-chip" onClick={()=>onGoView('music')}>{lang==='en'?'View all':'전체보기 →'}</button></div>
        <div style={{display:'grid',gap:9}}>{homeMusicTop5.map((track,i)=><div key={track.id} className="bg-card" style={{display:'grid',gridTemplateColumns:'34px 48px minmax(0,1fr) auto',gap:10,alignItems:'center',padding:'10px 12px',border:'1px solid var(--border)'}}><b style={{fontSize:17,textAlign:'center'}}>{i+1}</b><button type="button" onClick={()=>playHomeTrack(track)} aria-label={homePlayingId===track.id?'일시정지':'재생'} style={{width:42,height:42,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:17}}>{homePlayingId===track.id?'❚❚':'▶'}</button><button type="button" onClick={()=>onGoView('music')} style={{border:0,background:'transparent',textAlign:'left',padding:0,cursor:'pointer',minWidth:0}}><div style={{fontWeight:850,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{track.title}</div><small className="bg-sub">▶ {Number(track.play_count||0).toLocaleString()} · ♥ {Number(track.like_count||0).toLocaleString()}</small></button><span style={{fontSize:18,color:'var(--muted)'}}>›</span></div>)}</div>
      </section>}

      {homeLatestNews.length>0&&<section className="dash-section home-live-section">
        <div className="dash-section-head"><div><small style={{fontWeight:900,color:'var(--primary)'}}>PET NEWS</small><h2>{lang==='en'?'Latest Pet News':'최신 Pet뉴스'}</h2></div><button type="button" className="bg-chip" onClick={()=>onGoView('news')}>{lang==='en'?'View all':'전체보기 →'}</button></div>
        <div style={{display:'grid',gap:10}}>{homeLatestNews.map(n=><button key={n.id} type="button" className="bg-card" onClick={()=>onGoView('news')} style={{padding:'15px 16px',textAlign:'left',border:'1px solid var(--border)',cursor:'pointer'}}><small style={{fontWeight:800,color:'var(--primary)'}}>{n.category||'Pet뉴스'} · {n.source||''}</small><div style={{fontWeight:800,fontSize:15,lineHeight:1.5,marginTop:5}}>{n.title}</div><small className="bg-sub">{n.publishedAt?new Date(n.publishedAt).toLocaleDateString(lang==='en'?'en-US':'ko-KR'):''}</small></button>)}</div>
      </section>}

'''
pos=s.index(anchor,home)
s=s[:pos]+sections+s[pos:]

p.write_text(s,encoding='utf-8')
print('Home daily PetInfo, playable music TOP5 and latest PetNews sections applied')
