import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";
import { awardPoints, revokePoints } from "../server_lib/points.js";
import { getSessionUserId } from "../server_lib/session.js";
import {
  listPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  listComments,
  addComment,
  deleteComment,
  getMyPosts,
  getMyComments,
  getMyLikedPosts,
  createReport,
  getReportContext,
  getCommunityRestriction,
  CATEGORIES,
} from "../server_lib/community.js";
import { validateCommunityText } from "../server_lib/contentPolicy.js";

const REPORT_REASONS = ["ad", "abuse", "sexual", "animal_abuse", "privacy", "misinformation", "spam", "other"];
const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 4 * 1024 * 1024;

function requireUser(req, res) {
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "unauthenticated" });
    return null;
  }
  return uid;
}

async function requireCommunityWrite(uid, res) {
  const restriction = await getCommunityRestriction(uid);
  if (!restriction?.active) return true;
  const untilText = restriction.permanent ? "영구" : new Date(restriction.until).toLocaleString("ko-KR", { timeZone:"Asia/Seoul" });
  res.status(403).json({ error:"community restricted", code:"COMMUNITY_RESTRICTED", message:`커뮤니티 이용이 제한된 계정입니다. 제한 기간: ${untilText}. 자세한 내용은 고객센터로 문의해 주세요.` });
  return false;
}

async function sendReportEmail({ reportId, reporterUserId, reason, detail, context }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const to = process.env.REPORT_EMAIL_TO || "help.petgrow@gmail.com";
  const from = process.env.REPORT_EMAIL_FROM || "PetGrow 신고 <onboarding@resend.dev>";
  const safe = (v) => String(v ?? "").replace(/[<>]/g, "");
  const title = context?.title || "제목 없음";
  const targetLabel = context?.targetType === "comment" ? "댓글" : "게시글";
  const html = `
    <h2>PetGrow Pet톡 신고 접수</h2>
    <p><b>대상:</b> ${targetLabel}</p>
    <p><b>게시글 제목:</b> ${safe(title)}</p>
    <p><b>작성자 닉네임:</b> ${safe(context?.authorNickname)}</p>
    <p><b>신고 사유:</b> ${safe(reason)}</p>
    <p><b>신고 상세:</b> ${safe(detail || "없음")}</p>
    <p><b>신고 ID:</b> ${safe(reportId)}</p>
    <p><b>대상 ID:</b> ${safe(context?.targetId)}</p>
    <p><b>신고자 내부 ID:</b> ${safe(reporterUserId)}</p>
    <p><b>접수 시각:</b> ${new Date().toLocaleString("ko-KR", { timeZone:"Asia/Seoul" })}</p>`;
  try {
    const r = await fetch("https://api.resend.com/emails", { method:"POST", headers:{ Authorization:`Bearer ${key}`, "Content-Type":"application/json" }, body:JSON.stringify({ from, to:[to], subject:`[PetGrow 신고] ${title}`, html }) });
    if (!r.ok) console.error("report email failed", await r.text());
    return r.ok;
  } catch (e) { console.error("report email error", e); return false; }
}

