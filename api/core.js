import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { getUserById, getState, setState, logServiceHealth, ensureSchema } from "../server_lib/db.js";
import { isAdminUserId } from "../server_lib/admin.js";
import proj4 from "proj4";

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


const PUBLIC_NEARBY_SOURCES = {
  hospital: { env: "PUBLIC_DATA_HOSPITAL_KEY", base: "animal_hospitals", label: "동물병원", icon: "🏥" },
  pharmacy: { env: "PUBLIC_DATA_PHARMACY_KEY", base: "animal_pharmacies", label: "동물약국", icon: "💊" },
  grooming: { env: "PUBLIC_DATA_GROOMING_KEY", base: "pet_grooming", label: "펫미용", icon: "✂️" },
  hotel: { env: "PUBLIC_DATA_BOARDING_KEY", base: "animal_boarding", label: "호텔·유치원", icon: "🏡" },
  shop: { env: "PUBLIC_DATA_SALES_KEY", base: "animal_sales", label: "펫샵·판매", icon: "🛍️" },
};

const EPSG5174 = "+proj=tmerc +lat_0=38 +lon_0=127.002890277778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +towgs84=-145.907,505.034,685.756,-1.162,2.347,1.592,6.342 +units=m +no_defs +type=crs";
proj4.defs("EPSG:5174", EPSG5174);

