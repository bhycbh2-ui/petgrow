/* PetGrow final mobile menu link/label alignment — 2026-08-18 */
(() => {
  const LABELS={
    ko:{about:'소개',pets:'우리 아이',nearby:'내 주변 Pet',community:'Pet톡',music:'Pet음악',petbti:'PetBTI',saju:'Pet사주',tarot:'Pet타로',tips:'Pet정보',news:'Pet뉴스'},
    en:{about:'About PetGrow',pets:'My Pets',nearby:'Nearby Pet',community:'Pet Talk',music:'Pet Music',petbti:'PetBTI',saju:'Pet Saju',tarot:'Pet Tarot',tips:'Pet Info',news:'Pet News'}
  };
  const ORDER=[['about','pets','nearby'],['community','music','petbti','saju','tarot'],['tips','news']];

  function lang(){
    const b=[...document.querySelectorAll('.lang-toggle button.active')][0];
    return ((b?.textContent||'KO').trim().toUpperCase()==='EN')?'en':'ko';
  }
  function visibleLabel(span,key){
    if(!span)return;
    span.classList.add('pg-mobile-nav-label');
    span.dataset.pgLabel=(LABELS[lang()]||LABELS.ko)[key]||key;
  }
  function addStyle(){
    if(document.getElementById('pg-mobile-menu-label-style'))return;
    const s=document.createElement('style');
    s.id='pg-mobile-menu-label-style';
    s.textContent=`
      .ham-panel .pg-mobile-nav-label{font-size:0!important;line-height:1!important}
      .ham-panel .pg-mobile-nav-label::after{content:attr(data-pg-label);font-size:15px!important;line-height:1.35!important;font-weight:700!important;color:inherit!important}
    `;
    document.head.appendChild(s);
  }
  function buttons(group){return [...group.querySelectorAll(':scope > .ham-nav-item')];}

  function normalizeOldLayout(groups){
    if(groups.length<3)return;
    const counts=groups.map(g=>buttons(g).length);
    if(counts[0]===3&&counts[1]===4&&counts[2]===3){
      const g0=groups[0],g1=groups[1],g2=groups[2];
      const b0=buttons(g0),b1=buttons(g1),b2=buttons(g2);
      const music=b0[2],about=b2[2],community=b1[0];
      if(about){
        const first=buttons(g0)[0];
        if(first)g0.insertBefore(about,first); else g0.appendChild(about);
      }
      if(music){
        if(community?.nextSibling)g1.insertBefore(music,community.nextSibling); else g1.appendChild(music);
      }
    }
  }

  function patch(){
    const panel=document.querySelector('.ham-panel');
    if(!panel)return;
    addStyle();
    const groups=[...panel.querySelectorAll('.ham-nav-group')];
    normalizeOldLayout(groups);
    const fresh=[...panel.querySelectorAll('.ham-nav-group')];
    fresh.forEach((g,i)=>{
      buttons(g).forEach((btn,j)=>{
        const key=ORDER[i]?.[j];
        if(!key)return;
        btn.dataset.pgNavKey=key;
        visibleLabel(btn.querySelector('span:last-child'),key);
      });
    });
  }

  let raf=0;
  const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;patch();});};
  document.addEventListener('click',(e)=>{
    const t=e.target instanceof Element?e.target:null;
    if(!t)return;
    if(t.closest('.hamburger-btn,.mobile-menu-btn,.lang-toggle button')){
      setTimeout(patch,0);setTimeout(patch,60);setTimeout(patch,180);
    }
  },true);
  const boot=()=>{
    patch();
    const panel=document.querySelector('.ham-panel');
    if(panel){new MutationObserver(schedule).observe(panel,{attributes:true,attributeFilter:['class'],subtree:false});}
    new MutationObserver((m)=>{if(m.some(x=>[...x.addedNodes].some(n=>n instanceof Element&&(n.matches?.('.ham-panel')||n.querySelector?.('.ham-panel')))))setTimeout(patch,0);}).observe(document.documentElement,{subtree:true,childList:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
