import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { ensureSchema } from "../server_lib/db.js";

const ALLOWED_EVENTS = new Set(["session", "heartbeat", "pageview", "ad_request", "ad_ready", "ad_error"]);
const ALLOWED_PLATFORMS = new Set(["web", "mobile_web", "pwa", "android", "ios"]);
const ALLOWED_PAGES = new Set(["home","about","pets","petlife","community","saju","petbti","tips","my","login","terms","privacy","admin","nearby","more","other"]);

function kstDay() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const obj = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}
function hashSession(sessionId) {
  const key = String(process.env.SESSION_SECRET || "petgrow-anonymous-analytics");
  return crypto.createHmac("sha256", key).update(String(sessionId)).digest("hex");
}
async function bump(day, metric, dimension = "") {
  await sql`
    insert into pg_daily_metrics(day, metric, dimension, count)
    values(${day}, ${metric}, ${dimension}, 1)
    on conflict(day, metric, dimension)
    do update set count = pg_daily_metrics.count + 1
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  await ensureSchema();
  const { event, sessionId, platform, page } = req.body || {};
  if (!ALLOWED_EVENTS.has(event)) return res.status(400).json({ error: "invalid event" });
  if (!sessionId || typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 200) {
    return res.status(400).json({ error: "invalid session" });
  }
  const day = kstDay();
  const sessionHash = hashSession(sessionId);
  const safePlatform = ALLOWED_PLATFORMS.has(platform) ? platform : "web";
  const safePage = ALLOWED_PAGES.has(page) ? page : "other";

  await sql`
    insert into pg_analytics_sessions(day, session_hash, platform, first_seen, last_seen)
    values(${day}, ${sessionHash}, ${safePlatform}, now(), now())
    on conflict(day, session_hash)
    do update set last_seen = now(), platform = excluded.platform
  `;

  if (event === "pageview") await bump(day, "pageview", safePage);
  if (event === "ad_request") await bump(day, "ad_request", safePlatform);
  if (event === "ad_ready") await bump(day, "ad_ready", safePlatform);
  if (event === "ad_error") await bump(day, "ad_error", safePlatform);

  if (Math.random() < 0.03) {
    await sql`delete from pg_analytics_sessions where day < current_date - interval '90 days'`;
  }
  return res.status(200).json({ ok: true });
}
