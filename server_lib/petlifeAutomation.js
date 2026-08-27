import fs from "node:fs";
import crypto from "node:crypto";
import { sql } from "@vercel/postgres";
import { sendPushToTokens, isFcmConfigured } from "./fcm.js";

let schemaReady=false;
const KST_ZONE="Asia/Seoul";
const NOTIFICATION_LEAD_DAYS=3;
const TYPE_LABELS={vaccine:"예방접종",heartworm:"심장사상충",deworm:"구충",grooming:"미용",bath:"목욕",weight:"체중",walk:"산책",memo:"메모",other:"기록"};
const TYPES=new Set(Object.keys(TYPE_LABELS));
const ENTRY_TYPES=new Set(["walk","meal","weight","health","grooming","vaccine","memo","other"]);

export function normalizeEntryType(value){
  const type=String(value||"").trim().toLowerCase();
  return ENTRY_TYPES.has(type)?type:"other";
}
export function normalizeScheduleType(value){
  const type=String(value||"").trim().toLowerCase();
  return TYPES.has(type)?type:"other";
}
export function scheduleLabel(type){return TYPE_LABELS[normalizeScheduleType(type)]||"기록";}
export function calculateNextDueOn(type,date,customNextDueOn){
  if(customNextDueOn)return String(customNextDueOn).slice(0,10);
  const d=new Date(`${String(date).slice(0,10)}T00:00:00Z`);
  if(Number.isNaN(d.getTime()))return null;
  const t=normalizeScheduleType(type);
  if(t==="heartworm"){d.setUTCMonth(d.getUTCMonth()+1);}
  else if(t==="deworm"){d.setUTCMonth(d.getUTCMonth()+3);}
  else if(t==="grooming"||t==="bath"){d.setUTCDate(d.getUTCDate()+42);}
  else if(t==="vaccine"){d.setUTCFullYear(d.getUTCFullYear()+1);}
  else return null;
  return d.toISOString().slice(0,10);
}

export async function ensurePetLifeAutomationSchema(){
  if(schemaReady)return;
  await sql`create table if not exists pg_pet_life_entries(
    id text primary key,
    user_id text not null,
    pet_id text not null,
    entry_type text not null,
    entry_date date not null,
    value_numeric numeric,
    unit text,
    title text,
    memo text,
    next_due_on date,
    source text not null default 'manual',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;
  await sql`create index if not exists pg_pet_life_entries_user_pet_date_idx on pg_pet_life_entries(user_id,pet_id,entry_date desc)`;
  await sql`create index if not exists pg_pet_life_entries_due_idx on pg_pet_life_entries(next_due_on) where next_due_on is not null`;
  await sql`create table if not exists pg_petlife_monthly_reports(
    id text primary key,
    user_id text not null,
    pet_id text not null,
    report_month date not null,
    summary jsonb not null default '{}'::jsonb,
    generated_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id,pet_id,report_month)
  )`;
  await sql`create table if not exists pg_push_devices(
    id text primary key,
    user_id text not null,
    token text not null unique,
    platform text not null default 'web',
    device_label text,
    active boolean not null default true,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;
  await sql`create index if not exists pg_push_devices_user_active_idx on pg_push_devices(user_id,active)`;
  await sql`create table if not exists pg_petlife_notifications(
    id text primary key,
    user_id text not null,
    pet_id text,
    entry_id text,
    notif_type text not null,
    title text not null,
    body text not null,
    deep_link text,
    due_on date,
    send_on date,
    status text not null default 'queued',
    pushed_at timestamptz,
    read_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id,entry_id,notif_type,send_on)
  )`;
  await sql`create index if not exists pg_petlife_notifications_user_idx on pg_petlife_notifications(user_id,created_at desc)`;
  schemaReady=true;
}

