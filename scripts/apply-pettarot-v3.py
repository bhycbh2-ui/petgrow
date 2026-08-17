from pathlib import Path
import re


def replace_once(s, old, new, label):
    if old not in s:
        raise RuntimeError(f'missing anchor: {label}')
    return s.replace(old, new, 1)

app_path=Path('src/App.jsx')
widgets_path=Path('src/PetDailyWidgets.jsx')
tarot_path=Path('server_lib/tarot.js')
app=app_path.read_text(encoding='utf-8')
widgets=widgets_path.read_text(encoding='utf-8')
tarot=tarot_path.read_text(encoding='utf-8')

# Tarot backend: topic-specific, one draw per pet/topic/day.
if 'const TAROT_TOPICS=' not in tarot:
    marker='const clean=(v,max=120)=>String(v||"").trim().slice(0,max);'
    topics=r'''const TAROT_TOPICS={
  daily:{label:"오늘의 타로",guide:"오늘 하루 우리 아이와 함께할 분위기와 포인트를 가볍게 살펴봐요."},
  bond:{label:"보호자 궁합 타로",guide:"오늘 보호자와 우리 아이 사이의 교감 포인트를 살펴봐요."},
  heart:{label:"우리 아이 마음 타로",guide:"오늘 우리 아이의 기분과 마음을 이해하는 힌트를 찾아봐요."},
  activity:{label:"산책·활동 타로",guide:"오늘 산책과 놀이에서 잘 맞을 흐름을 재미로 확인해봐요."},
  advice:{label:"오늘의 조언 타로",guide:"오늘 우리 아이를 위해 보호자가 챙기면 좋은 작은 포인트를 살펴봐요."}
};
const cleanTopic=(v)=>Object.prototype.hasOwnProperty.call(TAROT_TOPICS,String(v||""))?String(v):"daily";
const deckFor=(uid,petId,topic,today)=>{
  const seed=crypto.createHash("sha256").update([uid,petId,topic,today].join("|")).digest("hex");
  const score=(id)=>crypto.createHash("sha256").update(seed+"|"+id).digest("hex");
  return [...CARDS].sort((a,b)=>score(a.id).localeCompare(score(b.id)));
};
const topicReading=(topic,card)=>{
  const label=TAROT_TOPICS[topic]?.label||TAROT_TOPICS.daily.label;
  const prefix={daily:"오늘의 흐름에서는",bond:"보호자와의 교감에서는",heart:"우리 아이의 마음을 바라볼 때는",activity:"산책과 놀이에서는",advice:"오늘 보호자가 기억하면 좋은 점은"}[topic]||"오늘은";
  return {label,guide:TAROT_TOPICS[topic]?.guide||"",topicMeaning:prefix+" ‘"+card.keyword+"’의 의미가 잘 어울려요. "+card.meaning,topicTip:card.tip};
};

'''
    tarot=replace_once(tarot,marker,topics+marker,'tarot topics')

start='  if(req.method==="POST"&&action==="draw"){' 
end='  if(req.method==="POST"&&action==="save"){' 
if start in tarot and end in tarot:
    a=tarot.index(start); b=tarot.index(end,a)
    new_draw=r'''  if(req.method==="POST"&&action==="draw"){
    const petId=clean(req.body?.petId,100),petName=clean(req.body?.petName,60),topic=cleanTopic(req.body?.topic),cardIndex=Math.max(0,Math.min(21,Number(req.body?.cardIndex)||0));
    if(!petId||!petName)return res.status(400).json({error:"반려동물 정보가 부족해요."});
    const {rows:existing}=await sql`select id,result_json,saved from pg_pet_daily_content where user_id=${uid} and pet_id=${petId} and content_type='tarot' and content_date=${today} and result_json->>'topicKey'=${topic} order by created_at desc limit 1`;
    if(existing[0])return res.status(200).json({ok:true,alreadyDrawn:true,id:existing[0].id,date:today,result:existing[0].result_json,saved:!!existing[0].saved});
    const card=deckFor(uid,petId,topic,today)[cardIndex],reading=topicReading(topic,card);
    const result={cardId:card.id,key:card.key,name:card.name,en:card.en,symbol:card.symbol,keyword:card.keyword,meaning:card.meaning,tip:card.tip,luck:card.luck,topicKey:topic,topicLabel:reading.label,topicGuide:reading.guide,topicMeaning:reading.topicMeaning,topicTip:reading.topicTip};
    const id=["tarot",uid,petId,topic,today].join(":");
    await sql`insert into pg_pet_daily_content(id,user_id,pet_id,pet_name,content_type,content_date,result_json,saved) values(${id},${uid},${petId},${petName},'tarot',${today},${JSON.stringify(result)}::jsonb,false) on conflict(id) do nothing`;
    const {rows:row}=await sql`select id,result_json,saved from pg_pet_daily_content where id=${id} and user_id=${uid}`;
    await stat(uid,"tarot_"+topic);
    return res.status(201).json({ok:true,id:row[0]?.id||id,date:today,result:row[0]?.result_json||result,saved:!!row[0]?.saved});
  }
'''
    tarot=tarot[:a]+new_draw+tarot[b:]

