const API_BASE = "https://naverapihub.apigw.ntruss.com/search/v1/news";
const GOOGLE_RSS = "https://news.google.com/rss/search";

const SEARCH_QUERIES = ["반려동물","반려견","반려묘","강아지","고양이","동물병원","펫보험","동물보호 유기동물"];
const PET_TERMS = ["반려동물","반려견","반려묘","강아지","고양이","애견","애묘","펫","동물병원","수의사","펫보험","유기동물","동물보호","입양","보호소","반려생활","반려인"];
const CATEGORY_RULES = [
  ["건강",["동물병원","수의사","질병","건강","백신","예방접종","치료","수술","의료","약"]],
  ["정책·제도",["정책","법안","조례","정부","지자체","농림축산식품부","동물보호법","등록제","과태료"]],
  ["입양·보호",["유기동물","보호소","입양","구조","동물보호","학대"]],
  ["산업·서비스",["펫보험","펫푸드","사료","용품","펫테크","시장","산업","서비스","출시"]],
  ["반려견",["반려견","강아지","애견","개 "]],
  ["반려묘",["반려묘","고양이","애묘"]]
];

function decodeEntities(value="") {
  return String(value)
    .replace(/&nbsp;|&#160;|&#xA0;/gi," ")
    .replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">")
    .replace(/&#(\d+);/g,(_,n)=>{try{return String.fromCodePoint(Number(n));}catch{return " ";}})
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>{try{return String.fromCodePoint(parseInt(n,16));}catch{return " ";}});
}
function stripHtml(value="") {
  return decodeEntities(String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g," ")).replace(/\s+/g," ").trim();
}
function imageFromHtml(value="") {
  const raw=String(value||"");
  const media=raw.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1];
  const img=raw.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  const src=decodeEntities(media||img||"").trim();
  return /^https?:\/\//i.test(src)?src:"";
}
function isPetRelevant(item){const hay=`${stripHtml(item.title)} ${stripHtml(item.description)}`.toLowerCase();return PET_TERMS.some(term=>hay.includes(term.toLowerCase()));}
function categoryFor(item){const hay=`${stripHtml(item.title)} ${stripHtml(item.description)}`;for(const [category,terms] of CATEGORY_RULES){if(terms.some(term=>hay.includes(term)))return category;}return "반려동물";}
function sourceFromUrl(url){try{return new URL(url).hostname.replace(/^www\./,"");}catch{return "언론사";}}
function normalizeItem(item){
  const link=item.originallink||item.link||"",title=stripHtml(item.title),description=stripHtml(item.description),category=categoryFor(item);
  const publishedAt=item.pubDate?new Date(item.pubDate).toISOString():null;
  const image=item.image||imageFromHtml(item.rawDescription||item.description)||"";
  return {id:`${title}|${link}`,title,description,category,source:item.source||sourceFromUrl(link),link,naverLink:item.link||link,publishedAt,image,imageIsFallback:false};
}

function safeRemoteUrl(value=""){
  try{const u=new URL(value);if(!/^https?:$/.test(u.protocol))return null;const h=u.hostname.toLowerCase();if(h==="localhost"||h.endsWith(".local")||h==="0.0.0.0"||h==="127.0.0.1"||h==="::1"||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h))return null;return u;}catch{return null;}
}
async function fetchOgMeta(startUrl){
  let current=safeRemoteUrl(startUrl);if(!current)return {image:"",url:startUrl};
  for(let hop=0;hop<4;hop++){
    const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),1200);
    try{
      const r=await fetch(current,{redirect:"manual",signal:ac.signal,headers:{"User-Agent":"Mozilla/5.0 (compatible; PetGrowNews/1.0)","Accept":"text/html,application/xhtml+xml"}});
      if(r.status>=300&&r.status<400){const loc=r.headers.get("location");if(!loc)break;const next=safeRemoteUrl(new URL(loc,current).toString());if(!next)break;current=next;continue;}
      const type=r.headers.get("content-type")||"";if(!r.ok||!type.includes("text/html"))break;
      const html=(await r.text()).slice(0,450000);
      const pick=(prop)=>html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,`i`))?.[1]||html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,`i`))?.[1]||"";
      const img=decodeEntities(pick("og:image")||pick("twitter:image")).trim();
      const canonical=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]||current.toString();
      return {image:/^https?:\/\//i.test(img)?img:"",url:safeRemoteUrl(canonical)?.toString()||current.toString()};
    }catch{}finally{clearTimeout(timer)}
    break;
  }
  return {image:"",url:current?.toString()||startUrl};
}
async function enrichArticleImages(items){
  const candidates=items.slice(0,16),out=[];
  for(let i=0;i<candidates.length;i+=8){
    const batch=candidates.slice(i,i+8);
    const enriched=await Promise.all(batch.map(async item=>{if(item.image)return item;const meta=await fetchOgMeta(item.link);return {...item,link:meta.url||item.link,image:meta.image||"",source:meta.url?sourceFromUrl(meta.url):item.source};}));
    out.push(...enriched);
    if(out.filter(x=>x.image).length>=12)break;
  }
  return out;
}

