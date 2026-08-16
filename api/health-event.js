import {logServiceHealth} from "./_lib/db.js";
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"method not allowed"});
 const b=req.body||{},kind=["error","slow","rate_limit"].includes(String(b.kind))?String(b.kind):"error";
 await logServiceHealth(kind,String(b.source||"client").slice(0,80),Number.isFinite(Number(b.statusCode))?Number(b.statusCode):null,Number.isFinite(Number(b.latencyMs))?Math.min(60000,Math.max(0,Number(b.latencyMs))):null,String(b.detail||"").slice(0,300));
 return res.status(200).json({ok:true});
}