import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

// Exercise the actual handlers with deterministic DB/storage substitutes.
// No live credentials, user sessions, database writes or uploads are used.
function load(path, dependencies, names=["handler"]) {
  const source=fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8")
    .replace(/^import\s[\s\S]*?;\r?\n/gm,"")
    .replace(/export default /g,"").replace(/export (?=(?:async )?function|const)/g,"");
  return new Function(...Object.keys(dependencies),`${source}\nreturn {${names.join(",")}};`)(...Object.values(dependencies));
}
function response(){return {statusCode:200,body:null,setHeader(){},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};}
const silent={warn(){},error(){}};
function admin(role="operator"){
  let reads=0;
  const functions=load("server_lib/admin.js",{
    crypto,Buffer,process:{env:{SESSION_SECRET:"test-only-secret-000000000000000000000"}},
    ensureAuthSchema:async()=>{},ensureSchema:async()=>{},
    sql:async()=>{reads++;return {rows:[{role}]};}
  },["requireAdminCapability","issueToken","verifyToken"]);
  return {...functions,reads:()=>reads};
}

test("operational endpoints reject unauthenticated and missing-PIN requests before DB or backup work",async()=>{
  for(const file of ["admin-overview-lite","admin-data-health","admin-backup-run","admin-backup-verify"]){
    for(const uid of [null,"test-user"]){
      const a=admin();let work=0;
      const {handler}=load(`api/${file}.js`,{
        getSessionUserId:()=>uid,requireAdminCapability:a.requireAdminCapability,
        sql:async()=>{work++;throw Error("Unexpected DB call");},console:silent,
        logAdmin:async()=>{},ensureSchema:async()=>{work++;},ensurePetLifeAutomationSchema:async()=>{work++;},
        getBackupStatus:async()=>{work++;},createEncryptedBackup:async()=>{work++;},
        verifyLatestEncryptedBackup:async()=>{work++;},getPetLifeServerStats:async()=>{work++;}
      });
      const res=response();await handler({method:file.includes("backup")?"POST":"GET",headers:{},query:{}},res);
      assert.equal(res.statusCode,uid?403:401,file);assert.equal(work,0,file);assert.equal(a.reads(),0,file);
    }
  }
});

test("PIN grant is user-bound, expires, and still requires the requested role",async()=>{
  const a=admin();const token=a.issueToken("test-user");
  assert.equal(a.verifyToken(token,"other-user"),false);
  assert.equal(await a.requireAdminCapability({headers:{"x-petgrow-admin-token":token}},response(),"test-user","service"),"operator");
  const restricted=admin("report"),res=response();
  assert.equal(await restricted.requireAdminCapability({headers:{"x-petgrow-admin-token":token}},res,"test-user","service"),null);
  assert.equal(res.statusCode,403);
  const body=Buffer.from(JSON.stringify({uid:"test-user",exp:Date.now()-1})).toString("base64url");
  const signature=crypto.createHmac("sha256","test-only-secret-000000000000000000000").update(body).digest("base64url");
  assert.equal(a.verifyToken(`${body}.${signature}`,"test-user"),false);
});

test("operations overview includes all three report sources",async()=>{
  const {handler}=load("api/admin-overview-lite.js",{
    getSessionUserId:()=>"test-user",requireAdminCapability:async()=>"operator",getPetLifeServerStats:async()=>({}),
    sql:async(parts)=>({rows:parts.join("").includes("community_open")?[{community_open:2,music_open:3,places_open:4}]:[{total_members:8}]})
  });const res=response();await handler({method:"GET",headers:{}},res);
  assert.equal(res.statusCode,200);assert.equal(res.body.moderation.totalOpen,9);assert.equal(res.body.moderation.placesOpen,4);
});

test("Korean scheduled publication survives opening and saving in different time zones",()=>{
  const moduleUrl=new URL("../src/local-datetime.js",import.meta.url).href;
  for(const [tz,expected] of [["Asia/Seoul","2026-09-10T09:30"],["UTC","2026-09-10T00:30"],["America/New_York","2026-09-09T20:30"]]){
    const result=JSON.parse(execFileSync(process.execPath,["--input-type=module","-e",`import {toLocalDateTimeInput} from ${JSON.stringify(moduleUrl)};const value=toLocalDateTimeInput('2026-09-10T00:30:00.000Z');console.log(JSON.stringify({value,iso:new Date(value).toISOString(),invalid:toLocalDateTimeInput('invalid')}));`],{env:{...process.env,TZ:tz},encoding:"utf8"}));
    assert.equal(result.value,expected);assert.equal(result.iso,"2026-09-10T00:30:00.000Z");assert.equal(result.invalid,"");
  }
});

