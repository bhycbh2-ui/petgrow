import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { getSessionUserId } from "./session.js";

const CARDS=[
[0,"fool","바보","The Fool","🐾","새로운 시작","호기심과 가벼운 마음으로 새로운 경험을 즐기기 좋은 흐름이에요.","처음 보는 장난감이나 새로운 산책길을 천천히 경험해봐요.","새로운 냄새"],
[1,"magician","마법사","The Magician","✨","재능과 집중","우리 아이가 가진 장점과 재능이 유난히 잘 드러나는 날이에요.","잘하는 놀이를 칭찬하며 자신감을 북돋아 주세요.","칭찬 한마디"],
[2,"priestess","여사제","The High Priestess","🌙","직감과 관찰","말보다 분위기와 보호자의 감정을 섬세하게 읽는 기운이 강한 날이에요.","조용한 시간을 함께 보내며 편안한 신호를 관찰해봐요.","조용한 창가"],
[3,"empress","여황제","The Empress","🌿","풍요와 돌봄","포근한 돌봄과 안정감이 우리 아이에게 큰 행복으로 돌아오는 날이에요.","빗질이나 쓰다듬기처럼 편안한 교감 시간을 가져봐요.","포근한 담요"],
[4,"emperor","황제","The Emperor","🛡️","안정과 규칙","익숙한 규칙과 안정된 일상이 마음을 편하게 해주는 흐름이에요.","식사와 산책 시간을 평소 리듬대로 유지해 주세요.","익숙한 루틴"],
[5,"hierophant","교황","The Hierophant","🔔","배움과 습관","기본적인 습관을 다시 익히거나 좋은 행동을 강화하기 좋은 날이에요.","짧고 즐거운 교육으로 성공 경험을 만들어 주세요.","작은 간식"],
[6,"lovers","연인","The Lovers","💞","유대와 선택","보호자와의 유대감이 특히 따뜻하게 느껴지는 하루예요.","눈을 맞추고 이름을 불러주는 시간을 조금 더 가져봐요.","함께 찍는 사진"],
[7,"chariot","전차","The Chariot","🏃","활력과 전진","움직이고 탐색하고 싶은 에너지가 평소보다 높아질 수 있어요.","무리하지 않는 범위에서 산책이나 놀이 시간을 충분히 주세요.","산책길"],
[8,"strength","힘","Strength","🦁","용기와 다정함","작은 용기가 큰 자신감으로 이어질 수 있는 날이에요.","무서워하던 것을 억지로 밀어붙이지 말고 작은 성공부터 칭찬해 주세요.","부드러운 목소리"],
[9,"hermit","은둔자","The Hermit","🏮","휴식과 성찰","활동보다 조용히 쉬며 에너지를 채우는 시간이 잘 맞는 하루예요.","혼자 쉬고 싶어 하는 신호가 보이면 편안한 공간을 마련해 주세요.","나만의 자리"],
[10,"wheel","운명의 수레바퀴","Wheel of Fortune","🎡","변화와 기회","평소와 조금 다른 즐거운 변화가 찾아오기 쉬운 날이에요.","새로운 놀이를 하나 추가해 소소한 변화를 만들어봐요.","뜻밖의 간식"],
[11,"justice","정의","Justice","⚖️","균형과 조절","놀이와 휴식, 간식과 식사의 균형을 맞추는 것이 중요한 날이에요.","과한 활동이나 간식보다 적당한 균형을 챙겨 주세요.","균형 잡힌 하루"],
[12,"hanged","매달린 사람","The Hanged Man","🍃","기다림과 관점","서두르기보다 우리 아이의 속도에 맞춰 기다려주는 것이 좋은 흐름이에요.","새로운 상황에 적응할 시간을 충분히 주세요.","느긋한 기다림"],
[13,"death","죽음","Death","🦋","끝과 변화","무서운 의미가 아니라 오래된 습관을 내려놓고 새로운 리듬을 시작하는 카드예요.","불편했던 생활 습관 하나를 부드럽게 바꿔보세요.","새로운 루틴"],
[14,"temperance","절제","Temperance","💧","조화와 회복","흥분과 휴식 사이의 균형을 찾으면 컨디션이 편안해지는 날이에요.","놀이 뒤에는 물과 충분한 휴식을 챙겨 주세요.","깨끗한 물"],
[15,"devil","악마","The Devil","🍖","유혹과 집착","좋아하는 간식이나 장난감에 평소보다 집착할 수 있는 흐름을 뜻해요.","즐거움은 유지하되 간식과 놀이 시간을 적당히 조절해 주세요.","절제된 간식"],
[16,"tower","탑","The Tower","⚡","갑작스러운 변화","예상하지 못한 소리나 일정 변화에 예민해질 수 있는 날이에요.","놀랄 만한 상황이 생기면 익숙한 공간에서 차분히 안정시켜 주세요.","안전한 숨숨집"],
[17,"star","별","The Star","⭐","희망과 회복","마음이 맑아지고 편안한 교감이 잘 이어지는 따뜻한 카드예요.","좋아하는 행동을 함께하며 기분 좋은 기억을 만들어 주세요.","밤하늘 산책"],
[18,"moon","달","The Moon","🌙","감수성과 불확실함","낯선 소리나 분위기에 평소보다 예민하게 반응할 수 있어요.","억지로 적응시키기보다 익숙한 냄새와 공간으로 안심시켜 주세요.","익숙한 냄새"],
[19,"sun","태양","The Sun","☀️","기쁨과 활력","밝은 에너지와 즐거움이 가득해 보호자와 신나게 교감하기 좋은 날이에요.","햇살을 느끼며 즐거운 산책이나 놀이를 해봐요.","햇살"],
[20,"judgement","심판","Judgement","📯","깨달음과 변화","우리 아이가 보내던 작은 신호를 새롭게 이해하게 될 수 있는 날이에요.","평소 행동을 유심히 관찰하고 새로운 장점을 찾아 칭찬해 주세요.","새로운 발견"],
[21,"world","세계","The World","🌎","완성과 만족","익숙한 사람과 공간 속에서 안정감과 만족을 크게 느끼는 하루예요.","좋아하는 일상을 함께하며 충분히 행복을 표현해 주세요.","함께하는 시간"]
].map(([id,key,name,en,symbol,keyword,meaning,tip,luck])=>({id,key,name,en,symbol,keyword,meaning,tip,luck}));

