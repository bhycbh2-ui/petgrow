const BLOCK_OPTION_ID="petgrow-report-block-option";
const BLOCK_MANAGER_ID="petgrow-block-manager";
const TARGET_CACHE=new Map();
const CACHE_TTL=30000;

function isVisible(el){
  if(!el)return false;
  const s=getComputedStyle(el);
  if(s.display==="none"||s.visibility==="hidden"||Number(s.opacity)===0)return false;
  const r=el.getBoundingClientRect();
  return r.width>1&&r.height>1;
}

function lang(){
  const htmlLang=String(document.documentElement.lang||"").toLowerCase();
  if(htmlLang.startsWith("en"))return "en";
  return /신고|회원|차단|댓글|게시글/.test(String(document.body?.innerText||""))?"ko":"en";
}

function toast(message){
  document.getElementById("petgrow-safety-toast")?.remove();
  const el=document.createElement("div");
  el.id="petgrow-safety-toast";
  el.setAttribute("role","status");
  el.textContent=message;
  el.style.cssText="position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483600;max-width:min(90vw,440px);padding:12px 16px;border-radius:14px;background:#24372d;color:#fff;font:700 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.18);text-align:center";
  document.body.append(el);
  setTimeout(()=>el.remove(),2800);
}

function parseUrl(input){
  try{
    const raw=typeof input==="string"?input:String(input?.url||"");
    return new URL(raw,location.href);
  }catch{return null;}
}

function parseJsonBody(init){
  try{
    if(typeof init?.body==="string")return JSON.parse(init.body);
  }catch{}
  return null;
}

function reportBlockChecked(){
  return Boolean(document.querySelector(`#${BLOCK_OPTION_ID} input[type='checkbox']:checked`));
}

function looksLikeReportDialog(dialog){
  if(!isVisible(dialog))return false;
  const value=String(dialog.innerText||dialog.textContent||"").replace(/\s+/g," ");
  return /(신고\s*사유|게시글\s*신고|댓글\s*신고|Report\s*(post|comment|reason)|Spam|스팸|동물학대|욕설)/i.test(value);
}

function installBlockOption(){
  const dialogs=[...document.querySelectorAll('[role="dialog"],[aria-modal="true"],.modal,.dialog,.popup,.sheet')];
  const dialog=dialogs.find(looksLikeReportDialog);
  if(!dialog||dialog.querySelector(`#${BLOCK_OPTION_ID}`))return;
  const en=lang()==="en";
  const box=document.createElement("label");
  box.id=BLOCK_OPTION_ID;
  box.style.cssText="display:flex;align-items:flex-start;gap:10px;margin:12px 0;padding:12px 13px;border:1px solid #dfe8e1;border-radius:13px;background:#f7faf7;color:#31463a;font:700 12.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;cursor:pointer;text-align:left";
  const input=document.createElement("input");
  input.type="checkbox";
  input.style.cssText="width:18px;height:18px;margin:1px 0 0;flex:0 0 18px;accent-color:#477a55";
  const copy=document.createElement("span");
  copy.innerHTML=en
    ? "Block this author after reporting<br><small style='font-weight:500;color:#708078'>Their PetTalk posts and comments will be hidden from you.</small>"
    : "신고 후 이 작성자 차단<br><small style='font-weight:500;color:#708078'>차단하면 이 사용자의 Pet톡 게시글과 댓글이 내 화면에서 숨겨집니다.</small>";
  box.append(input,copy);
  const actions=[...dialog.querySelectorAll("button")].filter(isVisible);
  const submit=actions.find(b=>/(신고|submit|report)/i.test(String(b.textContent||"")));
  if(submit?.parentElement)submit.parentElement.insertBefore(box,submit);
  else dialog.append(box);
}

function cleanHeaders(response){
  const headers=new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type","application/json; charset=utf-8");
  return headers;
}

async function getBlockedTargetIds(nativeFetch,targetType,ids){
  const unique=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!unique.length)return new Set();
  const now=Date.now();
  const knownBlocked=new Set();
  const unknown=[];
  for(const id of unique){
    const key=`${targetType}:${id}`;
    const cached=TARGET_CACHE.get(key);
    if(cached&&now-cached.at<CACHE_TTL){if(cached.blocked)knownBlocked.add(id);}
    else unknown.push(id);
  }
  if(unknown.length){
    try{
      const url=`/api/user-block?targetType=${encodeURIComponent(targetType)}&targetIds=${encodeURIComponent(unknown.join(","))}`;
      const res=await nativeFetch(url,{credentials:"same-origin",headers:{Accept:"application/json"}});
      if(res.ok){
        const data=await res.json();
        const blocked=new Set((data?.blockedTargetIds||[]).map(String));
        for(const id of unknown){
          const isBlocked=blocked.has(id);
          TARGET_CACHE.set(`${targetType}:${id}`,{blocked:isBlocked,at:now});
          if(isBlocked)knownBlocked.add(id);
        }
      }
    }catch{}
  }
  return knownBlocked;
}

