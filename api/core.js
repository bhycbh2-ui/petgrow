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
      select r.id,r.place_id,r.place_name,r.rating,r.content,r.like_count,r.created_at,
             coalesce(u.nickname,'PetGrow 회원') nickname,
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
  if (!key) return res.status(500).json({ error: "KAKAO_REST_API_KEY가 설정되지 않았어요." });
  const { lat, lng, category = "all", area = "" } = req.query || {};
  const keywords = {
    all: ["동물병원", "동물약국", "반려동물용품", "애견미용", "애견호텔"],
    hospital: ["동물병원"], pharmacy: ["동물약국"], shop: ["반려동물용품", "펫샵"],
    grooming: ["애견미용", "반려동물 미용"], hotel: ["애견호텔", "반려동물 유치원"]
  };
  const qs = keywords[category] || keywords.all;
  const hasCoord = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const all = [];
  for (const kw of qs) {
    const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    u.searchParams.set("query", area ? `${area} ${kw}` : kw);
    u.searchParams.set("size", "15");
    if (hasCoord) {
      u.searchParams.set("x", String(lng)); u.searchParams.set("y", String(lat));
      u.searchParams.set("radius", "10000"); u.searchParams.set("sort", "distance");
    }
    const r = await fetch(u, { headers: { Authorization: `KakaoAK ${key}` } });
    if (!r.ok) continue;
    const j = await r.json();
    for (const d of j.documents || []) {
      const type = placeType(d.category_name, kw);
      all.push({
        id: d.id, name: d.place_name, phone: d.phone || "", address: d.road_address_name || d.address_name || "",
        roadAddress: d.road_address_name || "", category: d.category_name || "", typeKey:type.key, typeLabel:type.label, typeIcon:type.icon,
        lat: Number(d.y), lng: Number(d.x), distance: d.distance ? Number(d.distance) : null, url: d.place_url || ""
      });
    }
  }
  const seen = new Set(), items = [];
  for (const x of all) { if (!x.id || seen.has(x.id)) continue; seen.add(x.id); items.push(x); }
  items.sort((a, b) => (a.distance ?? 1e12) - (b.distance ?? 1e12));
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  return res.status(200).json({ items: items.slice(0, 40), source: "kakao" });
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
