import { getSessionUserId } from "../_lib/session.js";
import { createReport } from "../_lib/community.js";

export const REPORT_REASONS = ["ad", "abuse", "sexual", "animal_abuse", "privacy", "misinformation", "spam", "other"];

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }
  const { targetType, targetId, reason, detail } = req.body || {};
  if (!["post", "comment"].includes(targetType)) { res.status(400).json({ error: "invalid targetType" }); return; }
  if (!targetId) { res.status(400).json({ error: "targetId is required" }); return; }
  if (!REPORT_REASONS.includes(reason)) { res.status(400).json({ error: "invalid reason" }); return; }
  try {
    const result = await createReport({ reporterUserId: uid, targetType, targetId, reason, detail });
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to submit report" });
  }
}
