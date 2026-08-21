let started=false;
let lastInbox=[];
let inboxTimer=null;
let lastRefreshAt=0;
let refreshPromise=null;

async function api(mode,{method="GET",body,params}={}){
  const q=new URLSearchParams({mode,...(params||{})});
  const r=await fetch(`/api/petlife-automation?${q}`,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,credentials:"same-origin"});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(j.error||"PetLife 서버 요청 실패"),{status:r.status});
  return j;
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
  style.textContent=`#petlife-react-root .pl-tabs button{position:relative}#petlife-react-root .pl-server-badge{position:absolute;top:4px;right:5px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#28543f;color:#fff;display:grid;place-items:center;font-size:9px;font-weight:900;line-height:1;box-shadow:0 2px 6px rgba(30,70,49,.18)}@media(max-width:430px){#petlife-react-root .pl-server-badge{top:2px;right:2px}}`;
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

async function bootNativePushBridge(){
  const plugins=globalThis.Capacitor?.Plugins;
  const Push=plugins?.PushNotifications;
  if(!Push)return false;
  try{
    const perm=await Push.checkPermissions();
    let receive=perm?.receive;
    if(receive==="prompt"||receive==="prompt-with-rationale")receive=(await Push.requestPermissions())?.receive;
    if(receive!=="granted")return false;
    await Push.addListener("registration",async token=>{
      try{await api("push-register",{method:"POST",body:{token:token?.value||"",platform:"android",deviceName:navigator.userAgent.slice(0,120)}});}catch(e){console.warn("PetLife push register",e?.message||e);}
    });
    await Push.addListener("registrationError",err=>console.warn("PetLife native push registration",err));
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
  let wasOpen=false;
  const observer=new MutationObserver(()=>{
    const open=Boolean(document.querySelector("#petlife-react-root .pl-shell"));
    if(open){
      installBadgeStyle();
      setScheduleBadge(lastInbox.filter(x=>!x.readAt).length);
      if(!wasOpen)refreshInbox(true);
    }
    wasOpen=open;
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

export function bootPetLifeServerBridge(){
  if(started)return;started=true;
  installBadgeStyle();
  observePetLife();
  window.setTimeout(()=>{refreshInbox(true);bootNativePushBridge();},2400);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshInbox(true);});
  inboxTimer=window.setInterval(()=>{if(document.visibilityState==="visible")refreshInbox();},15*60*1000);
}

bootPetLifeServerBridge();
