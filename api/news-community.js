import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { ensureAuthSchema } from "../server_lib/db.js";

const keyFor = (raw = "") => crypto.createHash("sha256").update(String(raw).slice(0, 4000)).digest("hex");

async function ensureNewsCommunity() {
  await ensureAuthSchema();
  await sql`create table if not exists pg_news_likes (
    article_key text not null,
    user_id text not null references pg_users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key(article_key,user_id)
  )`;
  await sql`create table if not exists pg_news_comments (
    id text primary key,
    article_key text not null,
    user_id text not null references pg_users(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now()
  )`;
  await sql`create index if not exists idx_pg_news_comments_article on pg_news_comments(article_key,created_at desc)`;
}

export default async function handler(req,res){
  try{
    await ensureNewsCommunity();
    const rawKey=String(req.query.articleKey||req.body?.articleKey||"").trim();
    if(!rawKey)return res.status(400).json({error:"articleKey is required"});
    const articleKey=keyFor(rawKey);
    const uid=getSessionUserId(req);
    const action=String(req.query.action||"detail");

    if(action==="detail"&&req.method==="GET"){
      const [{rows:likeRows},{rows:comments}]=await Promise.all([
        sql`select count(*)::int as count, bool_or(user_id=${uid||""}) as liked_by_me from pg_news_likes where article_key=${articleKey}`,
        sql`select c.id,c.content,c.created_at,u.nickname as author_nickname,(c.user_id=${uid||""}) as is_owner from pg_news_comments c join pg_users u on u.id=c.user_id where c.article_key=${articleKey} order by c.created_at asc limit 100`
      ]);
      return res.status(200).json({likeCount:Number(likeRows[0]?.count)||0,likedByMe:!!likeRows[0]?.liked_by_me,comments:comments.map(x=>({id:x.id,content:x.content,createdAt:x.created_at,authorNickname:x.author_nickname||"PetGrow 회원",isOwner:!!x.is_owner}))});
    }

    if(action==="like"&&req.method==="POST"){
      if(!uid)return res.status(401).json({error:"로그인 후 좋아요를 남길 수 있어요."});
      const inserted=await sql`insert into pg_news_likes(article_key,user_id) values(${articleKey},${uid}) on conflict do nothing returning article_key`;
      let liked=true;
      if(!inserted.rows.length){await sql`delete from pg_news_likes where article_key=${articleKey} and user_id=${uid}`;liked=false;}
      const {rows}=await sql`select count(*)::int as count from pg_news_likes where article_key=${articleKey}`;
      return res.status(200).json({liked,likeCount:Number(rows[0]?.count)||0});
    }

    if(action==="comment"&&req.method==="POST"){
      if(!uid)return res.status(401).json({error:"로그인 후 댓글을 남길 수 있어요."});
      const content=String(req.body?.content||"").trim();
      if(!content)return res.status(400).json({error:"댓글을 입력해 주세요."});
      if(content.length>500)return res.status(400).json({error:"댓글은 500자 이내로 입력해 주세요."});
      const {rows:recent}=await sql`select 1 from pg_news_comments where article_key=${articleKey} and user_id=${uid} and created_at>now()-interval '10 seconds' limit 1`;
      if(recent[0])return res.status(429).json({error:"댓글은 잠시 간격을 두고 작성해 주세요."});
      const id=crypto.randomUUID();
      await sql`insert into pg_news_comments(id,article_key,user_id,content) values(${id},${articleKey},${uid},${content})`;
      const {rows}=await sql`select c.id,c.content,c.created_at,u.nickname as author_nickname from pg_news_comments c join pg_users u on u.id=c.user_id where c.id=${id}`;
      const x=rows[0];
      return res.status(201).json({comment:{id:x.id,content:x.content,createdAt:x.created_at,authorNickname:x.author_nickname||"PetGrow 회원",isOwner:true}});
    }

    if(action==="comment"&&req.method==="DELETE"){
      if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
      const id=String(req.query.id||"");
      if(!id)return res.status(400).json({error:"id is required"});
      const {rowCount}=await sql`delete from pg_news_comments where id=${id} and article_key=${articleKey} and user_id=${uid}`;
      return rowCount?res.status(200).json({ok:true}):res.status(403).json({error:"삭제할 수 없는 댓글이에요."});
    }

    return res.status(405).json({error:"method not allowed"});
  }catch(error){
    console.error("news community error",error);
    return res.status(500).json({error:"뉴스 반응 정보를 처리하지 못했어요."});
  }
}