async function filterCommunityResponse(nativeFetch,response){
  if(!response.ok)return response;
  try{
    const data=await response.clone().json();
    let changed=false;
    if(Array.isArray(data?.posts)&&data.posts.length){
      const blocked=await getBlockedTargetIds(nativeFetch,"post",data.posts.map(x=>x?.id));
      if(blocked.size){data.posts=data.posts.filter(x=>!blocked.has(String(x?.id)));changed=true;}
    }
    if(Array.isArray(data?.comments)&&data.comments.length){
      const blocked=await getBlockedTargetIds(nativeFetch,"comment",data.comments.map(x=>x?.id));
      if(blocked.size){data.comments=data.comments.filter(x=>!blocked.has(String(x?.id)));changed=true;}
    }
    if(data?.id&&data?.authorNickname&&data?.title){
      const blocked=await getBlockedTargetIds(nativeFetch,"post",[data.id]);
      if(blocked.has(String(data.id))){
        return new Response(JSON.stringify({error:"blocked user content"}),{status:404,headers:cleanHeaders(response)});
      }
    }
    if(!changed)return response;
    return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:cleanHeaders(response)});
  }catch{return response;}
}

async function blockReportedTarget(nativeFetch,payload){
  if(!payload?.targetType||!payload?.targetId)return false;
  try{
    const res=await nativeFetch("/api/user-block",{
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({targetType:payload.targetType,targetId:payload.targetId}),
    });
    if(!res.ok)return false;
    const data=await res.json().catch(()=>({}));
    TARGET_CACHE.clear();
    toast(lang()==="en"?`Report received and ${data.nickname||"the author"} was blocked.`:`신고 접수와 ${data.nickname||"작성자"} 차단을 완료했어요.`);
    setTimeout(()=>{
      const back=[...document.querySelectorAll("button")].find(b=>isVisible(b)&&/^\s*←/.test(String(b.textContent||"")));
      back?.click();
    },350);
    return true;
  }catch{return false;}
}

async function fetchBlockedUsers(nativeFetch){
  const res=await nativeFetch("/api/user-block",{credentials:"same-origin",headers:{Accept:"application/json"}});
  if(!res.ok)throw new Error("load failed");
  const data=await res.json();
  return Array.isArray(data?.users)?data.users:[];
}

function closeBlockManager(){document.getElementById(BLOCK_MANAGER_ID)?.remove();}

async function openBlockManager(nativeFetch){
  closeBlockManager();
  const en=lang()==="en";
  const overlay=document.createElement("div");
  overlay.id=BLOCK_MANAGER_ID;
  overlay.setAttribute("role","dialog");
  overlay.setAttribute("aria-modal","true");
  overlay.style.cssText="position:fixed;inset:0;z-index:2147483500;background:rgba(20,35,27,.48);display:grid;place-items:center;padding:20px";
  const card=document.createElement("div");
  card.style.cssText="width:min(92vw,440px);max-height:min(78vh,620px);overflow:auto;background:#fff;border-radius:22px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.22);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;color:#26382e";
  const head=document.createElement("div");
  head.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px";
  const title=document.createElement("h3");
  title.textContent=en?"Blocked users":"차단 사용자 관리";
  title.style.cssText="margin:0;font-size:19px";
  const close=document.createElement("button");
  close.type="button";close.textContent="×";close.setAttribute("aria-label",en?"Close":"닫기");
  close.style.cssText="border:0;background:#f3f6f3;border-radius:10px;width:36px;height:36px;font-size:22px;cursor:pointer";
  close.onclick=closeBlockManager;
  head.append(title,close);card.append(head);
  const list=document.createElement("div");card.append(list);overlay.append(card);document.body.append(overlay);
  overlay.addEventListener("click",e=>{if(e.target===overlay)closeBlockManager();});

  const render=async()=>{
    list.innerHTML=`<p style="margin:8px 0;color:#7a887f;font-size:13px">${en?"Loading…":"불러오는 중…"}</p>`;
    try{
      const users=await fetchBlockedUsers(nativeFetch);
      if(!users.length){list.innerHTML=`<p style="margin:8px 0;color:#7a887f;font-size:13px">${en?"No blocked users.":"차단한 사용자가 없어요."}</p>`;return;}
      list.innerHTML="";
      users.forEach(user=>{
        const row=document.createElement("div");
        row.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #edf1ed";
        const name=document.createElement("strong");name.textContent=user.nickname||"PetGrow 회원";name.style.fontSize="14px";
        const button=document.createElement("button");
        button.type="button";button.textContent=en?"Unblock":"차단 해제";
        button.style.cssText="border:1px solid #d7e2d9;background:#fff;color:#456451;border-radius:10px;padding:8px 11px;font-weight:700;cursor:pointer";
        button.onclick=async()=>{
          button.disabled=true;
          try{
            const res=await nativeFetch("/api/user-block",{method:"DELETE",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({blockedUserId:user.id})});
            if(!res.ok)throw new Error("unblock failed");
            TARGET_CACHE.clear();
            toast(en?"User unblocked.":"차단을 해제했어요.");
            await render();
          }catch{button.disabled=false;toast(en?"Could not unblock user.":"차단 해제에 실패했어요.");}
        };
        row.append(name,button);list.append(row);
      });
    }catch{list.innerHTML=`<p style="margin:8px 0;color:#a34d45;font-size:13px">${en?"Could not load blocked users.":"차단 목록을 불러오지 못했어요."}</p>`;}
  };
  render();
}

