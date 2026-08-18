import fs from 'node:fs';

const newsPath='api/news.js';
let news=fs.readFileSync(newsPath,'utf8');

const old=`async function saveNewsArchive(items){
  for(const item of items){
    await sql\`INSERT INTO pet_news_archive (id,title,description,category,source,link,naver_link,published_at,image,last_seen_at)
      VALUES (\${item.id},\${item.title},\${item.description||''},\${item.category||'반려동물'},\${item.source||'언론사'},\${item.link},\${item.naverLink||item.link},\${item.publishedAt?new Date(item.publishedAt):null},\${item.image||''},NOW())
      ON CONFLICT (id) DO UPDATE SET
        description=EXCLUDED.description,category=EXCLUDED.category,source=EXCLUDED.source,
        naver_link=EXCLUDED.naver_link,published_at=COALESCE(EXCLUDED.published_at,pet_news_archive.published_at),
        image=CASE WHEN EXCLUDED.image<>'' THEN EXCLUDED.image ELSE pet_news_archive.image END,last_seen_at=NOW()\`;
  }
}`;

const next=`function archiveTitleKey(value=""){return String(value||"").toLowerCase().replace(/[^0-9a-z가-힣]/g,"").slice(0,120);}
async function saveNewsArchive(items){
  const existing=await sql\`SELECT id,title,link FROM pet_news_archive\`;
  const ids=new Set(existing.rows.map(r=>String(r.id||"")));
  const links=new Set(existing.rows.map(r=>String(r.link||"")).filter(Boolean));
  const titles=new Set(existing.rows.map(r=>archiveTitleKey(r.title)).filter(Boolean));
  for(const item of items){
    const titleKey=archiveTitleKey(item.title);
    const exact=ids.has(item.id);
    if(!exact&&(links.has(item.link)||titles.has(titleKey)))continue;
    await sql\`INSERT INTO pet_news_archive (id,title,description,category,source,link,naver_link,published_at,image,last_seen_at)
      VALUES (\${item.id},\${item.title},\${item.description||''},\${item.category||'반려동물'},\${item.source||'언론사'},\${item.link},\${item.naverLink||item.link},\${item.publishedAt?new Date(item.publishedAt):null},\${item.image||''},NOW())
      ON CONFLICT (id) DO UPDATE SET
        description=EXCLUDED.description,category=EXCLUDED.category,source=EXCLUDED.source,
        naver_link=EXCLUDED.naver_link,published_at=COALESCE(EXCLUDED.published_at,pet_news_archive.published_at),
        image=CASE WHEN EXCLUDED.image<>'' THEN EXCLUDED.image ELSE pet_news_archive.image END,last_seen_at=NOW()\`;
    ids.add(item.id);links.add(item.link);if(titleKey)titles.add(titleKey);
  }
}`;

const count=news.split(old).length-1;
if(count!==1) throw new Error(`Expected exactly one PetNews archive saver anchor, found ${count}`);
news=news.replace(old,next);
fs.writeFileSync(newsPath,news);
console.log('PetNews archive now rejects new duplicates by existing link or normalized title while preserving history.');
