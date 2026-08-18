import fs from 'node:fs';

const newsPath='api/news.js';
const appPath='src/App.jsx';
let news=fs.readFileSync(newsPath,'utf8');
let app=fs.readFileSync(appPath,'utf8');
const MARK='PETNEWS_ARCHIVE_20260818';

if(!news.includes(MARK)){
  news=`import { sql } from "@vercel/postgres";\n/* ${MARK} */\n`+news;

  const beforePrepare='async function prepare(raw){let normalized=dedupe(raw.filter(isPetRelevant).map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));if(!normalized.length)normalized=dedupe(raw.map(normalizeItem)).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0));const now=Date.now(),sevenDays=7*24*60*60*1000,recent=normalized.filter(item=>item.publishedAt&&now-new Date(item.publishedAt).getTime()<=sevenDays);const picked=(recent.length>=12?recent:normalized).slice(0,40);const enriched=await enrichArticleImages(picked);const byId=new Map(enriched.map(x=>[x.id,x]));return picked.map(x=>byId.get(x.id)||x);}\n';
  if(!news.includes(beforePrepare)) throw new Error('prepare anchor not found');
  const archiveCode=`${beforePrepare}\nasync function ensureNewsArchive(){\n  await sql\`CREATE TABLE IF NOT EXISTS pet_news_archive (\n    id TEXT PRIMARY KEY,\n    title TEXT NOT NULL,\n    description TEXT,\n    category TEXT,\n    source TEXT,\n    link TEXT NOT NULL,\n    naver_link TEXT,\n    published_at TIMESTAMPTZ,\n    image TEXT,\n    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n  )\`;\n  await sql\`CREATE INDEX IF NOT EXISTS idx_pet_news_archive_published_at ON pet_news_archive (published_at DESC NULLS LAST)\`;\n}\n\nasync function saveNewsArchive(items){\n  for(const item of items){\n    await sql\`INSERT INTO pet_news_archive (id,title,description,category,source,link,naver_link,published_at,image,last_seen_at)\n      VALUES (\${item.id},\${item.title},\${item.description||''},\${item.category||'반려동물'},\${item.source||'언론사'},\${item.link},\${item.naverLink||item.link},\${item.publishedAt?new Date(item.publishedAt):null},\${item.image||''},NOW())\n      ON CONFLICT (id) DO UPDATE SET\n        description=EXCLUDED.description,category=EXCLUDED.category,source=EXCLUDED.source,\n        naver_link=EXCLUDED.naver_link,published_at=COALESCE(EXCLUDED.published_at,pet_news_archive.published_at),\n        image=CASE WHEN EXCLUDED.image<>'' THEN EXCLUDED.image ELSE pet_news_archive.image END,last_seen_at=NOW()\`;\n  }\n}\n\nasync function loadNewsArchive(limit=1000){\n  const result=await sql\`SELECT id,title,description,category,source,link,naver_link,published_at,image\n    FROM pet_news_archive ORDER BY published_at DESC NULLS LAST, first_seen_at DESC LIMIT \${limit}\`;\n  return result.rows.map(r=>({id:r.id,title:r.title,description:r.description||'',category:r.category||'반려동물',source:r.source||'언론사',link:r.link,naverLink:r.naver_link||r.link,publishedAt:r.published_at?new Date(r.published_at).toISOString():null,image:r.image||'',imageIsFallback:false}));\n}\n`;
  news=news.replace(beforePrepare,archiveCode);

  const oldHandler='  try{let raw=[];if(clientId&&clientSecret){try{raw=await fetchNaver(clientId,clientSecret);provider="naver-api-hub";}catch(e){console.warn("Pet news primary provider failed; using fallback",e?.message||e);}}if(!raw.length){raw=await fetchGoogleFallback();provider="google-news-rss";}const items=await prepare(raw);res.setHeader("Cache-Control","public, s-maxage=1800, stale-while-revalidate=1800");return res.status(200).json({configured:true,provider,updatedAt:new Date().toISOString(),refreshSeconds:1800,total:items.length,items,message:items.length?"":"새 반려동물 뉴스를 찾고 있어요. 잠시 후 다시 확인해 주세요."});}\n';
  if(!news.includes(oldHandler)) throw new Error('handler anchor not found');
  const newHandler='  try{await ensureNewsArchive();let raw=[];if(clientId&&clientSecret){try{raw=await fetchNaver(clientId,clientSecret);provider="naver-api-hub";}catch(e){console.warn("Pet news primary provider failed; using fallback",e?.message||e);}}if(!raw.length){raw=await fetchGoogleFallback();provider="google-news-rss";}const freshItems=await prepare(raw);if(freshItems.length)await saveNewsArchive(freshItems);const items=await loadNewsArchive(1000);res.setHeader("Cache-Control","public, s-maxage=1800, stale-while-revalidate=1800");return res.status(200).json({configured:true,provider,archive:true,updatedAt:new Date().toISOString(),refreshSeconds:1800,total:items.length,items,message:items.length?"":"새 반려동물 뉴스를 찾고 있어요. 잠시 후 다시 확인해 주세요."});}\n';
  news=news.replace(oldHandler,newHandler);
}

if(app.includes('const NEWS_PAGE_SIZE=10;')) app=app.replace('const NEWS_PAGE_SIZE=10;','const NEWS_PAGE_SIZE=20;');
if(app.includes('PetNews: search, expandable categories and 10-item pagination applied.')) app=app.replace('PetNews: search, expandable categories and 10-item pagination applied.','PetNews: search, expandable categories and 20-item pagination applied.');

fs.writeFileSync(newsPath,news);
fs.writeFileSync(appPath,app);
console.log('PetNews persistent archive + 20-item pagination applied');
