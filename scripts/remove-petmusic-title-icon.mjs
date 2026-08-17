import fs from 'node:fs';
const file='src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const from='<h1>🎵 {lang==="en"?"Pet Music":"Pet음악"}</h1>';
const to='<h1>{lang==="en"?"Pet Music":"Pet음악"}</h1>';
if(!s.includes(from)) throw new Error('Pet Music title marker not found');
s=s.replace(from,to);
fs.writeFileSync(file,s);
console.log('Removed music note from Pet Music page title.');
