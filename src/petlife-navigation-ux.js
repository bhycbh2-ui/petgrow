import "./petlife-navigation-ux.css";

let started=false;
let observer=null;

function goHome(){
  const close=document.querySelector("#petlife-react-root .pl-shell .pl-close");
  if(close instanceof HTMLElement) close.click();
  window.requestAnimationFrame(()=>{
    window.dispatchEvent(new CustomEvent("petgrow:navigate",{detail:"home"}));
    window.scrollTo({top:0,behavior:"auto"});
  });
}

function enhance(shell){
  if(!(shell instanceof HTMLElement)||shell.dataset.pgNavUx==="1") return;
  const head=shell.querySelector(":scope > .pl-head");
  const close=head?.querySelector(".pl-close");
  if(!(head instanceof HTMLElement)||!(close instanceof HTMLButtonElement)) return;

  shell.dataset.pgNavUx="1";
  close.setAttribute("aria-label","PetLife 닫기");
  close.setAttribute("title","닫기");
  close.innerHTML='<span aria-hidden="true">×</span><b>닫기</b>';

  const actions=document.createElement("div");
  actions.className="pl-head-actions";

  const home=document.createElement("button");
  home.type="button";
  home.className="pl-home";
  home.setAttribute("aria-label","PetGrow 홈으로 이동");
  home.innerHTML='<span aria-hidden="true">←</span><b>홈</b>';
  home.addEventListener("click",goHome);

  close.parentNode?.insertBefore(actions,close);
  actions.append(home,close);
}

function scan(){
  document.querySelectorAll("#petlife-react-root .pl-shell").forEach(enhance);
}

export function bootPetLifeNavigationUX(){
  if(started) return;
  started=true;
  scan();
  observer=new MutationObserver(scan);
  observer.observe(document.documentElement,{childList:true,subtree:true});
}

bootPetLifeNavigationUX();
