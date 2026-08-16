import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "./_lib/session.js";
import { ensureSchema,getUserById,getServiceHealthSummary } from "./_lib/db.js";
import { adminExists,isAdminUserId,hashPin,verifyPin,issueToken,verifyToken,logAdmin,getAdminRole,roleCan } from "./_lib/admin.js";
import { getReportContext } from "./_lib/community.js";
function user(req,res){const u=getSessionUserId(req);if(!u){res.status(401).json({error:"로그인이 필요해요."});return null}return u}
async function auth(req,res,u,cap){const role=await getAdminRole(u);if(!role||!verifyToken(req.headers["x-petgrow-admin-token"],u)){res.status(403).json({error:"관리자 PIN 인증이 필요해요."});return null}if(cap&&!roleCan(role,cap)){res.status(403).json({error:"이 관리자 기능에 대한 권한이 없어요."});return null}return role}
const roleLabel=r=>({superadmin:"최고관리자",operator:"운영관리자",report:"신고관리자",ads:"광고관리자"}[r]||r);
export default async function handler(req,res){
 await ensureSchema();const u=user(req,res);if(!u)return;const a=String(req.query.action||"status");
 try{
  if(a==="status"&&req.method==="GET"){
    let role=await getAdminRole(u);
    if(role && role!=="superadmin"){
      const {rows:superRows}=await sql`select count(*)::int n from pg_admins where role='superadmin'`;
      const {rows:allRows}=await sql`select count(*)::int n from pg_admins`;
      if((superRows[0]?.n||0)===0 && (allRows[0]?.n||0)===1){
        await sql`update pg_admins set role='superadmin' where user_id=${u}`;
        await logAdmin(u,"AUTO_PROMOTE_SUPERADMIN",u,null,{from:role,to:"superadmin"});
        role="superadmin";
      }
    }
    return res.status(200).json({adminExists:await adminExists(),isAdmin:!!role,role,roleLabel:roleLabel(role),recoveryAvailable:!!(process.env.ADMIN_SETUP_CODE||process.env.PETGROW_ADMIN_SETUP_CODE)});
  }
  if(a==="bootstrap"&&req.method==="POST"){
    if(await adminExists())return res.status(409).json({error:"관리자가 이미 등록되어 있어요."});
    const {setupCode,pin}=req.body||{},secret=process.env.ADMIN_SETUP_CODE||process.env.PETGROW_ADMIN_SETUP_CODE;
    if(!secret||String(setupCode)!==String(secret))return res.status(403).json({error:"최초 등록 코드가 올바르지 않아요."});
    if(!/^\d{6}$/.test(String(pin||"")))return res.status(400).json({error:"PIN은 숫자 6자리로 입력해 주세요."});
    const h=hashPin(pin);await sql`insert into pg_admins(user_id,pin_salt,pin_hash,role,added_by) values(${u},${h.salt},${h.hash},'superadmin',${u})`;
    await logAdmin(u,"ADMIN_BOOTSTRAP",u,null,{role:"superadmin"});return res.status(200).json({ok:true});
  }
  if(a==="verify"&&req.method==="POST"){
    const role=await getAdminRole(u);if(!role)return res.status(403).json({error:"관리자 계정이 아니에요."});
    const rec=await sql`select pin_hash from pg_admins where user_id=${u}`;
    if(!rec.rows[0]?.pin_hash)return res.status(409).json({error:"PIN_SETUP_REQUIRED",code:"PIN_SETUP_REQUIRED"});
    const v=await verifyPin(u,req.body?.pin);if(!v.ok)return res.status(403).json({error:v.locked?"PIN 오류가 반복되어 15분간 잠겼어요.":"PIN이 올바르지 않아요."});
    await sql`update pg_admins set last_admin_login_at=now() where user_id=${u}`;
    return res.status(200).json({ok:true,token:issueToken(u),role,roleLabel:roleLabel(role)});
  }
  if(a==="set-pin"&&req.method==="POST"){
    const role=await getAdminRole(u);if(!role)return res.status(403).json({error:"관리자 계정이 아니에요."});
    const pin=String(req.body?.pin||"");if(!/^\d{6}$/.test(pin))return res.status(400).json({error:"PIN은 숫자 6자리로 입력해 주세요."});
    const cur=await sql`select pin_hash from pg_admins where user_id=${u}`;if(cur.rows[0]?.pin_hash)return res.status(409).json({error:"이미 PIN이 설정되어 있어요."});
    const h=hashPin(pin);await sql`update pg_admins set pin_salt=${h.salt},pin_hash=${h.hash},pin_updated_at=now() where user_id=${u}`;
    await logAdmin(u,"ADMIN_PIN_SET",u);return res.status(200).json({ok:true});
  }

  const cap=a==="reports"||a==="restrict"||a==="unblock"||a==="resolve"?"reports":
            a==="stats"?"dashboard":a==="logs"?"logs":
            a.startsWith("admin-")?"admins":null;
  const role=await auth(req,res,u,cap);if(!role)return;

  if(a==="stats"&&req.method==="GET"){
    const queries={
      members:()=>sql`select count(*)::int total,count(*) filter(where created_at>=now()-interval '7 days')::int new7 from pg_users`,
      active:()=>sql`select count(*) filter(where last_login_at>=now()-interval '7 days')::int d7 from pg_users`,
      reports:()=>sql`select count(*) filter(where status='open')::int open,count(*) filter(where status='resolved' and reviewed_at>=now()-interval '7 days')::int done7 from pg_reports`,
      restrictions:()=>sql`select count(*)::int n from pg_community_restrictions where permanent=true or restricted_until>now()`,
      sessions:()=>sql`select count(*) filter(where day=(now() at time zone 'Asia/Seoul')::date)::int today,count(*) filter(where last_seen>now()-interval '5 minutes')::int online from pg_analytics_sessions`,
      community:()=>sql`select (select count(*)::int from pg_posts where created_at>=(now() at time zone 'Asia/Seoul')::date) posts_today,(select count(*)::int from pg_comments where created_at>=(now() at time zone 'Asia/Seoul')::date) comments_today`,
      inquiries:()=>sql`select count(*) filter(where status='waiting')::int waiting from pg_inquiries`,
      menuUsage:()=>sql`
        select dimension,
          sum(count) filter(where day=(now() at time zone 'Asia/Seoul')::date)::int today,
          sum(count) filter(where day>=(now() at time zone 'Asia/Seoul')::date-6)::int d7,
          sum(count) filter(where day>=(now() at time zone 'Asia/Seoul')::date-29)::int d30
        from pg_daily_metrics
        where metric='pageview'
          and day>=(now() at time zone 'Asia/Seoul')::date-29
        group by dimension
        order by d30 desc nulls last
      `
    };
    const ent=Object.entries(queries),settled=await Promise.allSettled(ent.map(([,f])=>f())),q={},warnings=[];
    settled.forEach((x,i)=>{const k=ent[i][0];if(x.status==="fulfilled")q[k]=x.value.rows[0]||{};else warnings.push(`${k} 통계를 불러오지 못했어요.`)});
    const menuRows=settled[ent.findIndex(([k])=>k==="menuUsage")]?.status==="fulfilled" ? settled[ent.findIndex(([k])=>k==="menuUsage")].value.rows : [];
    return res.status(200).json({warnings,cards:{totalMembers:q.members?.total||0,new7d:q.members?.new7||0,active7d:q.active?.d7||0,openReports:q.reports?.open||0,resolvedReports7d:q.reports?.done7||0,restricted:q.restrictions?.n||0,todaySessions:q.sessions?.today||0,onlineSessions5m:q.sessions?.online||0,postsToday:q.community?.posts_today||0,commentsToday:q.community?.comments_today||0,waitingInquiries:q.inquiries?.waiting||0},menuUsage:menuRows});
  }
  if(a==="reports"&&req.method==="GET"){
    const {rows}=await sql`select * from pg_reports order by case when status='open' then 0 else 1 end,created_at desc limit 100`;
    const reports=[];for(const r of rows){const [c,rep]=await Promise.all([getReportContext(r.target_type,r.target_id),getUserById(r.reporter_user_id)]);let restriction=null;if(c?.targetUserId){const z=await sql`select * from pg_community_restrictions where user_id=${c.targetUserId}`;restriction=z.rows[0]||null}reports.push({id:r.id,targetUserId:c?.targetUserId||null,postTitle:c?.title||"삭제된 게시물",authorNickname:c?.authorNickname||"알 수 없음",targetContent:c?.content||"",reporterNickname:rep?.nickname||"PetGrow 회원",reason:r.reason,detail:r.detail||"",status:r.status||"open",createdAt:r.created_at,restriction})}return res.status(200).json({reports});
  }
  if(a==="restrict"&&req.method==="POST"){
    const {targetUserId,duration,reportId}=req.body||{};if(!targetUserId)return res.status(400).json({error:"대상 계정 정보가 없어요."});
    if(!["1d","7d","30d","permanent"].includes(duration))return res.status(400).json({error:"제한 기간이 올바르지 않아요."});
    const ms={ "1d":86400000,"7d":604800000,"30d":2592000000}[duration]||0,permanent=duration==="permanent",until=permanent?null:new Date(Date.now()+ms);
    await sql`insert into pg_community_restrictions(user_id,restricted_until,permanent,updated_by,updated_at) values(${targetUserId},${until},${permanent},${u},now()) on conflict(user_id) do update set restricted_until=excluded.restricted_until,permanent=excluded.permanent,updated_by=excluded.updated_by,updated_at=now()`;
    await logAdmin(u,`RESTRICT_${duration.toUpperCase()}`,targetUserId,reportId||null,{duration});return res.status(200).json({ok:true});
  }
  if(a==="unblock"&&req.method==="POST"){const {targetUserId,reportId}=req.body||{};await sql`delete from pg_community_restrictions where user_id=${targetUserId}`;await logAdmin(u,"UNBLOCK",targetUserId,reportId||null);return res.status(200).json({ok:true});}
  if(a==="resolve"&&req.method==="POST"){const {reportId}=req.body||{};await sql`update pg_reports set status='resolved',reviewed_at=now(),reviewed_by=${u} where id=${reportId}`;await logAdmin(u,"REPORT_RESOLVED",null,reportId);return res.status(200).json({ok:true});}
  if(a==="logs"&&req.method==="GET"){const {rows}=await sql`select l.*,coalesce(a.nickname,'관리자') admin_nickname,coalesce(t.nickname,'') target_nickname from pg_admin_audit_logs l left join pg_users a on a.id=l.admin_user_id left join pg_users t on t.id=l.target_user_id order by l.created_at desc limit 100`;return res.status(200).json({logs:rows});}

  if(a==="admin-list"&&req.method==="GET"){
    const {rows}=await sql`select a.user_id,a.role,a.created_at,a.pin_updated_at,a.last_admin_login_at,(a.pin_hash is not null) pin_set,u.nickname from pg_admins a join pg_users u on u.id=a.user_id order by case a.role when 'superadmin' then 0 else 1 end,a.created_at`;
    return res.status(200).json({admins:rows});
  }
  if(a==="admin-search"&&req.method==="GET"){
    const q=String(req.query.q||"").trim();if(q.length<2)return res.status(200).json({users:[]});
    const {rows}=await sql`select u.id,u.nickname,u.created_at,(a.user_id is not null) is_admin,a.role from pg_users u left join pg_admins a on a.user_id=u.id where lower(u.nickname)=lower(${q}) limit 5`;
    return res.status(200).json({users:rows});
  }
  if(a==="admin-add"&&req.method==="POST"){
    const {userId,role:newRole}=req.body||{};if(!["operator","report","ads"].includes(newRole))return res.status(400).json({error:"선택할 수 없는 권한이에요."});
    await sql`insert into pg_admins(user_id,role,added_by,pin_salt,pin_hash) values(${userId},${newRole},${u},null,null) on conflict(user_id) do update set role=excluded.role,added_by=excluded.added_by`;
    await logAdmin(u,"ADMIN_ADD",userId,null,{role:newRole});return res.status(200).json({ok:true});
  }
  if(a==="admin-role"&&req.method==="POST"){
    const {userId,role:newRole}=req.body||{};const cur=await sql`select role from pg_admins where user_id=${userId}`;
    if(cur.rows[0]?.role==="superadmin")return res.status(403).json({error:"최고관리자 권한은 변경할 수 없어요."});
    if(!["operator","report","ads"].includes(newRole))return res.status(400).json({error:"선택할 수 없는 권한이에요."});
    await sql`update pg_admins set role=${newRole} where user_id=${userId}`;await logAdmin(u,"ADMIN_ROLE_CHANGE",userId,null,{role:newRole});return res.status(200).json({ok:true});
  }
  if(a==="admin-reset-pin"&&req.method==="POST"){
    const {userId}=req.body||{};const cur=await sql`select role from pg_admins where user_id=${userId}`;if(cur.rows[0]?.role==="superadmin"&&userId!==u)return res.status(403).json({error:"최고관리자 PIN은 다른 관리자가 초기화할 수 없어요."});
    await sql`update pg_admins set pin_salt=null,pin_hash=null,pin_updated_at=now() where user_id=${userId}`;await logAdmin(u,"ADMIN_PIN_RESET",userId);return res.status(200).json({ok:true});
  }
  if(a==="admin-remove"&&req.method==="POST"){
    const {userId}=req.body||{};const cur=await sql`select role from pg_admins where user_id=${userId}`;if(cur.rows[0]?.role==="superadmin")return res.status(403).json({error:"최고관리자는 삭제할 수 없어요."});
    await sql`delete from pg_admins where user_id=${userId}`;await logAdmin(u,"ADMIN_REMOVE",userId);return res.status(200).json({ok:true});
  }
  if(a==="health"&&req.method==="GET"){
    if(!roleCan(role,"service"))return res.status(403).json({error:"서비스 상태 확인 권한이 없어요."});
    const h=await getServiceHealthSummary();
    const {rows}=await sql`select count(*) filter(where last_seen>now()-interval '5 minutes')::int online5m,count(*) filter(where day=(now() at time zone 'Asia/Seoul')::date)::int today from pg_analytics_sessions`;
    const t=rows[0]||{};let trafficLevel="normal";if((t.online5m||0)>=300)trafficLevel="high";if((t.online5m||0)>=1000)trafficLevel="critical";
    return res.status(200).json({...h,traffic:{...t,level:trafficLevel},checkedAt:new Date().toISOString()});
  }
  return res.status(405).json({error:"지원하지 않는 요청이에요."});
 }catch(e){console.error("admin",a,e);return res.status(500).json({error:"관리자 요청 처리 중 오류가 발생했어요."})}
}