widget_start='const CARD_BACKS=[-2,-1,0,1,2];'
widget_end='export function TodayPetHomeCard'
if widget_start in widgets and widget_end in widgets:
    a=widgets.index(widget_start); b=widgets.index(widget_end,a)
    new_widget=r'''const TAROT_TOPICS=[
  {key:"daily",icon:"☀️",label:"오늘의 타로",desc:"오늘 하루의 흐름과 작은 행운 포인트"},
  {key:"bond",icon:"💞",label:"보호자 궁합 타로",desc:"오늘 보호자와 우리 아이의 교감 포인트"},
  {key:"heart",icon:"💗",label:"우리 아이 마음 타로",desc:"오늘 우리 아이의 마음을 이해하는 힌트"},
  {key:"activity",icon:"🌿",label:"산책·활동 타로",desc:"산책과 놀이에 어울리는 오늘의 흐름"},
  {key:"advice",icon:"✨",label:"오늘의 조언 타로",desc:"보호자가 챙기면 좋은 작은 포인트"}
];
const CARD_BACKS=Array.from({length:22},(_,i)=>i);
export function PetTarotPanel({pet,lang="ko",onBack,onAnalytics}){
  const [topic,setTopic]=useState("daily"),[phase,setPhase]=useState("topics"),[result,setResult]=useState(null),[recordId,setRecordId]=useState(""),[error,setError]=useState(""),[saved,setSaved]=useState(false),[picked,setPicked]=useState(-1),[todayMap,setTodayMap]=useState({}),[loadingToday,setLoadingToday]=useState(false);
  const petId=String(pet?.id||pet?.profile?.id||pet?.profile?.name||"pet"),petName=String(pet?.profile?.name||"우리 아이");
  const loadToday=async()=>{setLoadingToday(true);try{const j=await jsonFetch("/api/tarot?action=today");const map={};(j.items||[]).filter(x=>x.content_type==="tarot"&&String(x.pet_id)===petId).forEach(x=>{const k=x.result_json?.topicKey||"daily";if(!map[k])map[k]=x;});setTodayMap(map);}catch{}finally{setLoadingToday(false)}};
  useEffect(()=>{setPhase("topics");setResult(null);setRecordId("");setSaved(false);setPicked(-1);loadToday();},[petId]);
  const chooseTopic=(key)=>{setTopic(key);setError("");const old=todayMap[key];if(old){setResult(old.result_json);setRecordId(old.id);setSaved(!!old.saved);setPhase("result");}else{setResult(null);setRecordId("");setSaved(false);setPicked(-1);setPhase("choose");}};
  const draw=async(i)=>{if(phase==="drawing")return;setPicked(i);setPhase("drawing");setError("");try{onAnalytics?.("feature_use","tarot_"+topic);const j=await jsonFetch("/api/tarot?action=draw",{method:"POST",body:JSON.stringify({petId,petName,topic,cardIndex:i})});window.setTimeout(()=>{setResult(j.result);setRecordId(j.id);setSaved(!!j.saved);setTodayMap(m=>({...m,[topic]:{id:j.id,pet_id:petId,pet_name:petName,content_type:"tarot",result_json:j.result,saved:!!j.saved}}));setPhase("result")},650);}catch(e){setError(e.message);setPhase("choose")}};
  const save=async()=>{if(!recordId)return;setError("");try{const j=await jsonFetch("/api/tarot?action=save",{method:"POST",body:JSON.stringify({id:recordId})});if(!j.ok)throw new Error("저장 상태를 확인하지 못했어요.");setSaved(true);setTodayMap(m=>({...m,[topic]:{...(m[topic]||{}),saved:true}}));window.dispatchEvent(new CustomEvent("petgrow:tarot-saved"));onAnalytics?.("feature_use","saju_tarot_save");}catch(e){setError(e.message)}};
  const currentTopic=TAROT_TOPICS.find(x=>x.key===topic)||TAROT_TOPICS[0];
  return <div className="feature-module-shell pet-tarot-shell">
    <div className="bg-card pet-tarot-stage">
      <small className="pet-daily-eyebrow">PETGROW TAROT · 22 MAJOR ARCANA</small><h2>🃏 {petName}{lang==="en"?"'s Tarot":"의 Pet타로"}</h2>
      {phase==="topics"&&<><p className="bg-sub pet-tarot-intro">주제마다 하루에 한 번씩 뽑을 수 있어요. 오늘 뽑은 카드는 같은 날 다시 바뀌지 않아요.</p><div className="pet-tarot-topic-grid">{TAROT_TOPICS.map(x=><button key={x.key} type="button" className={"pet-tarot-topic "+(todayMap[x.key]?"done":"")} onClick={()=>chooseTopic(x.key)}><span>{x.icon}</span><div><b>{x.label}</b><small>{x.desc}</small>{todayMap[x.key]&&<em>오늘 뽑기 완료 · 다시 보기</em>}</div></button>)}</div>{loadingToday&&<div className="pet-tarot-loading">오늘의 타로 기록을 확인하는 중…</div>}</>}
      {phase==="choose"&&<><button type="button" className="pet-tarot-back-link" onClick={()=>setPhase("topics")}>← 다른 주제 선택</button><div className="pet-tarot-topic-title"><span>{currentTopic.icon}</span><div><b>{currentTopic.label}</b><small>{currentTopic.desc}</small></div></div><p className="bg-sub pet-tarot-intro">22장의 메이저 아르카나가 섞여 있어요. 마음이 가는 카드 한 장을 골라보세요.</p><div className="pet-tarot-deck22">{CARD_BACKS.map(i=><button key={i} type="button" aria-label={(i+1)+"번째 타로카드"} className={"pet-tarot-back22 "+(picked===i&&phase==="drawing"?"picked":"")} onClick={()=>draw(i)}><span>✦</span><b>PetGrow</b><em>🐾</em><small>{String(i+1).padStart(2,"0")}</small></button>)}</div></>}
      {phase==="drawing"&&<div className="pet-tarot-loading">선택한 카드의 메시지를 펼치는 중…</div>}
      {phase==="result"&&result&&<><button type="button" className="pet-tarot-back-link" onClick={()=>setPhase("topics")}>← 다른 주제 보기</button><div className="pet-tarot-result-topic">{currentTopic.icon} <b>{result.topicLabel||currentTopic.label}</b><span>오늘의 카드는 이미 정해졌어요</span></div><div className="pet-tarot-result-wrap">
        <div className={"pet-tarot-face tarot-"+result.key}><div className="pet-tarot-number">{String(result.cardId).padStart(2,"0")}</div><div className="pet-tarot-art"><span>{result.symbol}</span><i>✦</i><i>•</i><i>✧</i></div><div className="pet-tarot-title"><b>{result.name}</b><small>{result.en}</small></div></div>
        <div className="pet-tarot-reading"><span className="bg-chip active">{result.keyword}</span><h3>{result.topicLabel||currentTopic.label}</h3><p>{result.topicMeaning||result.meaning}</p><h3>우리 아이에게</h3><p>{result.topicTip||result.tip}</p><div className="pet-tarot-luck">🍀 오늘의 행운 포인트 <b>{result.luck}</b></div></div>
        <div className="pet-tarot-actions"><button type="button" className="bg-btn" onClick={save} disabled={saved}>{saved?"✓ 회원정보에 저장됨":"타로카드 저장"}</button></div>
      </div><p className="pet-tarot-once-note">이 주제는 오늘 이미 뽑았어요. 내일 다시 새로운 카드를 만날 수 있어요.</p></>}
      {error&&<div className="nearby-message" style={{marginTop:12}}>{error}</div>}
      {onBack&&<button type="button" className="bg-btn bg-btn-ghost" style={{width:"100%",marginTop:18}} onClick={onBack}>돌아가기</button>}
    </div><div className="bg-sub" style={{fontSize:11,textAlign:"center",marginTop:14,lineHeight:1.65,wordBreak:"keep-all"}}>메이저 아르카나 22장의 전통적인 상징을 PetGrow식 반려생활 메시지로 재해석한 재미 콘텐츠예요. 실제 미래·건강·의학적 상태를 판단하는 자료가 아니에요.</div>
  </div>;
}

'''
    widgets=widgets[:a]+new_widget+widgets[b:]

