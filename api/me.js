import { getSessionUserId } from "./_lib/session.js";
import { getUserById } from "./_lib/db.js";

export default async function handler(req, res) {
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  const user = await getUserById(uid);
  if (!user) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  res.status(200).json({
    id: user.id,
    name: user.nickname || "PetGrow 회원",
    profileImage: user.profile_image || null,
  });
}
