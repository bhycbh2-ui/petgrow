import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { getUserById, getState, setState, logServiceHealth, ensureSchema } from "../server_lib/db.js";
import { isAdminUserId } from "../server_lib/admin.js";

async function handleMe(req, res) {
  const uid = getSessionUserId(req);
  if (!uid) return res.status(401).json({ error: "unauthenticated" });
  const user = await getUserById(uid);
  if (!user) return res.status(401).json({ error: "unauthenticated" });
  const isAdmin = await isAdminUserId(uid);
  return res.status(200).json({
    id: user.id,
    name: user.nickname || "PetGrow 회원",
    profileImage: user.profile_image || null,
    accountCode: user.kakao_id ? String(user.kakao_id).slice(-4).padStart(4, "0") : null,
    isAdmin,
  });
}

async function handleState(req, res) {
  const uid = getSessionUserId(req);
  if (!uid) return res.status(401).json({ error: "unauthenticated" });
  if (req.method === "GET") {
    const key = req.query.key;
    if (!key || typeof key !== "string") return res.status(400).json({ error: "key is required" });
    const value = await getState(uid, key);
    return res.status(200).json({ key, value });
  }
  if (req.method === "PUT") {
    const { key, value } = req.body || {};
    if (!key || typeof key !== "string") return res.status(400).json({ error: "key is required" });
    await setState(uid, key, value === undefined ? null : value);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: "method not allowed" });
}

async function handleHealthEvent(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const b = req.body || {};
  const kind = ["error", "slow", "rate_limit"].includes(String(b.kind)) ? String(b.kind) : "error";
  await logServiceHealth(
    kind,
    String(b.source || "client").slice(0, 80),
    Number.isFinite(Number(b.statusCode)) ? Number(b.statusCode) : null,
    Number.isFinite(Number(b.latencyMs)) ? Math.min(60000, Math.max(0, Number(b.latencyMs))) : null,
    String(b.detail || "").slice(0, 300)
  );
  return res.status(200).json({ ok: true });
}


