import React, { useEffect, useRef, useState } from 'react';

export default function DesktopNavigation({ view, lang, onNavigate }) {
  const en = lang === 'en';
  const [open, setOpen] = useState(null);
  const nav = useRef(null);
  const groups = [
    { key: 'fun', label: en ? 'Discover' : 'Pet즐거움', items: [['saju', en ? 'Pet Saju' : 'Pet사주'], ['petbti', 'PetBTI'], ['tarot', en ? 'Pet Tarot' : 'Pet타로'], ['music', en ? 'Pet Music' : 'Pet음악']] },
    { key: 'info', label: en ? 'Pet Info' : 'Pet정보', items: [['tips', en ? 'Pet Info' : 'Pet정보'], ['news', en ? 'Pet News' : 'Pet뉴스'], ['guide', en ? 'Guides' : '정보가이드'], ['nearby', en ? 'Nearby Pet' : '내 주변 Pet']] },
    { key: 'more', label: en ? 'More' : '더보기', items: [['my', en ? 'My Page' : '마이페이지'], ['support', en ? 'Support' : '고객지원'], ['ad-inquiry', en ? 'Advertising' : '광고·제휴']] },
  ];
  useEffect(() => {
    const close = event => { if (!nav.current?.contains(event.target)) setOpen(null); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const go = key => { setOpen(null); onNavigate(key); };
  return <nav ref={nav} className="desktop-nav-links desktop-grouped-nav" aria-label={en ? 'Main navigation' : '주요 메뉴'} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null); }}>
    {[['about', en ? 'About' : '소개'], ['pets', en ? 'My Pet' : '우리 아이'], ['community', en ? 'Community' : 'Pet톡']].map(([key, label]) => <button key={key} type="button" className={`desktop-nav-link ${view === key ? 'active' : ''}`} onMouseEnter={() => setOpen(null)} onClick={() => go(key)}>{label}</button>)}
    {groups.map(group => <div key={group.key} className="desktop-nav-group" onMouseEnter={() => setOpen(group.key)} onMouseLeave={() => { if (!nav.current?.querySelector(`[data-group="${group.key}"]`)?.contains(document.activeElement)) setOpen(null); }} data-group={group.key} onKeyDown={event => { if (event.key === 'Escape') { setOpen(null); event.currentTarget.querySelector('button')?.focus(); } }}>
      <button type="button" className={`desktop-nav-link ${group.items.some(([key]) => key === view) ? 'active' : ''}`} aria-expanded={open === group.key} aria-controls={`desktop-subnav-${group.key}`} onClick={() => setOpen(group.key)}>{group.label}<span className="desktop-nav-chevron" aria-hidden="true">⌄</span></button>
      <div id={`desktop-subnav-${group.key}`} className="desktop-nav-dropdown" hidden={open !== group.key}>
        {group.items.map(([key, label]) => <button key={key} type="button" className={view === key ? 'active' : ''} onClick={() => go(key)}>{label}</button>)}
      </div>
    </div>)}
  </nav>;
}
