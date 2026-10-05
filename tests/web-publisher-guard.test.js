import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function eligibility({ pathname='/', search='', native=false, splash=false, article=null }={}) {
  const context=vm.createContext({
    location:{pathname,search},
    window:{Capacitor:{isNativePlatform:()=>native}},
    document:{readyState:'loading',addEventListener(){},getElementById:()=>splash?{}:null,querySelector:()=>article},
    MutationObserver:class {observe(){}},
  });
  const source=fs.readFileSync('src/adsense-review-20260822.js','utf8').replaceAll('export function','function');
  vm.runInContext(source,context);
  return vm.runInContext('isContentSafeView()',context);
}
const reviewed={hidden:false,textContent:'가'.repeat(1200),getAttribute:()=>null,querySelectorAll:()=>[1,2,3]};

test('web ads fail closed on SPA tools, authentication, news feeds and empty content',()=>{
  for(const pathname of ['/','/login','/admin','/news','/404','/pet-guide.html'])
    assert.equal(eligibility({pathname,article:reviewed}),false,pathname);
  assert.equal(eligibility({pathname:'/guides/walk-routine.html'}),false);
});
test('native shell and loading article cannot qualify for web ads',()=>{
  const base={pathname:'/guides/walk-routine.html',article:reviewed};
  assert.equal(eligibility({...base,native:true}),false);
  assert.equal(eligibility({...base,search:'?app_version=1.7.4'}),false);
  assert.equal(eligibility({...base,splash:true}),false);
  assert.equal(eligibility({...base,article:{...reviewed,getAttribute:()=> 'true'}}),false);
  assert.equal(eligibility({...base,article:{...reviewed,textContent:'짧은 소개'}}),false);
  assert.equal(eligibility(base),true);
});
