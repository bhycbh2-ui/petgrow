/* PetGrow About page PetPoint placement — 2026-08-19 */
(() => {
  let raf = 0;

  const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();

  function placeAboutPetPoint() {
    const aboutRoot = document.querySelector(".landing-root");
    const card = document.querySelector(".petpoint-about");
    if (!aboutRoot || !card) return;

    const trustBlocks = [...aboutRoot.querySelectorAll(".landing-trust")];
    const trust = trustBlocks.find((el) => /참고용\s*성장\s*데이터|reference\s*growth\s*data/i.test(text(el))) || trustBlocks[0];
    const trustSection = trust?.closest(".landing-section");
    if (!trustSection || !trustSection.parentElement) return;

    if (card.nextElementSibling !== trustSection || card.parentElement !== trustSection.parentElement) {
      trustSection.parentElement.insertBefore(card, trustSection);
    }
    card.classList.add("pg-about-petpoint-inline");
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      placeAboutPetPoint();
    });
  }

  function boot() {
    placeAboutPetPoint();
    const root = document.getElementById("root") || document.body;
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
