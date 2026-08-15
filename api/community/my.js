import { getSessionUserId } from "../_lib/session.js";
import { getMyPosts, getMyComments, getMyLikedPosts } from "../_lib/community.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ error: "method not allowed" }); return; }
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
  const { type, page, visibility } = req.query;
  const p = page ? parseInt(page, 10) : 1;
  try {
    if (type === "comments") {
      res.status(200).json(await getMyComments(uid, p, 10));
    } else if (type === "likes") {
      res.status(200).json(await getMyLikedPosts(uid, p, 10));
    } else {
      res.status(200).json(await getMyPosts(uid, p, 10, visibility));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to load activity" });
  }
}
