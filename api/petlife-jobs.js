import {
  ensurePetLifeAutomationSchema,
  queueDueNotifications,
  deliverQueuedNotifications,
  generatePreviousMonthReports,
  getKstClock,
  isFcmConfigured
} from "../server_lib/petlifeAutomation.js";

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
    return res.status(200).json({ok:true,date:clock?.today,queue,monthly,push,pushConfigured:isFcmConfigured()});
  }catch(error){
    console.error("petlife jobs",error);
    return res.status(500).json({error:error?.message||"PetLife 자동화 작업을 처리하지 못했어요."});
  }
}
