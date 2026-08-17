function safeRemoteUrl(value=""){
  try{
    const u=new URL(value);
    if(!/^https?:$/.test(u.protocol))return null;
    const h=u.hostname.toLowerCase();
    if(h==="localhost"||h.endsWith(".local")||h==="0.0.0.0"||h==="127.0.0.1"||h==="::1"||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h))return null;
    return u;
  }catch{return null;}
}
const decode=(v="")=>String(v).replace(/&nbsp;|&#160;|&#xA0;/gi," ").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#(\d+);/g,(_,n)=>{try{return String.fromCodePoint(Number(n));}catch{return " ";}}).replace(/&#x([0-9a-f]+);/gi,(_,n)=>{try{return String.fromCodePoint(parseInt(n,16));}catch{return " ";}});
const clean=(v="")=>decode(String(v).replace(/<[^>]*>/g," ")).replace(/\s+/g," ").trim();
function meta(html,key){
  const esc=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return decode(html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']+)["']`,`i`))?.[1]||html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${esc}["']`,`i`))?.[1]||"").trim();
}
function concise(text="",fallback=""){
  const t=clean(text||fallback);
  if(!t)return "기사의 세부 내용을 원문에서 확인해 주세요.";
  const sentences=t.split(/(?<=[.!?。！？]|다\.|요\.)\s+/).filter(Boolean);
  const picked=(sentences.length?sentences.slice(0,2).join(" "):t).slice(0,360).trim();
  return picked.length<t.length?`${picked.replace(/[,.·;:\s]+$/,'')}…`:picked;
}
async function translate(text,lang){
  const target={ko:"ko",en:"en",ja:"ja",zh:"zh-CN"}[lang];
  if(!target||!text)return text;
  try{
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),2800);
    const url=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text.slice(0,1200))}`;
    const r=await fetch(url,{signal:ac.signal,headers:{"User-Agent":"PetGrow/1.0"}});clearTimeout(timer);
    if(!r.ok)return text;
    const j=await r.json();
    const out=Array.isArray(j?.[0])?j[0].map(x=>x?.[0]||"").join("").trim():"";
    return out||text;
  }catch{return text;}
}
export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const rawUrl=String(req.query.url||"");
  const title=clean(req.query.title||"");
  const fallback=clean(req.query.description||"");
  const lang=["ko","en","ja","zh"].includes(String(req.query.lang))?String(req.query.lang):"ko";
  const u=safeRemoteUrl(rawUrl);
  let sourceText=fallback,canonical=u?.toString()||rawUrl;
  if(u){
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),3500);
    try{
      const r=await fetch(u,{signal:ac.signal,redirect:"follow",headers:{"User-Agent":"Mozilla/5.0 (compatible; PetGrowNews/1.0)",Accept:"text/html,application/xhtml+xml"}});
      const type=r.headers.get("content-type")||"";
      if(r.ok&&type.includes("text/html")){
        const html=(await r.text()).slice(0,550000);
        const description=meta(html,"og:description")||meta(html,"description")||meta(html,"twitter:description");
        if(description)sourceText=description;
        canonical=safeRemoteUrl(r.url)?.toString()||canonical;
      }
    }catch{}finally{clearTimeout(timer)}
  }
  const summary=concise(sourceText,fallback||title);
  const [localizedTitle,localizedSummary]=await Promise.all([translate(title,lang),translate(summary,lang)]);
  res.setHeader("Cache-Control","public, s-maxage=1800, stale-while-revalidate=3600");
  return res.status(200).json({title:localizedTitle||title,summary:localizedSummary||summary,originalTitle:title,canonical,lang,translated:lang!=="ko"});
}
