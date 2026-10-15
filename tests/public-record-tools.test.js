import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('public/record-tools.js','utf8');
function boot(){
 const nodes=new Map(),blobs=[],downloads=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',hidden:true,events:{},addEventListener(event,fn){this.events[event]=fn},reportValidity:()=>true});return nodes.get(id)};
 const bodyClasses=new Set(),events={};
 const context=vm.createContext({Date,Number,String,Blob,FormData:class {constructor(form){this.form=form}get(key){return this.form.data[key]||''}},setTimeout:fn=>fn(),URL:{createObjectURL:b=>{blobs.push(b);return 'blob:qa'},revokeObjectURL:()=>{}},document:{getElementById:node,querySelector:selector=>node(selector),body:{append:()=>{},classList:{add:c=>bodyClasses.add(c),remove:c=>bodyClasses.delete(c)}},createElement:()=>{const a={click(){downloads.push({href:this.href,download:this.download})},remove(){}};return a}},window:{print:()=>{},addEventListener:(name,fn)=>events[name]=fn}});
 vm.runInContext(source,context);
 const submit=(id,data)=>{const form=node(id);form.data=data;form.events.submit({preventDefault(){}})};
 return {node,submit,blobs,downloads,bodyClasses,events};
}
test('weight tool calculates real differences, rejects invalid dates and clears stale output',()=>{
 const a=boot();const data={previousDate:'2025-10-01',currentDate:'2025-10-15',previousWeight:'4.2',currentWeight:'4'};
 a.submit('weight-form',data);assert.equal(a.node('weight-result').hidden,false);assert.match(a.node('weight-result').textContent,/14일/);assert.match(a.node('weight-result').textContent,/−0.2kg/);assert.match(a.node('weight-result').textContent,/−4.76%/);
 a.node('weight-form').events.input();assert.equal(a.node('weight-result').hidden,true);
 for(const invalid of [{previousWeight:'0'},{previousWeight:'-2'},{previousWeight:'abc'},{currentDate:'2025-09-01'},{currentDate:'2025-02-30'},{currentDate:'2999-01-01'}]){a.submit('weight-form',{...data,...invalid});assert.equal(a.node('weight-result').hidden,true);assert.ok(a.node('weight-error').textContent)}
 a.submit('weight-form',{...data,currentDate:data.previousDate,currentWeight:'4.2'});assert.match(a.node('weight-result').textContent,/0%/);assert.match(a.node('weight-result').textContent,/같은 날/);
});
test('memo preserves input as text, exports UTF-8, invalidates old preview and prints until afterprint',async()=>{
 const a=boot();a.submit('memo-form',{petName:'꼬미',memoDate:'2025-10-15',observation:'<script>not executable</script>',questions:'무엇을 더 기록할까요?'});
 assert.match(a.node('memo-preview').value,/<script>not executable<\/script>/);assert.match(a.node('memo-preview').value,/미기재/);
 a.node('download-memo').events.click();assert.equal(a.downloads.length,1);assert.match(a.downloads[0].download,/\.txt$/);assert.match(await a.blobs[0].text(),/꼬미/);
 a.node('print-memo').events.click();assert.equal(a.bodyClasses.has('pg-printing-memo'),true);assert.equal(a.node('memo-print').textContent,a.node('memo-preview').value);a.events.afterprint();assert.equal(a.bodyClasses.has('pg-printing-memo'),false);
 a.node('memo-form').events.input();assert.equal(a.node('memo-result').hidden,true);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|localStorage|innerHTML/);
});
