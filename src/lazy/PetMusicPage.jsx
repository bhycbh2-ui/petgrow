import React, { useEffect, useRef, useState } from "react";

async function apiJson(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  let data = null;
  try { data = await res.json(); } catch {}
  if (data?.pointEvent?.awarded) {
    window.dispatchEvent(new CustomEvent("petgrow:points", { detail: { amount: data.pointEvent.awarded, balance: data.pointEvent.balance, label: data.pointEvent.label || "PetPoint 적립" } }));
  }
  if (data?.pointEvent?.spent) {
    window.dispatchEvent(new CustomEvent("petgrow:points", { detail: { amount: -data.pointEvent.spent, balance: data.pointEvent.balance, label: data.pointEvent.label || "PetPoint 사용" } }));
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `요청을 처리하지 못했어요. (${res.status})`);
  return data || {};
}

function musicApi(action, options = {}) { return apiJson(`/api/music?action=${action}`, options); }
function musicList(species = "all", page = 1) { return musicApi(`list&species=${encodeURIComponent(species)}&page=${page}`); }
function musicTrackPlay(id) { return musicApi("play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); }
function musicToggleLike(id) { return musicApi("like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); }
function musicComments(id) { return musicApi(`comments&id=${encodeURIComponent(id)}`); }
function musicAddComment(id, content) { return musicApi("comment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content }) }); }
function musicUpdateComment(commentId, content) { return musicApi("comment-update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId, content }) }); }
function musicDeleteComment(commentId) { return musicApi("comment-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId }) }); }
function musicReportComment(commentId, detail) { return musicApi("comment-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId, reason: "other", detail }) }); }

function getPageWindow(page, total, size) {
  const current = Math.min(Math.max(1, Number(page) || 1), Math.max(1, Number(total) || 1));
  const count = Math.max(1, Math.min(Number(size) || 1, total));
  let start = Math.max(1, current - Math.floor(count / 2));
  let end = Math.min(total, start + count - 1);
  if (end - start + 1 < count) start = Math.max(1, end - count + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function ResponsivePagination({ page, totalPages, onChange, lang = "ko" }) {
  const total = Math.max(1, Number(totalPages) || 1);
  if (total <= 1) return null;
  const mobilePages = getPageWindow(page, total, 4);
  const desktopPages = getPageWindow(page, total, 8);
  const go = (next) => {
    const value = Math.min(total, Math.max(1, Number(next) || 1));
    if (value === page) return;
    onChange(value);
  };
  const numberButtons = (pages) => pages.map((n) => <button key={n} type="button" className={`responsive-page-number ${page === n ? "active" : ""}`} aria-current={page === n ? "page" : undefined} onClick={() => go(n)}>{n}</button>);
  return <nav className="responsive-pagination" aria-label={lang === "en" ? "Pagination" : "페이지 이동"}>
    <button type="button" className="responsive-page-arrow" disabled={page <= 1} onClick={() => go(page - 1)}>{lang === "en" ? "Prev" : "이전"}</button>
    <span className="responsive-pages-mobile">{numberButtons(mobilePages)}</span>
    <span className="responsive-pages-desktop">{numberButtons(desktopPages)}</span>
    <button type="button" className="responsive-page-arrow" disabled={page >= total} onClick={() => go(page + 1)}>{lang === "en" ? "Next" : "다음"}</button>
  </nav>;
}

export default function PetMusicPage({ account, lang = "ko" }) {
  const [species, setSpecies] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], top5: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState("one");
  const [openComments, setOpenComments] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [editingMusicCommentId, setEditingMusicCommentId] = useState(null);
  const [editingMusicCommentText, setEditingMusicCommentText] = useState("");
  const audioRef = useRef(null);
  const musicCacheRef = useRef(window.__petgrowMusicCache || (window.__petgrowMusicCache = new Map()));

  const load = async (sp = species, pg = page) => {
    const cacheKey = `${sp}:${pg}`;
    const cached = musicCacheRef.current.get(cacheKey);
    if (cached) { setData(cached); setLoading(false); return; }
    setLoading(true);
    try {
      const next = await musicList(sp, pg);
      if ((next?.items || []).length || Number(next?.total || 0) > 0) musicCacheRef.current.set(cacheKey, next);
      else musicCacheRef.current.delete(cacheKey);
      setData(next);
    } catch (err) {
      console.error(err);
      musicCacheRef.current.delete(cacheKey);
      setData({ items: [], top5: [], pages: 1, total: 0 });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(species, page); }, [species, page]);
  useEffect(() => () => {
    try { audioRef.current?.pause?.(); } catch {}
  }, []);

  const playTrack = async (track) => {
    setCurrent(track);
    setPlaying(true);
    musicTrackPlay(track.id).catch(() => {});
    setTimeout(() => audioRef.current?.play().catch(() => setPlaying(false)), 0);
  };
  const togglePlay = (track) => {
    if (current?.id !== track.id) return playTrack(track);
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().then(() => setPlaying(true)).catch(() => {});
    else { audio.pause(); setPlaying(false); }
  };
  const onEnded = () => {
    if (!current) return;
    if (repeatMode === "one") {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    if (repeatMode === "all" && data.items.length) {
      const index = data.items.findIndex((x) => x.id === current.id);
      const next = data.items[(index + 1 + data.items.length) % data.items.length];
      if (next) playTrack(next);
      return;
    }
    setPlaying(false);
  };
  const cycleRepeat = () => setRepeatMode((x) => x === "one" ? "all" : x === "all" ? "off" : "one");
  const likedTracks = data.items.filter((x) => x.liked);

  const doLike = async (track) => {
    if (!account) { window.alert(lang === "en" ? "Please log in to like a track." : "좋아요는 로그인 후 이용할 수 있어요."); return; }
    const before = !!track.liked;
    const patch = (x) => x.id === track.id ? { ...x, liked: !before, like_count: Math.max(0, Number(x.like_count || 0) + (before ? -1 : 1)) } : x;
    setData((d) => ({ ...d, items: d.items.map(patch), top5: d.top5.map(patch) }));
    try {
      const result = await musicToggleLike(track.id);
      setData((d) => ({ ...d, items: d.items.map((x) => x.id === track.id ? { ...x, liked: !!result.liked } : x), top5: d.top5.map((x) => x.id === track.id ? { ...x, liked: !!result.liked } : x) }));
    } catch (err) {
      setData((d) => ({ ...d, items: d.items.map((x) => x.id === track.id ? { ...x, liked: before, like_count: Number(track.like_count || 0) } : x), top5: d.top5.map((x) => x.id === track.id ? { ...x, liked: before, like_count: Number(track.like_count || 0) } : x) }));
      window.alert(err.message);
    }
  };

  const toggleComments = async (track) => {
    if (openComments === track.id) { setOpenComments(null); return; }
    setOpenComments(track.id);
    try {
      const result = await musicComments(track.id);
      setComments((c) => ({ ...c, [track.id]: result.items || [] }));
    } catch { setComments((c) => ({ ...c, [track.id]: [] })); }
  };

  const addComment = async (track) => {
    const text = commentText.trim();
    if (!account) { window.alert(lang === "en" ? "Please log in to comment." : "댓글은 로그인 후 이용할 수 있어요."); return; }
    if (!text) return;
    const temp = { id: `temp-${Date.now()}`, nickname: account?.name || "나", content: text, is_owner: true, created_at: new Date().toISOString() };
    setCommentText("");
    setComments((c) => ({ ...c, [track.id]: [...(c[track.id] || []), temp] }));
    setData((d) => ({ ...d, items: d.items.map((x) => x.id === track.id ? { ...x, comment_count: Number(x.comment_count || 0) + 1 } : x), top5: d.top5.map((x) => x.id === track.id ? { ...x, comment_count: Number(x.comment_count || 0) + 1 } : x) }));
    try {
      await musicAddComment(track.id, text);
      const result = await musicComments(track.id);
      setComments((c) => ({ ...c, [track.id]: result.items || [] }));
    } catch (err) {
      setComments((c) => ({ ...c, [track.id]: (c[track.id] || []).filter((x) => x.id !== temp.id) }));
      setData((d) => ({ ...d, items: d.items.map((x) => x.id === track.id ? { ...x, comment_count: Math.max(0, Number(x.comment_count || 0) - 1) } : x), top5: d.top5.map((x) => x.id === track.id ? { ...x, comment_count: Math.max(0, Number(x.comment_count || 0) - 1) } : x) }));
      window.alert(err.message);
    }
  };

  const startEditMusicComment = (comment) => { setEditingMusicCommentId(comment.id); setEditingMusicCommentText(comment.content || ""); };
  const cancelEditMusicComment = () => { setEditingMusicCommentId(null); setEditingMusicCommentText(""); };
  const saveMusicComment = async (track, comment) => {
    const text = editingMusicCommentText.trim();
    if (!text) return;
    const old = comment.content;
    setComments((x) => ({ ...x, [track.id]: (x[track.id] || []).map((v) => v.id === comment.id ? { ...v, content: text, updated_at: new Date().toISOString() } : v) }));
    cancelEditMusicComment();
    try { await musicUpdateComment(comment.id, text); }
    catch (err) {
      setComments((x) => ({ ...x, [track.id]: (x[track.id] || []).map((v) => v.id === comment.id ? { ...v, content: old } : v) }));
      window.alert(err.message);
    }
  };
  const deleteMusicComment = async (track, comment) => {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    const before = comments[track.id] || [];
    setComments((x) => ({ ...x, [track.id]: (x[track.id] || []).filter((v) => v.id !== comment.id) }));
    setData((d) => ({ ...d, items: d.items.map((x) => x.id === track.id ? { ...x, comment_count: Math.max(0, Number(x.comment_count || 0) - 1) } : x), top5: d.top5.map((x) => x.id === track.id ? { ...x, comment_count: Math.max(0, Number(x.comment_count || 0) - 1) } : x) }));
    try { await musicDeleteComment(comment.id); }
    catch (err) {
      setComments((x) => ({ ...x, [track.id]: before }));
      setData((d) => ({ ...d, items: d.items.map((x) => x.id === track.id ? { ...x, comment_count: Number(x.comment_count || 0) + 1 } : x), top5: d.top5.map((x) => x.id === track.id ? { ...x, comment_count: Number(x.comment_count || 0) + 1 } : x) }));
      window.alert(err.message);
    }
  };
  const reportMusicComment = async (comment) => {
    if (!account) { window.alert("신고는 로그인 후 이용할 수 있어요."); return; }
    const detail = window.prompt("신고 사유를 간단히 입력해 주세요. (욕설·광고·개인정보·허위정보 등)", "부적절한 내용");
    if (detail === null) return;
    try {
      const result = await musicReportComment(comment.id, detail);
      window.alert(result.already ? "이미 신고한 댓글이에요." : "신고가 접수됐어요. 운영진이 확인할게요.");
    } catch (err) { window.alert(err.message); }
  };

  const speciesLabel = (x) => x === "dog" ? (lang === "en" ? "Dog" : "강아지") : x === "cat" ? (lang === "en" ? "Cat" : "고양이") : (lang === "en" ? "All" : "전체");
  const vocalLabel = (x) => x === "vocal" ? (lang === "en" ? "Vocal" : "🎤 보컬") : (lang === "en" ? "Instrumental" : "🎼 인스트루멘탈");
  const moodLabel = (x) => ({ relax: lang === "en" ? "Relax" : "😌 휴식", sleep: lang === "en" ? "Sleep" : "🌙 수면", play: lang === "en" ? "Play" : "🐾 놀이", nature: lang === "en" ? "Nature" : "🌿 자연" }[x] || (lang === "en" ? "Relax" : "😌 휴식"));

  return <div className="petmusic-page">
    <section className="petmusic-hero"><small style={{ fontWeight: 900, color: "var(--primary)" }}>PETGROW SOUND</small><h1>{lang === "en" ? "Pet Music" : "Pet음악"}</h1><p className="bg-sub">{lang === "en" ? "Music for dogs and cats. Loop favorites and share your pet's reaction with likes and comments." : "강아지·고양이를 위한 음악을 편하게 듣고 반복재생해보세요. 인스트루멘탈을 중심으로 제공하고 좋아요와 댓글로 우리 아이의 반응도 함께 남겨요."}</p></section>
    <div className="petmusic-tabs">{["all", "dog", "cat"].map((x) => <button key={x} className={species === x ? "active" : ""} onClick={() => { setSpecies(x); setPage(1); }}>{x === "dog" ? "🐶 " : x === "cat" ? "🐱 " : "🎧 "}{speciesLabel(x)}</button>)}</div>
    {!!likedTracks.length && <><h2 style={{ fontSize: 18, margin: "0 0 12px" }}>❤️ {lang === "en" ? "My liked music" : "내가 좋아요 누른 음악"}</h2><div className="petmusic-top5">{likedTracks.slice(0, 5).map((x) => <button key={x.id} className="petmusic-rank" onClick={() => playTrack(x)}><div>{x.cover_url ? <img src={x.cover_url} alt="" loading="lazy" decoding="async" /> : <div className="petmusic-rank-cover">🎵</div>}</div><b>{x.title}</b><small>♥ {Number(x.like_count) || 0} · 💬 {Number(x.comment_count) || 0}</small></button>)}</div></>}
    {!!data.top5.length && <><h2 style={{ fontSize: 18, margin: "0 0 12px" }}>🏆 {lang === "en" ? "Popular TOP 5" : "인기 TOP 5"}</h2><div className="petmusic-top5">{data.top5.map((x, i) => <button key={x.id} className="petmusic-rank" onClick={() => playTrack(x)}><div style={{ position: "relative" }}>{x.cover_url ? <img src={x.cover_url} alt="" loading="lazy" decoding="async" /> : <div className="petmusic-rank-cover">🎵</div>}<span style={{ position: "absolute", left: 7, top: 7, width: 24, height: 24, borderRadius: 99, display: "grid", placeItems: "center", background: "rgba(255,255,255,.93)", fontSize: 11, fontWeight: 900 }}>#{i + 1}</span></div><b>{x.title}</b><small>♥ {Number(x.like_count) || 0} · 💬 {Number(x.comment_count) || 0}</small></button>)}</div></>}
    {current && <div className="bg-card" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, padding: 12, position: "sticky", top: 8, zIndex: 4 }}>{current.cover_url ? <img src={current.cover_url} alt="" style={{ width: 52, height: 52, borderRadius: 13, objectFit: "cover" }} /> : <div className="petmusic-rank-cover" style={{ width: 52, height: 52, flex: "0 0 52px", fontSize: 22 }}>🎵</div>}<div style={{ flex: 1, minWidth: 0 }}><b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.title}</b><small className="bg-sub">{playing ? (lang === "en" ? "Playing now" : "재생 중") : (lang === "en" ? "Paused" : "일시정지")}</small></div><button className="petmusic-play" onClick={() => togglePlay(current)}>{playing ? "Ⅱ" : "▶"}</button><button className={`petmusic-loop ${repeatMode !== "off" ? "active" : ""}`} onClick={cycleRepeat}>{repeatMode === "one" ? "🔂 1곡" : repeatMode === "all" ? "🔁 전체" : "↪ 반복 OFF"}</button></div>}
    <audio ref={audioRef} src={current?.audio_url || ""} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={onEnded} />
    {loading ? <div className="bg-card" style={{ textAlign: "center" }} role="status" aria-busy="true">음악을 불러오는 중...</div> : data.items.length ? <div className="petmusic-grid">{data.items.map((track) => <article className="petmusic-card" key={track.id}>{track.cover_url ? <img className="petmusic-cover" src={track.cover_url} alt={`${track.title} cover`} loading="lazy" decoding="async" /> : <div className="petmusic-cover">🎵</div>}<div style={{ minWidth: 0 }}><div className="petmusic-title">{track.title}</div><div className="petmusic-date">{speciesLabel(track.species)} · {new Date(track.created_at).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR")}</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}><span className="cm-cat-chip" style={{ margin: 0, fontSize: 10 }}>{vocalLabel(track.vocal_type)}</span><span className="cm-cat-chip" style={{ margin: 0, fontSize: 10 }}>{moodLabel(track.mood)}</span></div>{track.description && <div className="bg-sub" style={{ fontSize: 11, marginTop: 5, lineHeight: 1.45 }}>{track.description}</div>}<div className="petmusic-player"><button className="petmusic-play" onClick={() => togglePlay(track)}>{current?.id === track.id && playing ? "Ⅱ" : "▶"}</button><span className="bg-sub" style={{ fontSize: 10 }}>▶ {Number(track.play_count) || 0}</span></div><div className="petmusic-actions"><button className={track.liked ? "liked" : ""} onClick={() => doLike(track)}>♥ {Number(track.like_count) || 0}</button><button onClick={() => toggleComments(track)}>💬 {Number(track.comment_count) || 0}</button></div>{openComments === track.id && <div className="petmusic-comments">{(comments[track.id] || []).slice(0, 20).map((comment) => <div className={`petmusic-comment-row ${comment.is_owner ? "mine" : ""}`} key={comment.id}><div className="petmusic-comment-head"><b>{comment.nickname || "PetGrow"}</b><small>{comment.updated_at && comment.updated_at !== comment.created_at ? "수정됨" : ""}</small></div>{editingMusicCommentId === comment.id ? <div className="petmusic-comment-edit"><input value={editingMusicCommentText} onChange={(e) => setEditingMusicCommentText(e.target.value)} maxLength={300} /><div><button onClick={cancelEditMusicComment}>취소</button><button onClick={() => saveMusicComment(track, comment)}>저장</button></div></div> : <p>{comment.content}</p>}<div className="petmusic-comment-actions">{comment.is_owner ? <><button onClick={() => startEditMusicComment(comment)}>수정</button><button className="danger" onClick={() => deleteMusicComment(track, comment)}>삭제</button></> : <button onClick={() => reportMusicComment(comment)}>🚩 신고</button>}</div></div>)}<div className="petmusic-comment-form"><input value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={300} placeholder={lang === "en" ? "How did your pet react?" : "우리 아이 반응을 남겨주세요"} /><button onClick={() => addComment(track)}>등록</button></div></div>}</div></article>)}</div> : <div className="bg-card" style={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 36, marginBottom: 8 }}>🎵</div><b>{lang === "en" ? "No music has been uploaded yet." : "아직 등록된 음악이 없어요."}</b></div>}
    <ResponsivePagination page={page} totalPages={data.pages} lang={lang} onChange={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
  </div>;
}
