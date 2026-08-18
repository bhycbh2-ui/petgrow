import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
const block = app.slice(start, end);
if (block.includes('id: "t171"')) {
  console.log('2026-08-18 PetInfo items already present.');
  process.exit(0);
}

const additions = `
  { id: "t171", category: "dog", featured: true,
    title: { ko: "산책 전 하네스와 리드줄 연결부를 확인해요", en: "Check harness and leash connections before walks" },
    summary: { ko: "버클이나 고리가 느슨하면 갑작스러운 움직임에 풀릴 수 있어요.", en: "Loose buckles or clips can come undone during sudden movement." },
    body: { ko: "출발 전에 버클이 끝까지 잠겼는지, 리드줄 고리가 제대로 걸렸는지 확인하고 마모된 부분이 있으면 교체해 주세요.", en: "Before leaving, confirm buckles are fully fastened, clips are secure, and replace worn gear." } },
  { id: "t172", category: "dog", featured: false,
    title: { ko: "새 장난감은 처음엔 함께 지켜봐 주세요", en: "Supervise your dog with new toys at first" },
    summary: { ko: "장난감의 크기와 내구성이 우리 아이에게 맞는지 처음 사용 때 확인하는 게 좋아요.", en: "The first use helps you check whether a toy's size and durability suit your dog." },
    body: { ko: "뜯어진 조각이나 느슨한 부품이 생기면 바로 치우고, 입보다 지나치게 작은 장난감은 삼킴 위험 때문에 피해주세요.", en: "Remove toys that break into pieces or develop loose parts, and avoid items small enough to swallow." } },
  { id: "t173", category: "cat", featured: true,
    title: { ko: "고양이 숨숨집은 조용한 곳에도 하나 두세요", en: "Give cats a quiet hiding place" },
    summary: { ko: "사람 왕래가 적은 안전한 공간은 고양이가 스스로 쉬고 긴장을 낮추는 데 도움이 돼요.", en: "A quiet secure retreat gives cats a place to rest away from household traffic." },
    body: { ko: "숨숨집이나 박스를 억지로 꺼내는 장소로 사용하지 말고, 필요할 때 혼자 머물 수 있는 안전한 공간으로 유지해 주세요.", en: "Keep hiding places as safe retreats and avoid pulling the cat out when it chooses to rest there." } },
  { id: "t174", category: "cat", featured: false,
    title: { ko: "낚싯대 장난감은 놀이 후 보관해요", en: "Put wand toys away after play" },
    summary: { ko: "끈이나 실이 달린 장난감은 혼자 갖고 놀다 몸에 감기거나 삼킬 수 있어요.", en: "Strings on wand toys can tangle around a cat or be swallowed when unsupervised." },
    body: { ko: "함께 놀 때만 꺼내고 놀이가 끝나면 닫힌 서랍이나 수납함에 보관해 주세요. 끈이 풀리거나 헤진 부분도 자주 확인하세요.", en: "Use string toys during supervised play, store them securely afterward, and check regularly for fraying." } },
  { id: "t175", category: "health", featured: true,
    title: { ko: "평소 먹고 마시는 양의 변화를 기록해요", en: "Track changes in eating and drinking habits" },
    summary: { ko: "평소 패턴을 알아두면 갑작스러운 식욕이나 음수량 변화를 더 빨리 알아차릴 수 있어요.", en: "Knowing the usual pattern makes sudden appetite or drinking changes easier to notice." },
    body: { ko: "며칠간 눈에 띄는 변화가 계속되거나 구토·설사·무기력 같은 증상이 함께 나타나면 임의로 약을 먹이기보다 수의사와 상담하세요.", en: "If a marked change persists or comes with vomiting, diarrhea, or lethargy, contact a veterinarian rather than giving medication on your own." } },
  { id: "t176", category: "health", featured: false,
    title: { ko: "예방진료 일정은 한곳에 모아두면 편해요", en: "Keep preventive-care dates in one place" },
    summary: { ko: "검진·예방접종·기생충 예방 일정은 기록해두면 놓치기 쉬운 시기를 관리하기 좋아요.", en: "A single record makes routine exams, vaccinations, and parasite-prevention schedules easier to manage." },
    body: { ko: "필요한 주기와 항목은 나이·생활환경·지역에 따라 달라질 수 있으니 우리 아이의 담당 수의사와 맞춤 일정을 정해 주세요.", en: "Timing varies with age, lifestyle, and location, so set an individualized schedule with your veterinarian." } },
  { id: "t177", category: "life", featured: false,
    title: { ko: "외출 전 반려동물이 머무를 실내 온도를 확인해요", en: "Check indoor conditions before leaving pets alone" },
    summary: { ko: "계절에 따라 실내가 예상보다 빠르게 덥거나 추워질 수 있어요.", en: "Indoor temperatures can change faster than expected with the season." },
    body: { ko: "직사광선이 오래 드는 자리와 냉난방기 바람이 직접 닿는 곳은 피하고, 깨끗한 물과 편히 쉴 공간을 준비해 주세요.", en: "Avoid prolonged direct sun or strong HVAC drafts, and provide fresh water and a comfortable resting area." } },
  { id: "t178", category: "life", featured: false,
    title: { ko: "여행 전 이동장 적응을 미리 시작해요", en: "Practice carrier time before travel" },
    summary: { ko: "이동장을 여행 당일에만 꺼내면 낯선 공간 자체가 스트레스가 될 수 있어요.", en: "A carrier used only on travel day can feel unfamiliar and stressful." },
    body: { ko: "평소 문을 열어둔 채 익숙한 담요나 간식을 활용해 스스로 들어가 쉬는 경험을 만들고, 짧은 이동부터 천천히 늘려주세요.", en: "Leave the carrier open with familiar bedding or treats and build up gradually from short practice trips." } },
  { id: "t179", category: "food", featured: false,
    title: { ko: "사료 봉투의 로트번호와 소비기한을 남겨두세요", en: "Keep pet-food lot and date information" },
    summary: { ko: "제품 문제가 생겼을 때 원래 포장 정보가 있으면 확인과 신고에 도움이 돼요.", en: "Original package details help identify a product if a problem or recall occurs." },
    body: { ko: "FDA는 건사료를 가능하면 원래 봉투째 보관하고 로트번호·제품명·제조사·날짜 정보를 유지하도록 안내해요. 다른 통에 넣는다면 용기를 깨끗하고 건조하게 관리하세요.", en: "FDA advises retaining the original bag and lot, product, manufacturer, and date information; if using another container, keep it clean and dry." } },
  { id: "t180", category: "food", featured: false,
    title: { ko: "습식사료 남은 양은 오래 실온에 두지 않아요", en: "Don't leave leftover wet food out for long" },
    summary: { ko: "개봉한 캔이나 파우치 사료는 남은 양을 바로 냉장 보관하거나 버리는 게 안전해요.", en: "Unused opened canned or pouched food should be refrigerated promptly or discarded." },
    body: { ko: "FDA는 사용하지 않은 캔·파우치 사료를 신속히 냉장하거나 폐기하고, 사료 그릇과 계량도구도 사용 후 세척·건조하도록 안내해요.", en: "FDA recommends promptly refrigerating or discarding leftovers and washing and drying food bowls and measuring utensils after use." } },
  { id: "t181", category: "training", featured: false,
    title: { ko: "훈련은 한 번에 길게보다 짧게 나눠요", en: "Keep training sessions short and repeatable" },
    summary: { ko: "짧은 성공을 여러 번 만드는 편이 집중이 흐트러진 상태로 오래 반복하는 것보다 좋아요.", en: "Several short successful sessions are often easier to sustain than one long distracted session." },
    body: { ko: "쉬운 행동부터 시작해 성공하면 바로 보상하고, 집중이 떨어지기 전에 마무리해 주세요. 같은 신호어를 가족이 일관되게 사용하는 것도 중요해요.", en: "Start with easy behaviors, reward promptly, finish before attention fades, and have household members use consistent cues." } },
  { id: "t182", category: "training", featured: false,
    title: { ko: "문 앞 돌진은 기다림부터 천천히 연습해요", en: "Teach calm waiting at doors gradually" },
    summary: { ko: "문이 열리는 순간 뛰어나가는 습관은 짧은 기다림 연습으로 단계적으로 바꿀 수 있어요.", en: "Door rushing can be addressed by gradually reinforcing brief calm waits." },
    body: { ko: "처음에는 문을 조금만 열고 차분히 기다리면 보상하세요. 흥분하면 다시 닫고 난이도를 낮춰 반복하며, 실제 외출에서는 반드시 리드줄을 먼저 연결하세요.", en: "Open the door only slightly, reward calm waiting, reduce difficulty if excitement rises, and attach the leash before real outings." } },
  { id: "t183", category: "safety", featured: false,
    title: { ko: "사람 약은 높은 선반보다 잠기는 곳에 보관해요", en: "Store human medications in a secure closed location" },
    summary: { ko: "반려동물은 높은 곳에도 올라가거나 떨어진 약을 주워 먹을 수 있어 단순히 손이 안 닿는 곳만으로는 부족할 수 있어요.", en: "Pets may climb or find dropped pills, so height alone may not be secure enough." },
    body: { ko: "FDA는 사람용·동물용 약을 원래 용기에 넣어 라벨을 유지하고 반려동물이 접근할 수 없는 안전한 장소에 보관하도록 안내해요. 먹었을 가능성이 있으면 즉시 동물병원에 문의하세요.", en: "FDA advises keeping medicines in original labeled containers in a secure location; contact a veterinarian promptly if ingestion is suspected." } },
  { id: "t184", category: "safety", featured: false,
    title: { ko: "세정제는 라벨 사용법을 지키고 접근을 막아요", en: "Use cleaners as labeled and keep them inaccessible" },
    summary: { ko: "가정용 세정제도 농도와 사용법에 따라 반려동물에게 자극이나 위험이 될 수 있어요.", en: "Household cleaners can irritate or harm pets depending on concentration and exposure." },
    body: { ko: "사용 중에는 반려동물이 핥거나 밟지 않게 분리하고 제품 라벨의 희석·환기·건조 지침을 따르세요. 노출이 의심되면 임의로 처치하지 말고 수의사에게 문의하세요.", en: "Keep pets away during use, follow label directions for dilution, ventilation, and drying, and seek veterinary advice if exposure is suspected." } },
  { id: "t185", category: "grooming", featured: false,
    title: { ko: "미끄럼 방지 매트로 목욕 자세를 안정시켜요", en: "Use a non-slip surface during baths" },
    summary: { ko: "욕조나 세면대 바닥이 미끄러우면 반려동물이 불안해하고 갑자기 움직일 수 있어요.", en: "Slippery bath surfaces can make pets anxious and unstable." },
    body: { ko: "바닥에 미끄럼 방지 매트나 젖어도 움직이지 않는 수건을 깔고, 물 온도와 수압을 먼저 확인한 뒤 천천히 씻겨주세요.", en: "Use a stable non-slip mat or towel, check water temperature and pressure first, and bathe calmly." } },
  { id: "t186", category: "grooming", featured: false,
    title: { ko: "귀 청소는 보이는 부분 위주로 부드럽게 해요", en: "Clean only the visible outer ear gently" },
    summary: { ko: "면봉을 깊숙이 넣으면 귀 안쪽을 자극하거나 이물질을 더 밀어 넣을 수 있어요.", en: "Inserting cotton swabs deeply can irritate the ear or push debris farther in." },
    body: { ko: "반려동물용 귀 세정제를 사용할 때는 제품과 수의사 안내를 따르고, 심한 냄새·통증·분비물·반복적인 머리 흔들기가 있으면 청소를 반복하기보다 진료를 받아보세요.", en: "Follow product and veterinary directions for ear cleaners; seek veterinary care for strong odor, pain, discharge, or persistent head shaking." } },
`;

app = app.slice(0, end) + additions + app.slice(end);
fs.writeFileSync(path, app);
console.log('Added 16 PetInfo items (t171-t186), including 3 featured items.');
