let started=false;
function textOf(el){return String(el?.textContent||"").replace(/\s+/g," ").trim();}
function enhance(){
  const buttons=[...document.querySelectorAll("button")];
  const withdraw=buttons.find(b=>/회원\s*탈퇴/.test(textOf(b)));
  if(!withdraw||document.getElementById("petgrow-data-export-btn"))return;
  const btn=document.createElement("button");
  btn.id="petgrow-data-export-btn";
  btn.type="button";
  btn.className=withdraw.className||"";
  btn.textContent="내 데이터 다운로드";
  btn.setAttribute("aria-label","PetGrow에 저장된 내 데이터를 JSON 파일로 다운로드");
  btn.style.cssText="border-color:#b9cec0!important;background:#f4f8f5!important;color:#315d46!important;font-weight:800!important";
  btn.addEventListener("click",()=>{
    const a=document.createElement("a");a.href="/api/data-export";a.download="";document.body.append(a);a.click();a.remove();
  });
  withdraw.parentElement?.insertBefore(btn,withdraw);
}
export function bootAccountDataExport(){
  if(started)return;started=true;
  enhance();
  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
}
bootAccountDataExport();
