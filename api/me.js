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
    // 전체 카카오 고유번호는 노출하지 않고 계정 구분용 마지막 4자리만 내려줘요.
    accountCode: user.kakao_id ? String(user.kakao_id).slice(-4).padStart(4, "0") : null,
  });
}
