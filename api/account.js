import { SESSION_COOKIE } from "../server_lib/config.js";
import { getSessionUserId } from "../server_lib/session.js";
import { deleteUser, updateUserNickname } from "../server_lib/db.js";
import { validateNickname } from "../server_lib/nicknamePolicy.js";
import { isAdminUserId } from "../server_lib/admin.js";

// 회원탈퇴: PetGrow 계정, 카카오 인증 연동 정보, 반려동물 정보·사진·성장기록·PetBTI 결과 등
// pg_user_state 에 저장된 모든 데이터가 DB의 ON DELETE CASCADE 로 함께 삭제돼요.
export default async function handler(req, res) {
  if (!["POST", "DELETE", "PATCH"].includes(req.method)) {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  if (req.method === "PATCH") {
    const requestedNickname = String(req.body?.nickname || "").trim();
    const adminNicknameAllowed = requestedNickname === "운영자" && await isAdminUserId(uid);
    const checked = validateNickname(requestedNickname, { allowOperator: adminNicknameAllowed });
    if (!checked.ok) {
      res.status(400).json({ error: checked.message, reason: checked.reason || "blocked" });
      return;
    }
    try {
      const user = await updateUserNickname(uid, checked.nickname);
      if (!user) {
        res.status(404).json({ error: "user not found" });
        return;
      }
      res.status(200).json({ ok: true, name: user.nickname });
    } catch (e) {
      if (e?.code === "NICKNAME_DUPLICATE" || e?.code === "23505") {
        res.status(409).json({ error: "이미 사용 중인 닉네임이에요. 다른 닉네임을 사용해 주세요.", reason: "duplicate" });
        return;
      }
      if (e?.code === "INVALID_NICKNAME") {
        res.status(400).json({ error: "닉네임은 2~8자 이내로 입력해 주세요.", reason: "length" });
        return;
      }
      throw e;
    }
    return;
  }

  await deleteUser(uid);
  res.setHeader("Set-Cookie", [`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`]);
  res.status(200).json({ ok: true });
}
