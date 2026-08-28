import "./home-approved-redesign-20260828.css";

const HOME_SELECTOR=".petgrow-dashboard-home";
const PETLIFE_HOME_ID="pg-petlife-home-dashboard";
let raf=0;

const ROUTES=[
  ["pets",["우리아이","우리 아이","my pet","성장기록"]],
  ["community",["pet톡","pettalk","pet talk"]],
  ["nearby",["내주변pet","내 주변 pet","nearby pet"]],
  ["petbti",["petbti"]],
  ["saju",["pet사주","pet saju"]],
  ["tarot",["pet타로","pet tarot"]],
  ["music",["pet음악","pet music"]],
  ["tips",["pet정보","pet info"]],
];
const CORE_ORDER={pets:0,community:1,nearby:2,petbti:3};
const CORE_LABEL={pets:"성장기록",community:"Pet톡",nearby:"내 주변 Pet",petbti:"PetBTI"};
const ICONS={
  pets:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M7 15l3-4 3 2 4-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
  community:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18.5 3.8 21l3.3-1.1A9 9 0 1 0 5 18.5Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/></svg>',
  nearby:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/><circle cx="12" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  petbti:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20S4.5 15.7 4.5 9.6A4.1 4.1 0 0 1 12 7.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.7 12 20 12 20Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/><path d="M9 11.5h6M12 8.5v6" stroke="currentColor" stroke-linecap="round" stroke-width="1.6"/></svg>',
};
const FUN_ICONS={
  saju:'<svg viewBox="0 0 24 24"><path d="M4 17c4-6 7-8 16-10M5 8c5 1 9 4 13 10M8 4l1 3m7-4-1 3m5 6-3 1M4 13l3-1"/></svg>',
  tarot:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="11" height="15" rx="2"/><path d="m9 8 3 2-3 2 3 2"/><path d="M9 21h9a2 2 0 0 0 2-2V7"/></svg>',
  music:'<svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
};

function clean(value){return String(value||"").replace(/\s+/g," ").trim();}
function norm(value){return clean(value).replace(/\s+/g,"").toLowerCase();}
function viewFromLabel(value){const n=norm(value);for(const [view,labels] of ROUTES){if(labels.some(label=>n.includes(norm(label))))return view;}return "";}
function navigate(view){window.dispatchEvent(new CustomEvent("petgrow:navigate",{detail:view}));}
function petName(home){
  const raw=clean(home.querySelector(".dash-pet-copy h2")?.textContent)||clean(document.querySelector(`#${PETLIFE_HOME_ID} .pgh-headcopy h2`)?.textContent);
  const value=raw.replace(/\s*오늘\s*관리.*$/u,"").replace(/\s*관리.*$/u,"").trim();
  return value||"우리 아이";
}

function decorateQuick(home){
  const grid=home.querySelector(".dash-quick-grid");
  if(!grid)return null;
  const section=grid.closest(".dash-section");
  section?.classList.add("pg-approved-core-section");
  [...grid.querySelectorAll(":scope > button")].forEach(btn=>{
    const label=clean(btn.querySelector("span")?.textContent)||clean(btn.textContent);
    const view=viewFromLabel(label);
    if(view)btn.dataset.pgApprovedView=view;
    if(!(view in CORE_ORDER)){
      btn.removeAttribute("data-pg-approved-core");
      return;
    }
    btn.dataset.pgApprovedCore="1";
    btn.style.order=String(CORE_ORDER[view]);
    const icon=btn.querySelector("i");
    if(icon&&ICONS[view]&&icon.dataset.pgApprovedIcon!==view){icon.innerHTML=ICONS[view];icon.dataset.pgApprovedIcon=view;}
    const spans=[...btn.querySelectorAll("span")];
    const textSpan=spans.at(-1);
    if(textSpan&&clean(textSpan.textContent)!==CORE_LABEL[view])textSpan.textContent=CORE_LABEL[view];
    btn.setAttribute("aria-label",CORE_LABEL[view]);
  });
  return section;
}

function decorateInfo(home){
  const section=home.querySelector('[data-home-extra="petinfo"]');
  if(!section)return null;
  section.classList.add("pg-approved-info-section");
  const heading=section.querySelector(":scope > .dash-section-head h2");
  if(heading&&clean(heading.textContent)!=="알아두면 좋은 반려생활")heading.textContent="알아두면 좋은 반려생활";
  const more=section.querySelector(":scope > .dash-section-head button");
  if(more&&clean(more.textContent)!=="더보기")more.textContent="더보기";
  return section;
}