export async function savePetLifeEntry({userId,petId,entryType,entryDate,valueNumeric=null,unit=null,title=null,memo=null,nextDueOn=null,source="manual",id=null}){
  await ensurePetLifeAutomationSchema();
  const type=normalizeEntryType(entryType);
  const date=String(entryDate||new Date().toISOString().slice(0,10)).slice(0,10);
  const rowId=id||crypto.randomUUID();
  const scheduleType=normalizeScheduleType(entryType);
  const derivedNext=calculateNextDueOn(scheduleType,date,nextDueOn);
  const {rows}=await sql`insert into pg_pet_life_entries(id,user_id,pet_id,entry_type,entry_date,value_numeric,unit,title,memo,next_due_on,source)
    values(${rowId},${userId},${petId},${type},${date},${valueNumeric},${unit},${title},${memo},${derivedNext},${source})
    on conflict(id) do update set entry_type=excluded.entry_type,entry_date=excluded.entry_date,value_numeric=excluded.value_numeric,unit=excluded.unit,title=excluded.title,memo=excluded.memo,next_due_on=excluded.next_due_on,source=excluded.source,updated_at=now()
    returning *`;
  return rows[0];
}

export async function deletePetLifeEntry(userId,id){
  await ensurePetLifeAutomationSchema();
  await sql`delete from pg_pet_life_entries where id=${id} and user_id=${userId}`;
}

export async function getPetLifeEntries(userId,petId,{limit=120,type=null}={}){
  await ensurePetLifeAutomationSchema();
  const max=Math.min(300,Math.max(1,Number(limit)||120));
  const rows=type
    ?(await sql`select * from pg_pet_life_entries where user_id=${userId} and pet_id=${petId} and entry_type=${normalizeEntryType(type)} order by entry_date desc,created_at desc limit ${max}`).rows
    :(await sql`select * from pg_pet_life_entries where user_id=${userId} and pet_id=${petId} order by entry_date desc,created_at desc limit ${max}`).rows;
  return rows;
}

export async function registerPushDevice({userId,token,platform="web",deviceLabel=null}){
  await ensurePetLifeAutomationSchema();
  const t=String(token||"").trim();
  if(!t||t.length<16)throw new Error("PUSH_TOKEN_INVALID");
  const existing=(await sql`select id from pg_push_devices where token=${t} limit 1`).rows[0];
  const id=existing?.id||crypto.randomUUID();
  const {rows}=await sql`insert into pg_push_devices(id,user_id,token,platform,device_label,active,last_seen_at,updated_at)
    values(${id},${userId},${t},${String(platform||"web")},${deviceLabel},true,now(),now())
    on conflict(token) do update set user_id=excluded.user_id,platform=excluded.platform,device_label=excluded.device_label,active=true,last_seen_at=now(),updated_at=now()
    returning id,user_id,platform,device_label,active,last_seen_at`;
  return rows[0];
}

export async function unregisterPushDevice({userId,token}){
  await ensurePetLifeAutomationSchema();
  const t=String(token||"").trim();
  if(!t)return {ok:true};
  await sql`update pg_push_devices set active=false,updated_at=now() where user_id=${userId} and token=${t}`;
  return {ok:true};
}

export async function queueDueNotifications({leadDays=NOTIFICATION_LEAD_DAYS}={}){
  await ensurePetLifeAutomationSchema();
  const lead=Math.min(14,Math.max(0,Number(leadDays)||0));
  const {rows}=await sql`select e.id,e.user_id,e.pet_id,e.entry_type,e.next_due_on,p.name pet_name
    from pg_pet_life_entries e
    left join pg_pets p on p.id=e.pet_id and p.user_id=e.user_id
    where e.next_due_on is not null and e.next_due_on between current_date and current_date+${lead}`;
  let queued=0;
  for(const r of rows){
    const sendOn=String(r.next_due_on).slice(0,10);
    const notifType=`due_${normalizeScheduleType(r.entry_type)}`;
    const label=scheduleLabel(r.entry_type);
    const title=`${r.pet_name||"우리 아이"} ${label} 일정`;
    const body=`${label} 예정일이 ${sendOn}이에요. PetGrow에서 기록을 확인해 주세요.`;
    const id=crypto.randomUUID();
    const result=await sql`insert into pg_petlife_notifications(id,user_id,pet_id,entry_id,notif_type,title,body,deep_link,due_on,send_on,status)
      values(${id},${r.user_id},${r.pet_id},${r.id},${notifType},${title},${body},${"/?view=petlife"},${sendOn},current_date,'queued')
      on conflict(user_id,entry_id,notif_type,send_on) do nothing returning id`;
    if(result.rows.length)queued++;
  }
  return {queued,leadDays:lead};
}

