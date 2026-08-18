import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import originalHandler from "./community.js";

function shapePost(row,viewerId,images=[],liked=false){
  return {
    id:row.id,
    authorNickname:row.author_nickname||"PetGrow 회원",
    isOwner:viewerId?row.user_id===viewerId:false,
    pet:{id:row.pet_id,name:row.pet_name,species:row.pet_species,breed:row.pet_breed,birthDate:row.pet_birth_date,photo:row.pet_photo},
    category:row.category,title:row.title,content:row.content,images,
    likeCount:Number(row.like_count)||0,commentCount:Number(row.comment_count)||0,
    likedByMe:!!liked,isPublic:row.is_public!==false,createdAt:row.created_at,updatedAt:row.updated_at
  };
}

async function safePosts(req,res){
  const viewerId=getSessionUserId(req);
  const rawCategory=String(req.query.category||"all");
  const category=(rawCategory==="전체"||rawCategory==="all")?"all":rawCategory;
  const sort=String(req.query.sort||"latest"),search=String(req.query.search||"").trim();
  const size=Math.min(30,Math.max(1,parseInt(req.query.limit||req.query.pageSize||"20",10)||20));
  const requestedOffset=Math.max(0,parseInt(req.query.offset||"0",10)||0);
  const requestedPage=Math.max(1,parseInt(req.query.page||"1",10)||1);
  const offset=req.query.offset!=null?requestedOffset:(requestedPage-1)*size;
  const page=Math.floor(offset/size)+1;
  const cat=category!=="all"?category:null,term=search?`%${search}%`:null;
  let rows=[];
  if(sort==="popular"){
    ({rows}=await sql`select p.*,coalesce(u.nickname,'PetGrow 회원') author_nickname from pg_posts p join pg_users u on u.id=p.user_id where coalesce(p.is_hidden,false)=false and (coalesce(p.is_public,true)=true or p.user_id=${viewerId||""}) and (${cat}::text is null or p.category=${cat}) and (${term}::text is null or p.title ilike ${term} or p.content ilike ${term}) order by p.like_count desc,p.created_at desc limit ${size+1} offset ${offset}`);
  }else{
    ({rows}=await sql`select p.*,coalesce(u.nickname,'PetGrow 회원') author_nickname from pg_posts p join pg_users u on u.id=p.user_id where coalesce(p.is_hidden,false)=false and (coalesce(p.is_public,true)=true or p.user_id=${viewerId||""}) and (${cat}::text is null or p.category=${cat}) and (${term}::text is null or p.title ilike ${term} or p.content ilike ${term}) order by p.created_at desc limit ${size+1} offset ${offset}`);
  }
  const hasMore=rows.length>size,pageRows=rows.slice(0,size),ids=pageRows.map(x=>x.id),images={},liked=new Set();
  if(ids.length){
    const idList=ids.join(",");
    try{
      const {rows:imgRows}=await sql`select post_id,storage_url from pg_post_images where post_id=any(string_to_array(${idList},',')) order by post_id,sort_order asc`;
      imgRows.forEach(x=>{(images[x.post_id]??=[]).push(x.storage_url)});
    }catch(e){console.warn("safe community images skipped",e?.message||e)}
    if(viewerId){
      try{const {rows:likeRows}=await sql`select post_id from pg_likes where user_id=${viewerId} and post_id=any(string_to_array(${idList},','))`;likeRows.forEach(x=>liked.add(x.post_id));}catch(e){console.warn("safe community likes skipped",e?.message||e)}
    }
  }
  return res.status(200).json({
    posts:pageRows.map(x=>shapePost(x,viewerId,images[x.id]||[],liked.has(x.id))),
    hasMore,
    page,
    nextOffset:hasMore?offset+size:null,
    offset,
    pageSize:size
  });
}

export default async function handler(req,res){
  const action=String(req.query.action||"posts");
  if(req.method==="GET"&&action==="posts"){
    try{return await safePosts(req,res)}catch(error){
      console.error("PetTalk safe list error",error?.message||error);
      try{return await originalHandler(req,res)}catch(e){return res.status(500).json({error:"Pet톡 게시글을 불러오지 못했어요.",message:String(e?.message||error?.message||"").slice(0,180)})}
    }
  }
  return originalHandler(req,res);
}
