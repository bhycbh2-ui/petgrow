import { put } from "@vercel/blob";
import { getSessionUserId } from "./_lib/session.js";
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
  CATEGORIES,
} from "./_lib/community.js";

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
        return res.status(201).json(post);
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
        const visibilityOnly = typeof isPublic === "boolean" && category == null && title == null && content == null && imageUrls == null;
        if (!visibilityOnly) {
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
      return res.status(200).json(await toggleLike({ postId: id, userId: uid }));
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
        if (!content || !content.trim()) return res.status(400).json({ error: "content is required" });
        if (!pet || !pet.id || !pet.name) return res.status(400).json({ error: "pet is required" });
        const comment = await addComment({ postId, userId: uid, pet, content: content.trim() });
        return res.status(201).json(comment);
      }
    }

    if (action === "comment") {
      if (req.method !== "DELETE") return res.status(405).json({ error: "method not allowed" });
      const uid = requireUser(req, res);
      if (!uid) return;
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id is required" });
      const ok = await deleteComment({ id, userId: uid });
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
      return res.status(200).json(await createReport({ reporterUserId: uid, targetType, targetId, reason, detail }));
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
