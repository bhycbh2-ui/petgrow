import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole, roleCan } from "../server_lib/admin.js";
import { getPetLifeServerStats } from "../server_lib/petlifeAutomation.js";

export default async function handler(req,res){
  res.setHeader("Cache-Control","private, no-store, max-age=0");
  if(req.method!=="GET") return res.status(405).json({error:"지원하지 않는 요청이에요."});
  const uid=getSessionUserId(req);
  if(!uid) return res.status(401).json({error:"로그인이 필요해요."});
  const role=await getAdminRole(uid);
  if(!role||!roleCan(role,"dashboard")) return res.status(403).json({error:"운영 대시보드 권한이 필요해요."});
  try{
    const [{rows},petLife,{rows:ops},{rows:moderation}]=await Promise.all([
      sql`select count(*)::int total_members from pg_users`,
      getPetLifeServerStats(),
      sql`
        select
          (select count(distinct user_id)::int from pg_pet_life_entries where created_at>=now()-interval '30 days') active_petlife_users_30d,
          count(*) filter(where push_attempted_at>=now()-interval '30 days')::int push_attempts_30d,
          count(*) filter(where pushed_at>=now()-interval '30 days')::int push_success_30d,
          count(*) filter(where push_attempted_at>=now()-interval '30 days' and pushed_at is null and push_error is not null)::int push_failed_30d
        from pg_petlife_notifications
      `,
      sql`
        select
          (select count(*)::int from pg_reports where status='open') community_open,
          (select count(*)::int from pg_music_comment_reports where status='open') music_open
      `
    ]);
    const attempts=Number(ops[0]?.push_attempts_30d)||0;
    const success=Number(ops[0]?.push_success_30d)||0;
    return res.status(200).json({
      generatedAt:new Date().toISOString(),
      totalMembers:Number(rows[0]?.total_members)||0,
      petLife:{
        ...petLife,
        activeUsers30d:Number(ops[0]?.active_petlife_users_30d)||0,
        pushAttempts30d:attempts,
        pushSuccess30d:success,
        pushFailed30d:Number(ops[0]?.push_failed_30d)||0,
        pushSuccessRate30d:attempts?Number(((success/attempts)*100).toFixed(1)):null
      },
      moderation:{
        communityOpen:Number(moderation[0]?.community_open)||0,
        musicOpen:Number(moderation[0]?.music_open)||0,
        totalOpen:(Number(moderation[0]?.community_open)||0)+(Number(moderation[0]?.music_open)||0)
      }
    });
  }catch(e){
    return res.status(500).json({error:e?.message||"운영 통계를 불러오지 못했어요."});
  }
}
