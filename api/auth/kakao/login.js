import { BASE_URL, OAUTH_STATE_COOKIE } from "../../../server_lib/config.js";
import { createOAuthState } from "../../../server_lib/db.js";

// 카카오 Developers > 내 애플리케이션 > 카카오 로그인 > Redirect URI 에 아래 콜백 주소를 등록해야 해요:
//   https://www.petgrow.co.kr/api/auth/kakao/callback
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  // Begin OAuth on the callback host so the host-only CSRF cookie is available there.
  const canonicalLogin = new URL("/api/auth/kakao/login", BASE_URL);
  if (req.headers?.host && req.headers.host.toLowerCase() !== canonicalLogin.host.toLowerCase()) {
    if (req.query?.client === "android") canonicalLogin.searchParams.set("client", "android");
    if (req.query?.switch === "1") canonicalLogin.searchParams.set("switch", "1");
    res.writeHead(302, { Location: canonicalLogin.toString() });
    res.end();
    return;
  }

  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) {
    res.status(500).send("KAKAO_REST_API_KEY 환경변수가 설정되어 있지 않아요.");
    return;
  }

  const client = req.query?.client === "android" ? "android" : "web";
  const state = await createOAuthState(client);
  const redirectUri = `${BASE_URL}/api/auth/kakao/callback`;

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", restApiKey);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);
  // 평소에는 Kakao에 남아 있는 인증을 그대로 이어 받아 재로그인 단계를 줄여요.
  // 사용자가 명시적으로 계정 전환을 요청한 경우에만 계정 선택 화면을 표시합니다.
  if (req.query?.switch === "1") authorizeUrl.searchParams.set("prompt", "select_account");

  if (client === "web") {
    res.setHeader("Set-Cookie", [
      `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    ]);
  }
  res.writeHead(302, { Location: authorizeUrl.toString() });
  res.end();
}
