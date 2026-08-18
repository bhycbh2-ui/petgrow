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

  useEffect(() => {
    let cancelled = false;
    let timerId = null;
    let controller = null;

    const load = () => {
      if (cancelled) return;
      controller = new AbortController();
      const timeoutId = setTimeout(() => controller?.abort(), 3000);

      fetch("/api/home-feed", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          const raw = Array.isArray(data?.top5) ? data.top5.slice(0, 3) : [];
          const normalized = raw.map((track, i) => ({
            id: safeText(track?.id, lang, String(i)),
            title: safeText(track?.title, lang, lang === "en" ? "Pet Music" : "Pet음악"),
            audioUrl: safeText(track?.audioUrl ?? track?.audio_url, lang, ""),
            playCount: safeNumber(track?.playCount ?? track?.play_count),
            likeCount: safeNumber(track?.likeCount ?? track?.like_count),
          }));
          setMusic(normalized);
        })
        .catch(() => {})
        .finally(() => clearTimeout(timeoutId));
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      timerId = window.requestIdleCallback(load, { timeout: 1800 });
    } else {
      timerId = setTimeout(load, 1200);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && "cancelIdleCallback" in window && typeof timerId === "number") {
        try { window.cancelIdleCallback(timerId); } catch {}
      } else if (timerId) {
        clearTimeout(timerId);
      }
      try { controller?.abort(); } catch {}
    };
  }, [lang]);

  useEffect(() => {
    return () => {
      try { audioRef.current?.pause?.(); } catch {}
      audioRef.current = null;
    };
  }, []);

  const go = (view) => {
    if (typeof onGoView === "function") onGoView(view);
  };

  const toggleTip = (key) => {
    setExpandedTipKey((current) => (current === key ? "" : key));
  };

  const toggleTrack = (track) => {
    const id = safeText(track?.id, lang, "");
    const url = safeText(track?.audioUrl, lang, "");

    if (!url) {
      go("music");
      return;
    }

    const current = audioRef.current;
    if (current && playingId === id && !current.paused) {
      current.pause();
      setPlayingId("");
      return;
    }

    try { current?.pause?.(); } catch {}

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId("");
    audio.onerror = () => setPlayingId("");
    setPlayingId(id);

    audio.play()
      .then(() => {
        fetch("/api/music?action=play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).catch(() => {});
      })
      .catch(() => setPlayingId(""));
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
              const answer = safeText(
                tip?.answer ?? tip?.content ?? tip?.description ?? tip?.body ?? tip?.detail ?? tip?.text,
                lang,
                lang === "en" ? "Open Pet Info to see the full details." : "자세한 내용은 Pet정보 전체보기에서 확인할 수 있어요."
              );
              const key = safeText(tip?.id, lang, `tip-${i}`);
              const expanded = expandedTipKey === key;

              return (
                <div
                  key={key}
                  className="bg-card"
                  style={{ border: "1px solid var(--border)", overflow: "hidden" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleTip(key)}
                    aria-expanded={expanded}
                    style={{
                      width: "100%",
                      padding: 16,
                      border: 0,
                      background: "transparent",
                      textAlign: "left",
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <small style={{ fontWeight: 800, color: "var(--primary)" }}>{category}</small>
                        <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.5, marginTop: 6 }}>{title}</div>
                      </div>
                      <span aria-hidden="true" style={{ flex: "0 0 auto", fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
                        {expanded ? "⌃" : "⌄"}
                      </span>
                    </div>
                    <small className="bg-sub" style={{ display: "block", marginTop: 7 }}>
                      {expanded
                        ? (lang === "en" ? "Tap to close" : "눌러서 접기")
                        : (lang === "en" ? "Tap to read here" : "홈에서 바로 펼쳐보기")}
                    </small>
                  </button>

                  {expanded && (
                    <div
                      style={{
                        margin: "0 12px 12px",
                        padding: "13px 14px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,.72)",
                        border: "1px solid var(--border)",
                        fontSize: 14,
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <button type="button" className="bg-card" onClick={() => go("tips")} style={{ width: "100%", padding: 14, border: "1px solid var(--border)", textAlign: "left", cursor: "pointer" }}>
            <b>{lang === "en" ? "Open Pet Info" : "Pet정보 바로가기"}</b>
          </button>
        )}
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
              return (
                <div
                  key={track.id || `music-${i}`}
                  className="bg-card"
                  style={{ padding: "11px 13px", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "38px minmax(0,1fr) auto", alignItems: "center", gap: 10 }}
                >
                  <b style={{ fontSize: 17, textAlign: "center", color: "var(--primary)" }}>{i + 1}</b>
                  <button
                    type="button"
                    onClick={() => go("music")}
                    style={{ border: 0, background: "transparent", padding: 0, textAlign: "left", fontFamily: "inherit", cursor: "pointer", minWidth: 0 }}
                  >
                    <span style={{ display: "block", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
                    <small className="bg-sub">▶ {track.playCount.toLocaleString()} · ♥ {track.likeCount.toLocaleString()}</small>
                  </button>
                  <button
                    type="button"
                    className="bg-chip"
                    onClick={() => toggleTrack(track)}
                    aria-label={active ? `${track.title} 일시정지` : `${track.title} 재생`}
                    title={active ? (lang === "en" ? "Pause" : "일시정지") : (lang === "en" ? "Play" : "재생")}
                    style={{ minWidth: 48, fontWeight: 900 }}
                  >
                    {active ? "❚❚" : "▶"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <button type="button" className="bg-card" onClick={() => go("music")} style={{ width: "100%", padding: 14, border: "1px solid var(--border)", textAlign: "left", cursor: "pointer" }}>
            <b>{lang === "en" ? "Open Pet Music" : "Pet음악 바로가기"}</b>
            <small className="bg-sub" style={{ display: "block", marginTop: 4 }}>{lang === "en" ? "Music loads after the home screen is ready." : "홈을 먼저 띄운 뒤 인기 음악만 가볍게 불러와요."}</small>
          </button>
        )}
      </section>
    </>
  );
}
