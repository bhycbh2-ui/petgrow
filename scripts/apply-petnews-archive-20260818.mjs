import fs from 'node:fs';

const newsPath='api/news.js';
const appPath='src/App.jsx';
let news=fs.readFileSync(newsPath,'utf8');
let app=fs.readFileSync(appPath,'utf8');

let changed=false;

// PetNews must render 20 items per page.
if(app.includes('/* PETNEWS_FINAL_INLINE_20260818 */')){
  const before='detailRef=React.useRef(null),PAGE=8,cats=';
  const after='detailRef=React.useRef(null),PAGE=20,cats=';
  if(app.includes(before)){
    app=app.replace(before,after);
    changed=true;
  }
}

// Preserve archived rows: only insert genuinely new articles.
// A fresh item is considered a duplicate when either its link or title already exists.
// Existing rows are never updated by a refresh.
const saveStart='async function saveNewsArchive(items){';
const loadStart='async function loadNewsArchive(limit=1000){';
const start=news.indexOf(saveStart);
const end=news.indexOf(loadStart);
if(start<0||end<0||end<=start) throw new Error('PetNews archive anchors not found');

const newSave=`async function saveNewsArchive(items){
  for(const item of items){
    const existing=await sql\`SELECT 1 FROM pet_news_archive
      WHERE link=\${item.link} OR LOWER(title)=LOWER(\${item.title})
      LIMIT 1\`;
    if(existing.rowCount>0) continue;
    await sql\`INSERT INTO pet_news_archive (id,title,description,category,source,link,naver_link,published_at,image,last_seen_at)
      VALUES (\${item.id},\${item.title},\${item.description||''},\${item.category||'반려동물'},\${item.source||'언론사'},\${item.link},\${item.naverLink||item.link},\${item.publishedAt?new Date(item.publishedAt):null},\${item.image||''},NOW())
      ON CONFLICT (id) DO NOTHING\`;
  }
}

`;
const oldSave=news.slice(start,end);
if(oldSave!==newSave){
  news=news.slice(0,start)+newSave+news.slice(end);
  changed=true;
}

if(!app.includes('detailRef=React.useRef(null),PAGE=20,cats=')){
  throw new Error('PetNews PAGE=20 verification failed');
}
if(!news.includes('WHERE link=${item.link} OR LOWER(title)=LOWER(${item.title})')){
  throw new Error('PetNews link/title dedupe verification failed');
}
if(!news.includes('ON CONFLICT (id) DO NOTHING')){
  throw new Error('PetNews non-overwrite verification failed');
}

if(changed){
  fs.writeFileSync(newsPath,news);
  fs.writeFileSync(appPath,app);
  console.log('PetNews: 20-item pagination + append-only link/title dedupe applied.');
}else{
  console.log('PetNews already satisfies archive and pagination rules.');
}
