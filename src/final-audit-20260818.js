/* PetGrow final functional / i18n / UI audit — 2026-08-18 */
(() => {
  const txt = (el) => (el?.textContent || "").trim();
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => [...root.querySelectorAll(sel)];

  function activeLang() {
    const active = qa('.lang-toggle button').find((b) => b.classList.contains('active'));
    const label = txt(active);
    if (label === 'EN') return 'en';
    if (label === 'JA') return 'ja';
    if (/中文/.test(label)) return 'zh';
    return 'ko';
  }

  function setText(el, value) {
    if (el && txt(el) !== value) el.textContent = value;
  }

  function setDirectButtonText(btn, value) {
    if (!btn) return;
    const nodes = [...btn.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE);
    if (nodes.length) {
      const n = nodes[nodes.length - 1];
      if ((n.nodeValue || '').trim() !== value) n.nodeValue = value;
    } else if (!txt(btn).includes(value)) {
      btn.appendChild(document.createTextNode(value));
    }
  }

  function replaceExact(el, map) {
    if (!el) return;
    const raw = txt(el);
    if (Object.prototype.hasOwnProperty.call(map, raw)) setText(el, map[raw]);
  }

  const CATEGORY_EN = {
    '전체': 'All',
    '동물병원': 'Vet hospitals',
    '동물약국': 'Pet pharmacies',
    '펫샵·용품': 'Pet shops & supplies',
    '펫미용': 'Grooming',
    '호텔·유치원': 'Hotels & day care',
    '더보기': 'More',
    '접기': 'Less'
  };

  const COMMON_UI_EN = {
    '전화': 'Call',
    '카카오맵': 'Kakao Map',
    '이전': 'Previous',
    '다음': 'Next',
    '작성 닫기': 'Close form',
    '후기 남기기': 'Write a review',
    '후기 저장': 'Save review',
    '저장 중…': 'Saving…',
    '취소': 'Cancel',
    '저장': 'Save',
    '✏️ 수정': '✏️ Edit',
    '🗑 삭제': '🗑 Delete',
    '🚩 신고': '🚩 Report',
    '내 후기': 'My review',
    '반려동물 관련': 'Pet service'
  };

  const MESSAGE_EN = new Map([
    ['검색할 주소를 입력해 주세요.', 'Enter an address to search.'],
    ['검색 결과가 없어요. 주소는 인식했지만 주변 업체 정보를 찾지 못했어요. 다른 카테고리를 눌러보거나 주소를 조금 더 구체적으로 입력해 주세요.', 'No places were found nearby. Try another category or enter a more specific address.'],
    ['이 기기에서는 현재 위치를 사용할 수 없어요. 주소 검색은 그대로 이용할 수 있어요.', 'Current location is not available on this device. You can still search by address.'],
    ['이 기기에서는 현재 위치를 사용할 수 없어요. 주소 검색을 이용해 주세요.', 'Current location is not available on this device. Please search by address.'],
    ['지도에 내 위치를 표시하고 있어요…', 'Showing your location on the map…'],
    ['현재 위치 주변을 찾고 있어요…', 'Searching around your current location…'],
    ['위치 권한이 꺼져 있어요. 주소 검색은 사용할 수 있고, 권한을 허용하면 지도에 내 위치와 업체까지의 거리가 표시돼요.', 'Location access is off. Address search still works; allow location access to see your position and distance to places.'],
    ['현재 위치를 확인하지 못했어요. 주소 검색은 그대로 이용할 수 있어요.', 'We could not determine your current location. You can still search by address.'],
    ['현재 위치 검색을 사용하려면 위치 권한을 허용해 주세요. 주소 검색은 그대로 이용할 수 있어요.', 'Allow location access to search around your current location. Address search still works.'],
    ['현재 위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.', 'We could not determine your current location. Please try again shortly.']
  ]);

  function patchNearbyNavEnglish() {
    qa('.petgrow-sidebar-nav .sidebar-section-label').forEach((label) => {
      if (txt(label) !== 'PET LIFE') return;
      const buttons = [];
      let node = label.nextElementSibling;
      while (node && !node.classList?.contains('sidebar-section-label')) {
        if (node.matches?.('button')) buttons.push(node);
        node = node.nextElementSibling;
      }
      const span = buttons[1]?.querySelector('span');
      if (span && !txt(span)) span.textContent = 'Nearby Pet';
    });

    qa('.ham-nav-group').forEach((group) => {
      if (txt(q('.ham-section-label', group)) !== 'PET LIFE') return;
      const span = qa('.ham-nav-item', group)[1]?.querySelector('span');
      if (span && !txt(span)) span.textContent = 'Nearby Pet';
    });

    const desktopLinks = qa('.desktop-nav-links .desktop-nav-link');
    const nearbyDesktop = desktopLinks[3];
    if (nearbyDesktop && !/Nearby Pet/i.test(txt(nearbyDesktop))) {
      let mark = nearbyDesktop.querySelector('.pg-nearby-nav-label');
      if (!mark) {
        mark = document.createElement('span');
        mark.className = 'pg-nearby-nav-label';
        nearbyDesktop.appendChild(mark);
      }
      if (txt(mark) !== 'Nearby Pet') mark.textContent = 'Nearby Pet';
    }
  }

  function patchNearbyHeroEnglish(page) {
    qa('.nearby-hero').forEach((hero) => {
      setText(q('.nearby-eyebrow', hero), 'PETGROW NEARBY');
      setText(q('h1', hero), 'Nearby Pet');
      setText(q('p', hero), 'Find pet hospitals, pharmacies, shops, grooming salons, day care and hotels near an address or your current location.');
    });
    setText(q('.nearby-search-help', q('.nearby-hero', page) || page), '📍 Search by address or use your current location. Allow location access to see your position and distance to each place on the map.');
  }

  function translateDistanceText(value) {
    let s = String(value || '').trim().replaceAll('거리 확인 불가', 'Distance unavailable');
    s = s.replace(/^내 위치에서\s+(.+)$/, '$1 from your location');
    s = s.replace(/^주소에서\s+(.+)$/, '$1 from searched address');
    return s;
  }

  function patchNearbyEnglish() {
    const page = q('.nearby-page');
    if (!page) return;

    patchNearbyHeroEnglish(page);

    const input = q('.nearby-search-row input', page);
    if (input && input.placeholder !== 'Search district, neighborhood, road or street address') input.placeholder = 'Search district, neighborhood, road or street address';

    const addressBtn = q('.nearby-address-search-btn', page);
    if (addressBtn) setText(addressBtn, /검색 중|Searching/.test(txt(addressBtn)) ? 'Searching…' : 'Search');

    const currentBtn = q('.nearby-current-search-btn', page);
    if (currentBtn) setDirectButtonText(currentBtn, /찾는 중|Locating/.test(txt(currentBtn)) ? 'Locating…' : 'Use current location');

    qa('.nearby-responsive-categories button', page).forEach((b) => replaceExact(b, CATEGORY_EN));

    const mapHead = q('.nearby-map-head', page);
    const mapTitle = q('b', mapHead);
    if (mapTitle) {
      const v = txt(mapTitle);
      if (/현재 위치/.test(v)) setText(mapTitle, 'Around your location');
      else if (/검색한 주소|검색 주소/.test(v)) setText(mapTitle, 'Around searched address');
    }
    const mapDesc = q('.nearby-map-description', page);
    if (mapDesc) {
      const v = txt(mapDesc);
      setText(mapDesc, /빨간 점|live location/i.test(v)
        ? 'The red dot is your live location. Select a place to see details.'
        : 'Allow location access to show your position and distance to places on the map.');
    }

    const mapFallback = q('.nearby-map-fallback', page);
    if (mapFallback) {
      setText(q('b', mapFallback), 'Loading the map…');
      setText(q('span', mapFallback), 'Nearby pet places will appear here.');
    }

    const mapButtons = qa('.nearby-map-icon-btn', page);
    if (mapButtons[0]) {
      if (mapButtons[0].getAttribute('aria-label') !== 'Refresh current location') mapButtons[0].setAttribute('aria-label', 'Refresh current location');
      if (mapButtons[0].getAttribute('title') !== 'Refresh current location') mapButtons[0].setAttribute('title', 'Refresh current location');
    }
    if (mapButtons[1]) {
      if (mapButtons[1].getAttribute('aria-label') !== 'Follow live location') mapButtons[1].setAttribute('aria-label', 'Follow live location');
      if (mapButtons[1].getAttribute('title') !== 'Follow live location') mapButtons[1].setAttribute('title', 'Follow live location');
    }

    const resultTitle = q('.nearby-results-head h2', page);
    if (resultTitle) {
      const v = txt(resultTitle);
      if (/현재 위치/.test(v)) setText(resultTitle, 'Places near your location');
      else if (/검색 주소|검색한 주소/.test(v)) setText(resultTitle, 'Places near searched address');
    }
    const resultCount = q('.nearby-results-head>div>span', page);
    if (resultCount) {
      const m = txt(resultCount).match(/^(\d+)곳$/);
      if (m) resultCount.textContent = `${m[1]} places`;
    }
    const resultDetail = q('.nearby-results-detail', page);
    if (resultDetail) {
      let v = txt(resultDetail);
      v = v.replace(/^내 위치에서 가까운 순 · 검색범위\s*/,'Nearest to your location · radius ');
      v = v.replace(/^검색 주소 기준 가까운 순 · 검색범위\s*/,'Nearest to searched address · radius ');
      if (txt(resultDetail) !== v) resultDetail.textContent = v;
    }

    const message = q('.nearby-message', page);
    if (message && MESSAGE_EN.has(txt(message))) message.textContent = MESSAGE_EN.get(txt(message));

    qa('.nearby-place-title strong,.nearby-desktop-distance', page).forEach((el) => {
      const next = translateDistanceText(txt(el));
      if (next !== txt(el)) el.textContent = next;
    });
    qa('.nearby-place-action-buttons a', page).forEach((el) => replaceExact(el, COMMON_UI_EN));

    qa('.nearby-type-badge', page).forEach((el) => {
      let v = txt(el);
      const replacements = {
        '동물병원':'Vet hospital','동물약국':'Pet pharmacy','펫샵·용품':'Pet shop & supplies',
        '펫미용':'Grooming','호텔·유치원':'Hotel & day care','반려동물 관련':'Pet service'
      };
      Object.entries(replacements).forEach(([ko,en]) => { if (v.includes(ko)) v = v.replace(ko,en); });
      if (v !== txt(el)) el.textContent = v;
    });

    const pagination = q('.nearby-pagination', page);
    if (pagination) {
      if (pagination.getAttribute('aria-label') !== 'Nearby Pet pages') pagination.setAttribute('aria-label', 'Nearby Pet pages');
      qa('button', pagination).forEach((el) => replaceExact(el, COMMON_UI_EN));
    }

    const review = q('.nearby-review-panel', page);
    if (review) {
      const headTitle = q('.nearby-review-head h2', review);
      if (headTitle && /\s이용후기$/.test(txt(headTitle))) headTitle.textContent = txt(headTitle).replace(/\s이용후기$/, ' reviews');
      const headSummary = q('.nearby-review-head p', review);
      if (headSummary) {
        const before = headSummary.innerHTML;
        const after = before.replace(/후기\s*(\d+)개/g, '$1 reviews');
        if (before !== after) headSummary.innerHTML = after;
      }
      replaceExact(q('.nearby-review-head>button', review), COMMON_UI_EN);

      qa('.nearby-stars', review).forEach((el) => {
        const label = el.closest('.nearby-review-edit') ? 'Edit rating' : 'Select rating';
        if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
      });
      const compose = q('.nearby-review-compose', review);
      const textarea = q('textarea', compose);
      const placeholder = 'Share a short experience about the facility or service. Profanity, personal information and ads are not allowed.';
      if (textarea && textarea.placeholder !== placeholder) textarea.placeholder = placeholder;
      const composeNote = q('.nearby-review-compose-foot small', review);
      if (composeNote) {
        const count = (txt(composeNote).match(/^\d+\/300/) || ['0/300'])[0];
        setText(composeNote, `${count} · Sign in to write a review.`);
      }
      replaceExact(q('.nearby-review-compose-foot button', review), COMMON_UI_EN);
      qa('.nearby-review-edit-actions button,.nearby-review-actions button,.nearby-review-meta em', review).forEach((el) => replaceExact(el, COMMON_UI_EN));
      qa('.nearby-review-meta small', review).forEach((el) => {
        const v = txt(el).replace(' · 수정됨',' · edited');
        if (v !== txt(el)) el.textContent = v;
      });
      setText(q('.nearby-review-empty', review), 'No reviews yet. Be the first to share your experience 🐾');
    }

    setText(q('.nearby-disclaimer', page), 'Place information is retrieved at search time from official public licensing data and Kakao place information. Please confirm current opening status, address and contact details with the business before visiting. Reviews are opinions written by PetGrow members and are not official business information.');
  }

  function run() {
    const lang = activeLang();
    if (document.documentElement.dataset.pgLang !== lang) document.documentElement.dataset.pgLang = lang;
    if (lang === 'en') {
      patchNearbyNavEnglish();
      patchNearbyEnglish();
    }
  }

  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; run(); });
  };

  const observer = new MutationObserver(schedule);
  function boot() {
    run();
    observer.observe(document.documentElement, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class'] });
    document.addEventListener('click', (e) => { if (e.target?.closest?.('.lang-toggle')) setTimeout(schedule, 0); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
