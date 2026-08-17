from pathlib import Path
import re

app=Path('src/App.jsx')
s=app.read_text()

# Replace PetPointDashboard with a richer live dashboard/history view.
start=s.find('function PetPointDashboard(')
end=s.find('function PetPointPolicyAddendum',start)
if start<0 or end<0:
    raise SystemExit('PetPointDashboard boundaries not found')
new_dashboard=r'''function PetPointDashboard({compact=false}){
  const [d,setD]=useState(null),[toast,setToast]=useState(null),[filter,setFilter]=useState("all"),[refreshing,setRefreshing]=useState(false);
  const toastTimer=React.useRef(null);
  const load=async(silent=false)=>{if(!silent)setRefreshing(true);try{const x=await petPointSummary();setD(x);if(x?.pointEvent?.awarded)setToast({amount:x.pointEvent.awarded,label:x.pointEvent.label,balance:x.pointEvent.balance})}catch{}finally{if(!silent)setRefreshing(false)}};
  useEffect(()=>{load();const h=e=>{const ev=e.detail||{};setToast(ev);setD(v=>v?{...v,balance:ev.balance??v.balance}:v);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),3000);setTimeout(()=>load(true),180)};window.addEventListener("petgrow:points",h);const poll=setInterval(()=>load(true),30000);return()=>{window.removeEventListener("petgrow:points",h);clearInterval(poll);clearTimeout(toastTimer.current)}},[]);
  if(!d)return <div className="petpoint-card petpoint-loading">🐾 PetPoint 확인 중…</div>;
  const recent=Array.isArray(d.recent)?d.recent:[];
  const shown=recent.filter(x=>filter==="all"||(filter==="earn"?Number(x.amount)>0:Number(x.amount)<0));
  const fmtDate=v=>{try{return new Date(v).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return ""}};
  return <section className={`petpoint-card petpoint-dashboard-final ${compact?"compact":""}`}>
    <div className="petpoint-head"><div><small>PETGROW REWARD · 실시간 반영</small><h2>🐾 PetPoint</h2><p>적립·사용 즉시 잔액에 반영되고 최근 이용내역도 여기서 확인할 수 있어요.</p></div><strong>{Number(d.balance||0).toLocaleString()}<em>P</em></strong></div>
    {!compact&&<>
      <div className="petpoint-live-stats"><div><small>현재 보유</small><b>{Number(d.balance||0).toLocaleString()}P</b></div><div className="plus"><small>오늘 적립</small><b>+{Number(d.todayEarned||0).toLocaleString()}P</b></div><div className="minus"><small>오늘 사용</small><b>-{Number(d.todaySpent||0).toLocaleString()}P</b></div><div><small>최근 7일 사용</small><b>-{Number(d.weekSpent||0).toLocaleString()}P</b></div></div>
      <div className="petpoint-costs"><span>🃏 타로 <b>{d.costs?.tarot||30}P</b></span><span>🌤️ 오늘 운세 <b>{d.costs?.saju_daily||20}P</b></span><span>🔮 기본 사주 <b>{d.costs?.saju_basic||50}P</b></span><span>🫶 보호자 궁합 <b>{d.costs?.saju_compat||40}P</b></span></div>
      <details className="petpoint-guide" open><summary>포인트는 어떻게 모아요?</summary><div>{(d.earnGuide||[]).map((x,i)=><p key={i}><b>+{x.points}P</b><span>{x.label}</span><small>{x.limit}</small></p>)}</div></details>
      <div className="petpoint-history-head"><div><b>포인트 이용내역</b><small>최근 20건 · 30초마다 자동 동기화</small></div><button type="button" className="bg-chip" onClick={()=>load()} disabled={refreshing}>{refreshing?"확인 중…":"새로고침"}</button></div>
      <div className="petpoint-history-tabs"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>전체</button><button className={filter==="earn"?"active":""} onClick={()=>setFilter("earn")}>적립</button><button className={filter==="spend"?"active":""} onClick={()=>setFilter("spend")}>사용</button></div>
      <div className="petpoint-history-list">{shown.length?shown.map((x,i)=><div className="petpoint-history-row" key={`${x.created_at||i}-${i}`}><span className={Number(x.amount)>=0?"earn":"spend"}>{Number(x.amount)>=0?"적립":"사용"}</span><div><b>{x.label||"PetPoint"}</b><small>{fmtDate(x.created_at)}</small></div><strong className={Number(x.amount)>=0?"plus":"minus"}>{Number(x.amount)>=0?"+":""}{Number(x.amount||0).toLocaleString()}P</strong></div>):<div className="petpoint-history-empty">아직 표시할 이용내역이 없어요.</div>}</div>
    </>}
    {toast&&<div className={`petpoint-toast ${Number(toast.amount)>=0?"plus":"minus"}`}><b>{Number(toast.amount)>=0?`+${Number(toast.amount).toLocaleString()}P 적립`:`${Number(toast.amount).toLocaleString()}P 사용`}</b><span>{toast.label||"PetPoint"}{toast.balance!=null?` · 잔액 ${Number(toast.balance).toLocaleString()}P`:""}</span></div>}
  </section>
}
'''
s=s[:start]+new_dashboard+s[end:]