function dedupe(items){const seenLinks=new Set(),seenTitles=new Set(),result=[];for(const item of items){const titleKey=item.title.toLowerCase().replace(/[^0-9a-z가-힣]/g,"").slice(0,80);if(!item.link||seenLinks.has(item.link)||seenTitles.has(titleKey))continue;seenLinks.add(item.link);seenTitles.add(titleKey);result.push(item);}return result;}
function tagRaw(xml,name){const m=xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,"i"));return m?m[1]:"";}
function tag(xml,name){return stripHtml(tagRaw(xml,name));}
function parseGoogleRss(xml){
  const items=[];
  for(const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)){
    const block=match[1],sourceMatch=block.match(/<source(?:\s+url="([^"]*)")?>([\s\S]*?)<\/source>/i),rawTitle=tag(block,"title"),source=sourceMatch?stripHtml(sourceMatch[2]):"Google News";
    const suffix=source?` - ${source}`:"",title=suffix&&rawTitle.endsWith(suffix)?rawTitle.slice(0,-suffix.length).trim():rawTitle;
    const rawDescription=tagRaw(block,"description"),description=stripHtml(rawDescription).replace(/\s+-\s+[^-]+$/,"").trim(),link=tag(block,"link"),pubDate=tag(block,"pubDate"),image=imageFromHtml(block)||imageFromHtml(rawDescription);
    if(title&&link)items.push({title,description,rawDescription,link,originallink:link,pubDate,source,image});
  }
  return items;
}
async function fetchNaver(clientId,clientSecret){const responses=await Promise.all(SEARCH_QUERIES.map(async query=>{const url=`${API_BASE}?query=${encodeURIComponent(query)}&display=20&start=1&sort=date&format=json`;const response=await fetch(url,{headers:{"X-NCP-APIGW-API-KEY-ID":clientId,"X-NCP-APIGW-API-KEY":clientSecret}});if(!response.ok)throw new Error(`NAVER API HUB ${response.status}`);return response.json();}));return responses.flatMap(r=>Array.isArray(r.items)?r.items:[]);}
async function fetchGoogleFallback(){const queries=["반려동물","반려견 OR 강아지","반려묘 OR 고양이","동물병원 OR 펫보험","유기동물 OR 동물보호"];const settled=await Promise.allSettled(queries.map(async query=>{const url=`${GOOGLE_RSS}?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;const response=await fetch(url,{headers:{"User-Agent":"PetGrow/1.0"}});if(!response.ok)throw new Error(`Google News RSS ${response.status}`);return parseGoogleRss(await response.text());}));return settled.flatMap(r=>r.status==="fulfilled"?r.value:[]);}
async function prepare(raw){let normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));if(!normalized.length)normalized=dedupe(raw.map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);const picked=(recent.length>=12?recent:normalized).slice(0,40);const enriched=await enrichArticleImages(picked);const byId=new Map(enriched.map(x=>[x.id,x]));return picked.map(x=>byId.get(x.id)||x);}
export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const clientId=process.env.NAVER_API_HUB_CLIENT_ID,clientSecret=process.env.NAVER_API_HUB_CLIENT_SECRET;let provider="google-news-rss";
  try{let raw=[];if(clientId&&clientSecret){try{raw=await fetchNaver(clientId,clientSecret);provider="naver-api-hub";}catch(e){console.warn("Pet news primary provider failed; using fallback",e?.message||e);}}if(!raw.length){raw=await fetchGoogleFallback();provider="google-news-rss";}const items=await prepare(raw);res.setHeader("Cache-Control","public, s-maxage=1800, stale-while-revalidate=1800");return res.status(200).json({configured:true,provider,updatedAt:new Date().toISOString(),refreshSeconds:1800,total:items.length,items,message:items.length?"":"새 반려동물 뉴스를 찾고 있어요. 잠시 후 다시 확인해 주세요."});}
  catch(error){console.error("Pet news fetch failed",error?.message||error);res.setHeader("Cache-Control","no-store");return res.status(200).json({configured:true,provider:"temporarily-unavailable",items:[],error:"뉴스를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."});}
}