export default async function handler(req, res) {
  const action = String(req.query.action || "posts");

  try {
    if (action === "posts") {
      if (req.method === "GET") {
        const uid = getSessionUserId(req);
        const { category, sort, search, page } = req.query;
        const result = await listPosts({
          category: category || "all",
          sort: sort === "popular" ? "popular" : "latest",
          search: search || "",
          page: page ? parseInt(page, 10) : 1,
          pageSize: 10,
          viewerId: uid,
        });
        return res.status(200).json(result);
      }

      if (req.method === "POST") {
        const uid = requireUser(req, res);
        if (!uid) return;
        const { pet, category, title, content, imageUrls, isPublic } = req.body || {};
        if (!(await requireCommunityWrite(uid, res))) return;
        const policy = validateCommunityText(title, content);
        if (!policy.ok) return res.status(400).json({ error: policy.message, code: "CONTENT_BLOCKED" });
        if (!pet || !pet.id || !pet.name) return res.status(400).json({ error: "pet is required" });
        if (!CATEGORIES.includes(category)) return res.status(400).json({ error: "invalid category" });
        if (!title || !title.trim()) return res.status(400).json({ error: "title is required" });
        if (!content || !content.trim()) return res.status(400).json({ error: "content is required" });
        if (imageUrls && imageUrls.length > 5) return res.status(400).json({ error: "up to 5 images allowed" });
        const post = await createPost({
          userId: uid,
          pet,
          category,
          title: title.trim(),
          content: content.trim(),
          imageUrls,
          isPublic,
        });
        const pointEvent = await awardPoints(uid, "community_post", `post:${post.id}`).catch(()=>null);
        return res.status(201).json({ ...post, pointEvent });
      }
    }

    if (action === "post") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id is required" });

      if (req.method === "GET") {
        const uid = getSessionUserId(req);
        const post = await getPostById(id, uid);
        if (!post) return res.status(404).json({ error: "not found" });
        return res.status(200).json(post);
      }

      if (req.method === "PUT") {
        const uid = requireUser(req, res);
        if (!uid) return;
        const { category, title, content, imageUrls, isPublic } = req.body || {};
        if (!(await requireCommunityWrite(uid, res))) return;
        const visibilityOnly = typeof isPublic === "boolean" && category == null && title == null && content == null && imageUrls == null;
        if (!visibilityOnly) {
          const policy = validateCommunityText(title, content);
          if (!policy.ok) return res.status(400).json({ error: policy.message, code: "CONTENT_BLOCKED" });
          if (!CATEGORIES.includes(category)) return res.status(400).json({ error: "invalid category" });
          if (!title || !title.trim()) return res.status(400).json({ error: "title is required" });
          if (!content || !content.trim()) return res.status(400).json({ error: "content is required" });
          if (imageUrls && imageUrls.length > 5) return res.status(400).json({ error: "up to 5 images allowed" });
        }
        const updated = await updatePost({
          id,
          userId: uid,
          category: visibilityOnly ? undefined : category,
          title: visibilityOnly ? undefined : title.trim(),
          content: visibilityOnly ? undefined : content.trim(),
          imageUrls: visibilityOnly ? undefined : imageUrls,
          isPublic,
        });
        if (!updated) return res.status(403).json({ error: "not allowed" });
        return res.status(200).json(updated);
      }

      if (req.method === "DELETE") {
        const uid = requireUser(req, res);
        if (!uid) return;
        const ok = await deletePost({ id, userId: uid });
        if(ok) await revokePoints(uid,`post:${id}`,"Pet톡 글 삭제로 포인트 회수").catch(()=>{});
        if (!ok) return res.status(403).json({ error: "not allowed" });
        return res.status(200).json({ ok: true });
      }
    }

    if (action === "like") {
      if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
      const uid = requireUser(req, res);
      if (!uid) return;
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id is required" });
      const likeResult = await toggleLike({ postId:id, userId:uid });
      if (likeResult?.liked) {
        const { rows:ownerRows } = await sql`select user_id from pg_posts where id=${id} limit 1`;
        const ownerId=ownerRows[0]?.user_id;
        if(ownerId && ownerId!==uid) await awardPoints(ownerId,"received_like",`like-received:${id}:${uid}`).catch(()=>null);
      }
      return res.status(200).json(likeResult);
    }

    if (action === "comments") {
      const postId = req.query.postId;
      if (!postId) return res.status(400).json({ error: "postId is required" });

      if (req.method === "GET") {
        const uid = getSessionUserId(req);
        const comments = await listComments(postId, uid);
        return res.status(200).json({ comments });
      }

      if (req.method === "POST") {
        const uid = requireUser(req, res);
        if (!uid) return;
        const { pet, content } = req.body || {};
        if (!(await requireCommunityWrite(uid, res))) return;
        const policy = validateCommunityText(content);
        if (!policy.ok) return res.status(400).json({ error: policy.message, code: "CONTENT_BLOCKED" });
        if (!content || !content.trim()) return res.status(400).json({ error: "content is required" });
        if (!pet || !pet.id || !pet.name) return res.status(400).json({ error: "pet is required" });
        const comment = await addComment({ postId, userId: uid, pet, content: content.trim() });
        const pointEvent = await awardPoints(uid, "community_comment", `comment:${comment.id}`).catch(()=>null);
        return res.status(201).json({ ...comment, pointEvent });
      }
    }

    if (action === "comment") {
      if (req.method !== "DELETE") return res.status(405).json({ error: "method not allowed" });
      const uid = requireUser(req, res);
      if (!uid) return;
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id is required" });
      const ok = await deleteComment({ id, userId: uid });
      if(ok) await revokePoints(uid,`comment:${id}`,"Pet톡 댓글 삭제로 포인트 회수").catch(()=>{});
      if (!ok) return res.status(403).json({ error: "not allowed" });
      return res.status(200).json({ ok: true });
    }

    if (action === "report") {
      if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
      const uid = requireUser(req, res);
      if (!uid) return;
      const { targetType, targetId, reason, detail } = req.body || {};
      if (!["post", "comment"].includes(targetType)) return res.status(400).json({ error: "invalid targetType" });
      if (!targetId) return res.status(400).json({ error: "targetId is required" });
      if (!REPORT_REASONS.includes(reason)) return res.status(400).json({ error: "invalid reason" });
      if (detail && String(detail).length > 1000) return res.status(400).json({ error: "신고 상세내용은 1000자 이내로 입력해 주세요." });
      const context = await getReportContext(targetType, targetId);
      if (!context) return res.status(404).json({ error: "신고 대상을 찾을 수 없어요." });
      if (context.targetUserId === uid) return res.status(400).json({ error: "본인이 작성한 글이나 댓글은 신고할 수 없어요." });
      const result = await createReport({ reporterUserId: uid, targetType, targetId, reason, detail });
      let emailSent = false;
      if (result.reported) emailSent = await sendReportEmail({ reportId:result.reportId, reporterUserId:uid, reason, detail, context });
      return res.status(200).json({ ...result, emailSent });
    }

    if (action === "my") {
      if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
      const uid = requireUser(req, res);
      if (!uid) return;
      const { type, page } = req.query;
      const p = page ? parseInt(page, 10) : 1;
      if (type === "comments") return res.status(200).json(await getMyComments(uid, p, 10));
      if (type === "likes") return res.status(200).json(await getMyLikedPosts(uid, p, 10));
      return res.status(200).json(await getMyPosts(uid, p, 10));
    }

    if (action === "upload") {
      if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
      const uid = requireUser(req, res);
      if (!uid) return;
      const { dataUrl } = req.body || {};
      if (!dataUrl || typeof dataUrl !== "string") return res.status(400).json({ error: "dataUrl is required" });
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: "invalid data url" });
      const mime = match[1];
      const ext = ALLOWED_MIME[mime];
      if (!ext) return res.status(400).json({ error: "only jpg/png/webp images are allowed" });
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > MAX_BYTES) return res.status(413).json({ error: "image is too large" });
      const filename = `community/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      // Vercel Blob이 연결돼 있으면 Blob을 우선 사용합니다.
      // Storage가 아직 연결되지 않았거나 일시적으로 실패한 경우에는 압축된 data URL 자체를
      // pg_post_images.storage_url에 저장할 수 있도록 반환해 사진 게시 기능이 막히지 않게 합니다.
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(filename, buffer, { access: "public", contentType: mime, token: process.env.BLOB_READ_WRITE_TOKEN });
          return res.status(200).json({ url: blob.url, storage: "blob" });
        } catch (blobErr) {
          console.error("community blob upload failed; using inline fallback", blobErr);
        }
      } else {
        console.warn("community upload: BLOB_READ_WRITE_TOKEN missing; using inline fallback");
      }
      // 클라이언트에서 이미 720px 수준까지 압축하므로 DB 대체 저장 크기도 제한합니다.
      if (dataUrl.length > 1_200_000) return res.status(413).json({ error: "image is too large" });
      return res.status(200).json({ url: dataUrl, storage: "inline" });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    console.error("community api error", { action, message: err?.message, stack: err?.stack });
    return res.status(500).json({ error: "community request failed" });
  }
}
