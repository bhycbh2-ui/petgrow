import { getSessionUserId } from "../../_lib/session.js";
import { listComments, addComment } from "../../_lib/community.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const uid = getSessionUserId(req);
    try {
      const comments = await listComments(id, uid);
      res.status(200).json({ comments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to list comments" });
    }
    return;
  }

  if (req.method === "POST") {
    const uid = getSessionUserId(req);
    if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
    const { pet, content } = req.body || {};
    if (!content || !content.trim()) { res.status(400).json({ error: "content is required" }); return; }
    if (!pet || !pet.id || !pet.name) { res.status(400).json({ error: "pet is required" }); return; }
    try {
      const comment = await addComment({ postId: id, userId: uid, pet, content: content.trim() });
      res.status(201).json(comment);
    } catch (err) {
      if (err.message === "not allowed") { res.status(403).json({ error: "not allowed" }); return; }
      if (err.message === "post not found") { res.status(404).json({ error: "not found" }); return; }
      console.error(err);
      res.status(400).json({ error: "failed to add comment" });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