test("daily, weekly and monthly report timestamp queries use Korean midnight",async()=>{
  for(const period of ["daily","weekly","monthly"]){
    const queries=[];
    const {handler}=load("api/admin.js",{
      crypto,getSessionUserId:()=>"test-user",ensureSchema:async()=>{},getAdminRole:async()=>"operator",
      verifyToken:()=>true,roleCan:()=>true,console:silent,
      sql:async(parts,...values)=>{const query=parts.join("?");queries.push({query,values});return {rows:query.includes("start_day")?[{start_day:"2026-09-01",end_day:"2026-09-08"}]:[{}]};}
    });const res=response();await handler({method:"GET",headers:{},query:{action:"report-summary",period}},res);
    assert.equal(res.statusCode,200);
    const timestampQueries=queries.filter(x=>x.query.includes("created_at>="));assert.ok(timestampQueries.length>=5);
    for(const q of timestampQueries){assert.ok(q.values.includes("2026-09-01T00:00:00+09:00"));assert.ok(q.values.includes("2026-09-08T00:00:00+09:00"));assert.match(q.query,/::timestamptz/);}
  }
});

test("adding an existing administrator cannot overwrite the highest role",async()=>{
  let insert="",logged=false;
  const {handler}=load("api/admin.js",{
    crypto,getSessionUserId:()=>"test-user",ensureSchema:async()=>{},getAdminRole:async()=>"superadmin",verifyToken:()=>true,roleCan:()=>true,console:silent,
    sql:async(parts)=>{insert=parts.join("?");return {rows:[]};},logAdmin:async()=>{logged=true;}
  });const res=response();await handler({method:"POST",headers:{},query:{action:"admin-add"},body:{userId:"existing-admin",role:"operator"}},res);
  assert.equal(res.statusCode,409);assert.match(insert,/on conflict\(user_id\) do nothing/);assert.equal(logged,false);
});

test("diary cleanup preserves shared photos and files when reference lookup fails",async()=>{
  for(const state of [true,false,"error"]){
    let deleted=0;
    const {safeDeleteBlob}=load("api/petlife.js",{console:silent,sql:async()=>{if(state==="error")throw Error("DB unavailable");return {rows:[{referenced:state}]};},blobDel:async()=>{deleted++;}},["safeDeleteBlob"]);
    await safeDeleteBlob("https://test.public.blob.vercel-storage.com/petphoto.jpg");assert.equal(deleted,state===false?1:0);
    await safeDeleteBlob("https://example.com/photo.jpg");assert.equal(deleted,state===false?1:0);
  }
});

test("failed pet deletion does not delete any photograph first",async()=>{
  let deletes=0;
  const {handler}=load("api/petlife.js",{
    crypto,console:silent,getSessionUserId:()=>"test-user",ensureAuthSchema:async()=>{},blobDel:async()=>{deletes++;},
    sql:async(parts)=>{const q=parts.join("?");if(q.startsWith("delete from pg_pets"))throw Error("write failed");if(q.includes("select * from pg_pets"))return {rows:[{id:"pet",photo_url:"https://test.public.blob.vercel-storage.com/photo.jpg"}]};return {rows:[]};}
  });const res=response();await handler({method:"POST",headers:{},query:{action:"pet-delete"},body:{petId:"pet"}},res);
  assert.equal(res.statusCode,500);assert.equal(deletes,0);
});

test("retired points cannot charge or block content, even with no database",async()=>{
  const {spendPoints,POINT_COSTS}=load("server_lib/points.js",{crypto,sql:()=>{throw Error("Must not access point database");}},["spendPoints","POINT_COSTS"]);
  for(const feature of Object.keys(POINT_COSTS)){assert.equal(POINT_COSTS[feature],0);assert.equal((await spendPoints("test-user",feature,10,"ref")).spent,0);}
});
