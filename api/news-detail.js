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
function articleParagraphs(html=""){
  const withoutNoise=String(html).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<noscript[\s\S]*?<\/noscript>/gi," ").replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi," ");
  const paragraphs=[];
  for(const m of withoutNoise.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)){
    const t=clean(m[1]);
    if(t.length<35||t.length>700)continue;
    if(/무단전재|재배포|저작권|기자\s*=|Copyright|구독|로그인|제보|광고/.test(t))continue;
    if(!paragraphs.includes(t))paragraphs.push(t);
    if(paragraphs.join(" ").length>2600)break;
  }
  return paragraphs.join(" ");
}
function concise(text="",fallback=""){
  const t=clean(text||fallback);
  if(!t)return "• 기사의 세부 내용은 원문에서 확인해 주세요.";
  const sentences=t.split(/(?<=[.!?。！？]|다\.|요\.)\s+/).map(clean).filter(x=>x.length>18);
  const unique=[];
  for(const sentence of sentences){
    const normalized=sentence.replace(/\s+/g," ").trim();
    if(unique.some(x=>x===normalized))continue;
    unique.push(normalized);
    if(unique.length>=10||unique.join(" ").length>=1750)break;
  }
  const source=unique.length?unique:[t];
  const picked=source.slice(0,10).map(x=>x.slice(0,210).replace(/[,.·;:\s]+$/,""));
  return picked.map(x=>`• ${x}`).join("\n").slice(0,1900);
}
async function translate(text,lang){
  const target={ko:"ko",en:"en",ja:"ja",zh:"zh-CN"}[lang];
  if(!target||target==="ko"||!text)return text;
  try{
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),3600);
    const url=`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text.slice(0,2200))}`;
    const r=await fetch(url,{signal:ac.signal,headers:{"User-Agent":"PetGrow/1.0"}});clearTimeout(timer);
    if(!r.ok)return text;
    const j=await r.json();
    const out=Array.isArray(j?.[0])?j[0].map(x=>x?.[0]||"").join("").trim():"";
    return out||text;
  }catch{return text;}
}
async function fetchArticle(start){
  let current=safeRemoteUrl(start);if(!current)return null;
  for(let hop=0;hop<4;hop++){
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),4200);
    try{
      const r=await fetch(current,{signal:ac.signal,redirect:"manual",headers:{"User-Agent":"Mozilla/5.0 (compatible; PetGrowNews/1.0)",Accept:"text/html,application/xhtml+xml"}});
      if(r.status>=300&&r.status<400){const loc=r.headers.get("location");if(!loc)return null;const next=safeRemoteUrl(new URL(loc,current).toString());if(!next)return null;current=next;continue;}
      const type=r.headers.get("content-type")||"";
      if(!r.ok||!type.includes("text/html"))return null;
      const html=(await r.text()).slice(0,900000);
      return {html,url:current.toString()};
    }catch{return null}finally{clearTimeout(timer)}
  }
  return null;
}
export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const rawUrl=String(req.query.url||"");
  const title=clean(req.query.title||"");
  const fallback=clean(req.query.description||"");
  const requestedImage=String(req.query.image||"").trim();
  const lang=["ko","en","ja","zh"].includes(String(req.query.lang))?String(req.query.lang):"ko";
  let sourceText=fallback,canonical=rawUrl,image=/^https?:\/\//i.test(requestedImage)?requestedImage:"";
  const article=await fetchArticle(rawUrl);
  if(article){
    const {html,url}=article;
    const description=meta(html,"og:description")||meta(html,"description")||meta(html,"twitter:description");
    const body=articleParagraphs(html);
    sourceText=[description,body].filter(Boolean).join(" ")||fallback;
    const articleImage=meta(html,"og:image")||meta(html,"twitter:image")||meta(html,"twitter:image:src")||"";
    if(/^https?:\/\//i.test(articleImage))image=articleImage;
    const canonicalHref=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]||url;
    canonical=safeRemoteUrl(canonicalHref)?.toString()||url;
  }
  const summary=concise(sourceText,fallback||title);
  const [localizedTitle,localizedSummary]=await Promise.all([translate(title,lang),translate(summary,lang)]);
  res.setHeader("Cache-Control","public, s-maxage=1800, stale-while-revalidate=3600");
  return res.status(200).json({title:localizedTitle||title,summary:localizedSummary||summary,originalTitle:title,canonical,image,lang,translated:lang!=="ko",summaryLines:(localizedSummary||summary).split("\n").filter(Boolean).length});
}
