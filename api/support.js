import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { ensureSchema,getUserById } from "../server_lib/db.js";
import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole,roleCan,verifyToken } from "../server_lib/admin.js";

const clean=(v,n=4000)=>String(v||"").trim().slice(0,n);
const pageOf=(v)=>Math.max(1,parseInt(v||"1",10)||1);
const pageSize=20;
async function adminCap(req,uid,cap){const role=await getAdminRole(uid);return !!role&&verifyToken(req.headers["x-petgrow-admin-token"],uid)&&roleCan(role,cap)}

export default async function handler(req,res){
  await ensureSchema();
  const uid=getSessionUserId(req);
  const a=String(req.query.action||"notices");
  try{
    if(a==="notices"&&req.method==="GET"){
      const page=pageOf(req.query.page),off=(page-1)*pageSize;
      const {rows}=await sql`
        select id,title,body,category,pinned,popup,created_at
        from pg_notices
        where active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now())
        order by pinned desc,created_at desc limit ${pageSize} offset ${off}`;
      const c=await sql`select count(*)::int n from pg_notices where active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now())`;
      return res.status(200).json({items:rows,page,total:c.rows[0]?.n||0,pageSize});
    }
    if(a==="inquiries"&&req.method==="GET"){
      const page=pageOf(req.query.page),off=(page-1)*pageSize;
      const mine=String(req.query.mine||"0")==="1";
      if(mine&&!uid)return res.status(401).json({error:"로그인이 필요해요."});
      const {rows}=mine
        ? await sql`select q.*,u.nickname from pg_inquiries q join pg_users u on u.id=q.user_id where q.user_id=${uid} order by q.created_at desc limit ${pageSize} offset ${off}`
        : await sql`select q.id,q.category,q.title,q.body,q.status,q.admin_reply,q.replied_at,q.created_at,u.nickname from pg_inquiries q join pg_users u on u.id=q.user_id where q.is_public=true order by q.created_at desc limit ${pageSize} offset ${off}`;
      const c=mine
        ? await sql`select count(*)::int n from pg_inquiries where user_id=${uid}`
        : await sql`select count(*)::int n from pg_inquiries where is_public=true`;
      return res.status(200).json({items:rows,page,total:c.rows[0]?.n||0,pageSize});
    }
    if(a==="inquiry-create"&&req.method==="POST"){
      if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
      const {title,body,category,isPublic}=req.body||{};
      const t=clean(title,80),b=clean(body,3000),cat=clean(category,20);
      if(t.length<2||b.length<5)return res.status(400).json({error:"제목과 문의 내용을 입력해 주세요."});
      const id=crypto.randomUUID();
      await sql`insert into pg_inquiries(id,user_id,category,title,body,is_public) values(${id},${uid},${cat||"inquiry"},${t},${b},${!!isPublic})`;
      return res.status(200).json({ok:true,id});
    }
    if(a==="admin-inquiries"&&req.method==="GET"){
      if(!uid||!(await adminCap(req,uid,"inquiries")))return res.status(403).json({error:"문의관리 권한이 없어요."});
      const page=pageOf(req.query.page),off=(page-1)*pageSize;
      const {rows}=await sql`select q.*,u.nickname from pg_inquiries q join pg_users u on u.id=q.user_id order by case q.status when 'waiting' then 0 when 'checking' then 1 else 2 end,q.created_at desc limit ${pageSize} offset ${off}`;
      const c=await sql`select count(*)::int n from pg_inquiries`;
      return res.status(200).json({items:rows,page,total:c.rows[0]?.n||0,pageSize});
    }
    if(a==="admin-reply"&&req.method==="POST"){
      if(!uid||!(await adminCap(req,uid,"inquiries")))return res.status(403).json({error:"문의관리 권한이 없어요."});
      const {id,reply,status}=req.body||{}; const rp=clean(reply,3000);
      if(!id||rp.length<1)return res.status(400).json({error:"답변을 입력해 주세요."});
      await sql`update pg_inquiries set admin_reply=${rp},status=${status==="checking"?"checking":"answered"},replied_by=${uid},replied_at=now(),updated_at=now() where id=${id}`;
      return res.status(200).json({ok:true});
    }
    if(a==="admin-notice-create"&&req.method==="POST"){
      if(!uid||!(await adminCap(req,uid,"notices")))return res.status(403).json({error:"공지관리 권한이 없어요."});
      const {title,body,category,pinned,popup}=req.body||{};const t=clean(title,100),b=clean(body,5000);
      if(t.length<2||b.length<2)return res.status(400).json({error:"공지 제목과 내용을 입력해 주세요."});
      await sql`insert into pg_notices(id,title,body,category,pinned,popup,created_by) values(${crypto.randomUUID()},${t},${b},${clean(category,20)||"notice"},${!!pinned},${!!popup},${uid})`;
      return res.status(200).json({ok:true});
    }
    if(a==="admin-notice-delete"&&req.method==="POST"){
      if(!uid||!(await adminCap(req,uid,"notices")))return res.status(403).json({error:"공지관리 권한이 없어요."});
      await sql`delete from pg_notices where id=${req.body?.id}`;return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:"지원하지 않는 요청이에요."});
  }catch(e){console.error("support api",a,e);return res.status(500).json({error:"요청 처리 중 오류가 발생했어요."})}
}