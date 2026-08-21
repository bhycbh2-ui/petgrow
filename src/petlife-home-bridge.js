import "./petlife-home.css";

const HOME_ID="pg-petlife-home-dashboard";
const MY_ID="pg-petlife-my-pet-bridge";
const PET_KEY="petgrow_petlife_dashboard_pet_v1";
const IMPORT_KEY="petgrow_petlife_legacy_import_v2";
const TYPE_LABELS={weight:"몸무게",vaccine:"예방접종",hospital:"병원방문",medicine:"약",food:"사료",walk:"산책",bath:"목욕",grooming:"미용",photo:"사진",health:"건강기록"};
const TAB_LABELS={timeline:["기록"],schedule:["일정"],report:["리포트"],album:["성장앨범"]};

let booted=false;
let observer=null;
let renderRaf=0;
let loadPromise=null;
let intervalId=0;
const state={status:"idle",pets:[],petId:"",detail:null,error:"",loadedAt:0};

function make(tag,className,content){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(content!==undefined&&content!==null){
    if(Array.isArray(content))content.filter(Boolean).forEach(x=>node.append(x));
    else if(content instanceof Node)node.append(content);
    else node.textContent=String(content);
  }
  return node;
}
function makeButton(label,className,onClick){
  const btn=make("button",className,label);btn.type="button";btn.addEventListener("click",onClick);return btn;
}
function cleanText(node){return String(node?.textContent||"").replace(/\s+/g," ").trim();}
function isVisible(node){if(!node||!node.isConnected)return false;const style=getComputedStyle(node);if(style.display==="none"||style.visibility==="hidden")return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0;}
function localDateKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`;}
function dateKey(value){
  if(!value)return "";const s=String(value);const match=s.match(/^(\d{4}-\d{2}-\d{2})/);if(match)return match[1];
  const d=new Date(value);return Number.isNaN(d.getTime())?"":localDateKey(d);
}
function formatDate(value){const key=dateKey(value);if(!key)return "일정 없음";const [y,m,d]=key.split("-");return `${Number(m)}.${Number(d)}`;}
function dDay(value){
  const key=dateKey(value);if(!key)return "";const now=new Date(`${localDateKey()}T00:00:00`);const target=new Date(`${key}T00:00:00`);const diff=Math.round((target-now)/86400000);
  if(diff===0)return "오늘";return diff>0?`D-${diff}`:`D+${Math.abs(diff)}`;
}
function safePhoto(value){const s=String(value||"").trim();return /^https:\/\//i.test(s)?s:"";}
function formatWeight(value){const n=Number(value);return Number.isFinite(n)&&n>0?`${n.toFixed(n<10?2:1).replace(/0+$/,'').replace(/\.$/,'')}kg`:"기록 필요";}
function formatDelta(value){const n=Number(value);if(!Number.isFinite(n))return "30일 변화 기록 필요";if(Math.abs(n)<0.005)return "30일 변화 없음";return `30일 ${n>0?"+":""}${n.toFixed(2)}kg`;}

async function petApi(action,{method="GET",body,params={}}={}){
  const url=new URL("/api/petlife",location.origin);url.searchParams.set("action",action);Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=="")url.searchParams.set(k,String(v));});
  const options={method,credentials:"same-origin",headers:{}};if(body!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(body);}
  const response=await fetch(url,options);const payload=await response.json().catch(()=>({}));
  if(!response.ok){const err=new Error(payload.error||"PetLife 정보를 불러오지 못했어요.");err.status=response.status;throw err;}return payload;
}

function getSelectedPet(pets){
  let saved="";try{saved=localStorage.getItem(PET_KEY)||"";}catch{}
  return pets.find(p=>p.id===saved)||pets.find(p=>p.id===state.petId)||pets[0]||null;
}
async function loadDetails(petId){
  const [entries,report,album]=await Promise.all([
    petApi("entries",{params:{petId,limit:120}}),
    petApi("report",{params:{petId,days:30}}),
    petApi("album",{params:{petId}})
  ]);
  return {entries:entries.entries||[],upcoming:entries.upcoming||[],report,album};
}
async function loadDashboard(force=false){
  if(loadPromise)return loadPromise;
  if(!force&&state.loadedAt&&Date.now()-state.loadedAt<30000)return;
  state.status="loading";state.error="";scheduleRender();
  loadPromise=(async()=>{
    try{
      let result=await petApi("pets");let pets=result.pets||[];
      if(!pets.length){
        let attempted=false;try{attempted=sessionStorage.getItem(IMPORT_KEY)==="1";}catch{}
        if(!attempted){try{sessionStorage.setItem(IMPORT_KEY,"1");}catch{};try{const migrated=await petApi("import-legacy",{method:"POST",body:{}});pets=migrated.pets||[];}catch{}}
      }
      state.pets=pets;
      const selected=getSelectedPet(pets);state.petId=selected?.id||"";
      if(selected){try{localStorage.setItem(PET_KEY,selected.id);}catch{};state.detail=await loadDetails(selected.id);}else state.detail=null;
      state.status="ready";state.loadedAt=Date.now();
    }catch(error){
      state.error=error.message||"PetLife 정보를 불러오지 못했어요.";state.status=error.status===401?"unauth":"error";state.detail=null;state.loadedAt=Date.now();
    }finally{loadPromise=null;scheduleRender();}
  })();
  return loadPromise;
}
async function selectPet(petId){
  if(!petId||petId===state.petId)return;state.petId=petId;state.status="loading";state.error="";try{localStorage.setItem(PET_KEY,petId);}catch{};scheduleRender();
  try{state.detail=await loadDetails(petId);state.status="ready";state.loadedAt=Date.now();}catch(error){state.error=error.message||"우리 아이 기록을 불러오지 못했어요.";state.status=error.status===401?"unauth":"error";}scheduleRender();
}

function petLifeRoot(){return document.getElementById("petlife-react-root")||document;}
function clickMatching(selector,terms,attempt=0){
  const root=petLifeRoot();const nodes=[...root.querySelectorAll(selector)];const target=nodes.find(node=>terms.some(term=>cleanText(node)===term||cleanText(node).includes(term)));
  if(target){target.click();return true;}if(attempt<12){setTimeout(()=>clickMatching(selector,terms,attempt+1),120);}return false;
}
function openPetLife(tab="timeline",category=""){
  const openAlready=!!document.querySelector("#petlife-react-root .pl-backdrop");
  const launcher=document.querySelector("#petlife-react-root .pl-launcher");
  if(!openAlready){if(launcher)launcher.click();else{setTimeout(()=>openPetLife(tab,category),120);return;}}
  setTimeout(()=>{
    clickMatching("#petlife-react-root .pl-tabs button",TAB_LABELS[tab]||TAB_LABELS.timeline);
    if(category){setTimeout(()=>clickMatching("#petlife-react-root .pl-quicktypes button",[TYPE_LABELS[category]||category]),140);}
  },120);
}

function selectedPet(){return state.pets.find(p=>p.id===state.petId)||state.pets[0]||null;}
function summary(){
  const pet=selectedPet(),detail=state.detail;if(!pet||!detail)return null;
  const today=localDateKey();const walks=detail.entries.filter(e=>e.category==="walk"&&dateKey(e.occurredOn)===today);const walkMinutes=walks.reduce((sum,e)=>sum+(Number(e.durationMinutes)||0),0);
  const upcoming=detail.upcoming||[];const nextVaccine=upcoming.find(e=>e.category==="vaccine")||upcoming[0]||null;
  const report=detail.report||{};const weights=Array.isArray(report.weights)?report.weights:[];const recentWeight=weights.length?weights[weights.length-1].kg:null;const weight=pet.weightKg??recentWeight;
  const photos=Array.isArray(detail.album?.photos)?detail.album.photos:[];const recentPhoto=photos.length?photos[photos.length-1]:null;const photoUrl=safePhoto(recentPhoto?.photoUrl)||safePhoto(pet.photoUrl);
  return {pet,walks,walkMinutes,nextVaccine,report,weight,photoUrl,recentPhoto};
}

function statCard(icon,label,value,sub,actionLabel,onAction,extraClass=""){
  const card=make("article",`pgh-stat ${extraClass}`.trim());const top=make("div","pgh-stat-top");top.append(make("span","pgh-stat-icon",icon),make("small","",label));card.append(top,make("strong","",value),make("p","",sub));
  if(actionLabel)card.append(makeButton(actionLabel,"pgh-linkbtn",onAction));return card;
}
function renderLoading(root,title="오늘의 우리 아이 관리"){
  root.replaceChildren();const shell=make("div","pgh-loading");shell.append(make("div","pgh-loading-mark","🐾"),make("div","",[make("b","",title),make("span","","PetLife 기록을 불러오는 중…")]));root.append(shell);
}
function renderEmpty(root){
  root.replaceChildren();const wrap=make("div","pgh-empty");wrap.append(make("span","pgh-empty-icon","🐾"),make("div","pgh-empty-copy",[make("small","","PETLIFE · START"),make("h2","","우리 아이의 평생기록을 시작해 보세요"),make("p","","한 번 등록하면 체중, 접종, 병원, 산책, 사진과 건강기록이 하나의 시간축으로 이어집니다.")]),makeButton("우리 아이 등록","pgh-primary",()=>openPetLife("timeline")));root.append(wrap);
}
function renderError(root){root.replaceChildren();const box=make("div","pgh-error");box.append(make("b","","PetLife 정보를 불러오지 못했어요"),make("span","",state.error||"잠시 후 다시 확인해 주세요."),makeButton("다시 불러오기","pgh-secondary",()=>loadDashboard(true)));root.append(box);}
function renderHome(root){
  if(state.status==="loading"||state.status==="idle"){renderLoading(root);return;}if(state.status==="error"){renderError(root);return;}if(state.status==="unauth"){root.remove();return;}if(!state.pets.length){renderEmpty(root);return;}
  const s=summary();if(!s){renderLoading(root);return;}root.replaceChildren();
  const shell=make("div","pgh-shell");
  const head=make("header","pgh-head");const identity=make("div","pgh-identity");
  if(s.photoUrl){const img=make("img","pgh-avatar");img.src=s.photoUrl;img.alt=`${s.pet.name} 사진`;identity.append(img);}else identity.append(make("div","pgh-avatar pgh-avatar-placeholder",s.pet.species==="cat"?"🐱":"🐶"));
  const copy=make("div","pgh-headcopy");copy.append(make("small","","PETLIFE · TODAY"),make("h2","",`${s.pet.name} 오늘 관리`),make("p","","오늘 챙길 것과 최근 기록을 한눈에 확인하세요."));identity.append(copy);head.append(identity);
  const headActions=make("div","pgh-head-actions");
  if(state.pets.length>1){const label=make("label","pgh-pet-switch");label.append(make("span","","아이 선택"));const select=make("select");state.pets.forEach(p=>{const option=make("option","",p.name);option.value=p.id;option.selected=p.id===s.pet.id;select.append(option);});select.addEventListener("change",e=>selectPet(e.target.value));label.append(select);headActions.append(label);}
  headActions.append(makeButton("PetLife 전체보기","pgh-primary",()=>openPetLife("timeline")));head.append(headActions);shell.append(head);

  const grid=make("div","pgh-stat-grid");const delta=formatDelta(s.report?.weightDelta);
  grid.append(
    statCard("⚖️","현재 체중",formatWeight(s.weight),delta,"몸무게 기록",()=>openPetLife("timeline","weight"),"pgh-weight"),
    statCard("💉",s.nextVaccine?.category==="vaccine"?"다음 예방접종":"다음 건강일정",s.nextVaccine?dDay(s.nextVaccine.nextDueOn):"일정 없음",s.nextVaccine?`${s.nextVaccine.title} · ${formatDate(s.nextVaccine.nextDueOn)}`:"접종·병원·약 일정을 등록해 보세요.","일정 보기",()=>openPetLife("schedule"),"pgh-schedule"),
    statCard("🐕","오늘 산책",s.walks.length?`${s.walks.length}회 · ${s.walkMinutes}분`:"아직 기록 없음",s.walks.length?"오늘의 산책이 기록됐어요.":"산책 후 바로 남기면 생활패턴이 보여요.","산책 기록",()=>openPetLife("timeline","walk"),"pgh-walk")
  );
  const photo=make("article","pgh-stat pgh-photo");const photoTop=make("div","pgh-stat-top");photoTop.append(make("span","pgh-stat-icon","📷"),make("small","","최근 사진"));photo.append(photoTop);
  if(s.photoUrl){const img=make("img","pgh-recent-photo");img.src=s.photoUrl;img.alt=`${s.pet.name} 최근 사진`;photo.append(img,make("p","",s.recentPhoto?`${formatDate(s.recentPhoto.occurredOn)} 기록`:"프로필 사진"));}else photo.append(make("div","pgh-photo-empty","첫 사진을 남겨보세요"),make("p","","사진이 쌓이면 성장앨범이 자동으로 정리돼요."));photo.append(makeButton("성장앨범","pgh-linkbtn",()=>openPetLife("album")));grid.append(photo);shell.append(grid);

  const insight=make("div","pgh-report-preview");const insightCopy=make("div","");insightCopy.append(make("small","","30-DAY CARE REPORT"),make("b","",`이번 달 ${s.pet.name} 관리 리포트`),make("p","",s.report?.insights?.[0]||"기록이 쌓이면 체중 변화와 생활패턴 관리 포인트를 보여드려요."));insight.append(make("span","pgh-report-icon","📊"),insightCopy,makeButton("리포트 보기","pgh-secondary",()=>openPetLife("report")));shell.append(insight);

  const quick=make("div","pgh-quick-actions");quick.append(makeButton("＋ 몸무게","",()=>openPetLife("timeline","weight")),makeButton("＋ 산책","",()=>openPetLife("timeline","walk")),makeButton("＋ 건강기록","",()=>openPetLife("timeline","health")),makeButton("＋ 사진","",()=>openPetLife("timeline","photo")));shell.append(quick,make("p","pgh-disclaimer","PetGrow는 기록 기반 일반 관리 정보를 제공합니다. 의료적 진단이나 치료 지시를 대신하지 않습니다."));root.append(shell);
}

function homeElement(){const home=document.querySelector(".petgrow-dashboard-home");return home&&isVisible(home)?home:null;}
function findMyPetHeading(){
  const candidates=[...document.querySelectorAll("#root h1,#root h2,#root h3")];return candidates.find(node=>{if(!isVisible(node)||node.closest(".petgrow-dashboard-home,#petlife-react-root,#pg-petlife-home-dashboard,#pg-petlife-my-pet-bridge"))return false;const t=cleanText(node).replace(/\s+/g,"").toLowerCase();return t==="우리아이"||t==="mypet";})||null;
}
function ensureHome(){
  const home=homeElement();if(!home)return false;if(state.status==="unauth")return true;
  let root=home.querySelector(`#${HOME_ID}`);if(!root){root=make("section","pgh-home-dashboard");root.id=HOME_ID;root.setAttribute("aria-label","오늘의 우리 아이 관리");const quick=home.querySelector(".dash-quick-grid")?.closest(".dash-section");if(quick)home.insertBefore(root,quick);else home.prepend(root);}renderHome(root);return true;
}
function renderMyPet(root){
  if(state.status==="loading"||state.status==="idle"){root.replaceChildren(make("span","pgmypet-icon","🐾"),make("div","pgmypet-copy",[make("b","","PetLife 평생기록"),make("p","","우리 아이의 기록을 연결하는 중…")]));return;}
  if(state.status==="unauth"){root.remove();return;}root.replaceChildren();const s=summary();const icon=make("span","pgmypet-icon","🐾");const copy=make("div","pgmypet-copy");copy.append(make("small","","PETLIFE"),make("b","","평생기록"),make("p","",s?`${s.pet.name}의 체중 · 접종 · 병원 · 산책 · 사진을 이 프로필과 함께 관리해요.`:"우리 아이를 등록하면 성장과 건강 관리 기록이 한곳에 이어집니다."));const actions=make("div","pgmypet-actions");actions.append(makeButton(s?"기록 보기":"PetLife 시작","pgh-primary",()=>openPetLife("timeline")));if(s){actions.append(makeButton("일정","pgh-secondary",()=>openPetLife("schedule")),makeButton("리포트","pgh-secondary",()=>openPetLife("report")));}root.append(icon,copy,actions);
}
function ensureMyPet(){
  const heading=findMyPetHeading();if(!heading)return false;if(state.status==="unauth")return true;let root=document.getElementById(MY_ID);if(!root||!root.isConnected){root=make("aside","pgmypet-life-strip");root.id=MY_ID;heading.insertAdjacentElement("afterend",root);}renderMyPet(root);return true;
}
function surfacePresent(){return !!homeElement()||!!findMyPetHeading();}
function run(){const home=ensureHome(),my=ensureMyPet();if((home||my)&&state.status==="idle")loadDashboard(false);}
function scheduleRender(){if(renderRaf)return;renderRaf=requestAnimationFrame(()=>{renderRaf=0;run();});}

function bootPetLifeHomeBridge(){
  if(booted||typeof document==="undefined")return;booted=true;
  const root=document.getElementById("root")||document.body;observer=new MutationObserver(scheduleRender);observer.observe(root,{subtree:true,childList:true});
  window.addEventListener("petgrow:navigate",()=>setTimeout(scheduleRender,60));
  window.addEventListener("focus",()=>{if(surfacePresent())loadDashboard(Date.now()-state.loadedAt>30000);});
  document.addEventListener("click",event=>{const btn=event.target?.closest?.("#petlife-react-root button");if(!btn)return;const label=cleanText(btn);if(/저장|삭제/.test(label))setTimeout(()=>{if(surfacePresent())loadDashboard(true);},900);},true);
  intervalId=window.setInterval(()=>{if(surfacePresent()&&state.status!=="loading")loadDashboard(false);},60000);
  scheduleRender();
}

export {bootPetLifeHomeBridge};
