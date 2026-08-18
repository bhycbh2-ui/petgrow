/* PetGrow AAB-ready runtime form fixes — 2026-08-18 */
(() => {
  const PENDING_KEY = '__pgPendingPetWeightEdit';
  let pending = null;
  let reloadTimer = 0;

  const text = (el) => (el?.textContent || '').trim();
  const isPositiveWeight = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

  function getPending(){ return pending || window[PENDING_KEY] || null; }
  function setPending(v){ pending = v; window[PENDING_KEY] = v; }

  function speciesFromRoot(root){
    const s = text(root);
    if (/고양이|cat/i.test(s) && !/강아지|dog/i.test(s)) return 'cat';
    if (/강아지|dog/i.test(s)) return 'dog';
    const active = document.querySelector('.pets-page-top button[aria-pressed="true"], .pets-page-top button.active');
    return /고양이|cat/i.test(text(active)) ? 'cat' : 'dog';
  }

  function findEditRoot(label){
    let p = label?.parentElement;
    for(let i=0; p && i<9; i++, p=p.parentElement){
      const body = text(p);
      const hasEditCopy = /정보를\s*수정해요|Save changes|Edit/i.test(body);
      const hasSave = [...p.querySelectorAll('button')].some(b => /저장하기|Save changes|保存/.test(text(b)));
      if(hasEditCopy && hasSave) return p;
    }
    return null;
  }

  async function readState(key){
    try{
      const raw = localStorage.getItem(key);
      if(raw) return JSON.parse(raw);
    }catch{}
    try{
      const r = await fetch(`/api/state?key=${encodeURIComponent(key)}`, {credentials:'include'});
      if(r.ok){ const j=await r.json(); return j?.value ?? null; }
    }catch{}
    return null;
  }

  async function resolveCurrentPet(species){
    const [ids,list] = await Promise.all([
      readState('bboggl:activeIds'),
      readState(species==='cat'?'bboggl:cats':'bboggl:dogs')
    ]);
    const pets = Array.isArray(list) ? list : [];
    const activeId = ids?.[species];
    return pets.find(p => String(p?.id)===String(activeId)) || pets[0] || null;
  }

  function patchPetList(value, p){
    if(!p || !isPositiveWeight(p.weight) || !Array.isArray(value)) return value;
    const w = Number(p.weight);
    let changed = false;
    const next = value.map(pet => {
      if(String(pet?.id)!==String(p.petId)) return pet;
      changed = true;
      const profile = {...(pet.profile||{}), initialWeightKg:w};
      let records = Array.isArray(pet.records) ? pet.records.map(r=>({...r})) : [];
      if(records.length){
        records[records.length-1] = {...records[records.length-1], weightKg:w};
      }else{
        records = [{id:'initial', date:new Date().toISOString().slice(0,10), weightKg:w}];
      }
      return {...pet, profile, records};
    });
    return changed ? next : value;
  }

  function scheduleReload(){
    clearTimeout(reloadTimer);
    reloadTimer = window.setTimeout(() => window.location.reload(), 900);
  }

  /* Patch React's existing state persistence so edit-mode weight is actually saved. */
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function(input, init){
    let nextInit = init;
    try{
      const url = typeof input==='string' ? input : input?.url || '';
      const method = String(init?.method || (typeof input!=='string' ? input?.method : '') || 'GET').toUpperCase();
      const p = getPending();
      if(p && method==='PUT' && /\/api\/state(?:\?|$)/.test(url) && typeof init?.body==='string'){
        const body = JSON.parse(init.body);
        const targetKey = p.species==='cat' ? 'bboggl:cats' : 'bboggl:dogs';
        if(body?.key===targetKey){
          const patched = patchPetList(body.value, p);
          nextInit = {...init, body:JSON.stringify({...body, value:patched})};
        }
      }
    }catch{}
    const res = await nativeFetch(input, nextInit);
    try{
      const p = getPending();
      const url = typeof input==='string' ? input : input?.url || '';
      const method = String(nextInit?.method || (typeof input!=='string' ? input?.method : '') || 'GET').toUpperCase();
      if(p && res.ok && method==='PUT' && /\/api\/state(?:\?|$)/.test(url)){
        const body = typeof nextInit?.body==='string' ? JSON.parse(nextInit.body) : null;
        const targetKey = p.species==='cat' ? 'bboggl:cats' : 'bboggl:dogs';
        if(body?.key===targetKey) scheduleReload();
      }
    }catch{}
    return res;
  };

  /* Logged-out/local fallback. */
  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value){
    try{
      const p = getPending();
      const targetKey = p?.species==='cat' ? 'bboggl:cats' : 'bboggl:dogs';
      if(p && key===targetKey){
        const parsed = JSON.parse(value);
        value = JSON.stringify(patchPetList(parsed,p));
        scheduleReload();
      }
    }catch{}
    return nativeSetItem.call(this,key,value);
  };

  function enhanceDateInputs(scope=document){
    scope.querySelectorAll('input[type="date"]').forEach(input=>{
      if(input.dataset.pgFullDatePicker==='1') return;
      input.dataset.pgFullDatePicker='1';
      input.classList.add('pg-pet-date-input');
      input.addEventListener('click', () => {
        try{ if(typeof input.showPicker==='function') input.showPicker(); }catch{}
      });
      input.addEventListener('keydown', e => {
        if((e.key==='Enter'||e.key===' ') && typeof input.showPicker==='function'){
          try{ input.showPicker(); e.preventDefault(); }catch{}
        }
      });
    });
  }

  function markWeightInputs(scope=document){
    scope.querySelectorAll('label.bg-label').forEach(label=>{
      if(!/현재\s*체중\s*\(kg\)|Current weight \(kg\)/i.test(text(label))) return;
      const input = label.parentElement?.querySelector('input');
      if(input) input.classList.add('pg-pet-weight-input');
    });
  }

  async function ensureEditWeightField(){
    const birthLabels=[...document.querySelectorAll('label.bg-label')].filter(l=>/^(생년월일|Birth date)$/i.test(text(l)));
    for(const label of birthLabels){
      const root=findEditRoot(label);
      if(!root || root.querySelector('.pg-edit-weight-field')) continue;
      const species=speciesFromRoot(root);
      const pet=await resolveCurrentPet(species);
      if(!pet) continue;
      const currentWeight = pet.records?.length
        ? pet.records[pet.records.length-1]?.weightKg
        : pet.profile?.initialWeightKg;
      const field=document.createElement('div');
      field.className='pg-edit-weight-field';
      const lab=document.createElement('label');
      lab.className='bg-label';
      const isEnglish=/Birth date/i.test(text(label));
      lab.textContent=isEnglish?'Current weight (kg)':'현재 체중 (kg)';
      const input=document.createElement('input');
      input.type='number'; input.min='0.1'; input.step='0.1'; input.inputMode='decimal';
      input.className='bg-input pg-pet-weight-input';
      input.placeholder=isEnglish?(species==='cat'?'e.g. 0.6':'e.g. 1.1'):(species==='cat'?'예: 0.6':'예: 1.1');
      if(isPositiveWeight(currentWeight)) input.value=String(currentWeight);
      const update=()=>{
        const w=Number(input.value);
        if(isPositiveWeight(w)) setPending({species,petId:pet.id,weight:w});
      };
      input.addEventListener('input',update);
      input.addEventListener('change',update);
      field.append(lab,input);
      label.parentElement?.insertAdjacentElement('afterend',field);
    }
  }

  function run(){
    enhanceDateInputs();
    markWeightInputs();
    ensureEditWeightField().catch(()=>{});
  }

  let raf=0;
  const schedule=()=>{ if(raf)return; raf=requestAnimationFrame(()=>{raf=0;run();}); };
  const observer=new MutationObserver(schedule);
  function boot(){ run(); observer.observe(document.documentElement,{subtree:true,childList:true}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
