import { sql } from "@vercel/postgres";
import { list } from "@vercel/blob";
import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole, roleCan } from "../server_lib/admin.js";
import { ensureSchema } from "../server_lib/db.js";
import { ensurePetLifeAutomationSchema } from "../server_lib/petlifeAutomation.js";
import { getBackupStatus } from "../server_lib/backup.js";

const DEEP_CACHE_MS=10*60*1000;
const MAX_BLOBS=5000;
let deepCache={at:0,value:null};

const isBlob=(v)=>/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//i.test(String(v||""));
async function safe(load){
  try{return (await load()).rows||[];}catch(error){
    if(error?.code==="42P01"||error?.code==="42703")return [];
    throw error;
  }
}
async function allBlobs(max=MAX_BLOBS){
  if(!process.env.BLOB_READ_WRITE_TOKEN)return {configured:false,blobs:[],truncated:false};
  let cursor;const blobs=[];
  do{
    const page=await list({limit:1000,cursor});
    blobs.push(...(page.blobs||[]));
    if(blobs.length>=max){
      return {configured:true,blobs:blobs.slice(0,max),truncated:blobs.length>max||Boolean(page.hasMore)};
    }
    cursor=page.hasMore?page.cursor:undefined;
  }while(cursor);
  return {configured:true,blobs,truncated:false};
}

async function backupStatus(){
  return getBackupStatus().catch(error=>({
    configured:Boolean(process.env.BACKUP_ENCRYPTION_KEY),
    error:String(error?.message||error).slice(0,200)
  }));
}

async function runDeepScan(){
  const startedAt=Date.now();
  const [petPhotos,entryPhotos,postImages,musicAssets,blobState,backup]=await Promise.all([
    safe(()=>sql`select photo_url url from pg_pets where photo_url is not null`),
    safe(()=>sql`select photo_url url from pg_pet_life_entries where photo_url is not null`),
    safe(()=>sql`select storage_url url from pg_post_images where storage_url is not null`),
    safe(()=>sql`select cover_url url from pg_music_tracks where cover_url is not null union select audio_url url from pg_music_tracks where audio_url is not null`),
    allBlobs(),
    backupStatus()
  ]);
  const referenced=[...petPhotos,...entryPhotos,...postImages,...musicAssets].map(x=>x.url).filter(isBlob);
  const refSet=new Set(referenced);
  const blobUrls=new Set(blobState.blobs.map(b=>b.url));
  const missingReferences=blobState.configured?[...refSet].filter(url=>!blobUrls.has(url)):[];
  const orphanCandidates=blobState.configured?blobState.blobs.filter(b=>!String(b.pathname||"").startsWith("backups/")&&!refSet.has(b.url)):[];
  return {
    ok:true,
    mode:"deep",
    checkedAt:new Date().toISOString(),
    durationMs:Date.now()-startedAt,
    backup:{...backup,verificationAvailable:Boolean(backup?.configured)},
    storage:{
      checked:true,
      configured:blobState.configured,
      scannedBlobs:blobState.blobs.length,
      scanTruncated:blobState.truncated,
      referencedBlobUrls:refSet.size,
      missingReferenceCount:missingReferences.length,
      missingReferenceSample:missingReferences.slice(0,20),
      orphanCandidateCount:orphanCandidates.length,
      orphanCandidateSample:orphanCandidates.slice(0,20).map(b=>({pathname:b.pathname,url:b.url,size:b.size,uploadedAt:b.uploadedAt}))
    },
    note:"고아 후보는 자동 삭제하지 않습니다. 관리자 확인 후에만 정리하세요."
  };
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","private, no-store, max-age=0");
  if(req.method!=="GET")return res.status(405).json({error:"지원하지 않는 요청이에요."});
  const uid=getSessionUserId(req);
  if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
  const role=await getAdminRole(uid);
  if(!role||!roleCan(role,"service"))return res.status(403).json({error:"서비스 운영 권한이 필요해요."});
  try{
    await ensureSchema();
    await ensurePetLifeAutomationSchema();
    const deep=String(req.query?.deep||"")==="1";
    const force=String(req.query?.force||"")==="1";
    if(!deep){
      const backup=await backupStatus();
      const cached=deepCache.value&&Date.now()-deepCache.at<DEEP_CACHE_MS?deepCache.value:null;
      return res.status(200).json({
        ok:true,
        mode:"summary",
        checkedAt:new Date().toISOString(),
        backup:{...backup,verificationAvailable:Boolean(backup?.configured)},
        storage:cached?{...cached.storage,cached:true,checkedAt:cached.checkedAt,durationMs:cached.durationMs}:{
          checked:false,
          configured:Boolean(process.env.BLOB_READ_WRITE_TOKEN),
          cached:false,
          scanTruncated:false,
          missingReferenceCount:null,
          orphanCandidateCount:null
        },
        note:cached?"최근 정밀 검사 결과를 표시합니다.":"스토리지 정합성 검사는 필요할 때만 실행합니다."
      });
    }
    if(!force&&deepCache.value&&Date.now()-deepCache.at<DEEP_CACHE_MS){
      return res.status(200).json({...deepCache.value,cached:true});
    }
    const result=await runDeepScan();
    deepCache={at:Date.now(),value:result};
    return res.status(200).json({...result,cached:false});
  }catch(error){
    console.error("admin data health",error);
    return res.status(500).json({error:error?.message||"데이터 정합성을 확인하지 못했어요."});
  }
}
