import crypto from "crypto";
import zlib from "zlib";
import { sql } from "@vercel/postgres";
import { put, list, del } from "@vercel/blob";

const RETENTION_DAYS=Math.max(7,Math.min(90,Number(process.env.BACKUP_RETENTION_DAYS)||30));
const PREFIX="backups/petgrow-central/";

function configured(){return Boolean(process.env.BACKUP_ENCRYPTION_KEY&&process.env.BLOB_READ_WRITE_TOKEN);}
async function safe(load){
  try{return (await load()).rows||[];}catch(error){
    if(error?.code==="42P01"||error?.code==="42703")return [];
    throw error;
  }
}
function key(){return crypto.createHash("sha256").update(String(process.env.BACKUP_ENCRYPTION_KEY||"")).digest();}
function encrypt(buffer){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
  const data=Buffer.concat([cipher.update(buffer),cipher.final()]);
  const tag=cipher.getAuthTag();
  return Buffer.from(JSON.stringify({v:1,alg:"AES-256-GCM+GZIP",iv:iv.toString("base64"),tag:tag.toString("base64"),data:data.toString("base64")}));
}

export async function createEncryptedBackup(){
  if(!configured())return {configured:false,skipped:true,reason:"BACKUP_NOT_CONFIGURED"};
  const [users,state,pets,entries,reports,notifications,devices,posts,postImages,comments,likes,userReports,musicLikes,musicComments,musicReports,placeReviews,inquiries]=await Promise.all([
    safe(()=>sql`select id,kakao_id,nickname,profile_image,created_at,last_login_at from pg_users order by created_at`),
    safe(()=>sql`select user_id,key,value,updated_at from pg_user_state order by user_id,key`),
    safe(()=>sql`select * from pg_pets order by user_id,created_at`),
    safe(()=>sql`select * from pg_pet_life_entries order by user_id,occurred_on,created_at`),
    safe(()=>sql`select * from pg_petlife_monthly_reports order by user_id,report_month`),
    safe(()=>sql`select * from pg_petlife_notifications order by user_id,created_at`),
    safe(()=>sql`select id,user_id,platform,device_name,active,created_at,updated_at,last_seen_at from pg_push_devices order by user_id,last_seen_at`),
    safe(()=>sql`select * from pg_posts order by created_at`),
    safe(()=>sql`select * from pg_post_images order by created_at`),
    safe(()=>sql`select * from pg_comments order by created_at`),
    safe(()=>sql`select * from pg_likes order by created_at`),
    safe(()=>sql`select * from pg_reports order by created_at`),
    safe(()=>sql`select * from pg_music_likes order by created_at`),
    safe(()=>sql`select * from pg_music_comments order by created_at`),
    safe(()=>sql`select * from pg_music_comment_reports order by created_at`),
    safe(()=>sql`select * from pg_place_reviews order by created_at`),
    safe(()=>sql`select * from pg_inquiries order by created_at`)
  ]);
  const createdAt=new Date().toISOString();
  const payload={service:"PetGrow",backupVersion:1,createdAt,tables:{users,state,pets,entries,reports,notifications,devices,posts,postImages,comments,likes,userReports,musicLikes,musicComments,musicReports,placeReviews,inquiries}};
  const plain=Buffer.from(JSON.stringify(payload));
  const compressed=zlib.gzipSync(plain,{level:9});
  const encrypted=encrypt(compressed);
  const pathname=`${PREFIX}${createdAt.slice(0,10)}/petgrow-${createdAt.replace(/[:.]/g,"-")}.json.enc`;
  const blob=await put(pathname,encrypted,{access:"public",addRandomSuffix:true,contentType:"application/octet-stream"});
  return {configured:true,created:true,url:blob.url,pathname:blob.pathname,plainBytes:plain.length,encryptedBytes:encrypted.length,createdAt};
}

export async function pruneEncryptedBackups(){
  if(!configured())return {configured:false,skipped:true};
  const cutoff=Date.now()-RETENTION_DAYS*86400000;
  let cursor;let removed=0;let scanned=0;
  do{
    const page=await list({prefix:PREFIX,limit:100,cursor});
    scanned+=page.blobs?.length||0;
    const stale=(page.blobs||[]).filter(b=>new Date(b.uploadedAt||0).getTime()<cutoff).map(b=>b.url);
    if(stale.length){await del(stale);removed+=stale.length;}
    cursor=page.hasMore?page.cursor:undefined;
  }while(cursor);
  return {configured:true,scanned,removed,retentionDays:RETENTION_DAYS};
}

export async function getBackupStatus(){
  if(!configured())return {configured:false,retentionDays:RETENTION_DAYS};
  const page=await list({prefix:PREFIX,limit:5});
  const blobs=(page.blobs||[]).sort((a,b)=>new Date(b.uploadedAt||0)-new Date(a.uploadedAt||0));
  return {configured:true,retentionDays:RETENTION_DAYS,countSample:blobs.length,lastBackup:blobs[0]?{pathname:blobs[0].pathname,uploadedAt:blobs[0].uploadedAt,size:blobs[0].size}:null};
}
