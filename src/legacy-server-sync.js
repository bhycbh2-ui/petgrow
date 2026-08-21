let started=false;
const SAFE_KEY=/^(petgrow|petlife|pg_|pet_|pets?$|mypets?$|favorites?$|petbti|saju|growth|profile|settings)/i;
const BLOCKED_KEY=/(token|secret|password|passwd|session|cookie|authorization|admin|pin|oauth|credential|private[_-]?key)/i;

function parseValue(value){
  if(value==null)return null;
  try{return JSON.parse(value);}catch{return value;}
}
function collectSafeState(){
  const state={};let bytes=0;
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||"";
      if(!SAFE_KEY.test(key)||BLOCKED_KEY.test(key))continue;
      const raw=localStorage.getItem(key);
      if(raw==null||raw.length>50000)continue;
      bytes+=raw.length;
      if(bytes>350000)break;
      state[key]=parseValue(raw);
    }
  }catch{}
  return state;
}
async function request(method="GET",body){
  const r=await fetch("/api/legacy-state-import",{method,credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
  if(r.status===401)return null;
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"legacy sync failed");
  return j;
}
function restoreMissing(serverState){
  let restored=0;
  try{
    for(const [key,value] of Object.entries(serverState||{})){
      if(!SAFE_KEY.test(key)||BLOCKED_KEY.test(key)||localStorage.getItem(key)!=null)continue;
      localStorage.setItem(key,typeof value==="string"?value:JSON.stringify(value));
      restored++;
    }
  }catch{}
  if(restored)window.dispatchEvent(new CustomEvent("petgrow:legacy-restored",{detail:{restored}}));
  return restored;
}

export async function syncLegacyState(){
  try{
    const local=collectSafeState();
    if(Object.keys(local).length)await request("POST",{state:local});
    const server=await request("GET");
    if(server?.state)restoreMissing(server.state);
  }catch(e){console.warn("PetGrow legacy server sync",e?.message||e);}
}

export function bootLegacyServerSync(){
  if(started)return;started=true;
  window.setTimeout(()=>syncLegacyState(),6500);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")syncLegacyState();});
}

bootLegacyServerSync();
