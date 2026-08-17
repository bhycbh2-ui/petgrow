import fs from "node:fs";

const file = "src/App.jsx";
let s = fs.readFileSync(file, "utf8");
const MARKER = "PETNEWS_UI_V1_20260817";
if (s.includes(MARKER)) {
  console.log("Pet뉴스 UI already applied.");
  process.exit(0);
}

function replaceOnce(from, to, label, required = true) {
  if (!s.includes(from)) {
    if (required) throw new Error(`Anchor not found: ${label}`);
    console.warn(`Skip missing optional anchor: ${label}`);
    return;
  }
  s = s.replace(from, to);
  console.log(`Applied: ${label}`);
}

const newsComponents = `
/* ${MARKER} */
function PetNewsPage({ lang = "ko" }) {
  const [data, setData] = useState({ items: [], configured: true, updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("전체");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/news", { headers: { Accept: "application/json" } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "뉴스를 불러오지 못했어요.");
      setData(j);
    } catch (e) {
      setError(e?.message || "뉴스를 불러오지 못했어요.");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const categories = ["전체", "반려견", "반려묘", "건강", "정책·제도", "입양·보호", "산업·서비스", "반려동물"];
  const items = category === "전체" ? (data.items || []) : (data.items || []).filter(x => x.category === category);
  const timeLabel = (iso) => {
    if (!iso) return "";
    const d = new Date(iso), diff = Date.now() - d.getTime();
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return d.toLocaleDateString("ko-KR");
  };

  return <div className="legal-page-shell" style={{maxWidth:980,margin:"0 auto",padding:"0 16px 48px"}}>
    <section className="bg-card" style={{padding:"24px",marginBottom:16,background:"linear-gradient(135deg,#f5fbf6,#fff)"}}>
      <div style={{display:"flex",gap:16,alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap"}}>
        <div><small style={{fontWeight:900,color:"var(--primary)"}}>PETGROW NEWS</small><h1 style={{margin:"6px 0 8px"}}>📰 {lang === "en" ? "Pet News" : "Pet뉴스"}</h1>
        <p className="bg-sub" style={{margin:0}}>{lang === "en" ? "Recent news focused on pets, animal health, policy and adoption." : "강아지·고양이·반려동물과 직접 관련된 최신 뉴스만 모아봐요. 약 1시간 단위로 갱신됩니다."}</p></div>
        <button className="bg-btn bg-btn-ghost" type="button" onClick={load} disabled={loading}>{loading ? "불러오는 중…" : "↻ 새로고침"}</button>
      </div>
      {data.updatedAt && <small style={{display:"block",marginTop:10,color:"var(--sub)"}}>최근 갱신 {new Date(data.updatedAt).toLocaleString("ko-KR")}</small>}
    </section>

    <div style={{display:"flex",gap:8,overflowX:"auto",padding:"2px 0 14px"}}>
      {categories.map(c => <button key={c} type="button" onClick={()=>setCategory(c)} className={`bg-chip ${category===c?"active":""}`} style={{whiteSpace:"nowrap"}}>{c}</button>)}
    </div>

    {loading ? <div className="bg-card" style={{padding:28,textAlign:"center"}}>최신 펫뉴스를 불러오는 중이에요…</div>
      : error ? <div className="bg-card" style={{padding:28,textAlign:"center"}}><b>Pet뉴스를 아직 불러올 수 없어요.</b><p className="bg-sub">{error}</p><button className="bg-btn" onClick={load}>다시 시도</button></div>
      : items.length === 0 ? <div className="bg-card" style={{padding:28,textAlign:"center"}}>선택한 카테고리의 최신 뉴스가 아직 없어요.</div>
      : <div style={{display:"grid",gap:12}}>{items.map(item => <article key={item.id} className="bg-card" style={{padding:"18px 20px"}}>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}><span className="bg-chip active">{item.category}</span><small style={{color:"var(--sub)"}}>{item.source} · {timeLabel(item.publishedAt)}</small></div>
          <h2 style={{fontSize:18,lineHeight:1.45,margin:"0 0 8px"}}>{item.title}</h2>
          <p className="bg-sub" style={{fontSize:14,lineHeight:1.7,margin:"0 0 12px"}}>{item.description}</p>
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="bg-btn bg-btn-ghost" style={{display:"inline-flex",textDecoration:"none"}}>원문 보기 ↗</a>
        </article>)}</div>}
    <p className="bg-sub" style={{fontSize:12,lineHeight:1.65,marginTop:16}}>Pet뉴스는 외부 뉴스 검색 결과의 제목·요약·출처·링크를 제공하며 기사 전문을 PetGrow가 복제해 제공하지 않습니다. 기사 내용과 저작권은 각 언론사 및 원저작자에게 있습니다.</p>
  </div>;
}

function PetNewsPrivacyAddendum() {
  return <div className="legal-page-shell" style={{maxWidth:900,margin:"14px auto 36px",padding:"0 16px"}}><section className="bg-card" style={{padding:22}}>
    <h2 style={{fontSize:18,marginTop:0}}>Pet뉴스 관련 개인정보 및 외부 서비스 안내</h2>
    <p className="bg-sub" style={{lineHeight:1.75}}>Pet뉴스는 반려동물 관련 공개 뉴스 검색 결과를 제공하기 위해 NAVER API HUB 등 외부 검색 API를 사용할 수 있습니다. PetGrow는 뉴스 조회를 위해 이용자의 이름, 이메일, 반려동물 정보 등 계정 개인정보를 검색 제공자에게 전송하지 않습니다.</p>
    <p className="bg-sub" style={{lineHeight:1.75}}>이용자가 ‘원문 보기’를 선택하면 해당 언론사 또는 외부 뉴스 페이지로 이동하며, 이동 후의 개인정보 처리에는 해당 외부 서비스의 개인정보처리방침이 적용됩니다. PetGrow는 뉴스 목록 제공을 위해 기사 제목, 요약, 출처, 공개일시 및 원문 링크 등 공개적으로 제공되는 뉴스 메타데이터를 일시적으로 처리할 수 있습니다.</p>
    <p className="bg-sub" style={{lineHeight:1.75,marginBottom:0}}>시행일: 2026년 8월 17일</p>
  </section></div>;
}

function PetNewsTermsAddendum() {
  return <div className="legal-page-shell" style={{maxWidth:900,margin:"14px auto 36px",padding:"0 16px"}}><section className="bg-card" style={{padding:22}}>
    <h2 style={{fontSize:18,marginTop:0}}>Pet뉴스 서비스 이용조건</h2>
    <p className="bg-sub" style={{lineHeight:1.75}}>Pet뉴스는 반려동물 관련 최신 기사 탐색을 돕기 위한 정보 제공 기능입니다. PetGrow는 외부 검색 API의 검색 결과를 바탕으로 기사 제목, 요약, 출처, 날짜 및 원문 링크를 제공하며 기사 전문을 자체 기사로 제공하지 않습니다.</p>
    <p className="bg-sub" style={{lineHeight:1.75}}>뉴스의 정확성·완전성·최신성 및 기사 내용에 대한 책임은 해당 기사 제공자에게 있으며, PetGrow의 건강·의료·정책 관련 뉴스는 전문적인 진단이나 법률·행정 자문을 대체하지 않습니다. 외부 API 또는 언론사 사정에 따라 일부 기사의 노출·링크·갱신 주기가 변경되거나 일시 중단될 수 있습니다.</p>
    <p className="bg-sub" style={{lineHeight:1.75,marginBottom:0}}>시행일: 2026년 8월 17일</p>
  </section></div>;
}

`;

