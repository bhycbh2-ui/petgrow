let started=false;
let loading=false;
let backupRunning=false;
let lastLoad=0;

function installStyle(){
  if(document.getElementById("petgrow-admin-server-health-style"))return;
  const s=document.createElement("style");s.id="petgrow-admin-server-health-style";
  s.textContent=`#petgrow-admin-server-health{margin:14px 0;padding:14px;border:1px solid #dce8df;border-radius:18px;background:linear-gradient(145deg,#fff,#f6faf7);box-shadow:0 7px 22px rgba(33,73,50,.06)}#petgrow-admin-server-health .pg-ash-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:10px}#petgrow-admin-server-health .pg-ash-head b{font-size:15px;color:#284b39}#petgrow-admin-server-health .pg-ash-head small{font-size:10px;color:#7b8d82}#petgrow-admin-server-health .pg-ash-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}#petgrow-admin-server-health .pg-ash-metric{padding:10px 7px;border-radius:13px;background:#edf5ef;text-align:center;color:#6d7d73;font-size:9px;line-height:1.3;min-width:0}#petgrow-admin-server-health .pg-ash-metric strong{display:block;margin-bottom:3px;color:#28543f;font-size:15px;font-variant-numeric:tabular-nums}#petgrow-admin-server-health .pg-ash-foot{margin-top:9px;padding-top:9px;border-top:1px solid #e3ebe5;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:10px;color:#65766c}#petgrow-admin-server-health .ok{color:#287048;font-weight:800}#petgrow-admin-server-health .warn{color:#9b6419;font-weight:800}#petgrow-admin-server-health .bad{color:#ad3e3e;font-weight:800}#petgrow-admin-server-health .pg-ash-action{margin-left:auto;border:1px solid #c9ddd0;background:#fff;color:#28543f;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}#petgrow-admin-server-health .pg-ash-action:disabled{opacity:.5;cursor:wait}#petgrow-admin-server-health .pg-ash-msg{width:100%;font-size:10px;color:#65766c}@media(max-width:600px){#petgrow-admin-server-health .pg-ash-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#petgrow-admin-server-health .pg-ash-action{margin-left:0;width:100%}}`;
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
async function requestJson(url,options={}){
  const r=await fetch(url,{credentials:"same-origin",...options});
  if(r.status===401||r.status===403)return null;
  const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||j.reason||String(r.status));e.payload=j;throw e;}return j;
}
function metric(label,value){return `<div class="pg-ash-metric"><strong>${value??"-"}</strong>${label}</div>`;}
function backupLabel(backup){
  if(backup.configured)return backup.overdue?"지연":"활성";
  if(backup.reason==="BACKUP_KEY_TOO_SHORT")return "키 보강 필요";
  if(backup.reason==="BLOB_NOT_CONFIGURED")return "Blob 설정 필요";
  return "설정 필요";
}
function backupClass(backup){return backup.configured?(backup.overdue?"warn":"ok"):"bad";}
async function runBackup(){
  if(backupRunning)return;
  const box=ensureBox();if(!box)return;
  const button=box.querySelector("#pg-run-backup");const msg=box.querySelector(".pg-ash-msg");
  backupRunning=true;if(button){button.disabled=true;button.textContent="백업 실행 중…";}if(msg)msg.textContent="암호화 백업을 생성하고 보존기간을 점검하고 있어요.";
  try{
    const result=await requestJson("/api/admin-backup-run",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
    if(!result)return;
    if(msg)msg.textContent=result.skipped?"최근 백업이 있어 중복 생성을 건너뛰었어요.":"암호화 백업이 정상 생성됐어요.";
    lastLoad=0;window.setTimeout(()=>refresh(true),600);
  }catch(e){if(msg)msg.textContent=e?.payload?.reason==="BACKUP_KEY_TOO_SHORT"?"백업 암호화 키를 32자 이상으로 설정해 주세요.":"백업 실행에 실패했어요. 서버 설정을 확인해 주세요.";}
  finally{backupRunning=false;if(button){button.disabled=false;button.textContent="지금 백업";}}
}
async function refresh(force=false){
  const box=ensureBox();if(!box||loading)return;
  if(!force&&Date.now()-lastLoad<60000)return;
  loading=true;lastLoad=Date.now();
  try{
    const [overview,health]=await Promise.all([requestJson("/api/admin-overview-lite"),requestJson("/api/admin-data-health")]);
    if(!overview){box.remove();return;}
    const p=overview.petLife||{},m=overview.moderation||{},storage=health?.storage||{},backup=health?.backup||{};
    const lastBackup=backup.lastBackup?.uploadedAt?new Date(backup.lastBackup.uploadedAt).toLocaleString("ko-KR"):"-";
    const age=backup.lastBackupAgeHours==null?"":` · ${backup.lastBackupAgeHours}시간 전`;
    box.innerHTML=`<div class="pg-ash-head"><b>서버 운영 상태</b><small>PetLife · 푸시 · 백업 · 모더레이션</small></div><div class="pg-ash-grid">${metric("30일 PetLife 사용자",p.activeUsers30d)}${metric("30일 기록",p.records30d)}${metric("푸시 성공률",p.pushSuccessRate30d==null?"-":`${p.pushSuccessRate30d}%`)}${metric("미처리 신고",m.totalOpen)}${metric("활성 푸시 기기",p.activePushDevices)}${metric("7일 내 일정",p.upcoming7d)}${metric("월간 리포트",p.monthlyReports)}${metric("Blob 고아 후보",storage.orphanCandidateCount??"-")}</div><div class="pg-ash-foot"><span class="${p.pushConfigured?"ok":"warn"}">FCM ${p.pushConfigured?"연결됨":"설정 필요"}</span><span class="${backupClass(backup)}">암호화 백업 ${backupLabel(backup)}</span><span>최근 백업 ${lastBackup}${age}</span><span class="${(storage.missingReferenceCount||0)===0?"ok":"warn"}">누락 Blob 참조 ${storage.missingReferenceCount??"-"}</span><button id="pg-run-backup" class="pg-ash-action" type="button" ${backup.configured?"":"disabled"}>지금 백업</button><span class="pg-ash-msg" aria-live="polite"></span></div>`;
    box.querySelector("#pg-run-backup")?.addEventListener("click",runBackup,{once:true});
  }catch(e){box.innerHTML='<div class="pg-ash-head"><b>서버 운영 상태</b><small class="warn">상태 조회 실패</small></div>';console.warn("PetGrow admin server health",e?.message||e);}finally{loading=false;}
}
export function bootAdminServerHealth(){
  if(started)return;started=true;installStyle();
  const observer=new MutationObserver(()=>{if(findHost())refresh();});observer.observe(document.documentElement,{childList:true,subtree:true});
  window.setTimeout(()=>refresh(true),5000);
  window.setInterval(()=>{if(document.visibilityState==="visible"&&findHost())refresh(true);},120000);
}
bootAdminServerHealth();
