const LANG={ko:"ko",en:"en",ja:"ja",zh:"zh-CN"};
async function translate(text,target){
  if(!text||target==="ko")return String(text||"");
  try{
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),2500);
    const url=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(String(text).slice(0,1000))}`;
    const r=await fetch(url,{signal:ac.signal,headers:{"User-Agent":"PetGrow/1.0"}});clearTimeout(timer);
    if(!r.ok)return String(text);
    const j=await r.json();
    return (Array.isArray(j?.[0])?j[0].map(x=>x?.[0]||"").join("").trim():"")||String(text);
  }catch{return String(text||"");}
}
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const lang=String(req.body?.lang||"ko"),target=LANG[lang]||"ko",items=Array.isArray(req.body?.items)?req.body.items.slice(0,8):[];
  if(target==="ko")return res.status(200).json({items:items.map(x=>({id:x.id,title:x.title,description:x.description}))});
  const out=await Promise.all(items.map(async x=>{const [title,description]=await Promise.all([translate(x.title,target),translate(x.description,target)]);return {id:String(x.id||""),title,description};}));
  res.setHeader("Cache-Control","private, max-age=1800");
  return res.status(200).json({items:out,lang});
}
