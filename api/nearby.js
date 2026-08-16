export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"method not allowed"});
  const key=process.env.KAKAO_REST_API_KEY;
  if(!key) return res.status(500).json({error:"KAKAO_REST_API_KEY가 설정되지 않았어요."});
  const {lat,lng,category="all",area=""}=req.query||{};
  const keywords={
    all:["동물병원","동물약국","반려동물용품","애견미용","애견호텔"],
    hospital:["동물병원"], pharmacy:["동물약국"], shop:["반려동물용품","펫샵"],
    grooming:["애견미용","반려동물 미용"], hotel:["애견호텔","반려동물 유치원"]
  };
  const qs=keywords[category]||keywords.all;
  const hasCoord=Number.isFinite(Number(lat))&&Number.isFinite(Number(lng));
  const all=[];
  for(const kw of qs){
    const u=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    u.searchParams.set("query", area?`${area} ${kw}`:kw);
    u.searchParams.set("size","15");
    if(hasCoord){u.searchParams.set("x",String(lng));u.searchParams.set("y",String(lat));u.searchParams.set("radius","10000");u.searchParams.set("sort","distance");}
    const r=await fetch(u,{headers:{Authorization:`KakaoAK ${key}`}});
    if(!r.ok) continue;
    const j=await r.json();
    for(const d of j.documents||[]) all.push({
      id:d.id,name:d.place_name,phone:d.phone||"",address:d.road_address_name||d.address_name||"",
      roadAddress:d.road_address_name||"",category:d.category_name||"",lat:Number(d.y),lng:Number(d.x),
      distance:d.distance?Number(d.distance):null,url:d.place_url||""
    });
  }
  const seen=new Set(),items=[];
  for(const x of all){if(!x.id||seen.has(x.id))continue;seen.add(x.id);items.push(x)}
  items.sort((a,b)=>(a.distance??1e12)-(b.distance??1e12));
  res.setHeader("Cache-Control","s-maxage=120, stale-while-revalidate=300");
  return res.status(200).json({items:items.slice(0,40),source:"kakao"});
}