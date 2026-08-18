import { sql } from "@vercel/postgres";

function score(x){
  const h=`${x.title||""} ${x.description||""}`;
  let n=0;
  if(/정책|법|제도|정부|지자체|동물보호법/.test(h)) n+=4;
  if(/건강|질병|감염|백신|병원|수의|안전|주의|리콜/.test(h)) n+=5;
  if(/유기|보호|입양|학대/.test(h)) n+=3;
  return n;
}

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const result=await sql`select id,title,description,category,source,link,naver_link,published_at,image
      from pet_news_archive order by published_at desc nulls last, first_seen_at desc limit 24`;
    const items=result.rows.map(r=>({id:r.id,title:r.title,description:r.description||"",category:r.category||"반려동물",source:r.source||"언론사",link:r.link,naverLink:r.naver_link||r.link,publishedAt:r.published_at?new Date(r.published_at).toISOString():null,image:r.image||""}))
      .sort((a,b)=>score(b)-score(a)||new Date(b.publishedAt||0)-new Date(a.publishedAt||0))
      .slice(0,12);
    res.setHeader("Cache-Control","public, max-age=30, s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json({items,total:items.length,archive:true,fast:true});
  }catch(error){
    console.error("home-news failed",error?.message||error);
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({items:[],total:0,fast:true});
  }
}
