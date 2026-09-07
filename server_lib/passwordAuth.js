import crypto from "crypto";
import { promisify } from "util";
import { sql } from "@vercel/postgres";

const scryptAsync = promisify(crypto.scrypt);
let passwordSchemaReadyPromise = null;

export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!/^[a-z][a-z0-9_]{3,19}$/.test(username)) {
    return { ok: false, error: "아이디는 영문자로 시작하는 영문·숫자·밑줄 4~20자로 입력해 주세요." };
  }
  return { ok: true, username };
}

export function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, error: "비밀번호는 영문과 숫자를 포함해 8~72자로 입력해 주세요." };
  }
  return { ok: true, password };
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(key).toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [kind, salt, expectedHex] = String(stored || "").split("$");
  if (kind !== "scrypt" || !salt || !/^[a-f0-9]{128}$/i.test(expectedHex || "")) return false;
  const actual = Buffer.from(await scryptAsync(String(password || ""), salt, 64));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function ensurePasswordAuthSchema() {
  if (!passwordSchemaReadyPromise) {
    passwordSchemaReadyPromise = (async () => {
      await sql`
    create table if not exists pg_users (
      id text primary key, kakao_id text unique, nickname text, profile_image text,
      created_at timestamptz not null default now(), last_login_at timestamptz not null default now()
    )
  `;
      await sql`alter table pg_users alter column kakao_id drop not null`;
      await sql`alter table pg_users add column if not exists username text`;
      await sql`alter table pg_users add column if not exists password_hash text`;
      await sql`alter table pg_users add column if not exists real_name text`;
      await sql`alter table pg_users add column if not exists email text`;
      await sql`alter table pg_users add column if not exists phone text`;
      await sql`alter table pg_users add column if not exists email_verified_at timestamptz`;
      await sql`create unique index if not exists idx_pg_users_username_unique on pg_users(lower(username)) where username is not null`;
      await sql`create unique index if not exists idx_pg_users_email_unique on pg_users(lower(email)) where email is not null`;
      await sql`
    create table if not exists pg_password_reset_codes (
      id text primary key,
      user_id text not null references pg_users(id) on delete cascade,
      code_hash text not null,
      expires_at timestamptz not null,
      used_at timestamptz,
      attempts integer not null default 0,
      created_at timestamptz not null default now()
    )
  `;
      await sql`create index if not exists idx_pg_password_reset_user on pg_password_reset_codes(user_id, created_at desc)`;
      await sql`
    create table if not exists pg_email_verification_codes (
      id text primary key,
      user_id text references pg_users(id) on delete cascade,
      email text not null,
      purpose text not null,
      code_hash text not null,
      expires_at timestamptz not null,
      used_at timestamptz,
      attempts integer not null default 0,
      created_at timestamptz not null default now()
    )
  `;
      await sql`create index if not exists idx_pg_email_verification_lookup on pg_email_verification_codes(lower(email), purpose, user_id, created_at desc)`;
      await sql`
    create table if not exists pg_login_attempts (
      id text primary key,
      attempt_key text not null,
      created_at timestamptz not null default now()
    )
  `;
      await sql`create index if not exists idx_pg_login_attempts_key on pg_login_attempts(attempt_key, created_at desc)`;
    })().catch((error) => {
      passwordSchemaReadyPromise = null;
      throw error;
    });
  }
  return passwordSchemaReadyPromise;
}

export async function getUserByUsername(username) {
  await ensurePasswordAuthSchema();
  const { rows } = await sql`select * from pg_users where lower(username)=lower(${normalizeUsername(username)}) limit 1`;
  return rows[0] || null;
}

export async function getUserByEmail(email) {
  await ensurePasswordAuthSchema();
  const { rows } = await sql`select * from pg_users where lower(email)=lower(${normalizeEmail(email)}) limit 1`;
  return rows[0] || null;
}

export async function createPasswordUser({ username, password, realName, nickname, email, phone }) {
  await ensurePasswordAuthSchema();
  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const { rows } = await sql`
    insert into pg_users(id, kakao_id, username, password_hash, real_name, nickname, email, phone, email_verified_at)
    values(${id}, null, ${normalizeUsername(username)}, ${passwordHash}, ${String(realName).trim()}, ${String(nickname).trim()}, ${normalizeEmail(email)}, ${normalizePhone(phone) || null}, now())
    returning *
  `;
  return rows[0];
}

