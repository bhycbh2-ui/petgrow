import { sql } from "@vercel/postgres";

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const result=await sql`SELECT id,title,description,category,source,link,naver_link,published_at,image
      FROM pet_news_archive
      ORDER BY published_at DESC NULLS LAST, first_seen_at DESC
      LIMIT 1000`;
    const items=result.rows.map(r=>({
      id:r.id,
      title:r.title,
      description:r.description||"",
      category:r.category||"반려동물",
      source:r.source||"언론사",
      link:r.link,
      naverLink:r.naver_link||r.link,
      publishedAt:r.published_at?new Date(r.published_at).toISOString():null,
      image:r.image||"",
      imageIsFallback:false
    }));
    res.setHeader("Cache-Control","public, max-age=30, s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json({configured:true,provider:"archive",archive:true,cached:true,total:items.length,items,message:items.length?"":"새 반려동물 뉴스를 찾고 있어요."});
  }catch(error){
    console.error("news archive read failed",error?.message||error);
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({configured:true,provider:"archive",archive:true,items:[],error:"저장된 뉴스를 불러오지 못했어요."});
  }
}
