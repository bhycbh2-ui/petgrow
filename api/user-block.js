import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { ensureSchema } from "../server_lib/db.js";

async function ensureBlockSchema(){
  await ensureSchema();
  await sql`
    create table if not exists pg_user_blocks (
      blocker_user_id text not null references pg_users(id) on delete cascade,
      blocked_user_id text not null references pg_users(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (blocker_user_id, blocked_user_id),
      check (blocker_user_id <> blocked_user_id)
    )
  `;
  await sql`create index if not exists idx_pg_user_blocks_blocker on pg_user_blocks(blocker_user_id, created_at desc)`;
}

function requireUser(req,res){
  const uid=getSessionUserId(req);
  if(!uid){res.status(401).json({error:"unauthenticated"});return null;}
  return uid;
}

async function resolveTarget(targetType,targetId){
  if(targetType==="post"){
    const {rows}=await sql`
      select p.user_id,coalesce(u.nickname,'PetGrow 회원') nickname
      from pg_posts p join pg_users u on u.id=p.user_id where p.id=${targetId} limit 1
    `;
    return rows[0]||null;
  }
  if(targetType==="comment"){
    const {rows}=await sql`
      select c.user_id,coalesce(u.nickname,'PetGrow 회원') nickname
      from pg_comments c join pg_users u on u.id=c.user_id where c.id=${targetId} limit 1
    `;
    return rows[0]||null;
  }
  if(targetType==="music_comment"){
    const {rows}=await sql`
      select c.user_id,coalesce(u.nickname,'PetGrow 회원') nickname
      from pg_music_comments c join pg_users u on u.id=c.user_id where c.id=${targetId} limit 1
    `;
    return rows[0]||null;
  }
  if(targetType==="place_review"){
    const {rows}=await sql`
      select r.user_id,coalesce(u.nickname,'PetGrow 회원') nickname
      from pg_place_reviews r join pg_users u on u.id=r.user_id where r.id=${targetId} limit 1
    `;
    return rows[0]||null;
  }
  return null;
}

async function blockedTargetIds(blockerUserId,targetType,targetIds){
  const ids=[...new Set(targetIds.map(String).filter(Boolean))].slice(0,60);
  if(!ids.length)return [];
  const idList=ids.join(",");
  if(targetType==="post"){
    const {rows}=await sql`
      select p.id from pg_posts p join pg_user_blocks b on b.blocked_user_id=p.user_id
      where b.blocker_user_id=${blockerUserId} and p.id=any(string_to_array(${idList},','))
    `;
    return rows.map(r=>r.id);
  }
  if(targetType==="comment"){
    const {rows}=await sql`
      select c.id from pg_comments c join pg_user_blocks b on b.blocked_user_id=c.user_id
      where b.blocker_user_id=${blockerUserId} and c.id=any(string_to_array(${idList},','))
    `;
    return rows.map(r=>r.id);
  }
  if(targetType==="music_comment"){
    const {rows}=await sql`
      select c.id from pg_music_comments c join pg_user_blocks b on b.blocked_user_id=c.user_id
      where b.blocker_user_id=${blockerUserId} and c.id=any(string_to_array(${idList},','))
    `;
    return rows.map(r=>r.id);
  }
  if(targetType==="place_review"){
    const {rows}=await sql`
      select r.id from pg_place_reviews r join pg_user_blocks b on b.blocked_user_id=r.user_id
      where b.blocker_user_id=${blockerUserId} and r.id=any(string_to_array(${idList},','))
    `;
    return rows.map(r=>r.id);
  }
  return [];
}

export default async function handler(req,res){
  try{
    const uid=requireUser(req,res);if(!uid)return;
    await ensureBlockSchema();

    if(req.method==="GET"){
      const targetType=String(req.query.targetType||"");
      const rawIds=String(req.query.targetIds||"").split(",").filter(Boolean);
      if(targetType&&rawIds.length){
        const ids=await blockedTargetIds(uid,targetType,rawIds);
        return res.status(200).json({blockedTargetIds:ids});
      }
      const {rows}=await sql`
        select b.blocked_user_id,coalesce(u.nickname,'PetGrow 회원') nickname,b.created_at
        from pg_user_blocks b join pg_users u on u.id=b.blocked_user_id
        where b.blocker_user_id=${uid} order by b.created_at desc
      `;
      return res.status(200).json({users:rows.map(r=>({id:r.blocked_user_id,nickname:r.nickname,createdAt:r.created_at}))});
    }

    if(req.method==="POST"){
      const {targetType,targetId}=req.body||{};
      if(!["post","comment","music_comment","place_review"].includes(targetType)||!targetId){
        return res.status(400).json({error:"invalid target"});
      }
      const target=await resolveTarget(targetType,String(targetId));
      if(!target)return res.status(404).json({error:"target not found"});
      if(target.user_id===uid)return res.status(400).json({error:"cannot block self"});
      await sql`
        insert into pg_user_blocks(blocker_user_id,blocked_user_id)
        values(${uid},${target.user_id}) on conflict do nothing
      `;
      return res.status(200).json({ok:true,blocked:true,nickname:target.nickname});
    }

    if(req.method==="DELETE"){
      const blockedUserId=String(req.body?.blockedUserId||req.query.blockedUserId||"");
      if(!blockedUserId)return res.status(400).json({error:"blockedUserId is required"});
      await sql`delete from pg_user_blocks where blocker_user_id=${uid} and blocked_user_id=${blockedUserId}`;
      return res.status(200).json({ok:true,blocked:false});
    }

    return res.status(405).json({error:"method not allowed"});
  }catch(error){
    console.error("user-block",error?.message||error);
    return res.status(500).json({error:"block operation failed"});
  }
}
