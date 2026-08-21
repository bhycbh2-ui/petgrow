import { sql } from "@vercel/postgres";
import { del as blobDel } from "@vercel/blob";
import { SESSION_COOKIE } from "../server_lib/config.js";
import { getSessionUserId } from "../server_lib/session.js";
import { deleteUser, updateUserNickname } from "../server_lib/db.js";
import { validateNickname } from "../server_lib/nicknamePolicy.js";
import { isAdminUserId } from "../server_lib/admin.js";

function isPetGrowBlobUrl(value) {
  return /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//i.test(String(value || ""));
}

async function deletePetLifeBlobsForUser(userId) {
  let rows = [];
  try {
    const result = await sql`
      select photo_url from pg_pets where user_id=${userId} and photo_url is not null
      union
      select photo_url from pg_pet_life_entries where user_id=${userId} and photo_url is not null
    `;
    rows = result.rows || [];
  } catch (error) {
    // PetLife tables are created lazily. An account that never opened PetLife may not have them yet.
    if (error?.code === "42P01") return;
    throw error;
  }

  const urls = [...new Set(rows.map((row) => row.photo_url).filter(isPetGrowBlobUrl))];
  for (let i = 0; i < urls.length; i += 50) {
    await blobDel(urls.slice(i, i + 50));
  }
}

// 회원탈퇴: PetGrow 계정, 카카오 인증 연동 정보, 반려동물 정보·사진·성장기록·PetLife 기록·PetBTI 결과 등
// DB 데이터는 ON DELETE CASCADE로 삭제하고, DB 밖의 Vercel Blob 파일은 계정 삭제 전에 함께 정리합니다.
export default async function handler(req, res) {
  if (String(req.query?.route || "") === "logout") {
    res.setHeader("Set-Cookie", [`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`]);
    res.status(200).json({ ok: true });
    return;
  }

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

  await deletePetLifeBlobsForUser(uid);
  await deleteUser(uid);
  res.setHeader("Set-Cookie", [`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`]);
  res.status(200).json({ ok: true });
}
