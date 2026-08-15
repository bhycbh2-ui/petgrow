import { getSessionUserId } from "../../_lib/session.js";
import { deleteComment } from "../../_lib/community.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") { res.status(405).json({ error: "method not allowed" }); return; }
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
  const { id } = req.query;
  const ok = await deleteComment({ id, userId: uid });
  if (!ok) { res.status(403).json({ error: "not allowed" }); return; }
  res.status(200).json({ ok: true });
}
