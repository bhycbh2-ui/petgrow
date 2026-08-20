import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
const block = app.slice(start, end);

if (!block.includes('id: "t210"')) {
  throw new Error('Expected latest PetInfo item t210 was not found; refusing to update a stale or changed dataset.');
}
if (block.includes('id: "t211"')) {
  console.log('2026-08-20 PetInfo items already present.');
  process.exit(0);
}

const additions = `
  { id: "t211", category: "dog", featured: true,
    title: { ko: "낯선 강아지와의 인사는 억지로 시키지 않아요", en: "Do not force greetings with unfamiliar dogs" },
    summary: { ko: "모든 강아지가 가까운 인사를 편안해하는 것은 아니어서 충분한 거리를 두고 반응을 살피는 것이 좋아요.", en: "Not every dog is comfortable with close greetings, so give space and watch their response." },
    body: { ko: "몸을 뒤로 빼거나 시선을 피하고 멈추려 한다면 다가가게 끌지 말고 거리를 넓혀주세요. 상대 보호자의 동의 없이 접근하지 않고, 차분하게 지나가는 것 자체를 좋은 산책 경험으로 만들어도 충분해요.", en: "If your dog leans away, avoids looking, or tries to stop, increase distance rather than pulling closer. Ask the other handler before approaching and remember that calmly passing by can be a successful walk." } },
  { id: "t212", category: "dog", featured: false,
    title: { ko: "활동적인 외출 뒤에는 조용히 쉬는 시간을 마련해요", en: "Offer quiet recovery time after stimulating outings" },
    summary: { ko: "새로운 장소나 긴 외출 뒤에는 바로 또 놀기보다 물을 마시고 편안히 쉴 수 있는 시간을 주는 게 좋아요.", en: "After a busy outing, give your dog access to water and a quiet place to settle before adding more activity." },
    body: { ko: "집에 돌아오면 물과 익숙한 휴식공간을 열어두고 스스로 진정할 시간을 주세요. 평소보다 심하게 지치거나 통증·절뚝거림·호흡 이상이 이어지면 활동을 줄이고 수의사에게 상담하세요.", en: "On returning home, provide water and a familiar resting area and let your dog settle. If unusual exhaustion, pain, limping, or breathing changes persist, reduce activity and contact your veterinarian." } },
  { id: "t213", category: "cat", featured: true,
    title: { ko: "높은 휴식공간은 오르내리는 길까지 안정적으로 만들어요", en: "Make routes to elevated cat resting spots stable" },
    summary: { ko: "캣타워나 선반이 높기만 한 것보다 흔들리지 않고 안전하게 오르내릴 경로가 있는지가 중요해요.", en: "Elevated spaces are more useful when cats have stable, secure routes up and down." },
    body: { ko: "선반과 캣타워가 흔들리지 않는지 확인하고 미끄러운 발판이나 너무 큰 간격은 피해주세요. 어린 고양이, 노령묘, 관절이 불편한 고양이는 낮은 단계나 경사로처럼 쉬운 경로를 함께 마련하는 것이 좋아요.", en: "Check that shelves and towers do not wobble, avoid slippery steps or large gaps, and offer easier lower steps or ramps for kittens, senior cats, or cats with mobility limitations." } },
  { id: "t214", category: "cat", featured: false,
    title: { ko: "끈 장난감은 놀이가 끝나면 손이 닿지 않는 곳에 보관해요", en: "Put string toys away after cat play" },
    summary: { ko: "낚싯대 줄이나 긴 끈은 함께 놀 때는 재미있지만 혼자 남겨두면 씹거나 삼킬 위험이 있어요.", en: "Wand strings and long cords can be fun during supervised play but should not be left out for unsupervised chewing or swallowing." },
    body: { ko: "끈·리본·실이 달린 장난감은 보호자가 지켜보는 동안 사용하고 놀이가 끝나면 닫힌 수납공간에 넣어주세요. 끈을 삼킨 것이 의심되면 입이나 항문에서 보이는 끈을 억지로 잡아당기지 말고 동물병원에 바로 문의하세요.", en: "Use string, ribbon, and yarn toys only with supervision and store them in a closed place afterward. If ingestion is suspected, do not pull on visible string from the mouth or anus; contact a veterinarian promptly." } },
  { id: "t215", category: "health", featured: true,
    title: { ko: "건강검진 간격은 나이와 건강상태에 맞춰 정해요", en: "Set wellness visit frequency by life stage and health status" },
    summary: { ko: "예방검진은 모든 아이에게 같은 간격을 적용하기보다 나이·생활환경·질환 위험에 따라 달라질 수 있어요.", en: "Preventive visit frequency can vary with age, lifestyle, health status, and individual risk." },
    body: { ko: "AAHA는 정기적인 신체검진과 생애주기별 예방관리를 강조하고, 노령 반려동물은 더 자주 평가가 필요할 수 있다고 안내해요. 우리 아이의 적절한 검진 주기와 필요한 검사는 담당 수의사와 함께 정하세요.", en: "AAHA emphasizes regular physical examinations and life-stage preventive care, with older pets often needing more frequent assessment. Ask your veterinarian to set an appropriate visit and screening schedule for your pet." } },
  { id: "t216", category: "health", featured: false,
    title: { ko: "간헐적으로 나타나는 증상은 짧은 영상이 진료 설명에 도움돼요", en: "Short videos can help describe intermittent symptoms" },
    summary: { ko: "집에서만 잠깐 보이는 기침·이상 보행·행동 변화를 영상으로 남기면 진료 때 상황을 설명하기 쉬워요.", en: "A brief video can help your veterinary team understand coughing, gait changes, or behaviors that appear only at home." },
    body: { ko: "안전하게 촬영할 수 있을 때 시작 시점과 지속시간도 함께 메모해 주세요. 영상은 진단을 대신하지 않으며 호흡곤란, 의식 변화, 심한 통증처럼 위급해 보이는 증상은 촬영 때문에 진료를 늦추지 말고 즉시 동물병원에 연락하세요.", en: "When it is safe, note when the episode starts and how long it lasts. Video does not replace an examination; do not delay urgent veterinary care for breathing difficulty, altered consciousness, severe pain, or other emergencies." } },
  { id: "t217", category: "life", featured: false,
    title: { ko: "응급 연락정보는 휴대폰과 이동가방에 함께 준비해요", en: "Keep emergency contacts in your phone and pet travel bag" },
    summary: { ko: "낯선 지역이나 급한 상황에서는 주치의·야간병원·보호자 연락정보를 바로 찾을 수 있게 정리해두면 좋아요.", en: "Keeping veterinary and owner contact details readily available can save time during travel or an emergency." },
    body: { ko: "주치의와 가까운 야간 동물병원 연락처, 반려동물 이름과 주요 질환·복용약 정보를 휴대폰에 저장하고 이동장이나 외출가방에도 간단한 메모를 넣어두세요. 정보가 바뀌면 함께 업데이트해 주세요.", en: "Save your regular veterinarian and nearby emergency clinic details plus your pet's name, key conditions, and medications on your phone, and keep a simple copy with the carrier or travel bag. Update both when information changes." } },
  { id: "t218", category: "life", featured: true,
    title: { ko: "장시간 맡기기 전 펫시터와 짧은 사전 만남을 가져요", en: "Arrange a short introduction before a long pet-sitting stay" },
    summary: { ko: "처음 보는 돌봄자에게 바로 장시간 맡기기보다 집과 루틴을 미리 소개하면 돌봄 기준을 맞추기 쉬워요.", en: "A short introduction can help a sitter learn your pet's home, routine, and handling preferences before a longer stay." },
    body: { ko: "급여·산책·화장실 위치와 출입문 관리법을 함께 확인하고 반려동물이 불편해하는 접촉이나 행동도 알려주세요. 약을 먹는다면 용량과 시간을 서면으로 남기고 임의 변경하지 않도록 안내하세요.", en: "Review feeding, walks, litter or toileting, door safety, and handling preferences together. For medications, leave written dose and timing instructions and make clear they should not be changed without veterinary guidance." } },
  { id: "t219", category: "food", featured: true,
    title: { ko: "급여량은 계량해 기록하면 조절하기 쉬워요", en: "Measure food portions consistently" },
    summary: { ko: "눈대중보다 같은 계량컵이나 주방저울을 사용하면 실제 먹는 양과 체중 변화를 비교하기 쉬워요.", en: "Using a consistent cup or kitchen scale makes it easier to compare actual intake with weight trends." },
    body: { ko: "사료 포장지의 급여량은 출발점으로 참고하고 간식까지 포함한 전체 섭취량과 체중·체형 변화를 함께 살펴보세요. 성장기, 임신·수유기, 질환이 있거나 체중 조절이 필요하면 수의사와 적절한 열량을 상담하세요.", en: "Treat package feeding amounts as a starting point and consider total intake, including treats, alongside weight and body-condition trends. Ask your veterinarian about calorie needs for growth, pregnancy or nursing, illness, or weight management." } },
  { id: "t220", category: "food", featured: false,
    title: { ko: "사료 선택은 원재료 목록 하나만으로 판단하지 않아요", en: "Do not judge pet food by the ingredient list alone" },
    summary: { ko: "원재료 이름만으로 제품의 전체 영양 품질과 제조 관리 수준을 판단하기는 어려워요.", en: "An ingredient list alone does not show the full nutritional quality or manufacturing oversight of a pet food." },
    body: { ko: "WSAVA는 원재료 목록만 보지 말고 영양 전문성, 품질관리, 완전한 영양 설계 여부와 제조사에 문의할 수 있는 정보 등을 함께 확인하도록 안내해요. 질환이 있거나 특별한 식단이 필요하면 광고 문구보다 수의사의 개별 권고를 우선하세요.", en: "WSAVA recommends looking beyond the ingredient list to factors such as nutritional expertise, quality control, nutritional formulation, and manufacturer contact information. For pets with medical or special dietary needs, prioritize individualized veterinary advice over marketing claims." } },
  { id: "t221", category: "training", featured: true,
    title: { ko: "배운 신호는 장소를 바꿔가며 천천히 일반화해요", en: "Generalize learned cues across locations gradually" },
    summary: { ko: "집에서 잘하는 행동도 현관이나 산책길처럼 자극이 많은 곳에서는 처음부터 다시 어려워질 수 있어요.", en: "A cue learned at home may become harder at the doorway or outdoors where distractions are stronger." },
    body: { ko: "조용한 방에서 성공한 뒤 다른 방, 복도, 조용한 야외처럼 난도를 한 단계씩 올려주세요. 새로운 장소에서는 거리와 자극을 줄이고 더 쉬운 기준부터 보상하면 실패를 반복하는 것보다 학습하기 좋아요.", en: "After success in a quiet room, progress through another room, hallway, and then a calm outdoor area. In new settings, reduce distractions and reward easier versions before raising the difficulty." } },
  { id: "t222", category: "training", featured: false,
    title: { ko: "물건을 뺏기보다 바꾸는 연습을 해요", en: "Teach trading instead of grabbing items away" },
    summary: { ko: "입에 문 물건을 억지로 빼앗기보다 더 좋은 보상과 교환하는 연습은 안전한 놓기 신호를 만드는 데 도움이 돼요.", en: "Trading an item for a better reward can help build a safer release cue than forcibly taking things away." },
    body: { ko: "위험하지 않은 장난감으로 시작해 간식이나 다른 장난감을 보여주고 스스로 놓는 순간 보상하세요. 삼키면 위험한 물건이나 독성물질을 물었다면 훈련으로 해결하려 하지 말고 안전을 확보한 뒤 수의사나 응급기관의 안내를 받으세요.", en: "Start with a safe toy, offer a valued treat or another toy, and reward voluntary release. If your pet has a hazardous or toxic item that could be swallowed, prioritize safety and seek veterinary or emergency guidance rather than treating it as a training exercise." } },
  { id: "t223", category: "safety", featured: true,
    title: { ko: "산불 연기가 심한 날은 야외 활동을 줄여요", en: "Reduce outdoor activity when wildfire smoke is heavy" },
    summary: { ko: "산불 연기는 반려동물의 눈과 호흡기를 자극할 수 있어 대기질이 나쁜 날에는 노출을 줄이는 것이 좋아요.", en: "Wildfire smoke can irritate pets' eyes and respiratory tracts, so exposure should be reduced when air quality is poor." },
    body: { ko: "EPA는 연기가 있을 때 가능한 한 실내에 머물고 배변을 위한 외출은 짧게 하며 격한 야외 운동을 줄이도록 안내해요. 기침, 호흡곤란, 심한 무기력 같은 변화가 나타나면 수의사에게 상담하고, 심장·폐 질환이 있거나 어린·노령 반려동물은 특히 주의하세요.", en: "EPA advises keeping pets indoors as much as possible during smoke events, keeping bathroom trips brief, and limiting strenuous outdoor activity. Contact a veterinarian for coughing, breathing difficulty, marked weakness, or other concerning changes, especially in very young, older, or heart- or lung-disease patients." } },
  { id: "t224", category: "safety", featured: false,
    title: { ko: "사람 약과 반려동물 약은 따로 잠가 보관해요", en: "Store human and pet medications separately and securely" },
    summary: { ko: "높은 선반만으로는 충분하지 않을 수 있어 원래 라벨이 붙은 용기에 넣고 반려동물이 열 수 없는 곳에 보관하는 게 안전해요.", en: "A high shelf may not be enough; keep medicines in original labeled containers in a location pets cannot access." },
    body: { ko: "FDA는 사람 약과 동물 약을 서로 분리하고 원래 라벨 용기에 보관해 혼동과 우발적 섭취를 줄이도록 안내해요. 잘못된 약을 먹었거나 과량 섭취가 의심되면 임의로 처치하지 말고 즉시 수의사 또는 응급 동물병원에 연락하세요.", en: "FDA advises storing human and animal medicines separately in their original labeled containers to reduce mix-ups and accidental ingestion. If the wrong medicine or an overdose is suspected, contact a veterinarian or emergency animal hospital promptly instead of attempting treatment on your own." } },
  { id: "t225", category: "grooming", featured: false,
    title: { ko: "집에서 클리퍼를 쓸 때 날의 열을 자주 확인해요", en: "Check clipper blade temperature during home grooming" },
    summary: { ko: "클리퍼 날은 사용하면서 뜨거워질 수 있어 한 부위를 오래 밀지 않고 중간중간 열을 확인하는 게 좋아요.", en: "Clipper blades can heat up during use, so avoid staying on one area and check the blade frequently." },
    body: { ko: "짧은 구간씩 작업하고 날이 따뜻해지면 충분히 식힌 뒤 다시 사용하세요. 피부가 붉어지거나 통증을 보이면 즉시 중단하고, 촘촘한 엉킴이나 피부병이 있으면 집에서 무리하게 밀기보다 전문 미용사나 동물병원에 도움을 요청하세요.", en: "Work in short sections and let the blade cool fully if it becomes warm. Stop if the skin becomes red or painful, and seek professional grooming or veterinary help for tight mats or skin disease rather than forcing a home trim." } },
  { id: "t226", category: "grooming", featured: true,
    title: { ko: "목욕 뒤에는 접히는 피부와 속털까지 충분히 말려요", en: "Dry skin folds and undercoat thoroughly after bathing" },
    summary: { ko: "겉털만 마른 것처럼 보여도 피부 주름이나 빽빽한 속털에는 습기가 남을 수 있어요.", en: "Skin folds and dense undercoat can stay damp even when the outer coat looks dry." },
    body: { ko: "수건으로 물기를 충분히 제거하고 뜨겁지 않은 바람으로 피부 가까운 부분까지 천천히 말려주세요. 주름 사이가 계속 붉거나 냄새·진물·가려움이 생기면 반복 세정만 하지 말고 수의사에게 피부 상태를 확인받으세요.", en: "Towel off well and use comfortably cool or warm airflow to dry near the skin without overheating. If folds remain red or develop odor, discharge, or persistent itching, have the skin assessed by a veterinarian rather than repeatedly washing it." } },
`;

