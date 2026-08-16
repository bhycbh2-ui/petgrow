import crypto from "crypto";
import {sql} from "@vercel/postgres";
import {ensureSchema} from "./_lib/db.js";
import {getSessionUserId} from "./_lib/session.js";
import {getAdminRole,roleCan} from "./_lib/admin.js";
import {verifyToken,logAdmin} from "./_lib/admin.js";
const clean=(v,n=1000)=>String(v||"").trim().slice(0,n);
async function allowed(req,cap="ads"){const u=getSessionUserId(req),r=await getAdminRole(u);return u&&r&&roleCan(r,cap)&&verifyToken(req.headers["x-petgrow-admin-token"],u)?{u,r}:null}
export default async function handler(req,res){
 await ensureSchema(); const a=String(req.query.action||"active");
 try{
  if(a==="inquiry"&&req.method==="POST"){
   const b=req.body||{},company=clean(b.companyName,80),name=clean(b.contactName,50),email=clean(b.email,120),msg=clean(b.message,2500);
   if(company.length<2||name.length<2||!email.includes("@")||msg.length<5)return res.status(400).json({error:"필수 항목을 확인해 주세요."});
   await sql`insert into pg_ad_inquiries(id,company_name,contact_name,email,phone,campaign_type,budget,message) values(${crypto.randomUUID()},${company},${name},${email},${clean(b.phone,30)},${clean(b.campaignType,30)||"banner"},${clean(b.budget,50)},${msg})`;
   return res.status(200).json({ok:true});
  }
  if(a==="active"&&req.method==="GET"){
   const {rows}=await sql`select id,name,placement,image_url,target_url from pg_direct_ads where active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()) order by priority desc,created_at desc limit 20`;
   return res.status(200).json({ads:rows});
  }
  const au=await allowed(req); if(!au)return res.status(403).json({error:"광고관리 권한이 없어요."});
  if(a==="admin-inquiries"&&req.method==="GET"){const {rows}=await sql`select * from pg_ad_inquiries order by case status when 'new' then 0 when 'contacted' then 1 else 2 end,created_at desc limit 100`;return res.status(200).json({items:rows});}
  if(a==="admin-inquiry-status"&&req.method==="POST"){await sql`update pg_ad_inquiries set status=${clean(req.body?.status,20)},updated_at=now() where id=${req.body?.id}`;await logAdmin(au.u,"AD_INQUIRY_STATUS",null,null,{id:req.body?.id,status:req.body?.status});return res.status(200).json({ok:true});}
  if(a==="admin-save"&&req.method==="POST"){
   const b=req.body||{},id=b.id||crypto.randomUUID();
   const placement=clean(b.placement,30);
   if(!["banner","promo_modal"].includes(placement))return res.status(400).json({error:"광고 위치가 올바르지 않아요."});
   if(placement==="promo_modal" && String(b.network||"direct")!=="direct")return res.status(400).json({error:"프로모션 모달에는 Google 광고를 사용할 수 없어요. 직접광고만 등록해 주세요."});await sql`insert into pg_direct_ads(id,name,placement,image_url,target_url,starts_at,ends_at,active,priority,created_by) values(${id},${clean(b.name,100)},${placement},${clean(b.imageUrl,500)},${clean(b.targetUrl,500)},${b.startsAt||null},${b.endsAt||null},${!!b.active},${Number(b.priority)||0},${au.u}) on conflict(id) do update set name=excluded.name,placement=excluded.placement,image_url=excluded.image_url,target_url=excluded.target_url,starts_at=excluded.starts_at,ends_at=excluded.ends_at,active=excluded.active,priority=excluded.priority,updated_at=now()`;
   await logAdmin(au.u,"DIRECT_AD_SAVE",null,null,{id,placement:b.placement});return res.status(200).json({ok:true,id});
  }
  if(a==="admin-toggle"&&req.method==="POST"){
   const {id,active}=req.body||{};
   await sql`update pg_direct_ads set active=${!!active},updated_at=now() where id=${id}`;
   await logAdmin(au.u,"DIRECT_AD_TOGGLE",null,null,{id,active:!!active});
   return res.status(200).json({ok:true});
  }
  if(a==="admin-delete"&&req.method==="POST"){
   const {id}=req.body||{};
   await sql`delete from pg_direct_ads where id=${id}`;
   await logAdmin(au.u,"DIRECT_AD_DELETE",null,null,{id});
   return res.status(200).json({ok:true});
  }
  if(a==="admin-list"&&req.method==="GET"){const {rows}=await sql`select * from pg_direct_ads order by created_at desc`;return res.status(200).json({items:rows});}
  return res.status(405).json({error:"지원하지 않는 요청이에요."});
 }catch(e){console.error("ads api",e);return res.status(500).json({error:"광고 요청 처리 중 오류가 발생했어요."})}
}