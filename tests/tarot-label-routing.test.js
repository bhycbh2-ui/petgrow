import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {transformWithEsbuild} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const runtime=fs.readFileSync('src/runtime-fixes-20260818.js','utf8');
const labels=runtime.slice(runtime.indexOf('const PG_COPY'),runtime.indexOf('const HERO_COPY'));
const navigation=runtime.slice(runtime.indexOf('function translateNavButton'),runtime.indexOf('function inferHeroKey'));

test('reordered sidebar and hamburger preserve feature routing labels in every language',()=>{
  for(const lang of ['ko','en','ja','zh']){
    const names=['Pet톡','Pet음악','PetBTI','Pet사주','Pet타로','마이페이지'];
    const buttons=names.map(text=>{const span={textContent:text};return {span,querySelector:()=>span}});
    const group={querySelector:()=>null};
    const context=vm.createContext({document:{querySelector:selector=>({querySelectorAll:selector=>selector.includes('group')?[group]:selector.includes('section')?[]:buttons})},buttonSpan:b=>b.span,setText:(node,value)=>{if(node&&typeof value==='string')node.textContent=value}});
    vm.runInContext(labels+`\nfunction copy(){return PG_COPY.${lang};}\n`+navigation+'\napplySidebar();applyHamburger();',context);
    const expected=vm.runInContext(`['talk','music','bti','saju','tarot','my'].map(k=>PG_COPY.${lang}[k])`,context);
    // 'My page' is intentionally left to React; no positional rewrite is allowed.
    assert.deepEqual(buttons.slice(0,5).map(b=>b.span.textContent),Array.from(expected).slice(0,5));
    assert.equal(buttons[5].span.textContent,'마이페이지');
  }
});

test('legacy Saju labels cannot replace Tarot result and saved-history topic titles',async()=>{
  const source=fs.readFileSync('src/PetDailyWidgets.jsx','utf8');
  const topics=source.slice(source.indexOf('const TAROT_TOPICS'),source.indexOf('const CARD_BACKS'));
  const fn=source.slice(source.indexOf('export function PetDailyHistory'),source.indexOf('export const PET_DAILY_CSS'));
  const compiled=await transformWithEsbuild(topics+'\n'+fn.replace('export function','function'),'fixture.jsx');
  const row={id:'tarot-1',pet_name:'꼬미',content_type:'tarot',result_json:{topicKey:'bond',topicLabel:'Pet사주',name:'태양',meaning:'따뜻한 하루'},content_date:'2026-10-15'};
  let state=0;
  const context=vm.createContext({React,useState:()=>[state++===0?[row]:true,()=>{}],useEffect:()=>{}});
  const History=vm.runInContext(compiled.code+'\nPetDailyHistory;',context);
  const html=renderToStaticMarkup(React.createElement(History,{account:{id:'qa'}}));
  assert.match(html,/보호자 궁합 타로/);assert.doesNotMatch(html,/Pet사주/);
  assert.doesNotMatch(source.slice(source.indexOf('{phase==="result"'),source.indexOf('export function TodayPetHomeCard')),/result\.topicLabel/);
});

test('actual Tarot result uses the selected topic even when a saved record says Saju',async()=>{
  const source=fs.readFileSync('src/PetDailyWidgets.jsx','utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','');
  const compiled=await transformWithEsbuild(source,'PetDailyWidgets.jsx');
  for(const [key,label] of [['daily','오늘의 Pet타로'],['bond','보호자 궁합 타로'],['heart','우리 아이 마음 타로'],['activity','산책·활동 타로'],['advice','오늘의 조언 타로']]){
    const values=[key,'result',{topicLabel:'Pet사주',name:'태양',symbol:'☀️',key:'sun',cardId:19},'qa-record','',false,-1,{},false,false];let index=0;
    const context=vm.createContext({React,useState:initial=>[index<values.length?values[index++]:initial,()=>{}],useRef:value=>({current:value}),useEffect:()=>{},OracleResultDialog:({title,children})=>React.createElement('section',{'aria-label':title},children)});
    const Panel=vm.runInContext(compiled.code+'\nPetTarotPanel;',context);
    const html=renderToStaticMarkup(React.createElement(Panel,{pet:{id:'qa-pet',profile:{name:'꼬미'}}}));
    assert.ok(html.includes(`aria-label="${label}"`));assert.doesNotMatch(html,/Pet사주/);
  }
});
