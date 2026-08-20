import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole, roleCan, verifyToken, logAdmin } from "../server_lib/admin.js";

const CATEGORIES = new Set(["dog", "cat", "health", "life", "food", "training", "safety", "grooming"]);

async function ensurePetInfoSchema() {
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
  await sql`create index if not exists idx_pg_pet_info_public on pg_pet_info(active, publish_at, sort_order, created_at desc)`;
  await sql`create index if not exists idx_pg_pet_info_category on pg_pet_info(category, active, sort_order)`;
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function int(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parsePublishAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return date.toISOString();
}

async function requireAdmin(req, res) {
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "로그인이 필요해요." });
    return null;
  }
  const role = await getAdminRole(uid);
  if (!role || !roleCan(role, "petinfo")) {
    res.status(403).json({ error: "Pet정보 관리 권한이 없어요." });
    return null;
  }
  if (!verifyToken(req.headers["x-petgrow-admin-token"], uid)) {
    res.status(403).json({ error: "관리자 인증 시간이 만료됐어요. PIN을 다시 입력해 주세요.", code: "ADMIN_TOKEN_EXPIRED" });
    return null;
  }
  return { uid, role };
}

function normalizeRow(row) {
  return {
    id: row.id,
    category: row.category,
    featured: !!row.featured,
    active: !!row.active,
    sortOrder: Number(row.sort_order) || 0,
    publishAt: row.publish_at || null,
    title: { ko: row.title_ko || "", en: row.title_en || "" },
    summary: { ko: row.summary_ko || "", en: row.summary_en || "" },
    body: { ko: row.body_ko || "", en: row.body_en || "" },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req, res) {
  try {
    await ensurePetInfoSchema();
    const action = String(req.query.action || "list");

    if (action === "list" && req.method === "GET") {
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      const category = clean(req.query.category, 30);
      const search = clean(req.query.q, 100);
      const page = Math.max(1, int(req.query.page, 1));
      const pageSize = Math.min(500, Math.max(1, int(req.query.pageSize, 100)));
      const offset = (page - 1) * pageSize;
      const now = new Date().toISOString();
      const categoryFilter = CATEGORIES.has(category) ? category : null;
      const searchLike = search ? `%${search}%` : null;
      const { rows } = await sql`
        select * from pg_pet_info
        where active=true
          and (publish_at is null or publish_at <= ${now})
          and (${categoryFilter}::text is null or category=${categoryFilter})
          and (${searchLike}::text is null or title_ko ilike ${searchLike} or title_en ilike ${searchLike} or summary_ko ilike ${searchLike} or summary_en ilike ${searchLike})
        order by featured desc, sort_order asc, created_at desc
        limit ${pageSize} offset ${offset}
      `;
      const count = await sql`
        select count(*)::int n from pg_pet_info
        where active=true
          and (publish_at is null or publish_at <= ${now})
          and (${categoryFilter}::text is null or category=${categoryFilter})
          and (${searchLike}::text is null or title_ko ilike ${searchLike} or title_en ilike ${searchLike} or summary_ko ilike ${searchLike} or summary_en ilike ${searchLike})
      `;
      return res.status(200).json({ items: rows.map(normalizeRow), page, pageSize, total: count.rows[0]?.n || 0 });
    }

    res.setHeader("Cache-Control", "no-store");
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (action === "admin-list" && req.method === "GET") {
      const { rows } = await sql`select * from pg_pet_info order by active desc, sort_order asc, created_at desc`;
      return res.status(200).json({ items: rows.map(normalizeRow) });
    }

    if (action === "admin-save" && req.method === "POST") {
      const body = req.body || {};
      const category = clean(body.category, 30);
      const titleKo = clean(body.titleKo, 180);
      const titleEn = clean(body.titleEn, 180);
      const summaryKo = clean(body.summaryKo, 600);
      const summaryEn = clean(body.summaryEn, 600);
      const bodyKo = clean(body.bodyKo, 7000);
      const bodyEn = clean(body.bodyEn, 7000);
      if (!CATEGORIES.has(category)) return res.status(400).json({ error: "올바른 카테고리를 선택해 주세요." });
      if (titleKo.length < 2 || summaryKo.length < 2 || bodyKo.length < 2) return res.status(400).json({ error: "한국어 제목·요약·본문을 입력해 주세요." });
      const id = clean(body.id, 100) || `tip-${crypto.randomUUID()}`;
      const featured = !!body.featured;
      const active = body.active !== false;
      const sortOrder = int(body.sortOrder, 0);
      const publishAt = parsePublishAt(body.publishAt);
      if (publishAt === undefined) return res.status(400).json({ error: "예약 게시 날짜가 올바르지 않아요." });
      await sql`
        insert into pg_pet_info(
          id,category,title_ko,title_en,summary_ko,summary_en,body_ko,body_en,
          featured,active,sort_order,publish_at,created_by,updated_by
        ) values(
          ${id},${category},${titleKo},${titleEn},${summaryKo},${summaryEn},${bodyKo},${bodyEn},
          ${featured},${active},${sortOrder},${publishAt},${admin.uid},${admin.uid}
        )
        on conflict(id) do update set
          category=excluded.category,title_ko=excluded.title_ko,title_en=excluded.title_en,
          summary_ko=excluded.summary_ko,summary_en=excluded.summary_en,
          body_ko=excluded.body_ko,body_en=excluded.body_en,
          featured=excluded.featured,active=excluded.active,sort_order=excluded.sort_order,
          publish_at=excluded.publish_at,updated_by=${admin.uid},updated_at=now()
      `;
      await logAdmin(admin.uid, body.id ? "PETINFO_UPDATE" : "PETINFO_CREATE", null, null, { id, category, title: titleKo });
      return res.status(200).json({ ok: true, id });
    }

    if (action === "admin-toggle" && req.method === "POST") {
      const id = clean(req.body?.id, 100);
      const active = !!req.body?.active;
      if (!id) return res.status(400).json({ error: "id가 필요해요." });
      const result = await sql`update pg_pet_info set active=${active},updated_by=${admin.uid},updated_at=now() where id=${id} returning id`;
      if (!result.rows[0]) return res.status(404).json({ error: "Pet정보를 찾을 수 없어요." });
      await logAdmin(admin.uid, "PETINFO_TOGGLE", null, null, { id, active });
      return res.status(200).json({ ok: true });
    }

    if (action === "admin-delete" && req.method === "POST") {
      const id = clean(req.body?.id, 100);
      if (!id) return res.status(400).json({ error: "id가 필요해요." });
      const result = await sql`delete from pg_pet_info where id=${id} returning id`;
      if (!result.rows[0]) return res.status(404).json({ error: "Pet정보를 찾을 수 없어요." });
      await logAdmin(admin.uid, "PETINFO_DELETE", null, null, { id });
      return res.status(200).json({ ok: true });
    }

    if (action === "admin-import" && req.method === "POST") {
      const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 1000) : [];
      if (!items.length) return res.status(400).json({ error: "가져올 Pet정보 데이터가 없어요." });
      let imported = 0;
      let skipped = 0;
      for (const item of items) {
        const category = clean(item.category, 30);
        const titleKo = clean(item.title?.ko ?? item.titleKo, 180);
        const summaryKo = clean(item.summary?.ko ?? item.summaryKo, 600);
        const bodyKo = clean(item.body?.ko ?? item.bodyKo, 7000);
        if (!CATEGORIES.has(category) || !titleKo || !summaryKo || !bodyKo) { skipped += 1; continue; }
        const id = clean(item.id, 100) || `tip-${crypto.randomUUID()}`;
        const result = await sql`
          insert into pg_pet_info(id,category,title_ko,title_en,summary_ko,summary_en,body_ko,body_en,featured,active,sort_order,created_by,updated_by)
          values(${id},${category},${titleKo},${clean(item.title?.en ?? item.titleEn,180)},${summaryKo},${clean(item.summary?.en ?? item.summaryEn,600)},${bodyKo},${clean(item.body?.en ?? item.bodyEn,7000)},${!!item.featured},${item.active!==false},${int(item.sortOrder,0)},${admin.uid},${admin.uid})
          on conflict(id) do nothing
          returning id
        `;
        if (result.rows[0]) imported += 1; else skipped += 1;
      }
      await logAdmin(admin.uid, "PETINFO_IMPORT", null, null, { imported, skipped });
      return res.status(200).json({ ok: true, imported, skipped });
    }

    return res.status(405).json({ error: "지원하지 않는 요청이에요." });
  } catch (error) {
    console.error("petinfo", error);
    return res.status(500).json({ error: "Pet정보 처리 중 오류가 발생했어요." });
  }
}
