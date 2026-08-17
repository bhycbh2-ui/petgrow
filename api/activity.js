import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { ensureSchema } from "../server_lib/db.js";

async function ensureActivity(){
  await ensureSchema();
  await sql`create table if not exists pg_activity_log(
    id text primary key,
    user_id text not null references pg_users(id) on delete cascade,
    section text not null,
    action text not null,
    title text,
    ref_key text,
    detail jsonb,
    created_at timestamptz not null default now()
  )`;
  await sql`create index if not exists idx_pg_activity_user_created on pg_activity_log(user_id,created_at desc)`;
}
const s=(v,n=160)=>String(v??"").replace(/\s+/g," ").trim().slice(0,n);
const item=(type,title,detail,createdAt,refKey="",target=null)=>({type,title:s(title,180),detail:s(detail,240),createdAt,refKey:s(refKey,240),target:target||undefined});

export default async function handler(req,res){
  const uid=getSessionUserId(req);
  if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
  try{
    await ensureActivity();
    const action=String(req.query.action||"timeline");
    if(req.method==="POST"&&action==="log"){
      // 메뉴 단순 방문 로그는 운영 통계용으로만 저장할 수 있지만, 마이페이지 활동내역에는 노출하지 않습니다.
      const section=s(req.body?.section,40)||"service",kind=s(req.body?.action,40)||"view",title=s(req.body?.title,180),refKey=s(req.body?.refKey,240)||null;
      const detail=req.body?.detail&&typeof req.body.detail==="object"?req.body.detail:{};
      const {rows:recent}=await sql`select 1 from pg_activity_log where user_id=${uid} and section=${section} and action=${kind} and coalesce(ref_key,'')=coalesce(${refKey},'') and created_at>now()-interval '5 minutes' limit 1`;
      if(!recent[0])await sql`insert into pg_activity_log(id,user_id,section,action,title,ref_key,detail) values(${crypto.randomUUID()},${uid},${section},${kind},${title||null},${refKey},${JSON.stringify(detail)}::jsonb)`;
      return res.status(200).json({ok:true});
    }
    if(req.method!=="GET"||action!=="timeline")return res.status(405).json({error:"지원하지 않는 요청이에요."});

    const safe=async(fn)=>{try{return await fn()}catch{return []}};
    const [posts,comments,likes,musicLikes,newsLikes,newsComments,pointUses]=await Promise.all([
      safe(async()=> (await sql`select id,title,created_at from pg_posts where user_id=${uid} order by created_at desc limit 20`).rows),
      safe(async()=> (await sql`select c.id,c.content,c.created_at,p.id post_id,p.title from pg_comments c join pg_posts p on p.id=c.post_id where c.user_id=${uid} order by c.created_at desc limit 20`).rows),
      safe(async()=> (await sql`select p.id,p.title,l.created_at from pg_likes l join pg_posts p on p.id=l.post_id where l.user_id=${uid} order by l.created_at desc limit 20`).rows),
      safe(async()=> (await sql`select t.id,t.title,l.created_at from pg_music_likes l join pg_music_tracks t on t.id=l.track_id where l.user_id=${uid} order by l.created_at desc limit 20`).rows),
      safe(async()=> (await sql`select article_key,created_at from pg_news_likes where user_id=${uid} order by created_at desc limit 20`).rows),
      safe(async()=> (await sql`select id,content,created_at from pg_news_comments where user_id=${uid} order by created_at desc limit 20`).rows),
      safe(async()=> (await sql`select reason,label,ref_key,created_at from pg_point_ledger where user_id=${uid} and amount<0 and reason in ('saju_basic','saju_daily','saju_compat','tarot') order by created_at desc limit 30`).rows)
    ]);

    const out=[];
    posts.forEach(x=>out.push(item("pettalk:post",`Pet톡 글 작성 · ${x.title}`,"작성한 글을 눌러 수정·삭제·신고 관련 화면을 확인할 수 있어요.",x.created_at,x.id,{view:"community",postId:x.id})));
    comments.forEach(x=>out.push(item("pettalk:comment",`Pet톡 댓글 · ${x.title}`,x.content,x.created_at,x.id,{view:"community",postId:x.post_id})));
    likes.forEach(x=>out.push(item("pettalk:like",`Pet톡 좋아요 · ${x.title}`,"좋아요한 게시글로 이동해요.",x.created_at,x.id,{view:"community",postId:x.id})));
    musicLikes.forEach(x=>out.push(item("music:like",`Pet음악 좋아요 · ${x.title}`,"좋아요한 Pet음악을 확인해요.",x.created_at,x.id,{view:"music"})));
    newsLikes.forEach(x=>out.push(item("news:like","Pet뉴스 좋아요","좋아요한 뉴스 목록을 확인해요.",x.created_at,x.article_key,{view:"news"})));
    newsComments.forEach(x=>out.push(item("news:comment","Pet뉴스 댓글",x.content,x.created_at,x.id,{view:"news"})));
    pointUses.forEach(x=>{
      const tarot=x.reason==="tarot";
      const label=x.label||(tarot?"Pet타로 확인":"Pet사주 확인");
      out.push(item(tarot?"tarot:use":"saju:use",label,"실제로 확인한 콘텐츠 기록이에요.",x.created_at,x.ref_key||"",{view:tarot?"tarot":"saju"}));
    });
    out.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    return res.status(200).json({items:out.slice(0,60)});
  }catch(error){
    console.error("activity api error",error);
    return res.status(500).json({error:"활동내역을 불러오지 못했어요."});
  }
}
