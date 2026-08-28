import fs from 'fs';
const source='scripts/petinfo-daily-20260828.mjs';
const temp='scripts/.petinfo-daily-20260828-runtime.mjs';
let code=fs.readFileSync(source,'utf8');
const before="titleKo:'빗질 도구는 털 길이와 피부 상태에 맞춰 선택해요'";
const after="titleKo:'빗질할 때 피부에 닿는 압력을 가볍게 조절해요'";
if(!code.includes(before)) throw new Error('duplicate candidate anchor not found');
code=code.replace(before,after);
fs.writeFileSync(temp,code);
try { await import(`./.petinfo-daily-20260828-runtime.mjs?run=${Date.now()}`); }
finally { try { fs.unlinkSync(temp); } catch {} }
