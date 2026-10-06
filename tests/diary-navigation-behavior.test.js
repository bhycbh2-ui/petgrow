import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
function callback(name,bindings){
 const match=source.match(new RegExp(`  const ${name} = \\(([^)]*)\\) => \\{([\\s\\S]*?)\\n  \\};`));
 assert.ok(match,`${name} exists`);
 return new Function(...Object.keys(bindings),`return (${match[1]}) => {${match[2]}}`)(...Object.values(bindings));
}
test('opening the home diary selects that pet and exits registration mode',()=>{
 const actions=[];
 const open=callback('openDiary',{activeId:{dog:'other',cat:'cat1'},setSpecies:v=>actions.push(['species',v]),persistActive:v=>actions.push(['active',v]),setMode:v=>actions.push(['mode',v]),goView:(v,id)=>actions.push(['view',v,id])});
 open({id:'cat2',species:'cat'});
 assert.deepEqual(actions,[['species','cat'],['active',{dog:'other',cat:'cat2'}],['mode','view'],['view','diary','cat2']]);
});
test('diary writes only the displayed pet even if another species is active',()=>{
 const pets={dog:[{id:'dog1',photos:[]}],cat:[{id:'cat1',photos:[]},{id:'cat2',photos:[]}]};let saved;
 const update=callback('updateCurrentPet',{view:'diary',diaryPet:{id:'cat2',species:'cat'},currentPet:pets.dog[0],species:'dog',pets,persistPets:v=>saved=v});
 update(p=>({...p,photos:[{id:'photo'}]}));
 assert.equal(saved.dog,pets.dog);assert.equal(saved.cat[0],pets.cat[0]);assert.equal(saved.cat[1].photos.length,1);
});
test('regular pet updates keep targeting the active pet',()=>{
 const pets={dog:[{id:'dog1',photos:[]}],cat:[{id:'cat1',photos:[]}]};let saved;
 callback('updateCurrentPet',{view:'pets',diaryPet:{id:'cat1',species:'cat'},currentPet:pets.dog[0],species:'dog',pets,persistPets:v=>saved=v})(p=>({...p,photos:[{id:'photo'}]}));
 assert.equal(saved.dog[0].photos.length,1);assert.equal(saved.cat,pets.cat);
});
test('empty diary never attempts to update an absent pet',()=>{
 callback('updateCurrentPet',{view:'diary',diaryPet:null,currentPet:null,species:'dog',pets:{dog:[],cat:[]},persistPets:()=>assert.fail('must not save')})(()=>assert.fail('must not update'));
});

test('diary refresh chooses the pet from the URL before the default active pet',()=>{
 const expression=source.match(/  const diaryPet = ([^;]+);/)[1];
 const choose=new Function('allPets','diaryPetId','currentPet',`return ${expression}`);
 const dog={id:'dog1',species:'dog'},cat={id:'cat1',species:'cat'};
 assert.equal(choose([dog,cat],'cat1',dog),cat);
 assert.equal(choose([dog,cat],'deleted-id',dog),dog);
});
