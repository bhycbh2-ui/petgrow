import fs from 'node:fs';
const f='src/App.jsx';
let s=fs.readFileSync(f,'utf8');
const line='import "./final-batch-v3.css";';
if(!s.includes(line)){
  const anchor='import "leaflet/dist/leaflet.css";';
  if(!s.includes(anchor)) throw new Error('leaflet css import anchor not found');
  s=s.replace(anchor,anchor+'\n'+line);
  fs.writeFileSync(f,s);
}
console.log('final batch stylesheet import ensured');
