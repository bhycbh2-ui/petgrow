import crypto from "crypto";
import zlib from "zlib";
import { sql } from "@vercel/postgres";
import { put, list, del } from "@vercel/blob";

const RETENTION_DAYS=Math.max(7,Math.min(90,Number(process.env.BACKUP_RETENTION_DAYS)||30));
const PREFIX="backups/petgrow-central/";
const MIN_KEY_LENGTH=32;
const MAX_VERIFY_BYTES=25*1024*1024;
const MAX_PLAIN_BYTES=80*1024*1024;
const MAX_BACKUP_SCAN=1000;

function configState(){
  const rawKey=String(process.env.BACKUP_ENCRYPTION_KEY||"");
  const keyConfigured=Boolean(rawKey);
  const keyStrong=rawKey.length>=MIN_KEY_LENGTH;
  const blobConfigured=Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const configured=keyStrong&&blobConfigured;
  let reason="";
  if(!keyConfigured)reason="BACKUP_KEY_MISSING";
  else if(!keyStrong)reason="BACKUP_KEY_TOO_SHORT";
  else if(!blobConfigured)reason="BLOB_NOT_CONFIGURED";
  return {configured,keyConfigured,keyStrong,blobConfigured,reason,minKeyLength:MIN_KEY_LENGTH};
}
async function safe(load){
  try{return (await load()).rows||[];}catch(error){
    if(error?.code==="42P01"||error?.code==="42703")return [];
    throw error;
  }
}
async function listBackupBlobs(max=MAX_BACKUP_SCAN){
  let cursor;const blobs=[];let truncated=false;
  do{
    const page=await list({prefix:PREFIX,limit:100,cursor});
    blobs.push(...(page.blobs||[]));
    if(blobs.length>=max){truncated=Boolean(page.hasMore);break;}
    cursor=page.hasMore?page.cursor:undefined;
  }while(cursor);
  blobs.sort((a,b)=>new Date(b.uploadedAt||0)-new Date(a.uploadedAt||0));
  return {blobs:blobs.slice(0,max),truncated};
}
function key(){return crypto.createHash("sha256").update(String(process.env.BACKUP_ENCRYPTION_KEY||"")).digest();}
function encrypt(buffer,meta={}){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
  const data=Buffer.concat([cipher.update(buffer),cipher.final()]);
  const tag=cipher.getAuthTag();
  return Buffer.from(JSON.stringify({v:1,alg:"AES-256-GCM+GZIP",iv:iv.toString("base64"),tag:tag.toString("base64"),data:data.toString("base64"),...meta}));
}
function decryptEnvelope(buffer){
  let envelope;
  try{envelope=JSON.parse(Buffer.from(buffer).toString("utf8"));}catch{throw new Error("BACKUP_ENVELOPE_INVALID");}
  if(envelope?.v!==1||envelope?.alg!=="AES-256-GCM+GZIP"||!envelope?.iv||!envelope?.tag||!envelope?.data)throw new Error("BACKUP_ENVELOPE_UNSUPPORTED");
  const iv=Buffer.from(String(envelope.iv),"base64");
  const tag=Buffer.from(String(envelope.tag),"base64");
  const encrypted=Buffer.from(String(envelope.data),"base64");
  if(iv.length!==12||tag.length!==16)throw new Error("BACKUP_ENVELOPE_INVALID");
  const decipher=crypto.createDecipheriv("aes-256-gcm",key(),iv);
  decipher.setAuthTag(tag);
  let compressed;
  try{compressed=Buffer.concat([decipher.update(encrypted),decipher.final()]);}catch{throw new Error("BACKUP_AUTH_FAILED");}
  let plain;
  try{plain=zlib.gunzipSync(compressed);}catch{throw new Error("BACKUP_GZIP_INVALID");}
  if(plain.length>MAX_PLAIN_BYTES)throw new Error("BACKUP_PLAIN_TOO_LARGE");
  return {envelope,plain};
}
function summarizePayload(payload){
  if(payload?.service!=="PetGrow"||Number(payload?.backupVersion)!==1||!payload?.tables||typeof payload.tables!=="object")throw new Error("BACKUP_PAYLOAD_INVALID");
  const tableCounts={};
  for(const [name,value] of Object.entries(payload.tables))tableCounts[name]=Array.isArray(value)?value.length:null;
  return {service:payload.service,backupVersion:Number(payload.backupVersion),createdAt:payload.createdAt||null,tableCounts};
}

