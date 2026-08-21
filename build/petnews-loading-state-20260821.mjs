export default function petNewsLoadingState() {
  return {
    name: "petnews-loading-state-20260821",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith("/src/App.jsx") && !id.endsWith("\\src\\App.jsx")) return null;

      const countFrom = `<div className="petnews-result-count">{filtered.length} {lang==='ko'?'건':''}</div>`;
      const countTo = `<div className={\`petnews-result-count ${loading?'loading':''}\`}>{loading?(lang==='en'?'Loading news…':lang==='ja'?'ニュースを読み込み中です…':lang==='zh'?'正在加载新闻…':'뉴스를 불러오는 중입니다…'):<>{filtered.length} {lang==='ko'?'건':''}</>}</div>`;

      const loadingFrom = `{loading?<div className="petnews-state">…</div>`;
      const loadingTo = `{loading?<div className="petnews-state petnews-loading-state" role="status" aria-live="polite"><span className="petnews-loading-spinner" aria-hidden="true"></span><b>{lang==='en'?'Loading the latest pet news…':lang==='ja'?'最新のペットニュースを読み込み中です…':lang==='zh'?'正在加载最新宠物新闻…':'최신 Pet뉴스를 불러오는 중입니다…'}</b><small>{lang==='ko'?'잠시만 기다려 주세요. 최신 기사와 출처를 확인하고 있어요.':''}</small></div>`;

      if (!code.includes(countFrom) || !code.includes(loadingFrom)) {
        this.warn("PetNews loading-state marker was not found; source may have changed.");
        return null;
      }

      return {
        code: code.replace(countFrom, countTo).replace(loadingFrom, loadingTo),
        map: null,
      };
    },
  };
}