# Upgrade the always-visible Home/About card so it updates immediately too.
vs=s.find('function PetPointVisibleCard(')
ve=s.find('function InfoGuidePage()',vs)
if vs>=0 and ve>vs:
    visible=r'''function PetPointVisibleCard({account,compact=false}){
  const [summary,setSummary]=useState(null);
  const load=()=>{if(!account?.id){setSummary(null);return}apiJson('/api/points?action=summary').then(setSummary).catch(()=>{})};
  useEffect(()=>{if(!account?.id){setSummary(null);return};let alive=true;apiJson('/api/points?action=summary').then(j=>{if(alive)setSummary(j)}).catch(()=>{});const h=e=>{const ev=e.detail||{};setSummary(v=>v?{...v,balance:ev.balance??v.balance}:v);setTimeout(()=>{if(alive)load()},180)};window.addEventListener('petgrow:points',h);const poll=setInterval(()=>{if(alive)load()},30000);return()=>{alive=false;clearInterval(poll);window.removeEventListener('petgrow:points',h)}},[account?.id]);
  const balance=summary?.balance;
  return <section className={'petpoint-visible '+(compact?'compact':'about')}><div className="petpoint-visible-icon">🪙</div><div className="petpoint-visible-copy"><small>PETPOINT · LIVE</small><h2>{compact?'현재 PetPoint를 바로 확인하세요':'PetPoint로 PetGrow를 더 재미있게'}</h2><p>{account?.id?(balance==null?'포인트를 불러오는 중이에요.':`현재 ${Number(balance).toLocaleString()}P · 적립과 사용이 바로 반영돼요.`):'처음 로그인하면 300P가 지급돼요. 하루 첫 접속·Pet톡 활동으로 더 모을 수 있어요.'}</p></div><div className="petpoint-visible-actions"><b>{account?.id&&balance!=null?`${Number(balance).toLocaleString()}P`:'시작 300P'}</b><span>타로 30P · 오늘 운세 20P · 기본 사주 50P · 궁합 40P</span></div></section>;
}

'''
    s=s[:vs]+visible+s[ve:]

