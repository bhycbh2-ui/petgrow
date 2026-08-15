import { SESSION_COOKIE } from "./_lib/config.js";
import { getSessionUserId } from "./_lib/session.js";
import { deleteUser } from "./_lib/db.js";

// 회원탈퇴: PetGrow 계정, 카카오 인증 연동 정보, 반려동물 정보·사진·성장기록·PetBTI 결과 등
// pg_user_state 에 저장된 모든 데이터가 DB의 ON DELETE CASCADE 로 함께 삭제돼요.
export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  await deleteUser(uid);
  res.setHeader("Set-Cookie", [`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`]);
  res.status(200).json({ ok: true });
}
