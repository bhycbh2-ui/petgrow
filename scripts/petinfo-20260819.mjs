import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
const block = app.slice(start, end);

if (block.includes('id: "t187"')) {
  console.log('2026-08-19 PetInfo items already present.');
  process.exit(0);
}
if (!block.includes('id: "t186"')) throw new Error('Expected current PetInfo tail t186 was not found; refusing to update a stale or changed dataset.');

const additions = `
  { id: "t187", category: "dog", featured: true,
    title: { ko: "산책에서는 냄새 맡는 시간도 충분히 주세요", en: "Make room for sniffing during walks" },
    summary: { ko: "걷는 거리만 채우기보다 안전한 곳에서 냄새를 탐색할 시간을 주면 산책의 자극이 더 다양해져요.", en: "A walk can include safe sniffing and exploration, not only covering distance." },
    body: { ko: "사람이나 차량 통행을 방해하지 않는 곳에서는 리드줄을 안전하게 유지한 채 잠시 냄새를 맡게 해주세요. 계속 끌고 가기보다 아이의 속도와 주변 환경을 함께 살피는 방식이 좋아요.", en: "In a safe area, keep the leash secure and allow brief sniffing breaks while watching traffic, other animals, and your dog's comfort." } },
  { id: "t188", category: "dog", featured: false,
    title: { ko: "장난감은 일부씩 번갈아 꺼내주세요", en: "Rotate a few dog toys at a time" },
    summary: { ko: "늘 같은 장난감을 전부 펼쳐두기보다 일부를 번갈아 보여주면 새롭게 탐색하는 재미를 만들 수 있어요.", en: "Rotating a small selection of toys can renew interest without constantly buying new ones." },
    body: { ko: "좋아하는 장난감 몇 개만 남기고 나머지는 잠시 보관했다가 교체해보세요. 교체할 때마다 찢어짐·느슨한 부품·삼킬 만한 조각이 없는지도 함께 확인해 주세요.", en: "Keep a few favorites available, rotate the rest, and inspect every toy for tears, loose parts, or swallowable pieces before returning it." } },
  { id: "t189", category: "cat", featured: true,
    title: { ko: "고양이 장난감은 몸에서 멀어지듯 움직여보세요", en: "Move cat toys like prey moving away" },
    summary: { ko: "장난감을 얼굴 쪽으로 계속 들이밀기보다 멀어지고 숨는 움직임을 섞으면 추적 행동을 유도하기 쉬워요.", en: "Toy movement that retreats and hides can be more engaging than repeatedly moving toward a cat's face." },
    body: { ko: "낚싯대나 작은 장난감을 바닥 가까이 움직이며 가구 뒤로 잠깐 숨겼다가 다시 보여주세요. 놀이가 끝나면 잡는 경험을 주고 끈 장난감은 손이 닿지 않는 곳에 보관하세요.", en: "Move the toy near the floor, briefly hide it behind furniture, let the cat catch it at the end, and store string toys securely after play." } },
  { id: "t190", category: "cat", featured: false,
    title: { ko: "물그릇 위치를 여러 곳에서 시험해보세요", en: "Try water stations in more than one location" },
    summary: { ko: "고양이마다 선호하는 물그릇 위치가 달라 한곳만 고집하기보다 조용하고 접근하기 쉬운 장소를 시험해볼 수 있어요.", en: "Cats can differ in where they prefer to drink, so more than one quiet, accessible water station may help." },
    body: { ko: "밥그릇이나 화장실 바로 옆만 고집하지 말고 자주 지나는 조용한 장소에도 깨끗한 물을 두어 반응을 살펴보세요. 물그릇은 정기적으로 세척하고 물도 신선하게 유지해 주세요.", en: "Try a clean water bowl in another quiet, easy-to-reach spot rather than relying on one location, and keep bowls clean with fresh water." } },
  { id: "t191", category: "health", featured: true,
    title: { ko: "진료 전 복용 중인 약과 보충제 목록을 준비해요", en: "Bring a medication and supplement list to vet visits" },
    summary: { ko: "처방약뿐 아니라 영양제·보충제까지 함께 알려주면 수의사가 현재 복용 내용을 파악하는 데 도움이 돼요.", en: "A complete list of medicines and supplements helps the veterinary team understand what your pet is currently taking." },
    body: { ko: "제품명·용량·투여 횟수를 메모하거나 라벨 사진을 준비해 주세요. 새 약이나 보충제를 시작·중단하거나 용량을 바꾸기 전에는 기존 질환과 다른 복용 제품을 고려해 담당 수의사와 상의하는 것이 안전해요.", en: "Note product names, doses, and frequency or bring label photos, and discuss starting, stopping, or changing products with your veterinarian." } },
  { id: "t192", category: "health", featured: false,
    title: { ko: "체중과 함께 체형·근육 변화도 살펴봐요", en: "Track body and muscle condition along with weight" },
    summary: { ko: "체중 숫자가 비슷해도 지방과 근육 상태는 달라질 수 있어 몸의 변화를 함께 보는 것이 좋아요.", en: "Pets can have similar body weight while fat and muscle condition change, so weight alone does not show the whole picture." },
    body: { ko: "WSAVA는 영양 평가에 체형점수와 근육상태 평가 도구를 활용하고 있어요. 갈비뼈 촉감이나 허리선, 근육량이 눈에 띄게 변하면 임의로 급여량만 크게 조절하지 말고 수의사와 원인을 확인해 주세요.", en: "WSAVA nutrition resources include body- and muscle-condition assessment tools; discuss noticeable changes with your veterinarian rather than making large diet changes on your own." } },
  { id: "t193", category: "life", featured: false,
    title: { ko: "펫시터에게 전달할 돌봄 메모를 한 장으로 정리해요", en: "Prepare a one-page care note for pet sitters" },
    summary: { ko: "급여·산책·화장실·약·병원 연락처를 한곳에 적어두면 보호자가 없을 때도 돌봄 기준을 맞추기 쉬워요.", en: "A concise care sheet helps a sitter follow feeding, walks, litter, medication, and emergency contact routines." },
    body: { ko: "평소 루틴과 피해야 할 음식·행동, 주치의 연락처, 이동장 위치까지 적어두고 내용이 바뀌면 갱신해 주세요. 약이 있다면 임의로 용량을 바꾸지 않도록 정확한 지시를 남겨주세요.", en: "Include routines, things to avoid, veterinary contacts, carrier location, and exact medication instructions, and update the sheet when anything changes." } },
  { id: "t194", category: "life", featured: false,
    title: { ko: "이사 후에는 익숙한 한 공간부터 천천히 넓혀요", en: "Let pets settle into a new home gradually" },
    summary: { ko: "낯선 집 전체를 한꺼번에 탐색시키기보다 익숙한 침구와 물건이 있는 안정된 공간부터 시작할 수 있어요.", en: "Starting with a familiar, secure area can make a new home less overwhelming." },
    body: { ko: "문단속을 확인한 조용한 방에 기존 침구·물·화장실 등 익숙한 물건을 두고 아이가 안정되면 활동 범위를 천천히 넓혀주세요. 숨거나 경계할 때 억지로 끌어내지 않는 것이 좋아요.", en: "Set up a secure quiet room with familiar bedding and essentials, then expand access gradually as the pet becomes comfortable." } },
  { id: "t195", category: "food", featured: true,
    title: { ko: "생식은 병원체 오염 위험까지 고려해 선택해요", en: "Consider pathogen risks before choosing raw pet food" },
    summary: { ko: "생식은 가공된 사료보다 살모넬라·리스테리아 같은 유해 세균에 오염될 가능성이 더 높을 수 있어요.", en: "Raw pet food can carry a higher risk of contamination with harmful bacteria such as Salmonella and Listeria." },
    body: { ko: "FDA는 생식의 식중독균 위험을 안내하고 있어요. 생식을 고려한다면 우리 아이의 건강 상태와 가족의 감염 취약성을 포함해 수의사와 상담하고, 손·도구·조리 공간 위생을 철저히 관리하세요.", en: "FDA warns about foodborne-pathogen risks in raw pet food; discuss individual risks with your veterinarian and use strict hand, utensil, and surface hygiene." } },
  { id: "t196", category: "food", featured: false,
    title: { ko: "여러 영양제는 성분이 겹치지 않는지 확인해요", en: "Check for overlapping ingredients across supplements" },
    summary: { ko: "서로 다른 제품이라도 같은 비타민·미네랄 성분이 들어 있어 총 섭취량이 예상보다 늘 수 있어요.", en: "Different supplements can contain the same vitamins or minerals, increasing total intake unexpectedly." },
    body: { ko: "영양제를 추가할 때는 제품 라벨과 현재 먹는 사료·보충제 목록을 함께 확인하세요. 특정 질환이 있거나 여러 제품을 함께 급여한다면 필요성과 적정량을 담당 수의사와 상의해 주세요.", en: "Review labels alongside the complete diet and supplement list, and ask your veterinarian about need and amount when combining products or managing a medical condition." } },
  { id: "t197", category: "training", featured: true,
    title: { ko: "손 터치부터 배우면 이동 유도가 쉬워져요", en: "Teach a hand target for gentle guidance" },
    summary: { ko: "코로 손바닥을 가볍게 터치하는 행동은 몸을 억지로 밀거나 끌지 않고 위치를 바꾸는 기초 신호가 될 수 있어요.", en: "A simple nose-to-hand target can help guide movement without physically pushing or pulling." },
    body: { ko: "손바닥을 가까이 내밀고 스스로 코를 가져오면 바로 보상하세요. 익숙해진 뒤 손 위치를 조금씩 옮기며 한두 걸음 따라오는 연습으로 확장해 주세요.", en: "Present your palm nearby, reward voluntary nose contact, then gradually move the target a short distance and reward following." } },
  { id: "t198", category: "training", featured: false,
    title: { ko: "물건 놓기는 빼앗기보다 교환으로 가르쳐요", en: "Teach drop-it through a fair trade" },
    summary: { ko: "입에 문 물건을 억지로 빼앗기보다 더 좋은 보상과 바꾸는 경험을 만들면 놓는 행동을 차분하게 연습할 수 있어요.", en: "Trading for a better reward can teach releasing an item more calmly than forcibly taking it away." },
    body: { ko: "안전한 장난감으로 시작해 간식이나 다른 장난감을 보여주고 스스로 놓는 순간 신호어와 보상을 연결하세요. 위험한 물건을 삼켰거나 삼킬 가능성이 있으면 훈련으로 해결하려 하지 말고 즉시 수의사에게 문의하세요.", en: "Practice with a safe toy, reward voluntary release, and seek veterinary help promptly if a dangerous object may have been swallowed." } },
  { id: "t199", category: "safety", featured: true,
    title: { ko: "녹조가 의심되는 물에는 들어가지 않게 해요", en: "Keep pets away from suspected harmful algal blooms" },
    summary: { ko: "일부 유해 조류·남세균 번성은 독소를 만들 수 있어 반려동물이 물을 마시거나 헤엄치는 것 모두 위험할 수 있어요.", en: "Some harmful algal or cyanobacterial blooms can produce toxins that endanger pets through drinking or swimming." },
    body: { ko: "EPA는 녹조가 의심되는 물에서 반려동물이 마시거나 수영하지 않게 하도록 안내해요. 접촉했다면 가능한 빨리 깨끗한 수돗물로 씻기고, 물이나 부유물을 먹었을 가능성이 있으면 즉시 수의사 진료를 받으세요.", en: "EPA advises keeping pets out of suspected bloom water; rinse promptly with clean tap water after contact and seek veterinary care immediately if contaminated water or scum may have been ingested." } },
  { id: "t200", category: "safety", featured: false,
    title: { ko: "창문 방충망은 밀림과 틈을 정기적으로 확인해요", en: "Check window screens for gaps and loose frames" },
    summary: { ko: "방충망은 환기용이지 추락 방지 장치가 아니므로 반려동물이 기대거나 밀었을 때 빠질 수 있는지 확인해야 해요.", en: "A window screen is not a fall barrier, so loose frames and gaps can be dangerous for pets." },
    body: { ko: "창문을 열 때는 방충망 고정 상태와 틈을 확인하고 반려동물이 창틀에 올라가는 공간은 특히 주의하세요. 필요하면 별도의 안전망이나 제한 장치를 사용하고 외출 중에는 안전하게 닫아두세요.", en: "Check screen fit and gaps, supervise access to open windows, use a purpose-built safety barrier when needed, and secure windows when away." } },
  { id: "t201", category: "grooming", featured: true,
    title: { ko: "피부에 붙은 심한 엉킨 털은 가위로 자르지 않아요", en: "Avoid scissors on mats tight against the skin" },
    summary: { ko: "단단한 털뭉치는 피부를 함께 끌어당겨 경계가 잘 보이지 않아 집에서 가위로 자르다 피부를 다칠 수 있어요.", en: "Tight mats can pull skin upward and hide where the skin ends, making scissors risky." },
    body: { ko: "가볍게 풀리지 않는 엉킴은 억지로 당기지 말고 전문 미용사나 동물병원에 도움을 요청하세요. 피부가 붉거나 진물·통증이 보이면 미용보다 먼저 수의사에게 확인받는 것이 좋아요.", en: "Do not force apart tight mats; seek a professional groomer or veterinary team, and prioritize veterinary assessment if the skin is red, painful, or oozing." } },
  { id: "t202", category: "grooming", featured: false,
    title: { ko: "발톱 관리는 한 번에 많이보다 짧게 적응해요", en: "Make nail care short and gradual" },
    summary: { ko: "발을 만지는 것부터 발톱깎이 소리까지 작은 단계로 나누면 관리 시간을 덜 부담스럽게 만들 수 있어요.", en: "Breaking nail care into small steps can make handling and clipping less stressful." },
    body: { ko: "처음에는 발을 잠깐 만지고 보상하는 것부터 시작해 한두 개 발톱만 다듬고 끝내도 괜찮아요. 혈관 위치가 잘 보이지 않거나 아이가 심하게 움직이면 무리하지 말고 전문가에게 맡겨주세요.", en: "Start with brief paw handling and rewards, trim only a nail or two if needed, and seek professional help if the quick is hard to see or the pet struggles strongly." } },
`;

