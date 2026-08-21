let started=false;
let lastInbox=[];
let inboxTimer=null;
let lastRefreshAt=0;
let refreshPromise=null;
let monthlyTimer=null;
let monthlyFetchKey="";
let monthlyFetchedAt=0;
let petCache={at:0,pets:[]};

async function api(mode,{method="GET",body,params}={}){
  const q=new URLSearchParams({mode,...(params||{})});
  const r=await fetch(`/api/petlife-automation?${q}`,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,credentials:"same-origin"});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(j.error||"PetLife 서버 요청 실패"),{status:r.status});
  return j;
}

async function petApi(){
  if(Date.now()-petCache.at<30000&&petCache.pets.length)return petCache.pets;
  const r=await fetch("/api/petlife?action=pets",{credentials:"same-origin"});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(j.error||"우리 아이 정보를 불러오지 못했어요."),{status:r.status});
  petCache={at:Date.now(),pets:j.pets||[]};
  return petCache.pets;
}

function setScheduleBadge(count){
  const tabs=[...document.querySelectorAll("#petlife-react-root .pl-tabs button")];
  const schedule=tabs.find(x=>String(x.textContent||"").replace(/\d+/g,"").trim()==="일정");
  if(!schedule)return;
  let badge=schedule.querySelector(".pl-server-badge");
  if(count>0){
    if(!badge){badge=document.createElement("span");badge.className="pl-server-badge";schedule.append(badge);}
    badge.textContent=count>99?"99+":String(count);
    badge.setAttribute("aria-label",`읽지 않은 일정 알림 ${count}개`);
  }else badge?.remove();
}

function installBadgeStyle(){
  if(document.getElementById("petgrow-petlife-server-bridge-style"))return;
  const style=document.createElement("style");style.id="petgrow-petlife-server-bridge-style";
  style.textContent=`
#petlife-react-root .pl-tabs button{position:relative}
#petlife-react-root .pl-server-badge{position:absolute;top:4px;right:5px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#28543f;color:#fff;display:grid;place-items:center;font-size:9px;font-weight:900;line-height:1;box-shadow:0 2px 6px rgba(30,70,49,.18)}
#petlife-react-root .pl-monthly-server-reports{margin-top:16px;padding-top:16px;border-top:1px solid #e2e9e4}
#petlife-react-root .pl-monthly-server-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}
#petlife-react-root .pl-monthly-server-head small{display:block;color:#6f8879;font-size:9px;font-weight:850;letter-spacing:.12em;margin-bottom:3px}
#petlife-react-root .pl-monthly-server-head h4{margin:0;color:#253a2f;font-size:17px;letter-spacing:-.035em}
#petlife-react-root .pl-monthly-server-head span{color:#829087;font-size:10px;text-align:right}
#petlife-react-root .pl-monthly-server-list{display:grid;gap:9px}
#petlife-react-root .pl-monthly-server-card{padding:13px;border:1px solid #dce7df;border-radius:16px;background:linear-gradient(145deg,#fff,#f7faf7);box-shadow:0 5px 16px rgba(35,72,51,.045)}
#petlife-react-root .pl-monthly-server-card header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
#petlife-react-root .pl-monthly-server-card header b{font-size:13px;color:#2b4d3a}.pl-monthly-server-card header small{color:#71877a;font-size:9px;font-weight:800}
#petlife-react-root .pl-monthly-server-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:9px}
#petlife-react-root .pl-monthly-server-metrics span{min-width:0;padding:8px 5px;border-radius:11px;background:#eef5ef;text-align:center;color:#6d7f74;font-size:9px;line-height:1.2}
#petlife-react-root .pl-monthly-server-metrics strong{display:block;margin-bottom:2px;color:#28543f;font-size:13px;font-variant-numeric:tabular-nums}
#petlife-react-root .pl-monthly-server-card p{margin:0;color:#607168;font-size:10px;line-height:1.55}
#petlife-react-root .pl-monthly-server-empty{padding:13px;border-radius:14px;background:#f4f7f4;color:#74827a;font-size:11px;text-align:center}
@media(max-width:430px){#petlife-react-root .pl-server-badge{top:2px;right:2px}#petlife-react-root .pl-monthly-server-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#petlife-react-root .pl-monthly-server-head{align-items:flex-start}#petlife-react-root .pl-monthly-server-head span{max-width:120px}}
`;
  document.head.append(style);
}

