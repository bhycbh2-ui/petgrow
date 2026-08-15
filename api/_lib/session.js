import crypto from "crypto";
import { SESSION_MAX_AGE, SESSION_COOKIE } from "./config.js";

// SESSION_SECRET 환경변수가 반드시 설정되어 있어야 해요 (Vercel 환경변수로 등록).
// 랜덤하고 긴 문자열(예: openssl rand -hex 32 결과)을 사용하세요.
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET 환경변수가 설정되어 있지 않아요.");
  }
  return secret;
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}
function fromB64url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

// 아주 단순한 자체 서명 토큰(HMAC-SHA256) — 별도 라이브러리 없이 세션을 안전하게 서명해요.
export function signSession(payload, maxAgeSec = SESSION_MAX_AGE) {
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + maxAgeSec };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySession(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
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
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
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