function installAccountBlockManager(nativeFetch){
  const modal=[...document.querySelectorAll(".account-settings-modal,[role='dialog'],[aria-modal='true']")]
    .find(el=>isVisible(el)&&/(로그아웃|회원탈퇴|account|logout)/i.test(String(el.innerText||"")));
  if(!modal||modal.querySelector("#petgrow-block-manager-entry"))return;
  const deleteBtn=[...modal.querySelectorAll("button")].find(b=>/(회원탈퇴|계정\s*삭제|delete\s*account)/i.test(String(b.textContent||"")));
  if(!deleteBtn?.parentElement)return;
  const button=document.createElement("button");
  button.id="petgrow-block-manager-entry";
  button.type="button";
  button.className="bg-btn bg-btn-ghost";
  button.textContent=lang()==="en"?"🚫 Manage blocked users":"🚫 차단 사용자 관리";
  button.addEventListener("click",()=>openBlockManager(nativeFetch));
  deleteBtn.parentElement.insertBefore(button,deleteBtn);
}

export function bootUgcSafety(){
  if(window.__petgrowUgcSafetyBooted)return;
  window.__petgrowUgcSafetyBooted=true;
  const nativeFetch=window.fetch.bind(window);

  window.fetch=async(input,init)=>{
    const url=parseUrl(input);
    const method=String(init?.method||(typeof input!=="string"&&input?.method)||"GET").toUpperCase();
    const isCommunity=Boolean(url&&(/^\/api\/community(?:-safe)?$/.test(url.pathname)));
    const isReport=Boolean(isCommunity&&method==="POST"&&url.searchParams.get("action")==="report");
    const shouldBlockAfterReport=isReport&&reportBlockChecked();
    const reportPayload=isReport?parseJsonBody(init):null;

    const response=await nativeFetch(input,init);

    if(isReport&&response.ok&&shouldBlockAfterReport&&reportPayload){
      setTimeout(async()=>{
        const ok=await blockReportedTarget(nativeFetch,reportPayload);
        if(!ok)toast(lang()==="en"?"Report was received, but blocking failed. Please try again.":"신고는 접수됐지만 차단에 실패했어요. 다시 시도해 주세요.");
      },0);
      return response;
    }

    if(isCommunity&&method==="GET")return filterCommunityResponse(nativeFetch,response);
    return response;
  };

  let frame=0;
  const scan=()=>{
    frame=0;
    try{installBlockOption();installAccountBlockManager(nativeFetch);}catch{}
  };
  const queue=()=>{if(!frame)frame=requestAnimationFrame(scan);};
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","hidden","aria-hidden"]});
  document.addEventListener("visibilitychange",queue);
  window.addEventListener("petgrow:critical-ready",queue);
  queue();
  window.PetGrowCommunitySafety={openBlockManager:()=>openBlockManager(nativeFetch),refresh:()=>TARGET_CACHE.clear()};
}

bootUgcSafety();
