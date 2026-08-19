import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
const block = app.slice(start, end);

if (!block.includes('id: "t194"')) {
  throw new Error('Expected latest PetInfo item t194 was not found; refusing to update a stale or changed dataset.');
}
if (block.includes('id: "t195"')) {
  console.log('2026-08-19 PetInfo completion items already present.');
  process.exit(0);
}

const additions = `
  { id: "t195", category: "dog", featured: true,
    title: { ko: "산책에서는 냄새 맡는 시간도 충분히 주세요", en: "Make room for sniffing during walks" },
    summary: { ko: "걷는 거리만 채우기보다 안전한 곳에서 냄새를 탐색할 시간을 주면 산책의 자극이 더 다양해져요.", en: "A walk can include safe sniffing and exploration, not only covering distance." },
    body: { ko: "사람이나 차량 통행을 방해하지 않는 곳에서는 리드줄을 안전하게 유지한 채 잠시 냄새를 맡게 해주세요. 계속 끌고 가기보다 아이의 속도와 주변 환경을 함께 살피는 방식이 좋아요.", en: "In a safe area, keep the leash secure and allow brief sniffing breaks while watching traffic, other animals, and your dog's comfort." } },
  { id: "t196", category: "cat", featured: true,
    title: { ko: "물그릇 위치를 여러 곳에서 시험해보세요", en: "Try water stations in more than one location" },
    summary: { ko: "고양이마다 선호하는 물그릇 위치가 달라 조용하고 접근하기 쉬운 장소를 여러 곳 시험해볼 수 있어요.", en: "Cats can differ in where they prefer to drink, so more than one quiet, accessible water station may help." },
    body: { ko: "밥그릇이나 화장실 바로 옆만 고집하지 말고 자주 지나는 조용한 장소에도 깨끗한 물을 두어 반응을 살펴보세요. 물그릇은 정기적으로 세척하고 물도 신선하게 유지해 주세요.", en: "Try a clean water bowl in another quiet, easy-to-reach spot and keep bowls clean with fresh water." } },
  { id: "t197", category: "health", featured: true,
    title: { ko: "진료 전 복용 중인 약과 보충제 목록을 준비해요", en: "Bring a medication and supplement list to vet visits" },
    summary: { ko: "처방약뿐 아니라 영양제·보충제까지 함께 알려주면 수의사가 현재 복용 내용을 파악하는 데 도움이 돼요.", en: "A complete list of medicines and supplements helps the veterinary team understand what your pet is taking." },
    body: { ko: "제품명·용량·투여 횟수를 메모하거나 라벨 사진을 준비해 주세요. 새 약이나 보충제를 시작·중단하거나 용량을 바꾸기 전에는 담당 수의사와 상의하는 것이 안전해요.", en: "Note product names, doses, and frequency or bring label photos, and discuss starting, stopping, or changing products with your veterinarian." } },
  { id: "t198", category: "life", featured: false,
    title: { ko: "펫시터에게 전달할 돌봄 메모를 한 장으로 정리해요", en: "Prepare a one-page care note for pet sitters" },
    summary: { ko: "급여·산책·화장실·약·병원 연락처를 한곳에 적어두면 보호자가 없을 때도 돌봄 기준을 맞추기 쉬워요.", en: "A concise care sheet helps a sitter follow feeding, walks, litter, medication, and emergency contacts." },
    body: { ko: "평소 루틴과 피해야 할 음식·행동, 주치의 연락처, 이동장 위치까지 적어두고 내용이 바뀌면 갱신해 주세요. 약이 있다면 임의로 용량을 바꾸지 않도록 정확한 지시를 남겨주세요.", en: "Include routines, things to avoid, veterinary contacts, carrier location, and exact medication instructions, and update the sheet when anything changes." } },
  { id: "t199", category: "food", featured: true,
    title: { ko: "생식은 병원체 오염 위험까지 고려해 선택해요", en: "Consider pathogen risks before choosing raw pet food" },
    summary: { ko: "생식은 가공된 사료보다 살모넬라·리스테리아 같은 유해 세균에 오염될 가능성이 더 높을 수 있어요.", en: "Raw pet food can carry a higher risk of contamination with harmful bacteria such as Salmonella and Listeria." },
    body: { ko: "FDA는 생식의 식중독균 위험을 안내하고 있어요. 생식을 고려한다면 우리 아이의 건강 상태와 가족의 감염 취약성을 포함해 수의사와 상담하고, 손·도구·조리 공간 위생을 철저히 관리하세요.", en: "FDA warns about foodborne-pathogen risks in raw pet food; discuss individual risks with your veterinarian and use strict hand, utensil, and surface hygiene." } },
  { id: "t200", category: "training", featured: true,
    title: { ko: "손 터치부터 배우면 이동 유도가 쉬워져요", en: "Teach a hand target for gentle guidance" },
    summary: { ko: "코로 손바닥을 가볍게 터치하는 행동은 몸을 억지로 밀거나 끌지 않고 위치를 바꾸는 기초 신호가 될 수 있어요.", en: "A simple nose-to-hand target can help guide movement without physically pushing or pulling." },
    body: { ko: "손바닥을 가까이 내밀고 스스로 코를 가져오면 바로 보상하세요. 익숙해진 뒤 손 위치를 조금씩 옮기며 한두 걸음 따라오는 연습으로 확장해 주세요.", en: "Present your palm nearby, reward voluntary nose contact, then gradually move the target a short distance and reward following." } },
  { id: "t201", category: "safety", featured: true,
    title: { ko: "녹조가 의심되는 물에는 들어가지 않게 해요", en: "Keep pets away from suspected harmful algal blooms" },
    summary: { ko: "일부 유해 조류·남세균 번성은 독소를 만들 수 있어 반려동물이 물을 마시거나 헤엄치는 것 모두 위험할 수 있어요.", en: "Some harmful algal or cyanobacterial blooms can produce toxins that endanger pets through drinking or swimming." },
    body: { ko: "EPA는 녹조가 의심되는 물에서 반려동물이 마시거나 수영하지 않게 하도록 안내해요. 접촉했다면 가능한 빨리 깨끗한 수돗물로 씻기고, 물이나 부유물을 먹었을 가능성이 있으면 즉시 수의사 진료를 받으세요.", en: "EPA advises keeping pets out of suspected bloom water; rinse promptly with clean tap water after contact and seek veterinary care immediately if contaminated water or scum may have been ingested." } },
  { id: "t202", category: "grooming", featured: true,
    title: { ko: "피부에 붙은 심한 엉킨 털은 가위로 자르지 않아요", en: "Avoid scissors on mats tight against the skin" },
    summary: { ko: "단단한 털뭉치는 피부를 함께 끌어당겨 경계가 잘 보이지 않아 집에서 가위로 자르다 피부를 다칠 수 있어요.", en: "Tight mats can pull skin upward and hide where the skin ends, making scissors risky." },
    body: { ko: "가볍게 풀리지 않는 엉킴은 억지로 당기지 말고 전문 미용사나 동물병원에 도움을 요청하세요. 피부가 붉거나 진물·통증이 보이면 미용보다 먼저 수의사에게 확인받는 것이 좋아요.", en: "Do not force apart tight mats; seek a professional groomer or veterinary team, and prioritize veterinary assessment if the skin is red, painful, or oozing." } },
`;

