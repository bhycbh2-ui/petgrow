import crypto from "crypto";
import { SESSION_MAX_AGE, SESSION_COOKIE } from "./config.js";

// SESSION_SECRET 환경변수가 반드시 설정되어 있어야 해요 (Vercel 환경변수로 등록).
// 최소 32자 이상의 랜덤 문자열(예: openssl rand -hex 32 결과)을 사용하세요.
function getSecret() {
  const secret = String(process.env.SESSION_SECRET || "");
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET 환경변수는 최소 32자 이상의 랜덤 문자열이어야 해요.");
  }
  return secret;
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}
function fromB64url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

// HMAC-SHA256 서명 세션 토큰.
export function signSession(payload, maxAgeSec = SESSION_MAX_AGE) {
  const uid = String(payload?.uid || "").trim();
  if (!uid || uid.length > 160) throw new Error("유효하지 않은 세션 사용자 정보예요.");
  const now = Math.floor(Date.now() / 1000);
  const safeMaxAge = Math.min(Math.max(Number(maxAgeSec) || SESSION_MAX_AGE, 60), SESSION_MAX_AGE);
  const body = { uid, iat: now, exp: now + safeMaxAge };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySession(token) {
  if (!token || typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!data || !sig) return null;
  let expected;
  try {
    expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(data));
    const now = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload !== "object") return null;
    if (typeof payload.uid !== "string" || !payload.uid || payload.uid.length > 160) return null;
    if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return null;
    if (payload.iat > now + 300 || payload.exp <= now || payload.exp <= payload.iat) return null;
    if (payload.exp - payload.iat > SESSION_MAX_AGE + 60) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  const out = {};
  (header || "").split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) {
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  });
  return out;
}

// 요청에서 로그인한 사용자의 user_id 를 꺼내요. 로그인 안 되어 있으면 null.
export function getSessionUserId(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const payload = verifySession(cookies[SESSION_COOKIE]);
  return payload ? payload.uid : null;
}
