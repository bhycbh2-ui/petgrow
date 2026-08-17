from pathlib import Path
import re
p=Path('src/App.jsx'); s=p.read_text(encoding='utf-8')
component=r'''function PetPointDashboard({compact=false}){
  const [d,setD]=useState(null),[toast,setToast]=useState(null),[helpOpen,setHelpOpen]=useState(false);
  const toastTimer=React.useRef(null);
  const load=async()=>{try{const x=await petPointSummary();setD(x);if(x?.pointEvent?.awarded){setToast({amount:x.pointEvent.awarded,label:x.pointEvent.label,balance:x.pointEvent.balance});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2600)}}catch{}};
  useEffect(()=>{load();const h=e=>{const ev=e.detail||{};setToast(ev);setD(v=>v?{...v,balance:ev.balance??v.balance}:v);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2600);setTimeout(load,180)};window.addEventListener("petgrow:points",h);const poll=setInterval(load,5000);return()=>{window.removeEventListener("petgrow:points",h);clearInterval(poll);clearTimeout(toastTimer.current)}},[]);
  if(!d)return <div className="petpoint-card petpoint-loading">🐾 PetPoint 확인 중…</div>;
  return <section className={`petpoint-card petpoint-dashboard-simple ${compact?"compact":""}`}><button type="button" className="petpoint-help-btn" aria-label="포인트 적립 방법" title="포인트 적립 방법" onClick={()=>setHelpOpen(v=>!v)}>?</button><div className="petpoint-head"><div className="petpoint-balance-wrap"><small>PETPOINT · LIVE</small><h2>현재 포인트</h2></div><strong className="petpoint-big-balance">{Number(d.balance||0).toLocaleString()}<em>P</em></strong></div>{!compact&&<><div className="petpoint-mini-stats"><div className="plus"><small>오늘 적립</small><b>+{Number(d.todayEarned||0).toLocaleString()}P</b></div><div className="minus"><small>오늘 사용</small><b>-{Number(d.todaySpent||0).toLocaleString()}P</b></div></div><div className="petpoint-costs-simple"><span>🌤️ 운세 <b>{d.costs?.saju_daily||20}P</b></span><span>🔮 사주 <b>{d.costs?.saju_basic||50}P</b></span><span>🫶 궁합 <b>{d.costs?.saju_compat||40}P</b></span><span>🃏 타로 <b>{d.costs?.tarot||30}P</b></span></div>{helpOpen&&<div className="petpoint-help-panel"><h3>포인트는 어떻게 모아요?</h3>{(d.earnGuide||[]).map((x,i)=><p key={i}><b>+{x.points}P</b><span>{x.label}</span><small>{x.limit}</small></p>)}</div>}</>}{toast&&<div className={`petpoint-toast ${Number(toast.amount)>=0?"plus":"minus"}`}><b>{Number(toast.amount)>=0?`+${Number(toast.amount).toLocaleString()}P 적립`:`${Number(toast.amount).toLocaleString()}P 사용`}</b><span>{toast.label||"PetPoint"}{toast.balance!=null?` · 잔액 ${Number(toast.balance).toLocaleString()}P`:""}</span></div>}</section>
}
'''
pat=r'function PetPointDashboard\(\{compact=false\}\)\{.*?\n\}\n(?=function PetPointPolicyAddendum)'
s,n=re.subn(pat,component,s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'point component {n}')
s=s.replace('반복 도배·비정상 활동·운영정책 위반 등 부정한 방식으로 적립한 포인트는 지급 취소 또는 회수될 수 있고, 글이나 댓글을 삭제하면 해당 활동으로 적립된 포인트가 회수될 수 있어요.','반복 도배·좋아요 취소 후 재좋아요 등 비정상 활동으로는 중복 적립되지 않으며, 부정 적립은 지급 취소 또는 회수될 수 있어요. 같은 게시글의 댓글 적립과 같은 글·같은 이용자의 좋아요 보상은 최초 1회만 인정돼요.',1)
p.write_text(s,encoding='utf-8'); print('point patch ok')
