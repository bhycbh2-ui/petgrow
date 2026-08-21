import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import {
  ensurePetLifeAutomationSchema,
  queueDueNotifications,
  getNotificationInbox,
  markNotificationRead,
  registerPushDevice,
  unregisterPushDevice,
  deliverQueuedNotifications,
  generateMonthlyReportForPet,
  getMonthlyReports,
  getPetLifeServerStats,
  isFcmConfigured
} from "../server_lib/petlifeAutomation.js";

const text=(v,max=500)=>String(v??"").trim().slice(0,max);

async function ownedPet(userId,petId){
  const {rows}=await sql`select id,name from pg_pets where id=${petId} and user_id=${userId}`;
  return rows[0]||null;
}

export default async function handler(req,res){
  try{
    await ensurePetLifeAutomationSchema();
    const userId=getSessionUserId(req);
    if(!userId)return res.status(401).json({error:"로그인 후 PetLife 서버 기능을 이용할 수 있어요."});
    const mode=text(req.query?.mode||"status",40);

    if(mode==="status"&&req.method==="GET"){
      const {rows:counts}=await sql`
        select
          (select count(*)::int from pg_pets where user_id=${userId}) pets,
          (select count(*)::int from pg_pet_life_entries where user_id=${userId}) records,
          (select count(*)::int from pg_pet_life_entries where user_id=${userId} and next_due_on between current_date and current_date+7) upcoming7d,
          (select count(*)::int from pg_petlife_notifications where user_id=${userId} and read_at is null and status<>'cancelled') unread,
          (select count(*)::int from pg_push_devices where user_id=${userId} and active=true) push_devices
      `;
      return res.status(200).json({ok:true,...counts[0],pushConfigured:isFcmConfigured(),storage:"vercel-postgres+blob"});
    }

    if(mode==="inbox"&&req.method==="GET"){
      await queueDueNotifications(userId);
      const notifications=await getNotificationInbox(userId,req.query?.limit||50);
      return res.status(200).json({notifications,unread:notifications.filter(n=>!n.readAt).length,pushConfigured:isFcmConfigured()});
    }

    if(mode==="read"&&req.method==="POST"){
      const notification=await markNotificationRead(userId,req.body?.notificationId);
      if(!notification)return res.status(404).json({error:"알림을 찾지 못했어요."});
      return res.status(200).json({ok:true,notification});
    }

    if(mode==="push-register"&&req.method==="POST"){
      const device=await registerPushDevice({userId,token:req.body?.token,platform:req.body?.platform||"android",deviceName:req.body?.deviceName||""});
      await queueDueNotifications(userId);
      const delivery=await deliverQueuedNotifications({userId,limit:20});
      return res.status(200).json({ok:true,device,delivery,pushConfigured:isFcmConfigured()});
    }

    if(mode==="push-unregister"&&req.method==="POST"){
      return res.status(200).json(await unregisterPushDevice({userId,token:req.body?.token}));
    }

    if(mode==="monthly-reports"&&req.method==="GET"){
      const petId=text(req.query?.petId,80);if(!(await ownedPet(userId,petId)))return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      let reports=await getMonthlyReports(userId,petId,req.query?.limit||12);
      if(!reports.length){
        await generateMonthlyReportForPet({userId,petId,force:false});
        reports=await getMonthlyReports(userId,petId,req.query?.limit||12);
      }
      return res.status(200).json({reports});
    }

    if(mode==="monthly-report-refresh"&&req.method==="POST"){
      const petId=text(req.body?.petId,80);if(!(await ownedPet(userId,petId)))return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      const report=await generateMonthlyReportForPet({userId,petId,month:req.body?.month,force:true});
      return res.status(200).json({ok:true,report:{id:report.id,month:String(report.report_month).slice(0,10),summary:report.summary||{},generatedAt:report.generated_at}});
    }

    if(mode==="server-stats"&&req.method==="GET"){
      // 일반 사용자는 전체 운영 통계를 볼 수 없으므로 자신의 서버화 상태만 반환합니다.
      const {rows}=await sql`select count(*)::int pets from pg_pets where user_id=${userId}`;
      return res.status(200).json({ok:true,pets:rows[0]?.pets||0,pushConfigured:isFcmConfigured()});
    }

    return res.status(405).json({error:"지원하지 않는 PetLife 서버 요청이에요."});
  }catch(error){
    const status=Number(error?.status)||500;
    console.error("petlife automation api",error);
    return res.status(status).json({error:error?.message||"PetLife 서버 요청을 처리하지 못했어요."});
  }
}

export { getPetLifeServerStats };
