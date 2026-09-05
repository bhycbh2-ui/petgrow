const ABOUT_PAGE_NEXT = String.raw`function AboutPage({ onStart, onNavigate }) {
  const lang = useLang();
  const en = lang === "en";
  const go = (view) => (onNavigate ? onNavigate(view) : onStart());
  const features = [
    { key: "pets", Icon: PawIcon, index: "01", title: en ? "Growth records" : "성장 기록", desc: en ? "Keep weight, photos and everyday changes together." : "체중·사진·생활 변화를 한곳에 차곡차곡 기록해요." },
    { key: "community", Icon: PlusIcon, index: "02", title: en ? "Pet Talk" : "Pet톡", desc: en ? "Share everyday moments and practical questions." : "일상과 질문을 다른 보호자들과 편하게 나눠요." },
    { key: "saju", Icon: SajuIcon, index: "03", title: en ? "Saju & fortune" : "사주·운세", desc: en ? "Enjoy lighthearted insights made for your pet." : "우리 아이 정보로 만든 재미 콘텐츠를 즐겨요." },
    { key: "tarot", Icon: CatIcon, index: "04", title: en ? "Pet Tarot" : "Pet타로", desc: en ? "Draw a daily message with a calm card ritual." : "하루 한 장의 메시지를 차분한 카드 경험으로 만나요." },
    { key: "music", Icon: MusicIcon, index: "05", title: en ? "Pet Music" : "Pet음악", desc: en ? "Play music for rest, sleep and time together." : "휴식·수면·교감 시간에 어울리는 음악을 들어요." },
    { key: "nearby", Icon: MapPinIcon, index: "06", title: en ? "Nearby Pet" : "내 주변 Pet", desc: en ? "Find useful pet places around your location." : "내 주변 병원·약국·미용·돌봄 장소를 찾아요." },
  ];
  return (
    <main className="landing-root pg-about-next">
      <section className="pgx-section pgx-about-hero">
        <div className="pgx-about-wrap pgx-hero-grid">
          <div className="pgx-hero-copy about-fade">
            <div className="pgx-kicker"><span>LIVE</span> PETGROW · PET LIFE SYSTEM</div>
            <h1>{en ? <>The more you record,<br/><em>the better you understand.</em></> : <>기록이 쌓일수록<br/><em>우리 아이를 더 잘 이해해요.</em></>}</h1>
            <p>{en ? "PetGrow connects growth, daily care, community and delightful content around one pet profile." : "성장 기록부터 일상 돌봄, 커뮤니티와 재미 콘텐츠까지. 우리 아이 프로필 하나로 반려생활의 흐름을 자연스럽게 이어갑니다."}</p>
            <div className="pgx-hero-actions">
              <button type="button" className="pgx-primary" onClick={onStart}>{en ? "Start with my pet" : "우리 아이와 시작하기"}<span>↗</span></button>
              <button type="button" className="pgx-secondary" onClick={() => go("pets")}>{en ? "See growth records" : "성장 기록 살펴보기"}</button>
            </div>
            <div className="pgx-hero-proof"><span><ShieldIcon/> {en ? "Private account records" : "계정 기반 안전한 기록"}</span><span><LeafIcon/> {en ? "Made for daily care" : "매일 쓰기 쉬운 돌봄 도구"}</span></div>
          </div>
          <div className="pgx-hero-visual about-fade" aria-label={en ? "PetGrow record, insight and care system" : "PetGrow 기록, 이해, 돌봄 시스템"}>
            <div className="pgx-photo-stack">
              <figure className="pgx-photo pgx-photo-dog"><img src="/pettalk-demo-dog.webp" alt={en ? "A dog in everyday life" : "일상을 보내는 강아지"}/><figcaption>DOG · DAILY</figcaption></figure>
              <figure className="pgx-photo pgx-photo-cat"><img src="/pettalk-demo-cat.webp" alt={en ? "A cat in everyday life" : "일상을 보내는 고양이"}/><figcaption>CAT · MOMENT</figcaption></figure>
            </div>
            <div className="pgx-signal-card">
              <div className="pgx-signal-head"><span>GROWTH SIGNAL</span><b>LIVE</b></div>
              <div className="pgx-signal-chart" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
              <div className="pgx-signal-foot"><strong>{en ? "Small changes, clearly." : "작은 변화도 선명하게."}</strong><span>RECORD → INSIGHT → CARE</span></div>
            </div>
            <div className="pgx-orbit-mark"><PetGrowLogo/></div>
          </div>
        </div>
      </section>

      <section className="pgx-section pgx-system-band">
        <div className="pgx-about-wrap">
          <p className="pgx-section-label">THE PETGROW WAY</p>
          <div className="pgx-system-grid">
            <article><span>01</span><div><b>{en ? "Record" : "기록"}</b><p>{en ? "Capture growth and daily moments without complexity." : "성장과 일상의 순간을 어렵지 않게 남깁니다."}</p></div></article>
            <article><span>02</span><div><b>{en ? "Understand" : "이해"}</b><p>{en ? "Turn accumulated records into an easy-to-read flow." : "쌓인 기록을 한눈에 읽히는 흐름으로 바꿉니다."}</p></div></article>
            <article><span>03</span><div><b>{en ? "Grow together" : "함께 성장"}</b><p>{en ? "Use that understanding for better days together." : "그 이해를 더 좋은 반려생활로 이어갑니다."}</p></div></article>
          </div>
        </div>
      </section>

      <section className="pgx-section pgx-capabilities">
        <div className="pgx-about-wrap">
          <div className="pgx-section-head"><div><p className="pgx-section-label">ONE PROFILE, ONE FLOW</p><h2>{en ? "Everything your pet needs, connected." : "우리 아이에게 필요한 기능을 하나의 흐름으로."}</h2></div><p>{en ? "Open the feature you need now. Every experience stays connected to the same pet." : "지금 필요한 기능을 바로 열어보세요. 모든 경험은 같은 우리 아이를 중심으로 이어집니다."}</p></div>
          <div className="pgx-feature-grid">
            {features.map(({key,Icon,index,title,desc}) => <button type="button" className="pgx-feature-card" key={key} onClick={() => go(key)}><span className="pgx-feature-index">{index}</span><span className="pgx-feature-icon"><Icon/></span><strong>{title}</strong><p>{desc}</p><span className="pgx-feature-arrow">↗</span></button>)}
          </div>
        </div>
      </section>

      <section className="pgx-section pgx-record-story">
        <div className="pgx-about-wrap pgx-story-grid">
          <div className="pgx-story-copy">
            <p className="pgx-section-label">FROM MOMENT TO MEANING</p>
            <h2>{en ? "Not just a photo album. A readable growth story." : "사진을 모으는 데서 끝나지 않는, 읽히는 성장 이야기."}</h2>
            <p>{en ? "Weight, photos and notes form one timeline, so you can notice how today differs from yesterday." : "체중, 사진, 생활 기록이 하나의 타임라인에 쌓여 어제와 오늘의 차이를 자연스럽게 발견할 수 있어요."}</p>
            <button type="button" className="pgx-text-link" onClick={() => go("pets")}>{en ? "Open My Pet" : "우리 아이 기록 열기"}<span>→</span></button>
          </div>
          <div className="pgx-record-panel" aria-label={en ? "Growth record preview" : "성장 기록 미리보기"}>
            <div className="pgx-record-top"><div><small>MY PET · GROWTH</small><b>{en ? "A steady rhythm" : "꾸준히 이어지는 성장 리듬"}</b></div><span>+12.4%</span></div>
            <div className="pgx-record-bars" aria-hidden="true">{[32,43,40,58,65,72,86].map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div>
            <div className="pgx-record-meta"><span><b>7</b>{en ? "records" : "개의 기록"}</span><span><b>3</b>{en ? "photo moments" : "번의 사진 순간"}</span><span><b>1</b>{en ? "connected profile" : "개의 연결 프로필"}</span></div>
          </div>
        </div>
      </section>

      <section className="pgx-section pgx-community-story">
        <div className="pgx-about-wrap pgx-community-grid">
          <div className="pgx-community-preview">
            <article className="pgx-talk-card pgx-talk-main"><header><img src="/pettalk-demo-dog.webp" alt=""/><div><b>{en ? "Butter’s guardian" : "버터네 보호자"}</b><span>{en ? "Daily · just now" : "일상 · 방금 전"}</span></div></header><p>{en ? "We took our first calm walk today. Small steps felt like a big milestone." : "오늘 천천히 첫 산책을 다녀왔어요. 작은 한 걸음이 큰 성장처럼 느껴졌어요."}</p><footer>♡ 24 <span>💬 7</span></footer></article>
            <article className="pgx-talk-card pgx-talk-side"><span>PET TALK</span><b>{en ? "Everyday answers from people who understand." : "같은 마음을 아는 보호자들의 생활 답변."}</b></article>
          </div>
          <div className="pgx-story-copy pgx-story-copy-light">
            <p className="pgx-section-label">SHARE THE REAL DAYS</p>
            <h2>{en ? "Growth becomes warmer when it is shared." : "함께 나누면 반려생활은 조금 더 든든해집니다."}</h2>
            <p>{en ? "Ask practical questions, share small wins and discover useful stories from other guardians." : "생활 속 궁금한 점을 묻고, 작은 성장을 자랑하고, 다른 보호자의 경험에서 필요한 힌트를 찾아보세요."}</p>
            <button type="button" className="pgx-light-link" onClick={() => go("community")}>{en ? "Go to Pet Talk" : "Pet톡 둘러보기"}<span>↗</span></button>
          </div>
        </div>
      </section>

      <section className="pgx-section pgx-start">
        <div className="pgx-about-wrap">
          <div className="pgx-start-card">
            <div className="pgx-start-mark"><PetGrowLogo/></div>
            <p className="pgx-section-label">START SMALL, GROW TOGETHER</p>
            <h2>{en ? "Begin with one profile today." : "오늘, 우리 아이 프로필 하나부터 시작하세요."}</h2>
            <p>{en ? "The first record becomes tomorrow’s understanding." : "첫 기록이 내일의 이해가 되고, 함께한 시간이 우리 아이만의 성장 이야기가 됩니다."}</p>
            <button type="button" className="pgx-primary pgx-primary-light" onClick={onStart}>{en ? "Start PetGrow" : "PetGrow 시작하기"}<span>↗</span></button>
          </div>
          <div className="pgx-trust-row"><span><ShieldIcon/>{en ? "Account-based data" : "계정 기반 기록"}</span><span><InfoIcon/>{en ? "Clear guidance" : "명확한 이용 안내"}</span><span><LeafIcon/>{en ? "Everyday pet care" : "반려생활 중심"}</span></div>
        </div>
      </section>
    </main>
  );
}`;

