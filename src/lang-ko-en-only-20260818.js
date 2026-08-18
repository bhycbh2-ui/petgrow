/* PetGrow language policy: Korean + English only. */
function normalizePetGrowLanguage(){
  const toggles=[...document.querySelectorAll('.lang-toggle')];
  for(const toggle of toggles){
    const buttons=[...toggle.querySelectorAll('button')];
    const ko=buttons.find(b=>(b.textContent||'').trim().toUpperCase()==='KO');
    const active=buttons.find(b=>b.classList.contains('active'));
    const activeText=(active?.textContent||'').trim().toUpperCase();
    if(active && activeText!=='KO' && activeText!=='EN' && ko){
      ko.click();
    }
    buttons.forEach(b=>{
      const text=(b.textContent||'').trim().toUpperCase();
      if(text!=='KO' && text!=='EN'){
        b.hidden=true;
        b.setAttribute('aria-hidden','true');
        b.tabIndex=-1;
      }
    });
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    normalizePetGrowLanguage();
    setTimeout(normalizePetGrowLanguage,250);
    setTimeout(normalizePetGrowLanguage,900);
  },{once:true});
}else{
  normalizePetGrowLanguage();
  setTimeout(normalizePetGrowLanguage,250);
  setTimeout(normalizePetGrowLanguage,900);
}
