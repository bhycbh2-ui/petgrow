import { getSessionUserId } from "../../_lib/session.js";
import { getPostById, updatePost, deletePost, CATEGORIES } from "../../_lib/community.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const uid = getSessionUserId(req);
    const post = await getPostById(id, uid);
    if (!post) { res.status(404).json({ error: "not found" }); return; }
    res.status(200).json(post);
    return;
  }

  if (req.method === "PUT") {
    const uid = getSessionUserId(req);
    if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
    const { category, title, content, imageUrls, visibility } = req.body || {};
    if (!CATEGORIES.includes(category)) { res.status(400).json({ error: "invalid category" }); return; }
    if (!title || !title.trim()) { res.status(400).json({ error: "title is required" }); return; }
    if (!content || !content.trim()) { res.status(400).json({ error: "content is required" }); return; }
    if (imageUrls && imageUrls.length > 5) { res.status(400).json({ error: "up to 5 images allowed" }); return; }
    if (visibility && !["public", "private"].includes(visibility)) { res.status(400).json({ error: "invalid visibility" }); return; }
    const updated = await updatePost({ id, userId: uid, category, title: title.trim(), content: content.trim(), imageUrls, visibility });
    // updated 가 null 이면 글이 없거나(존재하지 않음) 작성자 본인이 아니라는 뜻 — DB 조건에서부터 걸러졌어요.
    if (!updated) { res.status(403).json({ error: "not allowed" }); return; }
    res.status(200).json(updated);
    return;
  }

  if (req.method === "DELETE") {
    const uid = getSessionUserId(req);
    if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
    const ok = await deletePost({ id, userId: uid });
    if (!ok) { res.status(403).json({ error: "not allowed" }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
