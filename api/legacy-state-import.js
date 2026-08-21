import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { ensureSchema } from "../server_lib/db.js";

const SAFE_KEY=/^(petgrow|petlife|pg_|pet_|pets?$|mypets?$|favorites?$|petbti|saju|growth|profile|settings)/i;
const BLOCKED_KEY=/(token|secret|password|passwd|session|cookie|authorization|admin|pin|oauth|credential|private[_-]?key)/i;
const MAX_KEYS=80;
const MAX_TOTAL=400000;

function safeKey(value){
  const k=String(value||"").trim().slice(0,100);
  return k&&SAFE_KEY.test(k)&&!BLOCKED_KEY.test(k)?k:"";
}
function cleanValue(value,depth=0){
  if(depth>6)return null;
  if(value==null||typeof value==="boolean"||typeof value==="number")return value;
  if(typeof value==="string")return value.length<=50000?value:value.slice(0,50000);
  if(Array.isArray(value))return value.slice(0,500).map(v=>cleanValue(v,depth+1));
  if(typeof value==="object"){
    const out={};let count=0;
    for(const [key,item] of Object.entries(value)){
      if(count>=250)break;
      const safe=String(key||"").slice(0,120);
      if(!safe||BLOCKED_KEY.test(safe))continue;
      out[safe]=cleanValue(item,depth+1);count++;
    }
    return out;
  }
  return String(value).slice(0,50000);
}

export default async function handler(req,res){
  try{
    await ensureSchema();
    const userId=getSessionUserId(req);
    if(!userId)return res.status(401).json({error:"로그인이 필요해요."});

    if(req.method==="GET"){
      const {rows}=await sql`select key,value,updated_at from pg_user_state where user_id=${userId} and key like 'legacy:%' order by updated_at desc limit ${MAX_KEYS}`;
      const state={};
      for(const row of rows){state[String(row.key).slice(7)]=row.value;}
      return res.status(200).json({ok:true,state,count:Object.keys(state).length});
    }

    if(req.method==="POST"){
      const incoming=req.body?.state&&typeof req.body.state==="object"?req.body.state:{};
      const entries=[];let total=0;
      for(const [rawKey,rawValue] of Object.entries(incoming)){
        if(entries.length>=MAX_KEYS)break;
        const key=safeKey(rawKey);if(!key)continue;
        const value=cleanValue(rawValue);
        const serialized=JSON.stringify(value);
        const size=Buffer.byteLength(serialized||"","utf8");
        if(total+size>MAX_TOTAL)break;
        total+=size;
        entries.push([key,value]);
      }
      for(const [key,value] of entries){
        const dbKey=`legacy:${key}`;
        await sql`
          insert into pg_user_state(user_id,key,value,updated_at)
          values(${userId},${dbKey},${JSON.stringify(value)}::jsonb,now())
          on conflict(user_id,key) do update set value=excluded.value,updated_at=now()
        `;
      }
      return res.status(200).json({ok:true,stored:entries.length,bytes:total});
    }

    return res.status(405).json({error:"지원하지 않는 요청이에요."});
  }catch(error){
    console.error("legacy state import",error);
    return res.status(500).json({error:"기존 데이터를 서버에 동기화하지 못했어요."});
  }
}
