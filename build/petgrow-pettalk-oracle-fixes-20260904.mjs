function replaceRequired(code,from,to,label){
  if(!code.includes(from))throw new Error(`[petgrow-pettalk-oracle-fixes] missing required pattern: ${label}`);
  return code.replace(from,to);
}

export function transformPetTalkOracle(source){
  let out=source;
  const categoryLine='const COMMUNITY_CATEGORY_KEYS = ["daily","brag","question","health","info","walk","training","shopping","free"];';
  const communityDeps=`${categoryLine}
const REPORT_REASON_KEYS = ["ad", "abuse", "sexual", "animal_abuse", "privacy", "misinformation", "spam", "other"];
const PETTALK_BLOCKED_RE = /씨발|시발|ㅅㅂ|병신|븅신|개새끼|개새|좆|존나|지랄|꺼져|닥쳐|섹스|sex|야동|porn|포르노|자위|딸딸|보지|자지|음란|나치|nazi|혐오/i;
function validatePetTalkText(...parts) {
  const joined = parts.filter(Boolean).join(" ");
  const compact = joined.replace(/[\\s._\\-~!@#$%^&*()+=|\\\\/]/g, "");
  if (PETTALK_BLOCKED_RE.test(compact)) return "사용할 수 없는 표현이 포함되어 있어요. 내용을 수정해 주세요.";
  if (/[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}/.test(joined) || /(?:01[016789])[-\\s]?\\d{3,4}[-\\s]?\\d{4}/.test(joined)) return "전화번호나 이메일 같은 개인정보는 Pet톡에 직접 작성하지 말아 주세요.";
  return "";
}
function petSnapshot(pet) {
  return {
    id: pet.id,
    name: pet.profile.name,
    species: pet.species || pet.profile.species,
    breed: pet.profile.breedName || null,
    birthDate: pet.profile.birthDate || null,
    photo: pet.profile.profileImage || null,
  };
}
const COMMUNITY_DEMO_POSTS = [
  ["daily", "mint", "🐶", "버터네 보호자", "말티푸 · 4개월", "오늘 첫 산책 다녀왔어요 🐾", "처음엔 조금 긴장하더니 마지막에는 꼬리도 살랑살랑 흔들었어요. 천천히 익숙해지는 모습이 너무 기특하네요!", 8, 2],
  ["question", "blue", "🐶", "두부네 보호자", "비숑 · 7개월", "산책 중 갑자기 멈춰요, 괜찮을까요?", "요즘 산책하다가 몇 분씩 가만히 서 있을 때가 있어요. 냄새 맡는 건지 쉬는 건지 비슷한 경험 있으셨나요?", 5, 6],
  ["health", "rose", "🐱", "구름네 집사", "랙돌 · 2살", "물을 평소보다 자주 마셔요", "며칠 전부터 물 마시는 횟수가 늘어난 것 같아서 기록 중이에요. 계속되면 병원 상담도 받아보려고 해요.", 7, 4],
];`;
  if(out.includes(categoryLine))out=replaceRequired(out,`${categoryLine}\n\nfunction CmPetAvatar`,`${communityDeps}\n\nfunction CmPetAvatar`,"community dependencies");
  else out=replaceRequired(out,"function CmPetAvatar",`${communityDeps}\n\nfunction CmPetAvatar`,"community dependency anchor");

  out=replaceRequired(out,`      if (isEdit) {
        await communityUpdatePost(initialPost.id, { category, title: title.trim(), content: content.trim(), imageUrls: images, isPublic });
      } else {
        await communityCreatePost({ pet: petSnapshot(pet), category, title: title.trim(), content: content.trim(), imageUrls: images, isPublic });
      }
      onSaved();`,`      const saved = isEdit
        ? await communityUpdatePost(initialPost.id, { category, title: title.trim(), content: content.trim(), imageUrls: images, isPublic })
        : await communityCreatePost({ pet: petSnapshot(pet), category, title: title.trim(), content: content.trim(), imageUrls: images, isPublic });
      onSaved(saved);`,"created post routing");

  out=replaceRequired(out,`    await communityDeleteComment(commentDeleteTarget).catch(() => {});
    setComments((prev) => prev.filter((c) => c.id !== commentDeleteTarget));
    setPost((prev) => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
    setCommentDeleteTarget(null);`,`    try {
      await communityDeleteComment(commentDeleteTarget);
      setComments((prev) => prev.filter((c) => c.id !== commentDeleteTarget));
      setPost((prev) => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
      setCommentDeleteTarget(null);
    } catch (err) {
      window.alert(err?.message || "댓글을 삭제하지 못했어요. 다시 시도해 주세요.");
    }`,"comment delete result");
  out=replaceRequired(out,`    await communityDeletePost(postId).catch(() => {});
    setDeleteConfirmOpen(false);
    onDeleted();`,`    try {
      await communityDeletePost(postId);
      setDeleteConfirmOpen(false);
      onDeleted();
    } catch (err) {
      window.alert(err?.message || "게시글을 삭제하지 못했어요. 다시 시도해 주세요.");
    }`,"post delete result");

  const sampleStart='      <div className="cm-sample-showcase">';
  const sampleEnd='\n\n      {posts.length === 0 && !loading ? (';
  const start=out.indexOf(sampleStart),end=out.indexOf(sampleEnd,start);
  if(start<0||end<0)throw new Error("[petgrow-pettalk-oracle-fixes] missing required pattern: PetTalk samples");
  const samples=`      {(category === "all" || COMMUNITY_DEMO_POSTS.some(([key]) => key === category)) && <div className="cm-sample-showcase">
        <div className="cm-sample-head"><div><span>PET TALK PREVIEW</span><b>{lang === "en" ? "Three Pet Talk examples" : "대표 Pet톡 예시 3개"}</b></div><small>{lang === "en" ? "A quick look at daily life, questions, and health posts." : "일상·질문·건강 글이 어떻게 보이는지 간단히 확인해보세요."}</small></div>
        <div className="cm-demo-grid">
          {COMMUNITY_DEMO_POSTS.filter(([key])=>category==="all"||key===category).map(([key,tone,emoji,author,pet,title,body,likes,comments]) => (
            <div className="cm-demo-card" data-tone={tone} key={key}>
              <span className="cm-demo-badge">{lang === "en" ? "Sample" : "예시"}</span>
              <div className="cm-pet-row"><span className="cm-pet-avatar-fallback">{emoji}</span><div><div style={{fontWeight:800,fontSize:13}}>{author}</div><div className="bg-sub" style={{fontSize:11}}>{pet}</div></div></div>
              <div className="cm-demo-category">{t.communityCategoryLabels[key]}</div>
              <h3>{title}</h3><p>{body}</p>
              <div className="cm-demo-stats"><span>♡ {likes}</span><span>💬 {comments}</span></div>
            </div>
          ))}
        </div>
      </div>}`;
  out=out.slice(0,start)+samples+out.slice(end);

  out=replaceRequired(out,'        onSaved={() => setSub("detail")} />',`        onSaved={(saved) => {
          if (saved?.id) setActivePostId(saved.id);
          setSub(saved?.id ? "detail" : "feed");
        }} />`,"created post detail navigation");

  out=replaceRequired(out,'    <div style={{ maxWidth: 720, margin: "0 auto" }}>','    <div className="pg-oracle-shell pg-oracle-saju-result" style={{ maxWidth: 720, margin: "0 auto" }}>\n      <div className="pg-oracle-flow" aria-label={lang === "en" ? "Profile, pattern, insight" : "프로필, 패턴, 인사이트"}><span className="active">01 PROFILE</span><i/><span>02 PATTERN</span><i/><span>03 INSIGHT</span></div>',"Saju result infographic");
  out=replaceRequired(out,'    return <div className="feature-module-shell">\n      <div className="bg-card" style={{ background: "#F1F6F2" }}>','    return <div className="feature-module-shell pg-oracle-shell pg-oracle-compat">\n      <div className="bg-card" style={{ background: "#F1F6F2" }}>',"compatibility surface");
  out=replaceRequired(out,'  return <div className="feature-module-shell"><div style={{ textAlign: "center", marginBottom: 18 }}><FeaturePetHeader pet={pet} /><h2 className="pet-user-name"','  return <div className="feature-module-shell pg-oracle-shell pg-oracle-menu"><div style={{ textAlign: "center", marginBottom: 18 }}><FeaturePetHeader pet={pet} /><h2 className="pet-user-name"',"Saju menu surface");
  return out;
}

export default function petgrowPetTalkOracleFixes(){
  return {name:"petgrow-pettalk-oracle-fixes-20260904",enforce:"pre",transform(code,id){
    const norm=String(id||"").replaceAll("\\","/");
    if(!norm.endsWith("/src/App.jsx"))return null;
    const out=transformPetTalkOracle(code);
    return out===code?null:{code:out,map:null};
  }};
}
