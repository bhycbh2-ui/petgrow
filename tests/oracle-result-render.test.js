import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { transform } from 'esbuild';
import split from '../build/petgrow-deep-menu-split-v6-20260821.mjs';
import { transformPetTalkOracle } from '../build/petgrow-pettalk-oracle-fixes-20260904.mjs';

test('lazy Saju result keeps its dialog dependency and renders all result sections', async () => {
  const plugin = split();
  const context = { error(message) { throw new Error(message); } };
  const app = transformPetTalkOracle(fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8'));
  plugin.transform.call(context, app, '/app/src/App.jsx');
  const result = await plugin.load.call(context, plugin.resolveId('virtual:petgrow-v6-saju'));
  const compiled = await transform(result.code + '\nexport function TestResult({deps,input}){__bindDeps(deps);return React.createElement(SajuResultView,{input,onRestart(){}})}', { format: 'cjs', platform: 'node' });
  const module = { exports: {} };
  new Function('require','module','exports',compiled.code)(createRequire(import.meta.url),module,module.exports);
  const t = { sajuResultHeading: n => `${n}의 사주`, sajuOneWordTitle: n => `${n}의 한마디`, sajuCategoryTitle: { personality:'성격',bond:'교감',friends:'친구',food:'식단',play:'놀이',affection:'애정',mischief:'장난',luck:'행운' },sajuShareBtn:'공유',sajuRestartBtn:'다시 보기',sajuDisclaimer:'재미 콘텐츠' };
  const html = renderToString(React.createElement(module.exports.TestResult,{ input:{name:'우리 아이의 아주 긴 이름',species:'dog',birthDate:'2026-07-25'},deps:{ useLang:()=> 'ko',useT:()=>t,josa:n=>n,seededPick:(_s,_salt,items)=>items[0],normalizePetDisplayText:s=>s,ShareIcon:()=>null,Modal:()=>null,OracleResultDialog:({title,children})=>React.createElement('section',{role:'dialog','aria-label':title},children) } }));
  assert.match(html,/role="dialog"/);
  assert.match(html,/Pet사주 결과/);
  for(const label of Object.values(t.sajuCategoryTitle))assert.ok(html.includes(label),label);
});

test('Saju Tarot mode renders the Tarot panel for the selected pet', async () => {
  const plugin = split();const context = {error(message){throw new Error(message)}};
  plugin.transform.call(context,transformPetTalkOracle(fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')),'/app/src/App.jsx');
  const loaded = await plugin.load.call(context,plugin.resolveId('virtual:petgrow-v6-saju'));
  const compiled=await transform(loaded.code,{format:'cjs',platform:'node'});
  let index=0;const initial=[null,'tarot','','',null];const hooks={...React,useState:value=>[index<initial.length?initial[index++]:value,()=>{}]};
  const module={exports:{}};const require=createRequire(import.meta.url);
  new Function('require','module','exports',compiled.code)(name=>name==='react'?hooks:require(name),module,module.exports);
  const html=renderToString(React.createElement(module.exports.default,{pet:{id:'selected-pet',profile:{name:'꼬미',birthDate:'2026-07-25'}},__deps:{useLang:()=> 'ko',useT:()=>({}),hashString:()=>0,petPointKstDate:()=> '2026-10-15',PetTarotPanel:({pet})=>React.createElement('section',{'data-pet':pet.id},'Pet타로')} }));
  assert.match(html,/data-pet="selected-pet"/);assert.match(html,/Pet타로/);
});

test('opening Tarot from the Saju menu navigates to the Tarot page',async()=>{
  const plugin=split();const context={error(message){throw new Error(message)}};
  plugin.transform.call(context,transformPetTalkOracle(fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')),'/app/src/App.jsx');
  const loaded=await plugin.load.call(context,plugin.resolveId('virtual:petgrow-v6-saju'));
  const compiled=await transform(loaded.code,{format:'cjs',platform:'node'});
  const hooks={...React,useState:value=>[value,()=>{}],useMemo:fn=>fn()};
  const module={exports:{}};const require=createRequire(import.meta.url);
  new Function('require','module','exports',compiled.code)(name=>name==='react'?hooks:require(name),module,module.exports);
  let navigated=0;
  const tree=module.exports.default({pet:{id:'qa-pet',profile:{name:'꼬미'}},onGoTarot:()=>navigated++,__deps:{useLang:()=> 'ko',useT:()=>({}),hashString:()=>0,petPointKstDate:()=> '2026-10-15',FeaturePetHeader:()=>null}});
  const find=node=>{if(!node||typeof node!=='object')return null;if(typeof node.type==='function')return find(node.type(node.props));if(node.type==='button'&&JSON.stringify(node.props.children).includes('오늘의 Pet타로'))return node;for(const child of React.Children.toArray(node.props?.children)){const found=find(child);if(found)return found}return null;};
  const button=find(tree);assert.ok(button);button.props.onClick();assert.equal(navigated,1);
});