replaceOnce("\nfunction AdminReportsPage({onBack}){", `\n${newsComponents}function AdminReportsPage({onBack}){`, "PetNews components");

replaceOnce("<PrivacyContent />", "<><PrivacyContent /><PetNewsPrivacyAddendum /></>", "privacy addendum");
replaceOnce("<TermsContent />", "<><TermsContent /><PetNewsTermsAddendum /></>", "terms addendum");

replaceOnce(
`      ) : effectiveView === \"ad-inquiry\" ? (\n        <AdInquiryPage onBack={() => goView(\"home\")} />\n      ) : effectiveView === \"tips\" ? (`,
`      ) : effectiveView === \"ad-inquiry\" ? (\n        <AdInquiryPage onBack={() => goView(\"home\")} />\n      ) : effectiveView === \"news\" ? (\n        <PetNewsPage lang={lang} />\n      ) : effectiveView === \"tips\" ? (`,
"render route"
);

replaceOnce(
`            <button className={view === \"tips\" ? \"active\" : \"\"} onClick={() => goView(\"tips\")}><LightbulbIcon /><span>{t.tipsTitle}</span></button>\n            <button className={view === \"about\" ? \"active\" : \"\"} onClick={() => goView(\"about\")}><InfoIcon /><span>{t.aboutNav}</span></button>`,
`            <button className={view === \"tips\" ? \"active\" : \"\"} onClick={() => goView(\"tips\")}><LightbulbIcon /><span>{t.tipsTitle}</span></button>\n            <button className={view === \"news\" ? \"active\" : \"\"} onClick={() => goView(\"news\")}><InfoIcon /><span>{lang === \"en\" ? \"Pet News\" : \"Pet뉴스\"}</span></button>\n            <button className={view === \"about\" ? \"active\" : \"\"} onClick={() => goView(\"about\")}><InfoIcon /><span>{t.aboutNav}</span></button>`,
"sidebar nav"
);

