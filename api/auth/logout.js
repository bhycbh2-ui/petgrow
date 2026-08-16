import { SESSION_COOKIE } from "../../server_lib/config.js";

export default async function handler(req, res) {
  res.setHeader("Set-Cookie", [`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`]);
  res.status(200).json({ ok: true });
}
