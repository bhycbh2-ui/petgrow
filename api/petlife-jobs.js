import {
  ensurePetLifeAutomationSchema,
  queueDueNotifications,
  deliverQueuedNotifications,
  generatePreviousMonthReports,
  isFcmConfigured
} from "../server_lib/petlifeAutomation.js";
import { createEncryptedBackup, pruneEncryptedBackups, verifyEncryptedBackup } from "../server_lib/backup.js";

function cronAuthorized(req){
  const secret=String(process.env.CRON_SECRET||"");
  const auth=String(req.headers?.authorization||"");
  if(secret)return auth===`Bearer ${secret}`;
  const ua=String(req.headers?.["user-agent"]||"");
  return /^vercel-cron\/1\.0/i.test(ua);
}
function publicBackup(value){
  if(!value||typeof value!=="object")return value;
  const {url,plainSha256,sha256,...safe}=value;
  return safe;
}
function getKstClock(){
  const parts=new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Seoul",
    year:"numeric",
    month:"2-digit",
    day:"2-digit"
  }).formatToParts(new Date()).reduce((acc,part)=>{acc[part.type]=part.value;return acc;},{});
  const today=`${parts.year}-${parts.month}-${parts.day}`;
  return {today,day:Number(parts.day||0)};
}

export default async function handler(req,res){
  if(req.method!=="GET"&&req.method!=="POST")return res.status(405).json({error:"지원하지 않는 요청이에요."});
  if(!cronAuthorized(req))return res.status(401).json({error:"자동화 작업 인증이 필요해요."});
  try{
    await ensurePetLifeAutomationSchema();
    const clock=getKstClock();
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
        backupVerify=await verifyEncryptedBackup(backup);
        if(!backupVerify?.verified)throw new Error(backupVerify?.reason||"BACKUP_VERIFY_FAILED");
        // 방금 생성한 백업 자체를 복호화·검증한 뒤에만 오래된 백업을 정리합니다.
        backupPrune=await pruneEncryptedBackups();
      }
    }catch(error){
      console.error("scheduled backup verify",error);
      backup={...backup,error:String(error?.message||error).slice(0,300)};
      backupVerify={...backupVerify,verified:false,error:String(error?.message||error).slice(0,300)};
      backupPrune={skipped:true,reason:"NEW_BACKUP_NOT_VERIFIED"};
    }
    return res.status(200).json({ok:true,date:clock?.today,queue,monthly,push,backup:publicBackup(backup),backupVerify:publicBackup(backupVerify),backupPrune,pushConfigured:isFcmConfigured()});
  }catch(error){
    console.error("petlife jobs",error);
    return res.status(500).json({error:error?.message||"PetLife 자동화 작업을 처리하지 못했어요."});
  }
}