css_marker='export const PET_DAILY_CSS=`\n'
css=r'''.pet-tarot-intro{max-width:620px;margin:8px auto 16px!important;line-height:1.7!important;word-break:keep-all}.pet-tarot-topic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-width:720px;margin:18px auto}.pet-tarot-topic{border:1px solid #dfe8df;background:rgba(255,255,255,.82);border-radius:17px;padding:15px;text-align:left;display:flex;gap:12px;align-items:flex-start;cursor:pointer}.pet-tarot-topic>span{font-size:28px}.pet-tarot-topic div{min-width:0}.pet-tarot-topic b,.pet-tarot-topic small,.pet-tarot-topic em{display:block}.pet-tarot-topic b{font-size:14px}.pet-tarot-topic small{font-size:11px;line-height:1.55;color:var(--sub);margin-top:4px;word-break:keep-all}.pet-tarot-topic em{font-style:normal;font-size:10px;color:var(--primary);font-weight:900;margin-top:7px}.pet-tarot-topic.done{background:#edf6ee;border-color:#cfe2d2}.pet-tarot-back-link{display:block;border:0;background:transparent;color:var(--sub);font-weight:800;font-size:12px;cursor:pointer;margin:0 0 12px;padding:4px 0}.pet-tarot-topic-title{display:flex;justify-content:center;align-items:center;gap:10px;margin:4px auto 10px}.pet-tarot-topic-title>span{font-size:28px}.pet-tarot-topic-title b,.pet-tarot-topic-title small{display:block;text-align:left}.pet-tarot-topic-title b{font-size:17px}.pet-tarot-topic-title small{font-size:11px;color:var(--sub);margin-top:2px}.pet-tarot-deck22{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:7px;max-width:800px;margin:18px auto 8px}.pet-tarot-back22{min-width:0;aspect-ratio:2/3;border:1.5px solid #d6c7a1;border-radius:10px;background:linear-gradient(145deg,#314b3a,#182d22);color:#f7e8bd;box-shadow:0 7px 14px rgba(24,45,34,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;transition:.18s;padding:5px}.pet-tarot-back22:hover{transform:translateY(-6px)}.pet-tarot-back22>span{font-size:15px}.pet-tarot-back22>b{font-size:7px}.pet-tarot-back22>em{font-style:normal;font-size:11px}.pet-tarot-back22>small{font-size:7px;opacity:.7}.pet-tarot-back22.picked{transform:translateY(-10px) rotateY(180deg)}.pet-tarot-result-topic{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;margin:3px 0 12px}.pet-tarot-result-topic b{font-size:14px}.pet-tarot-result-topic span{font-size:10px;color:var(--sub)}.pet-tarot-once-note{text-align:center;font-size:11px;color:var(--sub);margin:13px 0 0;word-break:keep-all}.pet-tarot-reading p{word-break:keep-all;overflow-wrap:break-word}.pet-tarot-actions .bg-btn{min-width:180px}
@media(max-width:760px){.pet-tarot-stage{padding:18px 14px!important}.pet-tarot-topic-grid{grid-template-columns:1fr}.pet-tarot-deck22{grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.pet-tarot-result-wrap{grid-template-columns:145px minmax(0,1fr)!important;gap:13px!important}.pet-tarot-face{padding:10px!important}.pet-tarot-art span{font-size:48px!important}.pet-tarot-reading p{font-size:12px!important;line-height:1.65!important}}
@media(max-width:480px){.pet-tarot-deck22{grid-template-columns:repeat(5,minmax(0,1fr))}.pet-tarot-result-wrap{grid-template-columns:1fr!important}.pet-tarot-face{width:min(210px,72vw);margin:0 auto}.pet-tarot-reading{text-align:left}.pet-tarot-actions .bg-btn{width:100%}}
'''
if 'pet-tarot-deck22' not in widgets.split('export const PET_DAILY_CSS=',1)[-1]:
    widgets=replace_once(widgets,css_marker,css_marker+css,'tarot css')

