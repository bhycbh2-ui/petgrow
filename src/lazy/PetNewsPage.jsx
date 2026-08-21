import React, { useEffect, useState } from "react";

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

export default function PetNewsPage({ lang = "ko", onActivity }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [localized, setLocalized] = useState({});
  const PAGE = 20;
  const cats = ["전체", "반려견", "반려묘", "건강", "정책·제도", "입양·보호", "산업·서비스", "반려동물"];
  const ui = {
    ko: { refresh: "새로고침", search: "뉴스 검색", open: "원문 보기 ↗", empty: "조건에 맞는 뉴스가 없어요." },
    en: { refresh: "Refresh", search: "Search news", open: "Open article ↗", empty: "No matching news." },
    ja: { refresh: "更新", search: "ニュース検索", open: "原文を開く ↗", empty: "該当するニュースがありません。" },
    zh: { refresh: "刷新", search: "搜索新闻", open: "查看原文 ↗", empty: "没有符合条件的新闻。" },
  }[lang] || { refresh: "새로고침", search: "뉴스 검색", open: "원문 보기 ↗", empty: "조건에 맞는 뉴스가 없어요." };
  const loadingTitle = lang === "en" ? "Loading the latest pet news…" : lang === "ja" ? "最新のペットニュースを読み込み中です…" : lang === "zh" ? "正在加载最新宠物新闻…" : "최신 Pet뉴스를 불러오는 중입니다…";
  const loadingCount = lang === "en" ? "Loading news…" : lang === "ja" ? "ニュースを読み込み中です…" : lang === "zh" ? "正在加载新闻…" : "뉴스를 불러오는 중입니다…";
  const catLabel = (c) => ({
    en: { "전체": "All", "반려견": "Dogs", "반려묘": "Cats", "건강": "Health", "정책·제도": "Policy", "입양·보호": "Adoption", "산업·서비스": "Industry", "반려동물": "Pets" },
    ja: { "전체": "すべて", "반려견": "犬", "반려묘": "猫", "건강": "健康", "정책·제도": "制度", "입양·보호": "保護・譲渡", "산업·서비스": "サービス", "반려동물": "ペット" },
    zh: { "전체": "全部", "반려견": "犬", "반려묘": "猫", "건강": "健康", "정책·제도": "政策", "입양·보호": "领养保护", "산업·서비스": "产业服务", "반려동물": "宠物" },
  }[lang]?.[c] || c);
  const clean = (v) => String(v || "").replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/\s+/g, " ").trim();
  const key = (n) => String(n?.id || n?.link || n?.title || "");
  const href = (n) => String(n?.link || n?.naverLink || "");
  const fallback = (n) => /고양이|반려묘/.test(`${n.title} ${n.category}`) ? "🐱" : /강아지|반려견/.test(`${n.title} ${n.category}`) ? "🐶" : /병원|건강|수의/.test(`${n.title} ${n.category}`) ? "🏥" : "📰";

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
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const q = query.trim().toLowerCase();
  const filtered = items.filter((x) => (category === "전체" || x.category === category) && (!q || `${x.title || ""} ${x.source || ""} ${x.category || ""}`.toLowerCase().includes(q)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safe = Math.min(page, pages);
  const pageItems = filtered.slice((safe - 1) * PAGE, safe * PAGE);

  useEffect(() => { setPage(1); }, [category, query]);
  useEffect(() => {
    if (lang === "ko") { setLocalized({}); return undefined; }
    const batch = pageItems.map((x) => ({ id: key(x), title: x.title, description: "" }));
    if (!batch.length) return undefined;
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

  return <div className="petnews-v10 petnews-direct-list">
    <div className="petnews-refresh-row"><span>{items.length ? `${items.length} ${lang === "ko" ? "개의 최신 기사" : ""}` : ""}</span><button className="bg-chip" onClick={load}>{ui.refresh}</button></div>
    <div className="petnews-tools"><div className="petnews-cats">{cats.map((c) => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{catLabel(c)}</button>)}</div><div className="petnews-search"><span>⌕</span><input className="bg-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui.search} /></div></div>
    <div className={`petnews-result-count ${loading ? "loading" : ""}`} role={loading ? "status" : undefined} aria-live="polite">{loading ? loadingCount : `${filtered.length}${lang === "ko" ? "건" : ""}`}</div>
    {loading ? <div className="petnews-state petnews-loading-state" role="status" aria-live="polite" aria-busy="true"><span className="petnews-loading-spinner" aria-hidden="true"></span><b>{loadingTitle}</b><small>{lang === "ko" ? "잠시만 기다려 주세요. 최신 기사와 출처를 확인하고 있어요." : ""}</small></div> : error && !items.length ? <div className="petnews-state error"><b>{error}</b><button className="bg-btn" onClick={load}>{ui.refresh}</button></div> : <>
      <div className="petnews-grid">{pageItems.map((n, i) => {
        const loc = localized[key(n)] || n;
        const url = href(n);
        return <a className="petnews-card-v10 petnews-direct-card" key={key(n) || i} href={url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`${clean(loc.title || n.title)} ${ui.open}`} onClick={() => onActivity?.({ section: "news", action: "article_view", title: n.title, refKey: key(n) })}>
          <div className="petnews-media">{n.image && <img src={n.image} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.add("show"); }} />}<div className={`petnews-image-fallback ${n.image ? "" : "show"}`}><span>{fallback(n)}</span><small>{catLabel(n.category || "반려동물")}</small></div></div>
          <div className="petnews-card-body"><div className="petnews-meta"><span>{catLabel(n.category || "반려동물")}</span><small>{n.source || "Media"}{n.publishedAt ? ` · ${new Date(n.publishedAt).toLocaleDateString()}` : ""}</small></div><h2>{clean(loc.title || n.title)}</h2><span className="petnews-open-link">{ui.open}</span></div>
        </a>;
      })}</div>
      {!pageItems.length && <div className="petnews-state">{ui.empty}</div>}
      {pages > 1 && <ResponsivePagination page={safe} totalPages={pages} lang={lang} onChange={setPage} />}
    </>}
  </div>;
}
