import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole, roleCan, logAdmin } from "../server_lib/admin.js";
import { verifyLatestEncryptedBackup } from "../server_lib/backup.js";

let running=null;
let lastResult=null;
let lastCheckedAt=0;

function sameOrigin(req){
  const origin=String(req.headers?.origin||"");
  if(!origin)return true;
  try{
    const host=String(req.headers?.["x-forwarded-host"]||req.headers?.host||"").split(",")[0].trim().toLowerCase();
    return new URL(origin).host.toLowerCase()===host;
  }catch{return false;}
}
function publicVerification(value){
  if(!value||typeof value!=="object")return value;
  const {sha256,...safe}=value;
  return safe;
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"지원하지 않는 요청이에요."});
  if(!sameOrigin(req))return res.status(403).json({error:"허용되지 않은 요청이에요."});
  const uid=getSessionUserId(req);
  if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
  const role=await getAdminRole(uid);
  if(!role||!roleCan(role,"service"))return res.status(403).json({error:"서비스 운영 권한이 필요해요."});
  try{
    const now=Date.now();
    if(lastResult&&now-lastCheckedAt<60000)return res.status(200).json({...lastResult,cached:true});
    if(!running)running=verifyLatestEncryptedBackup().finally(()=>{running=null;});
    const verification=await running;
    const publicResult=publicVerification(verification);
    lastResult={ok:Boolean(verification?.verified),verification:publicResult};
    lastCheckedAt=Date.now();
    await logAdmin(uid,"backup_verify",null,null,{role,verified:Boolean(verification?.verified),reason:verification?.reason||null,pathname:verification?.pathname||null}).catch(error=>console.warn("backup verify audit",error?.message||error));
    if(!verification?.verified)return res.status(409).json(lastResult);
    return res.status(200).json(lastResult);
  }catch(error){
    await logAdmin(uid,"backup_verify_failed",null,null,{role,error:String(error?.message||error).slice(0,200)}).catch(()=>{});
    console.error("backup verification",error);
    return res.status(500).json({error:"최근 암호화 백업의 무결성을 검증하지 못했어요."});
  }
}