old_effect=' useEffect(()=>{if(!account)return;jsonFetch("/api/tarot?action=history").then(j=>setItems(j.items||[])).catch(()=>{});},[account?.id]);'
new_effect=' const loadHistory=()=>{if(!account)return;jsonFetch("/api/tarot?action=history").then(j=>setItems(j.items||[])).catch(()=>{});};\n useEffect(()=>{loadHistory();const fn=()=>loadHistory();window.addEventListener("petgrow:tarot-saved",fn);return()=>window.removeEventListener("petgrow:tarot-saved",fn);},[account?.id]);'
if old_effect in widgets: widgets=widgets.replace(old_effect,new_effect,1)
widgets=widgets.replace('{x.pet_name} · {x.content_type==="tarot"?(x.result_json?.name||"타로"):"오늘의 펫운세"}','{x.pet_name} · {x.content_type==="tarot"?((x.result_json?.topicLabel||"Pet타로")+" · "+(x.result_json?.name||"타로")):"오늘의 펫운세"}')

if "tarot:{eyebrow:'PETGROW TAROT'" not in app:
    app=replace_once(app,
"    saju:{eyebrow:'PETGROW CONTENT',ko:'Pet사주',en:'Pet Saju',koDesc:'우리 아이의 생년월일을 바탕으로 재미로 즐기는 특별한 이야기를 만나보세요.',enDesc:'Enjoy a lighthearted pet fortune story based on your pet profile.'},",
"    saju:{eyebrow:'PETGROW CONTENT',ko:'Pet사주',en:'Pet Saju',koDesc:'우리 아이의 생년월일을 바탕으로 재미로 즐기는 특별한 이야기를 만나보세요.',enDesc:'Enjoy a lighthearted pet fortune story based on your pet profile.'},\n    tarot:{eyebrow:'PETGROW TAROT',ko:'Pet타로',en:'Pet Tarot',koDesc:'22장의 메이저 아르카나에서 오늘·궁합·마음·산책·조언 주제별로 하루 한 장의 메시지를 만나보세요.',enDesc:'Draw one Major Arcana card per topic each day for a lighthearted pet-life message.'},",
'unified tarot hero')

