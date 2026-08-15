import crypto from "crypto";
import { BASE_URL, OAUTH_STATE_COOKIE } from "../../_lib/config.js";

// 카카오 Developers > 내 애플리케이션 > 카카오 로그인 > Redirect URI 에 아래 콜백 주소를 등록해야 해요:
//   https://www.petgrow.co.kr/api/auth/kakao/callback
export default async function handler(req, res) {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) {
    res.status(500).send("KAKAO_REST_API_KEY 환경변수가 설정되어 있지 않아요.");
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${BASE_URL}/api/auth/kakao/callback`;

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", restApiKey);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);

  res.setHeader("Set-Cookie", [
    `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  ]);
  res.writeHead(302, { Location: authorizeUrl.toString() });
  res.end();
}
