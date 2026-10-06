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
  // A missing server secret is an infrastructure error, not an expired login.
  const expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
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

// Shared production cookie has a separate name so legacy host-only cookies cannot shadow it.
export const SHARED_SESSION_COOKIE = "pg_session_shared";
function productionDomain(req) {
  const host = String(req.headers?.host || "").toLowerCase().split(":")[0];
  return host === "petgrow.co.kr" || host === "www.petgrow.co.kr" ? "; Domain=petgrow.co.kr" : "";
}
export function getSessionPayload(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  // If the new cookie exists but is invalid, do not resurrect a different legacy session.
  if (cookies[SHARED_SESSION_COOKIE]) return verifySession(cookies[SHARED_SESSION_COOKIE]);
  return verifySession(cookies[SESSION_COOKIE]);
}
export function getSessionUserId(req) {
  return getSessionPayload(req)?.uid || null;
}
export function createSessionCookies(req, uid) {
  const domain = productionDomain(req);
  const name = domain ? SHARED_SESSION_COOKIE : SESSION_COOKIE;
  const token = signSession({ uid });
  return [
    `${name}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${domain}`,
    ...(domain ? [`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`] : []),
  ];
}
export function clearSessionCookies(req) {
  const suffix = "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
  const domain = productionDomain(req);
  return [ `${SESSION_COOKIE}=${suffix}`, `${SHARED_SESSION_COOKIE}=${suffix}`,
    ...(domain ? [`${SHARED_SESSION_COOKIE}=${suffix}${domain}`, `${SESSION_COOKIE}=${suffix}${domain}`] : []) ];
}
export function renewSessionIfNeeded(req, res, payload) {
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) return;
  const cookies = parseCookies(req.headers.cookie || "");
  const migrate = productionDomain(req) && !cookies[SHARED_SESSION_COOKIE];
  const age = Math.floor(Date.now() / 1000) - payload.iat;
  // Renew after a day of use; never renew an expired, invalid or deleted user's session.
  if (migrate || age >= 24 * 60 * 60) res.setHeader("Set-Cookie", createSessionCookies(req, payload.uid));
}
