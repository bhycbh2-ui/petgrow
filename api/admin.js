import { sql } from "@vercel/postgres";
import { getSessionUserId } from "./_lib/session.js";
import { ensureSchema,getUserById } from "./_lib/db.js";
import { adminExists,isAdminUserId,hashPin,verifyPin,issueToken,verifyToken,logAdmin } from "./_lib/admin.js";
import { getReportContext } from "./_lib/community.js";
function user(req,res){const u=getSessionUserId(req);if(!u){res.status(401).json({error:"로그인이 필요해요."});return null}return u}
async function auth(req,res,u){if(!(await isAdminUserId(u))||!verifyToken(req.headers["x-petgrow-admin-token"],u)){res.status(403).json({error:"관리자 PIN 인증이 필요해요."});return false}return true}
export default async function handler(req,res){await ensureSchema();const u=user(req,res);if(!u)return;const a=String(req.query.action||"status");try{
 if(a==="status"&&req.method==="GET")return res.status(200).json({
   adminExists:await adminExists(),
   isAdmin:await isAdminUserId(u),
   recoveryAvailable:!!(process.env.ADMIN_SETUP_CODE||process.env.PETGROW_ADMIN_SETUP_CODE)
 });
 if(a==="bootstrap"&&req.method==="POST"){if(await adminExists())return res.status(409).json({error:"관리자가 이미 등록되어 있어요."});const {setupCode,pin}=req.body||{};const setupSecret=process.env.ADMIN_SETUP_CODE||process.env.PETGROW_ADMIN_SETUP_CODE;if(!setupSecret||String(setupCode)!==String(setupSecret))return res.status(403).json({error:"최초 등록 코드가 올바르지 않아요."});if(!/^\\d{6}$/.test(String(pin||"")))return res.status(400).json({error:"PIN은 숫자 6자리로 입력해 주세요."});const h=hashPin(pin);await sql`insert into pg_admins(user_id,pin_salt,pin_hash) values(${u},${h.salt},${h.hash})`;await logAdmin(u,"ADMIN_BOOTSTRAP");return res.status(200).json({ok:true});}
 if(a==="recover"&&req.method==="POST"){
   const {setupCode,pin}=req.body||{};
   const setupSecret=process.env.ADMIN_SETUP_CODE||process.env.PETGROW_ADMIN_SETUP_CODE;
   if(!setupSecret||String(setupCode)!==String(setupSecret)){
     return res.status(403).json({error:"관리자 복구 코드가 올바르지 않아요."});
   }
   if(!/^\d{6}$/.test(String(pin||""))){
     return res.status(400).json({error:"새 관리자 PIN은 숫자 6자리로 입력해 주세요."});
   }
   const h=hashPin(pin);
   await sql`
     insert into pg_admins(user_id,pin_salt,pin_hash,pin_updated_at)
     values(${u},${h.salt},${h.hash},now())
     on conflict(user_id)
     do update set pin_salt=excluded.pin_salt,pin_hash=excluded.pin_hash,pin_updated_at=now()
   `;
   await sql`delete from pg_admins where user_id<>${u}`;
   await logAdmin(u,"ADMIN_RECOVERY",u,null,{reassigned:true});
   return res.status(200).json({ok:true});
 }
 if(a==="verify"&&req.method==="POST"){if(!(await isAdminUserId(u)))return res.status(403).json({error:"관리자 계정이 아니에요."});const v=await verifyPin(u,req.body?.pin);if(!v.ok)return res.status(403).json({error:v.locked?"PIN 오류가 반복되어 15분간 잠겼어요.":"PIN이 올바르지 않아요."});return res.status(200).json({ok:true,token:issueToken(u)});}
 if(!(await auth(req,res,u)))return;

 if(a==="stats"&&req.method==="GET"){
   const today=await sql`select (now() at time zone 'Asia/Seoul')::date as d`;
   const day=today.rows[0].d;
   const [
     members,totalPets,community,moderation,todaySessions,currentSessions,
     activeMembers,newMembers,metrics,platforms,trend,topPages
   ]=await Promise.all([
     sql`select count(*)::int total from pg_users`,
     sql`select coalesce(sum(case when jsonb_typeof(value)='array' then jsonb_array_length(value) else 0 end),0)::int total
         from pg_user_state where key in ('bboggl:dogs','bboggl:cats')`,
     sql`select
           (select count(*)::int from pg_posts) posts,
           (select count(*)::int from pg_comments) comments,
           (select count(*)::int from pg_likes) likes`,
     sql`select
           (select count(*)::int from pg_reports where status='open') open_reports,
           (select count(*)::int from pg_community_restrictions where permanent=true or restricted_until>now()) restricted`,
     sql`select count(*)::int total from pg_analytics_sessions where day=${day}`,
     sql`select count(*)::int total from pg_analytics_sessions where last_seen>now()-interval '5 minutes'`,
     sql`select
           count(*) filter(where last_login_at>=now()-interval '7 days')::int d7,
           count(*) filter(where last_login_at>=now()-interval '30 days')::int d30
         from pg_users`,
     sql`select
           count(*) filter(where created_at>=(now() at time zone 'Asia/Seoul')::date)::int today,
           count(*) filter(where created_at>=now()-interval '7 days')::int d7
         from pg_users`,
     sql`select metric,coalesce(sum(count),0)::bigint total
         from pg_daily_metrics
         where day=${day} and metric in ('pageview','ad_request','ad_ready','ad_error')
         group by metric`,
     sql`select platform,count(*)::int total
         from pg_analytics_sessions where day>=${day}::date-6 group by platform order by total desc`,
     sql`with days as (
           select generate_series(${day}::date-6,${day}::date,'1 day')::date day
         ),
         sess as (select day,count(*)::int sessions from pg_analytics_sessions where day>=${day}::date-6 group by day),
         pv as (select day,sum(count)::bigint pageviews from pg_daily_metrics where day>=${day}::date-6 and metric='pageview' group by day),
         signup as (select (created_at at time zone 'Asia/Seoul')::date day,count(*)::int signups from pg_users where created_at>=now()-interval '7 days' group by 1)
         select d.day,coalesce(s.sessions,0)::int sessions,coalesce(p.pageviews,0)::int pageviews,coalesce(n.signups,0)::int signups
         from days d left join sess s using(day) left join pv p using(day) left join signup n using(day) order by d.day`,
     sql`select dimension as page,sum(count)::bigint views
         from pg_daily_metrics where day>=${day}::date-6 and metric='pageview'
         group by dimension order by views desc limit 8`
   ]);
   const metricMap=Object.fromEntries(metrics.rows.map(r=>[r.metric,Number(r.total||0)]));
   return res.status(200).json({
     generatedAt:new Date().toISOString(),
     cards:{
       totalMembers:members.rows[0]?.total||0,
       newToday:newMembers.rows[0]?.today||0,
       new7d:newMembers.rows[0]?.d7||0,
       active7d:activeMembers.rows[0]?.d7||0,
       active30d:activeMembers.rows[0]?.d30||0,
       todaySessions:todaySessions.rows[0]?.total||0,
       onlineSessions5m:currentSessions.rows[0]?.total||0,
       totalPets:totalPets.rows[0]?.total||0,
       posts:community.rows[0]?.posts||0,
       comments:community.rows[0]?.comments||0,
       likes:community.rows[0]?.likes||0,
       openReports:moderation.rows[0]?.open_reports||0,
       restricted:moderation.rows[0]?.restricted||0,
       pageviewsToday:metricMap.pageview||0,
       adRequestsToday:metricMap.ad_request||0,
       adReadyToday:metricMap.ad_ready||0,
       adErrorsToday:metricMap.ad_error||0
     },
     platforms:platforms.rows.map(r=>({platform:r.platform,total:Number(r.total||0)})),
     trend:trend.rows.map(r=>({day:r.day,sessions:Number(r.sessions||0),pageviews:Number(r.pageviews||0),signups:Number(r.signups||0)})),
     topPages:topPages.rows.map(r=>({page:r.page,views:Number(r.views||0)}))
   });
 }
 if(a==="logs"&&req.method==="GET"){
   const {rows}=await sql`select action,target_user_id,report_id,detail,created_at from pg_admin_audit_logs order by created_at desc limit 100`;
   return res.status(200).json({logs:rows});
 }
 if(a==="reports"&&req.method==="GET"){const {rows}=await sql`select * from pg_reports order by created_at desc limit 100`;const reports=[];for(const r of rows){const [c,rep]=await Promise.all([getReportContext(r.target_type,r.target_id),getUserById(r.reporter_user_id)]);let restriction=null;if(c?.targetUserId){const q=await sql`select * from pg_community_restrictions where user_id=${c.targetUserId}`;restriction=q.rows[0]||null}reports.push({id:r.id,targetType:r.target_type,targetId:r.target_id,targetUserId:c?.targetUserId||null,postTitle:c?.title||"삭제된 게시물",authorNickname:c?.authorNickname||"알 수 없음",targetContent:c?.content||"",reporterNickname:rep?.nickname||"PetGrow 회원",reason:r.reason,detail:r.detail||"",status:r.status||"open",createdAt:r.created_at,restriction})}return res.status(200).json({reports});}
 if(a==="restrict"&&req.method==="POST"){const {userId,duration,reason,reportId}=req.body||{};if(!userId||userId===u)return res.status(400).json({error:"제한할 수 없는 계정이에요."});const permanent=duration==="permanent",days=[1,7,30].includes(Number(duration))?Number(duration):null;if(!permanent&&!days)return res.status(400).json({error:"기간이 올바르지 않아요."});const until=permanent?null:new Date(Date.now()+days*86400000).toISOString();await sql`insert into pg_community_restrictions(user_id,permanent,restricted_until,reason,updated_at,updated_by) values(${userId},${permanent},${until},${reason||"Pet톡 운영정책 위반"},now(),${u}) on conflict(user_id) do update set permanent=excluded.permanent,restricted_until=excluded.restricted_until,reason=excluded.reason,updated_at=now(),updated_by=excluded.updated_by`;if(reportId)await sql`update pg_reports set status='resolved',reviewed_at=now(),reviewed_by=${u} where id=${reportId}`;await logAdmin(u,permanent?"RESTRICT_PERMANENT":`RESTRICT_${days}D`,userId,reportId,{until});return res.status(200).json({ok:true});}
 if(a==="unblock"&&req.method==="POST"){const {userId,reportId}=req.body||{};await sql`delete from pg_community_restrictions where user_id=${userId}`;await logAdmin(u,"UNBLOCK",userId,reportId);return res.status(200).json({ok:true});}
 if(a==="resolve"&&req.method==="POST"){await sql`update pg_reports set status='resolved',reviewed_at=now(),reviewed_by=${u} where id=${req.body?.reportId}`;await logAdmin(u,"REPORT_RESOLVED",null,req.body?.reportId);return res.status(200).json({ok:true});}
 return res.status(405).json({error:"지원하지 않는 요청이에요."});
}catch(e){console.error(e);return res.status(500).json({error:"관리자 처리 중 오류가 발생했어요."})}}