const newItems = [...additions.matchAll(/id: "(t\d+)", category: "([a-z]+)"[\s\S]*?title: \{ ko: "([^"]+)"/g)].map(m => ({id:m[1], category:m[2], title:m[3]}));
if (newItems.length !== 16) throw new Error(`Expected 16 additions, parsed ${newItems.length}`);
const expectedCategories = ['dog','cat','health','life','food','training','safety','grooming'];
for (const cat of expectedCategories) {
  const count = newItems.filter(x => x.category === cat).length;
  if (count !== 2) throw new Error(`Expected exactly 2 ${cat} additions, got ${count}`);
}
for (const item of newItems) {
  if (block.includes(`id: "${item.id}"`)) throw new Error(`Duplicate id before update: ${item.id}`);
  if (block.includes(`ko: "${item.title}"`)) throw new Error(`Duplicate Korean title before update: ${item.title}`);
}

app = app.slice(0, end) + additions + app.slice(end);
const updatedStart = app.indexOf('const TIPS_DATA = [');
const updatedEnd = app.indexOf('\n];', updatedStart);
const updatedBlock = app.slice(updatedStart, updatedEnd);
const ids = [...updatedBlock.matchAll(/id: "(t\d+)"/g)].map(m => m[1]);
const titles = [...updatedBlock.matchAll(/title: \{ ko: "([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate PetInfo IDs detected after update');
if (new Set(titles).size !== titles.length) throw new Error('Duplicate PetInfo Korean titles detected after update');
for (const item of newItems) if (!updatedBlock.includes(`id: "${item.id}"`)) throw new Error(`Missing ${item.id} after update`);

fs.writeFileSync(path, app);
console.log(`PetInfo update prepared: ${newItems.length} items; ${expectedCategories.map(c => `${c}=2`).join(', ')}`);
