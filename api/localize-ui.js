const LANG={en:"en",ja:"ja",zh:"zh-CN"};
const cache=new Map();

async function translateOne(text,target){
  const key=`${target}:${text}`;
  if(cache.has(key))return cache.get(key);
  try{
    const ac=new AbortController();
    const timer=setTimeout(()=>ac.abort(),3200);
    const url=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const r=await fetch(url,{signal:ac.signal,headers:{"User-Agent":"PetGrow/1.0"}});
    clearTimeout(timer);
    if(!r.ok)return text;
    const j=await r.json();
    const out=(Array.isArray(j?.[0])?j[0].map(x=>x?.[0]||"").join("").trim():"")||text;
    if(cache.size>2000)cache.clear();
    cache.set(key,out);
    return out;
  }catch{return text;}
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const lang=String(req.body?.lang||"");
  const target=LANG[lang];
  if(!target)return res.status(200).json({items:Array.isArray(req.body?.texts)?req.body.texts:[],lang:"ko"});
  const texts=(Array.isArray(req.body?.texts)?req.body.texts:[]).slice(0,24).map(x=>String(x||"").trim().slice(0,700));
  const items=[];
  for(let i=0;i<texts.length;i+=6){
    const part=texts.slice(i,i+6);
    items.push(...await Promise.all(part.map(t=>translateOne(t,target))));
  }
  res.setHeader("Cache-Control","private, max-age=1800");
  return res.status(200).json({items,lang});
}
