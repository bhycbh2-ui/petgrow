import "./home-flagship-10b-20260828.css";

const HOME_SELECTOR=".petgrow-dashboard-home";
let raf=0;

const ICONS={
  petlife:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.2-7-10a4.2 4.2 0 0 1 7-3.1A4.2 4.2 0 0 1 19 10c0 5.8-7 10-7 10Z"/><path d="M9 11h6M12 8v6"/></svg>',
  growth:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16M7 15l3-4 3 2 4-6"/></svg>',
  community:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18.5 3.8 21l3.3-1.1A9 9 0 1 0 5 18.5Z"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.2"/></svg>',
  nearby:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>'
};

function navigate(view){window.dispatchEvent(new CustomEvent("petgrow:navigate",{detail:view}));}
function openPetLife(){
  const launcher=document.querySelector("#petlife-react-root .pl-launcher,.pl-launcher");
  if(launcher){launcher.click();return;}
  window.setTimeout(()=>document.querySelector("#petlife-react-root .pl-launcher,.pl-launcher")?.click(),180);
}
function keepOne(home,selector){
  const nodes=[...home.querySelectorAll(selector)];
  const first=nodes.shift()||null;
  nodes.forEach(node=>node.remove());
  return first;
}
function serviceButton({key,eyebrow,title,desc,cls,onClick}){
  const btn=document.createElement("button");
  btn.type="button";
  btn.className=`pg-flagship-service ${cls||""}`.trim();
  btn.dataset.service=key;
  btn.innerHTML=`<span class="pg-flagship-service__icon">${ICONS[key]||""}</span><small>${eyebrow}</small><b>${title}</b><p>${desc}</p><span class="pg-flagship-service__arrow" aria-hidden="true">›</span>`;
  btn.addEventListener("click",onClick);
  return btn;
}

function buildServices(home){
  let section=keepOne(home,".pg-flagship-services");
  if(!section){
    section=document.createElement("section");
    section.className="pg-flagship-services";
    section.setAttribute("aria-label","PetGrow 주요 서비스");
    section.innerHTML='<div class="pg-flagship-services__head"><div><small>PETGROW SERVICES</small><h2>자주 쓰는 기능만, 더 선명하게</h2></div><p>기록과 건강 관리, 커뮤니티와 주변 시설까지 필요한 순간 바로 들어갈 수 있어요.</p></div><div class="pg-flagship-services__grid"></div>';
    const grid=section.querySelector(".pg-flagship-services__grid");
    grid.append(
      serviceButton({key:"petlife",eyebrow:"LIFETIME CARE",title:"PetLife",desc:"건강 기록·일정·리포트·성장앨범을 한곳에서 관리하세요.",cls:"pg-flagship-service--petlife",onClick:openPetLife}),
      serviceButton({key:"growth",eyebrow:"GROWTH",title:"성장기록",desc:"몸무게와 사진, 성장 변화를 차분하게 쌓아보세요.",cls:"pg-flagship-service--growth",onClick:()=>navigate("pets")}),
      serviceButton({key:"community",eyebrow:"COMMUNITY",title:"Pet톡",desc:"다른 보호자들과 일상과 경험을 나눠보세요.",cls:"pg-flagship-service--community",onClick:()=>navigate("community")}),
      serviceButton({key:"nearby",eyebrow:"NEARBY",title:"내 주변 Pet",desc:"가까운 병원·미용·반려 시설을 찾아보세요.",cls:"pg-flagship-service--nearby",onClick:()=>navigate("nearby")})
    );
  }
  const anchor=home.querySelector(".dash-pet-spotlight")||home.querySelector(".dash-welcome");
  if(anchor&&anchor.nextElementSibling!==section)anchor.insertAdjacentElement("afterend",section);
  return section;
}

function buildExplore(home){
  let section=keepOne(home,".pg-flagship-explore");
  if(!section){
    section=document.createElement("section");
    section.className="pg-flagship-explore";
    section.innerHTML='<div class="pg-flagship-explore__head"><h2>가볍게 둘러보기</h2><span>EXPLORE</span></div><div class="pg-flagship-explore__grid"></div>';
    const grid=section.querySelector(".pg-flagship-explore__grid");
    [["petbti","PetBTI","◇"],["music","Pet음악","♫"],["saju","Pet사주","✦"]].forEach(([view,label,mark])=>{
      const btn=document.createElement("button");
      btn.type="button";btn.className="pg-flagship-explore__btn";
      btn.innerHTML=`<span><i aria-hidden="true">${mark}</i>${label}</span><em aria-hidden="true">›</em>`;
      btn.addEventListener("click",()=>navigate(view));
      grid.append(btn);
    });
  }
  const today=home.querySelector(".pg-approved-today");
  if(today&&today.nextElementSibling!==section)today.insertAdjacentElement("afterend",section);
  else if(!today){const services=home.querySelector(".pg-flagship-services");if(services&&services.nextElementSibling!==section)services.insertAdjacentElement("afterend",section);}
  return section;
}

function run(){
  const home=document.querySelector(HOME_SELECTOR);
  if(!home)return;
  home.classList.add("pg-flagship-home");
  buildServices(home);
  buildExplore(home);
}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;run();});}
function boot(){
  run();
  new MutationObserver(schedule).observe(document.getElementById("root")||document.body,{subtree:true,childList:true});
  window.addEventListener("petgrow:critical-ready",schedule);
  window.addEventListener("petgrow:navigate",()=>setTimeout(schedule,80));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