export async function attachPasswordCredentials(userId, { username, password, realName, email, phone }) {
  await ensurePasswordAuthSchema();
  const passwordHash = await hashPassword(password);
  const { rows } = await sql`
    update pg_users set username=${normalizeUsername(username)}, password_hash=${passwordHash},
      real_name=${String(realName).trim()}, email=${normalizeEmail(email)}, phone=${normalizePhone(phone) || null}, email_verified_at=now()
    where id=${userId} returning *
  `;
  return rows[0] || null;
}

export async function linkOrCreateKakaoUser({ kakaoId, nickname, profileImage, email, emailVerified }) {
  await ensurePasswordAuthSchema();
  const byKakao = await sql`select * from pg_users where kakao_id=${kakaoId} limit 1`;
  if (byKakao.rows[0]) {
    const { rows } = await sql`update pg_users set nickname=coalesce(${nickname || null}, nickname), profile_image=coalesce(${profileImage || null}, profile_image), last_login_at=now() where id=${byKakao.rows[0].id} returning *`;
    return rows[0];
  }
  const cleanEmail = emailVerified ? normalizeEmail(email) : "";
  if (cleanEmail) {
    const match = await sql`select * from pg_users where lower(email)=lower(${cleanEmail}) limit 1`;
    if (match.rows[0] && !match.rows[0].kakao_id && match.rows[0].email_verified_at) {
      const { rows } = await sql`update pg_users set kakao_id=${kakaoId}, profile_image=coalesce(${profileImage || null}, profile_image), last_login_at=now(), email_verified_at=coalesce(email_verified_at, now()) where id=${match.rows[0].id} returning *`;
      return rows[0];
    }
    if (match.rows[0]) {
      // 동일 이메일이 이미 다른 계정에 연결됐거나 기존 계정의 이메일 인증이 확인되지 않으면
      // 자동 병합하지 않고 별도 계정을 만들어 계정 탈취와 이메일 중복을 방지합니다.
      const id = crypto.randomUUID();
      const { rows } = await sql`insert into pg_users(id,kakao_id,nickname,profile_image) values(${id},${kakaoId},${nickname || null},${profileImage || null}) returning *`;
      return rows[0];
    }
  }
  const id = crypto.randomUUID();
  const { rows } = await sql`insert into pg_users(id,kakao_id,nickname,profile_image,email,email_verified_at) values(${id},${kakaoId},${nickname || null},${profileImage || null},${cleanEmail || null},${cleanEmail ? new Date() : null}) returning *`;
  return rows[0];
}

export async function findUsername({ realName, email }) {
  await ensurePasswordAuthSchema();
  const { rows } = await sql`select username from pg_users where real_name=${String(realName || "").trim()} and lower(email)=lower(${normalizeEmail(email)}) and username is not null and email_verified_at is not null limit 1`;
  return rows[0]?.username || null;
}