const TAROT_TOPICS={
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

const clean=(v,max=120)=>String(v||"").trim().slice(0,max);
const todayKst=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
async function ensure(){await sql`create table if not exists pg_pet_daily_content(id text primary key,user_id text not null,pet_id text not null,pet_name text not null,content_type text not null,content_date text not null,result_json jsonb not null,saved boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now())`;await sql`create index if not exists pg_pet_daily_content_user_date_idx on pg_pet_daily_content(user_id,content_date,content_type)`;}
async function stat(uid,feature){try{await sql`create table if not exists pg_feature_usage(id text primary key,user_id text,feature text not null,created_at timestamptz not null default now())`;await sql`insert into pg_feature_usage(id,user_id,feature) values(${crypto.randomUUID()},${uid},${feature})`}catch{}}

export async function handleTarot(req,res){
 const uid=getSessionUserId(req); if(!uid)return res.status(401).json({error:"로그인이 필요해요."});
 await ensure(); const action=clean(req.query.action||"today",30),today=todayKst();
 try{
  if(req.method==="GET"&&action==="today"){const {rows}=await sql`select id,pet_id,pet_name,content_type,result_json,saved,created_at from pg_pet_daily_content where user_id=${uid} and content_date=${today} order by created_at desc`;return res.status(200).json({date:today,items:rows});}
  if(req.method==="GET"&&action==="history"){const {rows}=await sql`select id,pet_id,pet_name,content_type,content_date,result_json,saved,created_at from pg_pet_daily_content where user_id=${uid} and saved=true order by created_at desc limit 60`;return res.status(200).json({items:rows});}
  if(req.method==="POST"&&action==="fortune"){const petId=clean(req.body?.petId,100),petName=clean(req.body?.petName,60),message=clean(req.body?.message,600);if(!petId||!petName||!message)return res.status(400).json({error:"운세 정보가 부족해요."});const id=`fortune:${uid}:${petId}:${today}`,result={message};await sql`insert into pg_pet_daily_content(id,user_id,pet_id,pet_name,content_type,content_date,result_json,saved) values(${id},${uid},${petId},${petName},'fortune',${today},${JSON.stringify(result)}::jsonb,true) on conflict(id) do update set result_json=excluded.result_json,saved=true,updated_at=now()`;await stat(uid,"saju_daily");return res.status(200).json({ok:true,id,date:today,result});}
  if(req.method==="POST"&&action==="draw"){
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
  if(req.method==="POST"&&action==="save"){const id=clean(req.body?.id,100);const {rowCount}=await sql`update pg_pet_daily_content set saved=true,updated_at=now() where id=${id} and user_id=${uid} and content_type='tarot'`;if(!rowCount)return res.status(404).json({error:"저장할 타로 결과를 찾지 못했어요."});await stat(uid,"saju_tarot_save");return res.status(200).json({ok:true});}
  return res.status(405).json({error:"지원하지 않는 요청이에요."});
 }catch(e){console.error("core tarot error",e?.message||e);return res.status(500).json({error:"결과를 처리하지 못했어요. 잠시 후 다시 시도해 주세요."});}
}
