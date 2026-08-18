/* PetGrow requested final runtime fixes — 2026-08-18 */
(() => {
  const text = (el) => (el?.textContent || '').trim();

  function fillBlankNearbyInGroup(group, label) {
    if (!group) return;
    const buttons = [...group.querySelectorAll('button')];
    const blank = buttons.find((btn) => {
      const span = btn.querySelector('span');
      return span && !text(span);
    });
    const span = blank?.querySelector('span');
    if (span && !text(span)) span.textContent = label;
  }

  function patchSidebar() {
    document.querySelectorAll('.petgrow-sidebar-nav .sidebar-section-label').forEach((section) => {
      const sectionName = text(section);
      if (sectionName !== 'PET LIFE' && sectionName !== '반려생활') return;
      const wrapper = document.createElement('div');
      let node = section.nextElementSibling;
      const nodes = [];
      while (node && !node.classList?.contains('sidebar-section-label')) {
        nodes.push(node);
        node = node.nextElementSibling;
      }
      nodes.forEach((n) => wrapper.appendChild(n.cloneNode(true)));
      const candidates = nodes.filter((n) => n.matches?.('button'));
      const blank = candidates.find((btn) => {
        const span = btn.querySelector('span');
        return span && !text(span);
      });
      const span = blank?.querySelector('span');
      if (span && !text(span)) span.textContent = sectionName === 'PET LIFE' ? 'Nearby Pet' : '내 주변 Pet';
    });
  }

  function patchHamburger() {
    document.querySelectorAll('.ham-nav-group').forEach((group) => {
      const section = group.querySelector('.ham-section-label');
      const sectionName = text(section);
      if (sectionName !== 'PET LIFE' && sectionName !== '반려생활') return;
      fillBlankNearbyInGroup(group, sectionName === 'PET LIFE' ? 'Nearby Pet' : '내 주변 Pet');
    });
  }

  function patchDesktopLinks() {
    const links = [...document.querySelectorAll('.desktop-nav-links .desktop-nav-link')];
    const blank = links.find((btn) => !text(btn));
    if (!blank) return;
    const nearbyLabel = document.createElement('span');
    nearbyLabel.className = 'pg-nearby-nav-label';
    nearbyLabel.textContent = document.documentElement.dataset.pgLang === 'en' ? 'Nearby Pet' : '내 주변 Pet';
    blank.appendChild(nearbyLabel);
  }

  function run() {
    patchSidebar();
    patchHamburger();
    patchDesktopLinks();
  }

  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; run(); });
  };

  const observer = new MutationObserver(schedule);
  function boot() {
    run();
    observer.observe(document.documentElement, { subtree:true, childList:true, characterData:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