export function authCodeHash(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function validVerificationPurpose(purpose) {
  return purpose === "signup" || purpose === "attach";
}

export async function createEmailVerificationCode({ email, userId = null, purpose }) {
  await ensurePasswordAuthSchema();
  if (!validVerificationPurpose(purpose)) throw new Error("INVALID_VERIFICATION_PURPOSE");
  const cleanEmail = normalizeEmail(email);
  await sql`delete from pg_email_verification_codes where expires_at < now() or used_at is not null`;
  const recent = await sql`
    select created_at from pg_email_verification_codes
    where lower(email)=lower(${cleanEmail}) and purpose=${purpose}
      and coalesce(user_id, '')=coalesce(${userId}, '') and used_at is null
    order by created_at desc limit 1
  `;
  if (recent.rows[0] && Date.now() - new Date(recent.rows[0].created_at).getTime() < 60_000) {
    throw new Error("AUTH_CODE_TOO_SOON");
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  await sql`
    insert into pg_email_verification_codes(id,user_id,email,purpose,code_hash,expires_at)
    values(${crypto.randomUUID()},${userId},${cleanEmail},${purpose},${authCodeHash(code)},now()+interval '10 minutes')
  `;
  return code;
}

export async function consumeEmailVerificationCode({ email, userId = null, purpose, code }) {
  await ensurePasswordAuthSchema();
  if (!validVerificationPurpose(purpose)) return false;
  const cleanEmail = normalizeEmail(email);
  const { rows } = await sql`
    select * from pg_email_verification_codes
    where lower(email)=lower(${cleanEmail}) and purpose=${purpose}
      and coalesce(user_id, '')=coalesce(${userId}, '') and used_at is null and expires_at>now()
    order by created_at desc limit 1
  `;
  const record = rows[0];
  if (!record || record.attempts >= 5) return false;
  const actual = Buffer.from(authCodeHash(code));
  const expected = Buffer.from(String(record.code_hash));
  const ok = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  if (!ok) {
    await sql`update pg_email_verification_codes set attempts=attempts+1 where id=${record.id}`;
    return false;
  }
  const consumed = await sql`update pg_email_verification_codes set used_at=now() where id=${record.id} and used_at is null returning id`;
  return consumed.rows.length === 1;
}

export async function createPasswordResetCode(userId) {
  await ensurePasswordAuthSchema();
  await sql`delete from pg_password_reset_codes where expires_at < now() or used_at is not null`;
  const recent = await sql`select created_at from pg_password_reset_codes where user_id=${userId} and used_at is null order by created_at desc limit 1`;
  if (recent.rows[0] && Date.now() - new Date(recent.rows[0].created_at).getTime() < 60_000) throw new Error("AUTH_CODE_TOO_SOON");
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  await sql`insert into pg_password_reset_codes(id,user_id,code_hash,expires_at) values(${crypto.randomUUID()},${userId},${authCodeHash(code)},now()+interval '10 minutes')`;
  return code;
}

export async function resetPasswordWithCode({ userId, code, newPassword }) {
  await ensurePasswordAuthSchema();
  const { rows } = await sql`select * from pg_password_reset_codes where user_id=${userId} and used_at is null and expires_at>now() order by created_at desc limit 1`;
  const record = rows[0];
  if (!record || record.attempts >= 5) return false;
  const actual = Buffer.from(authCodeHash(code));
  const expected = Buffer.from(String(record.code_hash));
  const ok = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  if (!ok) {
    await sql`update pg_password_reset_codes set attempts=attempts+1 where id=${record.id}`;
    return false;
  }
  const passwordHash = await hashPassword(newPassword);
  await sql`update pg_users set password_hash=${passwordHash} where id=${userId}`;
  await sql`update pg_password_reset_codes set used_at=now() where id=${record.id}`;
  return true;
}

export async function findResetUser(username, email) {
  await ensurePasswordAuthSchema();
  const { rows } = await sql`select * from pg_users where lower(username)=lower(${normalizeUsername(username)}) and lower(email)=lower(${normalizeEmail(email)}) and email_verified_at is not null limit 1`;
  return rows[0] || null;
}

export function loginAttemptKey(username, ipAddress) {
  return crypto.createHash("sha256").update(`${normalizeUsername(username)}|${String(ipAddress || "unknown")}`).digest("hex");
}

export async function isLoginRateLimited(attemptKey) {
  await ensurePasswordAuthSchema();
  await sql`delete from pg_login_attempts where created_at < now()-interval '15 minutes'`;
  const { rows } = await sql`select count(*)::int as count from pg_login_attempts where attempt_key=${attemptKey} and created_at>=now()-interval '15 minutes'`;
  return Number(rows[0]?.count || 0) >= 10;
}

export async function recordLoginFailure(attemptKey) {
  await ensurePasswordAuthSchema();
  await sql`insert into pg_login_attempts(id,attempt_key) values(${crypto.randomUUID()},${attemptKey})`;
}

export async function clearLoginFailures(attemptKey) {
  await ensurePasswordAuthSchema();
  await sql`delete from pg_login_attempts where attempt_key=${attemptKey}`;
}