function deepRows(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    if (value.length && value.some(v => v && typeof v === "object" && !Array.isArray(v))) return value;
    for (const v of value) { const hit = deepRows(v); if (hit.length) return hit; }
    return [];
  }
  for (const k of ["items","item","data","rows","row","list"]) {
    if (value[k]) { const hit = deepRows(value[k]); if (hit.length) return hit; }
  }
  for (const v of Object.values(value)) { const hit = deepRows(v); if (hit.length) return hit; }
  return [];
}
function pickField(row, names) {
  if (!row || typeof row !== "object") return "";
  const lower = new Map(Object.keys(row).map(k => [k.toLowerCase().replace(/[^a-z0-9가-힣]/g,""), k]));
  for (const n of names) {
    if (row[n] != null && String(row[n]).trim() !== "") return row[n];
    const key = lower.get(String(n).toLowerCase().replace(/[^a-z0-9가-힣]/g,""));
    if (key && row[key] != null && String(row[key]).trim() !== "") return row[key];
  }
  return "";
}
function publicCoordToWgs84(row, refLat, refLng) {
  const xRaw = Number(pickField(row,["CRD_INFO_X","crdInfoX","CRDNT_X","crdntX","X","x","좌표X","좌표정보x(epsg5174)"]));
  const yRaw = Number(pickField(row,["CRD_INFO_Y","crdInfoY","CRDNT_Y","crdntY","Y","y","좌표Y","좌표정보y(epsg5174)"]));
  if (!Number.isFinite(xRaw) || !Number.isFinite(yRaw)) return null;
  const candidates=[];
  for (const pair of [[xRaw,yRaw],[yRaw,xRaw]]) {
    try {
      const [lng,lat]=proj4("EPSG:5174","EPSG:4326",pair);
      if (Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=32&&lat<=40&&lng>=124&&lng<=132) {
        const d=(Number.isFinite(refLat)&&Number.isFinite(refLng))?Math.hypot(lat-refLat,lng-refLng):0;
        candidates.push({lat,lng,d});
      }
    } catch {}
  }
  candidates.sort((a,b)=>a.d-b.d);
  return candidates[0]||null;
}
async function kakaoRegionForCoord(key, lat, lng) {
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const u=new URL("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json");
    u.searchParams.set("x",String(lng));u.searchParams.set("y",String(lat));
    const r=await fetch(u,{headers:{Authorization:`KakaoAK ${key}`}});
    if(!r.ok)return null;const j=await r.json();
    const road=(j.documents||[]).find(x=>x.region_type==="H")||(j.documents||[])[0];
    if(!road)return null;
    return { province:road.region_1depth_name||"", district:road.region_2depth_name||"", dong:road.region_3depth_name||"" };
  } catch { return null; }
}
function isMaskedPublicAddress(v) {
  const s=String(v||"").trim();
  return !s || /\*{2,}|○○|OOO|상세주소\s*비공개/i.test(s);
}
function publicRegionFallback(region) {
  return [region?.province, region?.district, region?.dong].filter(Boolean).join(" ").trim();
}
async function resolvePublicPlaceWithKakao(kakaoKey, row, type, region, refLat, refLng) {
  if (!kakaoKey) return null;
  const name=String(pickField(row,["BPLC_NM","bplcNm","사업장명","BPLCNM","사업장명칭","업소명"])||"").trim();
  const road=String(pickField(row,["ROAD_NM_ADDR","roadNmAddr","도로명전체주소","RDNWHLADDR","도로명주소"])||"").trim();
  const lot=String(pickField(row,["LOTNO_ADDR","lotnoAddr","소재지전체주소","SITEWHLADDR","지번주소"])||"").trim();
  const district=String(region?.district||"").trim();
  const candidates=[];
  try {
    // 1) 공개데이터의 도로명/지번주소가 있으면 카카오 주소검색으로 좌표를 복구합니다.
    for (const addr of [road,lot].filter(Boolean)) {
      const clean=addr.replace(/\*{2,}[^,)]*/g,"").replace(/\s+/g," ").trim();
      if (!clean || clean.length < 5) continue;
      const u=new URL("https://dapi.kakao.com/v2/local/search/address.json");
      u.searchParams.set("query",clean);
      const r=await fetch(u,{headers:{Authorization:`KakaoAK ${kakaoKey}`}});
      if(r.ok){const j=await r.json();for(const d of j.documents||[]){const lat=Number(d.y),lng=Number(d.x);if(Number.isFinite(lat)&&Number.isFinite(lng))candidates.push({lat,lng,address:d.road_address?.address_name||d.address?.address_name||clean,roadAddress:d.road_address?.address_name||"",phone:"",url:"",name:"",score:0});}}
      if(candidates.length) break;
    }
    // 2) 주소 좌표가 없으면 공식 상호명 + 구 이름으로 장소검색합니다. 좌표 0인 신규 병원도 이 경로로 복구됩니다.
    if (!candidates.length && name) {
      const u=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
      u.searchParams.set("query",[district,name].filter(Boolean).join(" "));
      u.searchParams.set("size","10");
      if(Number.isFinite(refLat)&&Number.isFinite(refLng)){u.searchParams.set("x",String(refLng));u.searchParams.set("y",String(refLat));u.searchParams.set("radius","5000");u.searchParams.set("sort","distance");}
      const r=await fetch(u,{headers:{Authorization:`KakaoAK ${kakaoKey}`}});
      if(r.ok){const j=await r.json();const nn=v=>String(v||"").replace(/[^0-9A-Za-z가-힣]/g,"").toLowerCase();const target=nn(name);for(const d of j.documents||[]){const lat=Number(d.y),lng=Number(d.x);if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;const dn=nn(d.place_name);const score=dn===target?0:(dn.includes(target)||target.includes(dn)?1:2);candidates.push({lat,lng,address:d.road_address_name||d.address_name||road||lot,roadAddress:d.road_address_name||"",phone:d.phone||"",url:d.place_url||"",name:d.place_name||"",score});}}
    }
  } catch {}
  if(!candidates.length)return null;
  candidates.sort((a,b)=>a.score-b.score || ((Number.isFinite(refLat)&&Number.isFinite(refLng))?Math.hypot(a.lat-refLat,a.lng-refLng)-Math.hypot(b.lat-refLat,b.lng-refLng):0));
  return candidates[0];
}
async function fetchPublicNearby(type, region, refLat, refLng, kakaoKey) {
  const cfg=PUBLIC_NEARBY_SOURCES[type];
  if(!cfg)return [];
  const serviceKey=String(process.env[cfg.env]||"").trim();
  if(!serviceKey)return [];
  const district=String(region?.district||"").trim();
  const province=String(region?.province||"").trim();
  const queryAddr=district||province;
  const rows=[];
  const seenRows=new Set();
  try {
    const base=`https://apis.data.go.kr/1741000/${cfg.base}/info`;
    const pageSize=1000;
    // 공식 명세에서 지원하는 ROAD_NM_ADDR 조건으로 시·군·구 후보를 충분히 가져옵니다.
    // 영업상태 01을 함께 요청해 폐업 데이터 때문에 페이지가 소모되는 것도 줄입니다.
    const addrFields=queryAddr?["ROAD_NM_ADDR"]:[null];
    for(const addrField of addrFields){
      for(let page=1;page<=10;page++){
        const tail=[`pageNo=${page}`,`numOfRows=${pageSize}`,`returnType=json`,`cond%5BSALS_STTS_CD%3A%3AEQ%5D=01`];
        if(addrField&&queryAddr)tail.push(`cond%5B${addrField}%3A%3ALIKE%5D=${encodeURIComponent(queryAddr)}`);
        const url=`${base}?serviceKey=${serviceKey}&${tail.join("&")}`;
        const r=await fetch(url,{headers:{Accept:"application/json"}});
        if(!r.ok)break;
        const text=await r.text();
        let j;try{j=JSON.parse(text);}catch{break;}
        const batch=deepRows(j);
        if(!batch.length)break;
        for(const row of batch){
          const rid=String(pickField(row,["MNG_NO","mngNo","관리번호","MANAGE_NO"])||"");
          const road=String(pickField(row,["ROAD_NM_ADDR","roadNmAddr","도로명전체주소","RDNWHLADDR","도로명주소"])||"");
          const lot=String(pickField(row,["LOTNO_ADDR","lotnoAddr","소재지전체주소","SITEWHLADDR","지번주소"])||"");
          const k=rid||`${String(pickField(row,["BPLC_NM","bplcNm","사업장명","업소명"])||"")}|${road}|${lot}`;
          if(seenRows.has(k))continue;
          seenRows.add(k);rows.push(row);
        }
        if(batch.length<pageSize)break;
      }
    }
  } catch(e){console.warn("public nearby failed",type,e?.message);return [];}
  const out=[];
  const regionText=publicRegionFallback(region);
  for(const row of rows){
    const status=String(pickField(row,["DTL_SALS_STTS_NM","dtlSalsSttsNm","SALS_STTS_NM","salesStatusName","영업상태명","TRDSTATENM","영업상태"] )||"");
    const statusCode=String(pickField(row,["DTL_SALS_STTS_CD","dtlSalsSttsCd","SALS_STTS_CD","salesStatusCode","영업상태구분코드","TRDSTATEGBN"] )||"");
    if(/폐업|취소|말소|휴업|중지/.test(status))continue;
    if(statusCode && !["01","1","정상","영업"].includes(statusCode) && /02|03|04/.test(statusCode))continue;
    const name=String(pickField(row,["BPLC_NM","bplcNm","사업장명","BPLCNM","사업장명칭","업소명"] )||"").trim();
    if(!name)continue;
    const road=String(pickField(row,["ROAD_NM_ADDR","roadNmAddr","도로명전체주소","RDNWHLADDR","도로명주소"] )||"").trim();
    const lot=String(pickField(row,["LOTNO_ADDR","lotnoAddr","소재지전체주소","SITEWHLADDR","지번주소"] )||"").trim();
    const rawAddress=road||lot;
    let coord=publicCoordToWgs84(row,refLat,refLng);
    let enriched=null;
    // 일부 공식 인허가 데이터는 좌표가 0/공란입니다. 이 경우 상호명·주소를 이용해 카카오에서 좌표를 복구합니다.
    if(!coord) enriched=await resolvePublicPlaceWithKakao(kakaoKey,row,type,region,refLat,refLng);
    if(!coord && enriched) coord={lat:enriched.lat,lng:enriched.lng};
    if(!coord)continue;
    const phone=String(pickField(row,["TELNO","telno","전화번호","SITETEL","SITE_TELNO","전화번호정보"] )||"").trim();
    const displayAddress=(enriched?.address || (!isMaskedPublicAddress(rawAddress)?rawAddress:regionText) || "").trim();
    out.push({
      id:`public-${type}-${String(pickField(row,["MNG_NO","mngNo","관리번호","MANAGE_NO"])||name+rawAddress).replace(/[^0-9A-Za-z가-힣]/g,"").slice(0,80)}`,
      sourceId:String(pickField(row,["MNG_NO","mngNo","관리번호","MANAGE_NO"])||""),name:enriched?.name||name,phone:enriched?.phone||phone,
      address:displayAddress,
      roadAddress:enriched?.roadAddress||(!isMaskedPublicAddress(road)?road:""),
      rawPublicAddress:rawAddress,addressMasked:isMaskedPublicAddress(rawAddress)&&!enriched?.address,
      category:cfg.label,typeKey:type,typeLabel:cfg.label,typeIcon:cfg.icon,lat:coord.lat,lng:coord.lng,
      distance:null,url:enriched?.url||"",source:"public",official:true,status:status||"영업"
    });
  }
  return out;
}

