let started=false;
let loading=false;
let backupRunning=false;
let verifyRunning=false;
let deepRunning=false;
let lastLoad=0;
let lastHealth=null;
let mutationTimer=0;

function installStyle(){
  if(document.getElementById("petgrow-admin-server-health-style"))return;
  const s=document.createElement("style");s.id="petgrow-admin-server-health-style";
  s.textContent=`#petgrow-admin-server-health{margin:14px 0;padding:14px;border:1px solid #dce8df;border-radius:18px;background:linear-gradient(145deg,#fff,#f6faf7);box-shadow:0 7px 22px rgba(33,73,50,.06)}#petgrow-admin-server-health .pg-ash-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:10px}#petgrow-admin-server-health .pg-ash-title{min-width:0}#petgrow-admin-server-health .pg-ash-head b{font-size:15px;color:#284b39}#petgrow-admin-server-health .pg-ash-head small{display:block;margin-top:2px;font-size:10px;color:#7b8d82}#petgrow-admin-server-health .pg-ash-head-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}#petgrow-admin-server-health .pg-ash-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}#petgrow-admin-server-health .pg-ash-metric{padding:10px 7px;border-radius:13px;background:#edf5ef;text-align:center;color:#6d7d73;font-size:9px;line-height:1.3;min-width:0}#petgrow-admin-server-health .pg-ash-metric strong{display:block;margin-bottom:3px;color:#28543f;font-size:15px;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}#petgrow-admin-server-health .pg-ash-foot{margin-top:9px;padding-top:9px;border-top:1px solid #e3ebe5;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:10px;color:#65766c}#petgrow-admin-server-health .ok{color:#287048;font-weight:800}#petgrow-admin-server-health .warn{color:#9b6419;font-weight:800}#petgrow-admin-server-health .bad{color:#ad3e3e;font-weight:800}#petgrow-admin-server-health .muted{color:#819087;font-weight:700}#petgrow-admin-server-health .pg-ash-actions{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}#petgrow-admin-server-health .pg-ash-action{border:1px solid #c9ddd0;background:#fff;color:#28543f;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;min-height:32px}#petgrow-admin-server-health .pg-ash-action.primary{background:#28543f;color:#fff;border-color:#28543f}#petgrow-admin-server-health .pg-ash-action:disabled{opacity:.5;cursor:not-allowed}#petgrow-admin-server-health .pg-ash-msg{width:100%;font-size:10px;color:#65766c;line-height:1.45}#petgrow-admin-server-health .pg-ash-scan{width:100%;padding:8px 10px;border-radius:12px;background:#f1f6f2;display:flex;align-items:center;gap:7px;flex-wrap:wrap}#petgrow-admin-server-health .pg-ash-scan b{font-size:10px;color:#385744}#petgrow-admin-server-health .pg-ash-scan small{font-size:9px;color:#77877d}@media(max-width:600px){#petgrow-admin-server-health{padding:12px}#petgrow-admin-server-health .pg-ash-head{align-items:flex-start}#petgrow-admin-server-health .pg-ash-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#petgrow-admin-server-health .pg-ash-head-actions{width:auto}#petgrow-admin-server-health .pg-ash-actions{margin-left:0;width:100%;display:grid;grid-template-columns:1fr 1fr}#petgrow-admin-server-health .pg-ash-action{width:100%;padding:8px 8px}#petgrow-admin-server-health .pg-ash-head-actions .pg-ash-action{width:auto}}@media(max-width:360px){#petgrow-admin-server-health .pg-ash-grid{grid-template-columns:1fr 1fr}#petgrow-admin-server-health .pg-ash-actions{grid-template-columns:1fr}}`;
  document.head.append(s);
}
function findHost(){
  const root=document.getElementById("root")||document.body;if(!root)return null;
  const heading=[...root.querySelectorAll("h1,h2,h3,b,strong")].find(el=>/관리자\s*센터/.test(String(el.textContent||"")));
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
async function requestJson(url,options={},timeout=10000){
  const controller=new AbortController();
  const timer=window.setTimeout(()=>controller.abort(),timeout);
  try{
    const r=await fetch(url,{credentials:"same-origin",cache:"no-store",...options,signal:controller.signal});
    if(r.status===401||r.status===403)return null;
    const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||j.reason||String(r.status));e.payload=j;throw e;}return j;
  }finally{window.clearTimeout(timer);}
}
function metric(label,value){return `<div class="pg-ash-metric"><strong>${value??"-"}</strong>${label}</div>`;}
function backupLabel(backup){
  if(backup.configured)return backup.overdue?"지연":"활성";
  if(backup.reason==="BACKUP_KEY_TOO_SHORT")return "키 보강 필요";
  if(backup.reason==="BLOB_NOT_CONFIGURED")return "Blob 설정 필요";
  return "설정 필요";
}
function backupClass(backup){return backup.configured?(backup.overdue?"warn":"ok"):"bad";}
function setMessage(text,kind=""){
  const msg=ensureBox()?.querySelector(".pg-ash-msg");if(!msg)return;
  msg.className=`pg-ash-msg ${kind}`.trim();msg.textContent=text||"";
}
function setButtonsBusy(){
  const box=ensureBox();if(!box)return;
  const backup=box.querySelector("#pg-run-backup"),verify=box.querySelector("#pg-verify-backup"),deep=box.querySelector("#pg-run-deep-health"),reload=box.querySelector("#pg-refresh-health");
  const busy=backupRunning||verifyRunning||deepRunning||loading;
  if(backup){backup.disabled=busy||backup.dataset.enabled!=="1";backup.textContent=backupRunning?"백업 실행 중…":"지금 백업";}
  if(verify){verify.disabled=busy||verify.dataset.enabled!=="1";verify.textContent=verifyRunning?"검증 중…":"무결성 검증";}
  if(deep){deep.disabled=busy||deep.dataset.enabled!=="1";deep.textContent=deepRunning?"검사 중…":"스토리지 검사";}
  if(reload){reload.disabled=busy;reload.textContent=loading?"새로고침 중…":"새로고침";}
}
async function runBackup(){
  if(backupRunning||verifyRunning||deepRunning)return;
  backupRunning=true;setButtonsBusy();setMessage("암호화 백업을 생성한 뒤 실제 복호화 무결성까지 확인하고 있어요.");
  try{
    const result=await requestJson("/api/admin-backup-run",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"},30000);
    if(!result)return;
    const verified=Boolean(result?.verification?.verified);
    if(result.skipped)setMessage(verified?"최근 백업이 있어 새 파일 생성은 건너뛰고 기존 백업 무결성을 확인했어요.":"최근 백업이 있어 중복 생성을 건너뛰었어요.",verified?"ok":"warn");
    else setMessage(verified?"암호화 백업 생성과 복호화 무결성 검증이 모두 완료됐어요.":"백업은 생성됐지만 무결성 확인 상태를 다시 확인해 주세요.",verified?"ok":"warn");
    lastLoad=0;window.setTimeout(()=>refresh(true),500);
  }catch(e){
    setMessage(e?.payload?.reason==="BACKUP_KEY_TOO_SHORT"?"백업 암호화 키를 32자 이상으로 설정해 주세요.":"백업 실행 또는 무결성 검증에 실패했어요. 기존 백업은 자동 삭제하지 않았어요.","bad");
  }finally{backupRunning=false;setButtonsBusy();}
}
async function verifyBackup(){
  if(backupRunning||verifyRunning||deepRunning)return;
  verifyRunning=true;setButtonsBusy();setMessage("최근 백업을 내려받아 AES-GCM 인증, 압축 해제, JSON 구조를 검증하고 있어요.");
  try{
    const result=await requestJson("/api/admin-backup-verify",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"},30000);
    if(!result)return;
    const v=result.verification||{};
    const tableCount=v.tableCounts?Object.keys(v.tableCounts).length:0;
    setMessage(v.verified?`백업 무결성 정상 · ${tableCount||"-"}개 데이터 영역 · ${v.integrity||"AES-256-GCM"}`:"백업 무결성을 확인하지 못했어요.",v.verified?"ok":"bad");
  }catch(e){setMessage("최근 백업 무결성 검증에 실패했어요. 새 백업 생성 후 다시 확인해 주세요.","bad");}
  finally{verifyRunning=false;setButtonsBusy();}
}
async function runDeepHealth(){
  if(backupRunning||verifyRunning||deepRunning||loading)return;
  deepRunning=true;setButtonsBusy();setMessage("Blob과 DB 파일 참조를 정밀 비교하고 있어요. 평소 자동 새로고침에서는 이 검사를 실행하지 않습니다.");
  try{
    const health=await requestJson("/api/admin-data-health?deep=1&force=1",{},25000);
    if(!health)return;
    lastHealth=health;
    const s=health.storage||{};
    const issue=(Number(s.missingReferenceCount)||0)+(Number(s.orphanCandidateCount)||0);
    setMessage(issue?`정밀 검사 완료 · 누락 참조 ${s.missingReferenceCount||0} · 고아 후보 ${s.orphanCandidateCount||0}${s.scanTruncated?" · 최대 범위까지만 검사":""}`:`정밀 검사 정상 · ${s.scannedBlobs||0}개 Blob / ${s.referencedBlobUrls||0}개 DB 참조 확인`,issue?"warn":"ok");
    renderCurrent();
  }catch(e){setMessage(e?.name==="AbortError"?"스토리지 검사가 오래 걸려 중단됐어요. 잠시 후 다시 시도해 주세요.":"스토리지 정합성 검사에 실패했어요.","bad");}
  finally{deepRunning=false;setButtonsBusy();}
}
let lastOverview=null;
function renderCurrent(){
  const box=ensureBox();if(!box||!lastOverview)return;
  const overview=lastOverview,health=lastHealth;
  const p=overview.petLife||{},m=overview.moderation||{},storage=health?.storage||{},backup=health?.backup||{};
  const hasService=Boolean(health);
  const checked=Boolean(storage.checked||storage.cached);
  const issues=(Number(storage.missingReferenceCount)||0)+(Number(storage.orphanCandidateCount)||0);
  const storageState=!hasService?"권한 제한":!checked?"검사 대기":storage.scanTruncated?"부분 검사":issues?"확인 필요":"정상";
  const storageClass=!hasService||!checked?"muted":issues||storage.scanTruncated?"warn":"ok";
  const lastBackup=backup.lastBackup?.uploadedAt?new Date(backup.lastBackup.uploadedAt).toLocaleString("ko-KR"):"-";
  const age=backup.lastBackupAgeHours==null?"":` · ${backup.lastBackupAgeHours}시간 전`;
  const canBackup=Boolean(hasService&&backup.configured),canVerify=Boolean(hasService&&backup.configured&&backup.lastBackup);
  const scanMeta=checked?`${storage.scannedBlobs||0} Blob · ${storage.referencedBlobUrls||0} 참조${health?.durationMs?` · ${(health.durationMs/1000).toFixed(1)}초`:""}${storage.cached?" · 최근 결과":""}`:"자동 새로고침에서는 무거운 Blob 전체 검사를 생략합니다.";
  box.innerHTML=`<div class="pg-ash-head"><div class="pg-ash-title"><b>서버 운영 상태</b><small>PetLife · 푸시 · 백업 · 모더레이션</small></div><div class="pg-ash-head-actions"><button id="pg-refresh-health" class="pg-ash-action" type="button">새로고침</button></div></div><div class="pg-ash-grid">${metric("30일 PetLife 사용자",p.activeUsers30d)}${metric("30일 기록",p.records30d)}${metric("푸시 성공률",p.pushSuccessRate30d==null?"-":`${p.pushSuccessRate30d}%`)}${metric("미처리 신고",m.totalOpen)}${metric("활성 푸시 기기",p.activePushDevices)}${metric("7일 내 일정",p.upcoming7d)}${metric("월간 리포트",p.monthlyReports)}${metric("Blob 고아 후보",checked?(storage.orphanCandidateCount??0):"검사 전")}</div><div class="pg-ash-foot"><span class="${p.pushConfigured?"ok":"warn"}">FCM ${p.pushConfigured?"연결됨":"설정 필요"}</span>${hasService?`<span class="${backupClass(backup)}">암호화 백업 ${backupLabel(backup)}</span><span>최근 백업 ${lastBackup}${age}</span>`:""}<span class="${storageClass}">스토리지 정합성 ${storageState}</span>${checked?`<span class="${(storage.missingReferenceCount||0)===0?"ok":"warn"}">누락 Blob 참조 ${storage.missingReferenceCount??0}</span>`:""}<div class="pg-ash-scan"><b>데이터 정합성</b><small>${scanMeta}</small></div>${hasService?`<div class="pg-ash-actions"><button id="pg-run-deep-health" class="pg-ash-action" type="button" data-enabled="1">스토리지 검사</button><button id="pg-verify-backup" class="pg-ash-action" type="button" data-enabled="${canVerify?"1":"0"}" ${canVerify?"":"disabled"}>무결성 검증</button><button id="pg-run-backup" class="pg-ash-action primary" type="button" data-enabled="${canBackup?"1":"0"}" ${canBackup?"":"disabled"}>지금 백업</button></div>`:""}<span class="pg-ash-msg" aria-live="polite"></span></div>`;
  box.querySelector("#pg-refresh-health")?.addEventListener("click",()=>refresh(true));
  box.querySelector("#pg-run-deep-health")?.addEventListener("click",runDeepHealth);
  box.querySelector("#pg-run-backup")?.addEventListener("click",runBackup);
  box.querySelector("#pg-verify-backup")?.addEventListener("click",verifyBackup);
  setButtonsBusy();
}
async function refresh(force=false){
  const box=ensureBox();if(!box||loading)return;
  if(!force&&Date.now()-lastLoad<120000)return;
  loading=true;lastLoad=Date.now();setButtonsBusy();
  try{
    const [overview,health]=await Promise.all([requestJson("/api/admin-overview-lite"),requestJson("/api/admin-data-health")]);
    if(!overview){box.remove();return;}
    lastOverview=overview;
    if(health)lastHealth=health;
    renderCurrent();
  }catch(e){
    if(!lastOverview)box.innerHTML='<div class="pg-ash-head"><div class="pg-ash-title"><b>서버 운영 상태</b><small class="warn">상태 조회 실패</small></div></div>';
    else setMessage(e?.name==="AbortError"?"운영 상태 조회 시간이 길어져 중단됐어요.":"운영 상태를 새로고침하지 못했어요.","warn");
    console.warn("PetGrow admin server health",e?.message||e);
  }finally{loading=false;setButtonsBusy();}
}
export function bootAdminServerHealth(){
  if(started)return;started=true;installStyle();
  const root=document.getElementById("root")||document.body;
  const observer=new MutationObserver(()=>{
    window.clearTimeout(mutationTimer);
    mutationTimer=window.setTimeout(()=>{if(findHost())refresh();},180);
  });
  if(root)observer.observe(root,{childList:true,subtree:true});
  window.setTimeout(()=>refresh(true),1800);
  window.setInterval(()=>{if(document.visibilityState==="visible"&&findHost())refresh(false);},300000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&findHost()&&Date.now()-lastLoad>120000)refresh(true);});
}
bootAdminServerHealth();
