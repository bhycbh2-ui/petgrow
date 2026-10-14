import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function OracleResultDialog({ title, subtitle, onClose, children, actions, lang = 'ko' }) {
  const titleId = useId();
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const scrollY = window.scrollY;
    const body = document.body;
    const original = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, width: '100%', overflow: 'hidden' });
    body.classList.add('pg-oracle-result-open');
    dialog.current?.querySelector('button')?.focus();
    const onKey = event => {
      // The sharing preview is a nested dialog with its own close button.
      if (document.querySelector('.modal-overlay')) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      body.classList.remove('pg-oracle-result-open');
      Object.assign(body.style, original);
      window.scrollTo(0, scrollY);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(<div className="pg-oracle-result-overlay" onPointerDown={event => { if (event.target === event.currentTarget) onClose?.(); }}>
    <section ref={dialog} className="pg-oracle-result-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="pg-oracle-result-header"><div><small>PETGROW · YOUR MOMENT</small><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="pg-oracle-close" aria-label={lang === 'en' ? 'Close result' : '결과 닫기'} onClick={onClose}>×</button></header>
      <div className="pg-oracle-result-scroll">{children}</div>
      <footer className="pg-oracle-result-footer">{actions}<button type="button" className="bg-btn bg-btn-ghost" onClick={onClose}>{lang === 'en' ? 'Done' : '확인'}</button></footer>
    </section>
  </div>, document.body);
}