const parsed = [...additions.matchAll(/id: "(t\d+)", category: "([a-z]+)"[\s\S]*?title: \{ ko: "([^"]+)"/g)]
  .map((m) => ({ id: m[1], category: m[2], title: m[3] }));
if (parsed.length !== 8) throw new Error(`Expected 8 completion items, got ${parsed.length}`);
const categories = ['dog', 'cat', 'health', 'life', 'food', 'training', 'safety', 'grooming'];
for (const category of categories) {
  const count = parsed.filter((x) => x.category === category).length;
  if (count !== 1) throw new Error(`Expected 1 completion item for ${category}, got ${count}`);
}
for (const item of parsed) {
  if (block.includes(`id: "${item.id}"`)) throw new Error(`Duplicate id before update: ${item.id}`);
  if (block.includes(`ko: "${item.title}"`)) throw new Error(`Duplicate Korean title before update: ${item.title}`);
}

app = app.slice(0, end) + additions + app.slice(end);
const updatedStart = app.indexOf('const TIPS_DATA = [');
const updatedEnd = app.indexOf('\n];', updatedStart);
const updatedBlock = app.slice(updatedStart, updatedEnd);
const ids = [...updatedBlock.matchAll(/id: "(t\d+)"/g)].map((m) => m[1]);
const titles = [...updatedBlock.matchAll(/title: \{ ko: "([^"]+)"/g)].map((m) => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate PetInfo IDs detected after update');
if (new Set(titles).size !== titles.length) throw new Error('Duplicate PetInfo Korean titles detected after update');
for (const item of parsed) {
  if (!updatedBlock.includes(`id: "${item.id}"`)) throw new Error(`Missing ${item.id} after update`);
}

fs.writeFileSync(path, app);
console.log(`Added ${parsed.length} PetInfo completion items: ${categories.map((c) => `${c}=1`).join(', ')}`);