async function handleNearby(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const key = process.env.KAKAO_REST_API_KEY;
  const { lat, lng, userLat, userLng, category = "all", area = "" } = req.query || {};
  const keywords = {
    all: ["동물병원", "24시 동물병원", "동물약국", "반려동물용품", "펫샵", "애견미용", "고양이미용", "반려동물 미용", "애견호텔", "반려동물 호텔", "반려동물 유치원", "애견유치원"],
    hospital: ["동물병원", "24시 동물병원", "동물의료센터", "동물메디컬센터"],
    pharmacy: ["동물약국"],
    shop: ["반려동물용품", "펫샵", "애견용품", "고양이용품"],
    grooming: ["애견미용", "고양이미용", "반려동물 미용", "펫미용"],
    hotel: ["애견호텔", "반려동물 호텔", "반려동물 유치원", "애견유치원", "펫호텔"]
  };
  const qs = keywords[category] || keywords.all;
  let nLat = Number(lat), nLng = Number(lng);
  let hasCoord = Number.isFinite(nLat) && Number.isFinite(nLng) && Math.abs(nLat) <= 90 && Math.abs(nLng) <= 180;
  const uLat=Number(userLat),uLng=Number(userLng);
  const hasUserCoord=Number.isFinite(uLat)&&Number.isFinite(uLng)&&Math.abs(uLat)<=90&&Math.abs(uLng)<=180;
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
  const areaText=String(area||"").trim();
  const compactArea=areaText.replace(/\s+/g," ");
  // 구/동만 입력한 넓은 지역 검색은 상세주소보다 넓은 반경을 사용합니다.
  const coarseDistrict=/^[가-힣]+구$/.test(compactArea) || /^(?:[가-힣]+[도시]\s+)?[가-힣]+구$/.test(compactArea);
  const coarseDong=/^[가-힣0-9·.]+(?:동|읍|면|리)$/.test(compactArea) || /^(?:[가-힣]+구\s+)?[가-힣0-9·.]+(?:동|읍|면|리)$/.test(compactArea);
  const preferredRadius=(coarseDistrict||coarseDong)?3000:1000;

  // 주소 검색은 입력한 주소를 중심점으로 삼습니다. 현재 위치는 검색 기준이 아니라 거리 표시용입니다.
  if(!hasCoord && key && String(area||"").trim()){
    try{
      const au=new URL("https://dapi.kakao.com/v2/local/search/address.json");
      au.searchParams.set("query",String(area).trim());
      const ar=await fetch(au,{headers:{Authorization:`KakaoAK ${key}`}});
      if(ar.ok){const aj=await ar.json();const d=aj.documents?.[0];if(d){nLat=Number(d.y);nLng=Number(d.x);hasCoord=Number.isFinite(nLat)&&Number.isFinite(nLng);}}
      if(!hasCoord){
        // '강남구', '역삼동'처럼 주소 API가 직접 좌표를 주지 않는 행정구역도 인식합니다.
        const variants=[areaText, `${areaText} 주민센터`, `${areaText} 행정복지센터`, `${areaText} 구청`];
        for(const v of variants){
          const ku=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");ku.searchParams.set("query",v);ku.searchParams.set("size","5");
          const kr=await fetch(ku,{headers:{Authorization:`KakaoAK ${key}`}});
          if(!kr.ok)continue;
          const kj=await kr.json();
          const docs=kj.documents||[];
          const d=docs.find(x=>String(x.address_name||"").includes(areaText)||String(x.road_address_name||"").includes(areaText)||String(x.place_name||"").includes(areaText))||docs[0];
          if(d){nLat=Number(d.y);nLng=Number(d.x);hasCoord=Number.isFinite(nLat)&&Number.isFinite(nLng);if(hasCoord)break;}
        }
      }
    }catch(e){console.warn("address geocode failed",e?.message)}
  }
  if(String(area||"").trim() && !hasCoord) return res.status(400).json({error:"주소를 찾지 못했어요. 도로명주소나 동·구 이름을 조금 더 정확히 입력해 주세요."});

  // 카카오: 좌표 반경 + 거리순. 페이지 1~3까지 조회해서 가까운 업체 누락을 줄입니다.
  const fetchKakaoAtRadius = async (radius) => {
    if (!key) return [];
    const batches = await Promise.all(qs.map(async (kw) => {
      const rows=[];
      for (let page=1; page<=5; page++) {
        try {
          const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
          u.searchParams.set("query", hasCoord ? kw : (areaText ? `${areaText} ${kw}` : kw));
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
    // 공공데이터포털 공식 인허가 5종을 먼저 조회합니다.
    // 주소(구/시)로 후보를 좁힌 뒤 EPSG:5174 좌표를 WGS84로 변환해 실제 현재 위치와의 거리를 계산합니다.
    const region = await kakaoRegionForCoord(key, nLat, nLng);
    const publicTypes = category === "all" ? ["hospital","pharmacy","grooming","hotel","shop"] : (PUBLIC_NEARBY_SOURCES[category] ? [category] : []);
    if (publicTypes.length) {
      const publicBatches = await Promise.all(publicTypes.map(t => fetchPublicNearby(t, region, nLat, nLng, key)));
      for (const row of publicBatches.flat()) { row.distance = calcDistance(nLat,nLng,Number(row.lat),Number(row.lng)); all.push(row); }
    }

    // 핵심 원칙: 1km 결과가 하나라도 있으면 그 결과만 보여줍니다.
    // 먼 3~5km 결과가 가까운 장소를 밀어내지 않게 하고, 1km를 가장 촘촘하게 검색합니다.
    const firstRadius = preferredRadius;
    searchRadius = firstRadius;
    const [kakao1km, osm1km] = await Promise.all([fetchKakaoAtRadius(firstRadius), fetchOsmAtRadius(firstRadius)]);
    all.push(...kakao1km, ...osm1km);

    // 선택한 기본 반경에서 결과가 없으면 최대 5km까지 자동 확대합니다.
    if (uniqueCount(all.filter(x => Number(x.distance) <= firstRadius)) === 0) {
      for (const radius of [3000, 5000].filter(r=>r>firstRadius)) {
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

  // 공공데이터의 마스킹 주소/빈 전화번호는 같은 좌표 주변 카카오 장소정보로 보완합니다.
  if (key && hasCoord) {
    const typeQuery={hospital:"동물병원",pharmacy:"동물약국",grooming:"펫미용",hotel:"애견호텔",shop:"펫샵"};
    const missing = all.filter(x => x.source !== "kakao" && x.name && Number(x.distance) <= 1500 && (!x.phone || !x.url || x.addressMasked || isMaskedPublicAddress(x.address))).slice(0,35);
    await Promise.all(missing.map(async x => {
      try {
        const searchOnce=async(q)=>{
          const u=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
          u.searchParams.set("query",q);u.searchParams.set("size","10");u.searchParams.set("x",String(x.lng||nLng));u.searchParams.set("y",String(x.lat||nLat));u.searchParams.set("radius","700");u.searchParams.set("sort","distance");
          const r=await fetch(u,{headers:{Authorization:`KakaoAK ${key}`}});if(!r.ok)return [];const j=await r.json();return j.documents||[];
        };
        let docs=await searchOnce(x.name);
        if(!docs.length)docs=await searchOnce(typeQuery[x.typeKey]||x.typeLabel||"반려동물");
        const target=norm(x.name);
        let hit=docs.find(d=>norm(d.place_name)===target);
        if(!hit)hit=docs.find(d=>Number(d.distance||999999)<=120);
        if(!hit)return;
        const hd=Number(hit.distance||999999);
        // 좌표가 매우 가까운 경우 카카오 상호명도 사용자 표시명으로 사용해 깨진/축약된 공공데이터명을 보완합니다.
        if(hd<=80 && hit.place_name)x.name=hit.place_name;
        x.phone=hit.phone||x.phone||"";
        x.url=hit.place_url||x.url||"";
        const ka=hit.road_address_name||hit.address_name||"";
        if(ka && (x.addressMasked || isMaskedPublicAddress(x.address))) x.address=ka;
        if(hit.road_address_name)x.roadAddress=hit.road_address_name;
        x.addressMasked=false;
      } catch {}
    }));
  }
  // 카카오에서도 주소를 보완하지 못한 마스킹 주소는 구·동 정도까지만 깔끔하게 표시합니다.
  if(hasCoord){
    const region = await kakaoRegionForCoord(key,nLat,nLng);
    const safeRegion=publicRegionFallback(region);
    for(const x of all){ if(x.addressMasked || isMaskedPublicAddress(x.address)) x.address=safeRegion||x.address||""; }
  }

  // 이름+근접좌표 기준 중복 제거. 카카오 결과를 우선 보존합니다.
  const sourcePriority={public:0,kakao:1,osm:2,nominatim:3};
  all.sort((a,b)=>(sourcePriority[a.source]??9)-(sourcePriority[b.source]??9));
  const items=[];
  for (const x of all) {
    if (!x.id || !Number.isFinite(Number(x.lat)) || !Number.isFinite(Number(x.lng))) continue;
    const dup=items.find(y => {
      if (y.source === x.source && y.sourceId && x.sourceId && String(y.sourceId) === String(x.sourceId)) return true;
      const gap = calcDistance(Number(y.lat), Number(y.lng), Number(x.lat), Number(x.lng));
      const sameName = norm(y.name) && norm(y.name) === norm(x.name);
      const sameAddr = norm(y.address) && norm(y.address) === norm(x.address);
      // 공공 인허가 ↔ 카카오의 좌표차를 고려하되, 같은 상호의 다른 지점은 합치지 않습니다.
      return (sameName && gap <= 120) || (sameAddr && gap <= 180);
    });
    if (dup) {
      if(!dup.phone&&x.phone)dup.phone=x.phone;
      if(!dup.url&&x.url)dup.url=x.url;
      if(!dup.address&&x.address)dup.address=x.address;
      if(x.official)dup.official=true;
      dup.distance=Math.min(Number(dup.distance??1e12),Number(x.distance??1e12));
      continue;
    }
    items.push(x);
  }
  items.sort((a, b) => (a.distance ?? 1e12) - (b.distance ?? 1e12));
  const within1km=items.filter(x=>Number(x.distance)<=1000).length;
  // 1km 결과가 있으면 사용자에게는 1km 결과만 노출합니다.
  const visibleItems = within1km > 0 ? items.filter(x=>Number(x.distance)<=1000) : items.filter(x=>Number(x.distance)<=Number(searchRadius||5000));
  if(hasUserCoord){ for(const x of visibleItems){x.userDistance=calcDistance(uLat,uLng,Number(x.lat),Number(x.lng));} }
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
  const sourceSet=[...new Set(visibleItems.map(x=>x.source).filter(Boolean))];
  return res.status(200).json({ items: visibleItems.slice(0, 100), searchRadius: within1km > 0 ? 1000 : searchRadius, within1km, searchCenter: hasCoord?{lat:nLat,lng:nLng}:null, source: sourceSet.join("+")||"fallback", publicDataConnected: visibleItems.some(x=>x.source==="public"), kakaoStatus });
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