async function markRead(id){
  try{await api("read",{method:"POST",body:{notificationId:id}});}catch{}
}

async function showClientNotification(item){
  if(typeof Notification==="undefined"||Notification.permission!=="granted")return;
  const key=`petgrow-server-notification:${item.id}`;
  try{if(localStorage.getItem(key))return;}catch{}
  const options={body:item.body,tag:`petlife-${item.id}`,data:{notificationId:item.id,petId:item.petId,entryId:item.entryId,url:"/?petlife=1"},icon:"/icon-192.png",badge:"/icon-192.png"};
  try{
    const registration=await navigator.serviceWorker?.getRegistration?.();
    if(registration?.showNotification){
      await registration.showNotification(item.title,options);
    }else{
      const n=new Notification(item.title,options);
      n.onclick=()=>{markRead(item.id);try{window.focus();}catch{}};
    }
    try{localStorage.setItem(key,"1");}catch{}
  }catch{}
}

async function refreshInbox(force=false){
  const now=Date.now();
  if(refreshPromise)return refreshPromise;
  if(!force&&now-lastRefreshAt<10000){setScheduleBadge(lastInbox.filter(x=>!x.readAt).length);return lastInbox;}
  lastRefreshAt=now;
  refreshPromise=(async()=>{
    try{
      const j=await api("inbox",{params:{limit:"30"}});
      lastInbox=j.notifications||[];
      const unread=lastInbox.filter(x=>!x.readAt);
      setScheduleBadge(unread.length);
      for(const item of unread.slice(0,3))await showClientNotification(item);
      return lastInbox;
    }catch(e){
      if(e?.status!==401)console.warn("PetLife reminder sync",e?.message||e);
      return lastInbox;
    }finally{refreshPromise=null;}
  })();
  return refreshPromise;
}

function reportTabActive(){
  const active=document.querySelector("#petlife-react-root .pl-tabs button.active");
  return /리포트/.test(String(active?.textContent||""));
}
function activePetName(){return String(document.querySelector("#petlife-react-root .pl-petselect button.active b")?.textContent||"").trim();}
function reportPanel(){return document.querySelector("#petlife-react-root .pl-body .pl-panel");}
function monthLabel(v){
  const m=/^(\d{4})-(\d{2})/.exec(String(v||""));
  return m?`${m[1]}년 ${Number(m[2])}월`:String(v||"");
}
function metric(value,fallback="0"){return value==null?fallback:String(value);}
function cardHtml(report){
  const s=report?.summary||{};
  const delta=s.weightDelta==null?"-":`${Number(s.weightDelta)>0?"+":""}${Number(s.weightDelta).toFixed(2)}kg`;
  return `<article class="pl-monthly-server-card"><header><b>${monthLabel(report.month)}</b><small>자동 생성 · 서버 보관</small></header><div class="pl-monthly-server-metrics"><span><strong>${metric(s.recordCount)}</strong>전체 기록</span><span><strong>${metric(s.healthRecords)}</strong>건강 기록</span><span><strong>${metric(s.totalWalkMinutes)}</strong>산책 분</span><span><strong>${delta}</strong>체중 변화</span></div><p></p></article>`;
}

