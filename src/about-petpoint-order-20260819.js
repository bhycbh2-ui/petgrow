/* PetGrow About page PetPoint placement — 2026-08-19 */
(() => {
  let raf = 0;
  const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();

  function placeAboutPetPoint() {
    const aboutRoot = document.querySelector(".landing-root");
    const source = document.querySelector(".petpoint-about:not(.pg-about-petpoint-clone)");
    const existing = document.querySelector(".pg-about-petpoint-section");
    if (!aboutRoot || !source) { existing?.remove(); return; }

    const trustBlocks = [...aboutRoot.querySelectorAll(".landing-trust")];
    const trust = trustBlocks.find((el) => /참고용\s*성장\s*데이터|reference\s*growth\s*data/i.test(text(el))) || trustBlocks[0];
    const trustSection = trust?.closest(".landing-section");
    if (!trustSection || !trustSection.parentElement) return;

    source.classList.add("pg-about-petpoint-source");
    let section = existing;
    if (!section) {
      section = document.createElement("section");
      section.className = "landing-section pg-about-petpoint-section";
      const wrap = document.createElement("div");
      wrap.className = "landing-wrap";
      const clone = source.cloneNode(true);
      clone.classList.remove("pg-about-petpoint-source");
      clone.classList.add("pg-about-petpoint-clone");
      wrap.appendChild(clone);
      section.appendChild(wrap);
    }
    if (section.nextElementSibling !== trustSection || section.parentElement !== trustSection.parentElement) {
      trustSection.parentElement.insertBefore(section, trustSection);
    }
  }

  function schedule(){ if(raf)return; raf=requestAnimationFrame(()=>{raf=0;placeAboutPetPoint();}); }
  function boot(){ placeAboutPetPoint(); new MutationObserver(schedule).observe(document.getElementById("root")||document.body,{subtree:true,childList:true}); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
})();
