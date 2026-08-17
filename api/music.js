import crypto from "crypto";
import { put } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import { sql } from "@vercel/postgres";
import { ensureSchema } from "../server_lib/db.js";
import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole, verifyToken, roleCan, logAdmin } from "../server_lib/admin.js";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_COVER_BYTES = 4 * 1024 * 1024;
const AUDIO_MIME = new Set(["audio/mpeg","audio/mp3","audio/wav","audio/x-wav","audio/mp4","audio/aac"]);
const IMAGE_MIME = new Set(["image/jpeg","image/png","image/webp"]);
const MUSIC_COMMENT_BLOCKED_RE = /씨발|시발|ㅅㅂ|병신|븅신|개새끼|개새|좆|존나|지랄|꺼져|닥쳐|섹스|sex|야동|porn|포르노|자위|보지|자지|음란|나치|nazi|혐오/i;
function validateMusicComment(text){const raw=String(text||"").trim(),compact=raw.replace(/[\s._\-~!@#$%^&*()+=|\\/]/g,"");if(!raw||raw.length>300)return "댓글은 1~300자로 입력해 주세요.";if(MUSIC_COMMENT_BLOCKED_RE.test(compact))return "사용할 수 없는 표현이 포함되어 있어요.";if(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(raw)||/(?:01[016789])[-\s]?\d{3,4}[-\s]?\d{4}/.test(raw))return "전화번호나 이메일 같은 개인정보는 댓글에 작성하지 말아 주세요.";return "";}

function parseDataUrl(dataUrl, allowed, maxBytes) {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!m || !allowed.has(m[1])) throw new Error("지원하지 않는 파일 형식이에요.");
  const buffer = Buffer.from(m[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new Error(`파일은 ${(maxBytes/1024/1024).toFixed(0)}MB 이하로 올려주세요.`);
  return { mime:m[1], buffer };
}
async function requireAdmin(req,res){
  const uid=getSessionUserId(req);
  if(!uid){res.status(401).json({error:"로그인이 필요해요."});return null;}
  const role=await getAdminRole(uid);
  if(!role){res.status(403).json({error:"관리자 계정이 아니에요."});return null;}
  const token=req.headers["x-petgrow-admin-token"];
  if(!verifyToken(token,uid)){
    res.status(403).json({error:"관리자 인증 시간이 만료됐어요. 관리자센터에서 PIN을 다시 입력해 주세요.",code:"ADMIN_TOKEN_EXPIRED"});
    return null;
  }
  if(!roleCan(role,"music")){
    res.status(403).json({error:"Pet음악 관리 권한이 없어요."});return null;
  }
  return {uid,role};
}
function speciesWhere(species){
  if(species==="dog") return sql`and species in ('dog','all')`;
  if(species==="cat") return sql`and species in ('cat','all')`;
  return sql``;
}

async function ensureStarterTracks(){
  const seedKey="petmusic-starter-thirtytwo-v4";
  await sql`delete from pg_music_tracks where id='demo-pink-day' or audio_url='/petmusic/pink-day.mp3'`;
  await sql`delete from pg_app_meta where key in ('petmusic-demo-pink-day-v2','petmusic-demo-pink-day-v1')`;
  const {rows:meta}=await sql`select value from pg_app_meta where key=${seedKey} limit 1`;
  const {rows:existing}=await sql`select count(*)::int n from pg_music_tracks where active=true`;
  if(meta[0] && Number(existing?.[0]?.n||0)>=16) return;
  const tracks = [
    {id:'starter-cat-soft-steps',title:'사뿐사뿐 낮잠길',description:'편안한 분위기의 사람 보컬이 함께 들어간 고양이 휴식 시간용 음악이에요.',species:'cat',vocalType:'vocal',mood:'relax',cover:'/petmusic/covers/cover-01.webp',audio:'/petmusic/cat-soft-steps.mp3'},
    {id:'starter-cat-moonlight-steps',title:'달빛 아래 고양이 발걸음',description:'조용한 저녁과 수면 전 시간에 어울리는 부드러운 고양이용 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-02.webp',audio:'/petmusic/cat-moonlight-steps.mp3'},
    {id:'starter-dog-happy-walk',title:'꼬리콩콩 산책길',description:'산책 전후나 기분 좋은 놀이 시간에 함께 듣기 좋은 밝은 강아지용 음악이에요.',species:'dog',vocalType:'instrumental',mood:'play',cover:'/petmusic/covers/cover-03.webp',audio:'/petmusic/dog-happy-walk.mp3'},
    {id:'starter-dog-sunshine-steps',title:'햇살 따라 총총',description:'편안한 낮 시간에 강아지와 함께 반복재생하기 좋은 포근한 음악이에요.',species:'dog',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-04.webp',audio:'/petmusic/dog-sunshine-steps.mp3'},
    {id:'starter-cat-clink-evening',title:'달그락, 저녁 준비',description:'사료 그릇 소리에 귀를 쫑긋 세우는 고양이의 저녁 전 설렘을 담은 잔잔한 인스트루멘탈이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-05.webp',audio:'/petmusic/cat-clink-evening.mp3'},
    {id:'starter-cat-clink-dinner',title:'사각사각 고양이 식탁',description:'익숙한 밥시간의 분위기를 부드럽게 그린 편안한 고양이 인스트루멘탈이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-06.webp',audio:'/petmusic/cat-clink-dinner.mp3'},
    {id:'starter-cat-bowl-wait',title:'그릇 앞의 기다림',description:'그릇 앞에서 조용히 기다리는 고양이의 차분한 순간을 담은 음악이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-07.webp',audio:'/petmusic/cat-bowl-wait.mp3'},
    {id:'starter-cat-small-paws-evening',title:'작은 발끝, 저녁 시간',description:'사뿐한 발걸음과 함께 찾아오는 익숙한 저녁의 감성을 담은 고양이 인스트루멘탈이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-08.webp',audio:'/petmusic/cat-small-paws-evening.mp3'},
    {id:'starter-dog-bowl-tail',title:'사료그릇 앞 꼬리춤',description:'밥시간이 다가오면 꼬리를 흔드는 강아지의 들뜬 마음을 표현한 밝은 인스트루멘탈이에요.',species:'dog',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-09.webp',audio:'/petmusic/dog-bowl-tail.mp3'},
    {id:'starter-dog-mealtime-heart',title:'밥시간 두근두근',description:'사료그릇 앞에서 반짝이는 눈빛과 기대감을 담은 경쾌한 강아지 인스트루멘탈이에요.',species:'dog',vocalType:'instrumental',mood:'play',cover:'/petmusic/covers/cover-10.webp',audio:'/petmusic/dog-mealtime-heart.mp3'},
    {id:'starter-dog-soft-breath',title:'포근한 숨소리',description:'깊이 잠든 강아지의 평온한 숨결을 닮은 부드러운 휴식 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-11.webp',audio:'/petmusic/dog-soft-breath.mp3'},
    {id:'starter-dog-dreaming',title:'꿈꾸는 강아지',description:'햇살 아래 편안히 잠든 강아지의 따뜻한 분위기를 담은 잔잔한 인스트루멘탈이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-12.webp',audio:'/petmusic/dog-dreaming.mp3'},
    {id:'starter-cat-green-walk',title:'초록길 고양이 산책',description:'창밖의 바람과 풀내음을 따라 천천히 걷는 고양이의 호기심을 담은 산뜻한 인스트루멘탈이에요.',species:'cat',vocalType:'instrumental',mood:'nature',cover:'/petmusic/covers/cover-13.webp',audio:'/petmusic/cat-green-walk.mp3'},
    {id:'starter-cat-breeze-harness',title:'살랑살랑 하네스 데이',description:'하네스를 하고 조심스럽게 바깥을 탐색하는 고양이의 가벼운 발걸음을 표현한 편안한 인스트루멘탈이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-14.webp',audio:'/petmusic/cat-breeze-harness.mp3'},
    {id:'starter-dog-leash-ready',title:'목줄 챙기면 산책 시간',description:'목줄 소리만 들어도 설레는 강아지의 산책 전 기분을 밝고 경쾌하게 담은 인스트루멘탈이에요.',species:'dog',vocalType:'instrumental',mood:'play',cover:'/petmusic/covers/cover-15.webp',audio:'/petmusic/dog-leash-ready.mp3'},
    {id:'starter-dog-door-walk',title:'문 앞에서 꼬리 준비',description:'산책을 기다리며 문 앞에서 꼬리를 흔드는 순간을 담은 포근하고 활기찬 강아지 인스트루멘탈이에요.',species:'dog',vocalType:'instrumental',mood:'play',cover:'/petmusic/covers/cover-16.webp',audio:'/petmusic/dog-door-walk.mp3'}
    ,{id:'new-dog-sleep-02',title:'포근한 낮잠',description:'잔잔한 휴식 시간에 어울리는 강아지 수면 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-01.webp',audio:'/petmusic/new-dog-sleep-02.mp3'}
    ,{id:'new-dog-sleep-03',title:'꿈속 꼬리 흔들기',description:'편안한 밤과 낮잠 시간에 함께 듣기 좋은 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-02.webp',audio:'/petmusic/new-dog-sleep-03.mp3'}
    ,{id:'new-dog-sleep-04',title:'조용한 밤의 숨결',description:'차분하게 쉬고 싶은 시간에 어울리는 부드러운 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-03.webp',audio:'/petmusic/new-dog-sleep-04.mp3'}
    ,{id:'new-dog-sleep-05',title:'별빛 아래 깊은 잠',description:'수면 전 편안한 분위기를 만들어주는 강아지 휴식 음악이에요.',species:'dog',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-04.webp',audio:'/petmusic/new-dog-sleep-05.mp3'}
    ,{id:'new-cat-window-00',title:'창가의 고양이',description:'창가에서 조용히 쉬는 고양이의 분위기를 담은 잔잔한 음악이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-05.webp',audio:'/petmusic/new-cat-window-00.mp3'}
    ,{id:'new-cat-window-01',title:'햇살 드는 창가',description:'따뜻한 햇살 아래 쉬는 고양이에게 어울리는 편안한 음악이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-06.webp',audio:'/petmusic/new-cat-window-01.mp3'}
    ,{id:'new-cat-window-02',title:'창가의 오후',description:'느긋한 오후의 고양이 휴식 시간에 어울리는 음악이에요.',species:'cat',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-07.webp',audio:'/petmusic/new-cat-window-02.mp3'}
    ,{id:'new-cat-window-03',title:'창문 너머 바람',description:'창밖을 바라보는 고양이의 차분한 시간을 담은 음악이에요.',species:'cat',vocalType:'instrumental',mood:'nature',cover:'/petmusic/covers/cover-08.webp',audio:'/petmusic/new-cat-window-03.mp3'}
    ,{id:'new-cat-window-04',title:'고요한 창가',description:'조용한 실내에서 편안하게 듣기 좋은 고양이 휴식 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-09.webp',audio:'/petmusic/new-cat-window-04.mp3'}
    ,{id:'new-cat-window-05',title:'달빛 창가',description:'늦은 밤 고양이의 차분한 휴식에 어울리는 잔잔한 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-10.webp',audio:'/petmusic/new-cat-window-05.mp3'}
    ,{id:'new-dog-fluffy-00',title:'몽글몽글 강아지',description:'포근하고 말랑한 분위기의 강아지 휴식 음악이에요.',species:'dog',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-11.webp',audio:'/petmusic/new-dog-fluffy-00.mp3'}
    ,{id:'new-dog-fluffy-01',title:'포근포근 강아지 구름',description:'느긋한 휴식과 낮잠에 잘 어울리는 부드러운 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'relax',cover:'/petmusic/covers/cover-12.webp',audio:'/petmusic/new-dog-fluffy-01.mp3'}
    ,{id:'new-cat-breath-00',title:'고양이 숨결',description:'고양이의 조용한 숨결을 닮은 차분한 휴식 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-13.webp',audio:'/petmusic/new-cat-breath-00.mp3'}
    ,{id:'new-cat-breath-01',title:'새벽의 고양이 숨결',description:'새벽처럼 고요한 분위기의 고양이 수면 음악이에요.',species:'cat',vocalType:'instrumental',mood:'sleep',cover:'/petmusic/covers/cover-14.webp',audio:'/petmusic/new-cat-breath-01.mp3'}
    ,{id:'new-dog-alley-walk-00',title:'골목 끝 산책',description:'가볍게 걷는 산책 시간의 설렘을 담은 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'play',cover:'/petmusic/covers/cover-15.webp',audio:'/petmusic/new-dog-alley-walk-00.mp3'}
    ,{id:'new-dog-alley-walk-01',title:'노을빛 골목 산책',description:'산책을 마무리하는 포근한 저녁 분위기의 강아지 음악이에요.',species:'dog',vocalType:'instrumental',mood:'nature',cover:'/petmusic/covers/cover-16.webp',audio:'/petmusic/new-dog-alley-walk-01.mp3'}

  ];
  for (const track of tracks) {
    await sql`insert into pg_music_tracks(id,title,description,species,vocal_type,mood,cover_url,audio_url,active,created_by)
      values(${track.id},${track.title},${track.description},${track.species},${track.vocalType},${track.mood},${track.cover},${track.audio},true,null)
      on conflict(id) do nothing`;
  }
  await sql`insert into pg_app_meta(key,value) values(${seedKey},'done') on conflict(key) do update set value='done',updated_at=now()`;
}


export default async function handler(req,res){
  await ensureSchema();
  const action=String(req.query.action||"list");
  try{
    if(action==="list" && req.method==="GET"){
      await ensureStarterTracks();
      const species=["dog","cat","all"].includes(String(req.query.species))?String(req.query.species):"all";
      const page=Math.max(1,parseInt(req.query.page||"1",10)||1), pageSize=10, offset=(page-1)*pageSize;
      const uid=getSessionUserId(req);
      let rows,countRows,topRows;
      if(species==="dog"){
        const [listResult,countResult,topResult]=await Promise.all([sql`select t.*,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true and species in ('dog','all') order by created_at desc limit ${pageSize} offset ${offset}`,sql`select count(*)::int n from pg_music_tracks where active=true and species in ('dog','all')`,sql`select * from pg_music_tracks where active=true and species in ('dog','all') order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`]);rows=listResult.rows;countRows=countResult.rows;topRows=topResult.rows;
      } else if(species==="cat"){
        const [listResult,countResult,topResult]=await Promise.all([sql`select t.*,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true and species in ('cat','all') order by created_at desc limit ${pageSize} offset ${offset}`,sql`select count(*)::int n from pg_music_tracks where active=true and species in ('cat','all')`,sql`select * from pg_music_tracks where active=true and species in ('cat','all') order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`]);rows=listResult.rows;countRows=countResult.rows;topRows=topResult.rows;
      } else {
        const [listResult,countResult,topResult]=await Promise.all([sql`select t.*,exists(select 1 from pg_music_likes l where l.track_id=t.id and l.user_id=${uid||""}) liked from pg_music_tracks t where active=true order by created_at desc limit ${pageSize} offset ${offset}`,sql`select count(*)::int n from pg_music_tracks where active=true`,sql`select * from pg_music_tracks where active=true order by (like_count*4+comment_count*3+play_count)::numeric desc,created_at desc limit 5`]);rows=listResult.rows;countRows=countResult.rows;topRows=topResult.rows;
      }
      const total=countRows?.[0]?.n||0;
      res.setHeader("Cache-Control",uid?"private, max-age=15":"public, s-maxage=60, stale-while-revalidate=300");
      return res.status(200).json({items:rows,top5:topRows,total,page,pages:Math.max(1,Math.ceil(total/pageSize))});
    }
    if(action==="liked" && req.method==="GET"){
      const uid=getSessionUserId(req); if(!uid)return res.status(200).json({items:[]});
      const {rows}=await sql`select t.*,true liked from pg_music_likes l join pg_music_tracks t on t.id=l.track_id where l.user_id=${uid} and t.active=true order by l.created_at desc limit 100`;
      return res.status(200).json({items:rows});
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
      const uid=getSessionUserId(req);
      const {rows}=await sql`select c.id,c.content,c.created_at,c.updated_at,u.nickname,(c.user_id=${uid||""}) is_owner from pg_music_comments c join pg_users u on u.id=c.user_id where c.track_id=${id} and c.status='visible' order by c.created_at desc limit 100`;
      return res.status(200).json({items:rows});
    }
    if(action==="comment" && req.method==="POST"){
      const uid=getSessionUserId(req); if(!uid)return res.status(401).json({error:"댓글은 로그인 후 이용할 수 있어요."});
      const trackId=String(req.body?.id||""), content=String(req.body?.content||"").trim();
      if(!trackId)return res.status(400).json({error:"곡 정보가 없어요."});
      const bad=validateMusicComment(content);if(bad)return res.status(400).json({error:bad});
      const id=crypto.randomUUID(); await sql`insert into pg_music_comments(id,track_id,user_id,content) values(${id},${trackId},${uid},${content})`;
      await sql`update pg_music_tracks set comment_count=comment_count+1 where id=${trackId}`;
      return res.status(201).json({ok:true,id});
    }
    if(action==="comment-update" && req.method==="POST"){
      const uid=getSessionUserId(req); if(!uid)return res.status(401).json({error:"로그인 후 이용할 수 있어요."});
      const commentId=String(req.body?.commentId||""),content=String(req.body?.content||"").trim();
      const bad=validateMusicComment(content);if(bad)return res.status(400).json({error:bad});
      const {rowCount}=await sql`update pg_music_comments set content=${content},updated_at=now() where id=${commentId} and user_id=${uid} and status='visible'`;
      if(!rowCount)return res.status(403).json({error:"본인이 작성한 댓글만 수정할 수 있어요."});
      return res.status(200).json({ok:true});
    }
    if(action==="comment-delete" && req.method==="POST"){
      const uid=getSessionUserId(req); if(!uid)return res.status(401).json({error:"로그인 후 이용할 수 있어요."});
      const commentId=String(req.body?.commentId||"");
      const {rows}=await sql`select track_id from pg_music_comments where id=${commentId} and user_id=${uid}`;
      if(!rows[0])return res.status(403).json({error:"본인이 작성한 댓글만 삭제할 수 있어요."});
      await sql`delete from pg_music_comments where id=${commentId} and user_id=${uid}`;
      await sql`update pg_music_tracks set comment_count=greatest(0,comment_count-1) where id=${rows[0].track_id}`;
      return res.status(200).json({ok:true});
    }
    if(action==="comment-report" && req.method==="POST"){
      const uid=getSessionUserId(req); if(!uid)return res.status(401).json({error:"신고는 로그인 후 이용할 수 있어요."});
      const commentId=String(req.body?.commentId||""),reason=String(req.body?.reason||"other").slice(0,40),detail=String(req.body?.detail||"").trim().slice(0,300);
      if(!commentId)return res.status(400).json({error:"댓글 정보가 없어요."});
      const id=crypto.randomUUID();
      try{await sql`insert into pg_music_comment_reports(id,comment_id,reporter_user_id,reason,detail) values(${id},${commentId},${uid},${reason},${detail||null})`;}catch(e){if(String(e?.message||"").toLowerCase().includes("duplicate"))return res.status(200).json({ok:true,already:true});throw e;}
      return res.status(201).json({ok:true});
    }
    if(action==="upload" && req.method==="POST"){
      const body=req.body||{};
      try{
        const json=await handleUpload({
          body,request:req,
          onBeforeGenerateToken:async(pathname,clientPayload)=>{
            const uid=getSessionUserId(req);if(!uid)throw new Error("로그인이 필요해요.");
            const role=await getAdminRole(uid);let payload={};try{payload=JSON.parse(clientPayload||"{}")}catch{}
            if(!role)throw new Error("관리자 계정이 아니에요.");
            if(!verifyToken(payload.adminToken,uid))throw new Error("관리자 인증 시간이 만료됐어요. 관리자센터에서 PIN을 다시 입력해 주세요.");
            if(!roleCan(role,"music"))throw new Error("Pet음악 관리 권한이 없어요.");
            const isCover=String(pathname||"").includes("/covers/")||payload.kind==="cover";
            return {allowedContentTypes:isCover?["image/jpeg","image/png","image/webp"]:["audio/mpeg","audio/mp3","audio/wav","audio/x-wav","audio/mp4","audio/aac"],maximumSizeInBytes:isCover?MAX_COVER_BYTES:MAX_AUDIO_BYTES,addRandomSuffix:true,tokenPayload:JSON.stringify({uid,kind:isCover?"cover":"audio"})};
          },
          onUploadCompleted:async()=>{}
        });
        return res.status(200).json(json);
      }catch(e){return res.status(400).json({error:e?.message||"파일 업로드를 시작하지 못했어요."});}
    }
    if(action==="admin-list" && req.method==="GET"){
      if(!(await requireAdmin(req,res)))return;
      await ensureStarterTracks();
      const {rows}=await sql`select * from pg_music_tracks order by created_at desc`;
      return res.status(200).json({items:rows});
    }
    if(action==="admin-save" && req.method==="POST"){
      const admin=await requireAdmin(req,res); if(!admin)return;
      const body=req.body||{}, title=String(body.title||"").trim(), species=["dog","cat","all"].includes(body.species)?body.species:"all";
      const vocalType=["instrumental","vocal"].includes(body.vocalType)?body.vocalType:"instrumental";
      const mood=["relax","sleep","play","nature"].includes(body.mood)?body.mood:"relax";
      if(!title)return res.status(400).json({error:"노래 제목을 입력해 주세요."});
      let audioUrl=String(body.audioUrl||""), coverUrl=String(body.coverUrl||"");
      const id=String(body.id||crypto.randomUUID());
      if(body.audioDataUrl){const f=parseDataUrl(body.audioDataUrl,AUDIO_MIME,MAX_AUDIO_BYTES);const ext=f.mime.includes("wav")?"wav":f.mime.includes("mp4")?"m4a":"mp3";const b=await put(`petmusic/${id}-${Date.now()}.${ext}`,f.buffer,{access:"public",contentType:f.mime,token:process.env.BLOB_READ_WRITE_TOKEN});audioUrl=b.url;}
      if(body.coverDataUrl){const f=parseDataUrl(body.coverDataUrl,IMAGE_MIME,MAX_COVER_BYTES);if(process.env.BLOB_READ_WRITE_TOKEN){const ext=f.mime.includes("png")?"png":f.mime.includes("webp")?"webp":"jpg";const b=await put(`petmusic/covers/${id}-${Date.now()}.${ext}`,f.buffer,{access:"public",contentType:f.mime,token:process.env.BLOB_READ_WRITE_TOKEN});coverUrl=b.url;}else{coverUrl=String(body.coverDataUrl);}}
      if(!audioUrl)return res.status(400).json({error:"음원 파일을 선택해 주세요."});
      await sql`insert into pg_music_tracks(id,title,description,species,vocal_type,mood,cover_url,audio_url,active,created_by) values(${id},${title},${String(body.description||"").trim()||null},${species},${vocalType},${mood},${coverUrl||null},${audioUrl},${body.active!==false},${admin.uid}) on conflict(id) do update set title=excluded.title,description=excluded.description,species=excluded.species,vocal_type=excluded.vocal_type,mood=excluded.mood,cover_url=excluded.cover_url,audio_url=excluded.audio_url,active=excluded.active,updated_at=now()`;
      await logAdmin(admin.uid,body.id?"MUSIC_UPDATE":"MUSIC_CREATE",null,null,{trackId:id,title,species,vocalType,mood});
      return res.status(200).json({ok:true,id,audioUrl,coverUrl});
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
