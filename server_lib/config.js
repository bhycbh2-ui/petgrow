// PetGrow 운영 도메인. 카카오 Redirect URI 및 로그인 후 리다이렉트에 사용돼요.
// 프리뷰/스테이징 배포에서 다른 도메인을 쓰고 싶다면 Vercel 환경변수 PUBLIC_BASE_URL 로 덮어쓸 수 있어요.
export const BASE_URL = process.env.PUBLIC_BASE_URL || "https://www.petgrow.co.kr";

// 세션 쿠키 이름 및 유효기간(초) — 60일
export const SESSION_COOKIE = "pg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 60;

// 카카오 로그인 CSRF 방지용 state 쿠키
export const OAUTH_STATE_COOKIE = "pg_oauth_state";