replaceOnce(
`                <button type=\"button\" className={\`desktop-nav-link \${view === \"tips\" ? \"active\" : \"\"}\`} onClick={() => goView(\"tips\")}><LightbulbIcon />{t.tipsTitle}</button>\n              </nav>`,
`                <button type=\"button\" className={\`desktop-nav-link \${view === \"tips\" ? \"active\" : \"\"}\`} onClick={() => goView(\"tips\")}><LightbulbIcon />{t.tipsTitle}</button>\n                <button type=\"button\" className={\`desktop-nav-link \${view === \"news\" ? \"active\" : \"\"}\`} onClick={() => goView(\"news\")}><InfoIcon />{lang === \"en\" ? \"Pet News\" : \"Pet뉴스\"}</button>\n              </nav>`,
"desktop nav"
);

replaceOnce(
`            <LandingFeatureCard Illust={IllustTips} title={t.landingCardTipsTitle} desc={t.landingCardTipsDesc} />\n            <LandingFeatureCard Illust={MapPinIcon} title={t.landingCardNearbyTitle} desc={t.landingCardNearbyDesc} />`,
`            <LandingFeatureCard Illust={IllustTips} title={t.landingCardTipsTitle} desc={t.landingCardTipsDesc} />\n            <LandingFeatureCard Illust={InfoIcon} title={lang === \"en\" ? \"📰 Pet News\" : \"📰 Pet뉴스\"} desc={lang === \"en\" ? \"Fresh pet-related news, refreshed regularly with direct links to the original publisher.\" : \"반려동물 관련 최신 뉴스만 모아보고 원문까지 바로 확인해요.\"} />\n            <LandingFeatureCard Illust={MapPinIcon} title={t.landingCardNearbyTitle} desc={t.landingCardNearbyDesc} />`,
"about feature card"
);

replaceOnce(
`  tips: { icon: \"💡\", koTitle: \"Pet정보\", koBody: \"건강·식단·생활·훈련 등 반려생활에 바로 써먹기 좋은 정보를 모아봤어요.\", enTitle: \"Pet Tips\", enBody: \"Browse practical tips for health, food, daily care and training.\" },\n  my:`,
`  tips: { icon: \"💡\", koTitle: \"Pet정보\", koBody: \"건강·식단·생활·훈련 등 반려생활에 바로 써먹기 좋은 정보를 모아봤어요.\", enTitle: \"Pet Tips\", enBody: \"Browse practical tips for health, food, daily care and training.\" },\n  news: { icon: \"📰\", koTitle: \"Pet뉴스\", koBody: \"강아지·고양이·건강·정책·입양 등 반려동물 관련 최신 뉴스만 모아봐요.\", enTitle: \"Pet News\", enBody: \"Browse recent news focused on pets, health, policy and adoption.\" },\n  my:`,
"menu help",
false
);

