import { sql } from "@vercel/postgres";
import crypto from "crypto";

// Vercel Postgres(Storage 탭에서 생성)를 프로젝트에 연결하면
// POSTGRES_URL 등의 환경변수가 자동으로 주입돼요. 별도 설정 불필요.
// 테이블 이름은 pg_ 접두사를 붙여서 기존 DB의 다른 테이블과 겹치지 않도록 했어요.

let authSchemaReadyPromise = null;
let schemaReadyPromise = null;

// 로그인/세션 확인에는 회원·관리자 테이블만 필요해요.
// Pet톡/통계 전체 스키마를 기다리지 않도록 가볍게 분리합니다.
export function ensureAuthSchema() {
  if (!authSchemaReadyPromise) {
    authSchemaReadyPromise = (async () => {
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
      await sql`alter table pg_users add column if not exists created_at timestamptz not null default now()`;
      await sql`alter table pg_users add column if not exists last_login_at timestamptz not null default now()`;
      await sql`
        create table if not exists pg_oauth_states (
          state_hash text primary key,
          client text not null,
          expires_at timestamptz not null,
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists pg_auth_handoffs (
          token_hash text primary key,
          user_id text not null references pg_users(id) on delete cascade,
          expires_at timestamptz not null,
          created_at timestamptz not null default now()
        )
      `;
    })().catch((error) => {
      authSchemaReadyPromise = null;
      throw error;
    });
  }
  return authSchemaReadyPromise;
}

