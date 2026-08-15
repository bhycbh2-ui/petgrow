import { BASE_URL, OAUTH_STATE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE } from "../../_lib/config.js";
import { parseCookies, signSession } from "../../_lib/session.js";
import { findOrCreateUserByKakaoId } from "../../_lib/db.js";

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  const cookies = parseCookies(req.headers.cookie || "");

  const failRedirect = (reason) => {
    console.warn("kakao login failed:", reason);
    res.setHeader("Set-Cookie", [`${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0`]);
    res.writeHead(302, { Location: `${BASE_URL}/?login=error` });
    res.end();
  };

  if (error) return failRedirect(`kakao error: ${error}`);
  if (!code) return failRedirect("no code");
  if (!state || !cookies[OAUTH_STATE_COOKIE] || state !== cookies[OAUTH_STATE_COOKIE]) {
    return failRedirect("state mismatch");
  }

  try {
    const redirectUri = `${BASE_URL}/api/auth/kakao/callback`;
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: String(code),
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return failRedirect(`token exchange failed: ${JSON.stringify(tokenJson)}`);
    }

    // 닉네임/프로필사진 외의 개인정보(전화번호·성별·생일·연령대·친구목록 등)는 요청하지 않아요.
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const kakaoUser = await userRes.json();
    if (!userRes.ok || !kakaoUser.id) {
      return failRedirect(`user info fetch failed: ${JSON.stringify(kakaoUser)}`);
    }

    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.kakao_account?.profile?.nickname || null;
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url || null;

    const user = await findOrCreateUserByKakaoId({ kakaoId, nickname, profileImage });
    const sessionToken = signSession({ uid: user.id });

    res.setHeader("Set-Cookie", [
      `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
      `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0`,
    ]);
    res.writeHead(302, { Location: `${BASE_URL}/?login=success` });
    res.end();
  } catch (e) {
    return failRedirect(e && e.message);
  }
}
