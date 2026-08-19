import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { ensureSchema, ensureAuthSchema } from "./db.js";
const TTL=2*60*60*1000, attempts=new Map();
const secret=()=>String(process.env.SESSION_SECRET||"");
export async function isAdminUserId(userId){await ensureAuthSchema();if(!userId)return false;const {rows}=await sql`select 1 from pg_admins where user_id=${userId}`;return !!rows[0]}
export async function adminExists(){await ensureAuthSchema();const {rows}=await sql`select exists(select 1 from pg_admins) ok`;return !!rows[0]?.ok}
export function hashPin(pin,salt=crypto.randomBytes(16).toString("hex")){return {salt,hash:crypto.scryptSync(String(pin),salt,32).toString("hex")}}
export async function verifyPin(userId,pin){await ensureAuthSchema();const now=Date.now(),a=attempts.get(userId)||{n:0,until:0};if(a.until>now)return {ok:false,locked:true};const {rows}=await sql`select pin_salt,pin_hash from pg_admins where user_id=${userId}`;const r=rows[0];let ok=false;try{ok=!!r&&crypto.timingSafeEqual(Buffer.from(r.pin_hash,"hex"),crypto.scryptSync(String(pin),r.pin_salt,32))}catch{}if(ok){attempts.delete(userId);return {ok:true}}a.n++;if(a.n>=5){a.n=0;a.until=now+15*60*1000}attempts.set(userId,a);return {ok:false,locked:a.until>now}}
export function issueToken(uid){const body=Buffer.from(JSON.stringify({uid,exp:Date.now()+TTL})).toString("base64url");const sig=crypto.createHmac("sha256",secret()).update(body).digest("base64url");return `${body}.${sig}`}
export function verifyToken(token,uid){try{if(!secret())return false;const [b,s]=String(token||"").split(".");const e=crypto.createHmac("sha256",secret()).update(b).digest("base64url");if(!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))return false;const p=JSON.parse(Buffer.from(b,"base64url").toString());return p.uid===uid&&p.exp>Date.now()}catch{return false}}
export async function logAdmin(admin,action,target=null,report=null,detail={}){await sql`insert into pg_admin_audit_logs(id,admin_user_id,action,target_user_id,report_id,detail) values(${crypto.randomUUID()},${admin},${action},${target},${report},${JSON.stringify(detail)}::jsonb)`}

export async function getAdminRecord(userId){
  await ensureAuthSchema();
  if(!userId)return null;
  const {rows}=await sql`select user_id,role,pin_hash,pin_salt,created_at,pin_updated_at,last_admin_login_at from pg_admins where user_id=${userId}`;
  return rows[0]||null;
}
export async function getAdminRole(userId){
  const r=await getAdminRecord(userId); return r?.role||null;
}
export function roleCan(role,cap){
  const map={
    superadmin:new Set(["dashboard","reports","logs","ads","music","petinfo","notices","inquiries","admins","service"]),
    operator:new Set(["dashboard","reports","logs","ads","music","petinfo","notices","inquiries","service"]),
    report:new Set(["reports"]),
    ads:new Set(["ads","music"])
  };
  return !!map[role]?.has(cap);
}
