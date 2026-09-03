import { BASE_URL, SESSION_COOKIE, SESSION_MAX_AGE } from "../../../server_lib/config.js";
import { consumeAuthHandoff } from "../../../server_lib/db.js";
import { signSession } from "../../../server_lib/session.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const token = typeof req.query?.token === "string" ? req.query.token : "";
  const handoff = await consumeAuthHandoff(token);
  if (!handoff?.user_id) {
    res.writeHead(302, { Location: `${BASE_URL}/?login=error` });
    res.end();
    return;
  }

  const sessionToken = signSession({ uid: handoff.user_id });
  res.setHeader("Set-Cookie", [
    `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
  ]);
  res.writeHead(302, { Location: `${BASE_URL}/?login=success` });
  res.end();
}
