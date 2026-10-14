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
