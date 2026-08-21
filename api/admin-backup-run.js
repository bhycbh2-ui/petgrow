import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole, roleCan, logAdmin } from "../server_lib/admin.js";
import { createEncryptedBackup, pruneEncryptedBackups, getBackupStatus, verifyEncryptedBackup, verifyLatestEncryptedBackup } from "../server_lib/backup.js";

let running=null;

function sameOrigin(req){
  const origin=String(req.headers?.origin||"");
  if(!origin)return true;
  try{
    const host=String(req.headers?.["x-forwarded-host"]||req.headers?.host||"").split(",")[0].trim().toLowerCase();
    return new URL(origin).host.toLowerCase()===host;
  }catch{return false;}
}

async function runOnce(){
  const before=await getBackupStatus();
  if(before.configured&&before.lastBackupAgeHours!=null&&before.lastBackupAgeHours<0.15){
    const verification=await verifyLatestEncryptedBackup().catch(error=>({verified:false,error:String(error?.message||error).slice(0,200)}));
    return {ok:true,skipped:true,reason:"RECENT_BACKUP",backup:before,verification,prune:null};
  }
  const backup=await createEncryptedBackup();
  if(!backup.created)return {ok:false,skipped:true,reason:backup.reason||"BACKUP_NOT_CONFIGURED",backup,verification:null,prune:null};
  const verification=await verifyEncryptedBackup(backup);
  if(!verification.verified)throw new Error(verification.reason||"BACKUP_VERIFY_FAILED");
  const prune=await pruneEncryptedBackups();
  return {ok:true,backup,verification,prune,status:await getBackupStatus()};
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"지원하지 않는 요청이에요."});
  if(!sameOrigin(req))return res.status(403).json({error:"허용되지 않은 요청이에요."});
  const uid=getSessionUserId(req);
  if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
  const role=await getAdminRole(uid);
  if(!role||!roleCan(role,"service"))return res.status(403).json({error:"서비스 운영 권한이 필요해요."});
  try{
    if(!running)running=runOnce().finally(()=>{running=null;});
    const result=await running;
    await logAdmin(uid,"backup_run",null,null,{role,ok:result?.ok!==false,skipped:Boolean(result?.skipped),reason:result?.reason||null,verified:Boolean(result?.verification?.verified),pathname:result?.verification?.pathname||result?.backup?.pathname||null}).catch(error=>console.warn("backup audit",error?.message||error));
    if(result?.ok===false&&result?.skipped)return res.status(409).json(result);
    return res.status(200).json(result);
  }catch(error){
    await logAdmin(uid,"backup_run_failed",null,null,{role,error:String(error?.message||error).slice(0,200)}).catch(()=>{});
    console.error("manual encrypted backup",error);
    return res.status(500).json({error:"암호화 백업을 실행하거나 검증하지 못했어요."});
  }
}