function buildToday(home,quickSection,infoSection){
  let section=home.querySelector(":scope > .pg-approved-today");
  if(!section){
    section=document.createElement("section");
    section.className="dash-section pg-approved-today";
    section.innerHTML='<div class="pg-approved-today-head"><h2 class="pg-approved-section-title">오늘의 PetGrow</h2></div><div class="pg-approved-today-card"><div class="pg-approved-today-icon" aria-hidden="true">♡</div><div class="pg-approved-today-copy"><small></small><b></b><p></p></div><button type="button" class="pg-approved-today-btn">확인하기 ›</button></div>';
    section.querySelector("button")?.addEventListener("click",()=>{
      const schedule=document.querySelector(`#${PETLIFE_HOME_ID} .pgh-schedule .pgh-linkbtn`);
      if(schedule){schedule.click();return;}
      navigate("pets");
    });
  }
  const scheduleRoot=document.querySelector(`#${PETLIFE_HOME_ID} .pgh-schedule`);
  const value=clean(scheduleRoot?.querySelector("strong")?.textContent);
  const detail=clean(scheduleRoot?.querySelector("p")?.textContent);
  const name=petName(home);
  const copy=section.querySelector(".pg-approved-today-copy");
  const eyebrow=copy?.querySelector("small"),title=copy?.querySelector("b"),desc=copy?.querySelector("p");
  const hasSchedule=value&&value!=="일정 없음";
  if(eyebrow)eyebrow.textContent=hasSchedule?`건강 일정 · ${value}`:"오늘의 케어";
  if(title)title.textContent=hasSchedule?(detail?`${detail.split("·")[0].trim()} 일정을 확인해 주세요`:`${name}의 다음 건강 일정을 확인해 주세요`):`${name}의 오늘 기록을 한 번 확인해 보세요`;
  if(desc)desc.textContent=hasSchedule?(detail||"예방접종·병원·약 일정을 미리 확인해 주세요."):"작은 기록이 쌓이면 우리 아이의 변화가 더 잘 보여요.";
  const btn=section.querySelector(".pg-approved-today-btn");if(btn)btn.textContent=hasSchedule?"일정 확인하기 ›":"기록 보기 ›";
  const anchor=infoSection||quickSection?.nextElementSibling;
  if(infoSection&&section.nextElementSibling!==infoSection)infoSection.insertAdjacentElement("beforebegin",section);
  else if(!infoSection&&quickSection&&quickSection.nextElementSibling!==section)quickSection.insertAdjacentElement("afterend",section);
  return section;
}

function buildFun(home,infoSection,todaySection){
  let section=home.querySelector(":scope > .pg-approved-fun");
  if(!section){
    section=document.createElement("section");
    section.className="dash-section pg-approved-fun";
    section.innerHTML='<div class="pg-approved-fun-head"><h2 class="pg-approved-section-title">오늘의 재미 한 스푼</h2></div><div class="pg-approved-fun-grid"></div>';
    const grid=section.querySelector(".pg-approved-fun-grid");
    [["saju","Pet사주"],["tarot","Pet타로"],["music","Pet음악"]].forEach(([view,label])=>{
      const btn=document.createElement("button");btn.type="button";btn.className="pg-approved-fun-btn";btn.dataset.view=view;
      btn.innerHTML=`${FUN_ICONS[view]}<span>${label}</span><em>›</em>`;
      btn.addEventListener("click",()=>navigate(view));grid.append(btn);
    });
  }
  if(infoSection&&infoSection.nextElementSibling!==section)infoSection.insertAdjacentElement("afterend",section);
  else if(!infoSection&&todaySection&&todaySection.nextElementSibling!==section)todaySection.insertAdjacentElement("afterend",section);
  return section;
}

function simplify(home,kept){
  home.querySelectorAll(".dash-section").forEach(section=>{
    const keep=kept.includes(section)||section.classList.contains("pg-approved-today")||section.classList.contains("pg-approved-fun");
    section.classList.toggle("pg-approved-home-deprioritized",!keep);
  });
  const petlife=document.getElementById(PETLIFE_HOME_ID);
  petlife?.classList.add("pg-approved-home-hidden-petlife");
  home.querySelectorAll(".dash-widget-grid").forEach(node=>node.classList.add("pg-home-duplicate-widget-grid"));
}

function run(){
  const home=document.querySelector(HOME_SELECTOR);
  if(!home){document.getElementById(PETLIFE_HOME_ID)?.classList.remove("pg-approved-home-hidden-petlife");return;}
  home.classList.add("pg-approved-home-v1");
  const quick=decorateQuick(home);
  const info=decorateInfo(home);
  const today=buildToday(home,quick,info);
  const fun=buildFun(home,info,today);
  simplify(home,[quick,info,today,fun].filter(Boolean));
}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;run();});}
function boot(){run();new MutationObserver(schedule).observe(document.getElementById("root")||document.body,{subtree:true,childList:true});window.addEventListener("petgrow:critical-ready",schedule);window.addEventListener("petgrow:navigate",()=>setTimeout(schedule,80));}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