async function renderMonthlyReports(force=false){
  if(!reportTabActive())return;
  const panel=reportPanel();if(!panel)return;
  try{
    const name=activePetName();if(!name)return;
    const pets=await petApi();
    const pet=pets.find(p=>p.name===name)||pets[0];if(!pet)return;
    const key=pet.id;
    if(!force&&monthlyFetchKey===key&&Date.now()-monthlyFetchedAt<60000&&panel.querySelector(`.pl-monthly-server-reports[data-pet-id="${CSS.escape(key)}"]`))return;
    monthlyFetchKey=key;monthlyFetchedAt=Date.now();
    const j=await api("monthly-reports",{params:{petId:pet.id,limit:"6"}});
    if(!reportTabActive()||activePetName()!==name)return;
    panel.querySelectorAll(".pl-monthly-server-reports").forEach(x=>x.remove());
    const section=document.createElement("section");section.className="pl-monthly-server-reports";section.dataset.petId=pet.id;
    section.innerHTML='<div class="pl-monthly-server-head"><div><small>AUTO MONTHLY REPORT</small><h4>자동 월간 건강리포트</h4></div><span>매월 서버 기록을 기준으로 자동 보관</span></div><div class="pl-monthly-server-list"></div>';
    const list=section.querySelector(".pl-monthly-server-list");
    const reports=(j.reports||[]).slice(0,3);
    if(!reports.length){list.innerHTML='<div class="pl-monthly-server-empty">월간 리포트를 만들 기록이 아직 없어요.</div>';}else{
      reports.forEach(report=>{
        const wrap=document.createElement("div");wrap.innerHTML=cardHtml(report);const card=wrap.firstElementChild;
        const insight=Array.isArray(report?.summary?.insights)&&report.summary.insights.length?report.summary.insights[0]:"한 달의 PetLife 기록을 서버에서 자동으로 정리했어요.";
        card.querySelector("p").textContent=insight;list.append(card);
      });
    }
    panel.append(section);
  }catch(e){if(e?.status!==401)console.warn("PetLife monthly report sync",e?.message||e);}
}

function scheduleMonthly(force=false){
  if(!reportTabActive())return;
  window.clearTimeout(monthlyTimer);
  monthlyTimer=window.setTimeout(()=>renderMonthlyReports(force),force?40:140);
}

async function bootNativePushBridge(){
  try{
    const {Capacitor,registerPlugin}=await import("@capacitor/core");
    if(!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=="android")return false;
    const Push=registerPlugin("PushNotifications");
    const perm=await Push.checkPermissions();
    let receive=perm?.receive;
    if(receive==="prompt"||receive==="prompt-with-rationale")receive=(await Push.requestPermissions())?.receive;
    if(receive!=="granted")return false;
    await Push.addListener("registration",async token=>{
      try{await api("push-register",{method:"POST",body:{token:token?.value||"",platform:"android",deviceName:navigator.userAgent.slice(0,120)}});}catch(e){console.warn("PetLife push register",e?.message||e);}
    });
    await Push.addListener("registrationError",err=>console.warn("PetLife native push registration",err));
    await Push.addListener("pushNotificationReceived",()=>refreshInbox(true));
    await Push.addListener("pushNotificationActionPerformed",async event=>{
      const notificationId=event?.notification?.data?.notificationId;
      if(notificationId)await markRead(notificationId);
      window.dispatchEvent(new CustomEvent("petgrow:navigate",{detail:"home"}));
    });
    await Push.register();
    return true;
  }catch(e){console.warn("PetLife native push bridge",e?.message||e);return false;}
}

function observePetLife(){
  let wasOpen=false,lastPet="",lastTab="";
  const observer=new MutationObserver(()=>{
    const open=Boolean(document.querySelector("#petlife-react-root .pl-shell"));
    if(open){
      installBadgeStyle();
      setScheduleBadge(lastInbox.filter(x=>!x.readAt).length);
      if(!wasOpen)refreshInbox(true);
      const pet=activePetName();const tab=String(document.querySelector("#petlife-react-root .pl-tabs button.active")?.textContent||"").trim();
      if(/리포트/.test(tab)&&(pet!==lastPet||tab!==lastTab||!document.querySelector("#petlife-react-root .pl-monthly-server-reports")))scheduleMonthly(pet!==lastPet||tab!==lastTab);
      lastPet=pet;lastTab=tab;
    }
    wasOpen=open;
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
}

export function bootPetLifeServerBridge(){
  if(started)return;started=true;
  installBadgeStyle();
  observePetLife();
  window.setTimeout(()=>{refreshInbox(true);bootNativePushBridge();},2400);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){refreshInbox(true);scheduleMonthly(true);}});
  inboxTimer=window.setInterval(()=>{if(document.visibilityState==="visible")refreshInbox();},15*60*1000);
}

bootPetLifeServerBridge();
