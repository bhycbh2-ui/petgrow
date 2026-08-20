import fs from 'fs';

const path = 'src/App.jsx';
let app = fs.readFileSync(path, 'utf8');
const start = app.indexOf('const TIPS_DATA = [');
if (start < 0) throw new Error('TIPS_DATA not found');
const end = app.indexOf('\n];', start);
if (end < 0) throw new Error('TIPS_DATA closing bracket not found');
const block = app.slice(start, end);

if (!block.includes('id: "t202"')) {
  throw new Error('Expected latest PetInfo item t202 was not found; refusing to update a stale or changed dataset.');
}
if (block.includes('id: "t203"')) {
  console.log('2026-08-20 PetInfo items already present.');
  process.exit(0);
}

const additions = `
  { id: "t203", category: "dog", featured: true,
    title: { ko: "산책 후 발바닥 상태를 짧게 확인해요", en: "Check paw pads after walks" },
    summary: { ko: "산책이 끝난 뒤 발바닥과 발가락 사이를 잠깐 살피면 작은 이물질이나 자극을 일찍 발견하는 데 도움이 돼요.", en: "A quick post-walk paw check can help you notice debris or irritation early." },
    body: { ko: "발가락 사이에 모래나 작은 씨앗이 끼지 않았는지, 패드가 붉거나 갈라지지 않았는지 확인해 주세요. 계속 핥거나 절뚝거림이 보이면 무리한 산책을 줄이고 동물병원에 상담하세요.", en: "Look between the toes for debris and check pads for redness or cracks. If licking or limping persists, reduce strenuous walks and contact your veterinarian." } },
  { id: "t204", category: "cat", featured: true,
    title: { ko: "숨을 수 있는 조용한 공간을 항상 남겨주세요", en: "Keep a quiet hiding place available for cats" },
    summary: { ko: "고양이는 낯선 소리나 방문객이 있을 때 스스로 거리를 둘 수 있는 안전한 숨숨공간이 필요할 수 있어요.", en: "Cats may benefit from a safe retreat when visitors or unfamiliar noises make them uncomfortable." },
    body: { ko: "박스나 숨숨집처럼 출입이 쉽고 방해받지 않는 공간을 마련하고 억지로 꺼내지 마세요. 스스로 나올 때까지 기다리고 물과 화장실에도 안전하게 접근할 수 있게 해주세요.", en: "Provide an easy-to-enter box or hideaway, avoid pulling the cat out, and make sure water and litter remain safely accessible." } },
  { id: "t205", category: "health", featured: true,
    title: { ko: "평소 호흡과 식욕의 변화를 기록해두면 좋아요", en: "Track changes in breathing and appetite" },
    summary: { ko: "평소 상태를 간단히 기록해두면 갑작스러운 식욕 저하나 호흡 변화가 생겼을 때 비교하기 쉬워요.", en: "Simple baseline notes can make changes in appetite or breathing easier to notice." },
    body: { ko: "먹는 양, 활동성, 잠자는 모습처럼 일상에서 쉽게 확인할 수 있는 항목을 짧게 기록해 보세요. 숨쉬기 힘들어 보이거나 갑자기 축 처지는 등 급격한 변화가 있으면 지체하지 말고 수의사 진료를 받아야 해요.", en: "Keep brief notes on food intake, activity, and resting behavior. Seek veterinary care promptly for labored breathing, sudden weakness, or other major changes." } },
  { id: "t206", category: "life", featured: false,
    title: { ko: "이사 전에는 반려동물 생활공간부터 먼저 계획해요", en: "Plan your pet's safe zone before moving" },
    summary: { ko: "이사 당일의 소음과 문 개방은 스트레스와 이탈 위험을 높일 수 있어 미리 안전한 공간을 정해두는 게 좋아요.", en: "Moving-day noise and open doors can increase stress and escape risk, so planning a safe zone helps." },
    body: { ko: "익숙한 침구, 물, 화장실이나 배변용품을 한 공간에 먼저 준비하고 이동 인원이 드나드는 동안 출입문을 안전하게 관리하세요. 새 집에서는 한 공간부터 천천히 적응 범위를 넓혀주세요.", en: "Set up familiar bedding, water, and toileting supplies in one secure room, manage doors carefully, and expand access gradually in the new home." } },
  { id: "t207", category: "food", featured: true,
    title: { ko: "새 사료는 갑자기 바꾸기보다 천천히 전환해요", en: "Transition to new food gradually" },
    summary: { ko: "먹던 사료를 갑자기 바꾸면 일부 반려동물은 소화 불편을 겪을 수 있어 기존 식사와 섞어 서서히 바꾸는 방식이 일반적이에요.", en: "A gradual food transition can reduce digestive upset for many pets." },
    body: { ko: "며칠에 걸쳐 새 사료 비율을 조금씩 늘리되, 기존 질환이나 처방식이 있다면 먼저 수의사의 지침을 따르세요. 설사나 구토가 반복되면 전환을 중단하고 상담하는 것이 좋아요.", en: "Increase the proportion of new food over several days, follow veterinary guidance for prescription diets, and seek advice if vomiting or diarrhea persists." } },
  { id: "t208", category: "training", featured: true,
    title: { ko: "짧고 자주 하는 훈련이 집중을 유지하기 쉬워요", en: "Keep training sessions short and frequent" },
    summary: { ko: "한 번에 오래 반복하기보다 짧은 성공 경험을 여러 번 만드는 방식이 집중과 학습 유지에 도움이 될 수 있어요.", en: "Brief, successful training sessions can help maintain attention and learning." },
    body: { ko: "쉬운 행동부터 시작해 성공 즉시 보상하고, 집중이 떨어지기 전에 마무리해 주세요. 실수가 늘어나면 난도를 낮추고 다시 성공할 수 있는 단계로 돌아가는 것이 좋아요.", en: "Start with easy behaviors, reward promptly, finish before attention fades, and lower the difficulty if mistakes increase." } },
  { id: "t209", category: "safety", featured: true,
    title: { ko: "현관문과 창문 방충망의 잠금 상태를 점검해요", en: "Check doors, windows, and screens for escape risks" },
    summary: { ko: "현관문이나 느슨한 방충망은 반려동물의 예상치 못한 이탈로 이어질 수 있어 정기적인 점검이 필요해요.", en: "Loose screens or unsecured doors can create unexpected escape routes for pets." },
    body: { ko: "방충망이 밀리지 않는지, 창문 잠금장치가 제대로 작동하는지, 현관문을 열 때 반려동물이 바로 접근할 수 없는지 확인해 주세요. 방문객이 많은 날에는 별도 안전공간을 활용하는 것도 좋아요.", en: "Test screens and locks, manage access to entry doors, and consider a separate safe area when many visitors are coming and going." } },
  { id: "t210", category: "grooming", featured: true,
    title: { ko: "빗질 도구는 털 길이와 피부 상태에 맞춰 선택해요", en: "Match grooming tools to coat and skin condition" },
    summary: { ko: "모든 빗이 모든 털에 맞는 것은 아니어서 털 길이와 엉킴 정도에 맞는 도구를 쓰는 편이 안전해요.", en: "Different coat types need different grooming tools, and the right match can reduce pulling and irritation." },
    body: { ko: "처음에는 힘을 주지 말고 작은 부위부터 반응을 확인하세요. 피부가 붉어지거나 통증을 보이면 중단하고, 심한 엉킴이나 피부 문제가 있으면 전문 미용사나 동물병원에 상담하세요.", en: "Start gently on a small area, stop if the skin reddens or your pet shows pain, and seek professional help for severe mats or skin problems." } },
`;

const parsed = [...additions.matchAll(/id: "(t\d+)", category: "([a-z]+)"[\s\S]*?title: \{ ko: "([^"]+)"/g)]
  .map((m) => ({ id: m[1], category: m[2], title: m[3] }));
if (parsed.length !== 8) throw new Error(`Expected 8 PetInfo items, got ${parsed.length}`);
const categories = ['dog', 'cat', 'health', 'life', 'food', 'training', 'safety', 'grooming'];
for (const category of categories) {
  const count = parsed.filter((x) => x.category === category).length;
  if (count !== 1) throw new Error(`Expected 1 item for ${category}, got ${count}`);
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
console.log(`Added ${parsed.length} PetInfo items for 2026-08-20: ${categories.map((c) => `${c}=1`).join(', ')}`);
