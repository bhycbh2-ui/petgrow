import { BASE_URL } from "../../../server_lib/config.js";
import { consumeAuthHandoff } from "../../../server_lib/db.js";
import { createSessionCookies } from "../../../server_lib/session.js";

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

  res.setHeader("Set-Cookie", createSessionCookies(req, handoff.user_id));
  res.writeHead(302, { Location: `${BASE_URL}/?login=success` });
  res.end();
}
