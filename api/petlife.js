import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { del as blobDel } from "@vercel/blob";
import { getSessionUserId } from "../server_lib/session.js";
import { ensureAuthSchema } from "../server_lib/db.js";

const CATEGORIES = new Set(["birthday","weight","vaccine","hospital","medicine","food","walk","bath","grooming","photo","health"]);
const CATEGORY_LABELS = {
  birthday:"생일", weight:"몸무게", vaccine:"예방접종", hospital:"병원방문", medicine:"약",
  food:"사료", walk:"산책", bath:"목욕", grooming:"미용", photo:"사진", health:"건강기록"
};

function id(){ return crypto.randomUUID(); }
function text(v,max=500){ return String(v ?? "").trim().slice(0,max); }
function nullableText(v,max=500){ const s=text(v,max); return s || null; }
function dateOnly(v){ const s=text(v,10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; }
function numberOrNull(v,min,max){ const n=Number(v); return Number.isFinite(n) && n>=min && n<=max ? n : null; }
function intOrNull(v,min,max){ const n=Number(v); return Number.isInteger(n) && n>=min && n<=max ? n : null; }
function normalizeSpecies(v){
  const s=text(v,30).toLowerCase();
  if (/dog|강아지|개|puppy/.test(s)) return "dog";
  if (/cat|고양이|kitten/.test(s)) return "cat";
  return s ? "other" : "dog";
}
function normalizeSex(v){ const s=text(v,20).toLowerCase(); if(["male","m","수컷","남"].includes(s))return "male"; if(["female","f","암컷","여"].includes(s))return "female"; return "unknown"; }

async function ensurePetLifeSchema(){
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
  await sql`create unique index if not exists uq_pg_pets_legacy on pg_pets(user_id,legacy_key) where legacy_key is not null`;
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
  await sql`create index if not exists idx_pg_pet_life_pet_date on pg_pet_life_entries(pet_id,occurred_on desc,created_at desc)`;
  await sql`create index if not exists idx_pg_pet_life_due on pg_pet_life_entries(user_id,next_due_on) where next_due_on is not null`;
  await sql`create index if not exists idx_pg_pet_life_category on pg_pet_life_entries(pet_id,category,occurred_on desc)`;
}

function shapePet(r){ return {id:r.id,name:r.name,species:r.species,breed:r.breed||"",birthDate:r.birth_date||null,sex:r.sex||"unknown",weightKg:r.current_weight_kg==null?null:Number(r.current_weight_kg),photoUrl:r.photo_url||"",notes:r.notes||"",createdAt:r.created_at,updatedAt:r.updated_at}; }
function shapeEntry(r){ return {id:r.id,petId:r.pet_id,category:r.category,categoryLabel:CATEGORY_LABELS[r.category]||r.category,occurredOn:r.occurred_on,title:r.title,note:r.note||"",weightKg:r.weight_kg==null?null:Number(r.weight_kg),amountText:r.amount_text||"",durationMinutes:r.duration_minutes==null?null:Number(r.duration_minutes),photoUrl:r.photo_url||"",clinicName:r.clinic_name||"",nextDueOn:r.next_due_on||null,metadata:r.metadata||{},createdAt:r.created_at,updatedAt:r.updated_at}; }

async function petOwned(userId,petId){ const {rows}=await sql`select * from pg_pets where id=${petId} and user_id=${userId}`; return rows[0]||null; }
async function recalcWeight(userId,petId){
  const {rows}=await sql`select weight_kg from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} and category='weight' and weight_kg is not null order by occurred_on desc,created_at desc limit 1`;
  const w=rows[0]?.weight_kg ?? null;
  await sql`update pg_pets set current_weight_kg=${w},updated_at=now() where id=${petId} and user_id=${userId}`;
}
async function safeDeleteBlob(url){ if(!/^https?:\/\//i.test(String(url||"")))return; try{await blobDel(url);}catch(e){console.warn("petlife blob delete failed",e?.message||e);} }

function extractLegacyPets(value,sourceKey){
  const out=[]; const seen=new Set();
  const walk=(node,path,depth=0)=>{
    if(depth>8||node==null)return;
    if(Array.isArray(node)){ node.slice(0,100).forEach((v,i)=>walk(v,`${path}[${i}]`,depth+1)); return; }
    if(typeof node!=="object")return;
    const candidate=node.profile && typeof node.profile==="object" ? {...node.profile,id:node.id??node.profile.id} : node;
    const name=text(candidate.name||candidate.petName||candidate.pet_name,60);
    const hasPetSignal=Boolean(candidate.species||candidate.type||candidate.kind||candidate.breed||candidate.birthDate||candidate.birth_date||candidate.weight||candidate.weightKg||candidate.photo||candidate.photoUrl||candidate.image);
    if(name && hasPetSignal){
      const legacyId=text(candidate.id||candidate.petId||candidate.pet_id||name,120);
      const key=`${sourceKey}:${path}:${legacyId}`.slice(0,300);
      if(!seen.has(key)){
        seen.add(key);
        out.push({legacyKey:key,name,species:normalizeSpecies(candidate.species||candidate.type||candidate.kind),breed:text(candidate.breed,100),birthDate:dateOnly(candidate.birthDate||candidate.birth_date),sex:normalizeSex(candidate.sex||candidate.gender),weightKg:numberOrNull(candidate.weightKg??candidate.weight,0.01,200),photoUrl:text(candidate.photoUrl||candidate.photo||candidate.image,1000)});
      }
    }
    Object.entries(node).slice(0,100).forEach(([k,v])=>walk(v,`${path}.${k}`,depth+1));
  };
  walk(value,"$");
  return out.slice(0,50);
}

async function importLegacy(userId){
  const {rows}=await sql`select key,value from pg_user_state where user_id=${userId} order by updated_at desc limit 100`;
  const candidates=[];
  rows.forEach(r=>candidates.push(...extractLegacyPets(r.value,r.key)));
  let imported=0;
  for(const p of candidates){
    const pid=id();
    const result=await sql`
      insert into pg_pets(id,user_id,legacy_key,name,species,breed,birth_date,sex,current_weight_kg,photo_url)
      values(${pid},${userId},${p.legacyKey},${p.name},${p.species},${p.breed||null},${p.birthDate},${p.sex},${p.weightKg},${p.photoUrl||null})
      on conflict (user_id,legacy_key) where legacy_key is not null do update set
        name=excluded.name,species=excluded.species,breed=coalesce(excluded.breed,pg_pets.breed),birth_date=coalesce(excluded.birth_date,pg_pets.birth_date),
        sex=case when excluded.sex<>'unknown' then excluded.sex else pg_pets.sex end,current_weight_kg=coalesce(excluded.current_weight_kg,pg_pets.current_weight_kg),
        photo_url=coalesce(excluded.photo_url,pg_pets.photo_url),updated_at=now()
      returning (xmax=0) as inserted
    `;
    if(result.rows[0]?.inserted) imported++;
  }
  return {found:candidates.length,imported};
}

function buildInsights({counts,weightDelta,upcoming,days}){
  const insights=[];
  if(weightDelta!=null){
    if(Math.abs(weightDelta)<0.05) insights.push(`최근 ${days}일 체중은 큰 변화 없이 유지되고 있어요.`);
    else insights.push(`최근 ${days}일 체중이 ${weightDelta>0?"약 "+weightDelta.toFixed(2)+"kg 증가":"약 "+Math.abs(weightDelta).toFixed(2)+"kg 감소"}했어요. 기록 흐름을 계속 확인해 주세요.`);
  } else insights.push("체중 기록을 2회 이상 남기면 변화 추이를 확인할 수 있어요.");
  if((counts.walk||0)<4) insights.push("산책 기록이 적어요. 실제 산책을 하지 않았다는 뜻은 아니므로 기록 습관부터 만들어 보세요.");
  if((counts.health||0)+(counts.hospital||0)>0) insights.push("건강·병원 기록이 있어요. 증상 변화나 처방 내용을 함께 메모하면 다음 방문 때 도움이 됩니다.");
  if(upcoming.length) insights.push(`${upcoming[0].nextDueOn}에 ${upcoming[0].title} 일정이 있어요.`);
  return insights.slice(0,4);
}

export default async function handler(req,res){
  try{
    await ensurePetLifeSchema();
    const userId=getSessionUserId(req);
    if(!userId)return res.status(401).json({error:"로그인 후 PetLife를 이용할 수 있어요."});
    const action=text(req.query?.action||"pets",40);

    if(action==="pets" && req.method==="GET"){
      const {rows}=await sql`select * from pg_pets where user_id=${userId} order by created_at asc`;
      return res.status(200).json({pets:rows.map(shapePet)});
    }
    if(action==="import-legacy" && req.method==="POST"){
      const result=await importLegacy(userId);
      const {rows}=await sql`select * from pg_pets where user_id=${userId} order by created_at asc`;
      return res.status(200).json({...result,pets:rows.map(shapePet)});
    }
    if(action==="pet-create" && req.method==="POST"){
      const b=req.body||{}; const name=text(b.name,60); if(!name)return res.status(400).json({error:"반려동물 이름을 입력해 주세요."});
      const p={id:id(),species:normalizeSpecies(b.species),breed:nullableText(b.breed,100),birthDate:dateOnly(b.birthDate),sex:normalizeSex(b.sex),weightKg:numberOrNull(b.weightKg,0.01,200),photoUrl:nullableText(b.photoUrl,1000),notes:nullableText(b.notes,1000)};
      const {rows}=await sql`insert into pg_pets(id,user_id,name,species,breed,birth_date,sex,current_weight_kg,photo_url,notes) values(${p.id},${userId},${name},${p.species},${p.breed},${p.birthDate},${p.sex},${p.weightKg},${p.photoUrl},${p.notes}) returning *`;
      return res.status(201).json({pet:shapePet(rows[0])});
    }
    if(action==="pet-update" && req.method==="POST"){
      const b=req.body||{}; const petId=text(b.petId,80); const current=await petOwned(userId,petId); if(!current)return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      const name=text(b.name??current.name,60); if(!name)return res.status(400).json({error:"반려동물 이름을 입력해 주세요."});
      const species=normalizeSpecies(b.species??current.species),breed=nullableText(b.breed??current.breed,100),birthDate=dateOnly(b.birthDate??current.birth_date),sex=normalizeSex(b.sex??current.sex),weightKg=b.weightKg===undefined?(current.current_weight_kg==null?null:Number(current.current_weight_kg)):numberOrNull(b.weightKg,0.01,200),photoUrl=nullableText(b.photoUrl??current.photo_url,1000),notes=nullableText(b.notes??current.notes,1000);
      const {rows}=await sql`update pg_pets set name=${name},species=${species},breed=${breed},birth_date=${birthDate},sex=${sex},current_weight_kg=${weightKg},photo_url=${photoUrl},notes=${notes},updated_at=now() where id=${petId} and user_id=${userId} returning *`;
      return res.status(200).json({pet:shapePet(rows[0])});
    }
    if(action==="pet-delete" && req.method==="POST"){
      const petId=text(req.body?.petId,80); const current=await petOwned(userId,petId); if(!current)return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      const {rows:photos}=await sql`select photo_url from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} and photo_url is not null`;
      await Promise.all([current.photo_url,...photos.map(x=>x.photo_url)].filter(Boolean).map(safeDeleteBlob));
      await sql`delete from pg_pets where id=${petId} and user_id=${userId}`;
      return res.status(200).json({ok:true});
    }
    if(action==="entries" && req.method==="GET"){
      const petId=text(req.query?.petId,80); if(!(await petOwned(userId,petId)))return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      const limit=Math.min(300,Math.max(1,Number(req.query?.limit)||120));
      const {rows}=await sql`select * from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} order by occurred_on desc,created_at desc limit ${limit}`;
      const {rows:dueRows}=await sql`select * from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} and next_due_on is not null and next_due_on>=current_date order by next_due_on asc limit 20`;
      return res.status(200).json({entries:rows.map(shapeEntry),upcoming:dueRows.map(shapeEntry)});
    }
    if(action==="entry-create" && req.method==="POST"){
      const b=req.body||{}; const petId=text(b.petId,80); if(!(await petOwned(userId,petId)))return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      const category=text(b.category,30); if(!CATEGORIES.has(category))return res.status(400).json({error:"기록 종류를 확인해 주세요."});
      const occurredOn=dateOnly(b.occurredOn)||new Date().toISOString().slice(0,10); const title=text(b.title,100)||CATEGORY_LABELS[category];
      const values={id:id(),note:nullableText(b.note,2000),weightKg:numberOrNull(b.weightKg,0.01,200),amountText:nullableText(b.amountText,100),durationMinutes:intOrNull(b.durationMinutes,1,1440),photoUrl:nullableText(b.photoUrl,1000),clinicName:nullableText(b.clinicName,120),nextDueOn:dateOnly(b.nextDueOn),metadata:(b.metadata&&typeof b.metadata==="object")?b.metadata:{}};
      const {rows}=await sql`insert into pg_pet_life_entries(id,pet_id,user_id,category,occurred_on,title,note,weight_kg,amount_text,duration_minutes,photo_url,clinic_name,next_due_on,metadata) values(${values.id},${petId},${userId},${category},${occurredOn},${title},${values.note},${values.weightKg},${values.amountText},${values.durationMinutes},${values.photoUrl},${values.clinicName},${values.nextDueOn},${JSON.stringify(values.metadata)}::jsonb) returning *`;
      if(category==="weight")await recalcWeight(userId,petId);
      if(category==="photo" && values.photoUrl){ await sql`update pg_pets set photo_url=coalesce(photo_url,${values.photoUrl}),updated_at=now() where id=${petId} and user_id=${userId}`; }
      return res.status(201).json({entry:shapeEntry(rows[0])});
    }
    if(action==="entry-update" && req.method==="POST"){
      const b=req.body||{}; const entryId=text(b.entryId,80); const {rows:currentRows}=await sql`select * from pg_pet_life_entries where id=${entryId} and user_id=${userId}`; const current=currentRows[0]; if(!current)return res.status(404).json({error:"기록을 찾지 못했어요."});
      const category=text(b.category??current.category,30); if(!CATEGORIES.has(category))return res.status(400).json({error:"기록 종류를 확인해 주세요."});
      const occurredOn=dateOnly(b.occurredOn??current.occurred_on)||current.occurred_on; const title=text(b.title??current.title,100)||CATEGORY_LABELS[category];
      const note=nullableText(b.note??current.note,2000),weightKg=b.weightKg===undefined?(current.weight_kg==null?null:Number(current.weight_kg)):numberOrNull(b.weightKg,0.01,200),amountText=nullableText(b.amountText??current.amount_text,100),durationMinutes=b.durationMinutes===undefined?(current.duration_minutes==null?null:Number(current.duration_minutes)):intOrNull(b.durationMinutes,1,1440),photoUrl=nullableText(b.photoUrl??current.photo_url,1000),clinicName=nullableText(b.clinicName??current.clinic_name,120),nextDueOn=dateOnly(b.nextDueOn??current.next_due_on),metadata=(b.metadata&&typeof b.metadata==="object")?b.metadata:(current.metadata||{});
      if(current.photo_url && current.photo_url!==photoUrl)await safeDeleteBlob(current.photo_url);
      const {rows}=await sql`update pg_pet_life_entries set category=${category},occurred_on=${occurredOn},title=${title},note=${note},weight_kg=${weightKg},amount_text=${amountText},duration_minutes=${durationMinutes},photo_url=${photoUrl},clinic_name=${clinicName},next_due_on=${nextDueOn},metadata=${JSON.stringify(metadata)}::jsonb,updated_at=now() where id=${entryId} and user_id=${userId} returning *`;
      if(current.category==="weight"||category==="weight")await recalcWeight(userId,current.pet_id);
      return res.status(200).json({entry:shapeEntry(rows[0])});
    }
    if(action==="entry-delete" && req.method==="POST"){
      const entryId=text(req.body?.entryId,80); const {rows}=await sql`delete from pg_pet_life_entries where id=${entryId} and user_id=${userId} returning pet_id,category,photo_url`; if(!rows[0])return res.status(404).json({error:"기록을 찾지 못했어요."});
      if(rows[0].photo_url)await safeDeleteBlob(rows[0].photo_url); if(rows[0].category==="weight")await recalcWeight(userId,rows[0].pet_id);
      return res.status(200).json({ok:true});
    }
    if(action==="report" && req.method==="GET"){
      const petId=text(req.query?.petId,80); const pet=await petOwned(userId,petId); if(!pet)return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      const days=Math.min(90,Math.max(7,Number(req.query?.days)||30));
      const {rows}=await sql`select * from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} and occurred_on>=current_date-${days}::int order by occurred_on asc,created_at asc`;
      const counts={}; rows.forEach(r=>{counts[r.category]=(counts[r.category]||0)+1;});
      const weights=rows.filter(r=>r.category==="weight"&&r.weight_kg!=null).map(r=>({date:r.occurred_on,kg:Number(r.weight_kg)}));
      const weightDelta=weights.length>=2?weights[weights.length-1].kg-weights[0].kg:null;
      const {rows:dueRows}=await sql`select * from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} and next_due_on is not null and next_due_on>=current_date order by next_due_on asc limit 10`;
      const upcoming=dueRows.map(shapeEntry);
      const insights=buildInsights({counts,weightDelta,upcoming,days});
      return res.status(200).json({pet:shapePet(pet),days,counts,weights,weightDelta,upcoming,insights,disclaimer:"PetGrow의 기록 기반 관리 정보이며 수의학적 진단이나 치료 지시가 아닙니다. 이상 증상이 있으면 수의사와 상담하세요."});
    }
    if(action==="album" && req.method==="GET"){
      const petId=text(req.query?.petId,80); const pet=await petOwned(userId,petId); if(!pet)return res.status(404).json({error:"반려동물을 찾지 못했어요."});
      const {rows}=await sql`select * from pg_pet_life_entries where pet_id=${petId} and user_id=${userId} and photo_url is not null order by occurred_on asc,created_at asc limit 300`;
      const birth=pet.birth_date?new Date(`${pet.birth_date}T00:00:00Z`):null;
      const photos=rows.map(r=>{ const d=new Date(`${r.occurred_on}T00:00:00Z`); const ageMonths=birth?Math.max(0,Math.round((d-birth)/(30.4375*86400000))):null; return {...shapeEntry(r),ageMonths}; });
      const milestones=[1,3,6,12,24,36].map(month=>{ const pool=photos.filter(p=>p.ageMonths!=null); if(!pool.length)return {month,photo:null}; const nearest=[...pool].sort((a,b)=>Math.abs(a.ageMonths-month)-Math.abs(b.ageMonths-month))[0]; return {month,photo:Math.abs(nearest.ageMonths-month)<=2?nearest:null}; });
      return res.status(200).json({pet:shapePet(pet),photos,milestones});
    }
    return res.status(405).json({error:"지원하지 않는 PetLife 요청이에요."});
  }catch(error){
    console.error("petlife api",error);
    return res.status(500).json({error:"PetLife 요청을 처리하지 못했어요."});
  }
}
