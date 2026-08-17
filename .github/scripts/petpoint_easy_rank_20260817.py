from pathlib import Path

p=Path('src/App.jsx')
s=p.read_text(encoding='utf-8')

repls={
    '처음 로그인하면 300P가 지급돼요.':'처음 로그인하면 1,000P가 지급돼요.',
    "'시작 300P'":"'시작 1,000P'",
    '"시작 300P"':'"시작 1,000P"',
    '처음 300P로 시작하고':'처음 1,000P로 시작하고',
    '+30P</b> 글 작성':'+50P</b> 글 작성',
    '+10P</b> 댓글':'+20P</b> 댓글',
    '+3P</b> 좋아요 받기':'+5P</b> 좋아요 받기',
    '+10P</b> 하루 첫 접속':'+30P</b> 하루 첫 접속',
}
for a,b in repls.items(): s=s.replace(a,b)

needle='<div className="petpoint-live-stats"><div><small>현재 보유</small><b>{Number(d.balance||0).toLocaleString()}P</b></div><div className="plus"><small>오늘 적립</small><b>+{Number(d.todayEarned||0).toLocaleString()}P</b></div><div className="minus"><small>오늘 사용</small><b>-{Number(d.todaySpent||0).toLocaleString()}P</b></div><div><small>최근 7일 사용</small><b>-{Number(d.weekSpent||0).toLocaleString()}P</b></div></div>'
rank='''<div className="petpoint-live-stats"><div><small>현재 보유</small><b>{Number(d.balance||0).toLocaleString()}P</b></div><div className="plus"><small>오늘 적립</small><b>+{Number(d.todayEarned||0).toLocaleString()}P</b></div><div className="minus"><small>오늘 사용</small><b>-{Number(d.todaySpent||0).toLocaleString()}P</b></div><div><small>최근 7일 사용</small><b>-{Number(d.weekSpent||0).toLocaleString()}P</b></div></div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,margin:"12px 0 4px",padding:"16px 18px",border:"1px solid #dce9de",borderRadius:18,background:"linear-gradient(135deg,#f3faf4,#fffaf0)",flexWrap:"wrap"}}><div style={{display:"grid",gap:2,minWidth:155}}><small style={{fontSize:10,fontWeight:900,letterSpacing:".1em",color:"#73917a"}}>MY PETPOINT RANK</small><b style={{fontSize:23,color:"#416d4a"}}>상위 {Number(d.topPercent||100)}%</b><span style={{fontSize:11,color:"var(--sub)"}}>전체 {Number(d.memberCount||1).toLocaleString()}명 중 {Number(d.rank||1).toLocaleString()}위</span></div><p style={{margin:0,maxWidth:430,fontSize:12,lineHeight:1.55,color:"var(--sub)"}}>PetGrow 활동으로 포인트를 모을수록 순위가 올라가요. 순위는 현재 보유 포인트 기준으로 계산돼요.</p></div>'''
if needle in s and 'MY PETPOINT RANK' not in s:
    s=s.replace(needle,rank,1)

if 'MY PETPOINT RANK' not in s:
    raise SystemExit('rank UI insertion failed')
if '1,000P' not in s:
    raise SystemExit('1000P UI text missing')
p.write_text(s,encoding='utf-8')
print('PetPoint easy earning/rank UI patched')