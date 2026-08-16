import crypto from "crypto";
import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";
import { ensureSchema } from "./_lib/db.js";
import { getSessionUserId } from "./_lib/session.js";
import { getAdminRole, verifyToken, roleCan, logAdmin } from "./_lib/admin.js";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_COVER_BYTES = 4 * 1024 * 1024;
const AUDIO_MIME = new Set(["audio/mpeg","audio/mp3","audio/wav","audio/x-wav","audio/mp4","audio/aac"]);
const IMAGE_MIME = new Set(["image/jpeg","image/png","image/webp"]);

function parseDataUrl(dataUrl, allowed, maxBytes) {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!m || !allowed.has(m[1])) throw new Error("지원하지 않는 파일 형식이에요.");
  const buffer = Buffer.from(m[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new Error(`파일은 ${(maxBytes/1024/1024).toFixed(0)}MB 이하로 올려주세요.`);
  return { mime:m[1], buffer };
}
async function requireAdmin(req,res){
  const uid=getSessionUserId(req); if(!uid){res.status(401).json({error:"로그인이 필요해요."});return null;}
  const role=await getAdminRole(uid);
  if(!role || !verifyToken(req.headers["x-petgrow-admin-token"],uid) || !roleCan(role,"ads")){
    res.status(403).json({error:"Pet음악 관리 권한이 없어요."});return null;
  }
  return {uid,role};
}
function speciesWhere(species){
  if(species==="dog") return sql`and species in ('dog','all')`;
  if(species==="cat") return sql`and species in ('cat','all')`;
  return sql``;
}

export default async function handler(req,res){
  await ensureSchema();
  const action=String(req.query.action||"list");
  try{
    if(action==="list" && req.method==="GET"){
      const species=["dog","cat","all"].includes(String(req.query.species))?String(req.query.species):"all";
      const page=Math.max(1,parseInt(req.query.page||"1",10)||1), pageSize=20, offset=(page-1)*pageSize;
      const uid=getSessionUserId(req);
      let rows,countRows,topRows;
      if(species==="dog"){
        ({rows}=await sql`select t.*,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true and species in ('dog','all') order by created_at desc limit ${pageSize} offset ${offset}`);
        ({rows:countRows}=await sql`select count(*)::int n from pg_music_tracks where active=true and species in ('dog','all')`);
        ({rows:topRows}=await sql`select * from pg_music_tracks where active=true and species in ('dog','all') order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`);
      } else if(species==="cat"){
        ({rows}=await sql`select t.*,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true and species in ('cat','all') order by created_at desc limit ${pageSize} offset ${offset}`);
        ({rows:countRows}=await sql`select count(*)::int n from pg_music_tracks where active=true and species in ('cat','all')`);
        ({rows:topRows}=await sql`select * from pg_music_tracks where active=true and species in ('cat','all') order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`);
      } else {
        ({rows}=await sql`select t.*,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true order by created_at desc limit ${pageSize} offset ${offset}`);
        ({rows:countRows}=await sql`select count(*)::int n from pg_music_tracks where active=true`);
        ({rows:topRows}=await sql`select * from pg_music_tracks where active=true order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`);
      }
      const total=countRows?.[0]?.n||0;
      return res.status(200).json({items:rows,top5:topRows,total,page,pages:Math.max(1,Math.ceil(total/pageSize))});
    }
    if(action==="play" && req.method==="POST"){
      const id=String(req.body?.id||""); if(!id)return res.status(400).json({error:"곡 정보가 없어요."});
      await sql`update pg_music_tracks set play_count=play_count+1 where id=${id} and active=true`;
      return res.status(200).json({ok:true});
    }
    if(action==="like" && req.method==="POST"){
      const uid=getSessionUserId(req); if(!uid)return res.status(401).json({error:"좋아요는 로그인 후 이용할 수 있어요."});
      const id=String(req.body?.id||"");
      const {rows}=await sql`select 1 from pg_music_likes where track_id=${id} and user_id=${uid}`;
      if(rows[0]){await sql`delete from pg_music_likes where track_id=${id} and user_id=${uid}`; await sql`update pg_music_tracks set like_count=greatest(0,like_count-1) where id=${id}`; return res.status(200).json({liked:false});}
      await sql`insert into pg_music_likes(track_id,user_id) values(${id},${uid}) on conflict do nothing`;
      await sql`update pg_music_tracks set like_count=like_count+1 where id=${id}`;
      return res.status(200).json({liked:true});
    }
    if(action==="comments" && req.method==="GET"){
      const id=String(req.query.id||"");
      const {rows}=await sql`select c.id,c.content,c.created_at,u.nickname from pg_music_comments c join pg_users u on u.id=c.user_id where c.track_id=${id} order by c.created_at desc limit 100`;
      return res.status(200).json({items:rows});
    }
    if(action==="comment" && req.method==="POST"){
      const uid=getSessionUserId(req); if(!uid)return res.status(401).json({error:"댓글은 로그인 후 이용할 수 있어요."});
      const trackId=String(req.body?.id||""), content=String(req.body?.content||"").trim();
      if(!trackId||content.length<1||content.length>300)return res.status(400).json({error:"댓글은 1~300자로 입력해 주세요."});
      const id=crypto.randomUUID(); await sql`insert into pg_music_comments(id,track_id,user_id,content) values(${id},${trackId},${uid},${content})`;
      await sql`update pg_music_tracks set comment_count=comment_count+1 where id=${trackId}`;
      return res.status(201).json({ok:true,id});
    }
    if(action==="admin-list" && req.method==="GET"){
      if(!(await requireAdmin(req,res)))return;
      const {rows}=await sql`select * from pg_music_tracks order by created_at desc`;
      return res.status(200).json({items:rows});
    }
    if(action==="admin-save" && req.method==="POST"){
      const admin=await requireAdmin(req,res); if(!admin)return;
      const body=req.body||{}, title=String(body.title||"").trim(), species=["dog","cat","all"].includes(body.species)?body.species:"all";
      if(!title)return res.status(400).json({error:"노래 제목을 입력해 주세요."});
      let audioUrl=String(body.audioUrl||""), coverUrl=String(body.coverUrl||"");
      const id=String(body.id||crypto.randomUUID());
      if(body.audioDataUrl){const f=parseDataUrl(body.audioDataUrl,AUDIO_MIME,MAX_AUDIO_BYTES);const ext=f.mime.includes("wav")?"wav":f.mime.includes("mp4")?"m4a":"mp3";const b=await put(`petmusic/${id}-${Date.now()}.${ext}`,f.buffer,{access:"public",contentType:f.mime,token:process.env.BLOB_READ_WRITE_TOKEN});audioUrl=b.url;}
      if(body.coverDataUrl){const f=parseDataUrl(body.coverDataUrl,IMAGE_MIME,MAX_COVER_BYTES);const ext=f.mime.includes("png")?"png":f.mime.includes("webp")?"webp":"jpg";const b=await put(`petmusic/covers/${id}-${Date.now()}.${ext}`,f.buffer,{access:"public",contentType:f.mime,token:process.env.BLOB_READ_WRITE_TOKEN});coverUrl=b.url;}
      if(!audioUrl)return res.status(400).json({error:"음원 파일을 선택해 주세요."});
      await sql`insert into pg_music_tracks(id,title,description,species,cover_url,audio_url,active,created_by) values(${id},${title},${String(body.description||"").trim()||null},${species},${coverUrl||null},${audioUrl},${body.active!==false},${admin.uid}) on conflict(id) do update set title=excluded.title,description=excluded.description,species=excluded.species,cover_url=excluded.cover_url,audio_url=excluded.audio_url,active=excluded.active,updated_at=now()`;
      await logAdmin(admin.uid,body.id?"MUSIC_UPDATE":"MUSIC_CREATE",null,null,{trackId:id,title,species});
      return res.status(200).json({ok:true,id});
    }
    if(action==="admin-toggle" && req.method==="POST"){
      const admin=await requireAdmin(req,res); if(!admin)return; const id=String(req.body?.id||""); const active=!!req.body?.active;
      await sql`update pg_music_tracks set active=${active},updated_at=now() where id=${id}`; await logAdmin(admin.uid,"MUSIC_TOGGLE",null,null,{trackId:id,active}); return res.status(200).json({ok:true});
    }
    if(action==="admin-delete" && req.method==="POST"){
      const admin=await requireAdmin(req,res); if(!admin)return; const id=String(req.body?.id||""); await sql`delete from pg_music_tracks where id=${id}`; await logAdmin(admin.uid,"MUSIC_DELETE",null,null,{trackId:id}); return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:"지원하지 않는 요청이에요."});
  }catch(e){console.error("music",action,e);return res.status(500).json({error:e?.message||"Pet음악 처리 중 오류가 발생했어요."});}
}