app=app.replace('["saju", "🔮", lang === "en" ? "Pet Saju" : "Pet사주"],','["saju", "🔮", lang === "en" ? "Pet Saju" : "Pet사주"],\n    ["tarot", "🃏", lang === "en" ? "Pet Tarot" : "Pet타로"],')
app=app.replace('  saju: { icon: "🔮", koTitle: "Pet사주", koBody: "기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합 중 원하는 콘텐츠를 골라 재미로 즐겨보세요.", enTitle: "Pet Saju", enBody: "Enjoy Pet Saju, today\'s fortune, Pet Tarot, or guardian compatibility for fun." },','  saju: { icon: "🔮", koTitle: "Pet사주", koBody: "기본 Pet사주, 오늘의 펫운세, 보호자 궁합을 재미로 즐겨보세요.", enTitle: "Pet Saju", enBody: "Enjoy Pet Saju, today\'s fortune, or guardian compatibility for fun." },\n  tarot: { icon: "🃏", koTitle: "Pet타로", koBody: "22장의 메이저 아르카나에서 주제별로 하루 한 장을 뽑고 오늘의 메시지를 저장해보세요.", enTitle: "Pet Tarot", enBody: "Draw one card per topic each day and save the reading to your account." },')
app=app.replace('<button className={view === "saju" ? "active" : ""} onClick={() => goView("saju")}><SajuIcon /><span>{t.sajuNav}</span></button>','<button className={view === "saju" ? "active" : ""} onClick={() => goView("saju")}><SajuIcon /><span>{t.sajuNav}</span></button>\n            <button className={view === "tarot" ? "active" : ""} onClick={() => goView("tarot")}><span style={{fontSize:18}}>🃏</span><span>{lang === "en" ? "Pet Tarot" : "Pet타로"}</span></button>',1)
app=app.replace('<button type="button" className={`desktop-nav-link ${view === "saju" ? "active" : ""}`} onClick={() => goView("saju")}><SajuIcon />{t.sajuNav}</button>','<button type="button" className={`desktop-nav-link ${view === "saju" ? "active" : ""}`} onClick={() => goView("saju")}><SajuIcon />{t.sajuNav}</button>\n                <button type="button" className={`desktop-nav-link ${view === "tarot" ? "active" : ""}`} onClick={() => goView("tarot")}><span style={{fontSize:15}}>🃏</span>{lang === "en" ? "Pet Tarot" : "Pet타로"}</button>',1)
app=app.replace('{ key: "saju", label: t.sajuNav, Icon: SajuIcon },','{ key: "saju", label: t.sajuNav, Icon: SajuIcon },\n    { key: "tarot", label: lang === "en" ? "Pet Tarot" : "Pet타로", Icon: SajuIcon },',1)
app=app.replace('["saju","🔮","Pet사주",lang==="en"?"Fun pet fortune content":"우리 아이의 재미있는 Pet사주"],','["saju","🔮","Pet사주",lang==="en"?"Fun pet fortune content":"우리 아이의 재미있는 Pet사주"],\n    ["tarot","🃏","Pet타로",lang==="en"?"One card per topic each day":"오늘·궁합·마음·산책·조언 주제별 하루 한 장"],',1)
app=app.replace('["community","tips","saju","petbti","guide","my","more","support","ad-inquiry"]','["community","tips","saju","tarot","petbti","guide","my","more","support","ad-inquiry"]',1)

