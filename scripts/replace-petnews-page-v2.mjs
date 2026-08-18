import fs from 'node:fs';

const file='src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const old='const detailRef=React.useRef(null),PAGE=8,cats=';
const next='const detailRef=React.useRef(null),PAGE=20,cats=';
const count=s.split(old).length-1;
if(count!==1) throw new Error(`Expected exactly one PetNews PAGE=8 anchor, found ${count}`);
s=s.replace(old,next);
fs.writeFileSync(file,s);
console.log('PetNews page size changed from 8 to 20.');
