import React, { useMemo } from "react";

// PetMusic is intentionally paused for now.
// Keep the home lightweight: no music API, Audio object, observer, cache, or playback side effects.
export default function HomeInfoMusicSections({ lang = "ko", onGoView, tips = [] }) {
  const recommendedTips = useMemo(() => {
    const list = Array.isArray(tips) ? tips.filter(Boolean) : [];
    if (!list.length) return [];
    const day = Math.floor(Date.now() / 86400000);
    const start = (day * 3) % list.length;
    return [0, 1, 2].map((i) => list[(start + i) % list.length]).filter(Boolean);
  }, [tips]);

  const go = (view) => {
    if (typeof onGoView === "function") onGoView(view);
  };

  return (
    <section className="dash-section" data-home-extra="petinfo">
      <div className="dash-section-head">
        <h2>{lang === "en" ? "Today’s Pet Info" : "오늘의 Pet정보"}</h2>
        <button type="button" className="bg-chip" onClick={() => go("tips")}>
          {lang === "en" ? "View all" : "전체보기"}
        </button>
      </div>

      {recommendedTips.length > 0 ? (
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
              <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.5, marginTop: 6 }}>
                {tip?.title || tip?.question || "오늘의 Pet정보"}
              </div>
              <small className="bg-sub" style={{ display: "block", marginTop: 7 }}>
                {lang === "en" ? "Open Pet Info →" : "자세히 보기 →"}
              </small>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="bg-card"
          onClick={() => go("tips")}
          style={{ width: "100%", padding: 14, border: "1px solid var(--border)", textAlign: "left", cursor: "pointer" }}
        >
          <b>{lang === "en" ? "Open Pet Info" : "Pet정보 바로가기"}</b>
          <small className="bg-sub" style={{ display: "block", marginTop: 4 }}>
            {lang === "en" ? "Pet Info is loaded only when you open it." : "Pet정보는 필요할 때만 열어 가볍게 이용해요."}
          </small>
        </button>
      )}
    </section>
  );
}
