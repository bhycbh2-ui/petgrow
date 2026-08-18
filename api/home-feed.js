import { sql } from "@vercel/postgres";

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const [newsResult,musicResult]=await Promise.all([
      sql`select id,title,description,category,source,link,naver_link,published_at,image from pet_news_archive order by published_at desc nulls last, first_seen_at desc limit 3`,
      sql`select id,title,description,species,vocal_type,mood,cover_url,audio_url,like_count,comment_count,play_count from pg_music_tracks where active=true order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`
    ]);
    const news=newsResult.rows.map(r=>({id:r.id,title:r.title,description:r.description||"",category:r.category||"반려동물",source:r.source||"언론사",link:r.link,naverLink:r.naver_link||r.link,publishedAt:r.published_at?new Date(r.published_at).toISOString():null,image:r.image||""}));
    const top5=musicResult.rows.map(r=>({id:r.id,title:r.title,description:r.description||"",species:r.species,vocalType:r.vocal_type,mood:r.mood,coverUrl:r.cover_url||"",audioUrl:r.audio_url||"",likeCount:Number(r.like_count||0),commentCount:Number(r.comment_count||0),playCount:Number(r.play_count||0)}));
    res.setHeader("Cache-Control","public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({news,top5});
  }catch(error){
    console.error("home-feed failed",error?.message||error);
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({news:[],top5:[]});
  }
}
