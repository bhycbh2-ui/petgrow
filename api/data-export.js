import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { ensureSchema } from "../server_lib/db.js";
import { ensurePetLifeAutomationSchema } from "../server_lib/petlifeAutomation.js";

async function safe(load){
  try{return (await load()).rows||[];}catch(error){
    if(error?.code==="42P01"||error?.code==="42703")return [];
    throw error;
  }
}

export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"지원하지 않는 요청이에요."});
  const userId=getSessionUserId(req);
  if(!userId)return res.status(401).json({error:"로그인이 필요해요."});
  try{
    await ensureSchema();
    await ensurePetLifeAutomationSchema();
    const [account,state,pets,petLifeEntries,reports,notifications,devices,posts,postImages,comments,likes,userReports,musicLikes,musicComments,musicReports,placeReviews,inquiries,restrictions]=await Promise.all([
      safe(()=>sql`select id,kakao_id,nickname,profile_image,created_at,last_login_at from pg_users where id=${userId}`),
      safe(()=>sql`select key,value,updated_at from pg_user_state where user_id=${userId} order by key`),
      safe(()=>sql`select id,legacy_key,name,species,breed,birth_date,sex,current_weight_kg,photo_url,notes,created_at,updated_at from pg_pets where user_id=${userId} order by created_at`),
      safe(()=>sql`select id,pet_id,category,occurred_on,title,note,weight_kg,amount_text,duration_minutes,photo_url,clinic_name,next_due_on,metadata,created_at,updated_at from pg_pet_life_entries where user_id=${userId} order by occurred_on,created_at`),
      safe(()=>sql`select id,pet_id,report_month,summary,generated_at,updated_at from pg_petlife_monthly_reports where user_id=${userId} order by report_month desc`),
      safe(()=>sql`select id,pet_id,entry_id,kind,title,body,due_on,lead_days,status,read_at,pushed_at,created_at from pg_petlife_notifications where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select id,platform,device_name,active,created_at,updated_at,last_seen_at from pg_push_devices where user_id=${userId} order by last_seen_at desc`),
      safe(()=>sql`select id,pet_id,pet_name,pet_species,pet_breed,pet_birth_date,pet_photo,category,title,content,like_count,comment_count,is_hidden,is_public,created_at,updated_at from pg_posts where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select i.id,i.post_id,i.storage_url,i.sort_order,i.created_at from pg_post_images i join pg_posts p on p.id=i.post_id where p.user_id=${userId} order by i.created_at`),
      safe(()=>sql`select id,post_id,pet_id,pet_name,pet_photo,content,is_hidden,is_public,created_at from pg_comments where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select post_id,created_at from pg_likes where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select id,target_type,target_id,reason,detail,status,reviewed_at,created_at from pg_reports where reporter_user_id=${userId} order by created_at desc`),
      safe(()=>sql`select track_id,created_at from pg_music_likes where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select id,track_id,content,status,created_at,updated_at from pg_music_comments where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select r.id,r.comment_id,r.reason,r.detail,r.status,r.reviewed_at,r.created_at from pg_music_comment_reports r where r.reporter_user_id=${userId} order by r.created_at desc`),
      safe(()=>sql`select * from pg_place_reviews where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select id,category,title,body,is_public,status,admin_reply,replied_at,created_at,updated_at from pg_inquiries where user_id=${userId} order by created_at desc`),
      safe(()=>sql`select permanent,restricted_until,reason,updated_at from pg_community_restrictions where user_id=${userId}`)
    ]);

    const exportedAt=new Date().toISOString();
    const payload={
      service:"PetGrow",
      exportVersion:1,
      exportedAt,
      account:account[0]||null,
      state,
      petLife:{pets,entries:petLifeEntries,monthlyReports:reports,notifications,pushDevices:devices},
      community:{posts,postImages,comments,likes,reports:userReports,restriction:restrictions[0]||null},
      music:{likes:musicLikes,comments:musicComments,reports:musicReports},
      nearby:{reviews:placeReviews},
      support:{inquiries}
    };
    const date=exportedAt.slice(0,10).replace(/-/g,"");
    res.setHeader("Cache-Control","no-store");
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.setHeader("Content-Disposition",`attachment; filename="petgrow-data-${date}.json"`);
    return res.status(200).send(JSON.stringify(payload,null,2));
  }catch(error){
    console.error("data export",error);
    return res.status(500).json({error:"내 데이터를 내보내지 못했어요."});
  }
}
