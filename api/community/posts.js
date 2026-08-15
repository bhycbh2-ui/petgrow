import { getSessionUserId } from "../_lib/session.js";
import { listPosts, createPost, CATEGORIES } from "../_lib/community.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const uid = getSessionUserId(req); // 비로그인 사용자도 피드는 볼 수 있어요(좋아요 여부만 false)
    const { category, sort, search, page } = req.query;
    try {
      const result = await listPosts({
        category: category || "all",
        sort: sort === "popular" ? "popular" : "latest",
        search: search || "",
        page: page ? parseInt(page, 10) : 1,
        pageSize: 10,
        viewerId: uid,
      });
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to list posts" });
    }
    return;
  }

  if (req.method === "POST") {
    const uid = getSessionUserId(req);
    if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
    const { pet, category, title, content, imageUrls, visibility } = req.body || {};
    if (!pet || !pet.id || !pet.name) { res.status(400).json({ error: "pet is required" }); return; }
    if (!CATEGORIES.includes(category)) { res.status(400).json({ error: "invalid category" }); return; }
    if (!title || !title.trim()) { res.status(400).json({ error: "title is required" }); return; }
    if (!content || !content.trim()) { res.status(400).json({ error: "content is required" }); return; }
    if (imageUrls && imageUrls.length > 5) { res.status(400).json({ error: "up to 5 images allowed" }); return; }
    if (visibility && !["public", "private"].includes(visibility)) { res.status(400).json({ error: "invalid visibility" }); return; }
    try {
      const post = await createPost({
        userId: uid, pet, category, title: title.trim(), content: content.trim(), imageUrls, visibility,
      });
      res.status(201).json(post);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to create post" });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
