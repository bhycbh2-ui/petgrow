let started=false;
let loading=false;
let lastLoad=0;

function installStyle(){
  if(document.getElementById("petgrow-admin-server-health-style"))return;
  const s=document.createElement("style");s.id="petgrow-admin-server-health-style";
  s.textContent=`#petgrow-admin-server-health{margin:14px 0;padding:14px;border:1px solid #dce8df;border-radius:18px;background:linear-gradient(145deg,#fff,#f6faf7);box-shadow:0 7px 22px rgba(33,73,50,.06)}#petgrow-admin-server-health .pg-ash-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:10px}#petgrow-admin-server-health .pg-ash-head b{font-size:15px;color:#284b39}#petgrow-admin-server-health .pg-ash-head small{font-size:10px;color:#7b8d82}#petgrow-admin-server-health .pg-ash-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}#petgrow-admin-server-health .pg-ash-metric{padding:10px 7px;border-radius:13px;background:#edf5ef;text-align:center;color:#6d7d73;font-size:9px;line-height:1.3;min-width:0}#petgrow-admin-server-health .pg-ash-metric strong{display:block;margin-bottom:3px;color:#28543f;font-size:15px;font-variant-numeric:tabular-nums}#petgrow-admin-server-health .pg-ash-foot{margin-top:9px;padding-top:9px;border-top:1px solid #e3ebe5;display:flex;gap:8px;flex-wrap:wrap;font-size:10px;color:#65766c}#petgrow-admin-server-health .ok{color:#287048;font-weight:800}#petgrow-admin-server-health .warn{color:#9b6419;font-weight:800}@media(max-width:600px){#petgrow-admin-server-health .pg-ash-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
  document.head.append(s);
}
function findHost(){
  const heading=[...document.querySelectorAll("h1,h2,h3,b,strong")].find(el=>/관리자\s*센터/.test(String(el.textContent||"")));
  if(!heading)return null;
  return heading.closest("section,.panel,.admin-page,.admin-home")||heading.parentElement?.parentElement||heading.parentElement;
}
function ensureBox(){
  const host=findHost();if(!host)return null;
  let box=document.getElementById("petgrow-admin-server-health");
  if(box)return box;
  box=document.createElement("section");box.id="petgrow-admin-server-health";box.setAttribute("aria-label","PetGrow 서버 운영 상태");
  const anchor=host.querySelector("h1,h2,h3")?.parentElement||host.firstElementChild;
  anchor?.after?.(box);if(!box.isConnected)host.prepend(box);
  return box;
}
async function fetchJson(url){
  const r=await fetch(url,{credentials:"same-origin"});
  if(r.status===401||r.status===403)return null;
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||String(r.status));return j;
}
function metric(label,value){return `<div class="pg-ash-metric"><strong>${value??"-"}</strong>${label}</div>`;}
async function refresh(force=false){
  const box=ensureBox();if(!box||loading)return;
  if(!force&&Date.now()-lastLoad<60000)return;
  loading=true;lastLoad=Date.now();
  try{
    const [overview,health]=await Promise.all([fetchJson("/api/admin-overview-lite"),fetchJson("/api/admin-data-health")]);
    if(!overview){box.remove();return;}
    const p=overview.petLife||{},m=overview.moderation||{},storage=health?.storage||{},backup=health?.backup||{};
    box.innerHTML=`<div class="pg-ash-head"><b>서버 운영 상태</b><small>PetLife · 푸시 · 백업 · 모더레이션</small></div><div class="pg-ash-grid">${metric("30일 PetLife 사용자",p.activeUsers30d)}${metric("30일 기록",p.records30d)}${metric("푸시 성공률",p.pushSuccessRate30d==null?"-":`${p.pushSuccessRate30d}%`)}${metric("미처리 신고",m.totalOpen)}${metric("활성 푸시 기기",p.activePushDevices)}${metric("7일 내 일정",p.upcoming7d)}${metric("월간 리포트",p.monthlyReports)}${metric("Blob 고아 후보",storage.orphanCandidateCount??"-")}</div><div class="pg-ash-foot"><span class="${p.pushConfigured?"ok":"warn"}">FCM ${p.pushConfigured?"연결됨":"설정 필요"}</span><span class="${backup.configured?"ok":"warn"}">암호화 백업 ${backup.configured?"활성":"설정 필요"}</span><span>최근 백업 ${backup.lastBackup?.uploadedAt?new Date(backup.lastBackup.uploadedAt).toLocaleString("ko-KR"):"-"}</span><span class="${(storage.missingReferenceCount||0)===0?"ok":"warn"}">누락 Blob 참조 ${storage.missingReferenceCount??"-"}</span></div>`;
  }catch(e){box.innerHTML='<div class="pg-ash-head"><b>서버 운영 상태</b><small class="warn">상태 조회 실패</small></div>';console.warn("PetGrow admin server health",e?.message||e);}finally{loading=false;}
}
export function bootAdminServerHealth(){
  if(started)return;started=true;installStyle();
  const observer=new MutationObserver(()=>{if(findHost())refresh();});observer.observe(document.documentElement,{childList:true,subtree:true});
  window.setTimeout(()=>refresh(true),5000);
  window.setInterval(()=>{if(document.visibilityState==="visible"&&findHost())refresh(true);},120000);
}
bootAdminServerHealth();
