import React, { useEffect, useMemo, useRef, useState } from "react";

function safeText(value, lang = "ko", fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    const first = value.find((v) => v != null);
    return first == null ? fallback : safeText(first, lang, fallback);
  }
  if (typeof value === "object") {
    const preferred = value?.[lang] ?? value?.ko ?? value?.en ?? value?.title ?? value?.name ?? value?.label ?? value?.text ?? value?.question;
    if (preferred !== undefined && preferred !== value) return safeText(preferred, lang, fallback);
    return fallback;
  }
  return fallback;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const HOME_MUSIC_CACHE = "petgrow_home_music_cache_v1";

export default function HomeInfoMusicSections({ lang = "ko", onGoView, tips = [] }) {
  const recommendedTips = useMemo(() => {
    const list = Array.isArray(tips) ? tips.filter(Boolean) : [];
    if (!list.length) return [];
    const day = Math.floor(Date.now() / 86400000);
    const start = (day * 3) % list.length;
    return [0, 1, 2].map((i) => list[(start + i) % list.length]).filter(Boolean);
  }, [tips]);

  const [expandedTipKey, setExpandedTipKey] = useState("");
  const [music, setMusic] = useState([]);
  const [playingId, setPlayingId] = useState("");
  const audioRef = useRef(null);
  const loadedTrackIdRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const normalize = (raw) => raw.map((track, i) => ({
      id: safeText(track?.id, lang, String(i)),
      title: safeText(track?.title, lang, lang === "en" ? "Pet Music" : "Pet음악"),
      audioUrl: safeText(track?.audioUrl ?? track?.audio_url, lang, ""),
      playCount: safeNumber(track?.playCount ?? track?.play_count),
      likeCount: safeNumber(track?.likeCount ?? track?.like_count),
    }));

    try {
      const cached = JSON.parse(sessionStorage.getItem(HOME_MUSIC_CACHE) || "null");
      if (cached?.at && Date.now() - cached.at < 10 * 60 * 1000 && Array.isArray(cached.items)) {
        setMusic(normalize(cached.items.slice(0, 3)));
      }
    } catch {}

    const timeoutId = setTimeout(() => controller.abort(), 3500);
    fetch("/api/home-feed", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const raw = Array.isArray(data?.top5) ? data.top5.slice(0, 3) : [];
        setMusic(normalize(raw));
        try { sessionStorage.setItem(HOME_MUSIC_CACHE, JSON.stringify({ at: Date.now(), items: raw })); } catch {}
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      try { controller.abort(); } catch {}
    };
  }, [lang]);

  useEffect(() => () => {
    try { audioRef.current?.pause?.(); } catch {}
    audioRef.current = null;
    loadedTrackIdRef.current = "";
  }, []);

  const go = (view) => {
    if (typeof onGoView === "function") onGoView(view);
  };

  const toggleTip = (key) => setExpandedTipKey((current) => (current === key ? "" : key));

  const recordPlay = (id) => {
    if (!id) return;
    fetch("/api/music?action=play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  const toggleTrack = (track) => {
    const id = safeText(track?.id, lang, "");
    const url = safeText(track?.audioUrl, lang, "");
    if (!id || !url) return;
    const current = audioRef.current;
    const sameTrack = current && loadedTrackIdRef.current === id;

    if (sameTrack) {
      if (!current.paused && !current.ended) {
        current.pause();
        setPlayingId("");
        return;
      }
      const restarting = current.ended;
      if (restarting) { try { current.currentTime = 0; } catch {} }
      current.play().then(() => {
        setPlayingId(id);
        if (restarting) recordPlay(id);
      }).catch(() => setPlayingId(""));
      return;
    }

    try { current?.pause?.(); } catch {}
    const audio = new Audio(url);
    audio.preload = "metadata";
    audioRef.current = audio;
    loadedTrackIdRef.current = id;
    audio.onplay = () => setPlayingId(id);
    audio.onpause = () => { if (!audio.ended) setPlayingId(""); };
    audio.onended = () => setPlayingId("");
    audio.onerror = () => { if (loadedTrackIdRef.current === id) setPlayingId(""); };
    audio.play().then(() => recordPlay(id)).catch(() => setPlayingId(""));
  };

  return (
    <>
      <section className="dash-section" data-home-extra="petinfo">
        <div className="dash-section-head">
          <h2>{lang === "en" ? "Today’s Pet Info" : "오늘의 Pet정보"}</h2>
          <button type="button" className="bg-chip" onClick={() => go("tips")}>{lang === "en" ? "View all" : "전체보기"}</button>
        </div>
        {recommendedTips.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, alignItems: "start" }}>
            {recommendedTips.map((tip, i) => {
              const category = safeText(tip?.category, lang, lang === "en" ? "Pet Info" : "Pet정보");
              const title = safeText(tip?.title ?? tip?.question, lang, lang === "en" ? "Helpful pet information" : "반려생활에 도움되는 정보");
              const answer = safeText(tip?.answer ?? tip?.content ?? tip?.description ?? tip?.body ?? tip?.detail ?? tip?.text, lang, lang === "en" ? "Open Pet Info to see the full details." : "자세한 내용은 Pet정보 전체보기에서 확인할 수 있어요.");
              const key = safeText(tip?.id, lang, `tip-${i}`);
              const expanded = expandedTipKey === key;
              return (
                <div key={key} className="bg-card" style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
                  <button type="button" onClick={() => toggleTip(key)} aria-expanded={expanded} style={{ width: "100%", padding: 16, border: 0, background: "transparent", textAlign: "left", fontFamily: "inherit", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <small style={{ fontWeight: 800, color: "var(--primary)" }}>{category}</small>
                        <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.5, marginTop: 6 }}>{title}</div>
                      </div>
                      <span aria-hidden="true" style={{ flex: "0 0 auto", fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>{expanded ? "⌃" : "⌄"}</span>
                    </div>
                    <small className="bg-sub" style={{ display: "block", marginTop: 7 }}>{expanded ? (lang === "en" ? "Tap to close" : "눌러서 접기") : (lang === "en" ? "Tap to read here" : "홈에서 바로 펼쳐보기")}</small>
                  </button>
                  {expanded && <div style={{ margin: "0 12px 12px", padding: "13px 14px", borderRadius: 12, background: "rgba(255,255,255,.78)", border: "1px solid var(--border)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{answer}</div>}
                </div>
              );
            })}
          </div>
        ) : <button type="button" className="bg-card" onClick={() => go("tips")} style={{ width: "100%", padding: 14, border: "1px solid var(--border)", textAlign: "left", cursor: "pointer" }}><b>{lang === "en" ? "Open Pet Info" : "Pet정보 바로가기"}</b></button>}
      </section>

      <section className="dash-section" data-home-extra="music">
        <div className="dash-section-head">
          <h2>{lang === "en" ? "Popular Pet Music" : "인기 Pet음악"}</h2>
          <button type="button" className="bg-chip" onClick={() => go("music")}>{lang === "en" ? "View all" : "전체보기"}</button>
        </div>
        {music.length > 0 ? (
          <div style={{ display: "grid", gap: 9 }}>
            {music.map((track, i) => {
              const active = playingId === track.id;
              const playable = Boolean(track.audioUrl);
              return (
                <button type="button" key={track.id || `music-${i}`} className={`bg-card home-music-row${active ? " is-playing" : ""}`} onClick={() => toggleTrack(track)} disabled={!playable} aria-label={active ? `${track.title} 일시정지` : `${track.title} 재생`} title={active ? (lang === "en" ? "Pause" : "일시정지") : (lang === "en" ? "Play" : "재생")} style={{ width: "100%", padding: "11px 13px", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "38px minmax(0,1fr) 42px", alignItems: "center", gap: 10, textAlign: "left", fontFamily: "inherit", cursor: playable ? "pointer" : "default", opacity: playable ? 1 : .62 }}>
                  <b style={{ fontSize: 17, textAlign: "center", color: "var(--primary)" }}>{i + 1}</b>
                  <span style={{ minWidth: 0 }}><span style={{ display: "block", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span><small className="bg-sub">▶ {track.playCount.toLocaleString()} · ♥ {track.likeCount.toLocaleString()}</small></span>
                  <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", background: active ? "var(--primary)" : "var(--surface)", color: active ? "#fff" : "var(--primary)", fontWeight: 900 }}>{active ? "❚❚" : "▶"}</span>
                </button>
              );
            })}
          </div>
        ) : <div className="bg-card home-music-loading" style={{ width: "100%", padding: 14, border: "1px solid var(--border)", textAlign: "left" }}><b>{lang === "en" ? "Loading Pet Music…" : "Pet음악을 불러오는 중…"}</b></div>}
      </section>
    </>
  );
}