export async function deliverQueuedNotifications({limit=200}={}){
  await ensurePetLifeAutomationSchema();
  const max=Math.min(500,Math.max(1,Number(limit)||200));
  const {rows}=await sql`select * from pg_petlife_notifications where status='queued' and send_on<=current_date order by created_at asc limit ${max}`;
  let delivered=0,skipped=0,failed=0;
  for(const n of rows){
    const devices=(await sql`select token from pg_push_devices where user_id=${n.user_id} and active=true`).rows.map(r=>r.token).filter(Boolean);
    if(!devices.length){skipped++;continue;}
    const result=await sendPushToTokens(devices,{title:n.title,body:n.body,data:{url:n.deep_link||"/?view=petlife",notificationId:n.id}});
    delivered+=Number(result?.success||0);
    failed+=Number(result?.failed||0);
    if(Number(result?.success||0)>0)await sql`update pg_petlife_notifications set status='sent',pushed_at=now(),updated_at=now() where id=${n.id}`;
  }
  return {delivered,skipped,failed,pushConfigured:isFcmConfigured()};
}

export async function markNotificationRead(userId,id){
  await ensurePetLifeAutomationSchema();
  await sql`update pg_petlife_notifications set read_at=now(),updated_at=now() where id=${id} and user_id=${userId}`;
  return {ok:true};
}

export async function listNotifications(userId,{limit=50,unreadOnly=false}={}){
  await ensurePetLifeAutomationSchema();
  const max=Math.min(100,Math.max(1,Number(limit)||50));
  const {rows}=unreadOnly
    ?await sql`select * from pg_petlife_notifications where user_id=${userId} and read_at is null order by created_at desc limit ${max}`
    :await sql`select * from pg_petlife_notifications where user_id=${userId} order by created_at desc limit ${max}`;
  return rows;
}

export async function generatePreviousMonthReports(){
  await ensurePetLifeAutomationSchema();
  const {rows:pets}=await sql`select id,user_id,name from pg_pets`;
  let generated=0;
  for(const pet of pets){
    const {rows:stats}=await sql`select
      count(*)::int total,
      count(*) filter(where entry_type='walk')::int walks,
      count(*) filter(where entry_type='health')::int health,
      count(*) filter(where entry_type='grooming')::int grooming,
      count(*) filter(where entry_type='vaccine')::int vaccines,
      avg(value_numeric) filter(where entry_type='weight' and value_numeric is not null) avg_weight
      from pg_pet_life_entries where user_id=${pet.user_id} and pet_id=${pet.id}
        and entry_date>=date_trunc('month',current_date-interval '1 month')::date
        and entry_date<date_trunc('month',current_date)::date`;
    const stat=stats[0]||{};
    const month=(await sql`select date_trunc('month',current_date-interval '1 month')::date month`).rows[0]?.month;
    if(!month)continue;
    const summary={petName:pet.name||"우리 아이",total:Number(stat.total||0),walks:Number(stat.walks||0),health:Number(stat.health||0),grooming:Number(stat.grooming||0),vaccines:Number(stat.vaccines||0),avgWeight:stat.avg_weight==null?null:Number(stat.avg_weight)};
    await sql`insert into pg_petlife_monthly_reports(id,user_id,pet_id,report_month,summary)
      values(${crypto.randomUUID()},${pet.user_id},${pet.id},${month},${JSON.stringify(summary)}::jsonb)
      on conflict(user_id,pet_id,report_month) do update set summary=excluded.summary,generated_at=now(),updated_at=now()`;
    generated++;
  }
  return {generated};
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
  const {rows}=await sql`select (now() at time zone 'Asia/Seoul')::date as today,extract(day from (now() at time zone 'Asia/Seoul'))::int as day_of_month`;
  return {today:rows[0]?.today,day:Number(rows[0]?.day_of_month||0)};
}