if 'effectiveView === "tarot" ?' not in app:
    app=replace_once(app,
'''      ) : effectiveView === "petbti" ? (
        <div className="legal-page-shell feature-page-shell feature-page-petbti">''',
'''      ) : effectiveView === "tarot" ? (
        <div className="legal-page-shell feature-page-shell feature-page-tarot">
          <PetPicker pets={allPets} activeId={featurePet?.id} onSelect={setFeaturePetId} />
          {featurePet ? <PetTarotPanel pet={featurePet} lang={lang} /> : <div className="bg-card" style={{textAlign:"center",padding:28}}><b>Pet타로를 보려면 우리 아이를 먼저 등록해 주세요.</b><button className="bg-btn" style={{display:"block",margin:"14px auto 0"}} onClick={()=>{setMode("onboarding");goView("pets")}}>우리 아이 등록</button></div>}
        </div>
      ) : effectiveView === "petbti" ? (
        <div className="legal-page-shell feature-page-shell feature-page-petbti">''','route tarot')

app=re.sub(r'\n\s*\{ id: "tarot", icon: "🃏"[^\n]*\},','',app,count=1)
app=app.replace('기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합 중 원하는 콘텐츠를 골라 재미로 즐겨보세요.','기본 Pet사주, 오늘의 펫운세, 보호자 궁합 중 원하는 콘텐츠를 골라 재미로 즐겨보세요.')
app=app.replace("Enjoy Pet Saju, today's fortune, Pet Tarot, or guardian compatibility for fun.","Enjoy Pet Saju, today's fortune, or guardian compatibility for fun.")

if '"🃏 Pet Tarot"' not in app:
    anchor='            <LandingFeatureCard Illust={IllustSaju} title={t.landingCardSajuTitle} desc={t.landingCardSajuDesc} />'
    app=replace_once(app,anchor,anchor+'\n            <LandingFeatureCard Illust={SajuIcon} title={lang === "en" ? "🃏 Pet Tarot" : "🃏 Pet타로"} desc={lang === "en" ? "Draw one Major Arcana card per topic each day and save the reading." : "오늘·궁합·마음·산책·조언 주제별로 하루 한 장을 뽑고 결과를 저장해요."} />','about tarot card')

app=app.replace('Pet사주·오늘의 펫운세·저장한 Pet타로 등 저장이 필요한 서비스 정보','Pet사주·오늘의 펫운세 및 Pet타로의 선택 주제·뽑은 카드·저장 여부 등 저장이 필요한 서비스 정보')
app=app.replace('기본 Pet사주, 오늘의 펫운세, 오늘의 Pet타로, 보호자 궁합 및 PetBTI는 재미와 참고를 위한 콘텐츠','기본 Pet사주, 오늘의 펫운세, 보호자 궁합, Pet타로 및 PetBTI는 재미와 참고를 위한 콘텐츠')
app=app.replace('Pet사주(기본 Pet사주·오늘의 펫운세·오늘의 Pet타로·보호자 궁합), PetBTI','Pet사주(기본 Pet사주·오늘의 펫운세·보호자 궁합), Pet타로(주제별 하루 1회), PetBTI')
app=app.replace('타로는 메이저 아르카나 22장의 전통적인 상징을 PetGrow식 반려생활 메시지로 재해석하며, 직전에 뽑은 카드와 같은 카드는 연속으로 나오지 않아요.','Pet타로는 메이저 아르카나 22장의 전통적인 상징을 PetGrow식 반려생활 메시지로 재해석하며, 각 주제별로 반려동물 1마리당 하루 1회만 뽑을 수 있어요.')

app_path.write_text(app,encoding='utf-8')
widgets_path.write_text(widgets,encoding='utf-8')
tarot_path.write_text(tarot,encoding='utf-8')
print('PetTarot v3 menu/topics patch applied')
