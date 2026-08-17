import fs from 'node:fs';

const appPath='src/App.jsx';
let app=fs.readFileSync(appPath,'utf8');
app=app.replace('<p className="bg-sub" style={{fontSize:12,marginTop:6}}>{lang==="en"?"PetGrow music will appear here after an administrator uploads it.":"관리자센터에서 음악을 등록하면 이곳에 바로 표시됩니다."}</p>','');
fs.writeFileSync(appPath,app,'utf8');

const musicPath='api/music.js';
let music=fs.readFileSync(musicPath,'utf8');
music=music.replace('if(meta[0] && Number(existing?.[0]?.n||0)>=16) return;','if(meta[0] && Number(existing?.[0]?.n||0)>=32) return;');
fs.writeFileSync(musicPath,music,'utf8');

console.log('PetMusic empty copy removed and 32-track seed threshold fixed');
