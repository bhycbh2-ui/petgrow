import "./petlife-mobile-form-v2.css";

const prepared = new WeakSet();
let raf = 0;

function prepareRecordSheets(){
  document.querySelectorAll("#petlife-react-root .pl-modal").forEach((modal)=>{
    const save = modal.querySelector(".pl-save");
    if(!save) return;
    modal.classList.add("pl-record-modal-v2");
    if(prepared.has(modal)) return;
    prepared.add(modal);

    /* React's autoFocus opens the iOS keyboard as soon as a record sheet appears.
       Close only that initial automatic focus; later user taps are left untouched. */
    requestAnimationFrame(()=>{
      const active = document.activeElement;
      if(active && modal.contains(active) && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)){
        try{ active.blur(); }catch(_){ }
      }
      const form = modal.querySelector(".pl-form");
      if(form) form.scrollTop = 0;
    });
  });
}

const observer = new MutationObserver(()=>{
  if(raf) return;
  raf = requestAnimationFrame(()=>{
    raf = 0;
    prepareRecordSheets();
  });
});
observer.observe(document.documentElement,{childList:true,subtree:true});
prepareRecordSheets();