export async function createEncryptedBackup(){
  const config=configState();
  if(!config.configured)return {...config,skipped:true};
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
  const plainSha256=crypto.createHash("sha256").update(plain).digest("hex");
  const compressed=zlib.gzipSync(plain,{level:9});
  const encrypted=encrypt(compressed,{plainSha256});
  const pathname=`${PREFIX}${createdAt.slice(0,10)}/petgrow-${createdAt.replace(/[:.]/g,"-")}.json.enc`;
  const blob=await put(pathname,encrypted,{access:"public",addRandomSuffix:true,contentType:"application/octet-stream"});
  return {...config,created:true,url:blob.url,pathname:blob.pathname,size:encrypted.length,plainBytes:plain.length,encryptedBytes:encrypted.length,plainSha256,createdAt};
}

export async function verifyEncryptedBackup(target=null){
  const config=configState();
  if(!config.configured)return {...config,verified:false,skipped:true};
  let blob=target&&target.url?{url:target.url,pathname:target.pathname||null,uploadedAt:target.uploadedAt||target.createdAt||null,size:target.size||target.encryptedBytes||null}:null;
  let scanTruncated=false;
  if(!blob){
    const listed=await listBackupBlobs();
    blob=listed.blobs[0]||null;
    scanTruncated=listed.truncated;
  }
  if(!blob)return {...config,verified:false,reason:"NO_BACKUP",checkedAt:new Date().toISOString()};
  if(Number(blob.size||0)>MAX_VERIFY_BYTES)return {...config,verified:false,reason:"BACKUP_TOO_LARGE_TO_VERIFY",pathname:blob.pathname,size:blob.size,checkedAt:new Date().toISOString()};
  const response=await fetch(blob.url,{cache:"no-store",headers:{Accept:"application/octet-stream"}});
  if(!response.ok)throw new Error(`BACKUP_FETCH_${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>MAX_VERIFY_BYTES)throw new Error("BACKUP_TOO_LARGE_TO_VERIFY");
  const {envelope,plain}=decryptEnvelope(bytes);
  const payload=JSON.parse(plain.toString("utf8"));
  const summary=summarizePayload(payload);
  const actualSha256=crypto.createHash("sha256").update(plain).digest("hex");
  const expectedSha256=envelope.plainSha256?String(envelope.plainSha256):null;
  const shaMatches=expectedSha256?actualSha256===expectedSha256:null;
  if(shaMatches===false)throw new Error("BACKUP_SHA_MISMATCH");
  return {...config,verified:true,checkedAt:new Date().toISOString(),pathname:blob.pathname,uploadedAt:blob.uploadedAt,size:blob.size||bytes.length,integrity:"AES-256-GCM",sha256:actualSha256,shaMatches,scanTruncated,...summary};
}

export async function verifyLatestEncryptedBackup(){return verifyEncryptedBackup(null);}

export async function pruneEncryptedBackups(){
  const config=configState();
  if(!config.configured)return {...config,skipped:true};
  const cutoff=Date.now()-RETENTION_DAYS*86400000;
  let cursor;let removed=0;let scanned=0;
  do{
    const page=await list({prefix:PREFIX,limit:100,cursor});
    scanned+=page.blobs?.length||0;
    const stale=(page.blobs||[]).filter(b=>new Date(b.uploadedAt||0).getTime()<cutoff).map(b=>b.url);
    if(stale.length){await del(stale);removed+=stale.length;}
    cursor=page.hasMore?page.cursor:undefined;
  }while(cursor);
  return {...config,scanned,removed,retentionDays:RETENTION_DAYS};
}

export async function getBackupStatus(){
  const config=configState();
  if(!config.configured)return {...config,retentionDays:RETENTION_DAYS,lastBackup:null,lastBackupAgeHours:null,overdue:false,backupCount:0,scanTruncated:false};
  const {blobs,truncated}=await listBackupBlobs();
  const last=blobs[0]?{pathname:blobs[0].pathname,uploadedAt:blobs[0].uploadedAt,size:blobs[0].size,url:blobs[0].url}:null;
  const ageHours=last?.uploadedAt?Number(((Date.now()-new Date(last.uploadedAt).getTime())/3600000).toFixed(1)):null;
  return {...config,retentionDays:RETENTION_DAYS,backupCount:blobs.length,scanTruncated:truncated,lastBackup:last,lastBackupAgeHours:ageHours,overdue:ageHours==null||ageHours>36};
}
