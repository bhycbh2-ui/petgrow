let booted=false;

function isVisible(el){
  if(!el)return false;
  const s=getComputedStyle(el);
  if(s.display==="none"||s.visibility==="hidden"||Number(s.opacity)===0)return false;
  const r=el.getBoundingClientRect();
  return r.width>1&&r.height>1;
}

function findPrivacyContainer(){
  const heading=[...document.querySelectorAll("h1,h2,h3,[role='heading']")]
    .find(el=>isVisible(el)&&/개인정보\s*처리방침|privacy\s*policy/i.test(el.textContent||""));
  if(!heading)return null;
  return heading.closest("[role='dialog'],[aria-modal='true'],.modal-content,.modal-card,.modal,.dialog,.popup,.sheet,.panel")||heading.parentElement;
}

async function waitForAdMobApi(timeout=2500){
  const started=performance.now();
  while(performance.now()-started<timeout){
    if(window.PetGrowAdMob?.requestPrivacyChoices)return window.PetGrowAdMob;
    await new Promise(resolve=>setTimeout(resolve,80));
  }
  return null;
}

function installEntry(){
  const container=findPrivacyContainer();
  if(!container||container.querySelector("#petgrow-ad-privacy-entry"))return;
  const wrap=document.createElement("div");
  wrap.id="petgrow-ad-privacy-entry";
  wrap.setAttribute("data-petgrow-native-only","true");
  wrap.style.cssText="margin:18px 0 8px;padding:14px;border:1px solid #dfe8e1;border-radius:14px;background:#f7faf7;line-height:1.55";
  const title=document.createElement("strong");
  title.textContent="Google 광고 개인정보 설정";
  title.style.cssText="display:block;margin-bottom:6px;color:#27352c;font-size:14px";
  const desc=document.createElement("p");
  desc.textContent="적용되는 지역에서는 Google UMP 동의 선택을 다시 확인하거나 변경할 수 있습니다.";
  desc.style.cssText="margin:0 0 10px;color:#68766d;font-size:12px";
  const button=document.createElement("button");
  button.type="button";
  button.textContent="광고 개인정보 설정";
  button.style.cssText="min-height:40px;padding:9px 14px;border:1px solid #9fbea6;border-radius:10px;background:#fff;color:#356b40;font-size:13px;font-weight:700;cursor:pointer";
  button.addEventListener("click",async()=>{
    const original=button.textContent;
    button.disabled=true;button.textContent="불러오는 중…";
    try{
      const admob=await waitForAdMobApi();
      if(!admob)throw new Error("AdMob privacy API unavailable");
      await admob.requestPrivacyChoices();
    }catch(e){
      console.warn("PetGrow privacy choices",e?.message||e);
      window.alert("광고 개인정보 설정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }finally{
      button.disabled=false;button.textContent=original;
    }
  });
  wrap.append(title,desc,button);
  container.append(wrap);
}

export async function bootAdMobPrivacyEntry(){
  if(booted)return;booted=true;
  try{
    const {Capacitor}=await import("@capacitor/core");
    if(!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=="android")return;
    let frame=0;
    const queue=()=>{
      if(frame)return;
      frame=requestAnimationFrame(()=>{frame=0;installEntry();});
    };
    new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","hidden","aria-hidden"]});
    queue();
  }catch(e){console.warn("PetGrow privacy entry",e?.message||e);}
}

bootAdMobPrivacyEntry();
