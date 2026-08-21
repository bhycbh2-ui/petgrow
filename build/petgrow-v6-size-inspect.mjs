import fs from "node:fs";
import path from "node:path";

function bodyStart(code,start){
  const op=code.indexOf("(",start); if(op<0)return -1;
  let d=0,q=null,e=false,l=false,b=false;
  for(let i=op;i<code.length;i++){
    const c=code[i],n=code[i+1];
    if(l){if(c==="\n")l=false;continue}
    if(b){if(c==="*"&&n==="/"){b=false;i++}continue}
    if(q){if(e){e=false;continue}if(c==="\\"){e=true;continue}if(c===q)q=null;continue}
    if(c==="/"&&n==="/"){l=true;i++;continue}
    if(c==="/"&&n==="*"){b=true;i++;continue}
    if(c==='"'||c==="'"||c==='`'){q=c;continue}
    if(c==="(")d++; else if(c===")"){d--;if(d===0)return code.indexOf("{",i+1)}
  }
  return -1;
}

function extract(code,name,start){
  const br=bodyStart(code,start); if(br<0)return null;
  let d=0,q=null,te=0,e=false,l=false,b=false;
  for(let i=br;i<code.length;i++){
    const c=code[i],n=code[i+1];
    if(l){if(c==="\n")l=false;continue}
    if(b){if(c==="*"&&n==="/"){b=false;i++}continue}
    if(q){
      if(e){e=false;continue}
      if(c==="\\"){e=true;continue}
      if(q==='`'&&c==="$"&&n==="{"){te++;d++;i++;continue}
      if(q==='`'&&c==="}"&&te>0){te--;d--;continue}
      if(c===q&&te===0)q=null;continue
    }
    if(c==="/"&&n==="/"){l=true;i++;continue}
    if(c==="/"&&n==="*"){b=true;i++;continue}
    if(c==='"'||c==="'"){q=c;continue}
    if(c==='`'){q=c;te=0;continue}
    if(c==="{")d++; else if(c==="}"){d--;if(d===0)return code.slice(start,i+1)}
  }
  return null;
}

export default function petgrowV6SizeInspect(){
  return {
    name:"petgrow-v6-size-inspect",
    enforce:"pre",
    buildStart(){
      const file=path.resolve(process.cwd(),"src/App.jsx");
      const code=fs.readFileSync(file,"utf8");
      const re=/function\s+([A-Za-z_$][\w$]*)\s*\(/g;
      const rows=[]; let m;
      while((m=re.exec(code))){
        const src=extract(code,m[1],m.index);
        if(src) rows.push({name:m[1],bytes:src.length,start:m.index});
      }
      rows.sort((a,b)=>b.bytes-a.bytes);
      console.log("PGV6_TOP "+JSON.stringify(rows.slice(0,45)));
    }
  };
}
