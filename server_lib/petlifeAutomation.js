import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { ensureAuthSchema } from "./db.js";

const REMINDER_LEADS=[7,3,1,0];
const REPORT_DISCLAIMER="PetGrow의 기록 기반 관리 정보이며 수의학적 진단이나 치료 지시가 아닙니다. 이상 증상이 있으면 수의사와 상담하세요.";
let schemaReady=null;
let fcmTokenCache={token:"",expiresAt:0};

const text=(v,max=500)=>String(v??"").trim().slice(0,max);
const dateOnly=(v)=>{const s=text(v,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:null;};
const monthOnly=(v)=>{const s=text(v,7);return /^\d{4}-\d{2}$/.test(s)?`${s}-01`:null;};
const id=()=>crypto.randomUUID();
const chunks=(arr,size)=>{const out=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out;};

export function isFcmConfigured(){
  return Boolean(process.env.FCM_PROJECT_ID&&process.env.FCM_CLIENT_EMAIL&&process.env.FCM_PRIVATE_KEY);
}

export async function ensurePetLifeAutomationSchema(){
  if(!schemaReady){
    schemaReady=(async()=>{
      await ensureAuthSchema();
      await sql`
        create table if not exists pg_pets (
          id text primary key,
          user_id text not null references pg_users(id) on delete cascade,
          legacy_key text,
          name text not null,
          species text not null default 'dog',
          breed text,
          birth_date date,
          sex text not null default 'unknown',
          current_weight_kg numeric(8,3),
          photo_url text,
          notes text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_pets_user on pg_pets(user_id,created_at)`;
      await sql`
        create table if not exists pg_pet_life_entries (
          id text primary key,
          pet_id text not null references pg_pets(id) on delete cascade,
          user_id text not null references pg_users(id) on delete cascade,
          category text not null,
          occurred_on date not null,
          title text not null,
          note text,
          weight_kg numeric(8,3),
          amount_text text,
          duration_minutes int,
          photo_url text,
          clinic_name text,
          next_due_on date,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_pet_life_due on pg_pet_life_entries(user_id,next_due_on) where next_due_on is not null`;
      await sql`
        create table if not exists pg_petlife_monthly_reports (
          id text primary key,
          user_id text not null references pg_users(id) on delete cascade,
          pet_id text not null references pg_pets(id) on delete cascade,
          report_month date not null,
          summary jsonb not null default '{}'::jsonb,
          generated_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique(pet_id,report_month)
        )
      `;
      await sql`create index if not exists idx_pg_petlife_reports_user on pg_petlife_monthly_reports(user_id,report_month desc)`;
      await sql`
        create table if not exists pg_petlife_notifications (
          id text primary key,
          user_id text not null references pg_users(id) on delete cascade,
          pet_id text not null references pg_pets(id) on delete cascade,
          entry_id text references pg_pet_life_entries(id) on delete cascade,
          kind text not null default 'schedule',
          title text not null,
          body text not null,
          due_on date,
          lead_days int not null default 0,
          status text not null default 'queued',
          read_at timestamptz,
          pushed_at timestamptz,
          push_attempted_at timestamptz,
          push_error text,
          created_at timestamptz not null default now()
        )
      `;
      await sql`create unique index if not exists uq_pg_petlife_notification_due on pg_petlife_notifications(entry_id,due_on,lead_days) where entry_id is not null`;
      await sql`create index if not exists idx_pg_petlife_notifications_user on pg_petlife_notifications(user_id,created_at desc)`;
      await sql`create index if not exists idx_pg_petlife_notifications_queue on pg_petlife_notifications(status,pushed_at,created_at)`;
      await sql`
        create table if not exists pg_push_devices (
          id text primary key,
          user_id text not null references pg_users(id) on delete cascade,
          token text not null unique,
          platform text not null default 'android',
          device_name text,
          active boolean not null default true,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          last_seen_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_push_devices_user on pg_push_devices(user_id,active,last_seen_at desc)`;
    })().catch(e=>{schemaReady=null;throw e;});
  }
  return schemaReady;
}

function reportInsights({counts,weightDelta,totalWalkMinutes,recordCount}){
  const insights=[];
  if(recordCount===0)insights.push("이번 달에는 아직 PetLife 기록이 없어요. 짧은 산책이나 몸무게 기록부터 남겨보세요.");
  if(weightDelta!=null){
    if(Math.abs(weightDelta)<0.05)insights.push("이번 달 체중은 큰 변화 없이 유지됐어요.");
    else insights.push(`이번 달 체중이 약 ${Math.abs(weightDelta).toFixed(2)}kg ${weightDelta>0?"증가":"감소"}했어요. 변화가 계속되면 기록과 함께 상태를 확인해 주세요.`);
  }else if(recordCount>0)insights.push("몸무게를 월 2회 이상 기록하면 월간 변화 추이를 더 정확하게 볼 수 있어요.");
  if((counts.hospital||0)+(counts.health||0)+(counts.medicine||0)>0)insights.push("건강·병원·약 기록이 있어요. 증상과 처방 메모를 함께 남기면 다음 진료 때 도움이 됩니다.");
  if(totalWalkMinutes>0)insights.push(`이번 달 기록된 산책 시간은 총 ${totalWalkMinutes}분이에요.`);
  return insights.slice(0,4);
}

export async function generateMonthlyReportForPet({userId,petId,month,force=false}){
  await ensurePetLifeAutomationSchema();
  const reportMonth=monthOnly(month)||dateOnly(month);
  let bounds;
  if(reportMonth){
    const {rows}=await sql`select ${reportMonth}::date start_day,(${reportMonth}::date+interval '1 month')::date end_day`;
    bounds=rows[0];
  }else{
    const {rows}=await sql`select date_trunc('month',(now() at time zone 'Asia/Seoul')-interval '1 month')::date start_day,date_trunc('month',(now() at time zone 'Asia/Seoul'))::date end_day`;
    bounds=rows[0];
  }
  const {rows:pets}=await sql`select * from pg_pets where id=${petId} and user_id=${userId}`;
  const pet=pets[0];
  if(!pet)return null;
  if(!force){
    const {rows:cached}=await sql`select * from pg_petlife_monthly_reports where pet_id=${petId} and user_id=${userId} and report_month=${bounds.start_day} limit 1`;
    if(cached[0])return cached[0];
  }
  const {rows}=await sql`select * from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} and occurred_on>=${bounds.start_day} and occurred_on<${bounds.end_day} order by occurred_on asc,created_at asc`;
  const counts={};
  for(const r of rows)counts[r.category]=(counts[r.category]||0)+1;
  const weights=rows.filter(r=>r.category==="weight"&&r.weight_kg!=null).map(r=>({date:r.occurred_on,kg:Number(r.weight_kg)}));
  const weightDelta=weights.length>=2?Number((weights[weights.length-1].kg-weights[0].kg).toFixed(3)):null;
  const totalWalkMinutes=rows.filter(r=>r.category==="walk"&&r.duration_minutes!=null).reduce((a,r)=>a+Number(r.duration_minutes||0),0);
  const healthRecords=(counts.health||0)+(counts.hospital||0)+(counts.medicine||0)+(counts.vaccine||0);
  const photoCount=rows.filter(r=>Boolean(r.photo_url)).length;
  const summary={
    month:String(bounds.start_day).slice(0,10),
    pet:{id:pet.id,name:pet.name,species:pet.species,breed:pet.breed||"",weightKg:pet.current_weight_kg==null?null:Number(pet.current_weight_kg)},
    recordCount:rows.length,counts,weights,weightDelta,totalWalkMinutes,healthRecords,photoCount,
    insights:reportInsights({counts,weightDelta,totalWalkMinutes,recordCount:rows.length}),
    disclaimer:REPORT_DISCLAIMER
  };
  const reportId=id();
  const {rows:saved}=await sql`
    insert into pg_petlife_monthly_reports(id,user_id,pet_id,report_month,summary)
    values(${reportId},${userId},${petId},${bounds.start_day},${JSON.stringify(summary)}::jsonb)
    on conflict(pet_id,report_month) do update set summary=excluded.summary,generated_at=now(),updated_at=now()
    returning *
  `;
  return saved[0];
}

export async function generatePreviousMonthReports(){
  await ensurePetLifeAutomationSchema();
  const {rows:pets}=await sql`select id,user_id from pg_pets order by created_at asc`;
  let generated=0;
  for(const group of chunks(pets,5)){
    const results=await Promise.allSettled(group.map(p=>generateMonthlyReportForPet({userId:p.user_id,petId:p.id,force:true})));
    generated+=results.filter(r=>r.status==="fulfilled"&&r.value).length;
  }
  return {pets:pets.length,generated};
}

function dueBody(petName,title,dueOn,leadDays){
  if(leadDays===0)return `${petName}의 ${title} 일정이 오늘이에요. PetLife에서 확인해 주세요.`;
  return `${petName}의 ${title} 일정이 ${leadDays}일 남았어요. (${dueOn})`;
}

export async function queueDueNotifications(userId=null){
  await ensurePetLifeAutomationSchema();
  await sql`
    update pg_petlife_notifications n set status='cancelled'
    from pg_pet_life_entries e
    where n.entry_id=e.id and n.status='queued' and n.pushed_at is null
      and (e.next_due_on is null or n.due_on<>e.next_due_on)
  `;
  const {rows}=userId
    ? await sql`select e.id entry_id,e.user_id,e.pet_id,e.title,e.next_due_on,p.name pet_name,(e.next_due_on-current_date)::int lead_days from pg_pet_life_entries e join pg_pets p on p.id=e.pet_id where e.user_id=${userId} and e.next_due_on is not null and (e.next_due_on-current_date)::int in (7,3,1,0) order by e.next_due_on asc`
    : await sql`select e.id entry_id,e.user_id,e.pet_id,e.title,e.next_due_on,p.name pet_name,(e.next_due_on-current_date)::int lead_days from pg_pet_life_entries e join pg_pets p on p.id=e.pet_id where e.next_due_on is not null and (e.next_due_on-current_date)::int in (7,3,1,0) order by e.next_due_on asc`;
  let queued=0;
  for(const r of rows){
    if(!REMINDER_LEADS.includes(Number(r.lead_days)))continue;
    const nid=id(),title=`${r.pet_name} PetLife 일정`,body=dueBody(r.pet_name,r.title,r.next_due_on,Number(r.lead_days));
    const result=await sql`
      insert into pg_petlife_notifications(id,user_id,pet_id,entry_id,kind,title,body,due_on,lead_days)
      values(${nid},${r.user_id},${r.pet_id},${r.entry_id},'schedule',${title},${body},${r.next_due_on},${Number(r.lead_days)})
      on conflict do nothing returning id
    `;
    if(result.rows[0])queued++;
  }
  return {candidates:rows.length,queued};
}

function b64url(value){return Buffer.from(value).toString("base64url");}
async function getFcmAccessToken(){
  if(!isFcmConfigured())return null;
  if(fcmTokenCache.token&&Date.now()<fcmTokenCache.expiresAt-60000)return fcmTokenCache.token;
  const now=Math.floor(Date.now()/1000);
  const header=b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const claim=b64url(JSON.stringify({iss:process.env.FCM_CLIENT_EMAIL,scope:"https://www.googleapis.com/auth/firebase.messaging",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));
  const unsigned=`${header}.${claim}`;
  const key=String(process.env.FCM_PRIVATE_KEY||"").replace(/\\n/g,"\n");
  const signature=crypto.sign("RSA-SHA256",Buffer.from(unsigned),key).toString("base64url");
  const jwt=`${unsigned}.${signature}`;
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.access_token)throw new Error(data.error_description||data.error||"FCM 인증 토큰을 발급하지 못했어요.");
  fcmTokenCache={token:data.access_token,expiresAt:Date.now()+Number(data.expires_in||3600)*1000};
  return fcmTokenCache.token;
}

async function sendFcm(deviceToken,notification){
  const accessToken=await getFcmAccessToken();
  if(!accessToken)return {ok:false,skipped:true,error:"FCM_NOT_CONFIGURED"};
  const endpoint=`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(process.env.FCM_PROJECT_ID)}/messages:send`;
  const payload={message:{token:deviceToken,notification:{title:notification.title,body:notification.body},data:{notificationId:notification.id,kind:notification.kind||"schedule",petId:notification.pet_id||"",entryId:notification.entry_id||"",dueOn:notification.due_on?String(notification.due_on).slice(0,10):""},android:{priority:"high",notification:{channel_id:"petlife_reminders",sound:"default"}}}};
  const response=await fetch(endpoint,{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));
  return {ok:response.ok,status:response.status,data,error:response.ok?"":text(data?.error?.message||"FCM_SEND_FAILED",800)};
}

export async function registerPushDevice({userId,token,platform="android",deviceName=""}){
  await ensurePetLifeAutomationSchema();
  const safeToken=text(token,4096);if(safeToken.length<20)throw Object.assign(new Error("푸시 토큰이 올바르지 않아요."),{status:400});
  const safePlatform=["android","ios","web"].includes(text(platform,20).toLowerCase())?text(platform,20).toLowerCase():"android";
  const {rows}=await sql`
    insert into pg_push_devices(id,user_id,token,platform,device_name,active)
    values(${id()},${userId},${safeToken},${safePlatform},${text(deviceName,120)||null},true)
    on conflict(token) do update set user_id=excluded.user_id,platform=excluded.platform,device_name=excluded.device_name,active=true,updated_at=now(),last_seen_at=now()
    returning id,platform,active,last_seen_at
  `;
  return rows[0];
}

export async function unregisterPushDevice({userId,token}){
  await ensurePetLifeAutomationSchema();
  await sql`update pg_push_devices set active=false,updated_at=now() where user_id=${userId} and token=${text(token,4096)}`;
  return {ok:true};
}

export async function deliverQueuedNotifications({userId=null,limit=100}={}){
  await ensurePetLifeAutomationSchema();
  if(!isFcmConfigured())return {pushConfigured:false,attempted:0,sent:0,failed:0};
  const max=Math.min(300,Math.max(1,Number(limit)||100));
  const {rows:notifications}=userId
    ? await sql`select * from pg_petlife_notifications where user_id=${userId} and status='queued' and pushed_at is null order by created_at asc limit ${max}`
    : await sql`select * from pg_petlife_notifications where status='queued' and pushed_at is null order by created_at asc limit ${max}`;
  let attempted=0,sent=0,failed=0;
  for(const n of notifications){
    const {rows:devices}=await sql`select id,token from pg_push_devices where user_id=${n.user_id} and active=true order by last_seen_at desc limit 5`;
    if(!devices.length)continue;
    attempted++;
    let anySuccess=false,lastError="";
    for(const d of devices){
      try{
        const result=await sendFcm(d.token,n);
        if(result.ok){anySuccess=true;continue;}
        lastError=result.error||`FCM_${result.status||"ERROR"}`;
        if(result.status===404||/UNREGISTERED|registration-token-not-registered/i.test(JSON.stringify(result.data||{})))await sql`update pg_push_devices set active=false,updated_at=now() where id=${d.id}`;
      }catch(e){lastError=text(e?.message||e,800);}
    }
    if(anySuccess){
      sent++;await sql`update pg_petlife_notifications set status='pushed',pushed_at=now(),push_attempted_at=now(),push_error=null where id=${n.id}`;
    }else{
      failed++;await sql`update pg_petlife_notifications set push_attempted_at=now(),push_error=${lastError||"FCM_SEND_FAILED"} where id=${n.id}`;
    }
  }
  return {pushConfigured:true,attempted,sent,failed};
}

export async function getNotificationInbox(userId,limit=50){
  await ensurePetLifeAutomationSchema();
  const max=Math.min(100,Math.max(1,Number(limit)||50));
  const {rows}=await sql`select n.*,p.name pet_name from pg_petlife_notifications n left join pg_pets p on p.id=n.pet_id where n.user_id=${userId} and n.status<>'cancelled' order by n.created_at desc limit ${max}`;
  return rows.map(r=>({id:r.id,kind:r.kind,title:r.title,body:r.body,petId:r.pet_id,petName:r.pet_name||"",entryId:r.entry_id,dueOn:r.due_on?String(r.due_on).slice(0,10):null,leadDays:Number(r.lead_days||0),status:r.status,readAt:r.read_at,pushedAt:r.pushed_at,createdAt:r.created_at}));
}

export async function markNotificationRead(userId,notificationId){
  await ensurePetLifeAutomationSchema();
  const {rows}=await sql`update pg_petlife_notifications set read_at=coalesce(read_at,now()) where id=${text(notificationId,80)} and user_id=${userId} returning id,read_at`;
  return rows[0]||null;
}

export async function getMonthlyReports(userId,petId,limit=12){
  await ensurePetLifeAutomationSchema();
  const max=Math.min(24,Math.max(1,Number(limit)||12));
  const {rows}=await sql`select id,report_month,summary,generated_at,updated_at from pg_petlife_monthly_reports where user_id=${userId} and pet_id=${petId} order by report_month desc limit ${max}`;
  return rows.map(r=>({id:r.id,month:String(r.report_month).slice(0,10),summary:r.summary||{},generatedAt:r.generated_at,updatedAt:r.updated_at}));
}

export async function getPetLifeServerStats(){
  await ensurePetLifeAutomationSchema();
  const [pets,entries,due,reports,devices,notifications]=await Promise.all([
    sql`select count(*)::int n from pg_pets`,
    sql`select count(*)::int total,count(*) filter(where created_at>=now()-interval '30 days')::int d30 from pg_pet_life_entries`,
    sql`select count(*)::int n from pg_pet_life_entries where next_due_on between current_date and current_date+7`,
    sql`select count(*)::int n from pg_petlife_monthly_reports`,
    sql`select count(*) filter(where active=true)::int active from pg_push_devices`,
    sql`select count(*) filter(where read_at is null and status<>'cancelled')::int unread,count(*) filter(where pushed_at is not null and created_at>=now()-interval '30 days')::int pushed30 from pg_petlife_notifications`
  ]);
  return {totalPets:pets.rows[0]?.n||0,totalRecords:entries.rows[0]?.total||0,records30d:entries.rows[0]?.d30||0,upcoming7d:due.rows[0]?.n||0,monthlyReports:reports.rows[0]?.n||0,activePushDevices:devices.rows[0]?.active||0,unreadNotifications:notifications.rows[0]?.unread||0,pushed30d:notifications.rows[0]?.pushed30||0,pushConfigured:isFcmConfigured()};
}

export async function getKstClock(){
  const {rows}=await sql`select (now() at time zone 'Asia/Seoul')::date today,extract(day from (now() at time zone 'Asia/Seoul'))::int day`;
  return rows[0];
}
