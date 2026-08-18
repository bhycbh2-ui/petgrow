import React, { useEffect, useMemo, useRef, useState } from "react";

const MUSIC_CACHE_KEY = "petgrow_home_music_top5_v1";

function readCachedMusic() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MUSIC_CACHE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export default function HomeInfoMusicSections({ lang = "ko", onGoView, tips = [] }) {
  const recommendedTips = useMemo(() => {
    const list = Array.isArray(tips) ? tips.filter(Boolean) : [];
    if (!list.length) return [];
    const day = Math.floor(Date.now() / 86400000);
    const start = (day * 3) % list.length;
    return [0, 1, 2].map((i) => list[(start + i) % list.length]).filter(Boolean);
  }, [tips]);

  const [music, setMusic] = useState(() => readCachedMusic());
  const [playingId, setPlayingId] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    fetch("/api/home-feed", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const next = Array.isArray(data?.top5) ? data.top5.slice(0, 5) : [];
        if (next.length) {
          setMusic(next);
          try { localStorage.setItem(MUSIC_CACHE_KEY, JSON.stringify(next)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
      try { audioRef.current?.pause?.(); } catch {}
    };
  }, []);

  const toggleTrack = (track) => {
    const id = track?.id ?? track?.title ?? "";
    const url = track?.audioUrl || track?.audio_url || "";
    if (!url) return;

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
          body: JSON.stringify({ id: track.id }),
        }).catch(() => {});
      })
      .catch(() => setPlayingId(""));
  };

  const go = (view) => {
    if (typeof onGoView === "function") onGoView(view);
  };

  return (
    <>
      <section className="dash-section" data-home-extra="petinfo">
        <div className="dash-section-head">
          <h2>{lang === "en" ? "Today’s Pet Info" : "오늘의 Pet정보"}</h2>
          <button type="button" className="bg-chip" onClick={() => go("tips")}>{lang === "en" ? "View all" : "전체보기"}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
          {recommendedTips.map((tip, i) => (
            <button
              key={tip?.id ?? i}
              type="button"
              className="bg-card"
              onClick={() => go("tips")}
              style={{ padding: 16, textAlign: "left", border: "1px solid var(--border)", cursor: "pointer", minHeight: 104 }}
            >
              <small style={{ fontWeight: 800, color: "var(--primary)" }}>{tip?.category || "Pet정보"}</small>
              <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.5, marginTop: 6 }}>{tip?.title || tip?.question || "오늘의 Pet정보"}</div>
              <small className="bg-sub" style={{ display: "block", marginTop: 7 }}>{lang === "en" ? "Open Pet Info →" : "자세히 보기 →"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="dash-section" data-home-extra="music">
        <div className="dash-section-head">
          <h2>{lang === "en" ? "Popular Pet Music TOP 5" : "인기 Pet음악 TOP 5"}</h2>
          <button type="button" className="bg-chip" onClick={() => go("music")}>{lang === "en" ? "View all" : "전체보기"}</button>
        </div>
        {music.length > 0 ? (
          <div style={{ display: "grid", gap: 9 }}>
            {music.map((track, i) => {
              const id = track?.id ?? track?.title ?? i;
              const active = playingId === id;
              return (
                <div key={id} className="bg-card" style={{ padding: "11px 13px", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "38px 1fr auto", alignItems: "center", gap: 10 }}>
                  <b style={{ fontSize: 17, textAlign: "center", color: "var(--primary)" }}>{i + 1}</b>
                  <button type="button" onClick={() => go("music")} style={{ border: 0, background: "transparent", padding: 0, textAlign: "left", fontFamily: "inherit", cursor: "pointer", minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track?.title || "Pet음악"}</div>
                    <small className="bg-sub">▶ {Number(track?.playCount ?? track?.play_count ?? 0).toLocaleString()} · ♥ {Number(track?.likeCount ?? track?.like_count ?? 0).toLocaleString()}</small>
                  </button>
                  <button type="button" className="bg-chip" onClick={() => toggleTrack(track)} aria-label={active ? "일시정지" : "재생"} style={{ minWidth: 46 }}>{active ? "❚❚" : "▶"}</button>
                </div>
              );
            })}
          </div>
        ) : (
          <button type="button" className="bg-card" onClick={() => go("music")} style={{ width: "100%", padding: 14, border: "1px solid var(--border)", textAlign: "left", cursor: "pointer" }}>
            <b>{lang === "en" ? "Open Pet Music" : "Pet음악 바로가기"}</b>
            <small className="bg-sub" style={{ display: "block", marginTop: 4 }}>{lang === "en" ? "The TOP 5 will update automatically." : "TOP 5는 자동으로 빠르게 갱신돼요."}</small>
          </button>
        )}
      </section>
    </>
  );
}
