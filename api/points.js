import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole } from "../server_lib/admin.js";
import { getPointSummary, getPointAdminStats, spendPoints, POINT_COSTS } from "../server_lib/points.js";

export default async function handler(req,res){
  const uid=getSessionUserId(req);
  if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
  try{
    const action=String(req.query.action||"summary");
    if(req.method==="GET"&&action==="summary"){
      const data=await getPointSummary(uid,{dailyLogin:true});
      data.earnGuide=(data.earnGuide||[]).map(x=>x.label==="Pet톡 댓글 작성"?{...x,limit:"하루 5회"}:x);
      return res.status(200).json(data);
    }
    if(req.method==="GET"&&action==="admin"){
      const role=await getAdminRole(uid);
      if(!role)return res.status(403).json({error:"관리자 권한이 필요해요."});
      return res.status(200).json(await getPointAdminStats());
    }
    if(req.method==="POST"&&action==="spend"){
      const feature=String(req.body?.feature||"");
      const refKey=String(req.body?.refKey||"").trim()||null;
      if(!["saju_basic","saju_daily","saju_compat","tarot"].includes(feature))return res.status(400).json({error:"지원하지 않는 포인트 사용 항목이에요."});
      return res.status(200).json({ok:true,...await spendPoints(uid,feature,POINT_COSTS[feature],refKey)});
    }
    return res.status(405).json({error:"지원하지 않는 요청이에요."});
  }catch(e){
    return res.status(e?.code==="POINTS_INSUFFICIENT"?402:500).json({error:e?.message||"PetPoint 처리 중 오류가 발생했어요.",code:e?.code||"POINT_ERROR"});
  }
}
