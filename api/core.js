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
  const kakaoKey = String(process.env.KAKAO_REST_API_KEY || "").trim();
  const { lat, lng, userLat, userLng, category = "all", area = "" } = req.query || {};
  const keywords = {
    all: ["동물병원", "동물약국", "펫샵", "반려동물용품", "애견미용", "펫미용", "애견호텔", "애견유치원"],
    hospital: ["동물병원", "24시 동물병원", "동물의료센터"],
    pharmacy: ["동물약국"],
    shop: ["펫샵", "반려동물용품", "애견용품", "고양이용품"],
    grooming: ["애견미용", "펫미용", "반려동물 미용"],
    hotel: ["애견호텔", "펫호텔", "애견유치원", "반려동물 유치원"]
  };
  const qs = keywords[category] || keywords.all;
  const areaText = String(area || "").replace(/\s+/g, " ").trim();
  const uLat = Number(userLat), uLng = Number(userLng);
  const hasUserCoord = Number.isFinite(uLat) && Number.isFinite(uLng) && Math.abs(uLat) <= 90 && Math.abs(uLng) <= 180;
  let nLat = Number(lat), nLng = Number(lng);
  let hasCoord = Number.isFinite(nLat) && Number.isFinite(nLng) && Math.abs(nLat) <= 90 && Math.abs(nLng) <= 180;
  let kakaoStatus = null;
  let geocodeSource = hasCoord ? "provided" : null;

  const norm = (v) => String(v || "").replace(/[^0-9A-Za-z가-힣]/g, "").toLowerCase();
  const calcDistance = (a,b,c,d) => {
    const rad=Math.PI/180,R=6371000,x=(c-a)*rad,y=(d-b)*rad;
    const aa=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;
    return Math.round(2*R*Math.asin(Math.sqrt(aa)));
  };
  const coarseDistrict = /(?:^|\s)[가-힣]+구$/.test(areaText);
  const coarseDong = /(?:^|\s)[가-힣0-9·.]+(?:동|읍|면|리)$/.test(areaText);
  const preferredRadius = coarseDistrict ? 5000 : coarseDong ? 3000 : 2000;

  // 1) 검색 주소를 좌표로 변환합니다. 카카오맵이 활성화돼 있으면 카카오를 우선 사용합니다.
  if (!hasCoord && areaText && kakaoKey) {
    try {
      const au = new URL("https://dapi.kakao.com/v2/local/search/address.json");
      au.searchParams.set("query", areaText);
      au.searchParams.set("analyze_type", "similar");
      const ar = await fetch(au, { headers:{ Authorization:`KakaoAK ${kakaoKey}` } });
      kakaoStatus = ar.status;
      if (ar.ok) {
        const aj = await ar.json();
        const d = (aj.documents || [])[0];
        if (d) {
          nLat = Number(d.y); nLng = Number(d.x);
          hasCoord = Number.isFinite(nLat) && Number.isFinite(nLng);
          if (hasCoord) geocodeSource = "kakao-address";
        }
      }
    } catch(e) { console.warn("kakao address geocode failed", e?.message); }
  }

  // 2) 구/동처럼 주소 API에서 애매한 검색어는 카카오 장소검색으로 중심점을 잡습니다.
  if (!hasCoord && areaText && kakaoKey) {
    const variants = [areaText, `${areaText} 주민센터`, `${areaText} 행정복지센터`, `${areaText} 구청`];
    for (const v of variants) {
      try {
        const ku = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
        ku.searchParams.set("query", v); ku.searchParams.set("size", "15");
        if (hasUserCoord) { ku.searchParams.set("x", String(uLng)); ku.searchParams.set("y", String(uLat)); ku.searchParams.set("sort", "distance"); }
        const kr = await fetch(ku, { headers:{ Authorization:`KakaoAK ${kakaoKey}` } });
        kakaoStatus = kr.status;
        if (!kr.ok) continue;
        const kj = await kr.json();
        const docs = kj.documents || [];
        const hit = docs.find(x => String(x.address_name||"").includes(areaText) || String(x.road_address_name||"").includes(areaText) || String(x.place_name||"").includes(areaText)) || docs[0];
        if (hit) {
          nLat=Number(hit.y); nLng=Number(hit.x);
          hasCoord=Number.isFinite(nLat)&&Number.isFinite(nLng);
          if (hasCoord) { geocodeSource="kakao-keyword"; break; }
        }
      } catch(e) { console.warn("kakao region keyword failed", e?.message); }
    }
  }

  // 3) 카카오맵 API가 꺼져 있거나 실패한 경우 무료 OSM Nominatim으로 주소 중심점을 보조합니다.
  //    동 이름이 여러 지역에 있으면 현재 위치와 가장 가까운 후보를 우선합니다.
  if (!hasCoord && areaText) {
    try {
      const queries = [areaText, `${areaText}, 대한민국`];
      let candidates = [];
      for (const q of queries) {
        const nu = new URL("https://nominatim.openstreetmap.org/search");
        nu.searchParams.set("format", "jsonv2"); nu.searchParams.set("q", q);
        nu.searchParams.set("countrycodes", "kr"); nu.searchParams.set("limit", "8"); nu.searchParams.set("addressdetails", "1");
        const nr = await fetch(nu, { headers:{ "User-Agent":"PetGrow/1.0 (help.petgrow@gmail.com)", "Accept-Language":"ko" } });
        if (!nr.ok) continue;
        const rows = await nr.json();
        candidates.push(...(rows || []).map(d => ({ lat:Number(d.lat), lng:Number(d.lon), label:d.display_name||"" })).filter(d=>Number.isFinite(d.lat)&&Number.isFinite(d.lng)));
        if (candidates.length) break;
      }
      if (candidates.length) {
        if (hasUserCoord) candidates.sort((a,b)=>calcDistance(uLat,uLng,a.lat,a.lng)-calcDistance(uLat,uLng,b.lat,b.lng));
        nLat=candidates[0].lat; nLng=candidates[0].lng; hasCoord=true; geocodeSource="osm-geocode";
      }
    } catch(e) { console.warn("OSM address geocode failed", e?.message); }
  }

  if (areaText && !hasCoord) {
    const needsActivation = kakaoStatus === 401 || kakaoStatus === 403;
    return res.status(400).json({
      error: needsActivation
        ? "주소 검색 API 연결이 꺼져 있어요. 카카오 Developers에서 PetGrow 앱의 카카오맵 사용 설정을 ON으로 바꿔주세요."
        : "주소를 찾지 못했어요. 구·동·도로명·지번 주소를 다시 확인해 주세요.",
      kakaoStatus, needsMapActivation: needsActivation
    });
  }
  if (!hasCoord) return res.status(400).json({ error:"검색할 주소를 입력해 주세요." });

  const toPlace = (d, kw) => {
    const type = placeType(d.category_name, kw);
    const plat=Number(d.y), plng=Number(d.x);
    return {
      id:d.id, sourceId:d.id, name:d.place_name, phone:d.phone||"",
      address:d.road_address_name||d.address_name||"", roadAddress:d.road_address_name||"",
      category:d.category_name||"", typeKey:type.key, typeLabel:type.label, typeIcon:type.icon,
      lat:plat, lng:plng, distance:calcDistance(nLat,nLng,plat,plng), url:d.place_url||"", source:"kakao"
    };
  };

  // 카카오 장소검색. 좌표 반경검색 + '강남구 동물병원' 같은 주소문자열 직접검색을 함께 사용합니다.
  const fetchKakaoPlaces = async () => {
    if (!kakaoKey) return [];
    const groups = await Promise.all(qs.map(async kw => {
      const rows=[];
      // A. 좌표 중심 반경검색
      for (let page=1; page<=3; page++) {
        try {
          const u=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
          u.searchParams.set("query",kw); u.searchParams.set("size","15"); u.searchParams.set("page",String(page));
          u.searchParams.set("x",String(nLng)); u.searchParams.set("y",String(nLat)); u.searchParams.set("radius","5000"); u.searchParams.set("sort","distance");
          const r=await fetch(u,{headers:{Authorization:`KakaoAK ${kakaoKey}`}}); kakaoStatus=r.status;
          if(!r.ok) break;
          const j=await r.json(); const docs=j.documents||[]; rows.push(...docs.map(d=>toPlace(d,kw)));
          if(j.meta?.is_end||docs.length<15) break;
        } catch(e) { console.warn("kakao radius search failed",kw,e?.message); break; }
      }
      // B. 지역명 직접검색. 중심점이 행정구역의 가장자리여도 결과를 놓치지 않게 합니다.
      if (areaText) {
        for (let page=1; page<=2; page++) {
          try {
            const u=new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
            u.searchParams.set("query",`${areaText} ${kw}`); u.searchParams.set("size","15"); u.searchParams.set("page",String(page));
            const r=await fetch(u,{headers:{Authorization:`KakaoAK ${kakaoKey}`}}); kakaoStatus=r.status;
            if(!r.ok) break;
            const j=await r.json(); const docs=j.documents||[];
            rows.push(...docs.map(d=>toPlace(d,kw)).filter(x=>Number(x.distance)<=10000));
            if(j.meta?.is_end||docs.length<15) break;
          } catch(e) { console.warn("kakao area-text search failed",kw,e?.message); break; }
        }
      }
      return rows;
    }));
    return groups.flat();
  };

  const fetchOsmPlaces = async (radius=5000) => {
    try {
      const filters = category === "hospital" ? `nwr(around:${radius},LAT,LNG)["amenity"="veterinary"];` :
        category === "shop" ? `nwr(around:${radius},LAT,LNG)["shop"="pet"];` :
        category === "grooming" ? `nwr(around:${radius},LAT,LNG)["shop"="pet_grooming"];` :
        category === "hotel" ? `nwr(around:${radius},LAT,LNG)["amenity"="animal_boarding"];` :
        category === "pharmacy" ? `nwr(around:${radius},LAT,LNG)["name"~"동물약국",i];` :
        `nwr(around:${radius},LAT,LNG)["amenity"="veterinary"];nwr(around:${radius},LAT,LNG)["shop"="pet"];nwr(around:${radius},LAT,LNG)["shop"="pet_grooming"];nwr(around:${radius},LAT,LNG)["amenity"="animal_boarding"];nwr(around:${radius},LAT,LNG)["name"~"동물병원|동물약국|펫|애견|애묘|반려동물",i];`;
      const body=`[out:json][timeout:10];(${filters.replaceAll("LAT",String(nLat)).replaceAll("LNG",String(nLng))});out center tags 100;`;
      const endpoints=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
      let oj=null;
      for(const ep of endpoints){
        try{const or=await fetch(ep,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:`data=${encodeURIComponent(body)}`});if(or.ok){oj=await or.json();break;}}catch{}
      }
      if(!oj)return [];
      const rows=[];
      for(const e of oj.elements||[]){
        const tags=e.tags||{}, plat=Number(e.lat??e.center?.lat), plng=Number(e.lon??e.center?.lon);
        if(!Number.isFinite(plat)||!Number.isFinite(plng)||!tags.name)continue;
        const raw=`${tags.amenity||""} ${tags.shop||""} ${tags.name||""}`;
        const type=/veterinary|동물병원/.test(raw)?{key:"hospital",label:"동물병원",icon:"🏥"}:/pet_grooming|미용/.test(raw)?{key:"grooming",label:"펫미용",icon:"✂️"}:/animal_boarding|호텔|유치원/.test(raw)?{key:"hotel",label:"호텔·유치원",icon:"🏡"}:/약국/.test(raw)?{key:"pharmacy",label:"동물약국",icon:"💊"}:{key:"shop",label:"펫샵·용품",icon:"🛍️"};
        const addr=[tags["addr:city"],tags["addr:district"],tags["addr:road"],tags["addr:housenumber"]].filter(Boolean).join(" ")||tags["addr:full"]||"";
        rows.push({id:`osm-${e.type}-${e.id}`,sourceId:String(e.id),name:tags.name,phone:tags.phone||tags["contact:phone"]||"",address:addr,roadAddress:addr,category:type.label,typeKey:type.key,typeLabel:type.label,typeIcon:type.icon,lat:plat,lng:plng,distance:calcDistance(nLat,nLng,plat,plng),url:tags.website||tags["contact:website"]||"",source:"osm"});
      }
      return rows;
    } catch(e){console.warn("OSM nearby failed",e?.message);return [];}
  };

  let all = await fetchKakaoPlaces();
  const kakaoUnavailable = kakaoStatus === 401 || kakaoStatus === 403 || kakaoStatus === 429;
  // 카카오 검색이 비었거나 사용 설정 문제일 때만 무료 OSM을 보조로 호출해 응답시간을 줄입니다.
  if (!all.length || kakaoUnavailable) all.push(...await fetchOsmPlaces(Math.max(preferredRadius,5000)));

  // 중복 제거
  const items=[];
  const sourcePriority={kakao:0,osm:1};
  all.sort((a,b)=>(sourcePriority[a.source]??9)-(sourcePriority[b.source]??9));
  for(const x of all){
    if(!x.id||!Number.isFinite(Number(x.lat))||!Number.isFinite(Number(x.lng)))continue;
    const dup=items.find(y=>{
      const gap=calcDistance(Number(y.lat),Number(y.lng),Number(x.lat),Number(x.lng));
      return (norm(y.name)&&norm(y.name)===norm(x.name)&&gap<=150)||(norm(y.address)&&norm(y.address)===norm(x.address)&&gap<=200);
    });
    if(dup){if(!dup.phone&&x.phone)dup.phone=x.phone;if(!dup.url&&x.url)dup.url=x.url;if(!dup.address&&x.address)dup.address=x.address;continue;}
    items.push(x);
  }
  items.sort((a,b)=>(a.distance??1e12)-(b.distance??1e12));

  // 구 검색은 최대 5km, 동/상세주소는 기본 3km. 결과가 없으면 최대 5km까지 자동 확대합니다.
  let searchRadius=preferredRadius;
  let visible=items.filter(x=>Number(x.distance)<=searchRadius);
  if(!visible.length && searchRadius<5000){searchRadius=5000;visible=items.filter(x=>Number(x.distance)<=5000);}
  // 지역명 직접검색 결과가 5km 밖에만 있는 예외 상황에서는 가장 가까운 결과도 일부 보여줍니다.
  if(!visible.length && items.length) { searchRadius=10000; visible=items.filter(x=>Number(x.distance)<=10000).slice(0,40); }
  if(hasUserCoord){for(const x of visible)x.userDistance=calcDistance(uLat,uLng,Number(x.lat),Number(x.lng));}

  const needsMapActivation = kakaoStatus===401||kakaoStatus===403;
  const warning = needsMapActivation
    ? "카카오맵 API 사용 설정이 꺼져 있어 무료 OSM 보조검색으로 표시했어요. 카카오맵 사용 설정을 ON으로 바꾸면 국내 장소검색 정확도가 크게 좋아져요."
    : (kakaoStatus===429 ? "카카오맵 무료 쿼터를 초과해 OSM 보조검색으로 표시했어요." : "");
  res.setHeader("Cache-Control","s-maxage=30, stale-while-revalidate=60");
  return res.status(200).json({
    items:visible.slice(0,100), searchRadius, within1km:visible.filter(x=>Number(x.distance)<=1000).length,
    searchCenter:{lat:nLat,lng:nLng}, source:[...new Set(visible.map(x=>x.source).filter(Boolean))].join("+")||"none",
    geocodeSource, kakaoStatus, needsMapActivation, warning
  });
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