const PLACE_REVIEW_BLOCKED_RE = /씨발|시발|ㅅㅂ|병신|븅신|개새끼|개새|좆|존나|지랄|꺼져|닥쳐|섹스|sex|야동|porn|포르노|자위|보지|자지|음란|나치|nazi|혐오/i;
function validatePlaceReviewText(text) {
  const raw = String(text || "").trim();
  const compact = raw.replace(/[\s._\-~!@#$%^&*()+=|\\/]/g, "");
  if (!raw || raw.length > 300) return "후기는 1~300자로 입력해 주세요.";
  if (PLACE_REVIEW_BLOCKED_RE.test(compact)) return "사용할 수 없는 표현이 포함되어 있어요.";
  if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(raw) || /(?:01[016789])[-\s]?\d{3,4}[-\s]?\d{4}/.test(raw)) return "전화번호나 이메일 같은 개인정보는 후기에 작성하지 말아 주세요.";
  return "";
}
function placeType(categoryName, keyword) {
  const x = `${categoryName || ""} ${keyword || ""}`;
  if (/동물병원|수의/.test(x)) return { key:"hospital", label:"동물병원", icon:"🏥" };
  if (/동물약국|약국/.test(x)) return { key:"pharmacy", label:"동물약국", icon:"💊" };
  if (/미용|그루밍/.test(x)) return { key:"grooming", label:"펫미용", icon:"✂️" };
  if (/호텔|유치원|데이케어|돌봄/.test(x)) return { key:"hotel", label:"호텔·유치원", icon:"🏡" };
  if (/용품|펫샵|반려동물용품|애견용품|애묘용품/.test(x)) return { key:"shop", label:"펫샵·용품", icon:"🛍️" };
  return { key:"other", label:"반려동물 관련", icon:"🐾" };
}

async function handleNearbyReviews(req, res) {
  await ensureSchema();
  const action = String(req.query?.action || "list");
  const uid = getSessionUserId(req);
  if (action === "list" && req.method === "GET") {
    const placeId = String(req.query?.placeId || "").slice(0,120);
    if (!placeId) return res.status(400).json({ error:"장소 정보가 없어요." });
    const { rows } = await sql`
      select r.id,r.place_id,r.place_name,r.rating,r.content,r.like_count,r.created_at,r.updated_at,
             coalesce(u.nickname,'PetGrow 회원') nickname,
             (r.user_id=${uid || ""}) is_owner,
             exists(select 1 from pg_place_review_likes l where l.review_id=r.id and l.user_id=${uid || ""}) liked
      from pg_place_reviews r join pg_users u on u.id=r.user_id
      where r.place_id=${placeId} and r.status='visible'
      order by r.created_at desc limit 80
    `;
    const { rows: summary } = await sql`select count(*)::int count,coalesce(round(avg(rating)::numeric,1),0) avg from pg_place_reviews where place_id=${placeId} and status='visible'`;
    return res.status(200).json({ items:rows, summary:summary[0] || {count:0,avg:0} });
  }
  if (!uid) return res.status(401).json({ error:"로그인 후 이용할 수 있어요." });
  if (action === "write" && req.method === "POST") {
    const placeId=String(req.body?.placeId||"").slice(0,120), placeName=String(req.body?.placeName||"").trim().slice(0,120);
    const rating=Math.max(1,Math.min(5,Number(req.body?.rating)||0)), content=String(req.body?.content||"").trim();
    if(!placeId||!placeName||!rating)return res.status(400).json({error:"장소와 별점을 확인해 주세요."});
    const bad=validatePlaceReviewText(content); if(bad)return res.status(400).json({error:bad});
    const id=crypto.randomUUID();
    await sql`insert into pg_place_reviews(id,place_id,place_name,user_id,rating,content) values(${id},${placeId},${placeName},${uid},${rating},${content})`;
    return res.status(201).json({ok:true,id});
  }
  if (action === "update" && req.method === "POST") {
    const reviewId=String(req.body?.reviewId||"");
    const rating=Math.max(1,Math.min(5,Number(req.body?.rating)||0));
    const content=String(req.body?.content||"").trim();
    if(!reviewId||!rating)return res.status(400).json({error:"후기 정보를 확인해 주세요."});
    const bad=validatePlaceReviewText(content); if(bad)return res.status(400).json({error:bad});
    const {rowCount}=await sql`update pg_place_reviews set rating=${rating},content=${content},updated_at=now() where id=${reviewId} and user_id=${uid} and status='visible'`;
    if(!rowCount)return res.status(403).json({error:"본인이 작성한 후기만 수정할 수 있어요."});
    return res.status(200).json({ok:true});
  }
  if (action === "delete" && req.method === "POST") {
    const reviewId=String(req.body?.reviewId||"");
    if(!reviewId)return res.status(400).json({error:"후기 정보가 없어요."});
    const {rowCount}=await sql`delete from pg_place_reviews where id=${reviewId} and user_id=${uid}`;
    if(!rowCount)return res.status(403).json({error:"본인이 작성한 후기만 삭제할 수 있어요."});
    return res.status(200).json({ok:true});
  }
  if (action === "like" && req.method === "POST") {
    const reviewId=String(req.body?.reviewId||""); if(!reviewId)return res.status(400).json({error:"후기 정보가 없어요."});
    const {rows}=await sql`select 1 from pg_place_review_likes where review_id=${reviewId} and user_id=${uid}`;
    if(rows[0]){await sql`delete from pg_place_review_likes where review_id=${reviewId} and user_id=${uid}`;await sql`update pg_place_reviews set like_count=greatest(0,like_count-1) where id=${reviewId}`;return res.status(200).json({liked:false});}
    await sql`insert into pg_place_review_likes(review_id,user_id) values(${reviewId},${uid}) on conflict do nothing`;await sql`update pg_place_reviews set like_count=like_count+1 where id=${reviewId}`;return res.status(200).json({liked:true});
  }
  if (action === "report" && req.method === "POST") {
    const reviewId=String(req.body?.reviewId||""), reason=String(req.body?.reason||"other").slice(0,40), detail=String(req.body?.detail||"").trim().slice(0,300);
    if(!reviewId)return res.status(400).json({error:"후기 정보가 없어요."});
    const id=crypto.randomUUID();
    try{await sql`insert into pg_place_review_reports(id,review_id,reporter_user_id,reason,detail) values(${id},${reviewId},${uid},${reason},${detail||null})`;}catch(e){if(String(e?.message||"").includes("duplicate"))return res.status(200).json({ok:true,already:true});throw e;}
    return res.status(201).json({ok:true});
  }
  return res.status(405).json({error:"지원하지 않는 요청이에요."});
}

async function handleNearby(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const key = process.env.KAKAO_REST_API_KEY;
  const { lat, lng, category = "all", area = "" } = req.query || {};
  const keywords = {
    all: ["동물병원", "24시 동물병원", "동물약국", "반려동물용품", "펫샵", "애견미용", "고양이미용", "반려동물 미용", "애견호텔", "반려동물 호텔", "반려동물 유치원", "애견유치원"],
    hospital: ["동물병원", "24시 동물병원", "동물의료센터", "동물메디컬센터"],
    pharmacy: ["동물약국"],
    shop: ["반려동물용품", "펫샵", "애견용품", "고양이용품"],
    grooming: ["애견미용", "고양이미용", "반려동물 미용", "펫미용"],
    hotel: ["애견호텔", "반려동물 호텔", "반려동물 유치원", "애견유치원", "펫호텔"]
  };
  const qs = keywords[category] || keywords.all;
  const nLat = Number(lat), nLng = Number(lng);
  const hasCoord = Number.isFinite(nLat) && Number.isFinite(nLng) && Math.abs(nLat) <= 90 && Math.abs(nLng) <= 180;
  const all = [];
  let kakaoOk = false;
  let kakaoStatus = null;
  let searchRadius = hasCoord ? 1000 : null;

  const norm = (v) => String(v || "").replace(/[^0-9A-Za-z가-힣]/g, "").toLowerCase();
  const uniqueCount = (rows) => {
    const set = new Set();
    for (const x of rows) {
      const coord = Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lng)) ? `${Number(x.lat).toFixed(4)},${Number(x.lng).toFixed(4)}` : "";
      set.add(`${norm(x.name)}|${coord || norm(x.address)}`);
    }
    return set.size;
  };
  const calcDistance = (a,b,c,d) => {
    const rad=Math.PI/180,R=6371000,x=(c-a)*rad,y=(d-b)*rad;
    const aa=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;
    return Math.round(2*R*Math.asin(Math.sqrt(aa)));
  };

  // 카카오: 좌표 반경 + 거리순. 페이지 1~3까지 조회해서 가까운 업체 누락을 줄입니다.
  const fetchKakaoAtRadius = async (radius) => {
    if (!key) return [];
    const batches = await Promise.all(qs.map(async (kw) => {
      const rows=[];
      for (let page=1; page<=5; page++) {
        try {
          const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
          u.searchParams.set("query", area ? `${area} ${kw}` : kw);
          u.searchParams.set("size", "15");
          u.searchParams.set("page", String(page));
          if (hasCoord) {
            u.searchParams.set("x", String(nLng)); u.searchParams.set("y", String(nLat));
            u.searchParams.set("radius", String(radius)); u.searchParams.set("sort", "distance");
          }
          const r = await fetch(u, { headers: { Authorization: `KakaoAK ${key}` } });
          kakaoStatus = r.status;
          if (!r.ok) break;
          kakaoOk = true;
          const j = await r.json();
          const docs=j.documents||[];
          rows.push(...docs.map((d) => {
            const type = placeType(d.category_name, kw);
            const plat=Number(d.y), plng=Number(d.x);
            return {
              id: d.id, sourceId:d.id, name: d.place_name, phone: d.phone || "", address: d.road_address_name || d.address_name || "",
              roadAddress: d.road_address_name || "", category: d.category_name || "", typeKey:type.key, typeLabel:type.label, typeIcon:type.icon,
              lat: plat, lng: plng, distance: d.distance ? Number(d.distance) : (hasCoord ? calcDistance(nLat,nLng,plat,plng) : null), url: d.place_url || "", source:"kakao"
            };
          }));
          if (j.meta?.is_end || docs.length < 15) break;
        } catch (e) { console.warn("kakao nearby keyword failed", kw, e?.message); break; }
      }
      return rows;
    }));
    return batches.flat();
  };

  // OSM 보조 검색을 '카카오가 0건일 때만'이 아니라 매 반경에서 함께 사용합니다.
  // 카카오 DB에 누락된 1km 이내 병원/매장도 보완할 수 있습니다.
  const fetchOsmAtRadius = async (radius) => {
    if (!hasCoord) return [];
    try {
      const typeFilter = category === "hospital" ? `nwr(around:${radius},LAT,LNG)["amenity"="veterinary"];` :
        category === "shop" ? `nwr(around:${radius},LAT,LNG)["shop"="pet"];` :
        category === "grooming" ? `nwr(around:${radius},LAT,LNG)["shop"="pet_grooming"];` :
        category === "hotel" ? `nwr(around:${radius},LAT,LNG)["amenity"="animal_boarding"];` :
        category === "pharmacy" ? `nwr(around:${radius},LAT,LNG)["name"~"동물약국",i];` :
        `nwr(around:${radius},LAT,LNG)["amenity"="veterinary"];nwr(around:${radius},LAT,LNG)["shop"="pet"];nwr(around:${radius},LAT,LNG)["shop"="pet_grooming"];nwr(around:${radius},LAT,LNG)["amenity"="animal_boarding"];nwr(around:${radius},LAT,LNG)["name"~"동물병원|동물약국|펫|애견|애묘|반려동물",i];`;
      const body = `[out:json][timeout:9];(${typeFilter.replaceAll('LAT',String(nLat)).replaceAll('LNG',String(nLng))});out center tags 80;`;
      const or = await fetch("https://overpass-api.de/api/interpreter", { method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}, body:`data=${encodeURIComponent(body)}` });
      if (!or.ok) return [];
      const oj = await or.json();
      const rows=[];
      for (const e of oj.elements || []) {
        const tags=e.tags||{}, plat=Number(e.lat ?? e.center?.lat), plng=Number(e.lon ?? e.center?.lon);
        if(!Number.isFinite(plat)||!Number.isFinite(plng)||!tags.name) continue;
        const raw=`${tags.amenity||""} ${tags.shop||""} ${tags.name||""}`;
        const type = /veterinary|동물병원/.test(raw) ? {key:"hospital",label:"동물병원",icon:"🏥"} : /pet_grooming|미용/.test(raw) ? {key:"grooming",label:"펫미용",icon:"✂️"} : /animal_boarding|호텔|유치원/.test(raw) ? {key:"hotel",label:"호텔·유치원",icon:"🏡"} : /약국/.test(raw) ? {key:"pharmacy",label:"동물약국",icon:"💊"} : {key:"shop",label:"펫샵·용품",icon:"🛍️"};
        const addr=[tags["addr:road"],tags["addr:housenumber"],tags["addr:district"]].filter(Boolean).join(" ") || tags["addr:full"] || "";
        rows.push({id:`osm-${e.type}-${e.id}`,sourceId:String(e.id),name:tags.name,phone:tags.phone||tags["contact:phone"]||"",address:addr,roadAddress:addr,category:type.label,typeKey:type.key,typeLabel:type.label,typeIcon:type.icon,lat:plat,lng:plng,distance:calcDistance(nLat,nLng,plat,plng),url:tags.website||tags["contact:website"]||"",source:"osm"});
      }
      return rows;
    } catch(e) { console.warn("OSM nearby supplemental failed", e?.message); return []; }
  };

  if (hasCoord) {
    // 핵심 원칙: 1km 결과가 하나라도 있으면 그 결과만 보여줍니다.
    // 먼 3~5km 결과가 가까운 장소를 밀어내지 않게 하고, 1km를 가장 촘촘하게 검색합니다.
    const firstRadius = 1000;
    searchRadius = firstRadius;
    const [kakao1km, osm1km] = await Promise.all([fetchKakaoAtRadius(firstRadius), fetchOsmAtRadius(firstRadius)]);
    all.push(...kakao1km, ...osm1km);

    // 1km에서 정말 아무 장소도 못 찾았을 때만 3km, 이후 5km를 안전장치로 사용합니다.
    if (uniqueCount(all.filter(x => Number(x.distance) <= 1000)) === 0) {
      for (const radius of [3000, 5000]) {
        searchRadius = radius;
        const [kakaoRows, osmRows] = await Promise.all([fetchKakaoAtRadius(radius), fetchOsmAtRadius(radius)]);
        all.push(...kakaoRows, ...osmRows);
        if (uniqueCount(all.filter(x => Number(x.distance) <= radius)) > 0) break;
      }
    }
  } else if (key) {
    all.push(...await fetchKakaoAtRadius(5000));
  }

  // 모든 보조 소스가 비었을 때만 Nominatim을 최종 안전장치로 사용합니다.
  if (hasCoord && all.length === 0) {
    try {
      const delta = 0.05;
      const viewbox = `${nLng-delta},${nLat+delta},${nLng+delta},${nLat-delta}`;
      const fallbackTerms = category === "hospital" ? ["동물병원","veterinary"] : category === "pharmacy" ? ["동물약국"] : category === "shop" ? ["펫샵","pet shop"] : category === "grooming" ? ["애견미용","pet grooming"] : category === "hotel" ? ["애견호텔","반려동물 유치원"] : ["동물병원","펫샵","애견미용","애견호텔","동물약국"];
      for (const term of fallbackTerms) {
        const nu = new URL("https://nominatim.openstreetmap.org/search");
        nu.searchParams.set("format","jsonv2"); nu.searchParams.set("q",term); nu.searchParams.set("limit","10"); nu.searchParams.set("bounded","1"); nu.searchParams.set("viewbox",viewbox); nu.searchParams.set("addressdetails","1");
        const nr = await fetch(nu,{headers:{"User-Agent":"PetGrow/1.0 (help.petgrow@gmail.com)","Accept-Language":"ko"}});
        if(!nr.ok) continue;
        const nj=await nr.json();
        for(const d of nj||[]){
          const plat=Number(d.lat),plng=Number(d.lon); if(!Number.isFinite(plat)||!Number.isFinite(plng)) continue;
          const raw=`${d.type||""} ${d.category||""} ${d.display_name||""} ${term}`;
          const type=/veterinary|동물병원/.test(raw)?{key:"hospital",label:"동물병원",icon:"🏥"}:/groom|미용/.test(raw)?{key:"grooming",label:"펫미용",icon:"✂️"}:/hotel|boarding|유치원/.test(raw)?{key:"hotel",label:"호텔·유치원",icon:"🏡"}:/약국/.test(raw)?{key:"pharmacy",label:"동물약국",icon:"💊"}:{key:"shop",label:"펫샵·용품",icon:"🛍️"};
          const distance=calcDistance(nLat,nLng,plat,plng);
          all.push({id:`nom-${d.osm_type||"x"}-${d.osm_id||crypto.randomUUID()}`,sourceId:String(d.osm_id||""),name:String(d.name||String(d.display_name||"").split(',')[0]||term),phone:"",address:String(d.display_name||""),roadAddress:String(d.display_name||""),category:type.label,typeKey:type.key,typeLabel:type.label,typeIcon:type.icon,lat:plat,lng:plng,distance,url:"",source:"nominatim"});
        }
      }
    } catch(e) { console.warn("Nominatim nearby fallback failed", e?.message); }
  }

  // 보조 데이터의 전화번호/카카오맵 링크를 카카오 상호명 대조로 보완합니다.
  if (key && hasCoord) {
    const missing = all.filter(x => (!x.phone || !x.url) && x.name && x.source !== "kakao").slice(0,20);
    await Promise.all(missing.map(async x => {
      try {
        const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
        u.searchParams.set("query", x.name);u.searchParams.set("size","5");u.searchParams.set("x",String(x.lng||nLng));u.searchParams.set("y",String(x.lat||nLat));u.searchParams.set("radius","3000");u.searchParams.set("sort","distance");
        const r=await fetch(u,{headers:{Authorization:`KakaoAK ${key}`}});if(!r.ok)return;const j=await r.json();
        const target=norm(x.name);
        const hit=(j.documents||[]).find(d=>norm(d.place_name)===target)||(j.documents||[]).find(d=>Number(d.distance||999999)<250);
        if(hit){x.phone=hit.phone||x.phone||"";x.url=hit.place_url||x.url||"";x.address=hit.road_address_name||hit.address_name||x.address;x.roadAddress=hit.road_address_name||x.roadAddress||"";}
      } catch {}
    }));
  }

  // 이름+근접좌표 기준 중복 제거. 카카오 결과를 우선 보존합니다.
  all.sort((a,b)=>(a.source==="kakao"?-1:0)-(b.source==="kakao"?-1:0));
  const items=[];
  for (const x of all) {
    if (!x.id || !Number.isFinite(Number(x.lat)) || !Number.isFinite(Number(x.lng))) continue;
    const dup=items.find(y => {
      if (y.source === x.source && y.sourceId && x.sourceId && String(y.sourceId) === String(x.sourceId)) return true;
      const near = calcDistance(Number(y.lat), Number(y.lng), Number(x.lat), Number(x.lng)) <= 30;
      const sameName = norm(y.name) && norm(y.name) === norm(x.name);
      // 같은 상호라도 멀리 떨어진 지점은 별도 업체로 유지합니다.
      return near && sameName;
    });
    if (dup) {
      if(!dup.phone&&x.phone)dup.phone=x.phone;
      if(!dup.url&&x.url)dup.url=x.url;
      if(!dup.address&&x.address)dup.address=x.address;
      dup.distance=Math.min(Number(dup.distance??1e12),Number(x.distance??1e12));
      continue;
    }
    items.push(x);
  }
  items.sort((a, b) => (a.distance ?? 1e12) - (b.distance ?? 1e12));
  const within1km=items.filter(x=>Number(x.distance)<=1000).length;
  // 1km 결과가 있으면 사용자에게는 1km 결과만 노출합니다.
  const visibleItems = within1km > 0 ? items.filter(x=>Number(x.distance)<=1000) : items.filter(x=>Number(x.distance)<=Number(searchRadius||5000));
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
  return res.status(200).json({ items: visibleItems.slice(0, 80), searchRadius: within1km > 0 ? 1000 : searchRadius, within1km, source: kakaoOk ? (visibleItems.some(x=>x.source!=="kakao")?"kakao+fallback":"kakao") : (visibleItems[0]?.source||"fallback"), kakaoStatus });
}

export default async function handler(req, res) {
  const route = String(req.query?.route || "");
  try {
    if (route === "me") return await handleMe(req, res);
    if (route === "state") return await handleState(req, res);
    if (route === "health-event") return await handleHealthEvent(req, res);
    if (route === "nearby") return await handleNearby(req, res);
    if (route === "nearby-reviews") return await handleNearbyReviews(req, res);
    return res.status(404).json({ error: "not found" });
  } catch (error) {
    console.error("core api error", route, error);
    return res.status(500).json({ error: "internal server error" });
  }
}
