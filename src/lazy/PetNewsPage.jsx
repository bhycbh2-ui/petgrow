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

function getPageWindow(page, total, size) {
  const current = Math.min(Math.max(1, Number(page) || 1), Math.max(1, Number(total) || 1));
  const count = Math.max(1, Math.min(Number(size) || 1, total));
  let start = Math.max(1, current - Math.floor(count / 2));
  let end = Math.min(total, start + count - 1);
  if (end - start + 1 < count) start = Math.max(1, end - count + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function ResponsivePagination({ page, totalPages, onChange, lang = "ko", disabled = false }) {
  const total = Math.max(1, Number(totalPages) || 1);
  if (total <= 1) return null;
  const mobilePages = getPageWindow(page, total, 4);
  const desktopPages = getPageWindow(page, total, 8);
  const go = (next) => {
    const value = Math.min(total, Math.max(1, Number(next) || 1));
    if (disabled || value === page) return;
    onChange(value);
  };
  const numberButtons = (pages) => pages.map((n) => (
    <button key={n} type="button" className={`responsive-page-number ${page === n ? "active" : ""}`} aria-current={page === n ? "page" : undefined} disabled={disabled} onClick={() => go(n)}>{n}</button>
  ));
  return <nav className="responsive-pagination" aria-label={lang === "en" ? "Pagination" : "페이지 이동"}>
    <button type="button" className="responsive-page-arrow" disabled={disabled || page <= 1} onClick={() => go(page - 1)}>{lang === "en" ? "Prev" : "이전"}</button>
    <span className="responsive-pages-mobile">{numberButtons(mobilePages)}</span>
    <span className="responsive-pages-desktop">{numberButtons(desktopPages)}</span>
    <button type="button" className="responsive-page-arrow" disabled={disabled || page >= total} onClick={() => go(page + 1)}>{lang === "en" ? "Next" : "다음"}</button>
  </nav>;
}

export default function PetNewsPage({ lang = "ko", onActivity }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [localized, setLocalized] = useState({});
  const [detail, setDetail] = useState(null);
  const [reaction, setReaction] = useState({ likeCount: 0, likedByMe: false, comments: [] });
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const detailRef = useRef(null);
  const PAGE = 20;
  const cats = ["전체", "반려견", "반려묘", "건강", "정책·제도", "입양·보호", "산업·서비스", "반려동물"];
  const ui = {
    ko: ["새로고침", "뉴스 검색", "기사 자세히 보기 →", "기사 핵심 요약", "원문 전체보기", "좋아요", "댓글을 남겨보세요", "등록", "조건에 맞는 뉴스가 없어요."],
    en: ["Refresh", "Search news", "Read summary →", "Article summary", "Open original", "Like", "Write a comment", "Post", "No matching news."],
    ja: ["更新", "ニュース検索", "要約を見る →", "記事の要約", "原文を見る", "いいね", "コメントを書く", "投稿", "該当するニュースがありません。"],
    zh: ["刷新", "搜索新闻", "查看摘要 →", "文章摘要", "查看原文", "点赞", "发表评论", "发布", "没有符合条件的新闻。"],
  }[lang] || [];
  const loadingText = lang === "en" ? "Loading the latest Pet news…" : lang === "ja" ? "最新のPetニュースを読み込んでいます…" : lang === "zh" ? "正在加载最新Pet新闻…" : "최신 Pet뉴스를 불러오는 중입니다…";
  const catLabel = (c) => ({
    en: { "전체": "All", "반려견": "Dogs", "반려묘": "Cats", "건강": "Health", "정책·제도": "Policy", "입양·보호": "Adoption", "산업·서비스": "Industry", "반려동물": "Pets" },
    ja: { "전체": "すべて", "반려견": "犬", "반려묘": "猫", "건강": "健康", "정책·제도": "制度", "입양·보호": "保護・譲渡", "산업·서비스": "サービス", "반려동물": "ペット" },
    zh: { "전체": "全部", "반려견": "犬", "반려묘": "猫", "건강": "健康", "정책·제도": "政策", "입양·보호": "领养保护", "산업·서비스": "产业服务", "반려동물": "宠物" },
  }[lang]?.[c] || c);
  const clean = (v) => String(v || "").replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/\s+/g, " ").trim();
  const summary = (v) => {
    const text = clean(v);
    return text ? text.slice(0, 260) : (lang === "en" ? "Open the original for details." : "자세한 내용은 원문에서 확인해 주세요.");
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const json = await apiJson("/api/news");
      const nextItems = Array.isArray(json.items) ? json.items : [];
      setItems(nextItems);
      if (!nextItems.length) setError(json.message || "새 뉴스를 찾고 있어요.");
    } catch (err) {
      setError(err.message || "뉴스를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const q = query.trim().toLowerCase();
  const filtered = items.filter((x) => (category === "전체" || x.category === category) && (!q || `${x.title || ""} ${x.description || ""} ${x.source || ""}`.toLowerCase().includes(q)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safe = Math.min(page, pages);
  const pageItems = filtered.slice((safe - 1) * PAGE, safe * PAGE);

  useEffect(() => { setPage(1); }, [category, query]);
  useEffect(() => {
    if (lang === "ko") { setLocalized({}); return; }
    const batch = pageItems.map((x) => ({ id: String(x.id || x.link), title: x.title, description: x.description }));
    if (!batch.length) return;
    let active = true;
    fetch("/api/news-localize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang, items: batch }) })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!active || !json?.items) return;
        const map = {};
        json.items.forEach((x) => { map[x.id] = x; });
        setLocalized(map);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [lang, safe, category, query, items.length]);

  const key = (n) => String(n?.id || n?.link || n?.title || "");
  const open = (n) => {
    setSelected(n);
    setDetail(null);
    setReaction({ likeCount: 0, likedByMe: false, comments: [] });
    setCommentText("");
    onActivity?.({ section: "news", action: "article_view", title: n.title, refKey: key(n) });
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  useEffect(() => {
    if (!selected) return undefined;
    let alive = true;
    const loc = localized[key(selected)] || selected;
    Promise.all([
      fetch(`/api/news-detail?url=${encodeURIComponent(selected.link || selected.naverLink || "")}&title=${encodeURIComponent(loc.title || "")}&description=${encodeURIComponent(loc.description || "")}&lang=${lang}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/news-community?action=detail&articleKey=${encodeURIComponent(key(selected))}`, { credentials: "include" }).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([detailData, reactionData]) => {
      if (!alive) return;
      setDetail(detailData || { title: loc.title, summary: summary(loc.description) });
      if (reactionData) setReaction(reactionData);
    });
    return () => { alive = false; };
  }, [selected, lang, localized]);

  const like = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const result = await apiJson(`/api/news-community?action=like&articleKey=${encodeURIComponent(key(selected))}`, { method: "POST" });
      setReaction((v) => ({ ...v, likedByMe: result.liked, likeCount: result.likeCount }));
    } catch (err) { window.alert(err.message); }
    finally { setBusy(false); }
  };

  const comment = async () => {
    const text = commentText.trim();
    if (!selected || !text || busy) return;
    setBusy(true);
    try {
      const result = await apiJson(`/api/news-community?action=comment&articleKey=${encodeURIComponent(key(selected))}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text }) });
      setReaction((v) => ({ ...v, comments: [...(v.comments || []), result.comment] }));
      setCommentText("");
    } catch (err) { window.alert(err.message); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await apiJson(`/api/news-community?action=comment&id=${encodeURIComponent(id)}&articleKey=${encodeURIComponent(key(selected))}`, { method: "DELETE" });
      setReaction((v) => ({ ...v, comments: (v.comments || []).filter((x) => x.id !== id) }));
    } catch (err) { window.alert(err.message); }
  };

  const fallback = (n) => /고양이|반려묘/.test(`${n.title} ${n.category}`) ? "🐱" : /강아지|반려견/.test(`${n.title} ${n.category}`) ? "🐶" : /병원|건강|수의/.test(`${n.title} ${n.category}`) ? "🏥" : "🐾";

  return <div className="petnews-v10">
    <div className="petnews-refresh-row"><span>{items.length ? `${items.length} ${lang === "ko" ? "개의 최신 기사" : ""}` : ""}</span><button className="bg-chip" onClick={load}>{ui[0]}</button></div>
    <div className="petnews-tools"><div className="petnews-cats">{cats.map((c) => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{catLabel(c)}</button>)}</div><div className="petnews-search"><span>⌕</span><input className="bg-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui[1]} /></div></div>
    <div className={`petnews-result-count${loading && !items.length ? " is-loading" : ""}`} role={loading && !items.length ? "status" : undefined} aria-live="polite">{loading && !items.length ? loadingText : `${filtered.length} ${lang === "ko" ? "건" : ""}`}</div>
    {loading ? <div className="petnews-state petnews-loading-state" role="status" aria-busy="true"><span className="petnews-loading-spinner" aria-hidden="true">⟳</span><b>{loadingText}</b><small>{lang === "ko" ? "잠시만 기다려주세요." : "Please wait a moment."}</small></div> : error && !items.length ? <div className="petnews-state error"><b>{error}</b><button className="bg-btn" onClick={load}>{ui[0]}</button></div> : <><div className="petnews-grid">{pageItems.map((n, i) => {
      const loc = localized[key(n)] || n;
      return <article className="petnews-card-v10" key={key(n) || i} onClick={() => open(n)}><div className="petnews-media">{n.image && <img src={n.image} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} />}<div className={`petnews-image-fallback ${n.image ? "" : "show"}`}><span>{fallback(n)}</span><small>{catLabel(n.category || "반려동물")}</small></div></div><div className="petnews-card-body"><div className="petnews-meta"><span>{catLabel(n.category || "반려동물")}</span><small>{n.source || "Media"}{n.publishedAt ? ` · ${new Date(n.publishedAt).toLocaleDateString()}` : ""}</small></div><h2>{clean(loc.title || n.title)}</h2><p>{summary(loc.description || n.description)}</p><button type="button">{ui[2]}</button></div></article>;
    })}</div>{!pageItems.length && <div className="petnews-state">{ui[8]}</div>}{pages > 1 && <ResponsivePagination page={safe} totalPages={pages} lang={lang} onChange={setPage} />}</>}
    {selected && <section ref={detailRef} className="bg-card petnews-inline-detail"><div className="petnews-inline-head"><div><small>{catLabel(selected.category || "반려동물")} · {selected.source || "Media"}</small><h2>{detail?.title || localized[key(selected)]?.title || clean(selected.title)}</h2></div><button className="petnews-inline-close" onClick={() => setSelected(null)}>×</button></div><div className="petnews-inline-body"><div><div className="petnews-summary-box"><b>{ui[3]}</b><p>{detail?.summary || summary(localized[key(selected)]?.description || selected.description)}</p></div><p className="petnews-source-note">{lang === "en" ? "PetGrow provides a concise overview based on the public article description. Open the original for full details." : lang === "ja" ? "公開されている記事説明をもとに要点を短くまとめます。詳細は原文をご確認ください。" : lang === "zh" ? "根据公开的新闻简介整理简短要点，详细内容请查看原文。" : "PetGrow는 공개된 기사 설명을 바탕으로 핵심 내용을 짧게 정리해 보여줘요. 세부 내용은 원문에서 확인해 주세요."}</p><a className="bg-btn" href={selected.link || selected.naverLink} target="_blank" rel="noreferrer">{ui[4]}</a></div>{selected.image && <img src={selected.image} alt="" decoding="async" />}</div><div className="petnews-reactions"><div className="petnews-reaction-toolbar"><button className={`petnews-like-btn ${reaction.likedByMe ? "active" : ""}`} disabled={busy} onClick={like}>{reaction.likedByMe ? "♥" : "♡"} {ui[5]} {Number(reaction.likeCount) || 0}</button><span className="bg-sub">💬 {(reaction.comments || []).length}</span></div><div className="petnews-comment-compose"><input className="bg-input" maxLength={500} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={ui[6]} /><button className="bg-btn" disabled={busy || !commentText.trim()} onClick={comment}>{ui[7]}</button></div><div className="petnews-comment-list">{(reaction.comments || []).map((c) => <div className="petnews-comment" key={c.id}><div><b>{c.authorNickname}</b><p>{c.content}</p><small>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</small></div>{c.isOwner && <button onClick={() => del(c.id)}>삭제</button>}</div>)}</div></div></section>}
  </div>;
}
