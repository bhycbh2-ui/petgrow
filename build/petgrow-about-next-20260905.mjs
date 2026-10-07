const ABOUT_PAGE_NEXT = String.raw`function AboutPage({ onStart, onNavigate }) {
  const lang = useLang();
  const en = lang === 'en';
  const go = view => onNavigate ? onNavigate(view) : onStart();
  const sections = [
    { id:'records', image:'/about-menu-records.webp', Icon:PawIcon, title:en?'My pet, growing every day':'우리 아이의 성장과 생활 기록', desc:en?'Build a profile for each dog or cat. Keep weight and everyday changes together and explore growth estimates.':'강아지와 고양이의 프로필을 각각 등록하고, 체중과 생활 변화를 차곡차곡 남겨요. 성장 기록을 살펴보고 예상 성장도 확인할 수 있어요.', links:[['pets',en?'Open My Pet':'우리 아이 기록하기']] },
    { id:'diary', image:'/about-menu-diary.webp', Icon:CameraIcon, title:en?'Small moments, lasting memories':'사진과 글로 남기는 다이어리', desc:en?'Write a few words about a walk, a meal or a lovely moment. Save dated photos and read your latest diary on home.':'산책한 날, 잘 먹은 날, 유난히 귀여웠던 순간을 짧은 일기로 남겨요. 날짜별 사진과 글을 모으고 홈에서 최근 일기를 다시 만나보세요.', links:[['pets',en?'Open diary':'다이어리 시작하기']] },
    { id:'community', image:'/about-menu-community.webp', Icon:TalkIcon, title:en?'Everyday stories, shared':'보호자들과 함께 나누는 Pet톡', desc:en?'Share everyday photos, ask questions and exchange experiences with other pet parents through comments and likes.':'반려동물의 일상과 사진을 공유하고, 궁금한 점을 물어보세요. 댓글과 좋아요로 이야기를 나누며 다른 보호자들의 경험을 만날 수 있어요.', links:[['community',en?'Visit Pet Talk':'Pet톡 둘러보기']] },
    { id:'info', image:'/about-menu-info.webp', Icon:LightbulbIcon, title:en?'Helpful information in one place':'알아두면 좋은 정보와 뉴스', desc:en?'Explore pet care tips and guides, browse recent pet news and find nearby places for daily care.':'행동·건강·돌봄에 관한 Pet정보와 반려생활 가이드를 읽어보세요. 반려동물 뉴스와 주변 병원·미용·돌봄 장소도 함께 찾아볼 수 있어요.', links:[['tips',en?'Pet Info':'Pet정보'],['guide',en?'Guides':'정보가이드'],['news',en?'Pet News':'Pet뉴스'],['nearby',en?'Nearby Pet':'내 주변 Pet']] },
    { id:'music', image:'/about-menu-music.webp', Icon:MusicIcon, title:en?'A soundtrack for time together':'함께 듣는 음악, 편안한 휴식', desc:en?'Listen to music for dogs and cats, replay your favorites and share reactions through likes and comments.':'반려동물과 함께하는 일상에 어울리는 음악을 만나보세요. 좋아하는 곡을 반복해서 듣고, 좋아요와 댓글로 감상을 나눌 수 있어요.', links:[['music',en?'Listen to Pet Music':'Pet음악 듣기']] },
    { id:'fun', image:'/about-menu-fun.webp', Icon:SajuIcon, title:en?'A little fun with your pet':'우리 아이를 알아보는 작은 재미', desc:en?'Explore PetBTI, Pet Saju and a daily tarot card for lighthearted moments with your pet.':'PetBTI로 우리 아이의 성향을 살펴보고, Pet사주와 Pet타로로 하루의 재미를 더해보세요. 가볍게 즐기는 콘텐츠로 반려생활에 새로운 이야기를 만들어요.', links:[['petbti','PetBTI'],['saju',en?'Pet Saju':'Pet사주'],['tarot',en?'Pet Tarot':'Pet타로']] },
  ];
  return <main className="landing-root pg-about-next pg-about-overview">
    <section className="pgo-hero">
      <div className="pgo-hero-copy"><span className="pgo-eyebrow">HELLO, PETGROW</span><h1>{en?<>Every moment with your pet,<br/><em>together in PetGrow.</em></>:<>반려생활의 모든 순간을,<br/><em>펫그로우에서.</em></>}</h1><p>{en?'From growth records and diaries to community, helpful information and music. A place for the days you share with your dog or cat.':'우리 아이의 성장과 소중한 일상부터, 함께 나누는 이야기와 필요한 정보까지. 강아지·고양이와 보내는 하루를 기록하고 즐기는 반려생활 공간이에요.'}</p><div className="pgo-actions"><button type="button" className="pgo-primary" onClick={onStart}>{en?'Start with My Pet':'우리 아이 등록하기'}</button><a className="pgo-secondary" href="#petgrow-features">{en?'Explore all features':'전체 기능 살펴보기'}</a></div><div className="pgo-hero-tags"><span>{en?'Dogs & cats':'강아지·고양이'}</span><span>{en?'Photos & diaries':'사진·일기 기록'}</span><span>{en?'A shared pet life':'함께하는 반려생활'}</span></div></div>

    </section>

    <section className="pgo-video"><div><span className="pgo-eyebrow">PETGROW IN A MINUTE</span><h2>{en?'A glimpse of life together':'영상으로 만나는 펫그로우'}</h2><p>{en?'Watch the introduction at your own pace.':'함께 기록하고 즐기는 반려생활, 영상으로 먼저 만나보세요.'}</p></div><div className="pgo-video-frame"><IntroVideo /></div></section>
    <section className="pgo-features" id="petgrow-features"><div className="pgo-section-head"><span className="pgo-eyebrow">EXPLORE PETGROW</span><h2>{en?'Everything you can do in PetGrow':'펫그로우에서 할 수 있는 일'}</h2></div><div className="pgo-feature-grid">{sections.map(({id,image,Icon,title,desc,links},index)=><article className="pgo-feature" key={id}><div className="pgo-feature-image"><img src={image} alt={title} loading="lazy" /></div><div className="pgo-feature-body"><div className="pgo-feature-top"><span className="pgo-feature-icon"><Icon/></span><span className="pgo-number">0{index+1}</span></div><h3>{title}</h3><p>{desc}</p><div className="pgo-feature-links">{links.map(([key,label])=><button type="button" key={key} onClick={()=>go(key)}>{label}</button>)}</div></div></article>)}</div></section>
    <section className="pgo-start"><div><span className="pgo-eyebrow">YOUR FIRST DAY</span><h2>{en?'A simple way to begin':'첫 시작은 간단하게'}</h2><p>{en?'Start small and add more moments over time.':'우리 아이를 등록하고, 오늘의 작은 순간 하나를 남겨보세요.'}</p></div><ol><li><b>01</b><div><h3>{en?'Create a pet profile':'우리 아이 프로필 등록'}</h3><p>{en?'Add your pet’s name, breed and basic information.':'이름, 견종·묘종, 생일 등 기본 정보를 입력해요.'}</p></div></li><li><b>02</b><div><h3>{en?'Leave your first record':'첫 번째 기록 남기기'}</h3><p>{en?'Keep a weight record, a photo or a short diary.':'체중 기록이나 사진, 짧은 일기로 하루를 남겨요.'}</p></div></li><li><b>03</b><div><h3>{en?'Explore your pet life':'필요한 기능 즐기기'}</h3><p>{en?'Discover community stories, information and music.':'Pet톡과 정보, 음악 등 원하는 기능을 둘러봐요.'}</p></div></li></ol></section>

    <section className="pgo-finish"><div><span className="pgo-eyebrow">OUR DAYS, OUR STORY</span><h2>{en?'Your pet’s story starts today.':'오늘의 기록이 우리 아이의 이야기가 돼요.'}</h2><p>{en?'Keep a moment, share a story and enjoy another day together.':'작은 순간을 남기고, 이야기를 나누며 함께하는 하루를 더 특별하게 만들어보세요.'}</p></div><button type="button" className="pgo-primary" onClick={onStart}>{en?'Start PetGrow':'펫그로우 시작하기'}</button></section>
  </main>;
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
