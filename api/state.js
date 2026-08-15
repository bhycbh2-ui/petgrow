import { getSessionUserId } from "./_lib/session.js";
import { getState, setState } from "./_lib/db.js";

// 로그인한 계정의 클라우드 저장소예요. 프런트엔드의 safeGet/safeSet 이 로그인 시 이 엔드포인트를 사용해요.
// key 예시: "bboggl:dogs", "bboggl:cats", "bboggl:activeIds" 등 — 기존 localStorage 키를 그대로 재사용해요.
export default async function handler(req, res) {
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }

  if (req.method === "GET") {
    const key = req.query.key;
    if (!key || typeof key !== "string") {
      res.status(400).json({ error: "key is required" });
      return;
    }
    const value = await getState(uid, key);
    res.status(200).json({ key, value });
    return;
  }

  if (req.method === "PUT") {
    const { key, value } = req.body || {};
    if (!key || typeof key !== "string") {
      res.status(400).json({ error: "key is required" });
      return;
    }
    await setState(uid, key, value === undefined ? null : value);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