s = s.replaceAll('tips:"Pet정보",my:', 'tips:"Pet정보",news:"Pet뉴스",my:');
s = s.replaceAll('tips:"Pet정보",my:"회원정보"', 'tips:"Pet정보",news:"Pet뉴스",my:"회원정보"');

replaceOnce(
`      { title: \"Pet정보\", body: \"강아지·고양이·건강·생활·식단·영양·훈련·안전·미용·위생 등 카테고리별 반려생활 정보를 확인할 수 있어요. 목록은 페이지 단위로 나뉘고 검색과 즐겨찾기를 이용할 수 있으며, 정보는 지속적으로 추가·점검돼요.\" },`,
`      { title: \"Pet정보\", body: \"강아지·고양이·건강·생활·식단·영양·훈련·안전·미용·위생 등 카테고리별 반려생활 정보를 확인할 수 있어요. 목록은 페이지 단위로 나뉘고 검색과 즐겨찾기를 이용할 수 있으며, 정보는 지속적으로 추가·점검돼요.\" },\n      { title: \"Pet뉴스\", body: \"반려동물 관련 공개 뉴스 검색 결과를 약 1시간 단위로 갱신해 제목·요약·출처·날짜를 보여주고, 원문 보기를 누르면 해당 언론사 또는 뉴스 페이지로 이동해요. 기사 전문은 PetGrow에 복제해 저장하지 않아요.\" },`,
"info guide"
);

replaceOnce(
`    [\"petbti\", \"🧠\", \"PetBTI\"],\n    [\"more\", \"•••\", lang === \"en\" ? \"More\" : \"더보기\"],`,
`    [\"petbti\", \"🧠\", \"PetBTI\"],\n    [\"news\", \"📰\", lang === \"en\" ? \"Pet News\" : \"Pet뉴스\"],\n    [\"more\", \"•••\", lang === \"en\" ? \"More\" : \"더보기\"],`,
"dashboard menu",
false
);

replaceOnce(
`    privacyIntro: \"PetGrow(이하 \\\"서비스\\\")는 이용자의 개인정보를 중요하게 생각하며 「개인정보 보호법」 등 관련 법령을 준수하기 위해 노력합니다. 본 개인정보처리방침은 PetGrow 웹사이트 및 모바일 애플리케이션에 적용됩니다.\",`,
`    privacyIntro: \"PetGrow(이하 \\\"서비스\\\")는 이용자의 개인정보를 중요하게 생각하며 「개인정보 보호법」 등 관련 법령을 준수하기 위해 노력합니다. 본 개인정보처리방침은 PetGrow 웹사이트 및 모바일 애플리케이션에 적용됩니다. Pet뉴스는 공개 뉴스 검색 API를 이용하며, 뉴스 조회를 위해 이용자의 계정 개인정보나 반려동물 정보를 외부 뉴스 검색 제공자에게 전송하지 않습니다.\",`,
"privacy intro",
false
);

replaceOnce(
`    termsIntro: \"본 약관은 PetGrow가 제공하는 웹사이트, 모바일 애플리케이션 및 관련 서비스의 이용조건과 PetGrow 및 이용자의 권리·의무·책임사항을 정합니다.\",`,
`    termsIntro: \"본 약관은 PetGrow가 제공하는 웹사이트, 모바일 애플리케이션 및 관련 서비스의 이용조건과 PetGrow 및 이용자의 권리·의무·책임사항을 정합니다. Pet뉴스는 외부 검색 API 기반의 뉴스 탐색 기능이며 기사 내용과 저작권은 각 기사 제공자에게 있습니다.\",`,
"terms intro",
false
);

fs.writeFileSync(file, s);
console.log("Pet뉴스 UI/menu/legal integration applied successfully.");
