import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";

function validSpecies(value){
  const v=String(value||"all");
  return ["dog","cat","all"].includes(v)?v:"all";
}

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const species=validSpecies(req.query?.species);
    const page=Math.max(1,parseInt(req.query?.page||"1",10)||1);
    const pageSize=10;
    const offset=(page-1)*pageSize;
    const uid=getSessionUserId(req);
    let listResult,countResult,topResult;

    if(species==="dog"){
      [listResult,countResult,topResult]=await Promise.all([
        sql`select t.id,t.title,t.description,t.species,t.vocal_type,t.mood,case when t.cover_url like 'data:image/%' then null else t.cover_url end cover_url,t.audio_url,t.created_at,t.like_count,t.comment_count,t.play_count,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true and species in ('dog','all') order by created_at desc limit ${pageSize} offset ${offset}`,
        sql`select count(*)::int n from pg_music_tracks where active=true and species in ('dog','all')`,
        sql`select id,title,description,species,vocal_type,mood,case when cover_url like 'data:image/%' then null else cover_url end cover_url,audio_url,created_at,like_count,comment_count,play_count from pg_music_tracks where active=true and species in ('dog','all') order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`
      ]);
    } else if(species==="cat"){
      [listResult,countResult,topResult]=await Promise.all([
        sql`select t.id,t.title,t.description,t.species,t.vocal_type,t.mood,case when t.cover_url like 'data:image/%' then null else t.cover_url end cover_url,t.audio_url,t.created_at,t.like_count,t.comment_count,t.play_count,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true and species in ('cat','all') order by created_at desc limit ${pageSize} offset ${offset}`,
        sql`select count(*)::int n from pg_music_tracks where active=true and species in ('cat','all')`,
        sql`select id,title,description,species,vocal_type,mood,case when cover_url like 'data:image/%' then null else cover_url end cover_url,audio_url,created_at,like_count,comment_count,play_count from pg_music_tracks where active=true and species in ('cat','all') order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`
      ]);
    } else {
      [listResult,countResult,topResult]=await Promise.all([
        sql`select t.id,t.title,t.description,t.species,t.vocal_type,t.mood,case when t.cover_url like 'data:image/%' then null else t.cover_url end cover_url,t.audio_url,t.created_at,t.like_count,t.comment_count,t.play_count,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true order by created_at desc limit ${pageSize} offset ${offset}`,
        sql`select count(*)::int n from pg_music_tracks where active=true`,
        sql`select id,title,description,species,vocal_type,mood,case when cover_url like 'data:image/%' then null else cover_url end cover_url,audio_url,created_at,like_count,comment_count,play_count from pg_music_tracks where active=true order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`
      ]);
    }

    const total=Number(countResult.rows?.[0]?.n||0);
    res.setHeader("Cache-Control",uid?"private, max-age=15":"public, s-maxage=120, stale-while-revalidate=600");
    return res.status(200).json({items:listResult.rows,top5:topResult.rows,total,page,pages:Math.max(1,Math.ceil(total/pageSize)),fast:true});
  }catch(error){
    console.error("music-list",error?.message||error);
    res.setHeader("Cache-Control","no-store");
    return res.status(500).json({error:"Pet음악을 불러오지 못했어요."});
  }
}
