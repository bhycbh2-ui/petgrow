import crypto from "crypto";
import { sql } from "@vercel/postgres";

const START_POINTS = 300;
export const POINT_COSTS = { saju_basic: 50, saju_daily: 20, saju_compat: 40, tarot: 30 };
const REWARDS = {
  daily_login: { label: "오늘의 첫 접속", amount: 10, cap: 1 },
  community_post: { label: "Pet톡 글 작성", amount: 30, cap: 3 },
  community_comment: { label: "Pet톡 댓글 작성", amount: 10, cap: 10 },
  received_like: { label: "Pet톡 좋아요 받기", amount: 3, cap: 30 },
};
const kstDate = () => new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Seoul", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());

async function ensure() {
  await sql`create table if not exists pg_point_accounts(user_id text primary key,balance integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now())`;
  await sql`create table if not exists pg_point_ledger(id text primary key,user_id text not null,amount integer not null,reason text not null,label text not null,ref_key text,created_at timestamptz not null default now())`;
  await sql`create unique index if not exists pg_point_ledger_ref_uidx on pg_point_ledger(user_id,ref_key) where ref_key is not null`;
  await sql`create index if not exists pg_point_ledger_user_idx on pg_point_ledger(user_id,created_at desc)`;
}
async function ensureAccount(uid) {
  await ensure();
  const { rows } = await sql`select balance from pg_point_accounts where user_id=${uid}`;
  if (rows[0]) return Number(rows[0].balance)||0;
  await sql`insert into pg_point_accounts(user_id,balance) values(${uid},${START_POINTS}) on conflict do nothing`;
  await sql`insert into pg_point_ledger(id,user_id,amount,reason,label,ref_key) values(${crypto.randomUUID()},${uid},${START_POINTS},'welcome','PetGrow 시작 포인트','welcome') on conflict do nothing`;
  const { rows:r } = await sql`select balance from pg_point_accounts where user_id=${uid}`;
  return Number(r[0]?.balance)||START_POINTS;
}
export async function awardPoints(uid, reason, refKey) {
  const cfg=REWARDS[reason]; if(!cfg) return {awarded:0,balance:await ensureAccount(uid)};
  await ensureAccount(uid);
  if(refKey){const {rows:d}=await sql`select 1 from pg_point_ledger where user_id=${uid} and ref_key=${refKey} limit 1`;if(d[0])return {awarded:0,balance:await ensureAccount(uid)};}
  const today=kstDate();
  const {rows:c}=await sql`select count(*)::int n from pg_point_ledger where user_id=${uid} and reason=${reason} and amount>0 and (created_at at time zone 'Asia/Seoul')::date=${today}::date`;
  if(Number(c[0]?.n||0)>=cfg.cap)return {awarded:0,balance:await ensureAccount(uid),capReached:true};
  try{
    await sql`insert into pg_point_ledger(id,user_id,amount,reason,label,ref_key) values(${crypto.randomUUID()},${uid},${cfg.amount},${reason},${cfg.label},${refKey||null})`;
    const {rows:b}=await sql`update pg_point_accounts set balance=balance+${cfg.amount},updated_at=now() where user_id=${uid} returning balance`;
    return {awarded:cfg.amount,balance:Number(b[0]?.balance)||0,label:cfg.label};
  }catch(e){if(String(e?.message||"").toLowerCase().includes("duplicate"))return {awarded:0,balance:await ensureAccount(uid)};throw e;}
}
export async function revokePoints(uid, refKey, label="활동 삭제로 포인트 회수") {
  await ensureAccount(uid); if(!refKey)return {revoked:0};
  const {rows:r}=await sql`select amount from pg_point_ledger where user_id=${uid} and ref_key=${refKey} and amount>0 limit 1`;
  const n=Number(r[0]?.amount)||0;if(!n)return {revoked:0};
  const reverse=`revoke:${refKey}`;const {rows:d}=await sql`select 1 from pg_point_ledger where user_id=${uid} and ref_key=${reverse} limit 1`;if(d[0])return {revoked:0};
  const {rows:b}=await sql`update pg_point_accounts set balance=greatest(0,balance-${n}),updated_at=now() where user_id=${uid} returning balance`;
  await sql`insert into pg_point_ledger(id,user_id,amount,reason,label,ref_key) values(${crypto.randomUUID()},${uid},${-n},'revoke',${label},${reverse})`;
  return {revoked:n,balance:Number(b[0]?.balance)||0,label};
}
export async function spendPoints(uid, feature, cost, refKey) {
  await ensureAccount(uid);const n=Math.max(1,Number(cost)||POINT_COSTS[feature]||0);
  if(refKey){const {rows:d}=await sql`select 1 from pg_point_ledger where user_id=${uid} and ref_key=${refKey} limit 1`;if(d[0])return {spent:0,balance:await ensureAccount(uid),already:true};}
  const {rows:b}=await sql`update pg_point_accounts set balance=balance-${n},updated_at=now() where user_id=${uid} and balance>=${n} returning balance`;
  if(!b[0]){const bal=await ensureAccount(uid);const e=new Error(`PetPoint가 부족해요. 현재 ${bal}P 보유 중이에요.`);e.code="POINTS_INSUFFICIENT";throw e;}
  const labels={saju_basic:"기본 Pet사주 이용",saju_daily:"오늘의 펫운세 이용",saju_compat:"보호자 궁합 이용",tarot:"Pet타로 카드 뽑기"};
  await sql`insert into pg_point_ledger(id,user_id,amount,reason,label,ref_key) values(${crypto.randomUUID()},${uid},${-n},${feature},${labels[feature]||"PetGrow 콘텐츠 이용"},${refKey||null})`;
  return {spent:n,balance:Number(b[0].balance)||0,label:labels[feature]||"PetGrow 콘텐츠 이용"};
}
export async function getPointSummary(uid,{dailyLogin=true}={}) {
  await ensureAccount(uid);let pointEvent=null;if(dailyLogin){const e=await awardPoints(uid,"daily_login",`daily-login:${kstDate()}`);if(e.awarded)pointEvent=e;}
  const [{rows:b},{rows:l}]=await Promise.all([sql`select balance from pg_point_accounts where user_id=${uid}`,sql`select amount,reason,label,created_at from pg_point_ledger where user_id=${uid} order by created_at desc limit 20`]);
  return {balance:Number(b[0]?.balance)||0,startPoints:START_POINTS,costs:POINT_COSTS,recent:l,pointEvent,earnGuide:[{label:"Pet톡 글 작성",points:30,limit:"하루 3회"},{label:"Pet톡 댓글 작성",points:10,limit:"하루 10회"},{label:"좋아요 받기",points:3,limit:"하루 30회"},{label:"하루 첫 접속",points:10,limit:"하루 1회"}]};
}
export async function getPointAdminStats(){await ensure();const [{rows:a},{rows:l}]=await Promise.all([sql`select count(*)::int users,coalesce(sum(balance),0)::int balance from pg_point_accounts`,sql`select coalesce(sum(case when amount>0 then amount else 0 end),0)::int earned,coalesce(sum(case when amount<0 then -amount else 0 end),0)::int spent,count(*)::int events from pg_point_ledger`]);return {...(a[0]||{}),...(l[0]||{})};}
