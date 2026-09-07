import { SESSION_COOKIE, SESSION_MAX_AGE } from "../../server_lib/config.js";
import { getSessionUserId, signSession } from "../../server_lib/session.js";
import { validateNickname } from "../../server_lib/nicknamePolicy.js";
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "../../server_lib/authEmail.js";
import {
  attachPasswordCredentials, clearLoginFailures, consumeEmailVerificationCode, createEmailVerificationCode,
  createPasswordResetCode, createPasswordUser, findResetUser,
  findUsername, getUserByEmail, getUserByUsername, isLoginRateLimited, loginAttemptKey,
  normalizeEmail, normalizePhone, recordLoginFailure, resetPasswordWithCode,
  validatePassword, validateUsername, verifyPassword,
} from "../../server_lib/passwordAuth.js";

function setSession(res, uid) {
  const token = signSession({ uid });
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`);
}

function duplicateMessage(error) {
  if (error?.code !== "23505") return null;
  const detail = String(error?.detail || error?.constraint || "");
  if (/username/i.test(detail)) return "이미 사용 중인 아이디예요.";
  if (/email/i.test(detail)) return "이미 가입되었거나 연결된 이메일이에요.";
  return "이미 사용 중인 회원정보가 있어요.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const action = String(req.query?.action || "");
  const body = req.body || {};
  try {
    if (action === "check-id") {
      const checked = validateUsername(body.username);
      if (!checked.ok) return res.status(400).json({ error: checked.error });
      return res.status(200).json({ available: !(await getUserByUsername(checked.username)) });
    }
    if (action === "request-email-code") {
      const email = normalizeEmail(body.email);
      const purpose = body.purpose === "attach" ? "attach" : "signup";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "이메일을 정확히 입력해 주세요." });
      let uid = null;
      if (purpose === "attach") {
        uid = getSessionUserId(req);
        if (!uid) return res.status(401).json({ error: "로그인이 필요해요." });
      } else {
        const checkedId = validateUsername(body.username);
        if (!checkedId.ok) return res.status(400).json({ error: checkedId.error });
        const existing = await getUserByEmail(email);
        if (existing || await getUserByUsername(checkedId.username)) {
          return res.status(200).json({ ok: true, message: "가입 가능한 정보라면 인증번호를 이메일로 보냈어요." });
        }
      }
      const code = await createEmailVerificationCode({ email, userId: uid, purpose });
      await sendEmailVerificationEmail({ to: email, code, purpose });
      return res.status(200).json({ ok: true, message: "인증번호를 이메일로 보냈어요. 10분 안에 입력해 주세요." });
    }
    if (action === "signup" || action === "attach") {
      const checkedId = validateUsername(body.username);
      const checkedPw = validatePassword(body.password);
      const nickname = action === "signup" ? validateNickname(String(body.nickname || body.realName || "").trim()) : { ok: true };
      const realName = String(body.realName || "").trim();
      const email = normalizeEmail(body.email);
      const phone = normalizePhone(body.phone);
      if (!checkedId.ok) return res.status(400).json({ error: checkedId.error });
      if (!checkedPw.ok) return res.status(400).json({ error: checkedPw.error });
      if (!realName || realName.length > 40) return res.status(400).json({ error: "이름을 정확히 입력해 주세요." });
      if (!nickname.ok) return res.status(400).json({ error: nickname.message });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "이메일을 정확히 입력해 주세요." });
      if (phone && !/^01\d{8,9}$/.test(phone)) return res.status(400).json({ error: "휴대폰 번호를 정확히 입력해 주세요." });
      const uid = action === "attach" ? getSessionUserId(req) : null;
      if (action === "attach" && !uid) return res.status(401).json({ error: "로그인이 필요해요." });
      const verified = await consumeEmailVerificationCode({ email, userId: uid, purpose: action, code: String(body.emailCode || "") });
      if (!verified) return res.status(400).json({ error: "이메일 인증번호가 올바르지 않거나 만료되었어요." });
      if (action === "attach") {
        const user = await attachPasswordCredentials(uid, { username: checkedId.username, password: checkedPw.password, realName, email, phone });
        return res.status(200).json({ ok: true, username: user.username });
      }
      const user = await createPasswordUser({ username: checkedId.username, password: checkedPw.password, realName, nickname: nickname.nickname, email, phone });
      setSession(res, user.id);
      return res.status(201).json({ ok: true });
    }
    if (action === "login") {
      const forwardedIp = String(req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
      const attemptKey = loginAttemptKey(body.username, forwardedIp);
      if (await isLoginRateLimited(attemptKey)) return res.status(429).json({ error: "로그인 시도가 너무 많아요. 15분 뒤 다시 시도해 주세요." });
      const user = await getUserByUsername(body.username);
      const ok = user?.password_hash && await verifyPassword(String(body.password || ""), user.password_hash);
      if (!ok) {
        await recordLoginFailure(attemptKey);
        return res.status(401).json({ error: "아이디 또는 비밀번호를 확인해 주세요." });
      }
      await clearLoginFailures(attemptKey);
      setSession(res, user.id);
      return res.status(200).json({ ok: true });
    }
    if (action === "find-id") {
      const username = await findUsername({ realName: body.realName, email: body.email });
      if (!username) return res.status(404).json({ error: "일치하는 회원정보를 찾지 못했어요." });
      const visible = username.length <= 4 ? `${username[0]}***` : `${username.slice(0, 3)}${"*".repeat(Math.max(2, username.length - 3))}`;
      return res.status(200).json({ username: visible });
    }
    if (action === "request-reset") {
      const user = await findResetUser(body.username, body.email);
      if (user) {
        try {
          const code = await createPasswordResetCode(user.id);
          await sendPasswordResetEmail({ to: user.email, code });
        } catch (error) {
          if (error?.message !== "AUTH_CODE_TOO_SOON") throw error;
        }
      }
      return res.status(200).json({ ok: true, message: "회원정보가 일치하면 인증번호를 이메일로 보냈어요." });
    }
    if (action === "confirm-reset") {
      const checkedPw = validatePassword(body.newPassword);
      if (!checkedPw.ok) return res.status(400).json({ error: checkedPw.error });
      const user = await findResetUser(body.username, body.email);
      const ok = user && await resetPasswordWithCode({ userId: user.id, code: String(body.code || ""), newPassword: checkedPw.password });
      if (!ok) return res.status(400).json({ error: "인증번호가 올바르지 않거나 만료되었어요." });
      return res.status(200).json({ ok: true });
    }
    return res.status(404).json({ error: "unknown action" });
  } catch (error) {
    const duplicate = duplicateMessage(error);
    if (duplicate) return res.status(409).json({ error: duplicate });
    console.error("local auth error", error);
    if (error?.message === "AUTH_CODE_TOO_SOON") return res.status(429).json({ error: "인증번호는 1분 뒤 다시 요청할 수 있어요." });
    return res.status(500).json({ error: error?.message === "AUTH_EMAIL_NOT_CONFIGURED" ? "이메일 발송 설정이 필요해요." : error?.message === "AUTH_EMAIL_SEND_FAILED" ? "인증 이메일 발송에 실패했어요. 잠시 후 다시 시도해 주세요." : "잠시 후 다시 시도해 주세요." });
  }
}