const categories = ['dog', 'cat', 'health', 'life', 'food', 'training', 'safety', 'grooming'];
const parsed = [...additions.matchAll(/id: "(t\d+)", category: "([a-z]+)"[\s\S]*?title: \{ ko: "([^"]+)"/g)]
  .map((m) => ({ id: m[1], category: m[2], title: m[3] }));
if (parsed.length !== 16) throw new Error(`Expected 16 PetInfo items, got ${parsed.length}`);
for (const category of categories) {
  const count = parsed.filter((x) => x.category === category).length;
  if (count !== 2) throw new Error(`Expected 2 items for ${category}, got ${count}`);
}
const expectedIds = Array.from({ length: 16 }, (_, i) => `t${211 + i}`);
if (parsed.map((x) => x.id).join(',') !== expectedIds.join(',')) throw new Error('Unexpected PetInfo ID sequence');
for (const item of parsed) {
  if (block.includes(`id: "${item.id}"`)) throw new Error(`Duplicate id before update: ${item.id}`);
  if (block.includes(`ko: "${item.title}"`)) throw new Error(`Duplicate Korean title before update: ${item.title}`);
}

const preCounts = Object.fromEntries(categories.map((category) => [category, (block.match(new RegExp(`category: "${category}"`, 'g')) || []).length]));
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
for (const category of categories) {
  const after = (updatedBlock.match(new RegExp(`category: "${category}"`, 'g')) || []).length;
  if (after !== preCounts[category] + 2) throw new Error(`Category count mismatch for ${category}: before=${preCounts[category]}, after=${after}`);
}

fs.writeFileSync(path, app);
console.log('Pre-update category counts:', preCounts);
console.log(`Added ${parsed.length} PetInfo items for 2026-08-20: ${categories.map((c) => `${c}=2`).join(', ')}`);
