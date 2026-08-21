import { handleUpload } from "@vercel/blob/client";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { ensureAuthSchema } from "../server_lib/db.js";

const IMAGE_TYPES=["image/jpeg","image/png","image/webp"];
const MAX_IMAGE_BYTES=8*1024*1024;
function parsePayload(raw){try{return JSON.parse(String(raw||"{}"));}catch{return {};}}

export default async function handler(req,res){
  try{
    await ensureAuthSchema();
    const uid=getSessionUserId(req);
    if(!uid)return res.status(401).json({error:"로그인 후 사진을 올릴 수 있어요."});
    if(req.method==="GET")return res.status(200).json({ok:true,blobConfigured:Boolean(process.env.BLOB_READ_WRITE_TOKEN),maxImageBytes:MAX_IMAGE_BYTES,contentTypes:IMAGE_TYPES});
    if(req.method!=="POST")return res.status(405).json({error:"지원하지 않는 요청이에요."});
    if(!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({error:"사진 저장소가 연결되지 않았어요.",code:"BLOB_NOT_CONFIGURED"});

    const json=await handleUpload({
      body:req.body||{},request:req,token:process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken:async(pathname,clientPayload)=>{
        const payload=parsePayload(clientPayload); const petId=String(payload.petId||"").slice(0,80);
        if(!petId)throw Object.assign(new Error("반려동물 정보가 없어요."),{status:400});
        const {rows}=await sql`select id from pg_pets where id=${petId} and user_id=${uid}`;
        if(!rows[0])throw Object.assign(new Error("본인의 반려동물 사진만 올릴 수 있어요."),{status:403});
        const prefix=`petlife/${petId}/`;
        if(!String(pathname||"").startsWith(prefix))throw Object.assign(new Error("허용되지 않은 업로드 경로예요."),{status:400});
        return {allowedContentTypes:IMAGE_TYPES,maximumSizeInBytes:MAX_IMAGE_BYTES,addRandomSuffix:true,tokenPayload:JSON.stringify({uid,petId})};
      },
      onUploadCompleted:async()=>{}
    });
    return res.status(200).json(json);
  }catch(error){
    const status=Number(error?.status)||400;
    console.error("petlife upload",error);
    return res.status(status).json({error:error?.message||"사진 업로드를 시작하지 못했어요.",code:error?.code||"PETLIFE_UPLOAD_FAILED"});
  }
}