css='''\n  /* PETPOINT_DASHBOARD_FINAL_20260817 */\n  .petpoint-live-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:15px 0}.petpoint-live-stats>div{padding:13px;border:1px solid #e5eadf;border-radius:14px;background:#fff}.petpoint-live-stats small{display:block;font-size:10px;color:var(--sub)}.petpoint-live-stats b{display:block;margin-top:4px;font-size:17px}.petpoint-live-stats .plus b,.petpoint-history-row strong.plus{color:#2f7a4a}.petpoint-live-stats .minus b,.petpoint-history-row strong.minus{color:#8b6135}.petpoint-history-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:17px;padding-top:15px;border-top:1px solid #e9e5dc}.petpoint-history-head>div b{display:block;font-size:14px}.petpoint-history-head>div small{display:block;margin-top:3px;font-size:9.5px;color:var(--sub)}.petpoint-history-tabs{display:flex;gap:7px;margin:11px 0}.petpoint-history-tabs button{border:1px solid #dde6dc;background:#fff;border-radius:999px;padding:7px 11px;font-size:10px;font-weight:800;cursor:pointer}.petpoint-history-tabs button.active{background:#315f40;color:#fff;border-color:#315f40}.petpoint-history-list{border:1px solid #e6ebe3;border-radius:16px;overflow:hidden;background:#fff}.petpoint-history-row{display:grid;grid-template-columns:45px 1fr auto;gap:10px;align-items:center;padding:12px 13px;border-bottom:1px solid #eef0ec}.petpoint-history-row:last-child{border-bottom:0}.petpoint-history-row>span{display:grid;place-items:center;height:27px;border-radius:999px;font-size:9px;font-weight:900}.petpoint-history-row>span.earn{background:#edf7ef;color:#327148}.petpoint-history-row>span.spend{background:#faf2e8;color:#835e35}.petpoint-history-row>div b{display:block;font-size:11px}.petpoint-history-row>div small{display:block;margin-top:3px;font-size:9px;color:var(--sub)}.petpoint-history-row>strong{font-size:12px;white-space:nowrap}.petpoint-history-empty{text-align:center;padding:22px;font-size:11px;color:var(--sub)}.petpoint-dashboard-final .petpoint-toast{display:flex;flex-direction:column;gap:2px}.petpoint-dashboard-final .petpoint-toast b{font-size:11px}.petpoint-dashboard-final .petpoint-toast span{font-size:9px;opacity:.86}@media(max-width:700px){.petpoint-live-stats{grid-template-columns:1fr 1fr}.petpoint-history-row{grid-template-columns:40px 1fr auto}.petpoint-history-head{align-items:flex-start}.petpoint-history-head button{flex:none}}\n'''
marker='  /* PETGROW_UI_POLISH_20260817 */'
if 'PETPOINT_DASHBOARD_FINAL_20260817' not in s:
    if marker not in s: raise SystemExit('CSS marker missing')
    s=s.replace(marker,css+'\n'+marker,1)

app.write_text(s)

# Server summary aggregates for dashboard cards.
p=Path('server_lib/points.js')
ps=p.read_text()
a=ps.find('export async function getPointSummary(')
b=ps.find('export async function getPointAdminStats',a)
if a<0 or b<0: raise SystemExit('getPointSummary boundaries missing')
summary=r'''export async function getPointSummary(uid,{dailyLogin=true}={}) {
  await ensureAccount(uid);let pointEvent=null;if(dailyLogin){const e=await awardPoints(uid,"daily_login",`daily-login:${kstDate()}`);if(e.awarded)pointEvent=e;}
  const [{rows:b},{rows:l},{rows:stats}]=await Promise.all([
    sql`select balance from pg_point_accounts where user_id=${uid}`,
    sql`select amount,reason,label,created_at from pg_point_ledger where user_id=${uid} order by created_at desc limit 20`,
    sql`select
      coalesce(sum(case when amount>0 and (created_at at time zone 'Asia/Seoul')::date=${kstDate()}::date then amount else 0 end),0)::int as today_earned,
      coalesce(sum(case when amount<0 and (created_at at time zone 'Asia/Seoul')::date=${kstDate()}::date then -amount else 0 end),0)::int as today_spent,
      coalesce(sum(case when amount<0 and created_at>=now()-interval '7 days' then -amount else 0 end),0)::int as week_spent,
      coalesce(sum(case when amount>0 then amount else 0 end),0)::int as total_earned,
      coalesce(sum(case when amount<0 then -amount else 0 end),0)::int as total_spent
      from pg_point_ledger where user_id=${uid}`
  ]);
  const st=stats[0]||{};
  return {balance:Number(b[0]?.balance)||0,startPoints:START_POINTS,costs:POINT_COSTS,recent:l,pointEvent,todayEarned:Number(st.today_earned)||0,todaySpent:Number(st.today_spent)||0,weekSpent:Number(st.week_spent)||0,totalEarned:Number(st.total_earned)||0,totalSpent:Number(st.total_spent)||0,earnGuide:[{label:"Pet톡 글 작성",points:30,limit:"하루 3회"},{label:"Pet톡 댓글 작성",points:10,limit:"하루 10회"},{label:"좋아요 받기",points:3,limit:"하루 30회"},{label:"하루 첫 접속",points:10,limit:"하루 1회"}]};
}
'''
ps=ps[:a]+summary+ps[b:]
p.write_text(ps)

# Sanity checks
for needle in ['PETPOINT_DASHBOARD_FINAL_20260817','포인트 이용내역','30초마다 자동 동기화','todayEarned']:
    if needle not in app.read_text(): raise SystemExit('missing app marker '+needle)
for needle in ['today_earned','week_spent','total_spent']:
    if needle not in p.read_text(): raise SystemExit('missing server marker '+needle)
print('PetPoint final dashboard patch OK')
