/* PetGrow final visual/interaction batch — 2026-08-19 */
(() => {
  let raf = 0;
  const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
  const norm = (v) => String(v || "").toLowerCase().replace(/\s+/g, "");

  const infoClass = (label) => {
    const s = norm(label);
    if (/반려견|강아지|dog/.test(s)) return "dog";
    if (/반려묘|고양이|cat/.test(s)) return "cat";
    if (/건강|health/.test(s)) return "health";
    if (/식단|영양|사료|food|nutrition/.test(s)) return "food";
    if (/훈련|training/.test(s)) return "training";
    if (/안전|safety/.test(s)) return "safety";
    if (/미용|위생|groom/.test(s)) return "grooming";
    if (/생활|life/.test(s)) return "life";
    return "life";
  };

  const newsClass = (label) => {
    const s = norm(label);
    if (/건강|health/.test(s)) return "health";
    if (/정책|제도|policy/.test(s)) return "policy";
    if (/입양|보호|adoption/.test(s)) return "adoption";
    if (/산업|서비스|industry/.test(s)) return "industry";
    if (/반려견|강아지|dog/.test(s)) return "dog";
    if (/반려묘|고양이|cat/.test(s)) return "cat";
    return "pets";
  };

  function clearPrefix(el, prefix){ [...el.classList].filter(c=>c.startsWith(prefix)).forEach(c=>el.classList.remove(c)); }

  function colorInfo(){
    document.querySelectorAll(".result-columns .bg-surface-card, .tips-page .bg-surface-card, [data-home-extra='petinfo'] .bg-card").forEach(card=>{
      const label = text(card.querySelector(".tip-question-meta .bg-sub, small"));
      clearPrefix(card,"pg-info-");
      card.classList.add(`pg-info-${infoClass(label)}`);
    });
  }

  function colorNews(){
    document.querySelectorAll(".petnews-card-v10").forEach(card=>{
      clearPrefix(card,"pg-news-");
      card.classList.add(`pg-news-${newsClass(text(card.querySelector(".petnews-meta span")))}`);
    });
    const home = document.querySelector(".petgrow-dashboard-home");
    if (!home) return;
    [...home.querySelectorAll(".dash-section")].forEach(section=>{
      const heading=text(section.querySelector(".dash-section-head h2"));
      if(!/Pet뉴스|Pet News/i.test(heading)) return;
      section.querySelectorAll("button.bg-card").forEach(card=>{
        clearPrefix(card,"pg-news-");
        card.classList.add(`pg-news-${newsClass(text(card.querySelector("small")))}`);
      });
    });
  }

  function centerPetBtiIntro(){
    document.querySelectorAll(".feature-module-shell p.bg-sub").forEach(p=>{
      if(/평소 행동 몇 가지만|성격 유형을 찾아|tell us a few|personality/i.test(text(p))) p.classList.add("pg-petbti-main-desc");
    });
  }

  function phoneHref(raw){
    const cleaned=String(raw||"").replace(/^\s*☎\s*/,"").trim();
    const phone=cleaned.replace(/[^0-9+]/g,"");
    return phone.length>=7?`tel:${phone}`:"";
  }

  function enhancePhones(){
    document.querySelectorAll(".nearby-place-meta span").forEach(span=>{
      if(!/^\s*☎/.test(text(span))) return;
      const href=phoneHref(text(span));
      if(!href)return;
      span.classList.add("pg-nearby-phone-link");
      span.setAttribute("role","link"); span.setAttribute("tabindex","0"); span.setAttribute("aria-label",`${text(span).replace(/^\s*☎\s*/,"")} 전화하기`);
      if(span.dataset.pgPhoneBound==="1")return;
      span.dataset.pgPhoneBound="1";
      const call=(e)=>{e.preventDefault();e.stopPropagation();window.location.href=href;};
      span.addEventListener("click",call);
      span.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")call(e);});
    });

    document.querySelectorAll(".leaflet-popup-content div").forEach(div=>{
      const value=text(div);
      if(!/^☎/.test(value)||div.querySelector("a[href^='tel:']"))return;
      const href=phoneHref(value);if(!href)return;
      const a=document.createElement("a");a.href=href;a.className="pg-map-popup-phone";a.textContent=value;div.replaceChildren(a);
    });
  }

  function decorateTouchTargets(){
    document.querySelectorAll(".nearby-place-actions a[href^='tel:']").forEach(a=>{a.classList.add("pg-call-button");a.textContent=/전화/.test(a.textContent)?a.textContent:"☎ 전화";});
  }

  function run(){colorInfo();colorNews();centerPetBtiIntro();enhancePhones();decorateTouchTargets();}
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;run();});}
  function boot(){run();new MutationObserver(schedule).observe(document.getElementById("root")||document.body,{subtree:true,childList:true});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