function authTokenHash(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function isValidAuthToken(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{32,160}$/.test(value);
}

export async function createOAuthState(client = "web") {
  await ensureAuthSchema();
  const normalizedClient = client === "android" ? "android" : "web";
  const state = `${normalizedClient === "android" ? "a" : "w"}_${crypto.randomBytes(32).toString("base64url")}`;
  const stateHash = authTokenHash(state);
  await sql`delete from pg_oauth_states where expires_at <= now()`;
  await sql`
    insert into pg_oauth_states(state_hash, client, expires_at)
    values(${stateHash}, ${normalizedClient}, now() + interval '10 minutes')
  `;
  return state;
}

export async function consumeOAuthState(state) {
  if (!isValidAuthToken(state)) return null;
  await ensureAuthSchema();
  const stateHash = authTokenHash(state);
  const { rows } = await sql`
    delete from pg_oauth_states
    where state_hash = ${stateHash} and expires_at > now()
    returning client
  `;
  return rows[0] || null;
}

export async function createAuthHandoff(userId) {
  await ensureAuthSchema();
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = authTokenHash(token);
  await sql`delete from pg_auth_handoffs where expires_at <= now()`;
  await sql`
    insert into pg_auth_handoffs(token_hash, user_id, expires_at)
    values(${tokenHash}, ${userId}, now() + interval '3 minutes')
  `;
  return token;
}

export async function consumeAuthHandoff(token) {
  if (!isValidAuthToken(token)) return null;
  await ensureAuthSchema();
  const tokenHash = authTokenHash(token);
  const { rows } = await sql`
    delete from pg_auth_handoffs
    where token_hash = ${tokenHash} and expires_at > now()
    returning user_id
  `;
  return rows[0] || null;
}

export function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await ensureAuthSchema();

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
      await sql`alter table pg_reports add column if not exists status text not null default 'open'`;
      await sql`alter table pg_reports add column if not exists reviewed_at timestamptz`;
      await sql`alter table pg_reports add column if not exists reviewed_by text`;
      await sql`
        create table if not exists pg_community_restrictions (
          user_id text primary key references pg_users(id) on delete cascade,
          permanent boolean not null default false,
          restricted_until timestamptz,
          reason text,
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_restrictions_until on pg_community_restrictions(restricted_until)`;
      await sql`alter table pg_community_restrictions add column if not exists updated_by text`;
      await sql`
        create table if not exists pg_admins (
          user_id text primary key references pg_users(id) on delete cascade,
          pin_salt text not null,
          pin_hash text not null,
          created_at timestamptz not null default now(),
          pin_updated_at timestamptz not null default now()
        )
      `;
      await sql`alter table pg_admins add column if not exists role text not null default 'operator'`;
      await sql`alter table pg_admins add column if not exists added_by text`;
      await sql`alter table pg_admins add column if not exists last_admin_login_at timestamptz`;
      await sql`alter table pg_admins alter column pin_salt drop not null`;
      await sql`alter table pg_admins alter column pin_hash drop not null`;
      await sql`
        create table if not exists pg_notices (
          id text primary key,
          title text not null,
          body text not null,
          category text not null default 'notice',
          pinned boolean not null default false,
          popup boolean not null default false,
          active boolean not null default true,
          starts_at timestamptz,
          ends_at timestamptz,
          created_by text references pg_users(id) on delete set null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_notices_created on pg_notices(pinned desc,created_at desc)`;
      await sql`
        create table if not exists pg_inquiries (
          id text primary key,
          user_id text not null references pg_users(id) on delete cascade,
          category text not null default 'inquiry',
          title text not null,
          body text not null,
          is_public boolean not null default false,
          status text not null default 'waiting',
          admin_reply text,
          replied_by text references pg_users(id) on delete set null,
          replied_at timestamptz,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_inquiries_public on pg_inquiries(is_public,created_at desc)`;
      await sql`create index if not exists idx_pg_inquiries_user on pg_inquiries(user_id,created_at desc)`;
      await sql`
        create table if not exists pg_ad_inquiries (
          id text primary key,
          company_name text not null,
          contact_name text not null,
          email text not null,
          phone text,
          campaign_type text not null default 'banner',
          budget text,
          message text not null,
          status text not null default 'new',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_ad_inquiries_status on pg_ad_inquiries(status,created_at desc)`;
      await sql`
        create table if not exists pg_service_health_events (
          id text primary key,
          kind text not null,
          source text not null default 'api',
          status_code int,
          latency_ms int,
          detail text,
          created_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_service_health_events_created on pg_service_health_events(created_at desc)`;

      await sql`
        create table if not exists pg_direct_ads (
          id text primary key,
          name text not null,
          placement text not null,
          image_url text,
          target_url text,
          starts_at timestamptz,
          ends_at timestamptz,
          active boolean not null default false,
          priority int not null default 0,
          created_by text references pg_users(id) on delete set null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`alter table pg_direct_ads add column if not exists impressions bigint not null default 0`;
      await sql`alter table pg_direct_ads add column if not exists clicks bigint not null default 0`;


      await sql`
        create table if not exists pg_admin_audit_logs (
          id text primary key, admin_user_id text not null references pg_users(id) on delete cascade,
          action text not null, target_user_id text, report_id text, detail jsonb,
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists pg_nickname_registry (
          user_id text primary key references pg_users(id) on delete cascade,
          normalized_nickname text not null unique,
          updated_at timestamptz not null default now()
        )
      `;

      // ---- 개인정보 최소화 운영 통계 ----
      // IP, 이메일, 카카오 ID, User-Agent 원문은 이 통계 테이블에 저장하지 않아요.
      await sql`
        create table if not exists pg_analytics_sessions (
          day date not null,
          session_hash text not null,
          platform text not null default 'web',
          first_seen timestamptz not null default now(),
          last_seen timestamptz not null default now(),
          primary key (day, session_hash)
        )
      `;
      await sql`create index if not exists idx_pg_analytics_sessions_last_seen on pg_analytics_sessions(last_seen desc)`;
      await sql`
        create table if not exists pg_daily_metrics (
          day date not null,
          metric text not null,
          dimension text not null default '',
          count bigint not null default 0,
          primary key (day, metric, dimension)
        )
      `;

      // ---- Pet음악 ----
      await sql`
        create table if not exists pg_music_tracks (
          id text primary key,
          title text not null,
          description text,
          species text not null default 'all',
          vocal_type text not null default 'instrumental',
          mood text not null default 'relax',
          cover_url text,
          audio_url text not null,
          active boolean not null default true,
          play_count bigint not null default 0,
          like_count bigint not null default 0,
          comment_count bigint not null default 0,
          created_by text references pg_users(id) on delete set null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`alter table pg_music_tracks add column if not exists vocal_type text not null default 'instrumental'`;
      await sql`alter table pg_music_tracks add column if not exists mood text not null default 'relax'`;
      await sql`create index if not exists idx_pg_music_tracks_rank on pg_music_tracks(active,like_count desc,comment_count desc,play_count desc,created_at desc)`;
      await sql`
        create table if not exists pg_music_likes (
          track_id text not null references pg_music_tracks(id) on delete cascade,
          user_id text not null references pg_users(id) on delete cascade,
          created_at timestamptz not null default now(),
          primary key(track_id,user_id)
        )
      `;
      await sql`
        create table if not exists pg_music_comments (
          id text primary key,
          track_id text not null references pg_music_tracks(id) on delete cascade,
          user_id text not null references pg_users(id) on delete cascade,
          content text not null,
          status text not null default 'visible',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`alter table pg_music_comments add column if not exists status text not null default 'visible'`;
      await sql`alter table pg_music_comments add column if not exists updated_at timestamptz not null default now()`;
      await sql`create index if not exists idx_pg_music_comments_track on pg_music_comments(track_id,status,created_at desc)`;
      await sql`
        create table if not exists pg_music_comment_reports (
          id text primary key,
          comment_id text not null references pg_music_comments(id) on delete cascade,
          reporter_user_id text not null references pg_users(id) on delete cascade,
          reason text not null default 'other',
          detail text,
          status text not null default 'open',
          reviewed_at timestamptz,
          reviewed_by text references pg_users(id) on delete set null,
          created_at timestamptz not null default now(),
          unique(comment_id,reporter_user_id)
        )
      `;
      await sql`create index if not exists idx_pg_music_comment_reports_status on pg_music_comment_reports(status,created_at desc)`;

      // ---- 내 주변 Pet 장소 후기 ----
      // 카카오 장소 id를 기준으로 별점·간단 후기만 PetGrow DB에 저장합니다.
      // 사용자의 현재 위치 좌표는 이 테이블에 저장하지 않습니다.
      await sql`
        create table if not exists pg_place_reviews (
          id text primary key,
          place_id text not null,
          place_name text not null,
          user_id text not null references pg_users(id) on delete cascade,
          rating smallint not null check (rating between 1 and 5),
          content text not null,
          like_count bigint not null default 0,
          status text not null default 'visible',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      await sql`create index if not exists idx_pg_place_reviews_place on pg_place_reviews(place_id,status,created_at desc)`;
      await sql`
        create table if not exists pg_place_review_likes (
          review_id text not null references pg_place_reviews(id) on delete cascade,
          user_id text not null references pg_users(id) on delete cascade,
          created_at timestamptz not null default now(),
          primary key(review_id,user_id)
        )
      `;
      await sql`
        create table if not exists pg_place_review_reports (
          id text primary key,
          review_id text not null references pg_place_reviews(id) on delete cascade,
          reporter_user_id text not null references pg_users(id) on delete cascade,
          reason text not null,
          detail text,
          status text not null default 'open',
          reviewed_by text references pg_users(id) on delete set null,
          reviewed_at timestamptz,
          created_at timestamptz not null default now(),
          unique(review_id,reporter_user_id)
        )
      `;
      await sql`create index if not exists idx_pg_place_review_reports_status on pg_place_review_reports(status,created_at desc)`;

      await sql`
        create table if not exists pg_app_meta (
          key text primary key,
          value text,
          updated_at timestamptz not null default now()
        )
      `;

    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }
  return schemaReadyPromise;
}

// 카카오 고유 식별정보(kakaoId)로 회원을 찾고, 없으면 새로 생성해요.
// PetGrow 내부 user_id 는 여기서 발급되는 id(UUID) 예요 — 이후 모든 데이터는 이 id 를 기준으로 연결돼요.
export async function findOrCreateUserByKakaoId({ kakaoId, nickname, profileImage }) {
  await ensureAuthSchema();
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
  await ensureAuthSchema();
  const { rows } = await sql`select * from pg_users where id = ${id}`;
  return rows[0] || null;
}

export async function updateUserNickname(id, nickname) {
  await ensureSchema();
  const clean = String(nickname || "").trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 8) {
    const err = new Error("nickname must be 2-8 characters");
    err.code = "INVALID_NICKNAME";
    throw err;
  }
  const normalized = clean.toLocaleLowerCase("ko-KR");
  try {
    await sql`
      insert into pg_nickname_registry(user_id, normalized_nickname, updated_at)
      values(${id}, ${normalized}, now())
      on conflict(user_id)
      do update set normalized_nickname = excluded.normalized_nickname, updated_at = now()
    `;
  } catch (e) {
    if (e?.code === "23505") {
      const err = new Error("nickname already in use");
      err.code = "NICKNAME_DUPLICATE";
      throw err;
    }
    throw e;
  }
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
  // 첨부 이미지 삭제가 실패한 상태에서 계정만 먼저 삭제하면 고아 파일이 남을 수 있으므로,
  // Blob 정리가 성공한 뒤 DB 계정을 삭제합니다. 실패하면 요청 자체를 실패시켜 사용자가 다시 시도할 수 있게 합니다.
  const { deleteAllBlobsForUser } = await import("./community.js");
  await deleteAllBlobsForUser(id);
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


export async function getCommunityRestriction(userId) {
  await ensureSchema();
  if (!userId) return null;
  const { rows } = await sql`
    select restricted_until, permanent
    from pg_community_restrictions
    where user_id=${userId}
  `;
  const r=rows[0];
  if(!r)return null;
  if(r.permanent)return {restricted:true,permanent:true,restrictedUntil:null};
  if(r.restricted_until && new Date(r.restricted_until).getTime()>Date.now()){
    return {restricted:true,permanent:false,restrictedUntil:r.restricted_until};
  }
  if(r.restricted_until){
    await sql`delete from pg_community_restrictions where user_id=${userId}`;
  }
  return null;
}

export async function logServiceHealth(kind,source="api",statusCode=null,latencyMs=null,detail=""){
  try{
    await ensureSchema();
    await sql`insert into pg_service_health_events(id,kind,source,status_code,latency_ms,detail)
      values(${crypto.randomUUID()},${String(kind||"unknown").slice(0,40)},${String(source||"api").slice(0,80)},${statusCode==null?null:Number(statusCode)},${latencyMs==null?null:Number(latencyMs)},${String(detail||"").slice(0,400)})`;
  }catch{}
}
export async function getServiceHealthSummary(){
  await ensureSchema();
  const {rows}=await sql`
    select
      count(*) filter(where kind='error' and created_at>=now()-interval '15 minutes')::int errors15m,
      count(*) filter(where kind='db_error' and created_at>=now()-interval '1 hour')::int dbErrors1h,
      count(*) filter(where kind='rate_limit' and created_at>=now()-interval '1 hour')::int rateLimits1h,
      count(*) filter(where latency_ms>=3000 and created_at>=now()-interval '1 hour')::int slow1h,
      coalesce(round(avg(latency_ms) filter(where latency_ms is not null and created_at>=now()-interval '15 minutes')),0)::int avgLatency15m,
      coalesce(max(latency_ms) filter(where latency_ms is not null and created_at>=now()-interval '1 hour'),0)::int maxLatency1h
    from pg_service_health_events`;
  const {rows:recent}=await sql`select kind,source,status_code,latency_ms,detail,created_at from pg_service_health_events where created_at>=now()-interval '24 hours' order by created_at desc limit 20`;
  const s=rows[0]||{};let level="healthy",reason="정상";
  if((s.dbErrors1h||0)>=3||(s.errors15m||0)>=10||(s.maxLatency1h||0)>=8000){level="down";reason="오류 또는 응답 지연이 많이 발생하고 있어요."}
  else if((s.errors15m||0)>=3||(s.slow1h||0)>=5||(s.rateLimits1h||0)>=3||(s.avgLatency15m||0)>=1800){level="warning";reason="일부 요청 지연이나 오류가 감지됐어요."}
  return {level,reason,metrics:s,recent};
}