function functionBodyStart(code, start) {
  const openParen = code.indexOf("(", start);
  if (openParen < 0) return -1;
  let depth = 0, quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = openParen; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (ch === "\\") { escape = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") depth++;
    else if (ch === ")" && --depth === 0) return code.indexOf("{", i + 1);
  }
  return -1;
}

function extractNamedFunction(code, name) {
  const match = new RegExp("function\\s+" + name + "\\s*\\(").exec(code);
  if (!match) return null;
  const start = match.index, brace = functionBodyStart(code, start);
  if (brace < 0) return null;
  let depth = 0, quote = null, templateExpr = 0, escape = false, lineComment = false, blockComment = false;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (quote === "`" && ch === "$" && next === "{") { templateExpr++; depth++; i++; continue; }
      if (quote === "`" && ch === "}" && templateExpr > 0) { templateExpr--; depth--; continue; }
      if (ch === quote && templateExpr === 0) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "`") { quote = ch; templateExpr = 0; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return { start, end: i + 1 };
  }
  return null;
}

export function transformAboutNext(source) {
  const hit = extractNamedFunction(source, "AboutPage");
  if (!hit) throw new Error("[petgrow-about-next] AboutPage anchor not found");
  return source.slice(0, hit.start) + ABOUT_PAGE_NEXT + source.slice(hit.end);
}

export default function petgrowAboutNext() {
  return { name: "petgrow-about-next-20260905", enforce: "pre", transform(code, id) {
    if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
    return { code: transformAboutNext(code), map: null };
  }};
}
