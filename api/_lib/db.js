import { sql } from "@vercel/postgres";
import crypto from "crypto";

// Vercel Postgres(Storage 탭에서 생성)를 프로젝트에 연결하면
// POSTGRES_URL 등의 환경변수가 자동으로 주입돼요. 별도 설정 불필요.
// 테이블 이름은 pg_ 접두사를 붙여서 기존 DB의 다른 테이블과 겹치지 않도록 했어요.

let schemaReadyPromise = null;

export function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await sql`
        create table if not exists pg_users (
          id text primary key,
          kakao_id text unique not null,
          nickname text,
          profile_image text,
          created_at timestamptz not null default now(),
          last_login_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists pg_user_state (
          user_id text not null references pg_users(id) on delete cascade,
          key text not null,
          value jsonb not null,
          updated_at timestamptz not null default now(),
          primary key (user_id, key)
        )
      `;

      // ---- Pet톡 커뮤니티 (요청서: petgrow-community 기능 추가) ----
      // 반려동물 정보는 pg_user_state 안에 JSON으로만 존재하고 별도 pets 테이블이 없기 때문에,
      // 게시글/댓글에는 작성 시점의 반려동물 이름·품종·생일·사진을 함께 스냅샷으로 저장해요.
      // (나중에 프로필을 바꿔도 이미 쓴 글은 바뀌지 않지만, 기존 반려동물 저장 구조를 전혀 건드리지 않아도 돼요.)
      await sql`
        create table if not exists pg_posts (
          id text primary key,
          user_id text not null references pg_users(id) on delete cascade,
          pet_id text,
          pet_name text not null,
          pet_species text not null,
          pet_breed text,
          pet_birth_date text,
          pet_photo text,
          category text not null,
          title text not null,
          content text not null,
          like_count integer not null default 0,
          comment_count integer not null default 0,
          is_hidden boolean not null default false,
          is_public boolean not null default true,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`alter table pg_posts add column if not exists is_public boolean not null default true`;
      await sql`create index if not exists idx_pg_posts_created on pg_posts(created_at desc)`;
      await sql`create index if not exists idx_pg_posts_likes on pg_posts(like_count desc, created_at desc)`;
      await sql`create index if not exists idx_pg_posts_category on pg_posts(category)`;
      await sql`create index if not exists idx_pg_posts_user on pg_posts(user_id)`;

      await sql`
        create table if not exists pg_post_images (
          id text primary key,
          post_id text not null references pg_posts(id) on delete cascade,
          storage_url text not null,
          sort_order integer not null default 0,
          created_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_post_images_post on pg_post_images(post_id, sort_order)`;

      await sql`
        create table if not exists pg_comments (
          id text primary key,
          post_id text not null references pg_posts(id) on delete cascade,
          user_id text not null references pg_users(id) on delete cascade,
          pet_id text,
          pet_name text not null,
          pet_photo text,
          content text not null,
          is_hidden boolean not null default false,
          is_public boolean not null default true,
          created_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_comments_post on pg_comments(post_id, created_at)`;

      await sql`
        create table if not exists pg_likes (
          user_id text not null references pg_users(id) on delete cascade,
          post_id text not null references pg_posts(id) on delete cascade,
          created_at timestamptz not null default now(),
          primary key (user_id, post_id)
        )
      `;

      await sql`
        create table if not exists pg_reports (
          id text primary key,
          reporter_user_id text not null references pg_users(id) on delete cascade,
          target_type text not null,
          target_id text not null,
          reason text not null,
          detail text,
          created_at timestamptz not null default now()
        )
      `;
      // 같은 사용자가 같은 글/댓글을 반복 신고하지 못하도록 유니크 제약을 걸어요.
      await sql`
        create unique index if not exists uq_pg_reports_once
        on pg_reports(reporter_user_id, target_type, target_id)
      `;
      await sql`create index if not exists idx_pg_reports_target on pg_reports(target_type, target_id)`;
    })();
  }
  return schemaReadyPromise;
}

// 카카오 고유 식별정보(kakaoId)로 회원을 찾고, 없으면 새로 생성해요.
// PetGrow 내부 user_id 는 여기서 발급되는 id(UUID) 예요 — 이후 모든 데이터는 이 id 를 기준으로 연결돼요.
export async function findOrCreateUserByKakaoId({ kakaoId, nickname, profileImage }) {
  await ensureSchema();
  const existing = await sql`select * from pg_users where kakao_id = ${kakaoId}`;
  if (existing.rows[0]) {
    const updated = await sql`
      update pg_users
      set nickname = ${nickname || existing.rows[0].nickname},
          profile_image = ${profileImage || existing.rows[0].profile_image},
          last_login_at = now()
      where id = ${existing.rows[0].id}
      returning *
    `;
    return updated.rows[0];
  }
  const id = crypto.randomUUID();
  const created = await sql`
    insert into pg_users (id, kakao_id, nickname, profile_image)
    values (${id}, ${kakaoId}, ${nickname || null}, ${profileImage || null})
    returning *
  `;
  return created.rows[0];
}

export async function getUserById(id) {
  await ensureSchema();
  const { rows } = await sql`select * from pg_users where id = ${id}`;
  return rows[0] || null;
}

export async function updateUserNickname(id, nickname) {
  await ensureSchema();
  const clean = String(nickname || "").trim();
  if (clean.length < 2 || clean.length > 20) throw new Error("invalid nickname");
  const { rows } = await sql`
    update pg_users set nickname = ${clean}
    where id = ${id}
    returning *
  `;
  return rows[0] || null;
}

export async function deleteUser(id) {
  await ensureSchema();
  // Pet톡에 올린 이미지(Vercel Blob)는 DB 삭제로 자동 정리되지 않으므로 먼저 지워요.
  try {
    const { deleteAllBlobsForUser } = await import("./community.js");
    await deleteAllBlobsForUser(id);
  } catch (err) {
    console.warn("community blob cleanup failed on account delete:", err);
  }
  // ON DELETE CASCADE 로 pg_user_state(반려동물 정보 등)와 Pet톡 게시글/댓글/좋아요/신고 내역까지 함께 삭제돼요.
  await sql`delete from pg_users where id = ${id}`;
}

export async function getState(userId, key) {
  await ensureSchema();
  const { rows } = await sql`select value from pg_user_state where user_id = ${userId} and key = ${key}`;
  return rows[0] ? rows[0].value : null;
}

export async function setState(userId, key, value) {
  await ensureSchema();
  await sql`
    insert into pg_user_state (user_id, key, value, updated_at)
    values (${userId}, ${key}, ${JSON.stringify(value)}::jsonb, now())
    on conflict (user_id, key) do update set value = excluded.value, updated_at = now()
  `;
}
