import React, { useRef, useState } from 'react';

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function DiaryNotebook({ entries = [], onSave, onDelete, lang = 'ko' }) {
  const en = lang === 'en';
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const input = useRef(null);
  const pending = useRef(false);
  const reset = () => { setText(''); setDate(today()); setEditing(null); };
  const submit = async event => {
    event.preventDefault();
    if (pending.current || !text.trim()) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const ok = await onSave({ id: editing || crypto.randomUUID(), date, text: text.trim() });
      if (!ok) throw new Error('save');
      reset(); setMessage(en ? 'Entry saved.' : '일기를 저장했어요.');
    } catch { setError(en ? 'Could not save. Your draft is still here. Please try again.' : '저장하지 못했어요. 작성한 글은 그대로 있으니 다시 시도해주세요.'); }
    finally { pending.current = false; setBusy(false); }
  };
  const remove = async entry => {
    if (pending.current || !window.confirm(en ? 'Delete this diary entry?' : '이 일기를 삭제할까요?')) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      if (!await onDelete(entry.id)) throw new Error('delete');
      if (editing === entry.id) reset();
      setMessage(en ? 'Entry deleted.' : '일기를 삭제했어요.');
    } catch { setError(en ? 'Could not delete. Please try again.' : '삭제하지 못했어요. 다시 시도해주세요.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return <div className="memory-notebook">
    <form className="memory-notebook-compose" onSubmit={submit}>
      <h4>{editing ? (en ? 'Edit your entry' : '일기 수정') : (en ? 'How was today?' : '오늘 하루는 어땠나요?')}</h4>
      <label className="memory-notebook-date">{en ? 'Date' : '날짜'}<input type="date" value={date} onChange={event => setDate(event.target.value)} required disabled={busy} /></label>
      <label className="memory-notebook-label" htmlFor="pet-diary-text">{en ? 'Diary entry' : '오늘의 일기'}</label>
      <textarea id="pet-diary-text" ref={input} value={text} onChange={event => { setText(event.target.value); setMessage(''); }} maxLength={1000} required disabled={busy} rows={5} placeholder={en ? 'A walk, a meal, a cute moment… Write a few words, with or without a photo.' : '산책, 밥, 귀여웠던 순간… 사진 없이 글만 남겨도 좋아요.'} />
      <div className="memory-notebook-actions"><small>{text.length}/1,000</small><div>{editing && <button type="button" className="bg-btn bg-btn-ghost" disabled={busy} onClick={() => { reset(); setError(''); }}>{en ? 'Cancel' : '취소'}</button>}<button type="submit" className="bg-btn" disabled={busy || !text.trim()}>{busy ? (en ? 'Saving…' : '처리 중…') : (en ? 'Save entry' : '일기 저장')}</button></div></div>
    </form>
    {error && <p role="alert" className="memory-notebook-error">{error}</p>}
    <p role="status" className="bg-sub">{message}</p>
    {entries.length > 0 && <div className="memory-notebook-entries"><h4>{en ? 'Our diary' : '차곡차곡 쌓인 일기'}</h4>{[...entries].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '')).map(entry => <article key={entry.id} className="memory-notebook-entry"><time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(en ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</time><p>{entry.text}</p><div className="memory-notebook-entry-actions"><button type="button" className="bg-btn bg-btn-ghost" disabled={busy} onClick={() => { if (text.trim() && !window.confirm(en ? 'Replace your current draft?' : '작성 중인 글 대신 이 일기를 수정할까요?')) return; setEditing(entry.id); setDate(entry.date); setText(entry.text); setError(''); setMessage(''); input.current?.focus(); }}>{en ? 'Edit' : '수정'}</button><button type="button" className="bg-btn bg-btn-ghost" disabled={busy} onClick={() => remove(entry)}>{en ? 'Delete' : '삭제'}</button></div></article>)}</div>}
  </div>;
}
