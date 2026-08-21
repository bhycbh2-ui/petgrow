import {
  ensurePetLifeAutomationSchema,
  queueDueNotifications,
  deliverQueuedNotifications,
  generatePreviousMonthReports,
  getKstClock,
  isFcmConfigured
} from "../server_lib/petlifeAutomation.js";
import { createEncryptedBackup, pruneEncryptedBackups, verifyLatestEncryptedBackup } from "../server_lib/backup.js";

function cronAuthorized(req){
  const secret=String(process.env.CRON_SECRET||"");
  const auth=String(req.headers?.authorization||"");
  if(secret)return auth===`Bearer ${secret}`;
  const ua=String(req.headers?.["user-agent"]||"");
  return /^vercel-cron\/1\.0/i.test(ua);
}

export default async function handler(req,res){
  if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({error:"지원하지 않는 요청이에요."});
  if(!cronAuthorized(req))return res.status(401).json({error:"자동화 작업 인증이 필요해요."});
  try{
    await ensurePetLifeAutomationSchema();
    const clock=await getKstClock();
    const queue=await queueDueNotifications();
    let monthly={skipped:true};
    // 1일 크론이 잠시 실패해도 2~3일에 자동 복구되도록 3일까지 idempotent upsert 합니다.
    if(Number(clock?.day||0)<=3)monthly=await generatePreviousMonthReports();
    const push=await deliverQueuedNotifications({limit:200});
    let backup={skipped:true};
    let backupVerify={skipped:true};
    let backupPrune={skipped:true};
    try{
      backup=await createEncryptedBackup();
      if(backup?.created){
        backupVerify=await verifyLatestEncryptedBackup();
        if(!backupVerify?.verified)throw new Error(backupVerify?.reason||"BACKUP_VERIFY_FAILED");
        // 새 백업을 실제로 복호화·검증한 뒤에만 오래된 백업을 정리합니다.
        backupPrune=await pruneEncryptedBackups();
      }
    }catch(error){
      console.error("scheduled backup verify",error);
      backup={...backup,error:String(error?.message||error).slice(0,300)};
      backupVerify={...backupVerify,verified:false,error:String(error?.message||error).slice(0,300)};
      backupPrune={skipped:true,reason:"NEW_BACKUP_NOT_VERIFIED"};
    }
    return res.status(200).json({ok:true,date:clock?.today,queue,monthly,push,backup,backupVerify,backupPrune,pushConfigured:isFcmConfigured()});
  }catch(error){
    console.error("petlife jobs",error);
    return res.status(500).json({error:error?.message||"PetLife 자동화 작업을 처리하지 못했어요."});
  }
}
