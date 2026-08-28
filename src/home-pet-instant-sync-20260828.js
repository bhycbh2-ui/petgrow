const HOME_SELECTOR=".petgrow-dashboard-home";
const SELECTED_PET_KEY="petgrow_petlife_dashboard_pet_v1";
const SNAPSHOT_KEY="petgrow_home_pet_snapshot_session_v1";

let currentPet=null;
let inFlight=null;
let lastFetchAt=0;
let emptyHits=0;
let retryTimer=0;
let mutationRaf=0;

function clean(value){return String(value||"").replace(/\s+/g," ").trim();}
function safePhoto(value){const s=clean(value);return /^https:\/\//i.test(s)?s:"";}
function selectedId(){try{return localStorage.getItem(SELECTED_PET_KEY)||"";}catch{return "";}}
function choosePet(pets){const id=selectedId();return pets.find(p=>p.id===id)||pets[0]||null;}
function petSummary(pet){
  const parts=[];
  if(pet?.breed)parts.push(clean(pet.breed));
  else if(pet?.species==="cat")parts.push("고양이");
  else if(pet?.species)parts.push("강아지");
  if(pet?.birthDate){const d=String(pet.birthDate).slice(0,10).replace(/-/g,".");if(d)parts.push(`${d} 출생`);}
  const weight=Number(pet?.weightKg);if(Number.isFinite(weight)&&weight>0)parts.push(`${weight.toFixed(weight<10?2:1).replace(/0+$/,'').replace(/\.$/,'')}kg`);
  return parts.join(" · ")||"등록된 우리 아이 정보를 불러왔어요.";
}
function saveSnapshot(pet){try{if(pet)sessionStorage.setItem(SNAPSHOT_KEY,JSON.stringify(pet));else sessionStorage.removeItem(SNAPSHOT_KEY);}catch{}}
function readSnapshot(){try{const raw=sessionStorage.getItem(SNAPSHOT_KEY);return raw?JSON.parse(raw):null;}catch{return null;}}
function clearPet(){currentPet=null;emptyHits=0;saveSnapshot(null);}

function hydrateHomePet(pet=currentPet){
  if(!pet)return false;
  const home=document.querySelector(HOME_SELECTOR);if(!home)return false;
  const card=home.querySelector(".dash-pet-spotlight");if(!card)return false;
  card.dataset.pgInstantPet=String(pet.id||pet.name||"ready");
  const copy=card.querySelector(".dash-pet-copy");
  const title=copy?.querySelector("h2");
  const eyebrow=copy?.querySelector(":scope > small");
  const desc=copy?.querySelector("p");
  const titleText=clean(title?.textContent);
  const emptyTitle=!titleText||/등록|추가|시작|프로필|정보.*입력|우리 아이를|우리 아이$/.test(titleText);
  if(title&&emptyTitle)title.textContent=clean(pet.name)||"우리 아이";
  if(eyebrow&&/등록|start|profile|my pet/i.test(clean(eyebrow.textContent)))eyebrow.textContent="MY PET";
  const descText=clean(desc?.textContent);
  if(desc&&(!descText||/등록|추가|입력|시작|프로필/.test(descText)))desc.textContent=petSummary(pet);
  const photo=safePhoto(pet.photoUrl);const image=card.querySelector(".dash-pet-photo img");
  if(photo&&image&&image.src!==photo)image.src=photo;
  const button=[...card.querySelectorAll("button,.bg-btn")].find(node=>/등록|추가|시작/.test(clean(node.textContent)));
  if(button)button.textContent="성장 기록 보기";
  try{window.dispatchEvent(new CustomEvent("petgrow:home-pet-hydrated",{detail:{pet}}));}catch{}
  return true;
}

function scheduleRetry(delay=700){
  clearTimeout(retryTimer);
  retryTimer=setTimeout(()=>refreshPets(true),delay);
}
async function fetchPetList(){
  const response=await fetch("/api/petlife?action=pets",{credentials:"same-origin",cache:"no-store"});
  const payload=await response.json().catch(()=>({}));
  if(response.status===401){clearPet();return {unauth:true,pets:[]};}
  if(!response.ok)throw new Error(payload.error||"우리 아이 정보를 불러오지 못했어요.");
  return {unauth:false,pets:Array.isArray(payload.pets)?payload.pets:[]};
}
async function refreshPets(force=false){
  const now=Date.now();
  if(inFlight)return inFlight;
  if(!force&&currentPet&&now-lastFetchAt<5000){hydrateHomePet();return currentPet;}
  lastFetchAt=now;
  inFlight=(async()=>{
    try{
      const result=await fetchPetList();if(result.unauth)return null;
      const pet=choosePet(result.pets);
      if(pet){
        emptyHits=0;currentPet=pet;saveSnapshot(pet);hydrateHomePet(pet);
        try{window.dispatchEvent(new CustomEvent("petgrow:petlife-pets-ready",{detail:{pets:result.pets,pet}}));}catch{}
        return pet;
      }
      emptyHits+=1;
      if(emptyHits<2){scheduleRetry(650);return currentPet;}
      clearPet();
      return null;
    }catch{return currentPet;}
    finally{inFlight=null;}
  })();
  return inFlight;
}

function scheduleHydrate(){
  if(mutationRaf)return;
  mutationRaf=requestAnimationFrame(()=>{mutationRaf=0;if(currentPet)hydrateHomePet(currentPet);});
}
function schedulePostMutationRefresh(){
  [180,650,1400].forEach(ms=>setTimeout(()=>refreshPets(true),ms));
}
function mutationIntent(target){
  const control=target?.closest?.("button,[role='button'],input[type='submit']");if(!control)return false;
  const label=clean(control.textContent||control.value);
  return /^(저장|등록|등록하기|완료|수정 완료|삭제)$/.test(label);
}

function boot(){
  const snapshot=readSnapshot();if(snapshot){currentPet=snapshot;hydrateHomePet(snapshot);}
  const root=document.getElementById("root")||document.body;
  if(root)new MutationObserver(scheduleHydrate).observe(root,{subtree:true,childList:true});
  document.addEventListener("click",event=>{if(mutationIntent(event.target))schedulePostMutationRefresh();},true);
  document.addEventListener("submit",()=>schedulePostMutationRefresh(),true);
  window.addEventListener("petgrow:critical-ready",()=>refreshPets(true));
  window.addEventListener("petgrow:navigate",event=>{
    const view=String(event?.detail||"");
    if(view==="home"||view==="pets"){setTimeout(()=>refreshPets(true),50);setTimeout(()=>refreshPets(true),700);}
  });
  window.addEventListener("focus",()=>{if(!currentPet||Date.now()-lastFetchAt>4000)refreshPets(true);});
  window.addEventListener("pageshow",()=>refreshPets(true));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&(!currentPet||Date.now()-lastFetchAt>4000))refreshPets(true);});
  setTimeout(()=>refreshPets(true),0);
  setTimeout(()=>refreshPets(true),900);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
