import { sql } from "@vercel/postgres";
import { publishDailyPetInfo } from "../server_lib/petinfo-daily.js";

async function ensureSchema() {
  await sql`
    create table if not exists pg_pet_info (
      id text primary key,
      category text not null,
      title_ko text not null,
      title_en text not null default '',
      summary_ko text not null,
      summary_en text not null default '',
      body_ko text not null,
      body_en text not null default '',
      featured boolean not null default false,
      active boolean not null default true,
      sort_order integer not null default 0,
      publish_at timestamptz,
      created_by text,
      updated_by text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error:"Method not allowed" });
  const secret = String(process.env.CRON_SECRET || "");
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error:"Unauthorized" });
  try {
    await ensureSchema();
    const item = await publishDailyPetInfo(sql);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({ ok:true, date:item.dateKey, id:item.id, created:item.created });
  } catch (error) {
    console.error("petinfo-cron", error);
    return res.status(500).json({ error:"Pet정보 자동 게시 중 오류가 발생했어요." });
  }
}
