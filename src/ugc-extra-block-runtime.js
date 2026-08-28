const CACHE=new Map();
const TTL=30000;

function parseUrl(input){
  try{return new URL(typeof input==="string"?input:String(input?.url||""),location.href);}catch{return null;}
}
function parseBody(init){try{return typeof init?.body==="string"?JSON.parse(init.body):null;}catch{return null;}}
function isKo(){return !String(document.documentElement.lang||"").toLowerCase().startsWith("en");}
function headersFor(response){const h=new Headers(response.headers);h.delete("content-length");h.delete("content-encoding");h.set("content-type","application/json; charset=utf-8");return h;}
function toast(message){
  document.getElementById("petgrow-extra-safety-toast")?.remove();
  const el=document.createElement("div");el.id="petgrow-extra-safety-toast";el.setAttribute("role","status");el.textContent=message;
  el.style.cssText="position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483610;max-width:min(90vw,440px);padding:12px 16px;border-radius:14px;background:#24372d;color:#fff;font:700 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.18);text-align:center";
  document.body.append(el);setTimeout(()=>el.remove(),2600);
}

async function blockedIds(fetcher,type,ids){
  const unique=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!unique.length)return new Set();
  const now=Date.now(),blocked=new Set(),missing=[];
  for(const id of unique){
    const key=`${type}:${id}`,cached=CACHE.get(key);
    if(cached&&now-cached.at<TTL){if(cached.blocked)blocked.add(id);}else missing.push(id);
  }
  if(missing.length){
    try{
      const res=await fetcher(`/api/user-block?targetType=${encodeURIComponent(type)}&targetIds=${encodeURIComponent(missing.join(","))}`,{credentials:"same-origin",headers:{Accept:"application/json"}});
      if(res.ok){
        const data=await res.json(),set=new Set((data?.blockedTargetIds||[]).map(String));
        missing.forEach(id=>{const value=set.has(id);CACHE.set(`${type}:${id}`,{blocked:value,at:now});if(value)blocked.add(id);});
      }
    }catch{}
  }
  return blocked;
}

async function filterItems(fetcher,response,type){
  if(!response.ok)return response;
  try{
    const data=await response.clone().json();
    if(!Array.isArray(data?.items)||!data.items.length)return response;
    const blocked=await blockedIds(fetcher,type,data.items.map(x=>x?.id));
    if(!blocked.size)return response;
    data.items=data.items.filter(x=>!blocked.has(String(x?.id)));
    if(data.summary&&typeof data.summary==="object")data.summary={...data.summary,count:data.items.length};
    return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:headersFor(response)});
  }catch{return response;}
}

async function blockTarget(fetcher,targetType,targetId){
  try{
    const res=await fetcher("/api/user-block",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({targetType,targetId})});
    if(!res.ok)return false;
    const data=await res.json().catch(()=>({}));CACHE.clear();
    toast(isKo()?`${data.nickname||"작성자"}를 차단했어요.`:`${data.nickname||"Author"} was blocked.`);
    return true;
  }catch{return false;}
}

if(!window.__petgrowExtraUgcBlockBooted){
  window.__petgrowExtraUgcBlockBooted=true;
  const previousFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
    const url=parseUrl(input),method=String(init?.method||(typeof input!=="string"&&input?.method)||"GET").toUpperCase();
    const path=url?.pathname||"",action=url?.searchParams?.get("action")||"";
    const musicReport=path==="/api/music"&&method==="POST"&&action==="comment-report";
    const placeReport=path==="/api/nearby-reviews"&&method==="POST"&&action==="report";
    const payload=(musicReport||placeReport)?parseBody(init):null;
    const response=await previousFetch(input,init);

    if(response.ok&&(musicReport||placeReport)&&payload){
      const targetType=musicReport?"music_comment":"place_review";
      const targetId=musicReport?payload.commentId:payload.reviewId;
      setTimeout(async()=>{
        const question=isKo()?"신고가 접수됐어요. 이 작성자도 차단할까요? 차단하면 이 사용자의 작성 콘텐츠가 내 화면에서 숨겨집니다.":"Report received. Block this author too? Their user content will be hidden from your view.";
        if(window.confirm(question)){
          const ok=await blockTarget(previousFetch,targetType,targetId);
          if(!ok)toast(isKo()?"신고는 접수됐지만 차단에 실패했어요.":"Report received, but blocking failed.");
        }
      },0);
      return response;
    }

    if(path==="/api/music"&&method==="GET"&&action==="comments")return filterItems(previousFetch,response,"music_comment");
    if(path==="/api/nearby-reviews"&&method==="GET"&&action==="list")return filterItems(previousFetch,response,"place_review");
    return response;
  };
}
