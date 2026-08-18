import { sql } from "@vercel/postgres";
import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole } from "../server_lib/admin.js";

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"지원하지 않는 요청이에요."});
  const uid=getSessionUserId(req);
  if(!uid) return res.status(401).json({error:"로그인이 필요해요."});
  const role=await getAdminRole(uid);
  if(!role) return res.status(403).json({error:"관리자 권한이 필요해요."});
  try{
    const {rows}=await sql`select count(*)::int total_members from pg_users`;
    return res.status(200).json({totalMembers:Number(rows[0]?.total_members)||0});
  }catch(e){
    return res.status(500).json({error:e?.message||"전체 회원 수를 불러오지 못했어요."});
  }
}
