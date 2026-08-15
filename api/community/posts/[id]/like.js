import { getSessionUserId } from "../../_lib/session.js";
import { toggleLike } from "../../_lib/community.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
  const { id } = req.query;
  try {
    const result = await toggleLike({ postId: id, userId: uid });
    res.status(200).json(result);
  } catch (err) {
    if (err.message === "not allowed") { res.status(403).json({ error: "not allowed" }); return; }
    if (err.message === "post not found") { res.status(404).json({ error: "not found" }); return; }
    console.error(err);
    res.status(500).json({ error: "failed to toggle like" });
  }
}
